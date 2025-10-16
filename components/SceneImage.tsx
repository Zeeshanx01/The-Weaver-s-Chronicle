import React from 'react';

interface SceneImageProps {
  imageUrl: string | null;
  isLoading: boolean;
}

const SceneImage: React.FC<SceneImageProps> = ({ imageUrl, isLoading }) => {
  return (
    <div className="w-full aspect-video bg-black/50 rounded-lg mb-4 border-2 border-[#8a6c3f] shadow-lg flex items-center justify-center overflow-hidden relative">
      {isLoading && (
        <div className="text-center text-amber-400/80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-40_0 mx-auto mb-2"></div>
          <p className="text-sm animate-pulse">Conjuring visuals...</p>
        </div>
      )}
      {!isLoading && imageUrl && (
        <img
          src={imageUrl}
          alt="A dynamically generated image representing the current scene in the text adventure."
          className="w-full h-full object-cover animate-fade-in"
        />
      )}
      {!isLoading && !imageUrl && (
         <div className="text-center text-gray-500 p-4">
          <p>The mists of imagination are clearing...</p>
        </div>
      )}
    </div>
  );
};

export default SceneImage;