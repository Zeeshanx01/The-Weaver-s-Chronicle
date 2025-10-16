import React from 'react';

const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8 text-center text-amber-400/80">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mr-4"></div>
      <p className="text-lg animate-pulse">The story unfolds...</p>
    </div>
  );
};

export default LoadingIndicator;