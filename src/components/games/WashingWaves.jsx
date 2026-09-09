import React, { useState, useRef } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';
import { SpeedBonusBar } from '../SpeedBonusBar';
import './WashingWaves.css';

const ITEMS = ['🐚', '🦀', '🐠', '🐬', '🐙', '🐢', '🦞', '🐡', '🐋', '🦈', '🦭', '🐊'];

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function Playfield({ level, timerMode, finishGame }) {
  const numItems = Math.min(4 + (level - 1), 8);
  const maxMistakes = 2;

  const [items, setItems] = useState(() => shuffled(ITEMS).slice(0, numItems));
  const [picked, setPicked] = useState(() => new Set());
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [waving, setWaving] = useState(false);
  const { feedback, showFeedback } = useFeedback(900);
  const startTime = useRef(Date.now());

  const endGame = (finalScore, found, mistakeCount) => {
    let bonus = 0;
    if (timerMode) {
      const elapsed = (Date.now() - startTime.current) / 1000;
      bonus = Math.max(0, Math.floor(50 * (1 - elapsed / 90)));
    }
    finishGame({
      score: finalScore + bonus,
      correct: found,
      total: numItems,
      isPerfect: found === numItems && mistakeCount === 0,
    });
  };

  const sweepAndShuffle = (after) => {
    setWaving(true);
    setTimeout(() => setItems(prev => shuffled(prev)), 450);
    setTimeout(() => {
      setWaving(false);
      setLocked(false);
      if (after) after();
    }, 950);
  };

  const handlePick = (item) => {
    if (locked) return;

    if (picked.has(item)) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      showFeedback('wrong', `You already collected the ${item}`);
      setLocked(true);
      setTimeout(() => {
        if (newMistakes >= maxMistakes) {
          endGame(score, picked.size, newMistakes);
        } else {
          sweepAndShuffle();
        }
      }, 1000);
      return;
    }

    const newPicked = new Set(picked);
    newPicked.add(item);
    const newScore = score + 100;
    setPicked(newPicked);
    setScore(newScore);
    setLocked(true);

    if (newPicked.size === numItems) {
      showFeedback('correct', 'You found every treasure!');
      setTimeout(() => endGame(newScore + 200, numItems, mistakes), 1000);
    } else {
      showFeedback('correct');
      setTimeout(() => sweepAndShuffle(), 500);
    }
  };

  return (
    <>
      <GameHUD
        score={score}
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Collected</span>
              <span className="hud-value">{picked.size} of {numItems}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Chances</span>
              <span className="hud-value">
                {Array.from({ length: maxMistakes }, (_, i) => (i < maxMistakes - mistakes ? '❤️' : '🩶')).join(' ')}
              </span>
            </div>
          </>
        }
      />
      {timerMode && <SpeedBonusBar duration={90} maxBonus={50} />}

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        The wave shuffles the beach — tap a creature you haven't collected yet.
      </p>

      <div className="beach-pane">
        <div className={`ocean-wave ${waving ? 'wave-crashing' : ''}`} />
        {items.map((item) => (
          <button
            key={item}
            className="choice-btn"
            style={{ width: 128, height: 128, fontSize: '3.4rem', borderRadius: '50%', minWidth: 0 }}
            onClick={() => handlePick(item)}
            disabled={locked}
          >
            {item}
          </button>
        ))}
      </div>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function WashingWaves({ level, timerMode, onComplete, onBack }) {
  return (
    <GameShell
      title="Tidal Treasures"
      icon="🌊"
      category="memory"
      level={level}
      instructions={[
        { icon: '🏖️', text: 'Sea creatures lie on the beach — tap one to collect it.' },
        { icon: '🌊', text: 'A wave sweeps through and shuffles them around!' },
        { icon: '❤️', text: 'Remember which ones you already collected. You have 2 chances.' },
      ]}
      tip="Remember the creatures themselves, not where they sit — the wave moves them."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} timerMode={timerMode} finishGame={finishGame} />}
    </GameShell>
  );
}
