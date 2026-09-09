import React, { useState, useEffect, useRef } from 'react';

const generateSequence = (level) => {
  const length = level === 1 ? 3 : level === 2 ? 4 : 5;
  const seq = [];
  for (let i = 0; i < length; i++) {
    seq.push(Math.floor(Math.random() * 9));
  }
  return seq;
};

export function PatternRecall({ level = 1, onComplete, onBack }) {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [activeCell, setActiveCell] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [rounds, setRounds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const MAX_ROUNDS = 5;
  
  const timeoutRefs = useRef([]);

  const startSequence = (seq) => {
    setIsPlaying(true);
    setUserSequence([]);
    setFeedback(null);
    
    // Clear old timeouts
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    // Flash sequence
    seq.forEach((cellIndex, i) => {
      const t1 = setTimeout(() => {
        setActiveCell(cellIndex);
      }, i * 1000 + 500); // 1s per item
      
      const t2 = setTimeout(() => {
        setActiveCell(null);
      }, i * 1000 + 1300); // highlight for 800ms
      
      timeoutRefs.current.push(t1, t2);
    });

    const finishTimeout = setTimeout(() => {
      setIsPlaying(false);
    }, seq.length * 1000 + 500);
    
    timeoutRefs.current.push(finishTimeout);
  };

  useEffect(() => {
    const seq = generateSequence(level);
    setSequence(seq);
    startSequence(seq);
    
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, [level, rounds]);

  const handleCellClick = (index) => {
    if (isPlaying || feedback !== null) return;
    
    // Briefly highlight
    setActiveCell(index);
    setTimeout(() => setActiveCell(null), 200);

    const newUserSeq = [...userSequence, index];
    setUserSequence(newUserSeq);

    // Check correctness of current step
    const currentIndex = newUserSeq.length - 1;
    if (newUserSeq[currentIndex] !== sequence[currentIndex]) {
      // Wrong move
      setFeedback('incorrect');
      setTimeout(() => {
        const nextRound = rounds + 1;
        if (nextRound >= MAX_ROUNDS) {
          if (onComplete) onComplete({ score: Math.floor(correctCount / MAX_ROUNDS * 100), isPerfect: false });
        } else {
          setRounds(nextRound);
        }
      }, 1500);
      return;
    }

    // Check if finished sequence
    if (newUserSeq.length === sequence.length) {
      setFeedback('correct');
      setCorrectCount(prev => prev + 1);
      setTimeout(() => {
        const nextRound = rounds + 1;
        if (nextRound >= MAX_ROUNDS) {
          if (onComplete) onComplete({ 
            score: Math.floor((correctCount + 1) / MAX_ROUNDS * 100), 
            isPerfect: (correctCount + 1) === MAX_ROUNDS 
          });
        } else {
          setRounds(nextRound);
        }
      }, 1500);
    }
  };

  return (
    <div className="game-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level} | {rounds + 1}/{MAX_ROUNDS}
        </div>
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-xs)', textAlign: 'center' }}>
        {isPlaying ? 'Watch the pattern...' : 'Repeat the pattern!'}
      </h2>
      
      <p style={{ 
        color: feedback === 'correct' ? 'var(--accent-success)' : feedback === 'incorrect' ? 'var(--accent-error)' : 'var(--text-secondary)',
        minHeight: '2rem',
        marginBottom: 'var(--spacing-md)'
      }}>
        {feedback === 'correct' ? 'Perfect!' : feedback === 'incorrect' ? 'Oops, wrong square.' : ''}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--spacing-sm)',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        {[0,1,2,3,4,5,6,7,8].map(index => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={isPlaying || feedback !== null}
            style={{
              aspectRatio: '1',
              backgroundColor: activeCell === index ? 'var(--accent-primary)' : 'var(--surface-color)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              transition: 'background-color 0.2s',
              cursor: isPlaying ? 'default' : 'pointer'
            }}
          />
        ))}
      </div>
    </div>
  );
}
