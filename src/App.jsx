import { useState, useEffect, useRef } from 'react';
import './App.css';
import Table from './components/Table';
import BiddingBox from './components/BiddingBox';
import { GameEngine } from './GameEngine';
import { parsePBN } from './utils/pbnParser';

function App() {
  const [engine, setEngine] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [showAllCards, setShowAllCards] = useState(false);
  const [showAuction, setShowAuction] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [activeHint, setActiveHint] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const speak = (text) => {
    if (!soundEnabledRef.current) return;
    window.speechSynthesis.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for readability
    window.speechSynthesis.speak(utterance);
  };
  
  // PBN Mode State
  const [pbnDatabase, setPbnDatabase] = useState(null);
  const [useHistoricalMode, setUseHistoricalMode] = useState(false);

  // Load PBN Data on mount
  useEffect(() => {
    fetch('/historical_hands.pbn')
      .then(res => res.text())
      .then(text => {
        const parsed = parsePBN(text);
        setPbnDatabase(parsed);
      })
      .catch(err => console.error("Failed to load PBN:", err));
  }, []);

  // Initialize GameEngine
  useEffect(() => {
    const activeDatabase = useHistoricalMode ? pbnDatabase : null;
    const ge = new GameEngine((newState) => {
      setGameState({ ...newState });
      if (newState.currentTurn !== 'S' && !(newState.currentTurn === 'N' && newState.declarer === 'S' && newState.phase === 'playing')) {
        setActiveHint(null);
      }
      setSelectedCard(null); 
    }, activeDatabase, (text) => speak(text));
    
    setEngine(ge);
    ge.deal();
  }, [useHistoricalMode, pbnDatabase]); // Re-init when mode changes

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
      
      if (hint && hint.type === 'bid') {
        const suitName = hint.value.suit === 'NT' ? 'No Trump' : (hint.value.suit === 'S' ? 'Spades' : (hint.value.suit === 'H' ? 'Hearts' : (hint.value.suit === 'D' ? 'Diamonds' : 'Clubs')));
        speak(`Hint: Bid ${hint.value.level} ${suitName}`);
      } else if (hint && hint.type === 'card') {
        speak("Hint: Play a card");
      }
    }
  };

  const toggleShowAllCards = () => setShowAllCards(!showAllCards);
  const toggleShowAuction = () => {
    setShowAuction(!showAuction);
    if (showAuction) setSelectedBid(null);
  };
  const toggleAutoPlay = () => setIsAutoPlaying(!isAutoPlaying);
  const toggleHistoricalMode = () => setUseHistoricalMode(!useHistoricalMode);
  
  const toggleSound = () => {
    if (!soundEnabled) {
      // iOS Safari requires a gesture to unlock speech synthesis
      const utterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(utterance);
    }
    setSoundEnabled(!soundEnabled);
  };

  const { phase, contract, tricksWon, currentTurn } = gameState;
  const highestBid = gameState.bids.filter(b => b.type === 'bid').pop();

  return (
    <div className="app-container">
      <header className="game-header">
        <div className="header-stats">
          <div className="stat-badge">
            <div className="stat-label">Board {gameState.boardNumber}</div>
            <div className="stat-value" style={{ fontSize: '1.2rem', color: gameState.vulnerability === 'None' ? '#a0aec0' : '#fca5a5' }}>
              Vul: {gameState.vulnerability}
            </div>
            <div className="stat-label" style={{ marginTop: '4px' }}>Dlr: {gameState.dealer}</div>
          </div>
          <div className="stat-badge contract-badge">
            <div className="stat-label">Contract</div>
            <div className="stat-value">{contract ? `${contract.level}${contract.suit}${gameState.doubledStatus === 'doubled' ? 'x' : (gameState.doubledStatus === 'redoubled' ? 'xx' : '')} by ${gameState.declarer}` : (highestBid ? `${highestBid.level}${highestBid.suit}` : '-')}</div>
          </div>
          <div className="stat-badge score-badge">
            <div className="stat-label">We (N/S)</div>
            <div className="stat-value">{tricksWon['N/S']}</div>
          </div>
          <div className="stat-badge score-badge">
            <div className="stat-label">They (E/W)</div>
            <div className="stat-value">{tricksWon['E/W']}</div>
          </div>
        </div>
        <div className="settings-btn" style={{ gap: '10px' }}>
          <button className={`header-btn ${soundEnabled ? 'btn-auto-play' : 'btn-stop-auto'}`} onClick={toggleSound}>
            {soundEnabled ? 'Sound 🔊' : 'Muted 🔇'}
          </button>
          {pbnDatabase && (
            <button className={`header-btn ${useHistoricalMode ? 'btn-stop-auto' : 'btn-auto-play'}`} onClick={toggleHistoricalMode} style={{ backgroundColor: useHistoricalMode ? '#9333ea' : '#475569' }}>
              {useHistoricalMode ? 'Historical Mode' : 'Random Mode'}
            </button>
          )}
          <button className={`header-btn ${isAutoPlaying ? 'btn-stop-auto' : 'btn-auto-play'}`} onClick={toggleAutoPlay}>{isAutoPlaying ? 'Stop Auto ⏹️' : 'Auto-Play ▶️'}</button>
          <button className="header-btn btn-hint" onClick={handleHint}>Hint 💡</button>
          {gameState.canUndo && (
            <button className="header-btn btn-undo" onClick={() => engine.undo()}>Undo ↩️</button>
          )}
          {phase === 'playing' && currentTurn === 'S' && (
            <button className="header-btn" style={{ backgroundColor: '#2563eb' }} onClick={() => engine.claimRest()}>Claim Rest 🏆</button>
          )}
          {phase === 'playing' && (
            <button className="header-btn btn-show" onClick={toggleShowAuction}>Auction 📜</button>
          )}
          <button className="header-btn btn-show" onClick={toggleShowAllCards}>{showAllCards ? 'Hide Cards' : 'Show Cards 👁️'}</button>
        </div>
      </header>

      <main className="table-area">
        <Table gameState={gameState} onPlayCard={handlePlayCard} showAllCards={showAllCards} activeHint={activeHint} selectedCard={selectedCard} setSelectedCard={setSelectedCard} />
      </main>

      <footer className="player-hand-area" style={{ position: 'absolute', bottom: 0, width: '100%', zIndex: 100 }}>
      </footer>

      {/* Bidding Modal Overlay */}
      {phase === 'bidding' && currentTurn === 'S' && (
        <div className="bidding-modal-overlay">
          <div className="bidding-modal-content">
            <BiddingBox onBid={handleBid} currentHighestBid={highestBid} activeHint={activeHint} />
          </div>
        </div>
      )}

      {/* End of Hand Duplicate Score Modal */}
      {phase === 'finished' && gameState.duplicateScore && (
        <div className="bidding-modal-overlay">
          <div className="bidding-modal-content" style={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', padding: '40px', borderRadius: '16px', color: 'white', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', flexDirection: 'column', alignItems: 'center', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Board {gameState.boardNumber} Complete</h2>
            
            {gameState.duplicateScore.made !== null ? (
              <>
                <p style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#fbd38d' }}>
                  Contract: {gameState.duplicateScore.contract.level}{gameState.duplicateScore.contract.suit}
                  {gameState.duplicateScore.doubled === 'doubled' ? 'x' : (gameState.duplicateScore.doubled === 'redoubled' ? 'xx' : '')} by {gameState.declarer}
                </p>
                <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '20px 0', color: gameState.duplicateScore.points > 0 ? '#4ade80' : (gameState.duplicateScore.points < 0 ? '#f87171' : '#fff') }}>
                  {gameState.duplicateScore.side}: {gameState.duplicateScore.points > 0 ? '+' : ''}{gameState.duplicateScore.points}
                </div>
                <p style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: '30px' }}>
                  {gameState.duplicateScore.made ? `Made with ${gameState.duplicateScore.overtricks || 0} overtricks` : `Down ${gameState.duplicateScore.undertricks || 0}`} 
                  <br/>
                  (Tricks: {gameState.duplicateScore.tricks} / {6 + gameState.duplicateScore.contract.level})
                </p>
              </>
            ) : (
              <p style={{ fontSize: '1.5rem', marginBottom: '30px', color: '#cbd5e1' }}>Passed Out</p>
            )}

            {/* Historical Comparison */}
            {gameState.historicalData && gameState.historicalData.historicalContract && (
              <div style={{ marginTop: '10px', marginBottom: '30px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px dashed #64748b' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#9333ea', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tournament Result</h3>
                <p style={{ fontSize: '1.1rem', color: '#e2e8f0', margin: '5px 0' }}>
                  {gameState.historicalData.event ? `${gameState.historicalData.event}` : 'Historical Play'}
                </p>
                <p style={{ fontSize: '1.3rem', color: '#fbd38d', fontWeight: 'bold' }}>
                  {gameState.historicalData.historicalContract} by {gameState.historicalData.historicalDeclarer} 
                  {gameState.historicalData.historicalResult ? ` (Took ${gameState.historicalData.historicalResult})` : ''}
                </p>
                {gameState.historicalData.historicalScore && (
                  <p style={{ fontSize: '1.2rem', color: '#4ade80' }}>
                    Score: {gameState.historicalData.historicalScore}
                  </p>
                )}
              </div>
            )}
            
            <button 
              className="header-btn btn-auto-play" 
              style={{ fontSize: '1.5rem', padding: '15px 40px', width: '100%', justifyContent: 'center' }}
              onClick={() => engine.nextBoard()}
            >
              Next Board ▶️
            </button>
          </div>
        </div>
      )}

      {/* Auction Review Modal */}
      {showAuction && phase === 'playing' && (
        <div className="bidding-modal-overlay" onClick={toggleShowAuction}>
          <div className="bidding-modal-content" style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: '30px', borderRadius: '16px', color: 'white', maxWidth: '400px', width: '90%', border: '2px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>
              <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#fbd38d' }}>Auction History</h2>
              <button onClick={toggleShowAuction} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>
              <div style={{ color: '#cbd5e1' }}>N</div>
              <div style={{ color: '#cbd5e1' }}>E</div>
              <div style={{ color: '#cbd5e1' }}>S</div>
              <div style={{ color: '#cbd5e1' }}>W</div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center', fontSize: '1.3rem', maxHeight: '400px', overflowY: 'auto' }}>
              {/* Pad the beginning if dealer wasn't N */}
              {Array.from({ length: ['N', 'E', 'S', 'W'].indexOf(gameState.dealer) }).map((_, i) => (
                <div key={`pad-${i}`}></div>
              ))}
              
              {gameState.bids.map((b, i) => (
                <div key={i} onClick={() => setSelectedBid(b)} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', backgroundColor: selectedBid === b ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '4px' }}>
                  {b.type === 'pass' ? 'Pass' : 
                   b.type === 'double' ? 'X' : 
                   b.type === 'redouble' ? 'XX' : 
                   <span style={{ color: b.suit === 'H' || b.suit === 'D' ? '#f87171' : 'white' }}>{b.level}{b.suit}</span>}
                </div>
              ))}
            </div>
            
            {selectedBid && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <h4 style={{ margin: 0, color: '#fbd38d', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Bid Explanation</h4>
                <p style={{ margin: '5px 0 0 0', fontSize: '1.1rem' }}>{selectedBid.explanation || 'Human Player (No explanation)'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
