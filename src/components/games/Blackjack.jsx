import React, { useState, useEffect } from 'react';

const SUITS = [
  { symbol: '♠', color: '#111' },
  { symbol: '♥', color: '#FF1744' },
  { symbol: '♦', color: '#FF1744' },
  { symbol: '♣', color: '#111' }
];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const getDeck = () => {
  let deck = [];
  // Use 4 decks to prevent running out of cards during splits/long hands
  for (let d = 0; d < 4; d++) {
    for (let suit of SUITS) {
      for (let rank of RANKS) {
        let value = parseInt(rank);
        if (['J', 'Q', 'K'].includes(rank)) value = 10;
        if (rank === 'A') value = 11;
        deck.push({ rank, suit: suit.symbol, color: suit.color, value, id: Math.random() });
      }
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const calculateScore = (hand) => {
  let score = 0;
  let aces = 0;
  for (let card of hand) {
    score += card.value;
    if (card.rank === 'A') aces += 1;
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
};

export function Blackjack({ level = 1, onComplete, onBack }) {
  const [bankroll, setBankroll] = useState(1000);
  const [currentBet, setCurrentBet] = useState(10);
  
  const [deck, setDeck] = useState([]);
  const [playerHands, setPlayerHands] = useState([]); // [{ cards: [], bet: number, isBusted: boolean, isStand: boolean, isDoubleDown: boolean, resultMsg: string, payout: number }]
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('betting'); // 'betting', 'playing', 'dealerTurn', 'gameOver'
  const [overallResultMsg, setOverallResultMsg] = useState('');
  
  const placeBet = (amount) => {
    if (bankroll >= amount) {
      setCurrentBet(prev => prev + amount);
      setBankroll(prev => prev - amount);
    }
  };
  
  const clearBet = () => {
    setBankroll(prev => prev + currentBet);
    setCurrentBet(0);
  };
  
  const refillBankroll = () => {
    setBankroll(1000);
  };

  const dealInitial = () => {
    if (currentBet === 0) return;
    
    let newDeck = getDeck();
    
    const pCards = [newDeck[0], newDeck[2]];
    const dCards = [newDeck[1], newDeck[3]];
    
    setPlayerHands([{
      cards: pCards,
      bet: currentBet,
      isBusted: false,
      isStand: false,
      isDoubleDown: false,
      resultMsg: '',
      payout: 0
    }]);
    
    setDealerHand(dCards);
    setDeck(newDeck.slice(4));
    setActiveHandIndex(0);
    setGameState('playing');
    setOverallResultMsg('');
    
    // Check for immediate blackjack
    const pScore = calculateScore(pCards);
    if (pScore === 21) {
      // Player has Blackjack
      setGameState('dealerTurn'); 
    }
  };

  const drawCard = (isPlayer) => {
    const card = deck[0];
    setDeck(deck.slice(1));
    return card;
  };

  const handleHit = () => {
    const card = drawCard(true);
    let newHands = [...playerHands];
    newHands[activeHandIndex].cards.push(card);
    
    const score = calculateScore(newHands[activeHandIndex].cards);
    if (score > 21) {
      newHands[activeHandIndex].isBusted = true;
      newHands[activeHandIndex].isStand = true;
      newHands[activeHandIndex].resultMsg = 'Bust!';
      checkAllHandsDone(newHands);
    } else if (score === 21) {
      newHands[activeHandIndex].isStand = true;
      checkAllHandsDone(newHands);
    } else {
      setPlayerHands(newHands);
    }
  };

  const handleStand = () => {
    let newHands = [...playerHands];
    newHands[activeHandIndex].isStand = true;
    checkAllHandsDone(newHands);
  };

  const handleDoubleDown = () => {
    const hand = playerHands[activeHandIndex];
    if (bankroll >= hand.bet) {
      // Deduct bet from bankroll
      setBankroll(prev => prev - hand.bet);
      
      const card = drawCard(true);
      let newHands = [...playerHands];
      newHands[activeHandIndex].bet *= 2;
      newHands[activeHandIndex].cards.push(card);
      newHands[activeHandIndex].isDoubleDown = true;
      newHands[activeHandIndex].isStand = true; // Force stand after 1 card
      
      const score = calculateScore(newHands[activeHandIndex].cards);
      if (score > 21) {
        newHands[activeHandIndex].isBusted = true;
        newHands[activeHandIndex].resultMsg = 'Bust!';
      }
      
      checkAllHandsDone(newHands);
    }
  };

  const handleSplit = () => {
    const hand = playerHands[activeHandIndex];
    if (bankroll >= hand.bet && hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank) {
      // Deduct bet for second hand
      setBankroll(prev => prev - hand.bet);
      
      const card1 = hand.cards[0];
      const card2 = hand.cards[1];
      
      const newCard1 = drawCard(true);
      const newCard2 = drawCard(true);
      
      let newHands = [...playerHands];
      
      // Update original hand
      newHands[activeHandIndex].cards = [card1, newCard1];
      
      // Insert new hand right after
      newHands.splice(activeHandIndex + 1, 0, {
        cards: [card2, newCard2],
        bet: hand.bet,
        isBusted: false,
        isStand: false,
        isDoubleDown: false,
        resultMsg: '',
        payout: 0
      });
      
      setPlayerHands(newHands);
      
      // Auto-stand if 21 on split
      if (calculateScore(newHands[activeHandIndex].cards) === 21) {
        handleStand(); // This will process and move to next hand
      }
    }
  };

  const checkAllHandsDone = (hands) => {
    setPlayerHands(hands);
    
    // Find next playable hand
    const nextActive = hands.findIndex(h => !h.isStand);
    
    if (nextActive !== -1) {
      setActiveHandIndex(nextActive);
      // Check if this new active hand is already 21 (like from a split)
      if (calculateScore(hands[nextActive].cards) === 21) {
         let updatedHands = [...hands];
         updatedHands[nextActive].isStand = true;
         checkAllHandsDone(updatedHands);
      }
    } else {
      // All hands done
      setGameState('dealerTurn');
    }
  };

  useEffect(() => {
    if (gameState === 'dealerTurn') {
      // Check if all player hands are busted. If so, dealer doesn't need to draw.
      const allBusted = playerHands.every(h => h.isBusted);
      
      if (allBusted) {
        resolveGame(dealerHand);
        return;
      }

      let dHand = [...dealerHand];
      let currentDeck = [...deck];
      
      const playDealer = () => {
        let dScore = calculateScore(dHand);
        if (dScore < 17) {
          dHand.push(currentDeck[0]);
          currentDeck = currentDeck.slice(1);
          setDealerHand([...dHand]);
          setDeck(currentDeck);
          setTimeout(playDealer, 1000); // Slow draw
        } else {
          resolveGame(dHand);
        }
      };
      
      setTimeout(playDealer, 1000); // Pause before dealer reveals hole card
    }
  }, [gameState]);

  const resolveGame = (finalDealerHand) => {
    const dScore = calculateScore(finalDealerHand);
    let totalPayout = 0;
    let newHands = [...playerHands];
    let winCount = 0;

    newHands.forEach(hand => {
      if (hand.isBusted) {
        hand.resultMsg = 'Lose';
        hand.payout = 0;
      } else {
        const pScore = calculateScore(hand.cards);
        
        // Check for blackjack
        const isPlayerBJ = pScore === 21 && hand.cards.length === 2 && !hand.isSplitHand; // technically split aces aren't BJ, but we simplify here
        const isDealerBJ = dScore === 21 && finalDealerHand.length === 2;

        if (isPlayerBJ && !isDealerBJ) {
          hand.resultMsg = 'Blackjack! 🌟';
          hand.payout = hand.bet * 2.5; // 3:2 payout (returns original bet + 1.5x)
          winCount++;
        } else if (!isPlayerBJ && isDealerBJ) {
          hand.resultMsg = 'Lose (Dealer BJ)';
          hand.payout = 0;
        } else if (isPlayerBJ && isDealerBJ) {
          hand.resultMsg = 'Push (Tie)';
          hand.payout = hand.bet;
        } else if (dScore > 21) {
          hand.resultMsg = 'Win! (Dealer Bust)';
          hand.payout = hand.bet * 2;
          winCount++;
        } else if (pScore > dScore) {
          hand.resultMsg = 'Win!';
          hand.payout = hand.bet * 2;
          winCount++;
        } else if (pScore < dScore) {
          hand.resultMsg = 'Lose';
          hand.payout = 0;
        } else {
          hand.resultMsg = 'Push (Tie)';
          hand.payout = hand.bet;
        }
      }
      totalPayout += hand.payout;
    });

    setPlayerHands(newHands);
    setBankroll(prev => prev + totalPayout);
    setGameState('gameOver');
    
    if (totalPayout > 0 && winCount > 0) {
      setOverallResultMsg(`You won $${totalPayout}! 🌟`);
    } else if (totalPayout > 0) {
       setOverallResultMsg('Push.');
    } else {
      setOverallResultMsg('Dealer Wins.');
    }

    setTimeout(() => {
      // Just wait for the player to click "Play Again"
    }, 4000);
  };

  const dScore = gameState === 'playing' ? dealerHand[0]?.value : calculateScore(dealerHand);

  const Card = ({ card, hidden }) => (
    <div style={{
      width: '120px', // MASSIVE width
      height: '170px', // MASSIVE height
      backgroundColor: hidden ? 'var(--surface-color)' : '#fff',
      border: hidden ? '2px solid #555' : 'none',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: hidden ? 'transparent' : card.color,
      fontSize: '3rem',
      fontWeight: 'bold',
      boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
      position: 'relative'
    }}>
      {!hidden && (
        <>
          <div style={{ position: 'absolute', top: '8px', left: '12px', fontSize: '2rem' }}>
            {card.rank}
          </div>
          <div style={{ fontSize: '5rem' }}>{card.suit}</div>
          <div style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '2rem', transform: 'rotate(180deg)' }}>
            {card.rank}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="game-view" style={{ paddingBottom: '0', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-md)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.5rem', color: 'var(--accent-success)', padding: 'var(--spacing-sm)', fontWeight: 'bold' }}>
          Bankroll: ${bankroll}
        </div>
      </div>

      {gameState === 'betting' ? (
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Betty Blackjack</h2>
          
          {bankroll === 0 && currentBet === 0 ? (
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <p style={{ color: 'var(--accent-error)', fontSize: '1.5rem', marginBottom: 'var(--spacing-md)' }}>Out of money!</p>
              <button className="primary" onClick={refillBankroll}>🏦 Get ATM Refill ($1,000)</button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-lg)', color: 'var(--text-primary)' }}>
                Current Bet: <span style={{ color: 'var(--accent-success)' }}>${currentBet}</span>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <button 
                  onClick={() => placeBet(10)} 
                  disabled={bankroll < 10}
                  style={{ fontSize: '1.5rem', padding: '16px 32px', borderRadius: '50px', backgroundColor: '#388E3C', color: 'white' }}
                >
                  +$10
                </button>
                <button 
                  onClick={() => placeBet(50)} 
                  disabled={bankroll < 50}
                  style={{ fontSize: '1.5rem', padding: '16px 32px', borderRadius: '50px', backgroundColor: '#1976D2', color: 'white' }}
                >
                  +$50
                </button>
                <button 
                  onClick={() => placeBet(100)} 
                  disabled={bankroll < 100}
                  style={{ fontSize: '1.5rem', padding: '16px 32px', borderRadius: '50px', backgroundColor: '#212121', color: 'white' }}
                >
                  +$100
                </button>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', marginTop: 'var(--spacing-lg)' }}>
                <button 
                  onClick={clearBet} 
                  disabled={currentBet === 0}
                  className="secondary"
                  style={{ fontSize: '1.5rem' }}
                >
                  Clear Bet
                </button>
                <button 
                  onClick={dealInitial}
                  disabled={currentBet === 0}
                  className="primary"
                  style={{ fontSize: '2rem', padding: '16px 48px' }}
                >
                  Deal Cards
                </button>
              </div>
              <div style={{ marginTop: 'var(--spacing-xl)' }}>
                <button 
                  onClick={() => onComplete({ score: 100, isPerfect: bankroll > 1000 })}
                  style={{ fontSize: '1.5rem', padding: '12px 24px', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', border: 'none', borderRadius: '50px' }}
                >
                  💰 Cash Out & Quit
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          
          {/* Dealer Area */}
          <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '1.5rem', fontWeight: 'bold' }}>
              Dealer's Hand {gameState !== 'playing' ? `(${dScore})` : ''}
            </div>
            <div style={{ display: 'flex', gap: '12px', minHeight: '170px' }}>
              {dealerHand.map((card, idx) => (
                <Card key={idx} card={card} hidden={gameState === 'playing' && idx === 1} />
              ))}
            </div>
          </div>

          {/* Game Over Message */}
          <div style={{ 
            height: '3rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: overallResultMsg.includes('won') ? 'var(--accent-success)' : 'var(--text-primary)',
            animation: overallResultMsg.includes('won') ? 'pulse 2s infinite' : 'none',
            margin: 'var(--spacing-md) 0'
          }}>
            {overallResultMsg}
          </div>

          {/* Player Area (Handles multiple hands for splitting) */}
          <div style={{ display: 'flex', gap: 'var(--spacing-xl)', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '900px' }}>
            {playerHands.map((hand, index) => {
              const isActive = gameState === 'playing' && index === activeHandIndex;
              const pScore = calculateScore(hand.cards);
              const canSplit = gameState === 'playing' && isActive && hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank && bankroll >= hand.bet;
              const canDouble = gameState === 'playing' && isActive && hand.cards.length === 2 && bankroll >= hand.bet;

              return (
                <div key={index} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  padding: 'var(--spacing-md)',
                  border: isActive ? '4px solid #FFEA00' : '4px solid transparent', // Highlight active hand
                  borderRadius: '16px',
                  backgroundColor: isActive ? 'rgba(255, 234, 0, 0.1)' : 'transparent',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', gap: '16px' }}>
                    <span>Your Hand ({pScore})</span>
                    <span style={{ color: 'var(--accent-success)' }}>Bet: ${hand.bet}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', minHeight: '170px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '400px' }}>
                    {hand.cards.map((card, idx) => (
                      <Card key={idx} card={card} hidden={false} />
                    ))}
                  </div>

                  {gameState === 'gameOver' && (
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: hand.payout > hand.bet ? 'var(--accent-success)' : hand.payout === 0 ? 'var(--accent-error)' : 'var(--text-primary)', marginTop: '8px' }}>
                      {hand.resultMsg} {hand.payout > 0 ? `(+$${hand.payout})` : ''}
                    </div>
                  )}

                  {/* Controls for Active Hand */}
                  {isActive && (
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button 
                        onClick={handleHit}
                        style={{ fontSize: '1.8rem', padding: '12px 24px', backgroundColor: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '12px' }}
                      >
                        Hit
                      </button>
                      <button 
                        onClick={handleStand}
                        style={{ fontSize: '1.8rem', padding: '12px 24px', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', border: 'none', borderRadius: '12px' }}
                      >
                        Stand
                      </button>
                      
                      {canDouble && (
                        <button 
                          onClick={handleDoubleDown}
                          style={{ fontSize: '1.5rem', padding: '12px 24px', backgroundColor: '#9C27B0', color: '#fff', border: 'none', borderRadius: '12px' }}
                        >
                          Double Down (${hand.bet})
                        </button>
                      )}
                      
                      {canSplit && (
                        <button 
                          onClick={handleSplit}
                          style={{ fontSize: '1.5rem', padding: '12px 24px', backgroundColor: '#FF9800', color: '#fff', border: 'none', borderRadius: '12px' }}
                        >
                          Split (${hand.bet})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {gameState === 'gameOver' && (
            <button 
              className="primary" 
              onClick={() => {
                setGameState('betting');
                setPlayerHands([]);
                setDealerHand([]);
              }}
              style={{ fontSize: '2rem', marginTop: 'var(--spacing-xl)', padding: '16px 48px' }}
            >
              Play Again
            </button>
          )}

        </div>
      )}
    </div>
  );
}
