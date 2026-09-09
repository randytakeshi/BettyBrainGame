import React, { useState, useEffect } from 'react';

const DIRS = ['⬆️', '⬇️', '⬅️', '➡️'];

const generateProblem = (level) => {
  const target = DIRS[Math.floor(Math.random() * DIRS.length)];
  let distractors = target;
  
  if (level > 1) {
    // 50% chance to be different distractors
    if (Math.random() > 0.5) {
      let others = DIRS.filter(d => d !== target);
      distractors = others[Math.floor(Math.random() * others.length)];
    }
  }
  
  return { target, distractors };
};

export function DirectionalDash({ level = 1, onComplete, onBack }) {
  const [problem, setProblem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const MAX_ROUNDS = 5;

  useEffect(() => {
    setProblem(generateProblem(level));
  }, [level]);

  const handleChoice = (choice) => {
    const isCorrect = choice === problem.target;
    if (isCorrect) {
      setFeedback('correct');
      setCorrectCount(prev => prev + 1);
    } else {
      setFeedback('incorrect');
    }

    setTimeout(() => {
      const nextRound = rounds + 1;
      if (nextRound >= MAX_ROUNDS) {
        if (onComplete) {
          onComplete({ 
            score: Math.floor((correctCount + (isCorrect ? 1 : 0)) / MAX_ROUNDS * 100),
            isPerfect: (correctCount + (isCorrect ? 1 : 0)) === MAX_ROUNDS
          });
        }
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
      
      <h2 style={{ marginBottom: 'var(--spacing-xs)', textAlign: 'center' }}>
        Which way is the MIDDLE arrow pointing?
      </h2>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        margin: 'var(--spacing-xl) 0',
        backgroundColor: feedback === 'correct' ? 'rgba(0,230,118,0.1)' : feedback === 'incorrect' ? 'rgba(255,23,68,0.1)' : 'var(--surface-color)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-lg)',
        transition: 'background-color 0.3s'
      }}>
        <div style={{ fontSize: '4rem' }}>{problem.distractors}</div>
        <div style={{ fontSize: '4rem' }}>{problem.distractors}</div>
        <div style={{ fontSize: '6rem', color: 'var(--accent-primary)', transform: 'scale(1.2)' }}>{problem.target}</div>
        <div style={{ fontSize: '4rem' }}>{problem.distractors}</div>
        <div style={{ fontSize: '4rem' }}>{problem.distractors}</div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--spacing-lg)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {DIRS.map((dir, index) => (
          <button
            key={index}
            onClick={() => handleChoice(dir)}
            disabled={feedback !== null}
            className="secondary"
            style={{
              fontSize: '4rem',
              padding: 'var(--spacing-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-primary)',
            }}
          >
            {dir}
          </button>
        ))}
      </div>
    </div>
  );
}
