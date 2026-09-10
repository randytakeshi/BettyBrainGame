import React from 'react';
import { ProgressChart } from './ProgressChart';
import { CATEGORIES } from './GameShell';

const CORE_GAMES = [
  { id: 'wordBubbles', title: 'Word Bubbles', category: 'language', icon: '🫧' },
  { id: 'starSearch', title: 'Star Search', category: 'attention', icon: '⭐' },
  { id: 'troubleBrewing', title: 'Trouble Brewing', category: 'attention', icon: '☕' },
  { id: 'tidalTreasures', title: 'Tidal Treasures', category: 'memory', icon: '🐚' },
  { id: 'colorMatch', title: 'Color Match', category: 'flexibility', icon: '🎨' },
];

const BONUS_GAMES = [
  { id: 'mathMaster', title: 'Math Master', category: 'logic', icon: '➕' },
  { id: 'wordScramble', title: 'Word Scramble', category: 'language', icon: '🔠' },
  { id: 'triviaTime', title: 'Trivia Time', category: 'knowledge', icon: '💡' },
  { id: 'patternRecall', title: 'Pattern Recall', category: 'memory', icon: '🧩' },
  { id: 'directionalDash', title: 'Directional Dash', category: 'speed', icon: '➡️' },
  { id: 'simonSays', title: 'Simon Says', category: 'memory', icon: '🎵' },
  { id: 'tetris', title: 'Betty Blocks', category: 'logic', icon: '🧱' },
  { id: 'snake', title: 'Betty Snake', category: 'speed', icon: '🐍' },
  { id: 'memoryMatch', title: 'Memory Match', category: 'memory', icon: '🃏' },
  { id: 'minesweeper', title: 'Betty Minesweeper', category: 'logic', icon: '💣' },
  { id: 'whackAMole', title: 'Whack-A-Mole', category: 'speed', icon: '🐹' },
  { id: 'flowerGuess', title: 'Flower Guess', category: 'language', icon: '🌸' },
  { id: 'wordSearch', title: 'Word Search', category: 'language', icon: '🔎' },
  { id: 'bettyWordle', title: 'Betty Wordle', category: 'language', icon: '🟩' },
  { id: 'balloonPop', title: 'Balloon Pop', category: 'speed', icon: '🎈' },
  { id: 'bettyBingo', title: 'Betty Bingo', category: 'attention', icon: '🎱' },
  { id: 'codeBreaker', title: 'Code Breaker', category: 'logic', icon: '🔐' },
  { id: 'bettySlalom', title: 'Betty Slalom', category: 'speed', icon: '⛷️' },
  { id: 'breakout', title: 'Betty Breakout', category: 'speed', icon: '🏓' },
  { id: 'etClimb', title: 'ET Climb', category: 'memory', icon: '🧗' },
  { id: 'spotTheDifference', title: 'Spot the Difference', category: 'attention', icon: '👀' },
  { id: 'ticTacToe', title: 'Tic-Tac-Toe', category: 'logic', icon: '❌' },
  { id: 'blackjack', title: 'Betty Blackjack', category: 'logic', icon: '♠️' },
  { id: 'slots', title: 'Betty Slots', category: 'attention', icon: '🎰' },
];

function GameList({ games, onSelectGame }) {
  return (
    <div className="game-list">
      {games.map(game => {
        const cat = CATEGORIES[game.category] || CATEGORIES.memory;
        return (
          <button key={game.id} className="game-row" onClick={() => onSelectGame(game.id)}>
            <span className="game-row-icon" aria-hidden="true">{game.icon}</span>
            <span className="game-row-text">
              <span className="game-row-title">{game.title}</span>
              <span className={`chip ${cat.className}`} style={{ alignSelf: 'flex-start' }}>
                {cat.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Dashboard({ history, workoutSequence, onStartWorkout, onEditRoutine, onSelectGame }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const routineTitles = (workoutSequence || [])
    .map(g => g.name)
    .join('  ·  ');

  return (
    <div className="dashboard">
      <section className="workout-card">
        <div className="workout-emoji" aria-hidden="true">🧠</div>
        <h2>Today's Brain Workout</h2>
        <p className="workout-date">{today}</p>
        {routineTitles && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>
            {routineTitles}
          </p>
        )}
        <div className="workout-actions">
          <button className="primary" onClick={onStartWorkout}>
            ▶ Start Daily Workout
          </button>
          <button className="ghost" onClick={onEditRoutine}>
            ⚙️ Settings &amp; Routine
          </button>
        </div>
      </section>

      <ProgressChart history={history} />

      <div className="section-heading">
        <h3 style={{ marginBottom: 0 }}>Today's Exercises</h3>
      </div>
      <GameList games={CORE_GAMES} onSelectGame={onSelectGame} />

      <div className="section-heading">
        <h3 style={{ marginBottom: 0 }}>Bonus Practice Games</h3>
      </div>
      <GameList games={BONUS_GAMES} onSelectGame={onSelectGame} />
    </div>
  );
}
