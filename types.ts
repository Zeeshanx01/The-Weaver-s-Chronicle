export interface StorySegment {
  text: string;
  type: 'narrative' | 'action' | 'item' | 'system';
}

export type CharacterClass = 'Warrior' | 'Rogue' | 'Mage';
export type Gender = 'Male' | 'Female' | 'Non-binary';
export type Personality = 
  // Male
  'Brave' | 'Cunning' | 'Stoic' | 'Charismatic' |
  // Female
  'Fierce' | 'Wise' | 'Graceful' | 'Resourceful' |
  // Non-binary
  'Enigmatic' | 'Adaptable' | 'Visionary' | 'Reclusive';


export interface PlayerState {
  name: string;
  characterClass: CharacterClass;
  health: number;
  maxHealth: number;
  gender: Gender;
  age: number;
  personality: Personality;
}

export interface NpcState {
  name: string;
  dialogue: string;
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
  currentNpc: NpcState | null;
  currentObjective: string | null;
}

export interface GeminiStoryResponse {
  story: string;
  choices: string[];
  isGameOver: boolean;
  newItem?: string;
  healthChange?: number; // e.g., -10 for damage, 5 for healing
  npc?: NpcState;
  objective?: string;
}

export interface GameHistoryEntry {
  id: number;
  date: string;
  log: StorySegment[];
  player?: { 
    name: string; 
    characterClass: CharacterClass; 
    gender: Gender;
    age: number;
    personality: Personality;
  };
}