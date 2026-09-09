import React, { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = [
  { id: 0, color: '#FF1744', freq: 329.628 }, // Red, E4
  { id: 1, color: '#00E5FF', freq: 261.626 }, // Blue, C4
  { id: 2, color: '#00E676', freq: 220.000 }, // Green, A3
  { id: 3, color: '#FFEA00', freq: 164.814 }  // Yellow, E3
];

export function SimonSays({ onComplete, onBack }) {
  const [hasStarted, setHasStarted] = useState(false);
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [activeCell, setActiveCell] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [highestScore, setHighestScore] = useState(0);
  
  const timeoutRefs = useRef([]);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    const savedScore = localStorage.getItem('betty_simon_highest_score');
    if (savedScore) {
      setHighestScore(parseInt(savedScore, 10));
    }
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTone = useCallback((freq, duration = 400) => {
    if (!audioCtxRef.current) return;
    const oscillator = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + (duration/1000));
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);
    
    oscillator.start();
    oscillator.stop(audioCtxRef.current.currentTime + (duration/1000));
  }, []);

  const startSequence = useCallback((seq) => {
    setIsPlaying(true);
    setUserSequence([]);
    setFeedback(null);
    
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    const startDelay = setTimeout(() => {
      seq.forEach((cellIndex, i) => {
        const t1 = setTimeout(() => {
          setActiveCell(cellIndex);
          playTone(COLORS[cellIndex].freq, 500);
        }, i * 800);
        
        const t2 = setTimeout(() => {
          setActiveCell(null);
        }, i * 800 + 500);
        
        timeoutRefs.current.push(t1, t2);
      });

      const finishTimeout = setTimeout(() => {
        setIsPlaying(false);
      }, seq.length * 800);
      
      timeoutRefs.current.push(finishTimeout);
    }, 1000);
    
    timeoutRefs.current.push(startDelay);
  }, [playTone]);

  const handleCellClick = (index) => {
    if (isPlaying || feedback !== null) return;
    
    setActiveCell(index);
    playTone(COLORS[index].freq, 300);
    
    setTimeout(() => setActiveCell(null), 300);

    const newUserSeq = [...userSequence, index];
    setUserSequence(newUserSeq);

    const currentIndex = newUserSeq.length - 1;
    if (newUserSeq[currentIndex] !== sequence[currentIndex]) {
      // Wrong move - Game Over
      setFeedback('incorrect');
      playTone(100, 1000); // Error buzz
      
      const score = sequence.length > 0 ? sequence.length - 1 : 0;
      if (score > highestScore) {
        setHighestScore(score);
        localStorage.setItem('betty_simon_highest_score', score.toString());
      }

      setTimeout(() => {
        if (onComplete) onComplete({ score: Math.min(score * 10, 100), isPerfect: false });
      }, 2000);
      return;
    }

    if (newUserSeq.length === sequence.length) {
      // Correct sequence - Advance to next
      setFeedback('correct');
      setTimeout(() => {
        const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(nextSeq);
        startSequence(nextSeq);
      }, 1000);
    }
  };

  const handleStart = () => {
    initAudio();
    setHasStarted(true);
    const initialSeq = [Math.floor(Math.random() * 4)];
    setSequence(initialSeq);
    startSequence(initialSeq);
  };

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="game-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          High Score: {highestScore}
        </div>
      </div>

      {!hasStarted ? (
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Simon Says</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', fontSize: '1.2rem' }}>
            Watch the pattern and repeat it exactly. It gets longer every round!
          </p>
          <button 
            className="primary" 
            style={{ fontSize: '2rem', padding: 'var(--spacing-lg) var(--spacing-xl)' }}
            onClick={handleStart}
          >
            Start Game
          </button>
        </div>
      ) : (
        <>
          <h2 style={{ marginBottom: 'var(--spacing-xs)', textAlign: 'center' }}>
            {isPlaying ? 'Listen and watch...' : 'Repeat the pattern!'}
          </h2>
          
          <div style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1.5rem',
            textAlign: 'center',
            marginBottom: 'var(--spacing-xs)'
          }}>
            Length: {sequence.length}
          </div>

          <p style={{ 
            color: feedback === 'correct' ? 'var(--accent-success)' : feedback === 'incorrect' ? 'var(--accent-error)' : 'transparent',
            minHeight: '2rem',
            marginBottom: 'var(--spacing-md)',
            textAlign: 'center'
          }}>
            {feedback === 'correct' ? 'Correct!' : feedback === 'incorrect' ? `Game Over! Score: ${sequence.length > 0 ? sequence.length - 1 : 0}` : '_'}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--spacing-md)',
            width: '100%',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            {COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCellClick(c.id)}
                disabled={isPlaying || feedback !== null}
                style={{
                  aspectRatio: '1',
                  backgroundColor: c.color,
                  opacity: activeCell === c.id ? 1 : 0.4,
                  border: activeCell === c.id ? '6px solid white' : '6px solid transparent',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'opacity 0.1s, border 0.1s',
                  cursor: isPlaying ? 'default' : 'pointer'
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
