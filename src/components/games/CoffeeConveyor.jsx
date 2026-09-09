import React from 'react';
import { GameShell, GameHUD, FeedbackOverlay } from '../GameShell';
import { SpeedBonusBar } from '../SpeedBonusBar';
import { useTrialGame } from '../../hooks/useTrialGame';
import './CoffeeConveyor.css';

const ITEMS = [
  { name: 'Coffee', icon: '☕' },
  { name: 'Tea', icon: '🍵' },
  { name: 'Milk', icon: '🥛' },
  { name: 'Juice', icon: '🧃' },
  { name: 'Hot Cocoa', icon: '🍫' },
  { name: 'Soda', icon: '🥤' },
];

const TOTAL_TRIALS = 8;

function makeProblem(level) {
  const numChoices = level <= 1 ? 4 : level === 2 ? 5 : 6;
  const choices = [...ITEMS].sort(() => Math.random() - 0.5).slice(0, numChoices);
  const target = choices[Math.floor(Math.random() * choices.length)];
  return { target, choices };
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

  const slideSeconds = [0, 14, 12, 10, 9, 8][Math.min(level, 5)];

  return (
    <>
      <GameHUD trial={game.trial} totalTrials={TOTAL_TRIALS} score={game.score} streak={game.streak} />
      {timerMode && <SpeedBonusBar duration={120} maxBonus={50} />}

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Read the ticket, then tap the matching drink before it rolls away!
      </p>

      <div className="conveyor-pane">
        <div className="conveyor-belt" />
        {!game.locked && (
          <div
            className="conveyor-item"
            key={game.trial}
            style={{ animationDuration: `${slideSeconds}s` }}
            onAnimationEnd={() => game.answer(false, `It rolled away! The order was ${p.target.icon} ${p.target.name}`)}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
              ORDER TICKET
            </span>
            {/* Name only — she must translate the word into the right drink */}
            <span style={{ fontSize: '1.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {p.target.name}
            </span>
          </div>
        )}
        {game.locked && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: '2rem', fontWeight: 700,
            color: game.feedback?.type === 'correct' ? 'var(--success)' : 'var(--error)',
          }}>
            <span style={{ fontSize: '3.4rem' }}>{p.target.icon}</span>
            {p.target.name}
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${p.choices.length <= 4 ? 2 : 3}, 1fr)`,
        gap: 'var(--spacing-sm)',
        width: '100%',
        maxWidth: 620,
      }}>
        {p.choices.map((choice) => (
          <button
            key={choice.name}
            className="choice-btn"
            onClick={() => game.answer(choice.name === p.target.name, `The order was ${p.target.icon} ${p.target.name}`)}
            disabled={game.locked}
            style={{ fontSize: '3rem', minHeight: 110, padding: 'var(--spacing-sm)' }}
            aria-label={choice.name}
          >
            {choice.icon}
          </button>
        ))}
      </div>

      <FeedbackOverlay feedback={game.feedback} />
    </>
  );
}

export function CoffeeConveyor({ level, timerMode, onComplete, onBack }) {
  return (
    <GameShell
      title="Trouble Brewing"
      icon="☕"
      category="attention"
      level={level}
      instructions={[
        { icon: '🎫', text: 'An order ticket glides along the conveyor belt — it shows a drink’s name.' },
        { icon: '👆', text: 'Tap the picture of that drink before the ticket rolls off the end.' },
        { icon: '🔥', text: 'Get 3 right in a row for bonus points!' },
      ]}
      tip="The belt moves slowly — read the ticket calmly, then pick."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} timerMode={timerMode} finishGame={finishGame} />}
    </GameShell>
  );
}
