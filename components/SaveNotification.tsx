import React from 'react';

interface SaveNotificationProps {
  isVisible: boolean;
}

const SaveNotification: React.FC<SaveNotificationProps> = ({ isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-stone-800 text-amber-400 px-4 py-2 rounded-lg shadow-lg border border-amber-700/50 animate-fade-in-out z-50">
      <p>Checkpoint Reached. Game Saved.</p>
    </div>
  );
};

export default SaveNotification;
