import React, { useState, useEffect } from 'react';

const GRID_SIZE = 5;
const NUM_MINES = 3;

const generateBoard = () => {
  let board = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill({ isMine: false, neighborMines: 0 }));
  
  // Place mines
  let minesPlaced = 0;
  while (minesPlaced < NUM_MINES) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (!board[y][x].isMine) {
      board[y][x] = { ...board[y][x], isMine: true };
      minesPlaced++;
    }
  }

  // Calculate neighbors
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!board[y][x].isMine) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE) {
              if (board[ny][nx].isMine) count++;
            }
          }
        }
        board[y][x] = { ...board[y][x], neighborMines: count };
      }
    }
  }

  return board;
};

export function Minesweeper({ level = 1, onComplete, onBack }) {
  const [board, setBoard] = useState([]);
  const [revealed, setRevealed] = useState(new Set());
  const [gameOver, setGameOver] = useState(false);
  
  useEffect(() => {
    setBoard(generateBoard());
    setRevealed(new Set());
    setGameOver(false);
  }, [level]);

  const revealCell = (x, y, currentRevealed) => {
    const key = `${x},${y}`;
    if (currentRevealed.has(key)) return currentRevealed;
    
    currentRevealed.add(key);

    if (board[y][x].neighborMines === 0 && !board[y][x].isMine) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE) {
            revealCell(nx, ny, currentRevealed);
          }
        }
      }
    }
    return currentRevealed;
  };

  const handleCellClick = (x, y) => {
    if (gameOver) return;
    const key = `${x},${y}`;
    if (revealed.has(key)) return;

    if (board[y][x].isMine) {
      // Lose
      const allRevealed = new Set(revealed);
      allRevealed.add(key);
      setRevealed(allRevealed);
      setGameOver('lose');
      setTimeout(() => {
        if (onComplete) onComplete({ score: 0, isPerfect: false });
      }, 2000);
      return;
    }

    const newRevealed = revealCell(x, y, new Set(revealed));
    setRevealed(newRevealed);

    // Check Win
    if (newRevealed.size === (GRID_SIZE * GRID_SIZE) - NUM_MINES) {
      setGameOver('win');
      setTimeout(() => {
        if (onComplete) onComplete({ score: 100, isPerfect: true });
      }, 2000);
    }
  };

  const getNumberColor = (num) => {
    switch(num) {
      case 1: return '#00E5FF';
      case 2: return '#00E676';
      case 3: return '#FFEA00';
      case 4: return '#FF1744';
      default: return 'var(--text-primary)';
    }
  };

  return (
    <div className="game-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level} | Mines: {NUM_MINES}
        </div>
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-xs)', textAlign: 'center' }}>
        Betty Minesweeper
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
        Tap to reveal safe spots!
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gap: '4px',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        backgroundColor: '#222',
        padding: '4px',
        borderRadius: 'var(--radius-md)'
      }}>
        {board.map((row, y) => 
          row.map((cell, x) => {
            const isRevealed = revealed.has(`${x},${y}`);
            return (
              <button
                key={`${x}-${y}`}
                onClick={() => handleCellClick(x, y)}
                disabled={gameOver || isRevealed}
                style={{
                  aspectRatio: '1',
                  backgroundColor: isRevealed ? 'var(--bg-color)' : 'var(--surface-color)',
                  border: isRevealed ? '1px solid #333' : '2px solid #555',
                  borderRadius: '4px',
                  fontSize: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isRevealed ? 'default' : 'pointer',
                  padding: 0
                }}
              >
                {isRevealed && cell.isMine ? '💣' : ''}
                {isRevealed && !cell.isMine && cell.neighborMines > 0 ? (
                  <span style={{ color: getNumberColor(cell.neighborMines), fontWeight: 'bold' }}>
                    {cell.neighborMines}
                  </span>
                ) : ''}
              </button>
            )
          })
        )}
      </div>
      
      {gameOver && (
        <div style={{
          marginTop: 'var(--spacing-xl)',
          color: gameOver === 'win' ? 'var(--accent-success)' : 'var(--accent-error)',
          fontSize: '2rem',
          fontWeight: 'bold',
          textAlign: 'center',
          animation: gameOver === 'win' ? 'pulse 2s infinite' : 'none'
        }}>
          {gameOver === 'win' ? '🌟 Safe! 🌟' : 'Boom! Game Over'}
        </div>
      )}
    </div>
  );
}
