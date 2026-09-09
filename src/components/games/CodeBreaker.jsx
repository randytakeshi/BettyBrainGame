import React, { useState } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

// Shape-distinct symbols in distinct dark colors — never color alone.
const SYMBOLS = [
  { id: 'circle', glyph: '●', color: '#DC2626' },
  { id: 'triangle', glyph: '▲', color: '#2563EB' },
  { id: 'square', glyph: '■', color: '#15803D' },
  { id: 'star', glyph: '★', color: '#B45309' },
  { id: 'diamond', glyph: '◆', color: '#7C3AED' },
  { id: 'heart', glyph: '♥︎', color: '#EA580C' },
];

const CODE_LENGTH = 4;

const PEG_STYLES = {
  exact: { background: 'var(--success)', glyph: '✔︎' },
  partial: { background: '#B45309', glyph: '◐' },
  wrong: { background: '#6B7280', glyph: '✗' },
};

function Peg({ kind }) {
  const s = PEG_STYLES[kind];
  return (
    <span style={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      backgroundColor: s.background,
      color: '#FFFFFF',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.1rem',
      fontWeight: 700,
      flexShrink: 0,
    }}>
      {s.glyph}
    </span>
  );
}

function SymbolTile({ symbol, size = 56, fontSize = '1.6rem' }) {
  return (
    <span style={{
      width: size,
      height: size,
      borderRadius: 'var(--radius-sm)',
      backgroundColor: 'var(--surface-color)',
      border: '2px solid var(--border-color)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize,
      fontWeight: 700,
      color: symbol.color,
      flexShrink: 0,
    }}>
      {symbol.glyph}
    </span>
  );
}

function makeCode(palette, allowDuplicates) {
  if (allowDuplicates) {
    return Array.from({ length: CODE_LENGTH }, () => palette[Math.floor(Math.random() * palette.length)]);
  }
  return [...palette].sort(() => Math.random() - 0.5).slice(0, CODE_LENGTH);
}

function calculateFeedback(guess, secret) {
  let exact = 0;
  let partial = 0;
  const secretUsed = Array(CODE_LENGTH).fill(false);
  const guessUsed = Array(CODE_LENGTH).fill(false);

  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guess[i].id === secret[i].id) {
      exact++;
      secretUsed[i] = true;
      guessUsed[i] = true;
    }
  }
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guessUsed[i]) continue;
    for (let j = 0; j < CODE_LENGTH; j++) {
      if (!secretUsed[j] && guess[i].id === secret[j].id) {
        partial++;
        secretUsed[j] = true;
        break;
      }
    }
  }
  return { exact, partial };
}

function Playfield({ level, finishGame }) {
  const palette = SYMBOLS.slice(0, level <= 2 ? 5 : 6);
  const maxGuesses = level <= 2 ? 8 : level <= 4 ? 7 : 6;
  const allowDuplicates = level >= 5;

  const [secretCode] = useState(() => makeCode(palette, allowDuplicates));
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
  const { feedback, showFeedback } = useFeedback(1300);

  const handleSymbolSelect = (symbol) => {
    if (gameStatus !== 'playing' || currentGuess.length >= CODE_LENGTH) return;
    setCurrentGuess([...currentGuess, symbol]);
  };

  const handleBackspace = () => {
    if (gameStatus !== 'playing' || currentGuess.length === 0) return;
    setCurrentGuess(currentGuess.slice(0, -1));
  };

  const handleSubmit = () => {
    if (gameStatus !== 'playing' || currentGuess.length < CODE_LENGTH) return;

    const result = calculateFeedback(currentGuess, secretCode);
    const newGuesses = [...guesses, { guess: currentGuess, ...result }];
    setGuesses(newGuesses);
    setCurrentGuess([]);

    if (result.exact === CODE_LENGTH) {
      const remaining = maxGuesses - newGuesses.length;
      setGameStatus('won');
      showFeedback('correct', 'You cracked the code!');
      setTimeout(() => {
        finishGame({ score: 200 + 100 * remaining, isPerfect: remaining >= 2 });
      }, 1400);
    } else if (newGuesses.length >= maxGuesses) {
      setGameStatus('lost');
      showFeedback('wrong', 'Out of guesses — here is the code');
      setTimeout(() => {
        finishGame({ score: 100, isPerfect: false });
      }, 3000);
    }
  };

  return (
    <>
      <GameHUD
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Tries Left</span>
              <span className="hud-value">{maxGuesses - guesses.length}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Symbols</span>
              <span className="hud-value">{palette.length}</span>
            </div>
          </>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Crack the secret 4-symbol code!
      </p>

      {/* Past guesses with feedback pegs */}
      {guesses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 560, marginBottom: 'var(--spacing-sm)' }}>
          {guesses.map((g, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: 8,
                backgroundColor: 'var(--surface-color)',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                {g.guess.map((s, i) => <SymbolTile key={i} symbol={s} />)}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: g.exact }).map((_, i) => <Peg key={`e-${i}`} kind="exact" />)}
                {Array.from({ length: g.partial }).map((_, i) => <Peg key={`p-${i}`} kind="partial" />)}
                {Array.from({ length: CODE_LENGTH - g.exact - g.partial }).map((_, i) => <Peg key={`w-${i}`} kind="wrong" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* The revealed code when out of guesses */}
      {gameStatus === 'lost' && (
        <div className="card" style={{ marginBottom: 'var(--spacing-sm)', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>The code was:</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {secretCode.map((s, i) => <SymbolTile key={i} symbol={s} size={64} fontSize="1.9rem" />)}
          </div>
        </div>
      )}

      {/* Current guess slots */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => (
          <div key={i} style={{
            width: 76,
            height: 76,
            borderRadius: 'var(--radius-md)',
            backgroundColor: currentGuess[i] ? 'var(--surface-color)' : 'var(--surface-alt)',
            border: currentGuess[i] ? '3px solid var(--border-strong)' : '3px dashed var(--border-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            fontWeight: 700,
            color: currentGuess[i] ? currentGuess[i].color : 'transparent',
          }}>
            {currentGuess[i] ? currentGuess[i].glyph : '?'}
          </div>
        ))}
      </div>

      {/* Symbol picker */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
        {palette.map((symbol) => (
          <button
            key={symbol.id}
            className="choice-btn"
            onClick={() => handleSymbolSelect(symbol)}
            disabled={currentGuess.length >= CODE_LENGTH || gameStatus !== 'playing'}
            style={{ width: 92, height: 92, padding: 0, fontSize: '2.2rem', color: symbol.color }}
          >
            {symbol.glyph}
          </button>
        ))}
        <button
          className="secondary"
          onClick={handleBackspace}
          disabled={currentGuess.length === 0 || gameStatus !== 'playing'}
          style={{ width: 92, height: 92, padding: 0, fontSize: '1.8rem' }}
          aria-label="Remove last symbol"
        >
          ⌫
        </button>
      </div>

      <button
        className="primary big"
        onClick={handleSubmit}
        disabled={currentGuess.length < CODE_LENGTH || gameStatus !== 'playing'}
        style={{ width: '100%', maxWidth: 560, marginBottom: 'var(--spacing-md)' }}
      >
        GUESS
      </button>

      {/* Feedback legend */}
      <div className="card" style={{ width: '100%', maxWidth: 560, textAlign: 'left' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>What the pegs mean:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Peg kind="exact" /> <span>Right symbol, right spot</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Peg kind="partial" /> <span>Right symbol, wrong spot</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Peg kind="wrong" /> <span>Not in the code</span>
          </div>
        </div>
      </div>

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function CodeBreaker({ level, onComplete, onBack }) {
  return (
    <GameShell
      title="Code Breaker"
      icon="🔐"
      category="logic"
      level={level}
      instructions={[
        { icon: '🔐', text: 'A secret code of 4 symbols is hiding. Build a guess and tap GUESS.' },
        { icon: '🟢', text: 'After each guess, the pegs tell you how close you were.' },
        { icon: '🧠', text: 'Use the clues to narrow it down before your tries run out!' },
      ]}
      tip="Start with 4 different symbols — the pegs will tell you which ones belong."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}
