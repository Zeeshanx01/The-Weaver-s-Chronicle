import React from 'react';

interface ObjectiveTrackerProps {
  objective: string | null;
}

const ObjectiveTracker: React.FC<ObjectiveTrackerProps> = ({ objective }) => {
  if (!objective) {
    return null;
  }

  return (
    <div className="w-full mt-4 p-4 bg-black/20 border border-amber-900/50 rounded-lg animate-fade-in">
      <h3 className="font-bold text-lg text-amber-400 mb-2 tracking-wide">Current Objective</h3>
      <p className="text-gray-300">{objective}</p>
    </div>
  );
};

export default ObjectiveTracker;