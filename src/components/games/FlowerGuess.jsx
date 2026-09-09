import React, { useState, useEffect } from 'react';

const WORDS = [
  'HAPPY', 'GARDEN', 'BAKING', 'FAMILY', 'SPRING', 'SMILE', 'PEACE', 
  'LOVE', 'SUNSHINE', 'MUSIC', 'READING', 'COFFEE', 'CAKE', 'HUG'
];

const MAX_WRONG = 5;

const FLOWER_STAGES = [
  '🌸', // 0 wrong (full flower)
  '💮', // 1 wrong (losing petals)
  '🏵️', // 2 wrong
  '🥀', // 3 wrong (wilting)
  '🌱', // 4 wrong (just a stem)
  '🍂'  // 5 wrong (dead leaf)
];

export function FlowerGuess({ level = 1, onComplete, onBack }) {
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    // Pick word based on level (harder levels = longer words if possible, but keep it random for now)
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(randomWord);
    setGuessedLetters(new Set());
    setWrongCount(0);
    setGameOver(false);
  }, [level]);

  const handleGuess = (letter) => {
    if (gameOver || guessedLetters.has(letter)) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!word.includes(letter)) {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      if (newWrong >= MAX_WRONG) {
        setGameOver('lose');
        setTimeout(() => {
          if (onComplete) onComplete({ score: 0, isPerfect: false });
        }, 3000);
      }
    } else {
      // Check win
      const isWin = word.split('').every(char => newGuessed.has(char));
      if (isWin) {
        setGameOver('win');
        setTimeout(() => {
          if (onComplete) onComplete({ score: 100, isPerfect: wrongCount === 0 });
        }, 2000);
      }
    }
  };

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  return (
    <div className="game-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level} | Petals: {MAX_WRONG - wrongCount}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ 
          fontSize: '6rem', 
          marginBottom: 'var(--spacing-md)',
          animation: gameOver === 'lose' ? 'shake 0.5s' : gameOver === 'win' ? 'pulse 2s infinite' : 'none',
          transition: 'all 0.3s'
        }}>
          {FLOWER_STAGES[wrongCount] || '🍂'}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: 'var(--spacing-xl)'
        }}>
          {word.split('').map((char, index) => (
            <div key={index} style={{
              width: '50px',
              height: '70px',
              borderBottom: '6px solid var(--text-primary)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              fontSize: '3rem',
              fontWeight: 'bold',
              color: guessedLetters.has(char) ? 'var(--text-primary)' : (gameOver === 'lose' ? 'var(--accent-error)' : 'transparent')
            }}>
              {(guessedLetters.has(char) || gameOver === 'lose') ? char : '_'}
            </div>
          ))}
        </div>

        {gameOver && (
          <div style={{
            color: gameOver === 'win' ? 'var(--accent-success)' : 'var(--accent-error)',
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: 'var(--spacing-lg)'
          }}>
            {gameOver === 'win' ? '🌟 Beautiful! 🌟' : 'Oh no, the flower wilted!'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          {keyboardRows.map((row, rIndex) => (
            <div key={rIndex} style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {row.map(letter => {
                const isGuessed = guessedLetters.has(letter);
                const isCorrect = isGuessed && word.includes(letter);
                const isWrong = isGuessed && !word.includes(letter);
                
                return (
                  <button
                    key={letter}
                    onClick={() => handleGuess(letter)}
                    disabled={isGuessed || gameOver}
                    style={{
                      width: '40px', // slightly smaller width to fit 10 per row on iPad portrait
                      height: '55px',
                      padding: 0,
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      backgroundColor: isCorrect ? 'var(--accent-success)' : isWrong ? 'var(--surface-color)' : 'var(--surface-highlight)',
                      color: isWrong ? 'var(--text-secondary)' : 'var(--text-primary)',
                      border: 'none',
                      borderRadius: '8px',
                      opacity: isWrong ? 0.4 : 1,
                      cursor: (isGuessed || gameOver) ? 'default' : 'pointer'
                    }}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
