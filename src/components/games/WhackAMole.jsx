import React, { useState, useEffect, useRef } from 'react';

const GRID_SIZE = 9;
const WIN_SCORE = 10;

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

export function WhackAMole({ level = 1, onComplete, onBack }) {
  const [activeMole, setActiveMole] = useState(null);
  const [score, setScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  // Calculate speed: mole stays up for 2s (2000ms) at level 1, gets slightly faster
  const baseSpeed = Math.max(800, 2000 - ((level - 1) * 200));
  const [delay, setDelay] = useState(null);

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setHasStarted(true);
    setActiveMole(Math.floor(Math.random() * GRID_SIZE));
    setDelay(baseSpeed);
  };

  useInterval(() => {
    if (gameOver) return;
    
    // Pick a new random hole that isn't the current one
    let nextMole;
    do {
      nextMole = Math.floor(Math.random() * GRID_SIZE);
    } while (nextMole === activeMole);
    
    setActiveMole(nextMole);
  }, delay);

  const handleWhack = (index) => {
    if (gameOver) return;
    
    if (index === activeMole) {
      const newScore = score + 1;
      setScore(newScore);
      setActiveMole(null); // Hide mole immediately
      
      if (newScore >= WIN_SCORE) {
        setGameOver(true);
        setDelay(null);
        setTimeout(() => {
          if (onComplete) onComplete({ score: 100, isPerfect: true });
        }, 1500);
      }
    }
  };

  return (
    <div className="game-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level} | Score: {score}/{WIN_SCORE}
        </div>
      </div>

      {!hasStarted ? (
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Whack-A-Mole</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', fontSize: '1.2rem' }}>
            Tap the mole as soon as it pops up!
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
        <>
          <h2 style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
            {gameOver ? '🌟 You Win! 🌟' : 'Whack it!'}
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--spacing-md)',
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            backgroundColor: '#3b2511', // Dirt color
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-lg)'
          }}>
            {Array.from({ length: GRID_SIZE }).map((_, index) => {
              const isMole = index === activeMole;
              return (
                <button
                  key={index}
                  onClick={() => handleWhack(index)}
                  disabled={gameOver}
                  style={{
                    aspectRatio: '1',
                    backgroundColor: '#1c1006', // Deep hole color
                    border: '4px solid #4a3018',
                    borderRadius: '50%',
                    fontSize: '4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isMole ? 'pointer' : 'default',
                    transition: 'transform 0.1s',
                    transform: isMole ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.8)'
                  }}
                >
                  {isMole ? '🐹' : ''}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
