import React from 'react';

interface HeaderProps {
  onRestart: () => void;
  onGoHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRestart, onGoHome }) => {
  return (
    <header className="w-full max-w-4xl mx-auto flex justify-between items-center pb-4 border-b-2 border-amber-800/50">
      <h1 className="text-2xl sm:text-3xl font-bold text-amber-500 tracking-wider">
        The Weaver's Chronicle
      </h1>
      <div className="flex items-center gap-4">
        <button
          onClick={onGoHome}
          className="px-4 py-2 bg-stone-700 text-white rounded-md hover:bg-stone-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-opacity-75"
        >
          Main Menu
        </button>
        <button
          onClick={onRestart}
          className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-75"
        >
          Restart
        </button>
      </div>
    </header>
  );
};

export default Header;
