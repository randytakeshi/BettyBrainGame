import React, { useState, useEffect, useCallback } from 'react';
import { GameShell, GameHUD, FeedbackOverlay, useFeedback } from '../GameShell';

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

const generateBingoCard = () => {
  const card = [];
  const ranges = [
    { min: 1, max: 15 },  // B
    { min: 16, max: 30 }, // I
    { min: 31, max: 45 }, // N
    { min: 46, max: 60 }, // G
    { min: 61, max: 75 }, // O
  ];

  for (let c = 0; c < 5; c++) {
    const colNumbers = new Set();
    while (colNumbers.size < 5) {
      colNumbers.add(Math.floor(Math.random() * (ranges[c].max - ranges[c].min + 1)) + ranges[c].min);
    }
    const colArray = Array.from(colNumbers);
    if (c === 2) colArray[2] = 'FREE'; // Center space

    // Transpose so we can render by rows
    for (let r = 0; r < 5; r++) {
      if (!card[r]) card[r] = [];
      card[r][c] = colArray[r];
    }
  }
  return card;
};

const getNumberLetter = (num) => {
  if (num <= 15) return 'B';
  if (num <= 30) return 'I';
  if (num <= 45) return 'N';
  if (num <= 60) return 'G';
  return 'O';
};

const speakCall = (num) => {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.SpeechSynthesisUtterance) {
      const utterance = new window.SpeechSynthesisUtterance(`${getNumberLetter(num)}. ${num}.`);
      utterance.rate = 0.8;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  } catch {
    // Speech is a bonus — never let it break the game.
  }
};

function Playfield({ level, finishGame }) {
  // Gentle pacing: a new number every 8s at levels 1-2, 7s at 3-4, 6s at 5.
  const callInterval = level <= 2 ? 8000 : level <= 4 ? 7000 : 6000;

  const [board] = useState(() => generateBingoCard());
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [dabbed, setDabbed] = useState(() => new Set(['FREE']));
  const [wrongDabs, setWrongDabs] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won
  const [shakeCell, setShakeCell] = useState(null);
  const [pulseKey, setPulseKey] = useState(0);
  const { feedback, showFeedback } = useFeedback(1100);

  const [drawOrder] = useState(() =>
    Array.from({ length: 75 }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
  );

  const callNextNumber = useCallback(() => {
    setCalledNumbers((prev) => {
      const next = drawOrder[prev.length];
      if (next == null) return prev;
      return [next, ...prev];
    });
  }, [drawOrder]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const firstCall = setTimeout(callNextNumber, 1500);
    const timer = setInterval(callNextNumber, callInterval);
    return () => {
      clearTimeout(firstCall);
      clearInterval(timer);
    };
  }, [callNextNumber, callInterval, gameStatus]);

  const checkWin = (currentDabbed) => {
    for (let i = 0; i < 5; i++) {
      let rowWin = true;
      let colWin = true;
      for (let j = 0; j < 5; j++) {
        if (!currentDabbed.has(board[i][j])) rowWin = false;
        if (!currentDabbed.has(board[j][i])) colWin = false;
      }
      if (rowWin || colWin) return true;
    }
    let diag1Win = true;
    let diag2Win = true;
    for (let i = 0; i < 5; i++) {
      if (!currentDabbed.has(board[i][i])) diag1Win = false;
      if (!currentDabbed.has(board[i][4 - i])) diag2Win = false;
    }
    return diag1Win || diag2Win;
  };

  const handleCellClick = (val) => {
    if (gameStatus !== 'playing' || val === 'FREE' || dabbed.has(val)) return;

    // A number that hasn't been called yet just bounces — no penalty,
    // and it stays valid to dab later once it IS called.
    if (!calledNumbers.includes(val)) {
      setWrongDabs((w) => w + 1);
      setShakeCell(val);
      setTimeout(() => setShakeCell(null), 450);
      showFeedback('wrong', `${getNumberLetter(val)}-${val} hasn't been called yet`);
      return;
    }

    const newDabbed = new Set(dabbed);
    newDabbed.add(val);
    setDabbed(newDabbed);

    if (checkWin(newDabbed)) {
      setGameStatus('won');
      const dabCount = newDabbed.size - 1; // don't count the FREE space
      showFeedback('correct', 'BINGO!');
      setTimeout(() => {
        finishGame({ score: 400 + 10 * dabCount, isPerfect: wrongDabs === 0 });
      }, 1500);
    }
  };

  const handleRepeat = () => {
    if (calledNumbers.length === 0) return;
    setPulseKey((k) => k + 1); // re-pop the big number
    speakCall(calledNumbers[0]);
  };

  const currentCall = calledNumbers.length > 0 ? calledNumbers[0] : null;
  const earlierCalls = calledNumbers.slice(1, 3);

  return (
    <>
      <GameHUD
        score={10 * (dabbed.size - 1)}
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Dabbed</span>
              <span className="hud-value">{dabbed.size - 1}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Called</span>
              <span className="hud-value">{calledNumbers.length}</span>
            </div>
          </>
        }
      />

      {/* Current call */}
      <div className="card" style={{ width: '100%', maxWidth: 560, textAlign: 'center', marginBottom: 'var(--spacing-sm)' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Current Call</div>
        <div
          key={`${currentCall}-${pulseKey}`}
          className="pop-in"
          style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--brand)', lineHeight: 1.15 }}
        >
          {currentCall ? `${getNumberLetter(currentCall)}-${currentCall}` : 'Get ready...'}
        </div>
        {earlierCalls.length > 0 && (
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Earlier: {earlierCalls.map((num) => `${getNumberLetter(num)}-${num}`).join('  ·  ')}
          </div>
        )}
        <button
          className="secondary"
          onClick={handleRepeat}
          disabled={!currentCall || gameStatus !== 'playing'}
          style={{ marginTop: 'var(--spacing-xs)', width: '100%' }}
        >
          🔊 Repeat
        </button>
      </div>

      {/* Bingo board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 6,
        width: '100%',
        maxWidth: 560,
        backgroundColor: 'var(--surface-highlight)',
        padding: 8,
        borderRadius: 'var(--radius-md)',
      }}>
        {BINGO_LETTERS.map((letter) => (
          <div key={letter} style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            textAlign: 'center',
            padding: '4px 0',
            color: 'var(--brand)',
          }}>
            {letter}
          </div>
        ))}

        {board.map((row, rIndex) =>
          row.map((cell, cIndex) => {
            const isDabbed = dabbed.has(cell);
            const isFree = cell === 'FREE';

            return (
              <button
                key={`${rIndex}-${cIndex}`}
                className={shakeCell === cell ? 'shake' : undefined}
                onClick={() => handleCellClick(cell)}
                style={{
                  aspectRatio: '1',
                  minWidth: 0,
                  minHeight: 0,
                  padding: 0,
                  fontSize: isFree ? '1rem' : '1.3rem',
                  fontWeight: 700,
                  backgroundColor: isDabbed ? 'var(--brand)' : 'var(--surface-color)',
                  color: isDabbed ? 'var(--text-on-dark)' : 'var(--text-primary)',
                  border: isDabbed ? '3px solid var(--brand-strong)' : '2px solid var(--border-strong)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (isFree || isDabbed || gameStatus !== 'playing') ? 'default' : 'pointer',
                  transition: 'background-color 0.2s, color 0.2s',
                }}
              >
                {cell}
              </button>
            );
          })
        )}
      </div>

      {/* Called-number history */}
      {calledNumbers.length > 1 && (
        <div style={{ marginTop: 'var(--spacing-md)', width: '100%', maxWidth: 560 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
            All Recent Calls
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {calledNumbers.slice(1, 13).map((num) => (
              <div key={num} style={{
                backgroundColor: 'var(--surface-color)',
                border: '2px solid var(--border-color)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}>
                {getNumberLetter(num)}-{num}
              </div>
            ))}
          </div>
        </div>
      )}

      <FeedbackOverlay feedback={feedback} />
    </>
  );
}

export function BettyBingo({ level, onComplete, onBack }) {
  return (
    <GameShell
      title="Betty Bingo"
      icon="🎱"
      category="attention"
      level={level}
      instructions={[
        { icon: '📣', text: 'Numbers are called one at a time — watch the big number at the top.' },
        { icon: '👆', text: 'If a called number is on your card, tap it to dab it.' },
        { icon: '🎉', text: 'Dab 5 in a row — across, down, or diagonal — for BINGO!' },
      ]}
      tip="No rush — called numbers stay good forever. Tap 🔊 Repeat to see and hear the call again."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield level={level} finishGame={finishGame} />}
    </GameShell>
  );
}
