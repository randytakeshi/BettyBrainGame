import React from 'react';
import { GameShell, GameHUD, FeedbackOverlay } from '../GameShell';
import { SpeedBonusBar } from '../SpeedBonusBar';
import { useTrialGame } from '../../hooks/useTrialGame';
import './RapidSwipe.css';

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
  ],
};

const TOTAL_TRIALS = 10;

// The real Lumosity task: compare the TOP card's meaning with the
// BOTTOM card's ink color. Both cards show (possibly different) words.
function makeProblem(level) {
  const colors = COLORS_BY_LEVEL[Math.min(level, 3)];
  const pick = () => colors[Math.floor(Math.random() * colors.length)];

  const topMeaning = pick();          // word on the top card (plain ink)
  const bottomWord = pick();          // word on the bottom card (meaning is a decoy)
  const isMatch = Math.random() > 0.5;

  let bottomInk = topMeaning;
  if (!isMatch) {
    const others = colors.filter(c => c.name !== topMeaning.name);
    bottomInk = others[Math.floor(Math.random() * others.length)];
  }

  return { topMeaning, bottomWord, bottomInk, isMatch };
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
    ? 'They matched!'
    : `The ink was ${p.bottomInk.name.toLowerCase()}, not ${p.topMeaning.name.toLowerCase()}`;

  const cardStyle = {
    fontSize: 'clamp(1.7rem, 8vw, 2.6rem)',
    fontWeight: 700,
    padding: 'var(--spacing-md) var(--spacing-xl)',
    backgroundColor: 'var(--surface-color)',
    borderRadius: 'var(--radius-md)',
    border: '3px solid var(--border-strong)',
    minWidth: 'min(300px, 84vw)',
    textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
  };

  return (
    <>
      <GameHUD trial={game.trial} totalTrials={TOTAL_TRIALS} score={game.score} streak={game.streak} />
      {timerMode && <SpeedBonusBar duration={90} maxBonus={50} />}

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Does the bottom card's <u>ink color</u> match the top card's <u>word</u>?
      </p>

      <div style={{
        width: '100%',
        maxWidth: 620,
        background: 'linear-gradient(180deg, #FFF9EF 0%, #F7EDDC 100%)',
        border: '3px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-lg)',
        overflow: 'hidden',
      }}>
        <div className={`swipe-card ${game.locked ? 'slide-out-correct' : 'slide-in'}`} key={game.trial}>
          <div style={cardStyle}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>THE WORD</div>
            {p.topMeaning.name}
          </div>
          <div style={{ ...cardStyle, color: p.bottomInk.hex }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>THE INK</div>
            {p.bottomWord.name}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', width: '100%', maxWidth: 620 }}>
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

export function RapidSwipe({ level, timerMode, onComplete, onBack }) {
  return (
    <GameShell
      title="Color Match"
      icon="🎨"
      category="flexibility"
      level={level}
      instructions={[
        { icon: '🃏', text: 'Two cards slide in. The TOP card shows a color word.' },
        { icon: '🎨', text: 'Look at the INK COLOR of the bottom card — ignore what it says!' },
        { icon: '👆', text: 'Tap YES if the bottom ink matches the top word, NO if it doesn’t.' },
      ]}
      tip="Read the top card, then squint at the bottom card's color only."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} timerMode={timerMode} finishGame={finishGame} />}
    </GameShell>
  );
}
