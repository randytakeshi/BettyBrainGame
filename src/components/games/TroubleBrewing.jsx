import React, { useState, useEffect } from 'react';

const ITEMS = [
  { name: 'Black Coffee', icon: '☕' },
  { name: 'Tea', icon: '🍵' },
  { name: 'Milk', icon: '🥛' },
  { name: 'Juice', icon: '🧃' },
  { name: 'Water', icon: '💧' },
  { name: 'Soda', icon: '🥤' }
];

const generateProblem = (level) => {
  const numChoices = level === 1 ? 2 : level === 2 ? 3 : 4;
  
  // Pick random distinct items
  let choices = [...ITEMS].sort(() => Math.random() - 0.5).slice(0, numChoices);
  
  const target = choices[Math.floor(Math.random() * choices.length)];
  
  return { target, choices };
};

export function TroubleBrewing({ level, onComplete, onBack }) {
  const [problem, setProblem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const MAX_ROUNDS = 5;

  useEffect(() => {
    setProblem(generateProblem(level));
  }, [level]);

  const handleChoice = (choice) => {
    const isCorrect = choice.name === problem.target.name;
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
      
      <div style={{ 
        fontSize: '1.5rem', 
        color: 'var(--text-secondary)',
        marginBottom: 'var(--spacing-xs)'
      }}>
        Order:
      </div>
      <div style={{
        fontSize: '4rem',
        fontWeight: 'bold',
        marginBottom: 'var(--spacing-xl)',
        color: feedback === 'correct' ? 'var(--accent-success)' : feedback === 'incorrect' ? 'var(--accent-error)' : 'var(--text-primary)',
        transition: 'color 0.3s'
      }}>
        "{problem.target.name}"
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${problem.choices.length === 4 ? 2 : problem.choices.length}, 1fr)`,
        gap: 'var(--spacing-lg)',
        maxWidth: '600px',
        width: '100%'
      }}>
        {problem.choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => handleChoice(choice)}
            disabled={feedback !== null}
            className="secondary"
            style={{
              fontSize: '10rem',
              padding: 'var(--spacing-xl) var(--spacing-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-primary)',
            }}
          >
            {choice.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
