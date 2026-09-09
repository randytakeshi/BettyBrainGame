import React from 'react';
import { GameShell, GameHUD, FeedbackOverlay } from '../GameShell';
import { SpeedBonusBar } from '../SpeedBonusBar';
import { useTrialGame } from '../../hooks/useTrialGame';

// Pairs differ by SHAPE, never by color alone — critical for aging eyes.
const EASY_PAIRS = [
  ['🍎', '🍌'], ['🐶', '🐟'], ['🌻', '🌙'], ['🚗', '⛵'], ['⭐', '❤️'], ['🎈', '📚'],
];
const HARD_PAIRS = [
  ['🍎', '🍐'], ['🐶', '🐱'], ['🌷', '🌻'], ['🚗', '🚌'], ['🦆', '🐔'], ['🐟', '🐬'],
];

const TOTAL_TRIALS = 10;

function makeProblem(level) {
  const gridSize = level <= 2 ? 3 : level <= 4 ? 4 : 5;
  const pairs = level === 1 ? EASY_PAIRS : level === 2 ? [...EASY_PAIRS, ...HARD_PAIRS] : HARD_PAIRS;
  const totalItems = gridSize * gridSize;

  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  const [majority, minority] = Math.random() > 0.5 ? pair : [pair[1], pair[0]];
  const targetIndex = Math.floor(Math.random() * totalItems);

  const grid = Array(totalItems).fill(majority);
  grid[targetIndex] = minority;

  return { gridSize, grid, targetIndex, minority };
}

function Playfield({ level, timerMode, finishGame }) {
  const game = useTrialGame({
    totalTrials: TOTAL_TRIALS,
    timerMode,
    makeProblem: () => makeProblem(level),
    finishGame,
  });
  const p = game.problem;

  return (
    <>
      <GameHUD trial={game.trial} totalTrials={TOTAL_TRIALS} score={game.score} streak={game.streak} />
      {timerMode && <SpeedBonusBar duration={90} maxBonus={50} />}

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Tap the one that is different!
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${p.gridSize}, 1fr)`,
        gap: 12,
        maxWidth: 560,
        width: '100%',
      }}>
        {p.grid.map((item, index) => (
          <button
            key={index}
            className={
              'choice-btn' +
              (game.locked && index === p.targetIndex ? ' correct' : '')
            }
            onClick={() => game.answer(index === p.targetIndex, `The ${p.minority} was hiding here`)}
            disabled={game.locked}
            style={{
              fontSize: p.gridSize === 5 ? '2rem' : p.gridSize === 4 ? '2.5rem' : '3rem',
              minHeight: p.gridSize === 5 ? 84 : 100,
              minWidth: 0,
              padding: 4,
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <FeedbackOverlay feedback={game.feedback} />
    </>
  );
}

export function StarSearch({ level, timerMode, onComplete, onBack }) {
  return (
    <GameShell
      title="Star Search"
      icon="⭐"
      category="attention"
      level={level}
      instructions={[
        { icon: '🔍', text: 'One picture in the grid is different from all the others.' },
        { icon: '👆', text: 'Find it and tap it as quickly as you can.' },
        { icon: '🔥', text: 'Get 3 right in a row for bonus points!' },
      ]}
      tip="Scan the grid row by row, like reading a book."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} timerMode={timerMode} finishGame={finishGame} />}
    </GameShell>
  );
}
