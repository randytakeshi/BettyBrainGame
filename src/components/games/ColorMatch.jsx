import React, { useState, useEffect } from 'react';

const COLORS_BY_LEVEL = {
  1: [{ name: 'RED', hex: '#FF1744' }, { name: 'BLUE', hex: '#00E5FF' }, { name: 'GREEN', hex: '#00E676' }],
  2: [{ name: 'RED', hex: '#FF1744' }, { name: 'BLUE', hex: '#00E5FF' }, { name: 'GREEN', hex: '#00E676' }, { name: 'YELLOW', hex: '#FFEA00' }],
  3: [{ name: 'RED', hex: '#FF1744' }, { name: 'BLUE', hex: '#00E5FF' }, { name: 'GREEN', hex: '#00E676' }, { name: 'YELLOW', hex: '#FFEA00' }, { name: 'PURPLE', hex: '#D500F9' }, { name: 'ORANGE', hex: '#FF9100' }]
};

const generateProblem = (level) => {
  const colors = COLORS_BY_LEVEL[Math.min(level, 3)];
  const isMatch = Math.random() > 0.5;
  
  const textMeaning = colors[Math.floor(Math.random() * colors.length)];
  let inkColor = textMeaning;
  
  if (!isMatch) {
    let wrongColors = colors.filter(c => c.name !== textMeaning.name);
    inkColor = wrongColors[Math.floor(Math.random() * wrongColors.length)];
  }
  
  return { textMeaning, inkColor, isMatch };
};

export function ColorMatch({ level, onComplete, onBack }) {
  const [problem, setProblem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const MAX_ROUNDS = 5;

  useEffect(() => {
    setProblem(generateProblem(level));
  }, [level]);

  const handleChoice = (choiceMatches) => {
    const isCorrect = choiceMatches === problem.isMatch;
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
      
      <h2 style={{ marginBottom: 'var(--spacing-xs)', textAlign: 'center' }}>
        Does the meaning match the color?
      </h2>
      
      <div style={{
        fontSize: '6rem',
        fontWeight: '900',
        margin: 'var(--spacing-xl) 0',
        color: feedback === 'incorrect' ? 'var(--accent-error)' : problem.inkColor.hex,
        transition: 'color 0.3s',
        textShadow: '0 0 10px rgba(0,0,0,0.5)',
        backgroundColor: 'var(--surface-color)',
        padding: 'var(--spacing-lg) var(--spacing-xl)',
        borderRadius: 'var(--radius-lg)'
      }}>
        {problem.textMeaning.name}
      </div>
      
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-lg)',
        width: '100%',
        maxWidth: '500px'
      }}>
        <button
          className="secondary"
          onClick={() => handleChoice(false)}
          disabled={feedback !== null}
          style={{ flex: 1, fontSize: '2.5rem', backgroundColor: '#333', color: 'white' }}
        >
          NO
        </button>
        <button
          className="primary"
          onClick={() => handleChoice(true)}
          disabled={feedback !== null}
          style={{ flex: 1, fontSize: '2.5rem' }}
        >
          YES
        </button>
      </div>
    </div>
  );
}
