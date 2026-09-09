import React, { useState, useEffect, useRef } from 'react';
import { GameShell, GameHUD, FeedbackOverlay } from '../GameShell';
import { useTrialGame } from '../../hooks/useTrialGame';

const WORDS_BY_LEVEL = {
  1: ['CAT', 'DOG', 'SUN', 'HAT', 'PIG', 'CUP', 'BEE', 'JAR', 'KEY', 'FOX', 'OWL', 'PIE'],
  2: ['LAKE', 'GOLD', 'MILK', 'CORN', 'DUCK', 'FARM', 'WIND', 'SNOW', 'LION', 'NEST', 'SHIP', 'FROG'],
  3: ['LEMON', 'TIGER', 'DANCE', 'SUGAR', 'TABLE', 'LIGHT', 'MUSIC', 'GRAPE', 'STORM', 'PEARL', 'QUILT', 'BERRY'],
  4: ['TURTLE', 'SPRING', 'MARKET', 'BUTTER', 'JACKET', 'SILVER', 'VIOLET', 'CHEESE', 'BRIDGE', 'ROCKET', 'MEADOW', 'PILLOW'],
  5: ['RAINBOW', 'MORNING', 'KITCHEN', 'PICTURE', 'HOLIDAY', 'WEATHER', 'LIBRARY', 'PANCAKE', 'BLANKET', 'CHICKEN', 'DOLPHIN', 'LANTERN'],
};

const TOTAL_TRIALS = 8;

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function scramble(word) {
  let letters = shuffled(word.split(''));
  while (letters.join('') === word) {
    letters = shuffled(word.split(''));
  }
  return { word, letters };
}

function Playfield({ level, finishGame }) {
  // Draw words without replacement so no word repeats within a game.
  const queueRef = useRef(null);
  if (!queueRef.current) queueRef.current = shuffled(WORDS_BY_LEVEL[Math.min(level, 5)]);
  const nextWordRef = useRef(0);

  const game = useTrialGame({
    totalTrials: TOTAL_TRIALS,
    makeProblem: () => {
      const queue = queueRef.current;
      const word = queue[nextWordRef.current % queue.length];
      nextWordRef.current += 1;
      return scramble(word);
    },
    finishGame,
  });
  const p = game.problem;
  const [picked, setPicked] = useState([]); // indices into p.letters, in tap order

  useEffect(() => setPicked([]), [p]);

  const tapTile = (index) => {
    if (game.locked || picked.includes(index)) return;
    const newPicked = [...picked, index];
    setPicked(newPicked);
    if (newPicked.length === p.word.length) {
      const guess = newPicked.map(i => p.letters[i]).join('');
      game.answer(guess === p.word, `The word was ${p.word}`);
    }
  };

  const slotBorder = game.locked
    ? `3px solid var(${game.feedback?.type === 'correct' ? '--success' : '--error'})`
    : null;

  return (
    <>
      <GameHUD trial={game.trial} totalTrials={TOTAL_TRIALS} score={game.score} streak={game.streak} />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Tap the letters in order to spell the word.
      </p>

      <div style={{
        display: 'flex',
        gap: 'var(--spacing-xs)',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: 'var(--spacing-lg)',
      }}>
        {Array.from({ length: p.word.length }, (_, slot) => (
          <div
            key={slot}
            style={{
              width: 76,
              height: 76,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              backgroundColor: slot < picked.length ? 'var(--surface-highlight)' : 'var(--surface-color)',
              border: slotBorder || (slot < picked.length ? '3px solid var(--border-strong)' : '3px dashed var(--border-color)'),
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {slot < picked.length ? p.letters[picked[slot]] : ''}
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: 'var(--spacing-sm)',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 640,
      }}>
        {p.letters.map((letter, index) => {
          const used = picked.includes(index);
          return (
            <button
              key={index}
              className="choice-btn"
              onClick={() => tapTile(index)}
              disabled={used || game.locked}
              style={{
                width: 84,
                height: 84,
                minWidth: 84,
                minHeight: 84,
                padding: 0,
                fontSize: '2rem',
                opacity: used ? 0.25 : 1,
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
        <button
          className="secondary compact"
          style={{ minWidth: 150 }}
          onClick={() => setPicked(picked.slice(0, -1))}
          disabled={picked.length === 0 || game.locked}
        >
          ↩ Undo
        </button>
        <button
          className="secondary compact"
          style={{ minWidth: 150 }}
          onClick={() => setPicked([])}
          disabled={picked.length === 0 || game.locked}
        >
          Clear
        </button>
      </div>

      <FeedbackOverlay feedback={game.feedback} />
    </>
  );
}

export function WordScramble({ level, onComplete, onBack }) {
  return (
    <GameShell
      title="Word Scramble"
      icon="🔠"
      category="language"
      level={level}
      instructions={[
        { icon: '🔀', text: 'The letters of a word are all mixed up.' },
        { icon: '👆', text: 'Tap the letters in order to spell the word — they fill the row above.' },
        { icon: '↩️', text: 'Changed your mind? Undo takes back one letter, Clear starts the word over.' },
      ]}
      tip="Look for letter pairs that like to go together, such as CH, ST, or OW."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}
