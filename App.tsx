import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getNextStorySegment, generateImageForStory } from './services/geminiService';
import { StorySegment, GameState, GameHistoryEntry, CharacterClass, PlayerState, NpcState, Gender, Personality } from './types';
import Header from './components/Header';
import StoryLog from './components/StoryLog';
import ChoiceButtons from './components/ChoiceButtons';
import LoadingIndicator from './components/LoadingIndicator';
import GameOverScreen from './components/GameOverScreen';
import SceneImage from './components/SceneImage';
import CharacterSheet from './components/CharacterSheet';
import HomeScreen from './components/HomeScreen';
import HistoryScreen from './components/HistoryScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import NpcDialogue from './components/NpcDialogue';
import ObjectiveTracker from './components/ObjectiveTracker';
import SaveNotification from './components/SaveNotification';

const SAVE_GAME_KEY = 'adventureGameState';
const HISTORY_KEY = 'adventureGameHistory';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'characterCreation' | 'game' | 'history'>('home');
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const saveNotificationTimer = useRef<number | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    storyLog: [],
    choices: [],
    inventory: [],
    isLoading: false,
    isGameOver: false,
    errorMessage: null,
    currentImageUrl: null,
    isImageLoading: false,
    player: null,
    currentNpc: null,
    currentObjective: null,
  });

  // Effect to auto-save the game at checkpoints (i.e., when the story log updates)
  useEffect(() => {
    // A checkpoint is reached when the story progresses and we are not in a loading state.
    if (view === 'game' && gameState.storyLog.length > 0 && !gameState.isGameOver && !gameState.isLoading) {
      const stateToSave: Partial<GameState> = { ...gameState };
      // Omit transient state properties
      delete stateToSave.isLoading;
      delete stateToSave.isImageLoading;
      delete stateToSave.errorMessage;
      
      localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(stateToSave));
      setHasSavedGame(true);

      // Manage the visual notification
      if (saveNotificationTimer.current) {
          clearTimeout(saveNotificationTimer.current);
      }
      setShowSaveNotification(true);
      saveNotificationTimer.current = window.setTimeout(() => {
          setShowSaveNotification(false);
      }, 2500);
    }
  }, [gameState.storyLog, gameState.isLoading, gameState.isGameOver, view]);

  // Cleanup timer on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (saveNotificationTimer.current) {
          clearTimeout(saveNotificationTimer.current);
      }
    };
  }, []);

  // Effect to check for a saved game only on initial mount
  useEffect(() => {
    const savedStateJSON = localStorage.getItem(SAVE_GAME_KEY);
    setHasSavedGame(!!savedStateJSON);
    setView('home');
  }, []);

  const updateSceneImage = useCallback(async (storyText: string) => {
    setGameState(prevState => ({ ...prevState, isImageLoading: true }));
    try {
      const imageUrl = await generateImageForStory(storyText);
      setGameState(prevState => ({ 
        ...prevState, 
        currentImageUrl: imageUrl, 
        isImageLoading: false 
      }));
    } catch (error) {
      console.error("Failed to update scene image:", error);
      setGameState(prevState => ({ ...prevState, isImageLoading: false }));
    }
  }, []);
  
  const archiveGame = useCallback((finalLog: StorySegment[], player: PlayerState | null) => {
    if (!player) return;
    const historyJSON = localStorage.getItem(HISTORY_KEY);
    const history: GameHistoryEntry[] = historyJSON ? JSON.parse(historyJSON) : [];
    const newEntry: GameHistoryEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      log: finalLog,
      player: { 
        name: player.name, 
        characterClass: player.characterClass,
        gender: player.gender,
        age: player.age,
        personality: player.personality
      }
    };
    history.unshift(newEntry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, []);

  const handleGameStart = useCallback(async (name: string, characterClass: CharacterClass, gender: Gender, age: number, personality: Personality) => {
    const player: PlayerState = { name, characterClass, health: 100, maxHealth: 100, gender, age, personality };
    setView('game');
    setGameState({
      storyLog: [],
      choices: [],
      inventory: [],
      isLoading: true,
      isGameOver: false,
      errorMessage: null,
      currentImageUrl: null,
      isImageLoading: false,
      player: player,
      currentNpc: null,
      currentObjective: null,
    });
    try {
      const initialSegment = await getNextStorySegment([], `Start a new fantasy text adventure for a ${characterClass} named ${name} in a dark, mysterious forest.`, player, [], null);
      setGameState(prevState => ({
        ...prevState,
        storyLog: [{ text: initialSegment.story, type: 'narrative' }],
        choices: initialSegment.choices,
        isLoading: false,
        currentObjective: initialSegment.objective || null,
      }));
      updateSceneImage(initialSegment.story);
    } catch (error) {
      console.error('Failed to start game:', error);
      setGameState(prevState => ({
        ...prevState,
        isLoading: false,
        errorMessage: 'Failed to connect to the story engine. Please check your API key and try again.',
      }));
    }
  }, [updateSceneImage]);

  const handleContinueGame = () => {
    const savedStateJSON = localStorage.getItem(SAVE_GAME_KEY);
    if (savedStateJSON) {
      try {
        const savedState: GameState = JSON.parse(savedStateJSON);
        setGameState({
            ...savedState,
            isLoading: false,
            isImageLoading: false,
            errorMessage: null
        });
        setView('game');
      } catch (error) {
        console.error("Failed to parse saved game state:", error);
        localStorage.removeItem(SAVE_GAME_KEY);
        setHasSavedGame(false);
        setView('home');
      }
    }
  };

  const handleChoice = async (choice: string) => {
    if (!gameState.player) return;

    const currentStoryLog: StorySegment[] = [
      ...gameState.storyLog,
      { text: `> ${choice}`, type: 'action' },
    ];

    setGameState(prevState => ({
      ...prevState,
      storyLog: currentStoryLog,
      choices: [],
      isLoading: true,
      errorMessage: null,
    }));

    try {
      const nextSegment = await getNextStorySegment(currentStoryLog, choice, gameState.player, gameState.inventory, gameState.currentObjective);
      
      let newStoryLog: StorySegment[] = [...currentStoryLog, { text: nextSegment.story, type: 'narrative' }];
      let newInventory = [...gameState.inventory];
      let newPlayerState = { ...gameState.player };

      if (nextSegment.newItem && !gameState.inventory.includes(nextSegment.newItem)) {
        newInventory.push(nextSegment.newItem);
        newStoryLog.push({ text: `You acquired: ${nextSegment.newItem}`, type: 'item' });
      }

      if (nextSegment.healthChange) {
        newPlayerState.health = Math.max(0, Math.min(newPlayerState.maxHealth, newPlayerState.health + nextSegment.healthChange));
        const healthChangeText = nextSegment.healthChange > 0 ? `You gained ${nextSegment.healthChange} health.` : `You lost ${-nextSegment.healthChange} health.`;
        newStoryLog.push({ text: healthChangeText, type: 'system' });
      }
      
      const isGameOver = nextSegment.isGameOver || newPlayerState.health <= 0;
      if (newPlayerState.health <= 0 && !nextSegment.isGameOver) {
          newStoryLog.push({ text: "Your health has been depleted. Your journey ends here.", type: 'narrative' });
      }

      setGameState(prevState => ({
        ...prevState,
        storyLog: newStoryLog,
        choices: isGameOver ? [] : nextSegment.choices,
        inventory: newInventory,
        isLoading: false,
        isGameOver: isGameOver,
        currentImageUrl: null,
        player: newPlayerState,
        currentNpc: nextSegment.npc || null,
        currentObjective: nextSegment.objective !== undefined ? (nextSegment.objective || null) : prevState.currentObjective,
      }));

       if (!isGameOver) {
        updateSceneImage(nextSegment.story);
      } else {
        archiveGame(newStoryLog, newPlayerState);
        localStorage.removeItem(SAVE_GAME_KEY);
        setHasSavedGame(false);
      }
    } catch (error) {
      console.error('Failed to get next story segment:', error);
       setGameState(prevState => ({
        ...prevState,
        isLoading: false,
        errorMessage: 'The story took an unexpected turn and could not continue. Please try a different path or restart.',
      }));
    }
  };
  
  const restartGame = () => {
      const confirmRestart = () => {
        localStorage.removeItem(SAVE_GAME_KEY);
        setHasSavedGame(false);
        setView('characterCreation');
      };

      if (hasSavedGame) {
        if (window.confirm("Are you sure you want to start a new game? Your current progress will be lost.")) {
          confirmRestart();
        }
      } else {
        confirmRestart();
      }
  }
  
  const handleGoHome = () => {
      setView('home');
  }

  if (view === 'home') {
    return <HomeScreen
      onBeginAdventure={restartGame}
      onViewHistory={() => setView('history')}
      onContinueGame={handleContinueGame}
      hasSavedGame={hasSavedGame}
    />;
  }

  if (view === 'characterCreation') {
    return <CharacterCreationScreen onGameStart={handleGameStart} onBack={() => setView('home')} />;
  }

  if (view === 'history') {
    return <HistoryScreen onBack={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#1a120b] text-gray-300 font-sans flex flex-col p-4 sm:p-6 lg:p-8">
      <SaveNotification isVisible={showSaveNotification} />
      <Header onRestart={restartGame} onGoHome={handleGoHome} />
      <main className="flex-grow w-full max-w-7xl mx-auto mt-6 flex flex-col lg:flex-row lg:gap-8">
        {/* Left Column: Story and Visuals */}
        <div className="lg:w-3/5 flex flex-col">
          <SceneImage imageUrl={gameState.currentImageUrl} isLoading={gameState.isImageLoading} />
          <StoryLog storyLog={gameState.storyLog} />
        </div>

        {/* Right Column: Character Info and Actions */}
        <div className="lg:w-2/5 flex flex-col">
          {gameState.player && (
            <CharacterSheet player={gameState.player} inventory={gameState.inventory} />
          )}

          <ObjectiveTracker objective={gameState.currentObjective} />

          {gameState.currentNpc && (
            <NpcDialogue npc={gameState.currentNpc} />
          )}
          
          <div className="mt-auto pt-4">
            {gameState.errorMessage && (
              <div className="my-4 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-md">
                <p className="font-bold">An Error Occurred</p>
                <p>{gameState.errorMessage}</p>
              </div>
            )}

            {gameState.isLoading && <LoadingIndicator />}
            
            {!gameState.isLoading && !gameState.isGameOver && (
              <ChoiceButtons choices={gameState.choices} onChoice={handleChoice} />
            )}
            
            {gameState.isGameOver && (
               <GameOverScreen onRestart={restartGame} onGoHome={() => setView('home')} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;