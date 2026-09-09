import React, { useState, useEffect } from 'react';

const ITEMS = ['🐚', '🦀', '🐠', '🐬', '🐙', '🐢', '🦞', '🐡', '🐋', '🦈', '🦭', '🐊'];

export function TidalTreasures({ level, onComplete, onBack }) {
  const [items, setItems] = useState([]);
  const [clickedItems, setClickedItems] = useState(new Set());
  const [feedback, setFeedback] = useState(null);
  
  const numItems = level === 1 ? 4 : level === 2 ? 6 : 8;

  useEffect(() => {
    // Pick random items for this game
    const selected = [...ITEMS].sort(() => Math.random() - 0.5).slice(0, numItems);
    setItems(selected);
    setClickedItems(new Set());
  }, [level, numItems]);

  const handleItemClick = (item) => {
    if (clickedItems.has(item)) {
      // Game over, clicked a duplicate
      setFeedback('incorrect');
      setTimeout(() => {
        onComplete({ 
          score: Math.floor((clickedItems.size / numItems) * 100),
          isPerfect: false
        });
      }, 1500);
    } else {
      // Correct!
      setFeedback('correct');
      const newClicked = new Set(clickedItems);
      newClicked.add(item);
      setClickedItems(newClicked);
      
      if (newClicked.size === numItems) {
        // Won!
        setTimeout(() => {
          onComplete({ score: 100, isPerfect: true });
        }, 1000);
      } else {
        // Shuffle for next round
        setTimeout(() => {
          setItems(prev => [...prev].sort(() => Math.random() - 0.5));
          setFeedback(null);
        }, 600);
      }
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="game-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level} | Found: {clickedItems.size}/{numItems}
        </div>
      </div>
      
      <h2 style={{ marginBottom: 'var(--spacing-xs)', textAlign: 'center' }}>
        Tidal Treasures
      </h2>
      <p style={{ 
        color: feedback === 'incorrect' ? 'var(--accent-error)' : 'var(--text-secondary)', 
        marginBottom: 'var(--spacing-lg)',
        fontSize: '1.2rem',
        transition: 'color 0.3s'
      }}>
        {feedback === 'incorrect' ? 'Oops! You already picked that one.' : 'Pick an item you haven\'t picked yet.'}
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${numItems > 4 ? 3 : 2}, 1fr)`,
        gap: 'var(--spacing-md)',
        maxWidth: '500px',
        width: '100%'
      }}>
        {items.map((item, index) => (
          <button
            key={item + index} // Force re-render on shuffle for animation potential
            onClick={() => handleItemClick(item)}
            disabled={feedback !== null}
            style={{
              fontSize: '8rem',
              padding: 'var(--spacing-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--surface-color)',
              border: '4px solid',
              borderColor: feedback === 'correct' && clickedItems.has(item) ? 'var(--accent-success)' : feedback === 'incorrect' && clickedItems.has(item) ? 'var(--accent-error)' : 'transparent',
              transition: 'border-color 0.2s',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
