import React, { useState } from 'react';
import './App.css';
import { useScore } from './hooks/useScore';
import { useProgression } from './hooks/useProgression';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Intermission } from './components/Intermission';
import { WorkoutSummary } from './components/WorkoutSummary';

import { WordBubbles } from './components/games/WordBubbles';
import { StarSearch } from './components/games/StarSearch';
import { TroubleBrewing } from './components/games/TroubleBrewing';
import { TidalTreasures } from './components/games/TidalTreasures';
import { ColorMatch } from './components/games/ColorMatch';

import { MathMaster } from './components/games/MathMaster';
import { WordScramble } from './components/games/WordScramble';
import { TriviaTime } from './components/games/TriviaTime';
import { PatternRecall } from './components/games/PatternRecall';
import { DirectionalDash } from './components/games/DirectionalDash';
import { SimonSays } from './components/games/SimonSays';
import { Tetris } from './components/games/Tetris';
import { Snake } from './components/games/Snake';
import { MemoryMatch } from './components/games/MemoryMatch';
import { Minesweeper } from './components/games/Minesweeper';
import { WhackAMole } from './components/games/WhackAMole';
import { FlowerGuess } from './components/games/FlowerGuess';
import { WordSearch } from './components/games/WordSearch';
import { SpotTheDifference } from './components/games/SpotTheDifference';
import { TicTacToe } from './components/games/TicTacToe';
import { Blackjack } from './components/games/Blackjack';
import { Slots } from './components/games/Slots';

const WORKOUT_SEQUENCE = [
  { id: 'wordBubbles', name: 'Word Bubbles' },
  { id: 'starSearch', name: 'Star Search' },
  { id: 'troubleBrewing', name: 'Trouble Brewing' },
  { id: 'tidalTreasures', name: 'Tidal Treasures' },
  { id: 'colorMatch', name: 'Color Match' }
];

const GAME_NAMES = {
  wordBubbles: 'Word Bubbles',
  starSearch: 'Star Search',
  troubleBrewing: 'Trouble Brewing',
  tidalTreasures: 'Tidal Treasures',
  colorMatch: 'Color Match',
  mathMaster: 'Math Master',
  wordScramble: 'Word Scramble',
  triviaTime: 'Trivia Time',
  patternRecall: 'Pattern Recall',
  directionalDash: 'Directional Dash',
  simonSays: 'Simon Says',
  tetris: 'Betty Blocks',
  snake: 'Betty Snake',
  memoryMatch: 'Memory Match',
  minesweeper: 'Betty Minesweeper',
  whackAMole: 'Whack-A-Mole',
  flowerGuess: 'Flower Guess',
  wordSearch: 'Word Search',
  spotTheDifference: 'Spot the Difference',
  ticTacToe: 'Tic-Tac-Toe',
  blackjack: 'Betty Blackjack',
  slots: 'Betty Slots'
};

function App() {
  const { score, streak, addScore } = useScore();
  const { levels, levelUp, getLevel } = useProgression();
  
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [workoutIndex, setWorkoutIndex] = useState(-1);
  const [sessionScore, setSessionScore] = useState(0);
  const [lastGameInfo, setLastGameInfo] = useState(null);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreen]);

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
    setWorkoutIndex(-1);
    setSessionScore(0);
    setLastGameInfo(null);
  };

  const startDailyWorkout = () => {
    setWorkoutIndex(0);
    setSessionScore(0);
    setCurrentScreen(WORKOUT_SEQUENCE[0].id);
  };

  const handleGameComplete = (gameId, result) => {
    addScore(result.score);
    setSessionScore(prev => prev + result.score);
    
    if (result.isPerfect) {
      levelUp(gameId);
    }

    setLastGameInfo({
      id: gameId,
      name: GAME_NAMES[gameId],
      result
    });

    if (workoutIndex !== -1) {
      // In workout mode
      const nextIndex = workoutIndex + 1;
      if (nextIndex < WORKOUT_SEQUENCE.length) {
        setCurrentScreen('intermission');
      } else {
        // Finished workout
        setCurrentScreen('summary');
      }
    } else {
      // Free play mode -> just show summary for the single game
      setCurrentScreen('summary');
    }
  };

  const handleNextFromIntermission = () => {
    const nextIndex = workoutIndex + 1;
    setWorkoutIndex(nextIndex);
    setCurrentScreen(WORKOUT_SEQUENCE[nextIndex].id);
  };

  return (
    <div className="app-container">
      <Header score={score} streak={streak} />
      
      {currentScreen === 'dashboard' && (
        <Dashboard 
          onStartWorkout={startDailyWorkout}
          onSelectGame={(gameId) => {
            setWorkoutIndex(-1);
            setSessionScore(0);
            setCurrentScreen(gameId);
          }} 
        />
      )}

      {currentScreen === 'intermission' && lastGameInfo && (
        <Intermission 
          lastGameName={lastGameInfo.name}
          lastGameResult={lastGameInfo.result}
          nextGameName={WORKOUT_SEQUENCE[workoutIndex + 1].name}
          onNext={handleNextFromIntermission}
        />
      )}

      {currentScreen === 'summary' && (
        <WorkoutSummary 
          totalScore={sessionScore}
          streak={streak}
          onFinish={handleBackToDashboard}
        />
      )}
      
      {currentScreen === 'wordBubbles' && <WordBubbles level={getLevel('wordBubbles')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('wordBubbles', res)} />}
      {currentScreen === 'starSearch' && <StarSearch level={getLevel('starSearch')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('starSearch', res)} />}
      {currentScreen === 'troubleBrewing' && <TroubleBrewing level={getLevel('troubleBrewing')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('troubleBrewing', res)} />}
      {currentScreen === 'tidalTreasures' && <TidalTreasures level={getLevel('tidalTreasures')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('tidalTreasures', res)} />}
      {currentScreen === 'colorMatch' && <ColorMatch level={getLevel('colorMatch')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('colorMatch', res)} />}
      
      {/* Bonus Games */}
      {currentScreen === 'mathMaster' && <MathMaster level={getLevel('mathMaster')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('mathMaster', res)} />}
      {currentScreen === 'wordScramble' && <WordScramble level={getLevel('wordScramble')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('wordScramble', res)} />}
      {currentScreen === 'triviaTime' && <TriviaTime level={getLevel('triviaTime')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('triviaTime', res)} />}
      {currentScreen === 'patternRecall' && <PatternRecall level={getLevel('patternRecall')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('patternRecall', res)} />}
      {currentScreen === 'directionalDash' && <DirectionalDash level={getLevel('directionalDash')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('directionalDash', res)} />}
      {currentScreen === 'simonSays' && <SimonSays level={getLevel('simonSays')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('simonSays', res)} />}
      {currentScreen === 'tetris' && <Tetris level={getLevel('tetris')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('tetris', res)} />}
      {currentScreen === 'snake' && <Snake level={getLevel('snake')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('snake', res)} />}
      {currentScreen === 'memoryMatch' && <MemoryMatch level={getLevel('memoryMatch')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('memoryMatch', res)} />}
      {currentScreen === 'minesweeper' && <Minesweeper level={getLevel('minesweeper')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('minesweeper', res)} />}
      {currentScreen === 'whackAMole' && <WhackAMole level={getLevel('whackAMole')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('whackAMole', res)} />}
      {currentScreen === 'flowerGuess' && <FlowerGuess level={getLevel('flowerGuess')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('flowerGuess', res)} />}
      {currentScreen === 'wordSearch' && <WordSearch level={getLevel('wordSearch')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('wordSearch', res)} />}
      {currentScreen === 'spotTheDifference' && <SpotTheDifference level={getLevel('spotTheDifference')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('spotTheDifference', res)} />}
      {currentScreen === 'ticTacToe' && <TicTacToe level={getLevel('ticTacToe')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('ticTacToe', res)} />}
      {currentScreen === 'blackjack' && <Blackjack level={getLevel('blackjack')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('blackjack', res)} />}
      {currentScreen === 'slots' && <Slots level={getLevel('slots')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('slots', res)} />}
      
    </div>
  );
}

export default App;
