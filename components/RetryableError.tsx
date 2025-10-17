import React from 'react';

interface RetryableErrorProps {
  error: string;
  onRetry: () => void;
}

const RetryableError: React.FC<RetryableErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="p-4 bg-red-900/20 rounded-md my-4 text-center animate-fade-in">
      <p className="text-red-400 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-amber-700 text-white font-bold rounded-md hover:bg-amber-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-75"
      >
        Try Again
      </button>
    </div>
  );
};

export default RetryableError;
