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
  
  const lastNarrativeIndex = storyLog.map(s => ['narrative', 'dialogue_npc'].includes(s.type)).lastIndexOf(true);


  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storyLog]);

  return (
    <div className="flex-grow bg-black/20 text-[#e8e0d4] rounded-lg p-6 overflow-y-auto h-[50vh] min-h-[20rem] sm:h-96 mb-4 border border-white/10 shadow-inner" style={{fontFamily: "'EB Garamond', serif"}}>
      {storyLog.map((segment, index) => {
        const key = `${index}-${segment.text}`;
        switch (segment.type) {
          case 'narrative':
            return (
              <p key={key} className="mb-4 leading-relaxed whitespace-pre-wrap text-lg">
                {index === lastNarrativeIndex && !isStatic ? (
                  <AnimatedNarrative text={segment.text} />
                ) : (
                  segment.text
                )}
              </p>
            );
          case 'action':
            return (
              <p key={key} className="mb-4 text-amber-300 font-semibold italic whitespace-pre-wrap text-lg">
                {segment.text}
              </p>
            );
          case 'dialogue_player':
             return (
              <p key={key} className="mb-4 text-sky-300 font-semibold whitespace-pre-wrap text-lg text-right">
                {segment.text}
              </p>
            );
          case 'dialogue_npc':
             return (
              <div key={key} className="mb-4">
                <p className="font-bold text-amber-400 text-md">{segment.speaker} says:</p>
                <p className="leading-relaxed whitespace-pre-wrap text-lg italic text-gray-300">
                  {index === lastNarrativeIndex && !isStatic ? (
                    <AnimatedNarrative text={segment.text} />
                  ) : (
                    segment.text
                  )}
                </p>
              </div>
            );
          case 'item':
            return (
              <p key={key} className="mb-4 text-amber-400 font-bold whitespace-pre-wrap text-lg">
                {segment.text}
              </p>
            );
          case 'system':
            return (
              <p key={key} className="mb-4 text-red-400 italic whitespace-pre-wrap text-lg">
                {segment.text}
              </p>
            );
          default:
            return null;
        }
      })}
      <div ref={logEndRef} />
    </div>
  );
};

export default StoryLog;