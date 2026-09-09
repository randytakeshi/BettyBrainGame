import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameShell, GameHUD } from '../GameShell';

const COLS = 10;
const ROWS = 20;
const WIN_LINES = 5;
const POINTS_PER_LINE = 200;
const WIN_BONUS = 100;

// Dark saturated hues that stay readable on the light board.
const COLORS = [
  'transparent',
  '#0E7490', // I - Teal
  '#1D4ED8', // J - Blue
  '#EA580C', // L - Orange
  '#B45309', // O - Amber
  '#15803D', // S - Green
  '#7C3AED', // T - Purple
  '#DC2626', // Z - Red
];

const TETROMINOES = {
  I: { shape: [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]] },
  J: { shape: [[0, 2, 0], [0, 2, 0], [2, 2, 0]] },
  L: { shape: [[0, 3, 0], [0, 3, 0], [0, 3, 3]] },
  O: { shape: [[4, 4], [4, 4]] },
  S: { shape: [[0, 5, 5], [5, 5, 0], [0, 0, 0]] },
  T: { shape: [[0, 0, 0], [6, 6, 6], [0, 6, 0]] },
  Z: { shape: [[7, 7, 0], [0, 7, 7], [0, 0, 0]] },
};

const randomTetromino = () => {
  const keys = 'IJLOSTZ';
  return TETROMINOES[keys[Math.floor(Math.random() * keys.length)]];
};

const createBoard = () => Array.from(Array(ROWS), () => new Array(COLS).fill(0));

const makePlayer = () => ({
  pos: { x: COLS / 2 - 2, y: 0 },
  tetromino: randomTetromino().shape,
  collided: false,
});

const checkCollision = (player, board, { x: moveX, y: moveY }) => {
  for (let y = 0; y < player.tetromino.length; y += 1) {
    for (let x = 0; x < player.tetromino[y].length; x += 1) {
      if (player.tetromino[y][x] !== 0) {
        if (
          board[y + player.pos.y + moveY] === undefined ||
          board[y + player.pos.y + moveY][x + player.pos.x + moveX] === undefined ||
          board[y + player.pos.y + moveY][x + player.pos.x + moveX] !== 0
        ) {
          return true;
        }
      }
    }
  }
  return false;
};

/** setInterval as a hook — callback always sees the latest render. */
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function Playfield({ level, finishGame }) {
  const [board, setBoard] = useState(createBoard);
  const [player, setPlayer] = useState(makePlayer);
  const [gameOver, setGameOver] = useState(null); // null | 'win' | 'lose'
  const [lines, setLines] = useState(0);
  const endTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(endTimeoutRef.current), []);

  // Slow gravity: 1000ms per row at level 1, down to 550ms at level 5.
  const dropTime = Math.round(1000 - (Math.min(level, 5) - 1) * 112.5);

  const sweepRows = useCallback((newBoard) => {
    let linesCleared = 0;
    const sweptBoard = newBoard.reduce((ack, row) => {
      if (row.findIndex(cell => cell === 0) === -1) {
        linesCleared += 1;
        ack.unshift(new Array(COLS).fill(0));
        return ack;
      }
      ack.push(row);
      return ack;
    }, []);

    if (linesCleared > 0) {
      setLines(prev => prev + linesCleared);
    }
    return sweptBoard;
  }, []);

  const updatePlayerPos = ({ x, y, collided }) => {
    setPlayer(prev => ({
      ...prev,
      pos: { x: prev.pos.x + x, y: prev.pos.y + y },
      collided,
    }));
  };

  const drop = () => {
    if (gameOver) return;

    if (!checkCollision(player, board, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
      return;
    }

    if (player.pos.y < 1) {
      // Stack reached the top — partial credit for every line cleared.
      setGameOver('lose');
      endTimeoutRef.current = setTimeout(() => {
        finishGame({
          score: lines * POINTS_PER_LINE,
          correct: lines,
          total: WIN_LINES,
          isPerfect: false,
        });
      }, 2200);
      return;
    }

    // Lock the fallen piece into the board.
    const newBoard = board.map(row => [...row]);
    player.tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          newBoard[y + player.pos.y][x + player.pos.x] = value;
        }
      });
    });

    setBoard(sweepRows(newBoard));
    setPlayer(makePlayer());
  };

  const movePlayer = (dir) => {
    if (gameOver) return;
    if (!checkCollision(player, board, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0 });
    }
  };

  const playerRotate = (matrix, dir) => {
    const rotatedTetro = matrix.map((_, index) => matrix.map(col => col[index]));
    if (dir > 0) return rotatedTetro.map(row => row.reverse());
    return rotatedTetro.reverse();
  };

  const rotate = () => {
    if (gameOver) return;
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino = playerRotate(clonedPlayer.tetromino, 1);

    let offset = 1;
    while (checkCollision(clonedPlayer, board, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino[0].length) {
        // Rotate failed (e.g. against a wall)
        return;
      }
    }
    setPlayer(clonedPlayer);
  };

  useInterval(drop, gameOver ? null : dropTime);

  // Win after clearing 5 lines — a satisfying, quick workout.
  useEffect(() => {
    if (lines >= WIN_LINES && !gameOver) {
      setGameOver('win');
      endTimeoutRef.current = setTimeout(() => {
        finishGame({
          score: lines * POINTS_PER_LINE + WIN_BONUS,
          correct: WIN_LINES,
          total: WIN_LINES,
          isPerfect: true,
        });
      }, 2200);
    }
  }, [lines, gameOver, finishGame]);

  // Combine board and player for rendering
  const displayBoard = board.map(row => [...row]);
  if (!gameOver) {
    player.tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0 && displayBoard[y + player.pos.y]) {
          displayBoard[y + player.pos.y][x + player.pos.x] = value;
        }
      });
    });
  }

  return (
    <>
      <GameHUD
        score={lines * POINTS_PER_LINE}
        extra={
          <div className="hud-item">
            <span className="hud-label">Lines</span>
            <span className="hud-value">{lines} of {WIN_LINES}</span>
          </div>
        }
      />

      <div style={{
        position: 'relative', // keeps the game-over card centered inside the board
        display: 'grid',
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gap: '1px',
        backgroundColor: 'var(--border-color)',
        border: '4px solid var(--border-strong)',
        borderRadius: 'var(--radius-sm)',
        width: '100%',
        maxWidth: 380,
        aspectRatio: '10 / 20',
        marginBottom: 'var(--spacing-md)',
      }}>
        {displayBoard.map((row, y) =>
          row.map((cell, x) => (
            <div key={`${y}-${x}`} style={{
              backgroundColor: cell === 0 ? 'var(--surface-alt)' : COLORS[cell],
              border: cell === 0 ? 'none' : '2px solid rgba(255,255,255,0.35)',
              borderRadius: '2px',
            }} />
          ))
        )}

        {gameOver && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--surface-color)',
            border: '3px solid var(--border-strong)',
            boxShadow: 'var(--shadow-lg)',
            padding: 'var(--spacing-lg)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
            fontWeight: 700,
            textAlign: 'center',
            zIndex: 10,
            width: '85%',
          }}>
            {gameOver === 'win' ? '🌟 5 lines — you win!' : 'The blocks reached the top'}
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 'var(--spacing-sm)',
        width: '100%',
        maxWidth: 500,
      }}>
        <button
          onClick={() => movePlayer(-1)}
          disabled={!!gameOver}
          aria-label="Move left"
          style={{ fontSize: '2rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-strong)', height: 96 }}
        >
          ⬅️
        </button>
        <button
          onClick={rotate}
          disabled={!!gameOver}
          aria-label="Rotate"
          style={{ fontSize: '2rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-strong)', height: 96 }}
        >
          🔄
        </button>
        <button
          onClick={() => movePlayer(1)}
          disabled={!!gameOver}
          aria-label="Move right"
          style={{ fontSize: '2rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', border: '2px solid var(--border-strong)', height: 96 }}
        >
          ➡️
        </button>
        <button
          onClick={drop}
          disabled={!!gameOver}
          aria-label="Drop faster"
          style={{ fontSize: '2rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-highlight)', border: '2px solid var(--border-strong)', height: 96 }}
        >
          ⬇️
        </button>
      </div>
    </>
  );
}

export function Tetris({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Betty Blocks"
      icon="🧱"
      category="logic"
      level={level}
      instructions={[
        { icon: '🧱', text: 'Colored blocks drift down slowly. Slide and rotate them with the big buttons.' },
        { icon: '📏', text: 'Fill a complete row from wall to wall to clear it.' },
        { icon: '🏆', text: 'Clear 5 rows to win. No rush — the blocks fall gently.' },
      ]}
      tip="Keep the stack flat and save a straight column for the long piece."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}
