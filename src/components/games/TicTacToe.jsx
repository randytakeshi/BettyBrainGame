import React, { useState, useEffect } from 'react';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function TicTacToe({ level = 1, onComplete, onBack }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState(null); // 'X', 'O', 'Draw'
  const [winningLine, setWinningLine] = useState([]);

  useEffect(() => {
    // Reset game
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setWinningLine([]);
  }, [level]);

  const checkWinner = (squares) => {
    for (let i = 0; i < WIN_LINES.length; i++) {
      const [a, b, c] = WIN_LINES[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    if (!squares.includes(null)) return { winner: 'Draw', line: [] };
    return null;
  };

  const handleCellClick = (index) => {
    if (board[index] || winner || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsPlayerTurn(false);

    const result = checkWinner(newBoard);
    if (result) {
      handleGameOver(result);
    }
  };

  const computerMove = () => {
    if (winner) return;

    let move = -1;

    // 1. Can computer win?
    for (let i = 0; i < WIN_LINES.length; i++) {
      const [a, b, c] = WIN_LINES[i];
      if (board[a] === 'O' && board[b] === 'O' && board[c] === null) move = c;
      if (board[a] === 'O' && board[c] === 'O' && board[b] === null) move = b;
      if (board[b] === 'O' && board[c] === 'O' && board[a] === null) move = a;
    }

    // 2. Can computer block player? (50% chance to miss block to make it easy)
    if (move === -1 && Math.random() > 0.5) {
      for (let i = 0; i < WIN_LINES.length; i++) {
        const [a, b, c] = WIN_LINES[i];
        if (board[a] === 'X' && board[b] === 'X' && board[c] === null) move = c;
        if (board[a] === 'X' && board[c] === 'X' && board[b] === null) move = b;
        if (board[b] === 'X' && board[c] === 'X' && board[a] === null) move = a;
      }
    }

    // 3. Random empty spot
    if (move === -1) {
      const emptySpots = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
      if (emptySpots.length > 0) {
        move = emptySpots[Math.floor(Math.random() * emptySpots.length)];
      }
    }

    if (move !== -1) {
      const newBoard = [...board];
      newBoard[move] = 'O';
      setBoard(newBoard);
      
      const result = checkWinner(newBoard);
      if (result) {
        handleGameOver(result);
      } else {
        setIsPlayerTurn(true);
      }
    }
  };

  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(computerMove, 1000); // 1 sec delay for realism
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, board, winner]);

  const handleGameOver = (result) => {
    setWinner(result.winner);
    setWinningLine(result.line);
    
    setTimeout(() => {
      if (onComplete) {
        // Win = 100, Draw = 50, Lose = 0
        const score = result.winner === 'X' ? 100 : result.winner === 'Draw' ? 50 : 0;
        onComplete({ score, isPerfect: result.winner === 'X' });
      }
    }, 2000);
  };

  return (
    <div className="game-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level}
        </div>
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-xs)', textAlign: 'center' }}>
        Tic-Tac-Toe
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
        You are 'X'. Can you beat Betty Bot?
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        width: '100%',
        maxWidth: '350px',
        margin: '0 auto',
        backgroundColor: '#222',
        padding: '8px',
        borderRadius: 'var(--radius-lg)'
      }}>
        {board.map((cell, index) => {
          const isWinningCell = winningLine.includes(index);
          return (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={cell !== null || winner !== null || !isPlayerTurn}
              style={{
                aspectRatio: '1',
                backgroundColor: isWinningCell ? 'var(--accent-success)' : 'var(--surface-color)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '4rem',
                fontWeight: 'bold',
                color: cell === 'X' ? '#00E5FF' : cell === 'O' ? '#FF1744' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (cell || winner || !isPlayerTurn) ? 'default' : 'pointer',
                transition: 'background-color 0.3s'
              }}
            >
              {cell}
            </button>
          )
        })}
      </div>
      
      <div style={{
        marginTop: 'var(--spacing-xl)',
        height: '3rem',
        color: winner === 'X' ? 'var(--accent-success)' : winner === 'O' ? 'var(--accent-error)' : 'var(--text-secondary)',
        fontSize: '2rem',
        fontWeight: 'bold',
        textAlign: 'center',
        animation: winner === 'X' ? 'pulse 2s infinite' : 'none'
      }}>
        {!winner && !isPlayerTurn && "Betty Bot is thinking..."}
        {winner === 'X' && '🌟 You Win! 🌟'}
        {winner === 'O' && 'Betty Bot Wins!'}
        {winner === 'Draw' && "It's a Draw!"}
      </div>
    </div>
  );
}
