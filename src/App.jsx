import { useState, useEffect } from 'react';
import './App.css';
import Table from './components/Table';
import BiddingBox from './components/BiddingBox';
import { GameEngine } from './GameEngine';

function App() {
  const [engine, setEngine] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [showAllCards, setShowAllCards] = useState(false);
  const [activeHint, setActiveHint] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    const ge = new GameEngine((newState) => {
      setGameState({ ...newState });
      // Clear hint on state change if it's no longer our turn
      if (newState.currentTurn !== 'S' && !(newState.currentTurn === 'N' && newState.declarer === 'S' && newState.phase === 'playing')) {
        setActiveHint(null);
      }
      setSelectedCard(null); // Clear selection on turn change
    });
    setEngine(ge);
    ge.deal();
  }, []);

  // Auto-Play Logic
  useEffect(() => {
    if (!isAutoPlaying || !gameState) return;
    
    let timer1, timer2;
    const { currentTurn, phase, declarer } = gameState;
    
    if (currentTurn === 'S' || (currentTurn === 'N' && declarer === 'S' && phase === 'playing')) {
      const hint = engine.getHint(currentTurn);
      
      if (hint && hint.type === 'bid') {
        timer1 = setTimeout(() => engine.placeBid(hint.value), 1200);
      } else if (hint && hint.type === 'card') {
        // Simulate two-tap
        timer1 = setTimeout(() => {
          setSelectedCard({ player: currentTurn, index: hint.value });
          timer2 = setTimeout(() => {
            engine.playCard(currentTurn, hint.value);
            setSelectedCard(null);
          }, 1000);
        }, 800);
      }
    }
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [gameState, isAutoPlaying, engine]);

  if (!gameState) return <div>Loading...</div>;

  const handleBid = (bidEvent) => {
    setActiveHint(null);
    engine.placeBid(bidEvent);
  };

  const handlePlayCard = (player, cardIndex) => {
    setActiveHint(null);
    engine.playCard(player, cardIndex);
  };

  const handleHint = () => {
    if (gameState.currentTurn === 'S' || (gameState.currentTurn === 'N' && gameState.declarer === 'S' && gameState.phase === 'playing')) {
      const hint = engine.getHint(gameState.currentTurn);
      setActiveHint(hint);
    }
  };

  const toggleShowAllCards = () => setShowAllCards(!showAllCards);
  const toggleAutoPlay = () => setIsAutoPlaying(!isAutoPlaying);

  const { phase, contract, tricksWon, currentTurn } = gameState;
  const highestBid = gameState.bids.filter(b => b.type === 'bid').pop();

  return (
    <div className="app-container">
      <header className="game-header">
        <div className="contract-info">
          Contract: {contract ? `${contract.level}${contract.suit} by ${gameState.declarer}` : (highestBid ? `${highestBid.level}${highestBid.suit}` : '-')}
        </div>
        <div className="score-info">N/S: {tricksWon['N/S']} | E/W: {tricksWon['E/W']}</div>
        <div className="settings-btn" style={{ display: 'flex', gap: '15px' }}>
          <button onClick={toggleAutoPlay} style={{ backgroundColor: isAutoPlaying ? '#e74c3c' : '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>{isAutoPlaying ? 'Stop Auto ⏹️' : 'Auto-Play ▶️'}</button>
          <button onClick={handleHint} style={{ backgroundColor: 'var(--ui-accent)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}>Hint 💡</button>
          <button onClick={toggleShowAllCards} style={{ backgroundColor: 'transparent', border: '1px solid white', color: 'white', borderRadius: '8px', padding: '8px 16px', fontSize: '1rem', cursor: 'pointer' }}>{showAllCards ? 'Hide Cards' : 'Show Cards 👁️'}</button>
          <button style={{ backgroundColor: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>⚙️</button>
        </div>
      </header>

      <main className="table-area">
        <Table gameState={gameState} onPlayCard={handlePlayCard} showAllCards={showAllCards} activeHint={activeHint} selectedCard={selectedCard} setSelectedCard={setSelectedCard} />
        {phase === 'bidding' && currentTurn === 'S' && (
          <div className="bidding-box-container">
            <BiddingBox onBid={handleBid} currentHighestBid={highestBid} activeHint={activeHint} />
          </div>
        )}
      </main>

      <footer className="player-hand-area" style={{ position: 'absolute', bottom: 0, width: '100%', zIndex: 100 }}>
      </footer>
    </div>
  );
}

export default App;
