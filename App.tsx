import React, { useState, useEffect, useCallback } from 'react';
import HomeScreen from './components/HomeScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import HistoryScreen from './components/HistoryScreen';
import Header from './components/Header';
import StoryLog from './components/StoryLog';
import ChoiceButtons from './components/ChoiceButtons';
import LoadingIndicator from './components/LoadingIndicator';
import GameOverScreen from './components/GameOverScreen';
import SceneImage from './components/SceneImage';
import CharacterSheet from './components/CharacterSheet';
import NpcDialogue from './components/NpcDialogue';
import ObjectiveTracker from './components/ObjectiveTracker';
import DialogueChoiceButtons from './components/DialogueChoiceButtons';
import ConfirmationDialog from './components/ConfirmationDialog';
import SaveNotification from './components/SaveNotification';
import RetryableError from './components/RetryableError';
import { getNextStorySegment, generateImageForStory } from './services/geminiService';
import { GameState, StorySegment, CharacterClass, Gender, Personality, PlayerState, GameHistoryEntry, GeminiStoryResponse } from './types';

const GAME_STATE_KEY = 'adventureGameState';
const HISTORY_KEY = 'adventureGameHistory';

const initialState: GameState = {
  storyLog: [],
  choices: [],
  inventory: [],
  isLoading: false,
  isGameOver: false,
  currentImageUrl: null,
  isImageLoading: false,
  player: null,
  currentNpc: null,
  currentObjective: null,
};

type Screen = 'home' | 'character_creation' | 'game' | 'history';

function App() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  
  // Error and retry state
  const [storyError, setStoryError] = useState<string | null>(null);
  const [isRetryable, setIsRetryable] = useState(false);
  const [lastChoice, setLastChoice] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [lastStoryTextForImage, setLastStoryTextForImage] = useState<string | null>(null);

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    const savedStateJSON = localStorage.getItem(GAME_STATE_KEY);
    if (savedStateJSON) {
      const savedState: GameState = JSON.parse(savedStateJSON);
      if (savedState.player && !savedState.isGameOver) {
        setHasSavedGame(true);
      }
    }
  }, []);

  const saveGameState = useCallback((state: GameState, showNotification = true) => {
    if (state.player && !state.isGameOver) {
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
      if (showNotification) {
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 3000);
      }
    }
  }, []);

  const saveToHistory = (log: StorySegment[], player: PlayerState | null) => {
    if (!player) return;

    const historyJSON = localStorage.getItem(HISTORY_KEY);
    const history: GameHistoryEntry[] = historyJSON ? JSON.parse(historyJSON) : [];

    const newEntry: GameHistoryEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      log,
      player: {
        name: player.name,
        characterClass: player.characterClass,
        gender: player.gender,
        age: player.age,
        personality: player.personality,
      },
    };

    const newHistory = [newEntry, ...history].slice(0, 20); // Keep last 20 games
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };


  const handleImageGeneration = async (text: string) => {
    setGameState(prev => ({ ...prev, isImageLoading: true }));
    setImageError(null);
    setLastStoryTextForImage(text);
    try {
        const imageUrl = await generateImageForStory(text);
        setGameState(prev => ({ ...prev, currentImageUrl: imageUrl, isImageLoading: false }));
    } catch (error: any) {
        setImageError(error.message);
        setGameState(prev => ({ ...prev, isImageLoading: false }));
    }
  };

  const processStoryResponse = useCallback((response: GeminiStoryResponse) => {
    let newStoryLog: StorySegment[] = [];
    
    // Add narrative
    if (response.story) {
        const narrativeSegment: StorySegment = { text: response.story, type: 'narrative' };
        newStoryLog.push(narrativeSegment);
        handleImageGeneration(response.story);
    }
    
    // Add NPC dialogue
    if (response.npc?.dialogue) {
        newStoryLog.push({ text: response.npc.dialogue, type: 'dialogue_npc', speaker: response.npc.name });
    }

    // Add new item
    if (response.newItem) {
        newStoryLog.push({ text: `You found: ${response.newItem}`, type: 'item' });
    }

    // Add health change
    if (response.healthChange) {
        const message = response.healthChange < 0
            ? `You took ${-response.healthChange} damage.`
            : `You healed for ${response.healthChange} health.`;
        newStoryLog.push({ text: message, type: 'system' });
    }

    setGameState(prev => {
        const newPlayerState = { ...prev.player! };
        if (response.healthChange) {
            newPlayerState.health = Math.max(0, Math.min(newPlayerState.maxHealth, newPlayerState.health + response.healthChange));
        }

        const newNpcState = response.npc ? {
            name: response.npc.name,
            dialogue: response.npc.dialogue || prev.currentNpc?.dialogue || '',
            relationship: (prev.currentNpc?.relationship || 0) + (response.npc.relationshipChange || 0),
            dialogueChoices: response.npc.dialogueChoices,
        } : null;
        
        const newInventory = response.newItem ? [...prev.inventory, response.newItem] : prev.inventory;

        const isGameOver = response.isGameOver || newPlayerState.health <= 0;

        const updatedState: GameState = {
            ...prev,
            storyLog: [...prev.storyLog, ...newStoryLog],
            choices: response.choices || [],
            inventory: newInventory,
            isLoading: false,
            isGameOver,
            player: newPlayerState,
            currentNpc: newNpcState,
            currentObjective: response.objective || prev.currentObjective,
        };
        
        if (isGameOver) {
            saveToHistory(updatedState.storyLog, updatedState.player);
            localStorage.removeItem(GAME_STATE_KEY);
            setHasSavedGame(false);
        } else {
            saveGameState(updatedState);
        }

        return updatedState;
    });
  }, [saveGameState]);
  
  const handleGameStart = async (name: string, characterClass: CharacterClass, gender: Gender, age: number, personality: Personality) => {
    const player: PlayerState = {
      name,
      characterClass,
      gender,
      age,
      personality,
      health: 100,
      maxHealth: 100,
    };

    const startingState: GameState = {
      ...initialState,
      player,
    };
    
    setGameState(startingState);
    setCurrentScreen('game');

    // This will be the first "choice" to kick off the story
    await handleChoice("The adventure begins.");
  };

  const handleChoice = async (choice: string) => {
    if (!gameState.player || gameState.isLoading) return;

    setLastChoice(choice);
    setStoryError(null);
    setIsRetryable(false);

    let actionType: StorySegment['type'] = gameState.currentNpc?.dialogueChoices ? 'dialogue_player' : 'action';
    
    // Don't add the initial "The adventure begins" to the log as an action
    const isFirstTurn = gameState.storyLog.length === 0;
    const choiceSegment: StorySegment | null = isFirstTurn ? null : {
      text: actionType === 'action' ? `> ${choice}` : `"${choice}"`,
      type: actionType
    };

    setGameState(prev => ({
      ...prev,
      storyLog: choiceSegment ? [...prev.storyLog, choiceSegment] : prev.storyLog,
      choices: [],
      currentNpc: prev.currentNpc ? { ...prev.currentNpc, dialogueChoices: undefined } : null,
      isLoading: true,
    }));

    try {
      const response = await getNextStorySegment(
        choiceSegment ? [...gameState.storyLog, choiceSegment] : gameState.storyLog, 
        choice,
        gameState.player,
        gameState.inventory,
        gameState.currentObjective,
        gameState.currentNpc
      );
      processStoryResponse(response);
    } catch (error: any) {
      setStoryError(error.message);
      setIsRetryable(true);
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleRetryStory = () => {
    if (lastChoice) {
        handleChoice(lastChoice);
    }
  };

  const handleRetryImage = () => {
      if (lastStoryTextForImage) {
          handleImageGeneration(lastStoryTextForImage);
      }
  };

  const resetGame = () => {
    localStorage.removeItem(GAME_STATE_KEY);
    setGameState(initialState);
    setHasSavedGame(false);
    setCurrentScreen('character_creation');
    setConfirmation(null);
    setStoryError(null);
    setIsRetryable(false);
    setImageError(null);
  };
  
  const handleRestart = () => {
    setConfirmation({
      isOpen: true,
      title: "Restart Adventure?",
      message: "Are you sure you want to restart? Your current progress will be lost.",
      onConfirm: resetGame,
    });
  };

  const handleGoHome = () => {
    saveGameState(gameState, false); // Silently save the game state
    setHasSavedGame(true); // Ensure the home screen reflects the saved game status
    setCurrentScreen('home');
  };

  const handleContinueGame = () => {
    const savedStateJSON = localStorage.getItem(GAME_STATE_KEY);
    if (savedStateJSON) {
      const savedState = JSON.parse(savedStateJSON);
      setGameState(savedState);
      setCurrentScreen('game');
    }
  };

  const handleBeginAdventure = () => {
    if (hasSavedGame) {
      setConfirmation({
        isOpen: true,
        title: "Start a New Legend?",
        message: "This will overwrite your saved game. Are you sure you want to proceed?",
        onConfirm: resetGame,
      });
    } else {
      setCurrentScreen('character_creation');
    }
  };

  const renderGameScreen = () => {
    if (!gameState.player) {
      return (
        <div className="text-center text-red-500">Error: Player data is missing. Please restart.</div>
      );
    }
    
    return (
      <div className="min-h-screen text-[#e8e0d4] flex flex-col p-4 sm:p-6 md:p-8">
        <Header onRestart={handleRestart} onGoHome={handleGoHome} />
        <main className="flex-grow flex flex-col w-full max-w-4xl mx-auto mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="flex flex-col">
              <SceneImage imageUrl={gameState.currentImageUrl} isLoading={gameState.isImageLoading} error={imageError} onRetry={handleRetryImage} />
              <StoryLog storyLog={gameState.storyLog} />
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              <CharacterSheet player={gameState.player} inventory={gameState.inventory} />
              <ObjectiveTracker objective={gameState.currentObjective} />
              {gameState.currentNpc && <NpcDialogue npc={gameState.currentNpc} />}
              
              {gameState.isGameOver ? (
                <GameOverScreen onRestart={resetGame} onGoHome={handleGoHome} />
              ) : (
                <>
                  {gameState.isLoading && <LoadingIndicator />}
                  {storyError && isRetryable && <RetryableError error={storyError} onRetry={handleRetryStory} />}
                  
                  {!storyError && gameState.currentNpc?.dialogueChoices && !gameState.isLoading && (
                    <DialogueChoiceButtons choices={gameState.currentNpc.dialogueChoices} onChoice={handleChoice} />
                  )}
                  
                  {!storyError && gameState.choices.length > 0 && !gameState.isLoading && (
                    <ChoiceButtons choices={gameState.choices} onChoice={handleChoice} />
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  };
  
  const renderScreen = () => {
    switch(currentScreen) {
      case 'home':
        return <HomeScreen onBeginAdventure={handleBeginAdventure} onViewHistory={() => setCurrentScreen('history')} onContinueGame={handleContinueGame} hasSavedGame={hasSavedGame} />;
      case 'character_creation':
        return <CharacterCreationScreen onGameStart={handleGameStart} onBack={() => setCurrentScreen('home')} />;
      case 'history':
        return <HistoryScreen onBack={() => setCurrentScreen('home')} />;
      case 'game':
        return renderGameScreen();
      default:
        return <div>Unknown screen</div>;
    }
  }

  return (
    <>
      {renderScreen()}
      {confirmation?.isOpen && (
        <ConfirmationDialog
          isOpen={confirmation.isOpen}
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={() => setConfirmation(null)}
        />
      )}
      <SaveNotification isVisible={showSaveNotification} />
    </>
  );
}

export default App;