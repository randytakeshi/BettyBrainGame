import React, { useState, useEffect } from 'react';

const EMOJI_PAIRS = [
  ['🟡', '🔴'], ['🟩', '🟦'], ['⭐', '🌟'], ['🍎', '🍅'], ['🐶', '🐱'], ['☀️', '🌤️']
];

const generateProblem = (level) => {
  const gridSize = level === 1 ? 2 : level === 2 ? 3 : 4;
  const totalItems = gridSize * gridSize;
  
  const pair = EMOJI_PAIRS[Math.floor(Math.random() * EMOJI_PAIRS.length)];
  const [majority, minority] = Math.random() > 0.5 ? pair : [pair[1], pair[0]];
  
  const targetIndex = Math.floor(Math.random() * totalItems);
  
  const grid = Array(totalItems).fill(majority);
  grid[targetIndex] = minority;
  
  return { gridSize, grid, targetIndex };
};

export function StarSearch({ level, onComplete, onBack }) {
  const [problem, setProblem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const MAX_ROUNDS = 5;

  useEffect(() => {
    setProblem(generateProblem(level));
  }, [level]);

  const handleChoice = (index) => {
    const isCorrect = index === problem.targetIndex;
    if (isCorrect) {
      setFeedback('correct');
      setCorrectCount(prev => prev + 1);
    } else {
      setFeedback('incorrect');
    }

    setTimeout(() => {
      const nextRound = rounds + 1;
      if (nextRound >= MAX_ROUNDS) {
        onComplete({ 
          score: Math.floor((correctCount + (isCorrect ? 1 : 0)) / MAX_ROUNDS * 100),
          isPerfect: (correctCount + (isCorrect ? 1 : 0)) === MAX_ROUNDS
        });
      } else {
        setRounds(nextRound);
        setProblem(generateProblem(level));
        setFeedback(null);
      }
    }, 1000);
  };

  if (!problem) return null;

  return (
    <div className="game-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level} | {rounds + 1}/{MAX_ROUNDS}
        </div>
      </div>
      
      <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Find the odd one out!</h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${problem.gridSize}, 1fr)`,
        gap: 'var(--spacing-sm)',
        maxWidth: '500px',
        width: '100%',
        backgroundColor: feedback === 'correct' ? 'rgba(0,230,118,0.1)' : feedback === 'incorrect' ? 'rgba(255,23,68,0.1)' : 'transparent',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        transition: 'background-color 0.3s'
      }}>
        {problem.grid.map((item, index) => (
          <button
            key={index}
            onClick={() => handleChoice(index)}
            disabled={feedback !== null}
            style={{
              fontSize: problem.gridSize === 4 ? '3rem' : '4rem',
              height: problem.gridSize === 4 ? '80px' : '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--surface-color)',
              border: '2px solid transparent',
              transition: 'transform 0.1s'
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
