import React, { useEffect, useRef } from 'react';
import { StorySegment } from '../types';
import { useTypewriter } from '../hooks/useTypewriter';

interface StoryLogProps {
  storyLog: StorySegment[];
  isStatic?: boolean; // Add this prop
}

const AnimatedNarrative: React.FC<{ text: string }> = ({ text }) => {
    const { displayText, isFinished } = useTypewriter(text);
    return <span className={!isFinished ? 'typing-caret' : ''}>{displayText}</span>;
};


const StoryLog: React.FC<StoryLogProps> = ({ storyLog, isStatic = false }) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  
  const lastNarrativeIndex = storyLog.map(s => s.type).lastIndexOf('narrative');

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storyLog]);

  return (
    <div className="flex-grow bg-[#f1e9d2] text-gray-800 rounded-lg p-6 overflow-y-auto h-96 min-h-96 mb-4 border-2 border-[#8a6c3f] shadow-inner" style={{fontFamily: "'EB Garamond', serif"}}>
      {storyLog.map((segment, index) => {
        if (segment.type === 'narrative') {
          return (
            <p key={index} className="mb-4 text-gray-900 leading-relaxed whitespace-pre-wrap text-lg">
              {index === lastNarrativeIndex && !isStatic ? (
                <AnimatedNarrative text={segment.text} />
              ) : (
                segment.text
              )}
            </p>
          );
        }
        if (segment.type === 'action') {
          return (
            <p key={index} className="mb-4 text-[#8B4513] font-semibold italic whitespace-pre-wrap text-lg">
              {segment.text}
            </p>
          );
        }
        if (segment.type === 'item') {
          return (
            <p key={index} className="mb-4 text-amber-700 font-bold whitespace-pre-wrap text-lg">
              {segment.text}
            </p>
          );
        }
        if (segment.type === 'system') {
          return (
            <p key={index} className="mb-4 text-rose-800 italic whitespace-pre-wrap text-lg">
              {segment.text}
            </p>
          );
        }
        return null;
      })}
      <div ref={logEndRef} />
    </div>
  );
};

export default StoryLog;