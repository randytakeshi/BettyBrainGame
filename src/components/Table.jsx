import React, { useState, useEffect } from 'react';
import './Table.css';
import Card from './Card';

export default function Table({ gameState, onPlayCard, showAllCards, activeHint, selectedCard, setSelectedCard }) {
  const { hands, currentTrick, currentTurn, dummy, phase, declarer } = gameState;
  const playerHand = hands['S'] || [];

  const isPlaying = phase === 'playing';
  const getActiveClass = (player) => currentTurn === player ? 'active-turn' : '';

  const rankNames = { 'A': 'Ace', 'K': 'King', 'Q': 'Queen', 'J': 'Jack', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine', '10': 'Ten' };
  const suitNames = { 'S': 'Spades', 'H': 'Hearts', 'D': 'Diamonds', 'C': 'Clubs' };

  const announceCard = (card) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${rankNames[card.rank]} of ${suitNames[card.suit]}`);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCardClick = (player, index) => {
    if (!isPlaying) return;
    
    // Check if it's this player's turn to act (S acts for themselves, S acts for N if S is declarer)
    const canAct = (player === 'S' && currentTurn === 'S') || 
                   (player === 'N' && currentTurn === 'N' && declarer === 'S');
                   
    if (canAct) {
      if (selectedCard && selectedCard.player === player && selectedCard.index === index) {
        // Second tap: Play the card
        onPlayCard(player, index);
        setSelectedCard(null);
      } else {
        // First tap: Select the card
        const card = hands[player][index];
        announceCard(card);
        setSelectedCard({ player, index });
      }
    }
  };

  const isHintCard = (player, index) => {
    return activeHint && activeHint.type === 'card' && currentTurn === player && activeHint.value === index;
  };

  const renderOpponentHand = (player) => {
    if (!hands[player]) return null;
    // Don't render dummy this way if it's already rendered in center
    if (isPlaying && dummy === player) return <div className="cards-left">{hands[player].length} cards (Dummy)</div>;
    
    if (showAllCards) {
      return (
        <div className="opponent-revealed-cards">
          {hands[player].map((c, i) => (
            <div key={i} className="opp-card-mini" style={{ marginLeft: i === 0 ? 0 : '-15px' }}>
              <Card suit={c.suit} rank={c.rank} />
            </div>
          ))}
        </div>
      );
    }
    return <div className="cards-left">{hands[player].length} cards</div>;
  };

  return (
    <div className="table-layout">
      {/* North */}
      <div className={`player-info info-N ${getActiveClass('N')}`}>
        <div className="name">Computer SARAH (N) {dummy === 'N' ? '(Dummy)' : ''}</div>
        {renderOpponentHand('N')}
      </div>

      {/* West */}
      <div className={`player-info info-W ${getActiveClass('W')}`}>
        <div className="name">DAVID (W)</div>
        {renderOpponentHand('W')}
      </div>

      {/* East */}
      <div className={`player-info info-E ${getActiveClass('E')}`}>
        <div className="name">ROBERT (E)</div>
        {renderOpponentHand('E')}
      </div>


      <div className="table-center">
        {/* Compass Markers */}
        <div className={`compass-container compass-N ${['N/S', 'Both'].includes(gameState.vulnerability) ? 'vulnerable' : ''}`}>N</div>
        <div className={`compass-container compass-S ${['N/S', 'Both'].includes(gameState.vulnerability) ? 'vulnerable' : ''}`}>S</div>
        <div className={`compass-container compass-E ${['E/W', 'Both'].includes(gameState.vulnerability) ? 'vulnerable' : ''}`}>E</div>
        <div className={`compass-container compass-W ${['E/W', 'Both'].includes(gameState.vulnerability) ? 'vulnerable' : ''}`}>W</div>
        
        {/* Render current trick here */}
        {currentTrick.map((play, index) => (
          <div key={index} className={`played-card ${play.player}`} style={{ zIndex: index }}>
            <Card suit={play.card.suit} rank={play.card.rank} simplified={true} />
          </div>
        ))}
        
        {/* Render Dummy Hand if North is Dummy and we are playing */}
        {isPlaying && dummy === 'N' && (
           <div className={`dummy-hand-container ${getActiveClass('N')}`}>
            {hands['N'].map((c, i) => (
              <div key={i} className={`dummy-card-wrapper ${isHintCard('N', i) ? 'hint-highlight' : ''} ${selectedCard?.player === 'N' && selectedCard?.index === i ? 'selected' : ''}`} onClick={() => handleCardClick('N', i)}>
                <Card suit={c.suit} rank={c.rank} simplified={selectedCard?.player === 'N' && selectedCard?.index === i} />
              </div>
            ))}
           </div>
        )}
      </div>

      {/* Player Hand */}
      <div className="player-hand-container">
        {playerHand.map((c, i) => {
          const total = playerHand.length;
          const middle = (total - 1) / 2;
          const offset = i - middle;
          const rotation = offset * 3;
          const yOffset = Math.abs(offset) * 2;
          
          return (
            <div key={i} className={`playable-card-wrapper ${isHintCard('S', i) ? 'hint-highlight' : ''} ${selectedCard?.player === 'S' && selectedCard?.index === i ? 'selected' : ''}`} style={{ 
              marginLeft: i === 0 ? 0 : 'clamp(-40px, -5vw, -15px)',
              transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
              transformOrigin: 'bottom center',
              zIndex: selectedCard?.player === 'S' && selectedCard?.index === i ? 50 : i,
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: currentTurn === 'S' && isPlaying ? 'pointer' : 'default',
              borderRadius: '12px'
            }} onClick={() => handleCardClick('S', i)}>
              <Card suit={c.suit} rank={c.rank} simplified={selectedCard?.player === 'S' && selectedCard?.index === i} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
