import React, { useState, useEffect } from 'react';

const WORDS_BY_LEVEL = {
  1: ['CAT', 'DOG', 'SUN', 'BUS', 'CAR', 'PEN', 'HAT', 'BOX'],
  2: ['BIRD', 'MOON', 'STAR', 'TREE', 'BOOK', 'ROSE', 'FISH', 'SHOE'],
  3: ['APPLE', 'HOUSE', 'CHAIR', 'TRAIN', 'CLOCK', 'BREAD', 'WATER', 'HEART'],
  4: ['ORANGE', 'PLANET', 'FLOWER', 'GUITAR', 'MIRROR', 'CAMERA', 'PENCIL'],
  5: ['BICYCLE', 'DIAMOND', 'ELEPHANT', 'UMBRELLA', 'HOSPITAL', 'TELEPHONE']
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const generateProblem = (level) => {
  const words = WORDS_BY_LEVEL[Math.min(level, 5)];
  const word = words[Math.floor(Math.random() * words.length)];
  
  // Omit the last letter
  const prefix = word.slice(0, -1);
  const correctLetter = word.slice(-1);
  
  // Generate 2 wrong letters
  let wrongLetters = new Set();
  while(wrongLetters.size < 2) {
    const randomLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (randomLetter !== correctLetter) {
      wrongLetters.add(randomLetter);
    }
  }
  
  const choices = [correctLetter, ...wrongLetters].sort(() => Math.random() - 0.5);
  
  return { word, prefix, correctLetter, choices };
};

export function WordBubbles({ level, onComplete, onBack }) {
  const [problem, setProblem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const MAX_ROUNDS = 5;

  useEffect(() => {
    setProblem(generateProblem(level));
  }, [level]);

  const handleChoice = (choice) => {
    const isCorrect = choice === problem.correctLetter;
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
        fontSize: '5rem',
        letterSpacing: '1rem',
        margin: 'var(--spacing-xl) 0',
        color: feedback === 'correct' ? 'var(--accent-success)' : feedback === 'incorrect' ? 'var(--accent-error)' : 'var(--text-primary)',
        transition: 'color 0.3s'
      }}>
        {problem.prefix}<span style={{ textDecoration: 'underline' }}>{feedback === 'correct' ? problem.correctLetter : '_'}</span>
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
        {problem.choices.map((choice, i) => (
          <button 
            key={i} 
            className="secondary" 
            style={{ 
              width: '120px', 
              height: '120px', 
              fontSize: '4rem', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-primary)',
              border: '4px solid var(--accent-primary)'
            }}
            onClick={() => handleChoice(choice)}
            disabled={feedback !== null}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
