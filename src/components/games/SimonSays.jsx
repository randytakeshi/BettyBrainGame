import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

// Solid, saturated pads that read on the light theme. Each pad differs by
// SHAPE as well as color, and each has its own musical tone.
const PADS = [
  { id: 0, color: '#DC2626', symbol: '♦', name: 'red diamond', freq: 329.628 },
  { id: 1, color: '#2563EB', symbol: '♣', name: 'blue club', freq: 261.626 },
  { id: 2, color: '#15803D', symbol: '♥', name: 'green heart', freq: 220.000 },
  { id: 3, color: '#B45309', symbol: '♠', name: 'gold spade', freq: 164.814 },
];

const HIGH_SCORE_KEY = 'betty_simon_highest_score';
const PERFECT_ROUNDS = 5;

function Playfield({ finishGame }) {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [activePad, setActivePad] = useState(null);
  const [isShowing, setIsShowing] = useState(true);
  const [ended, setEnded] = useState(false);
  const [highScore, setHighScore] = useState(() =>
    parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10)
  );
  const { feedback, showFeedback } = useFeedback(1600);

  const timeoutRefs = useRef([]);
  const audioCtxRef = useRef(null);

  const playTone = useCallback((freq, duration = 400) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, []);

  const startSequence = useCallback((seq) => {
    setIsShowing(true);
    setUserSequence([]);

    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current.length = 0; // clear in place so the unmount cleanup still sees new ids

    const startDelay = setTimeout(() => {
      seq.forEach((padIndex, i) => {
        const t1 = setTimeout(() => {
          setActivePad(padIndex);
          playTone(PADS[padIndex].freq, 500);
        }, i * 800);

        const t2 = setTimeout(() => setActivePad(null), i * 800 + 550);

        timeoutRefs.current.push(t1, t2);
      });

      const finishTimeout = setTimeout(() => setIsShowing(false), seq.length * 800 + 200);
      timeoutRefs.current.push(finishTimeout);
    }, 900);

    timeoutRefs.current.push(startDelay);
  }, [playTone]);

  useEffect(() => {
    const initial = [Math.floor(Math.random() * 4)];
    setSequence(initial);
    startSequence(initial);

    const timeouts = timeoutRefs.current;
    return () => {
      timeouts.forEach(clearTimeout);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePadClick = (index) => {
    if (isShowing || ended) return;

    setActivePad(index);
    playTone(PADS[index].freq, 300);
    const clickFlash = setTimeout(() => setActivePad(p => (p === index ? null : p)), 300);
    timeoutRefs.current.push(clickFlash);

    const newUserSeq = [...userSequence, index];
    setUserSequence(newUserSeq);

    const step = newUserSeq.length - 1;
    if (index !== sequence[step]) {
      // Wrong pad — game over. Reveal which pad was next.
      const roundsCompleted = sequence.length - 1;
      setEnded(true);
      playTone(100, 900);

      const expected = PADS[sequence[step]];
      showFeedback('wrong', `The next pad was the ${expected.name} ${expected.symbol}`);
      const reveal = setTimeout(() => {
        setActivePad(expected.id);
        playTone(expected.freq, 700);
      }, 600);
      timeoutRefs.current.push(reveal);

      if (roundsCompleted > highScore) {
        setHighScore(roundsCompleted);
        localStorage.setItem(HIGH_SCORE_KEY, String(roundsCompleted));
      }

      const finish = setTimeout(() => {
        finishGame({
          score: roundsCompleted * 100,
          correct: roundsCompleted,
          total: null,
          isPerfect: roundsCompleted >= PERFECT_ROUNDS,
        });
      }, 2100);
      timeoutRefs.current.push(finish);
      return;
    }

    if (newUserSeq.length === sequence.length) {
      // Round complete — add a step and show the longer pattern.
      setIsShowing(true);
      showFeedback('correct', `${sequence.length} in a row!`);
      const next = setTimeout(() => {
        const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(nextSeq);
        startSequence(nextSeq);
      }, 1300);
      timeoutRefs.current.push(next);
    }
  };

  const roundsCompleted = Math.max(0, sequence.length - 1);

  return (
    <>
      <GameHUD
        score={roundsCompleted * 100}
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Round</span>
              <span className="hud-value">{Math.max(1, sequence.length)}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Best</span>
              <span className="hud-value" style={{ color: 'var(--gold)' }}>
                {highScore} {highScore === 1 ? 'round' : 'rounds'}
              </span>
            </div>
          </>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>
        {isShowing ? 'Watch and listen…' : 'Your turn — repeat the pattern!'}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--spacing-md)',
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
      }}>
        {PADS.map((pad) => {
          const isActive = activePad === pad.id;
          return (
            <button
              key={pad.id}
              onClick={() => handlePadClick(pad.id)}
              aria-label={pad.name}
              aria-disabled={isShowing || ended}
              style={{
                aspectRatio: '1',
                minHeight: 140,
                backgroundColor: pad.color,
                color: '#FFFFFF',
                fontSize: '3.2rem',
                lineHeight: 1,
                border: isActive ? '6px solid #FFFFFF' : '6px solid transparent',
                borderRadius: 'var(--radius-lg)',
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                filter: isActive ? 'brightness(1.25)' : 'none',
                boxShadow: isActive ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                transition: 'transform 0.1s, border 0.1s, filter 0.1s',
                cursor: isShowing || ended ? 'default' : 'pointer',
              }}
            >
              {pad.symbol}
            </button>
          );
        })}
      </div>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function SimonSays({ level, onComplete, onBack }) {
  return (
    <GameShell
      title="Simon Says"
      icon="🎵"
      category="memory"
      level={level}
      instructions={[
        { icon: '👀', text: 'Watch the four pads light up and listen to their tones.' },
        { icon: '👆', text: 'Tap the pads back in exactly the same order.' },
        { icon: '🎵', text: 'Each round adds one more step. See how far you can go!' },
      ]}
      tip="Say the shapes out loud as they play — diamond, club, heart, spade."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield finishGame={finishGame} />}
    </GameShell>
  );
}
