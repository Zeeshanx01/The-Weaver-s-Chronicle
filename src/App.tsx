
import React, { useState, useEffect, useCallback } from 'react';
import { getNextStorySegment, generateImageForStory } from './services/geminiService';
import { StorySegment, GameState, GameHistoryEntry, CharacterClass, PlayerState } from './types';
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

const SAVE_GAME_KEY = 'adventureGameState';
const HISTORY_KEY = 'adventureGameHistory';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'characterCreation' | 'game' | 'history'>('home');
  const [gameState, setGameState] = useState<GameState>({
    storyLog: [],
    choices: [],
    inventory: [],
    isLoading: true,
    isGameOver: false,
    errorMessage: null,
    currentImageUrl: null,
    isImageLoading: false,
    player: null,
  });

  // Effect to save game state to localStorage
  useEffect(() => {
    if (view === 'game' && gameState.storyLog.length > 0 && !gameState.isLoading && !gameState.isImageLoading) {
      const stateToSave: Partial<GameState> = { ...gameState };
      delete stateToSave.isLoading;
      delete stateToSave.isImageLoading;
      delete stateToSave.errorMessage;
      localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(stateToSave));
    }
  }, [gameState, view]);

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
      player: { name: player.name, characterClass: player.characterClass }
    };
    history.unshift(newEntry); // Add new entry to the beginning
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, []);

  const navigateToCharacterCreation = () => {
    localStorage.removeItem(SAVE_GAME_KEY);
    setView('characterCreation');
  };

  const handleGameStart = useCallback(async (name: string, characterClass: CharacterClass) => {
    const player: PlayerState = { name, characterClass, health: 100, maxHealth: 100 };
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
    });
    try {
      // FIX: Pass an empty inventory array to satisfy the updated getNextStorySegment signature.
      const initialSegment = await getNextStorySegment([], `Start a new fantasy text adventure for a ${characterClass} named ${name} in a dark, mysterious forest.`, player, []);
      setGameState(prevState => ({
        ...prevState,
        storyLog: [{ text: initialSegment.story, type: 'narrative' }],
        choices: initialSegment.choices,
        isLoading: false,
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

  // Effect to load game on initial render
  useEffect(() => {
    const savedStateJSON = localStorage.getItem(SAVE_GAME_KEY);
    if (savedStateJSON) {
      try {
        const savedState: GameState = JSON.parse(savedStateJSON);
        setGameState({ 
          ...savedState, 
          inventory: savedState.inventory || [],
          player: savedState.player || null,
          isLoading: false, 
          isImageLoading: false, 
          errorMessage: null 
        });
        setView('game');
      } catch (error) {
        console.error("Failed to parse saved game state:", error);
        localStorage.removeItem(SAVE_GAME_KEY);
        setView('home');
      }
    } else {
      setView('home');
    }
  }, []);

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
      // FIX: Pass the current inventory to satisfy the updated getNextStorySegment signature.
      const nextSegment = await getNextStorySegment(currentStoryLog, choice, gameState.player, gameState.inventory);
      
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
      }));

       if (!isGameOver) {
        updateSceneImage(nextSegment.story);
      } else {
        archiveGame(newStoryLog, newPlayerState);
        localStorage.removeItem(SAVE_GAME_KEY);
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
      localStorage.removeItem(SAVE_GAME_KEY);
      setView('characterCreation');
  }

  if (view === 'home') {
    return <HomeScreen onBeginAdventure={navigateToCharacterCreation} onViewHistory={() => setView('history')} />;
  }

  if (view === 'characterCreation') {
    return <CharacterCreationScreen onGameStart={handleGameStart} onBack={() => setView('home')} />;
  }

  if (view === 'history') {
    return <HistoryScreen onBack={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#1a120b] text-gray-300 font-sans flex flex-col p-4 sm:p-6 md:p-8">
      <Header onRestart={restartGame} />
      <main className="flex-grow flex flex-col w-full max-w-4xl mx-auto mt-6">
        <SceneImage imageUrl={gameState.currentImageUrl} isLoading={gameState.isImageLoading} />
        <StoryLog storyLog={gameState.storyLog} />
        
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
        
        {!gameState.isLoading && gameState.player && (
          <CharacterSheet player={gameState.player} inventory={gameState.inventory} />
        )}
      </main>
    </div>
  );
};

export default App;
