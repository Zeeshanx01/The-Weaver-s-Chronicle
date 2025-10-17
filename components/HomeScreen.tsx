import React from 'react';

interface HomeScreenProps {
  onBeginAdventure: () => void;
  onViewHistory: () => void;
  onContinueGame: () => void;
  hasSavedGame: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onBeginAdventure, onViewHistory, onContinueGame, hasSavedGame }) => {
  return (
    <div className="min-h-screen text-[#e8e0d4] flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="text-center w-full max-w-2xl mx-auto">
        <h1 className="text-5xl sm:text-7xl font-bold text-amber-500 tracking-wider mb-4" style={{ fontFamily: "'EB Garamond', serif" }}>
          The Weaver's Chronicle
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed">
          Your fate is unwritten. A new world, woven from your choices, awaits.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          {hasSavedGame && (
            <button
              onClick={onContinueGame}
              className="px-8 py-4 bg-green-700 text-white font-bold rounded-md hover:bg-green-600 transition-transform transform hover:scale-105 duration-300 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-75 text-xl shadow-lg shadow-green-900/50 sm:order-first"
            >
              Continue Adventure
            </button>
          )}
          <button
            onClick={onBeginAdventure}
            className="px-8 py-4 bg-amber-700 text-white font-bold rounded-md hover:bg-amber-600 transition-transform transform hover:scale-105 duration-300 focus:outline-none focus:ring-4 focus:ring-amber-500 focus:ring-opacity-75 text-xl shadow-lg shadow-amber-900/50"
          >
            {hasSavedGame ? 'Start a New Legend' : 'Begin a New Legend'}
          </button>
          <button
            onClick={onViewHistory}
            className="px-8 py-4 bg-white/5 text-white font-bold rounded-md hover:bg-white/10 transition-transform transform hover:scale-105 duration-300 focus:outline-none focus:ring-4 focus:ring-stone-500 focus:ring-opacity-75 text-xl shadow-lg shadow-stone-900/50"
          >
            Chronicles of the Past
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;