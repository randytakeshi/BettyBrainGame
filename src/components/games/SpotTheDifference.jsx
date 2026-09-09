import React, { useState, useEffect } from 'react';

const EMOJI_SETS = [
  ['🍎', '🍏'], // Apples
  ['🚗', '🚙'], // Cars
  ['🐶', '🐱'], // Pets
  ['☀️', '🌤️'], // Sun
  ['🌸', '🌺'], // Flowers
  ['🍔', '🥪'], // Food
];

export function SpotTheDifference({ level = 1, onComplete, onBack }) {
  const [gridA, setGridA] = useState([]);
  const [gridB, setGridB] = useState([]);
  const [diffIndex, setDiffIndex] = useState(-1);
  const [gameOver, setGameOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const generateGrids = () => {
    // Pick a random set
    const set = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
    const baseEmoji = set[0];
    const diffEmoji = set[1];

    // 3x3 grid = 9 items
    const baseGrid = Array(9).fill(baseEmoji);
    
    // Copy and alter one
    const altGrid = [...baseGrid];
    const diffLocation = Math.floor(Math.random() * 9);
    altGrid[diffLocation] = diffEmoji;

    setGridA(baseGrid);
    setGridB(altGrid);
    setDiffIndex(diffLocation);
    setGameOver(false);
    setErrorMsg('');
  };

  useEffect(() => {
    generateGrids();
  }, [level]);

  const handleClick = (index) => {
    if (gameOver) return;

    if (index === diffIndex) {
      setGameOver('win');
      setErrorMsg('');
      setTimeout(() => {
        if (onComplete) onComplete({ score: 100, isPerfect: true });
      }, 2000);
    } else {
      setErrorMsg('Oops, that one matches! Try again.');
      setTimeout(() => setErrorMsg(''), 2000);
    }
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
        Spot the Difference
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
        Find the ONE imposter in the bottom grid!
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--spacing-lg)',
        width: '100%'
      }}>
        
        {/* Top Grid (Base) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          width: '100%',
          maxWidth: '300px',
          backgroundColor: 'var(--surface-color)',
          padding: '12px',
          borderRadius: 'var(--radius-lg)'
        }}>
          {gridA.map((emoji, i) => (
            <div key={`a-${i}`} style={{
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4rem'
            }}>
              {emoji}
            </div>
          ))}
        </div>

        <div style={{ fontSize: '2rem', color: 'var(--text-secondary)' }}>⬇️</div>

        {/* Bottom Grid (Interactive) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          width: '100%',
          maxWidth: '300px',
          backgroundColor: gameOver ? 'var(--accent-success)' : 'var(--surface-highlight)',
          padding: '12px',
          borderRadius: 'var(--radius-lg)',
          transition: 'background-color 0.5s'
        }}>
          {gridB.map((emoji, i) => (
            <button
              key={`b-${i}`}
              onClick={() => handleClick(i)}
              disabled={gameOver}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                backgroundColor: (gameOver && i === diffIndex) ? '#fff' : 'transparent',
                border: (gameOver && i === diffIndex) ? '4px solid var(--text-primary)' : 'none',
                borderRadius: '8px',
                padding: 0,
                cursor: gameOver ? 'default' : 'pointer'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>

      </div>

      <div style={{
        marginTop: 'var(--spacing-lg)',
        minHeight: '3rem',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '1.5rem',
        color: gameOver === 'win' ? 'var(--accent-success)' : 'var(--accent-error)',
        animation: gameOver === 'win' ? 'pulse 2s infinite' : 'none'
      }}>
        {gameOver === 'win' ? '🌟 You found it! 🌟' : errorMsg}
      </div>

    </div>
  );
}
