import React from 'react';
import { NpcState } from '../types';

interface NpcDialogueProps {
  npc: NpcState;
}

const getRelationshipInfo = (score: number): { text: string; color: string } => {
  if (score <= -75) return { text: 'Arch-Nemesis', color: 'text-red-500' };
  if (score <= -40) return { text: 'Hostile', color: 'text-red-400' };
  if (score < 0) return { text: 'Wary', color: 'text-orange-400' };
  if (score === 0) return { text: 'Neutral', color: 'text-gray-400' };
  if (score < 40) return { text: 'Amicable', color: 'text-green-300' };
  if (score < 75) return { text: 'Friendly', color: 'text-green-400' };
  return { text: 'Close Ally', color: 'text-green-500' };
};

const NpcDialogue: React.FC<NpcDialogueProps> = ({ npc }) => {
  const relationship = getRelationshipInfo(npc.relationship);

  return (
    <div className="w-full mt-4 p-4 bg-black/20 border border-white/10 rounded-lg animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg text-amber-400">{npc.name}</h3>
        <p className={`text-sm font-bold ${relationship.color}`}>{relationship.text}</p>
      </div>
      <p className="text-gray-300 italic">"{npc.dialogue}"</p>
    </div>
  );
};

export default NpcDialogue;