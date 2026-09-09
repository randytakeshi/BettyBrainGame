import React from 'react';
import './Card.css';

const SUIT_SYMBOLS = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣'
};

const isRed = (suit) => suit === 'H' || suit === 'D';

export default function Card({ suit, rank, faceDown = false, simplified = false, onClick, style }) {
  if (faceDown) {
    return <div className="card face-down" style={style} onClick={onClick}></div>;
  }

  const colorClass = isRed(suit) ? 'red' : 'black';
  const symbol = SUIT_SYMBOLS[suit];

  return (
    <div className={`card ${colorClass} ${simplified ? 'simplified-override' : ''}`} onClick={onClick} style={style}>
      {/* Standard Layout */}
      <div className="standard-layout">
        <div className="card-top-left">
          <div className="card-rank">{rank}</div>
          <div className="card-suit">{symbol}</div>
        </div>
        <div className="card-center">
          {symbol}
        </div>
        <div className="card-bottom-right">
          <div className="card-rank">{rank}</div>
          <div className="card-suit">{symbol}</div>
        </div>
      </div>

      {/* Giant Layout */}
      <div className="giant-layout">
        <div className="card-center giant-center">
          <div className="giant-rank">{rank}</div>
          <div className="giant-suit">{symbol}</div>
        </div>
      </div>
    </div>
  );
}
