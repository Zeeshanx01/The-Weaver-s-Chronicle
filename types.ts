export interface StorySegment {
  text: string;
  type: 'narrative' | 'action' | 'item' | 'system' | 'dialogue_player' | 'dialogue_npc';
  speaker?: string; // For dialogue_npc
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
  relationship: number; // -100 (hostile) to 100 (friendly), 0 is neutral
  dialogueChoices?: string[];
}

export interface GameState {
  storyLog: StorySegment[];
  choices: string[];
  inventory: string[];
  isLoading: boolean;
  isGameOver: boolean;
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
  healthChange?: number;
  npc?: {
    name:string;
    dialogue: string;
    relationshipChange?: number;
    dialogueChoices?: string[];
  };
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