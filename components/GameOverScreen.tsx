import React from 'react';

interface GameOverScreenProps {
  onRestart: () => void;
  onGoHome: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ onRestart, onGoHome }) => {
  return (
    <div className="text-center p-8 mt-4 bg-stone-900/50 border border-amber-700 rounded-lg flex flex-col items-center animate-fade-in">
      <h2 className="text-3xl font-bold text-amber-500 mb-4">The End</h2>
      <p className="text-gray-300 mb-6">Your adventure has been recorded in the chronicles. Thank you for playing!</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-amber-700 text-white font-bold rounded-md hover:bg-amber-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-75 text-lg"
        >
          Play Again
        </button>
        <button
          onClick={onGoHome}
          className="px-6 py-3 bg-stone-700 text-white font-bold rounded-md hover:bg-stone-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-opacity-75 text-lg"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
