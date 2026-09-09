import React, { useState, useEffect, useRef } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const TOTAL_ROUNDS = 5;
const FLASH_ON = 900;
const FLASH_OFF = 350;
const WATCH_DELAY = 700; // pause before the first flash of a round

// Each cell keeps its own distinct pale color so squares are easy to tell apart.
const CELL_COLORS = [
  'var(--cat-memory-soft)',
  'var(--cat-attention-soft)',
  'var(--cat-speed-soft)',
  'var(--cat-flexibility-soft)',
  'var(--cat-language-soft)',
  'var(--cat-logic-soft)',
  'var(--success-soft)',
  'var(--error-soft)',
  'var(--brand-soft)',
];

function makeSequence(length) {
  const seq = [];
  for (let i = 0; i < length; i++) {
    let cell = Math.floor(Math.random() * 9);
    while (cell === seq[i - 1]) cell = Math.floor(Math.random() * 9); // no back-to-back repeats
    seq.push(cell);
  }
  return seq;
}

function Playfield({ level, finishGame }) {
  const seqLength = Math.min(2 + level, 7);
  const pointsPerRound = 100 + (seqLength - 3) * 25;

  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [phase, setPhase] = useState('watch'); // 'watch' | 'repeat' | 'between'
  const [flashCell, setFlashCell] = useState(null);
  const [shown, setShown] = useState(0); // flashes revealed so far this round
  const [taps, setTaps] = useState(0); // correct taps so far this round
  const [tapFlash, setTapFlash] = useState(null);
  const [score, setScore] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const { feedback, showFeedback } = useFeedback(1200);
  const timeoutsRef = useRef([]);

  const later = (fn, ms) => timeoutsRef.current.push(setTimeout(fn, ms));

  useEffect(() => {
    const seq = makeSequence(seqLength);
    setSequence(seq);
    setTaps(0);
    setShown(0);
    setFlashCell(null);
    setTapFlash(null);
    setPhase('watch');

    seq.forEach((cell, i) => {
      later(() => {
        setFlashCell(cell);
        setShown(i + 1);
      }, WATCH_DELAY + i * (FLASH_ON + FLASH_OFF));
      later(() => setFlashCell(null), WATCH_DELAY + i * (FLASH_ON + FLASH_OFF) + FLASH_ON);
    });
    later(() => setPhase('repeat'), WATCH_DELAY + seq.length * (FLASH_ON + FLASH_OFF));

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [round, seqLength]);

  const advance = (currentScore, currentCorrect) => {
    if (round >= TOTAL_ROUNDS) {
      const bonus = currentCorrect === TOTAL_ROUNDS ? 200 : 0;
      finishGame({ score: currentScore + bonus, correct: currentCorrect, total: TOTAL_ROUNDS });
    } else {
      setRound(r => r + 1);
    }
  };

  const handleTap = (index) => {
    if (phase !== 'repeat') return;

    setTapFlash(index);
    later(() => setTapFlash(null), 250);

    if (index !== sequence[taps]) {
      // No sudden death: a wrong tap only ends this round.
      setPhase('between');
      showFeedback('wrong', 'That round is done — a new pattern is coming');
      later(() => advance(score, correctRounds), 1400);
      return;
    }

    const newTaps = taps + 1;
    setTaps(newTaps);
    if (newTaps === sequence.length) {
      const newScore = score + pointsPerRound;
      const newCorrect = correctRounds + 1;
      setScore(newScore);
      setCorrectRounds(newCorrect);
      setPhase('between');
      showFeedback('correct', `+${pointsPerRound} points`);
      later(() => advance(newScore, newCorrect), 1400);
    }
  };

  return (
    <>
      <GameHUD trial={round} totalTrials={TOTAL_ROUNDS} score={score} />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)', minHeight: '1.5em' }}>
        {phase === 'watch' ? 'Watch the pattern…' : phase === 'repeat' ? 'Your turn — repeat the pattern!' : ''}
      </p>

      <div
        aria-label={`Pattern progress: ${phase === 'watch' ? shown : taps} of ${seqLength}`}
        style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}
      >
        {Array.from({ length: seqLength }, (_, i) => {
          const filled = phase === 'watch' ? i < shown : i < taps;
          return (
            <div
              key={i}
              style={{
                width: 30,
                height: 30,
                borderRadius: 'var(--radius-full)',
                backgroundColor: filled ? 'var(--cat-memory)' : 'var(--surface-color)',
                border: '3px solid var(--border-strong)',
              }}
            />
          );
        })}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--spacing-sm)',
        width: '100%',
        maxWidth: 440,
        margin: '0 auto',
      }}>
        {CELL_COLORS.map((color, index) => {
          const lit = flashCell === index || tapFlash === index;
          return (
            // Not `disabled` outside the repeat phase — the global disabled style
            // would dim the flash cue. handleTap ignores taps instead.
            <button
              key={index}
              onClick={() => handleTap(index)}
              aria-label={`Square ${index + 1}`}
              style={{
                aspectRatio: '1',
                width: '100%',
                minWidth: 90,
                minHeight: 90,
                padding: 0,
                backgroundColor: lit ? 'var(--cat-memory)' : color,
                border: '3px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                transform: lit ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
                cursor: phase === 'repeat' ? 'pointer' : 'default',
              }}
            />
          );
        })}
      </div>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function PatternRecall({ level, onComplete, onBack }) {
  return (
    <GameShell
      title="Pattern Recall"
      icon="🧩"
      category="memory"
      level={level}
      instructions={[
        { icon: '👀', text: 'Watch the squares light up bright blue, one at a time.' },
        { icon: '👆', text: 'Then tap the same squares in the same order.' },
        { icon: '🧩', text: 'A wrong tap just ends that round — a fresh pattern comes next.' },
      ]}
      tip="Say each square's color to yourself as it lights up — it helps the order stick."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}
