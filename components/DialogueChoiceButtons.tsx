import React from 'react';

interface DialogueChoiceButtonsProps {
  choices: string[];
  onChoice: (choice: string) => void;
}

const DialogueChoiceButtons: React.FC<DialogueChoiceButtonsProps> = ({ choices, onChoice }) => {
  return (
    <div className="mt-4 animate-fade-in">
      <h3 className="text-lg font-bold text-sky-300 mb-3 tracking-wide">How do you respond?</h3>
      <div className="grid grid-cols-1 gap-3">
        {choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => onChoice(choice)}
            className="w-full text-left p-3 bg-black/20 border border-sky-800/50 rounded-lg hover:bg-sky-900/50 hover:border-sky-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 hover:scale-[1.02]"
          >
            "{choice}"
          </button>
        ))}
      </div>
    </div>
  );
};

export default DialogueChoiceButtons;