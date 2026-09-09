import React, { useState, useEffect, useRef } from 'react';
import { GameShell, GameHUD } from '../GameShell';

const SYMBOLS = ['🍒', '🍋', '🔔', '💎', '7️⃣'];
const TOTAL_SPINS = 10;
const STARTING_BANKROLL = 1000;
const MIN_BET = 10;

// Local interval hook (kept inline — this is the only game that needs it)
function useInterval(callback, delay) {
  const savedCallback = useRef();
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function Playfield({ finishGame }) {
  const [bankroll, setBankroll] = useState(STARTING_BANKROLL);
  const [currentBet, setCurrentBet] = useState(MIN_BET);
  const [reels, setReels] = useState(['🍒', '🔔', '💎']);
  const [isSpinning, setIsSpinning] = useState([false, false, false]);
  const [resultMsg, setResultMsg] = useState('');
  const [spinCount, setSpinCount] = useState(0);

  const evaluatedRef = useRef(0);
  const timersRef = useRef([]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const spinning = isSpinning.some(s => s);
  const sessionOver = spinCount >= TOTAL_SPINS && !spinning;

  const stopReel = (index) => {
    setIsSpinning(prev => prev.map((s, i) => (i === index ? false : s)));
  };

  const handleSpin = () => {
    if (spinning || spinCount >= TOTAL_SPINS || bankroll < currentBet) return;
    setBankroll(prev => prev - currentBet);
    setIsSpinning([true, true, true]);
    setResultMsg('');
    setSpinCount(prev => prev + 1);

    // Reels stop one at a time for suspense
    timersRef.current.push(
      setTimeout(() => stopReel(0), 1000),
      setTimeout(() => stopReel(1), 2000),
      setTimeout(() => stopReel(2), 3000),
    );
  };

  useInterval(() => {
    setReels(prev => prev.map((symbol, i) =>
      isSpinning[i] ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] : symbol));
  }, spinning ? 100 : null);

  // Evaluate the spin once all three reels have stopped.
  useEffect(() => {
    if (spinCount === 0 || spinning || evaluatedRef.current >= spinCount) return;
    evaluatedRef.current = spinCount;

    const [r1, r2, r3] = reels;
    let payout = 0;
    let msg = 'No match this time.';
    if (r1 === r2 && r2 === r3) {
      payout = currentBet * 10;
      msg = `JACKPOT! Three ${r1} — you win $${payout}! 🌟`;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      payout = currentBet * 2;
      msg = `A pair — you win $${payout}!`;
    }

    const newBankroll = bankroll + payout;
    if (payout > 0) setBankroll(newBankroll);
    setResultMsg(msg);
    if (newBankroll < currentBet) {
      setCurrentBet(Math.max(MIN_BET, Math.floor(newBankroll / 10) * 10));
    }

    // Session ends after the 10th spin (or if the coins run out early).
    if (spinCount >= TOTAL_SPINS || newBankroll < MIN_BET) {
      const winnings = Math.max(0, Math.min(900, newBankroll - STARTING_BANKROLL));
      timersRef.current.push(setTimeout(() => {
        finishGame({ score: 100 + winnings, isPerfect: false });
      }, 2400));
    }
  }, [spinning, reels, spinCount, currentBet, bankroll, finishGame]);

  const isWin = resultMsg.includes('win');

  return (
    <>
      <GameHUD
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Spin</span>
              <span className="hud-value">{Math.max(1, Math.min(spinCount, TOTAL_SPINS))} of {TOTAL_SPINS}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Bankroll</span>
              <span className="hud-value" style={{ color: bankroll >= STARTING_BANKROLL ? 'var(--success)' : 'var(--text-primary)' }}>
                ${bankroll}
              </span>
            </div>
          </>
        }
      />

      <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>
        Match 3 symbols for the 10× jackpot!
      </p>

      {/* Betting controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 'var(--spacing-xs)' }}>
          Bet: <span style={{ color: 'var(--success)' }}>${currentBet}</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => setCurrentBet(prev => prev + 10)}
            disabled={spinning || sessionOver || bankroll < currentBet + 10}
            style={{ backgroundColor: '#15803D', color: '#FFFFFF', borderRadius: 'var(--radius-full)' }}
          >
            +$10
          </button>
          <button
            onClick={() => setCurrentBet(prev => prev + 50)}
            disabled={spinning || sessionOver || bankroll < currentBet + 50}
            style={{ backgroundColor: '#2563EB', color: '#FFFFFF', borderRadius: 'var(--radius-full)' }}
          >
            +$50
          </button>
          <button
            className="ghost"
            onClick={() => setCurrentBet(MIN_BET)}
            disabled={spinning || sessionOver || currentBet === MIN_BET}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            Min ($10)
          </button>
        </div>
      </div>

      {/* Slot cabinet */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          backgroundColor: 'var(--surface-highlight)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          border: '6px solid var(--gold-bright)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        {reels.map((symbol, i) => (
          <div
            key={i}
            style={{
              width: 'min(112px, 25vw)',
              aspectRatio: '7 / 9',
              backgroundColor: 'var(--surface-color)',
              borderRadius: 'var(--radius-sm)',
              border: '3px solid var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              boxShadow: 'inset 0 4px 8px rgba(60, 42, 18, 0.15)',
              filter: isSpinning[i] ? 'blur(4px)' : 'none',
              transform: isSpinning[i] ? 'translateY(4px)' : 'translateY(0)',
              transition: isSpinning[i] ? 'none' : 'filter 0.1s, transform 0.1s',
            }}
          >
            {symbol}
          </div>
        ))}
      </div>

      {/* Result message */}
      <div
        style={{
          minHeight: '2.4rem',
          display: 'flex',
          alignItems: 'center',
          fontSize: '1.3rem',
          fontWeight: 800,
          color: isWin ? 'var(--success)' : 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        {sessionOver && resultMsg ? `${resultMsg} That's the last spin — adding up your winnings…` : resultMsg}
      </div>

      <button
        className="primary big"
        onClick={handleSpin}
        disabled={spinning || sessionOver || bankroll < currentBet}
        style={{ fontSize: '1.5rem', borderRadius: 'var(--radius-full)', minWidth: 280 }}
      >
        🎰 SPIN (${currentBet})
      </button>
    </>
  );
}

export function Slots({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Betty's Slots"
      icon="🎰"
      category="attention"
      level={level}
      instructions={[
        { icon: '🪙', text: 'You have $1,000 and 10 spins. Set your bet with the buttons.' },
        { icon: '🎰', text: 'Tap SPIN and watch the reels. Two matching symbols doubles your bet — three is a 10× jackpot!' },
        { icon: '⭐', text: 'Whatever you win above $1,000 becomes bonus points at the end.' },
      ]}
      tip="Watch the first two reels — if they match, cross your fingers for the third!"
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield finishGame={finishGame} />}
    </GameShell>
  );
}
