import React from 'react';
import { NpcState } from '../types';

interface NpcDialogueProps {
  npc: NpcState;
}

const NpcDialogue: React.FC<NpcDialogueProps> = ({ npc }) => {
  return (
    <div className="w-full mt-4 p-4 bg-stone-800/70 border border-stone-700 rounded-lg animate-fade-in">
      <h3 className="font-bold text-lg text-amber-400 mb-2">{npc.name} says:</h3>
      <p className="text-gray-300 italic">"{npc.dialogue}"</p>
    </div>
  );
};

export default NpcDialogue;