import React, { useState, useEffect } from 'react';
import { GameHistoryEntry } from '../types';
import StoryLog from './StoryLog';

interface HistoryScreenProps {
  onBack: () => void;
}

const HISTORY_KEY = 'adventureGameHistory';

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<GameHistoryEntry | null>(null);

  useEffect(() => {
    const historyJSON = localStorage.getItem(HISTORY_KEY);
    if (historyJSON) {
      setHistory(JSON.parse(historyJSON));
    }
  }, []);

  if (selectedLog) {
    return (
      <div className="min-h-screen bg-[#1a120b] text-gray-300 flex flex-col p-4 sm:p-6 md:p-8 animate-fade-in">
        <header className="w-full max-w-4xl mx-auto flex justify-between items-center pb-4 border-b-2 border-amber-800/50">
           <h1 className="text-2xl sm:text-3xl font-bold text-amber-500 tracking-wider">
            Chronicle from {selectedLog.date}
          </h1>
          <button
            onClick={() => setSelectedLog(null)}
            className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-600 transition-colors duration-200"
          >
            &larr; Back to Chronicles
          </button>
        </header>
        <main className="flex-grow flex flex-col w-full max-w-4xl mx-auto mt-6">
            {selectedLog.player && (
              <div className="mb-4 text-center p-3 bg-stone-900/50 rounded-md border border-amber-800/50">
                <p className="text-amber-400 font-bold text-xl">The Legend of {selectedLog.player.name} the {selectedLog.player.personality} {selectedLog.player.characterClass}</p>
                <p className="text-gray-400 text-md">A {selectedLog.player.age}-year-old {selectedLog.player.gender}</p>
              </div>
            )}
            <StoryLog storyLog={selectedLog.log} isStatic={true} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a120b] text-gray-300 flex flex-col p-4 sm:p-6 md:p-8 animate-fade-in">
      <header className="w-full max-w-4xl mx-auto flex justify-between items-center pb-4 border-b-2 border-amber-800/50">
        <h1 className="text-2xl sm:text-3xl font-bold text-amber-500 tracking-wider">
          Chronicles of the Past
        </h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-600 transition-colors duration-200"
        >
          &larr; Main Menu
        </button>
      </header>
      <main className="flex-grow w-full max-w-4xl mx-auto mt-6">
        {history.length === 0 ? (
          <p className="text-center text-gray-400 text-lg">Your chronicles are empty. Go forth and create a new legend!</p>
        ) : (
          <ul className="space-y-4">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  onClick={() => setSelectedLog(entry)}
                  className="w-full text-left p-4 bg-stone-800/80 border border-stone-700 rounded-lg text-gray-300 hover:bg-amber-800/40 hover:border-amber-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <p className="font-bold text-amber-400">
                    {entry.player ? `${entry.player.name} the ${entry.player.personality} ${entry.player.characterClass}` : 'An Unknown Hero'}
                  </p>
                  <p className="text-gray-500 text-sm">{entry.date}</p>
                  <p className="text-gray-400 italic mt-2 truncate">
                    {entry.log.find(s => s.type === 'narrative')?.text ?? 'An untold story...'}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default HistoryScreen;