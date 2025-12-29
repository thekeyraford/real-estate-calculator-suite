
import React from 'react';
import { SparkleIcon } from './icons';

interface GeminiAnalysisProps {
  analysis: string;
  isLoading: boolean;
  title: string;
}

const GeminiAnalysis: React.FC<GeminiAnalysisProps> = ({ analysis, isLoading, title }) => {
  if (isLoading) {
    return (
      <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-3">
          <SparkleIcon className="w-6 h-6 text-blue-400 animate-pulse" />
          <p className="text-gray-300">Gemini is analyzing your results...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  // Simple markdown-to-HTML
  const formattedAnalysis = analysis
    .split('**')
    .map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : <span key={index}>{part}</span>));

  return (
    <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700 prose prose-invert prose-p:text-gray-300 prose-strong:text-white prose-headings:text-white">
        <h3 className="flex items-center text-lg font-semibold text-white mb-2">
            <SparkleIcon className="w-5 h-5 mr-2 text-blue-400" />
            {title}
        </h3>
        <div className="text-gray-300 whitespace-pre-wrap">{formattedAnalysis}</div>
    </div>
  );
};

export default GeminiAnalysis;
