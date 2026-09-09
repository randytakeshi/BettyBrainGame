import React, { useState } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const WORDS = [
  'OCEAN', 'RIVER', 'ISLAND', 'TRAVEL', 'JOURNEY', 'RAINBOW', 'CLOUD',
  'BREEZE', 'SUNSET', 'VOYAGE', 'DESERT', 'JUNGLE', 'CASTLE', 'BRIDGE',
  'HARBOR', 'VALLEY', 'CANYON', 'LAGOON', 'PIRATE', 'COMPASS', 'ANCHOR',
  'SAILING', 'PARROT', 'DOLPHIN', 'WHALE',
];

const MAX_WRONG = 6;

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

function pickWord(level) {
  const pool = level <= 2 ? WORDS.filter(w => w.length <= 6) : WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function Playfield({ level, finishGame }) {
  const [word] = useState(() => pickWord(level));
  const [guessed, setGuessed] = useState(() => new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [gameOver, setGameOver] = useState(false); // false | 'win' | 'lose'
  const { feedback, showFeedback } = useFeedback(1300);

  const guessesLeft = MAX_WRONG - wrongCount;
  const revealedCount = word.split('').filter(ch => guessed.has(ch)).length;

  // The balloon sinks one visual step per wrong guess: 12% (top) → 82% (in the trees).
  const balloonTop = 12 + wrongCount * (70 / MAX_WRONG);

  const handleGuess = (letter) => {
    if (gameOver || guessed.has(letter)) return;

    const newGuessed = new Set(guessed);
    newGuessed.add(letter);
    setGuessed(newGuessed);

    if (word.includes(letter)) {
      const isWin = word.split('').every(ch => newGuessed.has(ch));
      if (isWin) {
        setGameOver('win');
        showFeedback('correct', `You saved the balloon — ${word}!`);
        setTimeout(() => finishGame({
          score: word.length * 100 + guessesLeft * 50,
          correct: word.length,
          total: word.length,
          isPerfect: wrongCount <= 1,
        }), 1500);
      } else {
        showFeedback('correct', `${letter} is in the word!`);
      }
    } else {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      if (newWrong >= MAX_WRONG) {
        setGameOver('lose');
        showFeedback('wrong', `The word was ${word}`);
        setTimeout(() => finishGame({
          score: revealedCount * 80,
          correct: revealedCount,
          total: word.length,
          isPerfect: false,
        }), 1700);
      } else {
        const left = MAX_WRONG - newWrong;
        showFeedback('wrong', `No ${letter} — ${left} ${left === 1 ? 'guess' : 'guesses'} left`);
      }
    }
  };

  return (
    <>
      <GameHUD
        score={revealedCount * 80}
        extra={
          <div className="hud-item">
            <span className="hud-label">Guesses left</span>
            <span className="hud-value">{guessesLeft} of {MAX_WRONG}</span>
          </div>
        }
      />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 600,
        height: 240,
        backgroundColor: '#DBEAFE',
        borderRadius: 'var(--radius-lg)',
        border: '3px solid var(--border-strong)',
        marginBottom: 'var(--spacing-lg)',
        overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{ position: 'absolute', top: 16, left: '12%', fontSize: '2.4rem', opacity: 0.9 }}>☁️</div>
        <div aria-hidden="true" style={{ position: 'absolute', top: 44, right: '16%', fontSize: '3rem', opacity: 0.8 }}>☁️</div>

        <div aria-hidden="true" style={{
          position: 'absolute',
          left: '50%',
          top: `${gameOver === 'lose' ? 82 : balloonTop}%`,
          transform: 'translate(-50%, -50%)',
          fontSize: '3.5rem',
          lineHeight: 1,
          transition: 'top 0.5s ease-out',
        }}>
          {gameOver === 'lose' ? '💥' : '🎈'}
        </div>

        <div aria-hidden="true" style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: 34,
          backgroundColor: 'var(--success-soft)',
          borderTop: '3px solid var(--success)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          fontSize: '1.3rem',
          lineHeight: 1.4,
        }}>
          <span>🌲</span><span>🌲</span><span>🌲</span><span>🌲</span><span>🌲</span><span>🌲</span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 'var(--spacing-lg)',
      }}>
        {word.split('').map((ch, i) => {
          const revealed = guessed.has(ch);
          const missed = gameOver === 'lose' && !revealed;
          return (
            <div key={i} style={{
              width: 64,
              height: 80,
              borderBottom: `6px solid ${revealed ? 'var(--text-primary)' : 'var(--border-strong)'}`,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              fontSize: '2.2rem',
              fontWeight: 700,
              color: missed ? 'var(--error)' : 'var(--text-primary)',
            }}>
              {revealed || missed ? ch : ''}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 600 }}>
        {KEYBOARD_ROWS.map((row, r) => (
          <div key={r} style={{
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
            paddingInline: r === 1 ? '4%' : r === 2 ? '11%' : 0,
          }}>
            {row.map(letter => {
              const isGuessed = guessed.has(letter);
              const inWord = word.includes(letter);
              return (
                <button
                  key={letter}
                  className="compact"
                  onClick={() => handleGuess(letter)}
                  disabled={isGuessed || !!gameOver}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    fontSize: '1.2rem',
                    backgroundColor: isGuessed
                      ? (inWord ? 'var(--success)' : 'var(--surface-highlight)')
                      : 'var(--surface-color)',
                    color: isGuessed
                      ? (inWord ? 'var(--text-on-dark)' : 'var(--text-secondary)')
                      : 'var(--text-primary)',
                    border: `2px solid ${isGuessed ? 'transparent' : 'var(--border-strong)'}`,
                    opacity: isGuessed && inWord && !gameOver ? 1 : undefined,
                  }}
                >
                  {letter}
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

export function BalloonPop({ level, onComplete, onBack }) {
  return (
    <GameShell
      title="Balloon Pop"
      icon="🎈"
      category="language"
      level={level}
      instructions={[
        { icon: '🎈', text: 'A balloon floats above the trees, held up by a hidden word.' },
        { icon: '⌨️', text: 'Tap letters to guess the word. Right letters fill in the blanks.' },
        { icon: '🌲', text: 'Each wrong letter makes the balloon sink one step — 6 wrong and it pops!' },
      ]}
      tip="Common letters like S, T, R and N are good early guesses."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}
