import React, { useState, useEffect, useRef } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const NUM_HOLES = 9;
const TOTAL_MOLES = 15;
const GAP_MS = 700;         // quiet pause between mole appearances
const HIT_FLASH_MS = 400;   // ⭐ shown in the hole after a hit
const EMPTY_FLASH_MS = 300; // gentle flash when tapping an empty hole

function Playfield({ level, finishGame }) {
  const [moleHole, setMoleHole] = useState(null);
  const [appearance, setAppearance] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [score, setScore] = useState(0);
  const [starHole, setStarHole] = useState(null);
  const [flashHole, setFlashHole] = useState(null);
  const { feedback, showFeedback } = useFeedback(900);

  // The timing chain lives in refs so timeouts never see stale values.
  const statsRef = useRef({ shown: 0, hits: 0, misses: 0, score: 0, streak: 0, bestStreak: 0 });
  const resolvedRef = useRef(false);
  const lastHoleRef = useRef(null);
  const timeoutsRef = useRef([]);

  // Each mole stays up 2.5s at level 1, down to 1.4s at level 5.
  const upTime = Math.max(1400, 2500 - (Math.min(level, 5) - 1) * 275);

  const schedule = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  };

  const endGame = () => {
    const s = statsRef.current;
    setMoleHole(null);
    schedule(() => {
      finishGame({
        score: s.score,
        correct: s.hits,
        total: TOTAL_MOLES,
        bestStreak: s.bestStreak,
        isPerfect: s.hits === TOTAL_MOLES,
      });
    }, 800);
  };

  const showNextMole = () => {
    const s = statsRef.current;
    if (s.shown >= TOTAL_MOLES) {
      endGame();
      return;
    }
    s.shown += 1;

    let hole;
    do {
      hole = Math.floor(Math.random() * NUM_HOLES);
    } while (hole === lastHoleRef.current);
    lastHoleRef.current = hole;

    resolvedRef.current = false;
    setAppearance(s.shown);
    setMoleHole(hole);

    schedule(() => {
      if (resolvedRef.current) return;
      // The mole got away — that one counts as a miss.
      resolvedRef.current = true;
      s.misses += 1;
      s.streak = 0;
      setMisses(s.misses);
      setMoleHole(null);
      showFeedback('wrong', 'It got away!');
      schedule(showNextMole, GAP_MS);
    }, upTime);
  };

  useEffect(() => {
    schedule(showNextMole, 900);
    const timeouts = timeoutsRef.current;
    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = (index) => {
    const s = statsRef.current;
    if (s.shown === 0 || s.shown > TOTAL_MOLES) return;

    if (index === moleHole && !resolvedRef.current) {
      // A hit!
      resolvedRef.current = true;
      s.hits += 1;
      s.streak += 1;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      const points = 100 + (s.streak >= 3 ? 50 : 0);
      s.score += points;

      setHits(s.hits);
      setScore(s.score);
      setMoleHole(null);
      setStarHole(index);
      schedule(() => setStarHole(h => (h === index ? null : h)), HIT_FLASH_MS);
      showFeedback('correct', s.streak >= 3 ? `+${points} — ${s.streak} in a row!` : `+${points}`);
      schedule(showNextMole, GAP_MS);
    } else if (index !== moleHole) {
      // Empty hole — no penalty, just a little flash so the tap is acknowledged.
      setFlashHole(index);
      schedule(() => setFlashHole(h => (h === index ? null : h)), EMPTY_FLASH_MS);
    }
  };

  return (
    <>
      <GameHUD
        score={score}
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Mole</span>
              <span className="hud-value">{Math.min(appearance, TOTAL_MOLES)} of {TOTAL_MOLES}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Hits</span>
              <span className="hud-value" style={{ color: 'var(--success)' }}>{hits}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Missed</span>
              <span className="hud-value" style={{ color: misses > 0 ? 'var(--error)' : 'var(--text-primary)' }}>{misses}</span>
            </div>
          </>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Tap the mole before it pops back down!
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--spacing-sm)',
        width: '100%',
        maxWidth: 520,
        margin: '0 auto',
        backgroundColor: '#DCEFD8', // light grass
        border: '3px solid #B9D4AE',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
      }}>
        {Array.from({ length: NUM_HOLES }).map((_, index) => {
          const isMole = index === moleHole;
          return (
            <button
              key={index}
              onClick={() => handleTap(index)}
              aria-label={isMole ? 'Mole!' : 'Empty hole'}
              style={{
                aspectRatio: '1',
                minHeight: 130,
                backgroundColor: flashHole === index ? '#A68B67' : '#8B7355', // warm brown holes
                border: '4px solid #6B5640',
                borderRadius: '50%',
                fontSize: '3rem',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: isMole ? 'pointer' : 'default',
                transition: 'transform 0.1s, background-color 0.15s',
                transform: isMole ? 'scale(1.05)' : 'scale(1)',
                boxShadow: 'inset 0 8px 16px rgba(0,0,0,0.35)',
              }}
            >
              {isMole ? '🐹' : starHole === index ? '⭐' : ''}
            </button>
          );
        })}
      </div>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function WhackAMole({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Whack-A-Mole"
      icon="🐹"
      category="speed"
      level={level}
      instructions={[
        { icon: '🐹', text: 'A mole pops out of one of the nine holes.' },
        { icon: '👆', text: 'Tap it before it ducks back down — 15 moles will appear.' },
        { icon: '🔥', text: 'Hit 3 in a row for bonus points!' },
      ]}
      tip="Keep your eyes on the middle of the garden and let the moles come to you."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}
