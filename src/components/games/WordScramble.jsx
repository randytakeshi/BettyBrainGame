import React, { useState, useEffect } from 'react';

const WORDS_BY_LEVEL = {
  1: ['CAT', 'DOG', 'SUN', 'BUS', 'CAR'],
  2: ['BIRD', 'MOON', 'STAR', 'TREE', 'BOOK'],
  3: ['APPLE', 'HOUSE', 'CHAIR', 'TRAIN', 'CLOCK'],
  4: ['ORANGE', 'PLANET', 'FLOWER', 'GUITAR', 'MIRROR']
};

const getScrambledWord = (level) => {
  const words = WORDS_BY_LEVEL[Math.min(level, 4)];
  const word = words[Math.floor(Math.random() * words.length)];
  let scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
  
  while (scrambled === word && word.length > 1) {
    scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
  }
  return { word, scrambled: scrambled.split('') };
};

export function WordScramble({ level = 1, onComplete, onBack }) {
  const [current, setCurrent] = useState(null);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const MAX_ROUNDS = 5;

  useEffect(() => {
    setCurrent(getScrambledWord(level));
    setSelectedLetters([]);
  }, [level]);

  const handleLetterClick = (index) => {
    if (selectedLetters.includes(index) || feedback !== null) return;
    
    const newSelected = [...selectedLetters, index];
    setSelectedLetters(newSelected);
    
    if (newSelected.length === current.word.length) {
      const guessedWord = newSelected.map(i => current.scrambled[i]).join('');
      const isCorrect = guessedWord === current.word;
      
      if (isCorrect) {
        setFeedback('correct');
        setCorrectCount(prev => prev + 1);
      } else {
        setFeedback('incorrect');
      }

      setTimeout(() => {
        if (isCorrect) {
          const nextRound = rounds + 1;
          if (nextRound >= MAX_ROUNDS) {
            if (onComplete) {
              onComplete({ 
                score: Math.floor((correctCount + 1) / MAX_ROUNDS * 100),
                isPerfect: (correctCount + 1) === MAX_ROUNDS
              });
            }
          } else {
            setRounds(nextRound);
            setCurrent(getScrambledWord(level));
            setSelectedLetters([]);
            setFeedback(null);
          }
        } else {
          // If incorrect, just clear the try and let them try again, or maybe count it as a round?
          // Let's just clear it and not advance the round so they have to get it right.
          // But to prevent infinite loops, let's say they only get points if they get it right on the first try (we don't track tries right now).
          // Actually, let's just advance the round anyway if it's wrong to keep pacing consistent.
          const nextRound = rounds + 1;
          if (nextRound >= MAX_ROUNDS) {
            if (onComplete) {
              onComplete({ 
                score: Math.floor(correctCount / MAX_ROUNDS * 100),
                isPerfect: false
              });
            }
          } else {
            setRounds(nextRound);
            setCurrent(getScrambledWord(level));
            setSelectedLetters([]);
            setFeedback(null);
          }
        }
      }, 1000);
    }
  };

  const handleClear = () => {
    setSelectedLetters([]);
  };

  if (!current) return null;

  return (
    <div className="game-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level} | {rounds + 1}/{MAX_ROUNDS}
        </div>
      </div>
      
      <div style={{
        fontSize: '4rem',
        letterSpacing: '0.5rem',
        margin: 'var(--spacing-lg) 0',
        minHeight: '6rem',
        color: feedback === 'correct' ? 'var(--accent-success)' : feedback === 'incorrect' ? 'var(--accent-error)' : 'var(--text-primary)',
        transition: 'color 0.3s'
      }}>
        {selectedLetters.map(i => current.scrambled[i]).join('')}
        {selectedLetters.length === 0 && <span style={{color: 'var(--text-secondary)'}}>___</span>}
      </div>
      
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '600px'
      }}>
        {current.scrambled.map((letter, index) => (
          <button
            key={index}
            className="secondary"
            onClick={() => handleLetterClick(index)}
            disabled={selectedLetters.includes(index) || feedback !== null}
            style={{
              fontSize: '3rem',
              width: '80px',
              height: '80px',
              opacity: selectedLetters.includes(index) ? 0.3 : 1
            }}
          >
            {letter}
          </button>
        ))}
      </div>

      <button 
        onClick={handleClear}
        style={{ marginTop: 'var(--spacing-xl)', backgroundColor: 'var(--surface-highlight)' }}
        disabled={selectedLetters.length === 0 || feedback !== null}
      >
        Clear Try
      </button>
    </div>
  );
}
