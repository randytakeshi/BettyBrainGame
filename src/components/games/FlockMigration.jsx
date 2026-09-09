import React from 'react';
import { GameShell, GameHUD, FeedbackOverlay } from '../GameShell';
import { SpeedBonusBar } from '../SpeedBonusBar';
import { useTrialGame } from '../../hooks/useTrialGame';
import './FlockMigration.css';

const DIRECTIONS = [
  { name: 'UP', symbol: '▲' },
  { name: 'DOWN', symbol: '▼' },
  { name: 'LEFT', symbol: '◀' },
  { name: 'RIGHT', symbol: '▶' },
];

const TOTAL_TRIALS = 10;

// A flanker task only works if the center bird looks exactly like the rest —
// it is identified by POSITION (the middle of the cross), never by color.
function makeProblem(level) {
  const targetDir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

  // At level 1 the flock mostly agrees with the leader; higher levels disagree more
  const conflictChance = Math.min(0.25 + level * 0.12, 0.8);
  const flankers = Array.from({ length: 4 }, () => {
    if (Math.random() < conflictChance) {
      const others = DIRECTIONS.filter(d => d.name !== targetDir.name);
      return others[Math.floor(Math.random() * others.length)];
    }
    return targetDir;
  });

  const driftTypes = ['drift-left', 'drift-right', 'drift-up', 'drift-down'];
  const driftClass = driftTypes[Math.floor(Math.random() * driftTypes.length)];

  return { targetDir, flankers, driftClass };
}

function Bird({ dir, isCenter }) {
  return (
    <div style={{
      fontSize: '3rem',
      lineHeight: 1,
      color: '#365314',
      width: 84,
      height: 84,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      border: isCenter ? '4px dashed #94A3B8' : '4px solid transparent',
    }}>
      {dir.symbol}
    </div>
  );
}

function Playfield({ level, timerMode, finishGame }) {
  const game = useTrialGame({
    totalTrials: TOTAL_TRIALS,
    timerMode,
    makeProblem: () => makeProblem(level),
    finishGame,
  });
  const p = game.problem;

  const answer = (dirName) =>
    game.answer(dirName === p.targetDir.name, `The middle bird pointed ${p.targetDir.name.toLowerCase()}`);

  const arrowBtn = (dir, gridArea, symbol) => (
    <button
      className="choice-btn"
      style={{ gridArea, fontSize: '1.3rem', padding: 'var(--spacing-sm)' }}
      onClick={() => answer(dir)}
      disabled={game.locked}
    >
      {symbol} {dir}
    </button>
  );

  return (
    <>
      <GameHUD trial={game.trial} totalTrials={TOTAL_TRIALS} score={game.score} streak={game.streak} />
      {timerMode && <SpeedBonusBar duration={90} maxBonus={50} />}

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Which way is the bird in the <u>middle</u> pointing?
      </p>

      <div className="flock-pane">
        <div
          className={game.locked ? '' : p.driftClass}
          style={{
            display: 'grid',
            gridTemplateAreas: `". t ." "l c r" ". b ."`,
            gap: 8,
          }}
        >
          <div style={{ gridArea: 't', justifySelf: 'center' }}><Bird dir={p.flankers[0]} /></div>
          <div style={{ gridArea: 'l' }}><Bird dir={p.flankers[1]} /></div>
          <div style={{ gridArea: 'c' }}><Bird dir={p.targetDir} isCenter /></div>
          <div style={{ gridArea: 'r' }}><Bird dir={p.flankers[2]} /></div>
          <div style={{ gridArea: 'b', justifySelf: 'center' }}><Bird dir={p.flankers[3]} /></div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateAreas: `". up ." "left down right"`,
        gap: 'var(--spacing-sm)',
        width: '100%',
        maxWidth: 560,
        margin: '0 auto',
      }}>
        {arrowBtn('UP', 'up', '▲')}
        {arrowBtn('LEFT', 'left', '◀')}
        {arrowBtn('DOWN', 'down', '▼')}
        {arrowBtn('RIGHT', 'right', '▶')}
      </div>

      <FeedbackOverlay feedback={game.feedback} />
    </>
  );
}

export function FlockMigration({ level, timerMode, onComplete, onBack }) {
  return (
    <GameShell
      title="Star Search"
      icon="🐦"
      category="attention"
      level={level}
      instructions={[
        { icon: '🐦', text: 'A flock of five birds drifts across the sky.' },
        { icon: '🎯', text: 'Watch only the bird in the middle (inside the dashed circle).' },
        { icon: '👆', text: 'Tap the direction the middle bird is pointing — ignore the others!' },
      ]}
      tip="The outer birds try to fool you. Keep your eyes on the middle."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} timerMode={timerMode} finishGame={finishGame} />}
    </GameShell>
  );
}
