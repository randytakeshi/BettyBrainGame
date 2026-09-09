import React, { useState, useEffect } from 'react';

const GRID_SIZE = 6;
const WORDS_DB = [
  'CAT', 'DOG', 'BIRD', 'FISH', 'TREE', 'SUN', 'MOON', 'STAR', 
  'CAKE', 'BOOK', 'ROSE', 'HOME', 'LOVE', 'MILK', 'TEA', 'CUP'
];

const generateGrid = () => {
  let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
  let wordsToFind = [];
  
  // Pick 2 random words that fit in 6x6
  let availableWords = [...WORDS_DB].sort(() => Math.random() - 0.5);
  wordsToFind = availableWords.slice(0, 2);

  // Very naive placement: 1 horizontal, 1 vertical
  // Place word 1 (Horizontal)
  const w1 = wordsToFind[0];
  let placed1 = false;
  while (!placed1) {
    const x = Math.floor(Math.random() * (GRID_SIZE - w1.length + 1));
    const y = Math.floor(Math.random() * GRID_SIZE);
    
    // Check if clear
    let clear = true;
    for (let i = 0; i < w1.length; i++) {
      if (grid[y][x + i] !== '') clear = false;
    }
    
    if (clear) {
      for (let i = 0; i < w1.length; i++) grid[y][x + i] = w1[i];
      placed1 = true;
    }
  }

  // Place word 2 (Vertical)
  const w2 = wordsToFind[1];
  let placed2 = false;
  let attempts = 0;
  while (!placed2 && attempts < 100) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * (GRID_SIZE - w2.length + 1));
    
    // Check if clear or intersecting same letter
    let clear = true;
    for (let i = 0; i < w2.length; i++) {
      if (grid[y + i][x] !== '' && grid[y + i][x] !== w2[i]) clear = false;
    }
    
    if (clear) {
      for (let i = 0; i < w2.length; i++) grid[y + i][x] = w2[i];
      placed2 = true;
    }
    attempts++;
  }

  // Fill remainder
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === '') {
        grid[y][x] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  return { grid, wordsToFind };
};

export function WordSearch({ level = 1, onComplete, onBack }) {
  const [grid, setGrid] = useState([]);
  const [wordsToFind, setWordsToFind] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [selectedCells, setSelectedCells] = useState([]); // [{x,y}]
  const [gameOver, setGameOver] = useState(false);
  const [foundCoordinates, setFoundCoordinates] = useState(new Set()); // set of "x,y"

  useEffect(() => {
    const { grid, wordsToFind } = generateGrid();
    setGrid(grid);
    setWordsToFind(wordsToFind);
    setFoundWords(new Set());
    setSelectedCells([]);
    setFoundCoordinates(new Set());
    setGameOver(false);
  }, [level]);

  const handleCellClick = (x, y) => {
    if (gameOver) return;

    if (selectedCells.length === 0) {
      setSelectedCells([{ x, y }]);
    } else if (selectedCells.length === 1) {
      const start = selectedCells[0];
      const end = { x, y };
      
      // Calculate coordinates between start and end if straight line
      let selectionCoords = [];
      if (start.y === end.y) {
        // Horizontal
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        for (let i = minX; i <= maxX; i++) selectionCoords.push({ x: i, y: start.y });
      } else if (start.x === end.x) {
        // Vertical
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        for (let i = minY; i <= maxY; i++) selectionCoords.push({ x: start.x, y: i });
      }

      if (selectionCoords.length > 0) {
        // Build word both forwards and backwards
        const wordFw = selectionCoords.map(c => grid[c.y][c.x]).join('');
        const wordBw = selectionCoords.map(c => grid[c.y][c.x]).reverse().join('');
        
        let match = null;
        if (wordsToFind.includes(wordFw) && !foundWords.has(wordFw)) match = wordFw;
        else if (wordsToFind.includes(wordBw) && !foundWords.has(wordBw)) match = wordBw;

        if (match) {
          const newFound = new Set(foundWords);
          newFound.add(match);
          setFoundWords(newFound);
          
          const newCoords = new Set(foundCoordinates);
          selectionCoords.forEach(c => newCoords.add(`${c.x},${c.y}`));
          setFoundCoordinates(newCoords);

          if (newFound.size === wordsToFind.length) {
            setGameOver(true);
            setTimeout(() => {
              if (onComplete) onComplete({ score: 100, isPerfect: true });
            }, 2000);
          }
        }
      }
      // Reset selection
      setSelectedCells([]);
    }
  };

  const isSelected = (x, y) => {
    return selectedCells.some(c => c.x === x && c.y === y);
  };
  
  const isFound = (x, y) => {
    return foundCoordinates.has(`${x},${y}`);
  };

  return (
    <div className="game-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--spacing-lg)' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={onBack}>⬅ Back</button>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', padding: 'var(--spacing-sm)' }}>
          Level {level} | Found: {foundWords.size}/{wordsToFind.length}
        </div>
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
        Mini Word Search
      </h2>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 'var(--spacing-md)', 
        marginBottom: 'var(--spacing-lg)' 
      }}>
        {wordsToFind.map(w => (
          <div key={w} style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: foundWords.has(w) ? 'var(--accent-success)' : 'var(--text-primary)',
            textDecoration: foundWords.has(w) ? 'line-through' : 'none',
            padding: '4px 12px',
            backgroundColor: 'var(--surface-color)',
            borderRadius: 'var(--radius-sm)'
          }}>
            {w}
          </div>
        ))}
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
        {selectedCells.length === 0 
          ? "Tap the FIRST letter of a word" 
          : "Now tap the LAST letter of the word"}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gap: '4px',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        backgroundColor: '#222',
        padding: '8px',
        borderRadius: 'var(--radius-lg)'
      }}>
        {grid.map((row, y) => 
          row.map((letter, x) => {
            const selected = isSelected(x, y);
            const found = isFound(x, y);
            return (
              <button
                key={`${x}-${y}`}
                onClick={() => handleCellClick(x, y)}
                disabled={gameOver}
                style={{
                  aspectRatio: '1',
                  backgroundColor: found ? 'var(--accent-success)' : selected ? 'var(--accent-primary)' : 'var(--surface-color)',
                  border: found ? 'none' : '2px solid #444',
                  borderRadius: '8px',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: (found || selected) ? '#fff' : 'var(--text-primary)',
                  transition: 'background-color 0.2s',
                  padding: 0
                }}
              >
                {letter}
              </button>
            )
          })
        )}
      </div>
      
      {gameOver && (
        <div style={{
          marginTop: 'var(--spacing-xl)',
          color: 'var(--accent-success)',
          fontSize: '2rem',
          fontWeight: 'bold',
          textAlign: 'center',
          animation: 'pulse 2s infinite'
        }}>
          🌟 All Words Found! 🌟
        </div>
      )}
    </div>
  );
}
