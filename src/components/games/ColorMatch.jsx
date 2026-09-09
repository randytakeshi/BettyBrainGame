import React from 'react';
import { GameShell, GameHUD, FeedbackOverlay } from '../GameShell';
import { SpeedBonusBar } from '../SpeedBonusBar';
import { useTrialGame } from '../../hooks/useTrialGame';

// Saturated but dark enough to read clearly on a white card
const COLORS_BY_LEVEL = {
  1: [
    { name: 'RED', hex: '#DC2626' },
    { name: 'BLUE', hex: '#2563EB' },
    { name: 'GREEN', hex: '#15803D' },
  ],
  2: [
    { name: 'RED', hex: '#DC2626' },
    { name: 'BLUE', hex: '#2563EB' },
    { name: 'GREEN', hex: '#15803D' },
    { name: 'PURPLE', hex: '#7C3AED' },
  ],
  3: [
    { name: 'RED', hex: '#DC2626' },
    { name: 'BLUE', hex: '#2563EB' },
    { name: 'GREEN', hex: '#15803D' },
    { name: 'PURPLE', hex: '#7C3AED' },
    { name: 'ORANGE', hex: '#EA580C' },
    { name: 'BROWN', hex: '#92400E' },
  ],
};

const TOTAL_TRIALS = 10;

function makeProblem(level) {
  const colors = COLORS_BY_LEVEL[Math.min(level, 3)];
  const isMatch = Math.random() > 0.5;

  const textMeaning = colors[Math.floor(Math.random() * colors.length)];
  let inkColor = textMeaning;
  if (!isMatch) {
    const wrongColors = colors.filter(c => c.name !== textMeaning.name);
    inkColor = wrongColors[Math.floor(Math.random() * wrongColors.length)];
  }

  return { textMeaning, inkColor, isMatch };
}

function Playfield({ level, timerMode, finishGame }) {
  const game = useTrialGame({
    totalTrials: TOTAL_TRIALS,
    timerMode,
    makeProblem: () => makeProblem(level),
    finishGame,
  });
  const p = game.problem;

  const explain = p.isMatch
    ? `They matched — “${p.textMeaning.name}” written in ${p.inkColor.name.toLowerCase()}`
    : `“${p.textMeaning.name}” was written in ${p.inkColor.name.toLowerCase()}`;

  return (
    <>
      <GameHUD trial={game.trial} totalTrials={TOTAL_TRIALS} score={game.score} streak={game.streak} />
      {timerMode && <SpeedBonusBar duration={90} maxBonus={50} />}

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Does the word's <u>meaning</u> match its <u>ink color</u>?
      </p>

      <div
        className="card"
        style={{
          fontSize: 'clamp(2rem, 10vw, 3.6rem)',
          fontWeight: 700,
          margin: '0 0 var(--spacing-lg)',
          color: p.inkColor.hex,
          width: '100%',
          maxWidth: 560,
        }}
      >
        {p.textMeaning.name}
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', width: '100%', maxWidth: 560 }}>
        <button
          className="choice-btn"
          onClick={() => game.answer(!p.isMatch, explain)}
          disabled={game.locked}
          style={{ flex: 1, fontSize: '1.7rem', borderColor: 'var(--error)', color: 'var(--error-deep)' }}
        >
          ✗ NO
        </button>
        <button
          className="choice-btn"
          onClick={() => game.answer(p.isMatch, explain)}
          disabled={game.locked}
          style={{ flex: 1, fontSize: '1.7rem', borderColor: 'var(--success)', color: 'var(--success-deep)' }}
        >
          ✓ YES
        </button>
      </div>

      <FeedbackOverlay feedback={game.feedback} />
    </>
  );
}

export function ColorMatch({ level, timerMode, onComplete, onBack }) {
  return (
    <GameShell
      title="Color Match"
      icon="🎨"
      category="flexibility"
      level={level}
      instructions={[
        { icon: '🎨', text: 'A color word appears, written in colored ink.' },
        { icon: '🤔', text: 'Does the word’s meaning match the color of its ink? The word RED written in red ink is a match.' },
        { icon: '👆', text: 'Tap YES if they match, NO if they don’t.' },
      ]}
      tip="Tricky! Focus on the ink color first, then check the word."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} timerMode={timerMode} finishGame={finishGame} />}
    </GameShell>
  );
}
