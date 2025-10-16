import React from 'react';

interface ChoiceButtonsProps {
  choices: string[];
  onChoice: (choice: string) => void;
}

const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({ choices, onChoice }) => {
  if (choices.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-4">
      <h3 className="text-lg text-amber-400 mb-3">What will you do next?</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => onChoice(choice)}
            className="w-full text-left p-4 bg-stone-800/80 border border-stone-700 rounded-lg text-gray-300 hover:bg-amber-800/40 hover:border-amber-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-75"
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChoiceButtons;