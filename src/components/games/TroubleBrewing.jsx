import React, { useState, useEffect } from 'react';
import { GameShell, GameHUD, FeedbackOverlay } from '../GameShell';
import { SpeedBonusBar } from '../SpeedBonusBar';
import { useTrialGame } from '../../hooks/useTrialGame';

const ITEMS = [
  { name: 'Coffee', icon: '☕' },
  { name: 'Tea', icon: '🍵' },
  { name: 'Milk', icon: '🥛' },
  { name: 'Juice', icon: '🧃' },
  { name: 'Water', icon: '💧' },
  { name: 'Soda', icon: '🥤' },
];

const TOTAL_TRIALS = 6;

function settingsFor(level) {
  if (level <= 1) return { seqLen: 2, numChoices: 4 };
  if (level === 2) return { seqLen: 2, numChoices: 5 };
  if (level === 3) return { seqLen: 3, numChoices: 5 };
  if (level === 4) return { seqLen: 3, numChoices: 6 };
  return { seqLen: 4, numChoices: 6 };
}

function makeProblem(level) {
  const { seqLen, numChoices } = settingsFor(level);
  const choices = [...ITEMS].sort(() => Math.random() - 0.5).slice(0, numChoices);
  const sequence = [...choices].sort(() => Math.random() - 0.5).slice(0, seqLen);
  return { sequence, choices };
}

function Playfield({ level, timerMode, finishGame }) {
  const game = useTrialGame({
    totalTrials: TOTAL_TRIALS,
    timerMode,
    speedDuration: 120,
    makeProblem: () => makeProblem(level),
    finishGame,
  });
  const p = game.problem;

  const [phase, setPhase] = useState('memorize');
  const [tapIndex, setTapIndex] = useState(0);

  // New order arrives → back to the memorize step
  useEffect(() => {
    setPhase('memorize');
    setTapIndex(0);
  }, [p]);

  // Give plenty of reading time, then hide the order automatically
  useEffect(() => {
    if (phase !== 'memorize') return;
    const timer = setTimeout(() => setPhase('recall'), 3000 + p.sequence.length * 2000);
    return () => clearTimeout(timer);
  }, [phase, p]);

  const handleTap = (item) => {
    if (item.name === p.sequence[tapIndex].name) {
      if (tapIndex + 1 >= p.sequence.length) {
        game.answer(true);
      } else {
        setTapIndex(tapIndex + 1);
      }
    } else {
      game.answer(false, `Next up was ${p.sequence[tapIndex].icon} ${p.sequence[tapIndex].name}`);
    }
  };

  const orderText = p.sequence.map(d => d.name).join(', then ');

  return (
    <>
      <GameHUD trial={game.trial} totalTrials={TOTAL_TRIALS} score={game.score} streak={game.streak} />
      {timerMode && <SpeedBonusBar duration={120} maxBonus={50} />}

      {phase === 'memorize' ? (
        <>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
            ☕ Order up! Remember this order:
          </p>
          <div className="card" style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
              {p.sequence.map((item, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface-highlight)', borderRadius: 'var(--radius-full)',
                    padding: '2px 14px',
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: '3.4rem', lineHeight: 1.2 }}>{item.icon}</span>
                  <span style={{ fontWeight: 700 }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="primary big" onClick={() => setPhase('recall')}>
            Got it — I'm ready!
          </button>
        </>
      ) : (
        <>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
            Serve the order! Tap drink {tapIndex + 1} of {p.sequence.length}.
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 'var(--spacing-md)' }}>
            {p.sequence.map((_, i) => (
              <span key={i} style={{
                width: 64, height: 64, borderRadius: 'var(--radius-md)',
                border: '3px dashed var(--border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem',
                backgroundColor: i < tapIndex ? 'var(--success-soft)' : 'var(--surface-color)',
                borderStyle: i < tapIndex ? 'solid' : 'dashed',
                borderColor: i < tapIndex ? 'var(--success)' : 'var(--border-strong)',
              }}>
                {i < tapIndex ? p.sequence[i].icon : '?'}
              </span>
            ))}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${p.choices.length <= 4 ? 2 : 3}, 1fr)`,
            gap: 'var(--spacing-sm)',
            width: '100%',
            maxWidth: 620,
          }}>
            {p.choices.map((item) => (
              <button
                key={item.name}
                className="choice-btn"
                onClick={() => handleTap(item)}
                disabled={game.locked}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 'var(--spacing-sm)' }}
              >
                <span style={{ fontSize: '3rem', lineHeight: 1.2 }}>{item.icon}</span>
                <span style={{ fontSize: '1rem' }}>{item.name}</span>
              </button>
            ))}
          </div>
          {game.locked && game.feedback?.type === 'wrong' && (
            <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)', fontWeight: 700 }}>
              The order was: {orderText}
            </p>
          )}
        </>
      )}

      <FeedbackOverlay feedback={game.feedback} />
    </>
  );
}

export function TroubleBrewing({ level, timerMode, onComplete, onBack }) {
  return (
    <GameShell
      title="Trouble Brewing"
      icon="☕"
      category="attention"
      level={level}
      instructions={[
        { icon: '📋', text: 'A drink order appears — remember the drinks and their order.' },
        { icon: '🙈', text: 'Then the order is hidden.' },
        { icon: '👆', text: 'Serve it from memory: tap the drinks in the right order.' },
      ]}
      tip="Say the order to yourself, like a waitress would: “Coffee, then tea.”"
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} timerMode={timerMode} finishGame={finishGame} />}
    </GameShell>
  );
}
