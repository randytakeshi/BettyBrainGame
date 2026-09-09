import React, { useState, useEffect, useRef } from 'react';
import { GameShell, GameHUD } from '../GameShell';

const TOTAL_HANDS = 8;
const STARTING_BANKROLL = 1000;
const FELT_GREEN = '#1B5E43';
const FELT_EDGE = '#0F3D2E';
const IVORY = '#F6F1E3';
const RED_SUIT = '#DC2626';
const BLACK_SUIT = '#1F2430';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function buildShoe() {
  const shoe = [];
  // Four decks so splits and long hands never run out of cards
  for (let d = 0; d < 4; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        let value = parseInt(rank, 10);
        if (['J', 'Q', 'K'].includes(rank)) value = 10;
        if (rank === 'A') value = 11;
        shoe.push({ rank, suit, value, id: Math.random() });
      }
    }
  }
  return shoe.sort(() => Math.random() - 0.5);
}

function calculateScore(cards) {
  let score = 0;
  let aces = 0;
  for (const card of cards) {
    score += card.value;
    if (card.rank === 'A') aces += 1;
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
}

function newHand(cards, bet) {
  return { cards, bet, isBusted: false, isStand: false, isDouble: false, resultMsg: '', payout: 0 };
}

function PlayingCard({ card, hidden }) {
  if (hidden) {
    return (
      <div
        aria-label="Face-down card"
        style={{
          width: 'min(120px, 26vw)',
          aspectRatio: '12 / 17',
          borderRadius: 12,
          border: `4px solid ${IVORY}`,
          background: 'repeating-linear-gradient(45deg, #1D4ED8, #1D4ED8 10px, #1E40AF 10px, #1E40AF 20px)',
          boxShadow: 'var(--shadow-md)',
          flexShrink: 0,
        }}
      />
    );
  }
  const color = card.suit === '♥' || card.suit === '♦' ? RED_SUIT : BLACK_SUIT;
  return (
    <div
      aria-label={`${card.rank} of ${card.suit}`}
      style={{
        width: 'min(120px, 26vw)',
        aspectRatio: '12 / 17',
        backgroundColor: '#FFFEF7',
        borderRadius: 12,
        border: '2px solid var(--border-strong)',
        color,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-md)',
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      <div style={{ position: 'absolute', top: 6, left: 10, fontSize: '1.6rem', lineHeight: 1.1 }}>
        {card.rank}
      </div>
      <div style={{ fontSize: '2.6rem' }} aria-hidden="true">{card.suit}</div>
      <div style={{ position: 'absolute', bottom: 6, right: 10, fontSize: '1.6rem', lineHeight: 1.1, transform: 'rotate(180deg)' }}>
        {card.rank}
      </div>
    </div>
  );
}

function ChipButton({ amount, color, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={`Add $${amount} to your bet`}
      style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        backgroundColor: color,
        color: '#FFFFFF',
        border: '5px dashed rgba(255, 255, 255, 0.75)',
        boxShadow: 'var(--shadow-md)',
        fontSize: '1rem',
        fontWeight: 800,
        padding: 0,
      }}
    >
      ${amount}
    </button>
  );
}

function Playfield({ finishGame }) {
  const [bankroll, setBankroll] = useState(STARTING_BANKROLL);
  const [handNum, setHandNum] = useState(1);
  const [handsWon, setHandsWon] = useState(0);
  const [bet, setBet] = useState(0);
  const [playerHands, setPlayerHands] = useState([]);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [dealerHand, setDealerHand] = useState([]);
  const [phase, setPhase] = useState('betting'); // betting | playing | dealer | resolved
  const [roundMsg, setRoundMsg] = useState('');

  const deckRef = useRef([]);
  const endTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(endTimerRef.current), []);

  const drawCard = () => {
    const card = deckRef.current[0];
    deckRef.current = deckRef.current.slice(1);
    return card;
  };

  const placeChip = (amount) => {
    if (bankroll < amount) return;
    setBet(prev => prev + amount);
    setBankroll(prev => prev - amount);
  };

  const clearBet = () => {
    setBankroll(prev => prev + bet);
    setBet(0);
  };

  const deal = () => {
    if (bet === 0) return;
    deckRef.current = buildShoe();
    const pCards = [deckRef.current[0], deckRef.current[2]];
    const dCards = [deckRef.current[1], deckRef.current[3]];
    deckRef.current = deckRef.current.slice(4);

    const hand = newHand(pCards, bet);
    setDealerHand(dCards);
    setActiveHandIndex(0);
    setRoundMsg('');

    if (calculateScore(pCards) === 21) {
      // Natural blackjack — straight to the dealer's reveal
      hand.isStand = true;
      setPlayerHands([hand]);
      setPhase('dealer');
    } else {
      setPlayerHands([hand]);
      setPhase('playing');
    }
  };

  // Set the next playable hand active; auto-stand any hand already at 21.
  const settleAndAdvance = (hands) => {
    const next = hands.map(h => ({ ...h }));
    let idx = next.findIndex(h => !h.isStand);
    while (idx !== -1 && calculateScore(next[idx].cards) === 21) {
      next[idx].isStand = true;
      idx = next.findIndex(h => !h.isStand);
    }
    setPlayerHands(next);
    if (idx === -1) {
      setPhase('dealer');
    } else {
      setActiveHandIndex(idx);
    }
  };

  const handleHit = () => {
    const card = drawCard();
    const hands = playerHands.map((h, i) =>
      i === activeHandIndex ? { ...h, cards: [...h.cards, card] } : h);
    const hand = hands[activeHandIndex];
    const score = calculateScore(hand.cards);
    if (score > 21) {
      hand.isBusted = true;
      hand.isStand = true;
      hand.resultMsg = 'Bust';
      settleAndAdvance(hands);
    } else if (score === 21) {
      hand.isStand = true;
      settleAndAdvance(hands);
    } else {
      setPlayerHands(hands);
    }
  };

  const handleStand = () => {
    const hands = playerHands.map((h, i) =>
      i === activeHandIndex ? { ...h, isStand: true } : h);
    settleAndAdvance(hands);
  };

  const handleDouble = () => {
    const hand = playerHands[activeHandIndex];
    if (bankroll < hand.bet || hand.cards.length !== 2) return;
    setBankroll(prev => prev - hand.bet);
    const card = drawCard();
    const hands = playerHands.map((h, i) =>
      i === activeHandIndex
        ? { ...h, cards: [...h.cards, card], bet: h.bet * 2, isDouble: true, isStand: true }
        : h);
    if (calculateScore(hands[activeHandIndex].cards) > 21) {
      hands[activeHandIndex].isBusted = true;
      hands[activeHandIndex].resultMsg = 'Bust';
    }
    settleAndAdvance(hands);
  };

  const handleSplit = () => {
    const hand = playerHands[activeHandIndex];
    const canSplit = hand.cards.length === 2
      && hand.cards[0].rank === hand.cards[1].rank
      && bankroll >= hand.bet;
    if (!canSplit) return;
    setBankroll(prev => prev - hand.bet);
    const first = { ...hand, cards: [hand.cards[0], drawCard()] };
    const second = newHand([hand.cards[1], drawCard()], hand.bet);
    const hands = [...playerHands];
    hands.splice(activeHandIndex, 1, first, second);
    settleAndAdvance(hands);
  };

  const resolveRound = (finalDealerHand) => {
    const dScore = calculateScore(finalDealerHand);
    let totalPayout = 0;
    let totalStake = 0;
    const hands = playerHands.map(h => ({ ...h }));

    hands.forEach(hand => {
      totalStake += hand.bet;
      if (hand.isBusted) {
        hand.resultMsg = 'Bust — lose';
        hand.payout = 0;
      } else {
        const pScore = calculateScore(hand.cards);
        const isPlayerBJ = pScore === 21 && hand.cards.length === 2;
        const isDealerBJ = dScore === 21 && finalDealerHand.length === 2;

        if (isPlayerBJ && !isDealerBJ) {
          hand.resultMsg = 'Blackjack! 🌟';
          hand.payout = hand.bet * 2.5; // 3:2 payout
        } else if (!isPlayerBJ && isDealerBJ) {
          hand.resultMsg = 'Dealer blackjack — lose';
          hand.payout = 0;
        } else if (isPlayerBJ && isDealerBJ) {
          hand.resultMsg = 'Push — tie';
          hand.payout = hand.bet;
        } else if (dScore > 21) {
          hand.resultMsg = 'Dealer bust — win!';
          hand.payout = hand.bet * 2;
        } else if (pScore > dScore) {
          hand.resultMsg = 'Win!';
          hand.payout = hand.bet * 2;
        } else if (pScore < dScore) {
          hand.resultMsg = 'Lose';
          hand.payout = 0;
        } else {
          hand.resultMsg = 'Push — tie';
          hand.payout = hand.bet;
        }
      }
      totalPayout += hand.payout;
    });

    const newBankroll = bankroll + totalPayout;
    const wonRound = totalPayout > totalStake;
    const newHandsWon = handsWon + (wonRound ? 1 : 0);

    setPlayerHands(hands);
    setBankroll(newBankroll);
    setHandsWon(newHandsWon);
    setPhase('resolved');
    if (wonRound) {
      setRoundMsg(`You won $${totalPayout - totalStake}! 🌟`);
    } else if (totalPayout > 0) {
      setRoundMsg('A push — your bet comes back.');
    } else {
      setRoundMsg('Dealer takes this one.');
    }

    if (handNum >= TOTAL_HANDS) {
      endTimerRef.current = setTimeout(() => {
        finishGame({
          score: Math.max(100, 300 + (newBankroll - STARTING_BANKROLL)),
          correct: newHandsWon,
          total: TOTAL_HANDS,
          isPerfect: newBankroll >= 1200,
        });
      }, 2600);
    }
  };

  // Dealer plays out once every player hand is settled.
  useEffect(() => {
    if (phase !== 'dealer') return;

    if (playerHands.every(h => h.isBusted)) {
      const timer = setTimeout(() => resolveRound(dealerHand), 1000);
      return () => clearTimeout(timer);
    }

    let dHand = [...dealerHand];
    let cancelled = false;
    let timer;
    const step = () => {
      if (cancelled) return;
      if (calculateScore(dHand) < 17) {
        dHand = [...dHand, drawCard()];
        setDealerHand(dHand);
        timer = setTimeout(step, 1000); // slow, watchable draws
      } else {
        resolveRound(dHand);
      }
    };
    timer = setTimeout(step, 1000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [phase]);

  // Out of chips before the 8th hand — end the session gracefully.
  const outOfChips = phase === 'betting' && bankroll + bet < 10;
  useEffect(() => {
    if (!outOfChips) return;
    const timer = setTimeout(() => {
      finishGame({
        score: Math.max(100, 300 + (bankroll + bet - STARTING_BANKROLL)),
        correct: handsWon,
        total: TOTAL_HANDS,
        isPerfect: false,
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [outOfChips]);

  const nextHand = () => {
    setHandNum(n => n + 1);
    setBet(0);
    setPlayerHands([]);
    setDealerHand([]);
    setRoundMsg('');
    setPhase('betting');
  };

  const activeHand = playerHands[activeHandIndex];
  const canDouble = phase === 'playing' && activeHand
    && activeHand.cards.length === 2 && bankroll >= activeHand.bet;
  const canSplit = phase === 'playing' && activeHand
    && activeHand.cards.length === 2
    && activeHand.cards[0].rank === activeHand.cards[1].rank
    && bankroll >= activeHand.bet;
  const dealerShowing = phase === 'playing'
    ? `showing ${dealerHand[0]?.value ?? ''}`
    : `(${calculateScore(dealerHand)})`;

  return (
    <>
      <GameHUD
        extra={
          <>
            <div className="hud-item">
              <span className="hud-label">Hand</span>
              <span className="hud-value">{Math.min(handNum, TOTAL_HANDS)} of {TOTAL_HANDS}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Bankroll</span>
              <span className="hud-value" style={{ color: bankroll + bet >= STARTING_BANKROLL ? 'var(--success)' : 'var(--text-primary)' }}>
                ${bankroll}
              </span>
            </div>
          </>
        }
      />

      {phase === 'betting' ? (
        <div className="card" style={{ width: '100%', maxWidth: 640, textAlign: 'center' }}>
          {outOfChips ? (
            <>
              <h3>Out of chips!</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Adding up your session…</p>
            </>
          ) : (
            <>
              <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Place your bet</h3>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 'var(--spacing-md)' }}>
                Bet: <span style={{ color: 'var(--success)' }}>${bet}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <ChipButton amount={10} color="#15803D" disabled={bankroll < 10} onClick={() => placeChip(10)} />
                <ChipButton amount={50} color="#2563EB" disabled={bankroll < 50} onClick={() => placeChip(50)} />
                <ChipButton amount={100} color="#1F2430" disabled={bankroll < 100} onClick={() => placeChip(100)} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="secondary" onClick={clearBet} disabled={bet === 0}>
                  Clear Bet
                </button>
                <button className="primary big" onClick={deal} disabled={bet === 0}>
                  Deal Cards
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              width: '100%',
              maxWidth: 920,
              backgroundColor: FELT_GREEN,
              border: `6px solid ${FELT_EDGE}`,
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* Dealer */}
            <div style={{ color: IVORY, fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--spacing-xs)' }}>
              Dealer {dealerShowing}
            </div>
            <div style={{ display: 'flex', gap: 12, minHeight: 170, flexWrap: 'wrap', justifyContent: 'center' }}>
              {dealerHand.map((card, idx) => (
                <PlayingCard key={card.id} card={card} hidden={phase === 'playing' && idx === 1} />
              ))}
            </div>

            {/* Round message */}
            <div
              style={{
                minHeight: '2.2rem',
                display: 'flex',
                alignItems: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: roundMsg.includes('won') ? '#FDE68A' : IVORY,
                margin: 'var(--spacing-sm) 0',
                textAlign: 'center',
              }}
            >
              {phase === 'dealer' && !roundMsg ? 'Dealer plays…' : roundMsg}
            </div>

            {/* Player hands (may be several after a split) */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              {playerHands.map((hand, index) => {
                const isActive = phase === 'playing' && index === activeHandIndex;
                const pScore = calculateScore(hand.cards);
                const resultColor = hand.payout > hand.bet ? '#BBF7D0'
                  : hand.payout === 0 ? '#FECACA' : IVORY;
                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: 'var(--spacing-sm)',
                      borderRadius: 'var(--radius-md)',
                      border: isActive ? '4px solid var(--gold-bright)' : '4px solid transparent',
                      backgroundColor: isActive ? 'rgba(245, 158, 11, 0.16)' : 'transparent',
                      transition: 'all 0.3s',
                    }}
                  >
                    <div style={{ color: IVORY, fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--spacing-xs)' }}>
                      {playerHands.length > 1 ? `Hand ${index + 1}` : 'Your hand'} ({pScore}) · bet ${hand.bet}
                    </div>
                    <div style={{ display: 'flex', gap: 12, minHeight: 170, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 420 }}>
                      {hand.cards.map(card => (
                        <PlayingCard key={card.id} card={card} />
                      ))}
                    </div>
                    {phase === 'resolved' && (
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: resultColor, marginTop: 'var(--spacing-xs)' }}>
                        {hand.resultMsg}{hand.payout > hand.bet ? ` +$${hand.payout - hand.bet}` : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            {phase === 'playing' && activeHand && (
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', justifyContent: 'center', marginTop: 'var(--spacing-md)' }}>
                <button className="choice-btn" style={{ minWidth: 'min(140px, 42vw)' }} onClick={handleHit}>
                  Hit
                </button>
                <button className="choice-btn" style={{ minWidth: 'min(140px, 42vw)' }} onClick={handleStand}>
                  Stand
                </button>
                <button className="choice-btn" style={{ minWidth: 'min(140px, 42vw)' }} onClick={handleDouble} disabled={!canDouble}>
                  Double +${activeHand.bet}
                </button>
                <button className="choice-btn" style={{ minWidth: 'min(140px, 42vw)' }} onClick={handleSplit} disabled={!canSplit}>
                  Split +${activeHand.bet}
                </button>
              </div>
            )}
          </div>

          {phase === 'resolved' && (
            handNum < TOTAL_HANDS ? (
              <button className="primary big" style={{ marginTop: 'var(--spacing-md)' }} onClick={nextHand}>
                Next Hand →
              </button>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginTop: 'var(--spacing-md)' }}>
                That was the last hand — adding up your chips…
              </p>
            )
          )}
        </>
      )}
    </>
  );
}

export function Blackjack({ level = 1, onComplete, onBack }) {
  return (
    <GameShell
      title="Betty Blackjack"
      icon="♠️"
      category="logic"
      level={level}
      instructions={[
        { icon: '🪙', text: 'You start with $1,000. Tap the chips to place a bet, then deal.' },
        { icon: '🃏', text: 'Get closer to 21 than the dealer without going over. Hit for a card, Stand to hold.' },
        { icon: '🎯', text: 'You play 8 hands. Walk away above $1,200 for a perfect session!' },
      ]}
      tip="The dealer must keep hitting until 17 — with a high hand, standing often wins."
      onBack={onBack}
      onComplete={onComplete}
    >
      {({ finishGame }) => <Playfield finishGame={finishGame} />}
    </GameShell>
  );
}
