import React from 'react';

interface ChoiceButtonsProps {
  choices: string[];
  onChoice: (choice: string) => void;
}

const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({ choices, onChoice }) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-bold text-amber-400 mb-3 tracking-wide">What do you do?</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => onChoice(choice)}
            className="w-full text-left p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-amber-900/50 hover:border-amber-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-75 hover:scale-[1.02]"
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChoiceButtons;