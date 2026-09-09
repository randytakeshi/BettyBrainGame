import React from 'react';
import { GameShell, GameHUD, FeedbackOverlay } from '../GameShell';
import { useTrialGame } from '../../hooks/useTrialGame';

// Every swap changes the SHAPE of the picture, never just its color.
const EASY_PAIRS = [
  ['🍎', '🍌'],
  ['🐟', '🐦'],
  ['⭐', '🌙'],
  ['🚗', '⛵'],
  ['🌸', '🍄'],
  ['☂️', '🎩'],
];

// Level 5: still shape-distinct, but the swapped picture is a closer cousin.
const HARD_PAIRS = [
  ['🍎', '🍐'],
  ['🐶', '🐱'],
  ['🚗', '🚌'],
  ['🌷', '🌻'],
  ['👒', '🎩'],
  ['🥄', '🍴'],
];

const TOTAL_TRIALS = 5;

function makeProblem(level) {
  const size = level <= 2 ? 3 : 4;
  const pairs = level >= 5 ? HARD_PAIRS : EASY_PAIRS;
  const cells = size * size;

  const pool = pairs.map((p) => p[0]);
  const topGrid = Array.from({ length: cells }, () => pool[Math.floor(Math.random() * pool.length)]);

  const diffIndex = Math.floor(Math.random() * cells);
  const original = topGrid[diffIndex];
  const changed = pairs.find((p) => p[0] === original)[1];
  const bottomGrid = [...topGrid];
  bottomGrid[diffIndex] = changed;

  return { size, topGrid, bottomGrid, diffIndex, original, changed };
}

function Playfield({ level, finishGame }) {
  const game = useTrialGame({
    totalTrials: TOTAL_TRIALS,
    makeProblem: () => makeProblem(level),
    finishGame,
  });
  const p = game.problem;
  const gridMaxWidth = p.size * 96 + 40;

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${p.size}, 1fr)`,
    gap: 6,
    width: '100%',
    maxWidth: gridMaxWidth,
    backgroundColor: 'var(--surface-color)',
    padding: 10,
    borderRadius: 'var(--radius-lg)',
    border: '2px solid var(--border-color)',
  };

  return (
    <>
      <GameHUD trial={game.trial} totalTrials={TOTAL_TRIALS} score={game.score} streak={game.streak} />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        One picture in the bottom grid changed. Tap it!
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        width: '100%',
      }}>
        {/* Top grid: the original, just for looking */}
        <div style={gridStyle}>
          {p.topGrid.map((emoji, i) => (
            <div
              key={`a-${i}`}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.4rem',
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        <div style={{ fontSize: '1.6rem', color: 'var(--text-secondary)' }} aria-hidden="true">⬇️</div>

        {/* Bottom grid: tap the changed cell */}
        <div style={gridStyle}>
          {p.bottomGrid.map((emoji, i) => {
            const revealDiff = game.locked && i === p.diffIndex;
            return (
              <button
                key={`b-${i}`}
                onClick={() => game.answer(i === p.diffIndex, `The ${p.changed} replaced the ${p.original}`)}
                disabled={game.locked}
                style={{
                  aspectRatio: '1',
                  minWidth: 0,
                  minHeight: 84,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.4rem',
                  backgroundColor: revealDiff ? 'var(--success-soft)' : 'var(--surface-alt)',
                  border: revealDiff ? '4px solid var(--success)' : '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: game.locked ? 'default' : 'pointer',
                  opacity: 1,
                }}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>

      <FeedbackOverlay feedback={game.feedback} />
    </>
  );
}

export function SpotTheDifference({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Spot the Difference"
      icon="👀"
      category="attention"
      level={level}
      instructions={[
        { icon: '👀', text: 'Two grids of pictures appear — top and bottom.' },
        { icon: '🔍', text: 'They match everywhere except ONE square in the bottom grid.' },
        { icon: '👆', text: 'Tap the square that changed. There are 5 rounds.' },
      ]}
      tip="Compare the grids one row at a time, like reading a book."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}
