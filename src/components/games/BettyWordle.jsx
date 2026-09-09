import React, { useState } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

// Curated list of satisfying, common 5-letter words
const DICTIONARY = [
  'APPLE', 'BRAIN', 'CHAIR', 'DANCE', 'EAGLE', 'FLAME', 'GRAPE', 'HEART', 'IGLOO', 'JUICE',
  'KNIFE', 'LEMON', 'MOUSE', 'NIGHT', 'OCEAN', 'PIZZA', 'QUEEN', 'RIVER', 'SNAKE', 'TRAIN',
  'UMBRA', 'VOICE', 'WATER', 'XENON', 'YACHT', 'ZEBRA', 'PLANT', 'SUGAR', 'BREAD', 'SMART',
  'HAPPY', 'SMILE', 'LAUGH', 'DREAM', 'PEACE', 'LUCKY', 'SHINE', 'BLOOM', 'LIGHT', 'SWEET',
  'HOUSE', 'WORLD', 'MUSIC', 'MAGIC', 'PARTY', 'GHOST', 'ALIEN', 'ROBOT', 'SPACE', 'EARTH',
  'ABOUT', 'AFTER', 'AGAIN', 'ALONE', 'AMONG', 'ANGRY', 'ARENA', 'AWAKE', 'BACON', 'BADGE',
  'BAKER', 'BASIC', 'BEACH', 'BEARD', 'BEAST', 'BEGIN', 'BEING', 'BELLY', 'BERRY', 'BINGO',
  'BLACK', 'BLADE', 'BLAME', 'BLANK', 'BLAST', 'BLEED', 'BLEND', 'BLIND', 'BLOCK', 'BLOOD',
  'BOARD', 'BOAST', 'BONUS', 'BOOST', 'BRASS', 'BRAVE', 'BREAK', 'BRICK', 'BRING', 'BROAD',
  'BROKE', 'BROWN', 'BRUSH', 'BUILD', 'BUNCH', 'BUYER', 'CABIN', 'CABLE', 'CAMEL', 'CANDY',
  'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAMP', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEEK',
  'CHEER', 'CHESS', 'CHIEF', 'CHILD', 'CHILL', 'CHOIR', 'CHOKE', 'CIVIL', 'CLAIM', 'CLASS',
  'CLEAN', 'CLEAR', 'CLICK', 'CLOCK', 'CLOSE', 'COAST', 'COLOR', 'COMIC', 'COUGH', 'COULD',
  'COUNT', 'COURT', 'COVER', 'CRACK', 'CRAFT', 'CRASH', 'CRAZY', 'CREAM', 'CRIME', 'CROSS',
  'CROWD', 'CROWN', 'CRUEL', 'CRUSH', 'CURVE', 'CYCLE', 'DAILY', 'DEATH', 'DELAY', 'DEPTH',
  'DEVIL', 'DIARY', 'DIRTY', 'DISCO', 'DONOR', 'DOUBT', 'DOUGH', 'DRAFT', 'DRAMA', 'DRESS',
  'DRINK', 'DRIVE', 'EARLY', 'EIGHT', 'ELITE', 'EMPTY', 'ENEMY', 'ENJOY', 'ENTER', 'EQUAL',
  'ERROR', 'EVENT', 'EXACT', 'EXIST', 'EXTRA', 'FAITH', 'FALSE', 'FAULT', 'FAVOR', 'FIELD',
  'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FLASH', 'FLEET', 'FLESH', 'FLOOR', 'FLOUR',
  'FLUID', 'FOCUS', 'FORCE', 'FORTH', 'FORTY', 'FOUND', 'FRAME', 'FRANK', 'FRAUD', 'FRESH',
  'FRONT', 'FRUIT', 'GLASS', 'GLOBE', 'GLORY', 'GRACE', 'GRAND', 'GRANT', 'GRASS', 'GREAT'
];

const MAX_GUESSES = 6;

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
];

const checkGuess = (guess, target) => {
  const result = Array(5).fill('absent');
  const targetChars = target.split('');
  const guessChars = guess.split('');

  // 1. Exact matches
  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === targetChars[i]) {
      result[i] = 'correct';
      targetChars[i] = null; // consume
    }
  }

  // 2. Present matches (right letter, wrong spot)
  for (let i = 0; i < 5; i++) {
    if (result[i] !== 'correct' && targetChars.includes(guessChars[i])) {
      result[i] = 'present';
      targetChars[targetChars.indexOf(guessChars[i])] = null; // consume
    }
  }
  return result;
};

// Solid, readable state colors for the warm light theme.
const styleFor = (status) => {
  switch (status) {
    case 'correct':
      return { backgroundColor: 'var(--success)', color: 'var(--text-on-dark)' };
    case 'present':
      return { backgroundColor: '#B45309', color: 'var(--text-on-dark)' };
    case 'absent':
      return { backgroundColor: 'var(--surface-highlight)', color: 'var(--text-secondary)' };
    default:
      return null;
  }
};

function Playfield({ finishGame }) {
  const [targetWord] = useState(() => DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)]);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing' | 'won' | 'lost'
  const [shaking, setShaking] = useState(false);
  const { feedback, showFeedback } = useFeedback(1400);

  const handleKeyPress = (key) => {
    if (gameStatus !== 'playing') return;

    if (key === 'ENTER') {
      if (currentGuess.length !== 5) {
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
        showFeedback('wrong', 'Not enough letters');
        return;
      }

      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      setCurrentGuess('');

      if (currentGuess === targetWord) {
        const g = newGuesses.length;
        setGameStatus('won');
        showFeedback('correct', `You got it in ${g} ${g === 1 ? 'guess' : 'guesses'}!`);
        setTimeout(() => finishGame({
          score: Math.max(300, 800 - 100 * (g - 1)),
          correct: 1,
          total: 1,
          isPerfect: g <= 3,
        }), 1500);
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameStatus('lost');
        showFeedback('wrong', `The word was ${targetWord}`);
        setTimeout(() => finishGame({
          score: 100,
          correct: 0,
          total: 1,
          isPerfect: false,
        }), 1800);
      }
    } else if (key === 'DEL') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  // Best-known status per keyboard letter (absent → present → correct)
  const keyStatus = {};
  guesses.forEach(guess => {
    const result = checkGuess(guess, targetWord);
    guess.split('').forEach((letter, i) => {
      const status = result[i];
      if (!keyStatus[letter] || status === 'correct' || (status === 'present' && keyStatus[letter] !== 'correct')) {
        keyStatus[letter] = status;
      }
    });
  });

  return (
    <>
      <GameHUD
        extra={
          <div className="hud-item">
            <span className="hud-label">Guess</span>
            <span className="hud-value">
              {Math.min(guesses.length + (gameStatus === 'playing' ? 1 : 0), MAX_GUESSES)} of {MAX_GUESSES}
            </span>
          </div>
        }
      />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
        maxWidth: 5 * 72 + 4 * 8,
        marginBottom: 'var(--spacing-lg)',
      }}>
        {Array.from({ length: MAX_GUESSES }, (_, rowIndex) => {
          const isCurrentRow = rowIndex === guesses.length && gameStatus === 'playing';
          const rowWord = rowIndex < guesses.length ? guesses[rowIndex] : isCurrentRow ? currentGuess : '';
          const rowResult = rowIndex < guesses.length ? checkGuess(rowWord, targetWord) : null;

          return (
            <div
              key={rowIndex}
              className={shaking && isCurrentRow ? 'shake' : undefined}
              style={{ display: 'flex', gap: 8, justifyContent: 'center' }}
            >
              {Array.from({ length: 5 }, (_, colIndex) => {
                const letter = rowWord[colIndex] || '';
                const status = rowResult ? rowResult[colIndex] : null;
                const stateStyle = styleFor(status);

                return (
                  <div key={colIndex} style={{
                    width: 'min(72px, 15.5vw)',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface-color)',
                    border: `3px solid ${letter ? 'var(--border-strong)' : 'var(--border-color)'}`,
                    color: 'var(--text-primary)',
                    transition: 'background-color 0.3s, border-color 0.3s',
                    ...(stateStyle ? { ...stateStyle, border: '3px solid transparent' } : null),
                  }}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 600 }}>
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
            paddingInline: i === 1 ? '4%' : 0,
          }}>
            {row.map(key => {
              const isSpecial = key === 'ENTER' || key === 'DEL';
              const stateStyle = styleFor(keyStatus[key]);
              return (
                <button
                  key={key}
                  className="compact"
                  onClick={() => handleKeyPress(key)}
                  disabled={gameStatus !== 'playing'}
                  style={{
                    flex: isSpecial ? 1.6 : 1,
                    padding: '8px 0',
                    fontSize: isSpecial ? '0.85rem' : '1.2rem',
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-primary)',
                    border: '2px solid var(--border-strong)',
                    ...(stateStyle ? { ...stateStyle, border: '2px solid transparent' } : null),
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function BettyWordle({ level, onComplete, onBack }) {
  return (
    <GameShell
      title="Betty Wordle"
      icon="🟩"
      category="language"
      level={level}
      instructions={[
        { icon: '🟩', text: 'Guess the secret 5-letter word. You have 6 tries.' },
        { icon: '⌨️', text: 'Type a word and press ENTER. Green means right letter, right spot; amber means right letter, wrong spot.' },
        { icon: '🔤', text: 'Faded letters are not in the word — use every clue for your next guess.' },
      ]}
      tip="Start with a word full of common letters, like ARISE or TRAIN."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield finishGame={finishGame} />}
    </GameShell>
  );
}
