import React, { useState, useEffect, useRef, useCallback } from 'react';

const GRID_SIZE = 10;
const WIN_SCORE = 5;

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

const generateFood = (snake) => {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    // Ensure food doesn't spawn on snake
    if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export function Snake({ level = 1, onComplete, onBack }) {
  const [snake, setSnake] = useState([{ x: 2, y: 5 }, { x: 1, y: 5 }]);
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [food, setFood] = useState({ x: 7, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [score, setScore] = useState(0);
  
  // Calculate speed: very slow base, slightly faster per level. Base: 800ms
  const baseSpeed = Math.max(300, 800 - ((level - 1) * 100));
  const [delay, setDelay] = useState(null);

  const startGame = () => {
    setSnake([{ x: 2, y: 5 }, { x: 1, y: 5 }]);
    setDirection({ x: 1, y: 0 });
    setFood({ x: 7, y: 5 });
    setScore(0);
    setGameOver(false);
    setHasStarted(true);
    setDelay(baseSpeed);
  };

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { x: head.x + direction.x, y: head.y + direction.y };

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver('lose');
        setDelay(null);
        setTimeout(() => {
          if (onComplete) onComplete({ score: Math.min((score / WIN_SCORE) * 100, 100), isPerfect: false });
        }, 2000);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver('lose');
        setDelay(null);
        setTimeout(() => {
          if (onComplete) onComplete({ score: Math.min((score / WIN_SCORE) * 100, 100), isPerfect: false });
        }, 2000);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        const newScore = score + 1;
        setScore(newScore);
        if (newScore >= WIN_SCORE) {
          setGameOver('win');
          setDelay(null);
          setTimeout(() => {
            if (onComplete) onComplete({ score: 100, isPerfect: true });
          }, 2000);
        } else {
          setFood(generateFood(newSnake));
        }
      } else {
        newSnake.pop(); // Remove tail if no food eaten
      }

      return newSnake;
    });
  }, [direction, food, gameOver, score, onComplete]);

  useInterval(moveSnake, delay);

  const changeDirection = (newDir) => {
    // Prevent 180 degree turns
    if (
      (newDir.x === 1 && direction.x === -1) ||
      (newDir.x === -1 && direction.x === 1) ||
      (newDir.y === 1 && direction.y === -1) ||
      (newDir.y === -1 && direction.y === 1)
    ) {
      return;
    }
    setDirection(newDir);
  };

  return (
    <div className="game-view" style={{ paddingBottom: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-sm)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level} | Apples: {score}/{WIN_SCORE}
        </div>
      </div>

      {!hasStarted ? (
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Betty Snake</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', fontSize: '1.2rem' }}>
            Guide the snake to eat the apples. Don't hit the walls or yourself!
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
            position: 'relative',
            display: 'grid',
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gap: '2px',
            backgroundColor: '#222',
            border: '4px solid #444',
            width: '100%',
            maxWidth: '350px',
            aspectRatio: '1',
            marginBottom: 'var(--spacing-md)'
          }}>
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              
              const isSnake = snake.some(s => s.x === x && s.y === y);
              const isHead = snake[0].x === x && snake[0].y === y;
              const isFood = food.x === x && food.y === y;

              return (
                <div key={i} style={{
                  backgroundColor: isHead ? '#00E676' : isSnake ? '#00B0FF' : isFood ? 'transparent' : '#111',
                  borderRadius: isSnake ? '4px' : '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem'
                }}>
                  {isFood ? '🍎' : ''}
                </div>
              );
            })}
            
            {gameOver && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0,0,0,0.9)',
                padding: 'var(--spacing-lg)',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontSize: '2rem',
                textAlign: 'center',
                zIndex: 10,
                width: '80%'
              }}>
                {gameOver === 'win' ? '🌟 You Win! 🌟' : 'Game Over'}
              </div>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: 'var(--spacing-sm)',
            width: '100%',
            maxWidth: '400px',
            padding: 'var(--spacing-sm)'
          }}>
            <div />
            <button 
              onClick={() => changeDirection({ x: 0, y: -1 })} 
              disabled={gameOver}
              style={{ fontSize: '3rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', height: '90px' }}
            >
              ⬆️
            </button>
            <div />
            <button 
              onClick={() => changeDirection({ x: -1, y: 0 })} 
              disabled={gameOver}
              style={{ fontSize: '3rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', height: '90px' }}
            >
              ⬅️
            </button>
            <button 
              onClick={() => changeDirection({ x: 0, y: 1 })} 
              disabled={gameOver}
              style={{ fontSize: '3rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', height: '90px' }}
            >
              ⬇️
            </button>
            <button 
              onClick={() => changeDirection({ x: 1, y: 0 })} 
              disabled={gameOver}
              style={{ fontSize: '3rem', padding: 'var(--spacing-sm)', backgroundColor: 'var(--surface-color)', height: '90px' }}
            >
              ➡️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
