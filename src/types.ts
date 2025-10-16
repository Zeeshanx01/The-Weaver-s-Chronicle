export interface StorySegment {
  text: string;
  // FIX: Added 'item' and 'system' to allow for more specific log entry types used in App.tsx.
  type: 'narrative' | 'action' | 'item' | 'system';
}

export type CharacterClass = 'Warrior' | 'Rogue' | 'Mage';

export interface PlayerState {
  name: string;
  characterClass: CharacterClass;
  health: number;
  maxHealth: number;
}

export interface GameState {
  storyLog: StorySegment[];
  choices: string[];
  inventory: string[];
  isLoading: boolean;
  isGameOver: boolean;
  errorMessage: string | null;
  currentImageUrl: string | null;
  isImageLoading: boolean;
  player: PlayerState | null;
}

export interface GeminiStoryResponse {
  story: string;
  choices: string[];
  isGameOver: boolean;
  newItem?: string;
  healthChange?: number; // e.g., -10 for damage, 5 for healing
}

export interface GameHistoryEntry {
  id: number;
  date: string;
  log: StorySegment[];
  player?: { name: string; characterClass: string; };
}
