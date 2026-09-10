import React, { useState } from 'react';
import './App.css';
import { useScore } from './hooks/useScore';
import { useProgression } from './hooks/useProgression';
import { useSettings } from './hooks/useSettings';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Intermission } from './components/Intermission';
import { WorkoutSummary } from './components/WorkoutSummary';
import { EditRoutine } from './components/EditRoutine';

import { WordBubbles } from './components/games/WordBubbles';
import { StarSearch } from './components/games/StarSearch';
import { TroubleBrewing } from './components/games/TroubleBrewing';
import { TidalTreasures } from './components/games/TidalTreasures';
import { ColorMatch } from './components/games/ColorMatch';

// Motion Games
import { FlockMigration } from './components/games/FlockMigration';
import { FloatingBubbles } from './components/games/FloatingBubbles';
import { CoffeeConveyor } from './components/games/CoffeeConveyor';
import { WashingWaves } from './components/games/WashingWaves';
import { RapidSwipe } from './components/games/RapidSwipe';

// Cognitive Games
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
import { BettyWordle } from './components/games/BettyWordle';
import { BettyBingo } from './components/games/BettyBingo';
import { BalloonPop } from './components/games/BalloonPop';
import { CodeBreaker } from './components/games/CodeBreaker';
import { BettySlalom } from './components/games/BettySlalom';
import { Breakout } from './components/games/Breakout';
import { Blackjack } from './components/games/Blackjack';
import { Slots } from './components/games/Slots';

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
  bettyWordle: 'Betty Wordle',
  balloonPop: 'Balloon Pop',
  bettyBingo: 'Betty Bingo',
  codeBreaker: 'Code Breaker',
  bettySlalom: 'Betty Slalom',
  breakout: 'Betty Breakout',
  spotTheDifference: 'Spot the Difference',
  ticTacToe: 'Tic-Tac-Toe',
  blackjack: 'Betty Blackjack',
  slots: 'Betty Slots'
};

function App() {
  const { score, streak, history, addScore } = useScore();
  const { levels, levelUp, getLevel } = useProgression();
  const { workoutSequence, updateWorkoutSequence, difficulty, updateDifficulty, timerMode, updateTimerMode, motionMode, updateMotionMode } = useSettings();

  const getEffectiveLevel = (gameId) => {
    if (difficulty === 'advanced') return 5;
    if (difficulty === 'intermediate') return Math.max(3, getLevel(gameId));
    return getLevel(gameId);
  };
  
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
    setCurrentScreen(workoutSequence[0].id);
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
      if (nextIndex < workoutSequence.length) {
        setCurrentScreen('intermission');
      } else {
        // Finished workout
        setCurrentScreen('summary');
      }
    } else {
      // Free play: the game already showed its own results screen
      handleBackToDashboard();
    }
  };

  const handleNextFromIntermission = () => {
    const nextIndex = workoutIndex + 1;
    setWorkoutIndex(nextIndex);
    setCurrentScreen(workoutSequence[nextIndex].id);
  };

  return (
    <div className="app-container">
      <Header score={score} streak={streak} />
      
      {currentScreen === 'dashboard' && (
        <Dashboard
          history={history}
          workoutSequence={workoutSequence}
          onStartWorkout={startDailyWorkout}
          onEditRoutine={() => setCurrentScreen('editRoutine')}
          onSelectGame={(gameId) => {
            setWorkoutIndex(-1);
            setSessionScore(0);
            setCurrentScreen(gameId);
          }} 
        />
      )}

      {currentScreen === 'editRoutine' && (
        <EditRoutine 
          currentSequence={workoutSequence} 
          onUpdateSequence={updateWorkoutSequence} 
          difficulty={difficulty}
          onUpdateDifficulty={updateDifficulty}
          timerMode={timerMode}
          onUpdateTimerMode={updateTimerMode}
          motionMode={motionMode}
          onUpdateMotionMode={updateMotionMode}
          onBack={handleBackToDashboard} 
        />
      )}

      {currentScreen === 'intermission' && lastGameInfo && (
        <Intermission
          lastGameName={lastGameInfo.name}
          lastGameResult={lastGameInfo.result}
          nextGameName={workoutSequence[workoutIndex + 1].name}
          gameIndex={workoutIndex}
          totalGames={workoutSequence.length}
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
      
      {currentScreen === 'wordBubbles' && (motionMode ? 
        <FloatingBubbles timerMode={timerMode} level={getEffectiveLevel('wordBubbles')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('wordBubbles', res)} /> : 
        <WordBubbles timerMode={timerMode} level={getEffectiveLevel('wordBubbles')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('wordBubbles', res)} />
      )}
      {currentScreen === 'starSearch' && (motionMode ?
        <FlockMigration timerMode={timerMode} level={getEffectiveLevel('starSearch')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('starSearch', res)} /> :
        <StarSearch timerMode={timerMode} level={getEffectiveLevel('starSearch')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('starSearch', res)} />
      )}
      {currentScreen === 'troubleBrewing' && (motionMode ?
        <CoffeeConveyor timerMode={timerMode} level={getEffectiveLevel('troubleBrewing')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('troubleBrewing', res)} /> :
        <TroubleBrewing timerMode={timerMode} level={getEffectiveLevel('troubleBrewing')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('troubleBrewing', res)} />
      )}
      {currentScreen === 'tidalTreasures' && (motionMode ?
        <WashingWaves timerMode={timerMode} level={getEffectiveLevel('tidalTreasures')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('tidalTreasures', res)} /> :
        <TidalTreasures timerMode={timerMode} level={getEffectiveLevel('tidalTreasures')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('tidalTreasures', res)} />
      )}
      {currentScreen === 'colorMatch' && (motionMode ?
        <RapidSwipe timerMode={timerMode} level={getEffectiveLevel('colorMatch')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('colorMatch', res)} /> :
        <ColorMatch timerMode={timerMode} level={getEffectiveLevel('colorMatch')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('colorMatch', res)} />
      )}
      
      {/* Bonus Games */}
      {currentScreen === 'mathMaster' && <MathMaster level={getEffectiveLevel('mathMaster')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('mathMaster', res)} />}
      {currentScreen === 'wordScramble' && <WordScramble level={getEffectiveLevel('wordScramble')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('wordScramble', res)} />}
      {currentScreen === 'triviaTime' && <TriviaTime level={getEffectiveLevel('triviaTime')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('triviaTime', res)} />}
      {currentScreen === 'patternRecall' && <PatternRecall level={getEffectiveLevel('patternRecall')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('patternRecall', res)} />}
      {currentScreen === 'directionalDash' && <DirectionalDash level={getEffectiveLevel('directionalDash')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('directionalDash', res)} />}
      {currentScreen === 'simonSays' && <SimonSays level={getEffectiveLevel('simonSays')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('simonSays', res)} />}
      {currentScreen === 'tetris' && <Tetris level={getEffectiveLevel('tetris')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('tetris', res)} />}
      {currentScreen === 'snake' && <Snake level={getEffectiveLevel('snake')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('snake', res)} />}
      {currentScreen === 'memoryMatch' && <MemoryMatch level={getEffectiveLevel('memoryMatch')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('memoryMatch', res)} />}
      {currentScreen === 'minesweeper' && <Minesweeper level={getEffectiveLevel('minesweeper')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('minesweeper', res)} />}
      {currentScreen === 'whackAMole' && <WhackAMole level={getEffectiveLevel('whackAMole')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('whackAMole', res)} />}
      {/* Variety Games */}
      {currentScreen === 'flowerGuess' && <FlowerGuess level={getEffectiveLevel('flowerGuess')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('flowerGuess', res)} />}
      {currentScreen === 'wordSearch' && <WordSearch level={getEffectiveLevel('wordSearch')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('wordSearch', res)} />}
      {currentScreen === 'bettyWordle' && <BettyWordle level={getEffectiveLevel('bettyWordle')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('bettyWordle', res)} />}
      {currentScreen === 'balloonPop' && <BalloonPop level={getEffectiveLevel('balloonPop')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('balloonPop', res)} />}
      {currentScreen === 'bettyBingo' && <BettyBingo level={getEffectiveLevel('bettyBingo')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('bettyBingo', res)} />}
      {currentScreen === 'codeBreaker' && <CodeBreaker level={getEffectiveLevel('codeBreaker')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('codeBreaker', res)} />}
      {currentScreen === 'bettySlalom' && <BettySlalom level={getEffectiveLevel('bettySlalom')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('bettySlalom', res)} />}
      {currentScreen === 'breakout' && <Breakout level={getEffectiveLevel('breakout')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('breakout', res)} />}
      {currentScreen === 'spotTheDifference' && <SpotTheDifference level={getEffectiveLevel('spotTheDifference')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('spotTheDifference', res)} />}
      {currentScreen === 'ticTacToe' && <TicTacToe level={getEffectiveLevel('ticTacToe')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('ticTacToe', res)} />}
      
      {/* Casino Games */}
      {currentScreen === 'blackjack' && <Blackjack level={getEffectiveLevel('blackjack')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('blackjack', res)} />}
      {currentScreen === 'slots' && <Slots level={getEffectiveLevel('slots')} onBack={handleBackToDashboard} onComplete={(res) => handleGameComplete('slots', res)} />}
      
    </div>
  );
}

export default App;
