import React from 'react';

interface SceneImageProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const SceneImage: React.FC<SceneImageProps> = ({ imageUrl, isLoading, error, onRetry }) => {
  return (
    <div className="w-full aspect-video bg-black/50 rounded-lg mb-4 border border-white/10 shadow-lg flex items-center justify-center overflow-hidden relative">
      {isLoading && (
        <div className="text-center text-amber-400/80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-40_0 mx-auto mb-2"></div>
          <p className="text-sm animate-pulse">Conjuring visuals...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="text-center text-red-400 p-4 animate-fade-in">
            <p className="mb-3">{error}</p>
            <button
                onClick={onRetry}
                className="px-4 py-1 bg-amber-700 text-white text-sm font-bold rounded-md hover:bg-amber-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
                Retry
            </button>
        </div>
      )}
      {!isLoading && !error && imageUrl && (
        <img
          src={imageUrl}
          alt="A dynamically generated image representing the current scene in the text adventure."
          className="w-full h-full object-cover animate-fade-in"
        />
      )}
      {!isLoading && !error && !imageUrl && (
         <div className="text-center text-gray-500 p-4">
          <p>The mists of imagination are clearing...</p>
        </div>
      )}
    </div>
  );
};

export default SceneImage;