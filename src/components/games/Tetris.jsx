import React, { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 10;
const ROWS = 20;

const COLORS = [
  'transparent',
  '#00FFFF', // I - Cyan
  '#0000FF', // J - Blue
  '#FFA500', // L - Orange
  '#FFFF00', // O - Yellow
  '#00FF00', // S - Green
  '#800080', // T - Purple
  '#FF0000', // Z - Red
];

const TETROMINOES = {
  0: { shape: [[0]], color: 0 },
  I: { shape: [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]], color: 1 },
  J: { shape: [[0, 2, 0], [0, 2, 0], [2, 2, 0]], color: 2 },
  L: { shape: [[0, 3, 0], [0, 3, 0], [0, 3, 3]], color: 3 },
  O: { shape: [[4, 4], [4, 4]], color: 4 },
  S: { shape: [[0, 5, 5], [5, 5, 0], [0, 0, 0]], color: 5 },
  T: { shape: [[0, 0, 0], [6, 6, 6], [0, 6, 0]], color: 6 },
  Z: { shape: [[7, 7, 0], [0, 7, 7], [0, 0, 0]], color: 7 }
};

const randomTetromino = () => {
  const tetrominos = 'IJLOSTZ';
  const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
  return TETROMINOES[randTetromino];
};

const createBoard = () => Array.from(Array(ROWS), () => new Array(COLS).fill(0));

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

// Custom hook for intervals
function useInterval(callback, delay) {
  const savedCallback = useRef();
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export function Tetris({ level = 1, onComplete, onBack }) {
  const [board, setBoard] = useState(createBoard());
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOES[0].shape,
    collided: false
  });
  const [gameOver, setGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  
  // Calculate speed: very slow base, slightly faster per level. Base: 1200ms
  const baseSpeed = Math.max(500, 1200 - ((level - 1) * 100));
  const [dropTime, setDropTime] = useState(null);

  const resetPlayer = useCallback(() => {
    setPlayer({
      pos: { x: COLS / 2 - 2, y: 0 },
      tetromino: randomTetromino().shape,
      collided: false,
    });
  }, []);

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
      setScore(prev => prev + (linesCleared * 100));
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
    if (!checkCollision(player, board, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      if (player.pos.y < 1) {
        setGameOver(true);
        setDropTime(null);
        setTimeout(() => {
          if (onComplete) onComplete({ score: Math.min(score, 100), isPerfect: false });
        }, 3000);
        return;
      }
      
      // Update board with fallen piece
      const newBoard = board.map(row => [...row]);
      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            newBoard[y + player.pos.y][x + player.pos.x] = value;
          }
        });
      });
      
      setBoard(sweepRows(newBoard));
      resetPlayer();
    }
  };

  const movePlayer = (dir) => {
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
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino = playerRotate(clonedPlayer.tetromino, 1);

    const pos = clonedPlayer.pos.x;
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

  useInterval(() => {
    drop();
  }, dropTime);

  const startGame = () => {
    setBoard(createBoard());
    setDropTime(baseSpeed);
    resetPlayer();
    setGameOver(false);
    setHasStarted(true);
    setScore(0);
    setLines(0);
  };

  // Combine board and player for rendering
  const displayBoard = board.map(row => [...row]);
  if (!gameOver && hasStarted) {
    player.tetromino.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          if (displayBoard[y + player.pos.y]) {
            displayBoard[y + player.pos.y][x + player.pos.x] = value;
          }
        }
      });
    });
  }

  // Auto end game after 10 lines as a "Win" condition for the daily workout
  useEffect(() => {
    if (lines >= 5 && !gameOver) { // Reduced to 5 lines for a quicker workout
      setGameOver(true);
      setDropTime(null);
      setTimeout(() => {
        if (onComplete) onComplete({ score: 100, isPerfect: true });
      }, 2000);
    }
  }, [lines, gameOver, onComplete]);

  return (
    <div className="game-view" style={{ paddingBottom: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-sm)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level} | Lines: {lines}/5
        </div>
      </div>

      {!hasStarted ? (
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Betty Blocks</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', fontSize: '1.2rem' }}>
            A relaxing puzzle game. Fill a complete horizontal line to clear it!
          </p>
          <button 
            className="primary" 
            style={{ fontSize: '2rem', padding: 'var(--spacing-lg) var(--spacing-xl)' }}
            onClick={startGame}
          >
            Start Game
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', width: '100%' }}>
          
          <div style={{
            display: 'grid',
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gap: '1px',
            backgroundColor: '#222',
            border: '4px solid #444',
            width: '100%',
            maxWidth: '350px',
            aspectRatio: '10 / 20',
            marginBottom: 'var(--spacing-md)'
          }}>
            {displayBoard.map((row, y) => 
              row.map((cell, x) => (
                <div key={`${y}-${x}`} style={{
                  backgroundColor: cell === 0 ? '#111' : COLORS[cell],
                  border: cell === 0 ? 'none' : '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '2px'
                }} />
              ))
            )}
            
            {gameOver && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 'var(--spacing-lg)',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: '2rem',
                textAlign: 'center',
                zIndex: 10
              }}>
                {lines >= 5 ? '🌟 You Win! 🌟' : 'Game Over'}
              </div>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--spacing-sm)',
            width: '100%',
            maxWidth: '500px',
            padding: 'var(--spacing-sm)'
          }}>
            <button 
              onClick={() => movePlayer(-1)} 
              disabled={gameOver}
              style={{ fontSize: '3rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', height: '100px' }}
            >
              ⬅️
            </button>
            <button 
              onClick={rotate} 
              disabled={gameOver}
              style={{ fontSize: '3rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', height: '100px' }}
            >
              🔄
            </button>
            <button 
              onClick={() => movePlayer(1)} 
              disabled={gameOver}
              style={{ fontSize: '3rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', height: '100px' }}
            >
              ➡️
            </button>
            <button 
              onClick={drop} 
              disabled={gameOver}
              style={{ fontSize: '3rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-highlight)', height: '100px' }}
            >
              ⬇️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
