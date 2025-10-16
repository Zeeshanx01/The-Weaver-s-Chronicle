import React, { useState } from 'react';
import { CharacterClass, Gender, Personality } from '../types';

interface CharacterCreationScreenProps {
  onGameStart: (name: string, characterClass: CharacterClass, gender: Gender, age: number, personality: Personality) => void;
  onBack: () => void;
}

const classes: { name: CharacterClass; description: string }[] = [
  { name: 'Warrior', description: 'Master of arms and armor, ready to face any foe head-on.' },
  { name: 'Rogue', description: 'Cunning and agile, preferring stealth and subtlety over brute force.' },
  { name: 'Mage', description: 'A wielder of arcane energies, solving problems with powerful magic.' },
];

const genders: Gender[] = ['Male', 'Female', 'Non-binary'];

const personalityOptions: Record<Gender, { name: Personality; description: string }[]> = {
  Male: [
    { name: 'Brave', description: 'Fearless and heroic in the face of danger.' },
    { name: 'Cunning', description: 'Witty and strategic, always thinking ahead.' },
    { name: 'Stoic', description: 'Calm and dependable, rarely showing emotion.' },
    { name: 'Charismatic', description: 'A natural leader with a magnetic personality.' },
  ],
  Female: [
    { name: 'Fierce', description: 'Passionate and determined, a force to be reckoned with.' },
    { name: 'Wise', description: 'Insightful and perceptive, with deep knowledge.' },
    { name: 'Graceful', description: 'Elegant and poised, even in chaotic situations.' },
    { name: 'Resourceful', description: 'Able to find clever solutions to difficult problems.' },
  ],
  'Non-binary': [
    { name: 'Enigmatic', description: 'Mysterious and hard to understand, with hidden depths.' },
    { name: 'Adaptable', description: 'Flexible and able to thrive in any environment.' },
    { name: 'Visionary', description: 'Forward-thinking, with unique ideas and insights.' },
    { name: 'Reclusive', description: 'Prefers solitude, possessing a quiet strength.' },
  ],
};

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onGameStart, onBack }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [selectedPersonality, setSelectedPersonality] = useState<Personality | null>(null);
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);

  const handleGenderSelect = (gender: Gender) => {
    setSelectedGender(gender);
    setSelectedPersonality(null); // Reset personality when gender changes
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClass && selectedGender && selectedPersonality) {
      const finalName = name.trim() || 'Maya';
      
      let finalAge: number;
      if (age && parseInt(age, 10) > 0) {
          finalAge = parseInt(age, 10);
      } else {
          const dob = new Date(2004, 8, 30); // September is month 8 (0-indexed)
          const today = new Date();
          let calculatedAge = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
              calculatedAge--;
          }
          finalAge = calculatedAge;
      }
      onGameStart(finalName, selectedClass, selectedGender, finalAge, selectedPersonality);
    }
  };
  
  const isFormComplete = selectedClass && selectedGender && selectedPersonality;

  return (
    <div className="min-h-screen bg-[#1a120b] text-gray-300 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-3xl mx-auto bg-stone-900/50 p-8 rounded-lg border border-amber-800/50">
        <h1 className="text-3xl sm:text-4xl font-bold text-amber-500 text-center tracking-wider mb-6">
          Create Your Hero
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-lg text-amber-400 mb-2">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-stone-800 border border-stone-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter your hero's name"
                maxLength={50}
              />
            </div>
            <div>
              <label htmlFor="age" className="block text-lg text-amber-400 mb-2">Age</label>
              <input
                type="number"
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-2 bg-stone-800 border border-stone-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g., 25"
                min="1"
                max="200"
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg text-amber-400 mb-3">Gender</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {genders.map((gender) => (
                <button
                  type="button"
                  key={gender}
                  onClick={() => handleGenderSelect(gender)}
                  className={`p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                    selectedGender === gender 
                      ? 'bg-amber-800/50 border-amber-500 scale-105' 
                      : 'bg-stone-800/80 border-stone-700 hover:border-amber-600'
                  }`}
                >
                  <h3 className="font-bold text-xl text-amber-400">{gender}</h3>
                </button>
              ))}
            </div>
          </div>
          
          {selectedGender && (
             <div className="animate-fade-in">
              <h2 className="text-lg text-amber-400 mb-3">Personality</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalityOptions[selectedGender].map((p) => (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => setSelectedPersonality(p.name)}
                    className={`p-3 border-2 rounded-lg text-left transition-all duration-200 ${
                      selectedPersonality === p.name 
                        ? 'bg-amber-800/50 border-amber-500 scale-105' 
                        : 'bg-stone-800/80 border-stone-700 hover:border-amber-600'
                    }`}
                  >
                    <h3 className="font-bold text-lg text-amber-400">{p.name}</h3>
                    <p className="text-sm text-gray-400">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg text-amber-400 mb-3">Class</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classes.map((charClass) => (
                <button
                  type="button"
                  key={charClass.name}
                  onClick={() => setSelectedClass(charClass.name)}
                  className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
                    selectedClass === charClass.name 
                      ? 'bg-amber-800/50 border-amber-500 scale-105' 
                      : 'bg-stone-800/80 border-stone-700 hover:border-amber-600'
                  }`}
                >
                  <h3 className="font-bold text-xl text-amber-400">{charClass.name}</h3>
                  <p className="text-sm text-gray-400 mt-2">{charClass.description}</p>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-amber-800/50">
            <button
              type="submit"
              disabled={!isFormComplete}
              className="w-full sm:w-auto px-8 py-3 bg-amber-700 text-white font-bold rounded-md hover:bg-amber-600 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-amber-500 focus:ring-opacity-75 text-lg"
            >
              Start Adventure
            </button>
             <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-8 py-3 bg-stone-700 text-white font-bold rounded-md hover:bg-stone-600 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-stone-500 focus:ring-opacity-75 text-lg"
            >
              Back to Menu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CharacterCreationScreen;