import React from 'react';
import { GameShell, GameHUD, FeedbackOverlay } from '../GameShell';
import { SpeedBonusBar } from '../SpeedBonusBar';
import { useTrialGame } from '../../hooks/useTrialGame';
import './FloatingBubbles.css';

const WORDS_BY_LEVEL = {
  1: ['CAT', 'DOG', 'SUN', 'BUS', 'CAR', 'PEN', 'HAT', 'BOX', 'CUP', 'BED', 'MAP', 'JAM'],
  2: ['BIRD', 'MOON', 'STAR', 'TREE', 'BOOK', 'ROSE', 'FISH', 'SHOE', 'CAKE', 'LAMP', 'RAIN', 'SONG'],
  3: ['APPLE', 'HOUSE', 'CHAIR', 'TRAIN', 'CLOCK', 'BREAD', 'WATER', 'HEART', 'PIANO', 'BEACH', 'CLOUD', 'SMILE'],
  4: ['ORANGE', 'PLANET', 'FLOWER', 'GUITAR', 'MIRROR', 'CAMERA', 'PENCIL', 'GARDEN', 'WINDOW', 'SUMMER', 'BASKET', 'CANDLE'],
  5: ['BICYCLE', 'DIAMOND', 'ELEPHANT', 'UMBRELLA', 'HOSPITAL', 'TELEPHONE', 'MOUNTAIN', 'SANDWICH', 'TREASURE', 'PAINTING', 'ORCHESTRA', 'BUTTERFLY'],
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const TOTAL_TRIALS = 8;

function makeProblem(level) {
  const words = WORDS_BY_LEVEL[Math.min(level, 5)];
  const word = words[Math.floor(Math.random() * words.length)];
  const missingIndex = Math.floor(Math.random() * word.length);
  const correctLetter = word[missingIndex];

  const wrongLetters = new Set();
  while (wrongLetters.size < 2) {
    const letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (letter !== correctLetter) wrongLetters.add(letter);
  }

  return {
    word,
    prefix: word.slice(0, missingIndex),
    suffix: word.slice(missingIndex + 1),
    correctLetter,
    choices: [correctLetter, ...wrongLetters].sort(() => Math.random() - 0.5),
  };
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

  // Unhurried floats — the time pressure is gentle even at level 5
  const floatSeconds = [0, 16, 14, 12, 10, 9][Math.min(level, 5)];

  // Bubble grows to fit the word so long words never overflow (capped for phones)
  const bubbleSize = Math.min(330, Math.max(210, 80 + p.word.length * 26));
  const fontSize = p.word.length > 7 ? '1.5rem' : p.word.length > 5 ? '1.8rem' : '2.2rem';

  return (
    <>
      <GameHUD trial={game.trial} totalTrials={TOTAL_TRIALS} score={game.score} streak={game.streak} />
      {timerMode && <SpeedBonusBar duration={120} maxBonus={50} />}

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Complete the word before the bubble floats away!
      </p>

      <div className="bubble-pane">
        {!game.locked && (
          <div
            className="floating-bubble"
            key={game.trial}
            style={{
              width: `min(${bubbleSize}px, 86vw)`,
              aspectRatio: '1',
              fontSize,
              animationDuration: `${floatSeconds}s`,
              '--float-distance': `${420 + bubbleSize + 60}px`,
            }}
            onAnimationEnd={() => game.answer(false, `It floated away! The word was ${p.word}`)}
          >
            {p.prefix}
            <span style={{ borderBottom: '4px solid #1E3A8A', minWidth: '0.7em', display: 'inline-block' }}>&nbsp;</span>
            {p.suffix}
          </div>
        )}
        {game.locked && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.6rem', fontWeight: 700, letterSpacing: '0.2em',
            color: game.feedback?.type === 'correct' ? 'var(--success)' : 'var(--error)',
          }}>
            {p.word}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {p.choices.map((choice, i) => (
          <button
            key={i}
            className="choice-btn"
            style={{ width: 'min(130px, 24vw)', aspectRatio: '1', minWidth: 0, fontSize: 'clamp(1.6rem, 7vw, 3rem)', borderRadius: '50%' }}
            onClick={() => game.answer(choice === p.correctLetter, `The word was ${p.word}`)}
            disabled={game.locked}
          >
            {choice}
          </button>
        ))}
      </div>

      <FeedbackOverlay feedback={game.feedback} />
    </>
  );
}

export function FloatingBubbles({ level, timerMode, onComplete, onBack }) {
  return (
    <GameShell
      title="Word Bubbles"
      icon="🫧"
      category="language"
      level={level}
      instructions={[
        { icon: '🫧', text: 'A word rises inside a bubble — one letter is missing.' },
        { icon: '👆', text: 'Tap the correct letter before the bubble floats off the top.' },
        { icon: '🔥', text: 'Get 3 right in a row for bonus points!' },
      ]}
      tip="The bubble rises slowly — read the whole word first, then choose."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} timerMode={timerMode} finishGame={finishGame} />}
    </GameShell>
  );
}
