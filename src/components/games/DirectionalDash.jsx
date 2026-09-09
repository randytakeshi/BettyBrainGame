import React from 'react';
import { GameShell, GameHUD, FeedbackOverlay } from '../GameShell';
import { useTrialGame } from '../../hooks/useTrialGame';

const DIRS = [
  { arrow: '⬆️', label: 'Up' },
  { arrow: '⬇️', label: 'Down' },
  { arrow: '⬅️', label: 'Left' },
  { arrow: '➡️', label: 'Right' },
];

const TOTAL_TRIALS = 10;

function makeProblem(level) {
  const target = DIRS[Math.floor(Math.random() * DIRS.length)];
  const incongruentChance = Math.min(0.15 + level * 0.15, 0.75);

  let flanker = target;
  if (Math.random() < incongruentChance) {
    const others = DIRS.filter(d => d !== target);
    flanker = others[Math.floor(Math.random() * others.length)];
  }

  return { target, flanker };
}

function Playfield({ level, finishGame }) {
  const game = useTrialGame({
    totalTrials: TOTAL_TRIALS,
    makeProblem: () => makeProblem(level),
    finishGame,
  });
  const p = game.problem;
  const row = [p.flanker, p.flanker, p.target, p.flanker, p.flanker];

  return (
    <>
      <GameHUD trial={game.trial} totalTrials={TOTAL_TRIALS} score={game.score} streak={game.streak} />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Which way does the MIDDLE arrow point?
      </p>

      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
          margin: '0 0 var(--spacing-lg)',
          width: '100%',
        }}
      >
        {/* All five arrows are styled identically — only the dashed line under
            the center position marks which one to answer for. */}
        {row.map((dir, i) => (
          <span
            key={i}
            style={{
              fontSize: '2.6rem',
              lineHeight: 1,
              paddingBottom: 8,
              borderBottom: i === 2 ? '5px dashed var(--border-strong)' : '5px solid transparent',
            }}
          >
            {dir.arrow}
          </span>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--spacing-md)',
        width: '100%',
        maxWidth: 540,
      }}>
        {DIRS.map((dir) => (
          <button
            key={dir.label}
            className="choice-btn"
            style={{
              fontSize: '1.6rem',
              minHeight: 110,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-xs)',
            }}
            onClick={() => game.answer(dir === p.target, `The middle arrow pointed ${p.target.label.toLowerCase()}`)}
            disabled={game.locked}
          >
            <span style={{ fontSize: '2.2rem' }} aria-hidden="true">{dir.arrow}</span>
            {dir.label}
          </button>
        ))}
      </div>

      <FeedbackOverlay feedback={game.feedback} />
    </>
  );
}

export function DirectionalDash({ level, onComplete, onBack }) {
  return (
    <GameShell
      title="Directional Dash"
      icon="➡️"
      category="speed"
      level={level}
      instructions={[
        { icon: '➡️', text: 'Five arrows appear in a row.' },
        { icon: '🎯', text: 'Look only at the MIDDLE arrow — the one above the dashed line.' },
        { icon: '👆', text: 'Tap the button that matches its direction.' },
      ]}
      tip="The outside arrows may try to trick you — keep your eyes on the center."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}
