import React from 'react';
import { PlayerState } from '../types';

interface CharacterSheetProps {
  player: PlayerState;
  inventory: string[];
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ player, inventory }) => {
  const healthPercentage = (player.health / player.maxHealth) * 100;

  return (
    <div className="w-full p-4 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 border-b border-amber-900/50 pb-3">
        <div>
            <h2 className="text-xl font-bold text-amber-500">{player.name}</h2>
            <p className="text-amber-400/90 text-sm">
                {player.age}-year-old {player.gender} {player.personality} {player.characterClass}
            </p>
        </div>
        <div className="w-full sm:w-1/3 mt-2 sm:mt-0">
            <p className="text-sm text-gray-300 mb-1 text-right">{player.health} / {player.maxHealth} HP</p>
            <div className="w-full bg-red-500/10 rounded-full h-4 border border-red-500/20">
                <div 
                    className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${healthPercentage}%` }}
                    role="progressbar"
                    aria-valuenow={player.health}
                    aria-valuemin={0}
                    aria-valuemax={player.maxHealth}
                    aria-label="Health bar"
                ></div>
            </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-amber-500 mb-2">Inventory</h3>
        {inventory.length === 0 ? (
            <p className="text-gray-500 italic">Your pockets are empty.</p>
        ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {inventory.map((item, index) => (
              <li key={index} className="bg-black/20 p-2 rounded text-center border border-white/10 capitalize">
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CharacterSheet;