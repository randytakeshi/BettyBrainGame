import React, { useState, useEffect } from 'react';
import { GameShell, GameHUD } from '../GameShell';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6],            // Diagonals
];

const TOTAL_ROUNDS = 3;

function checkWinner(squares) {
  for (let i = 0; i < WIN_LINES.length; i++) {
    const [a, b, c] = WIN_LINES[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  if (!squares.includes(null)) return { winner: 'Draw', line: [] };
  return null;
}

function findLineMove(board, mark) {
  for (let i = 0; i < WIN_LINES.length; i++) {
    const [a, b, c] = WIN_LINES[i];
    if (board[a] === mark && board[b] === mark && board[c] === null) return c;
    if (board[a] === mark && board[c] === mark && board[b] === null) return b;
    if (board[b] === mark && board[c] === mark && board[a] === null) return a;
  }
  return -1;
}

function Playfield({ level, finishGame }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [roundWinner, setRoundWinner] = useState(null); // 'X', 'O', 'Draw'
  const [winningLine, setWinningLine] = useState([]);
  const [round, setRound] = useState(1);
  const [wins, setWins] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  const handleGameOver = (result) => {
    const roundPoints = result.winner === 'X' ? 300 : result.winner === 'Draw' ? 150 : 0;
    const newScore = totalScore + roundPoints;
    const newWins = wins + (result.winner === 'X' ? 1 : 0);
    setRoundWinner(result.winner);
    setWinningLine(result.line);
    setTotalScore(newScore);
    setWins(newWins);

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        finishGame({ score: newScore, correct: newWins, total: TOTAL_ROUNDS, isPerfect: newWins >= 2 });
      } else {
        setBoard(Array(9).fill(null));
        setRoundWinner(null);
        setWinningLine([]);
        setIsPlayerTurn(true);
        setRound(round + 1);
      }
    }, 2000);
  };

  const handleCellClick = (index) => {
    if (board[index] || roundWinner || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) handleGameOver(result);
    else setIsPlayerTurn(false);
  };

  useEffect(() => {
    if (isPlayerTurn || roundWinner) return;

    const timer = setTimeout(() => {
      // 1. Can Betty Bot win right now?
      let move = findLineMove(board, 'O');

      // 2. Block the player. At levels 4-5 the bot always blocks;
      //    below that it misses half the time to stay beatable.
      if (move === -1 && (level >= 4 || Math.random() > 0.5)) {
        move = findLineMove(board, 'X');
      }

      // 3. Otherwise pick a random empty spot.
      if (move === -1) {
        const emptySpots = board.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null);
        if (emptySpots.length > 0) {
          move = emptySpots[Math.floor(Math.random() * emptySpots.length)];
        }
      }

      if (move === -1) return;
      const newBoard = [...board];
      newBoard[move] = 'O';
      setBoard(newBoard);

      const result = checkWinner(newBoard);
      if (result) handleGameOver(result);
      else setIsPlayerTurn(true);
    }, 1000); // a moment of "thinking" for realism

    return () => clearTimeout(timer);
  }, [isPlayerTurn, board, roundWinner]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <GameHUD
        trial={round}
        totalTrials={TOTAL_ROUNDS}
        score={totalScore}
        extra={
          <div className="hud-item">
            <span className="hud-label">Rounds Won</span>
            <span className="hud-value">{wins}</span>
          </div>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Round {round} of {TOTAL_ROUNDS} — you are <span style={{ color: 'var(--cat-attention)' }}>X</span>.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        backgroundColor: 'var(--surface-highlight)',
        padding: 8,
        borderRadius: 'var(--radius-lg)',
      }}>
        {board.map((cell, index) => {
          const isWinningCell = winningLine.includes(index);
          return (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={cell !== null || roundWinner !== null || !isPlayerTurn}
              style={{
                aspectRatio: '1',
                minWidth: 0,
                minHeight: 110,
                padding: 0,
                backgroundColor: isWinningCell ? 'var(--success-soft)' : 'var(--surface-color)',
                border: isWinningCell ? '4px solid var(--success)' : '2px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '2.6rem',
                fontWeight: 700,
                color: cell === 'X' ? 'var(--cat-attention)' : cell === 'O' ? 'var(--cat-memory)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (cell || roundWinner || !isPlayerTurn) ? 'default' : 'pointer',
                transition: 'background-color 0.3s',
                opacity: 1, // keep played marks fully readable while "disabled"
              }}
            >
              {cell}
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: 'var(--spacing-md)',
        minHeight: '2.4rem',
        color: roundWinner === 'X' ? 'var(--success)' : roundWinner === 'O' ? 'var(--error)' : 'var(--text-secondary)',
        fontSize: '1.3rem',
        fontWeight: 700,
        textAlign: 'center',
        animation: roundWinner === 'X' ? 'pulse 2s infinite' : 'none',
      }}>
        {!roundWinner && !isPlayerTurn && 'Betty Bot is thinking...'}
        {!roundWinner && isPlayerTurn && 'Your move!'}
        {roundWinner === 'X' && '🌟 You won this round! +300 points'}
        {roundWinner === 'O' && 'Betty Bot took that one.'}
        {roundWinner === 'Draw' && "It's a draw! +150 points"}
      </div>
    </>
  );
}

export function TicTacToe({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Tic-Tac-Toe"
      icon="❌"
      category="logic"
      level={level}
      instructions={[
        { icon: '❌', text: "You are X, Betty Bot is O. Best of 3 rounds!" },
        { icon: '👆', text: 'Tap a square to place your X. Three in a row wins the round.' },
        { icon: '🏆', text: 'A round win is 300 points, a draw is 150. Win 2 rounds for a perfect game!' },
      ]}
      tip="Grabbing the center square first gives you the most ways to win."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}
