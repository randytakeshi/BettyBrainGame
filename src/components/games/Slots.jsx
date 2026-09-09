import React, { useState, useEffect, useRef } from 'react';

const SYMBOLS = ['🍒', '🍋', '🔔', '💎', '7️⃣'];

// Custom hook for intervals
function useInterval(callback, delay) {
  const savedCallback = useRef();
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export function Slots({ level = 1, onComplete, onBack }) {
  const [bankroll, setBankroll] = useState(1000);
  const [currentBet, setCurrentBet] = useState(10);

  const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣']);
  const [isSpinning, setIsSpinning] = useState([false, false, false]);
  const [resultMsg, setResultMsg] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  // Spin speed
  const delay = isSpinning.some(s => s) ? 100 : null;

  const placeBet = (amount) => {
    if (bankroll >= amount) {
      setCurrentBet(prev => prev + amount);
    }
  };
  
  const clearBet = () => {
    setCurrentBet(10); // Minimum bet is 10 for slots
  };
  
  const refillBankroll = () => {
    setBankroll(1000);
    setCurrentBet(10);
  };

  const handleSpin = () => {
    if (isSpinning.some(s => s) || gameOver) return;
    if (bankroll < currentBet) {
       setResultMsg('Not enough money!');
       return;
    }
    
    setBankroll(prev => prev - currentBet);
    setIsSpinning([true, true, true]);
    setResultMsg('');
    setSpinCount(prev => prev + 1);

    // Stop reels one by one
    setTimeout(() => stopReel(0), 1000);
    setTimeout(() => stopReel(1), 2000);
    setTimeout(() => stopReel(2), 3000);
  };

  const stopReel = (index) => {
    setIsSpinning(prev => {
      const next = [...prev];
      next[index] = false;
      return next;
    });
  };

  useInterval(() => {
    setReels(prev => {
      const next = [...prev];
      if (isSpinning[0]) next[0] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      if (isSpinning[1]) next[1] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      if (isSpinning[2]) next[2] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      return next;
    });
  }, delay);

  // Evaluate win when all reels stop
  useEffect(() => {
    if (spinCount > 0 && !isSpinning[0] && !isSpinning[1] && !isSpinning[2]) {
      const [r1, r2, r3] = reels;
      let payout = 0;
      let msg = '';

      if (r1 === r2 && r2 === r3) {
        payout = currentBet * 10;
        msg = `JACKPOT! 🌟 (+$${payout})`;
      } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        payout = currentBet * 2;
        msg = `Small Win! (+$${payout})`;
      } else {
        msg = 'No match, try again.';
      }

      setResultMsg(msg);
      if (payout > 0) {
         setBankroll(prev => prev + payout);
      }
    }
  }, [isSpinning, reels, spinCount, currentBet]);

  return (
    <div className="game-view" style={{ paddingBottom: '0', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.5rem', color: 'var(--accent-success)', padding: 'var(--spacing-sm)', fontWeight: 'bold' }}>
          Bankroll: ${bankroll}
        </div>
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-xs)', textAlign: 'center' }}>
        Betty's Slots
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
        Match 3 symbols for the 10x Jackpot!
      </p>

      {bankroll === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
          <p style={{ color: 'var(--accent-error)', fontSize: '1.5rem', marginBottom: 'var(--spacing-md)' }}>Out of money!</p>
          <button className="primary" onClick={refillBankroll}>🏦 Get ATM Refill ($1,000)</button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}>
          
          {/* Betting Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
             <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>
                Bet: <span style={{ color: 'var(--accent-success)' }}>${currentBet}</span>
             </div>
             <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => placeBet(10)} 
                  disabled={bankroll < currentBet + 10 || isSpinning.some(s => s)}
                  style={{ padding: '8px 16px', borderRadius: '50px', backgroundColor: '#388E3C', color: 'white', border: 'none' }}
                >
                  +$10
                </button>
                <button 
                  onClick={() => placeBet(50)} 
                  disabled={bankroll < currentBet + 50 || isSpinning.some(s => s)}
                  style={{ padding: '8px 16px', borderRadius: '50px', backgroundColor: '#1976D2', color: 'white', border: 'none' }}
                >
                  +$50
                </button>
                <button 
                  onClick={clearBet} 
                  disabled={currentBet === 10 || isSpinning.some(s => s)}
                  style={{ padding: '8px 16px', borderRadius: '50px', backgroundColor: '#555', color: 'white', border: 'none' }}
                >
                  Min ($10)
                </button>
             </div>
          </div>

          {/* Slot Machine Display */}
          <div style={{
            display: 'flex',
            gap: '12px',
            backgroundColor: '#FFB300', // Gold casino color
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 20px rgba(0,0,0,0.5), inset 0 5px 10px rgba(255,255,255,0.5)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            {reels.map((symbol, i) => (
              <div key={i} style={{
                width: '90px',
                height: '120px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.2)',
                border: '2px solid #ccc',
                filter: isSpinning[i] ? 'blur(4px)' : 'none',
                transform: isSpinning[i] ? 'translateY(4px)' : 'translateY(0)',
                transition: isSpinning[i] ? 'none' : 'filter 0.1s, transform 0.1s'
              }}>
                {symbol}
              </div>
            ))}
          </div>

          {/* Message */}
          <div style={{ 
            height: '4rem',
            fontSize: '2rem',
            fontWeight: 'bold',
            color: resultMsg.includes('JACKPOT') || resultMsg.includes('Win') ? 'var(--accent-success)' : 'var(--text-primary)',
            animation: resultMsg.includes('JACKPOT') ? 'pulse 1s infinite' : 'none',
            textAlign: 'center',
            marginBottom: 'var(--spacing-lg)'
          }}>
            {resultMsg}
          </div>

          {/* Spin Button */}
          <button 
            onClick={handleSpin}
            disabled={isSpinning.some(s => s) || gameOver || bankroll < currentBet}
            style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              padding: 'var(--spacing-lg) var(--spacing-xl)',
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              boxShadow: (isSpinning.some(s => s) || gameOver || bankroll < currentBet) ? 'none' : '0 8px 0 #009688',
              transform: (isSpinning.some(s => s) || gameOver || bankroll < currentBet) ? 'translateY(8px)' : 'none',
              transition: 'transform 0.1s, box-shadow 0.1s',
              cursor: (isSpinning.some(s => s) || gameOver || bankroll < currentBet) ? 'default' : 'pointer'
            }}
          >
            SPIN! (-${currentBet})
          </button>

          <div style={{ marginTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
             <button 
               onClick={() => onComplete && onComplete({ score: 100, isPerfect: bankroll > 1000 })}
               disabled={isSpinning.some(s => s)}
               style={{ fontSize: '1.5rem', padding: '12px 24px', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', border: 'none', borderRadius: '50px' }}
             >
               💰 Cash Out & Quit
             </button>
          </div>

        </div>
      )}
    </div>
  );
}
