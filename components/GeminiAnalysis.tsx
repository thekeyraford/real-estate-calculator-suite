
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
      <div className="mt-6 p-4 bg-brand-violet/10 rounded-lg border border-brand-violet/20">
        <div className="flex items-center space-x-3">
          <SparkleIcon className="w-6 h-6 text-brand-violet animate-pulse" />
          <p className="text-brand-violet">Gemini is analyzing your results...</p>
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
    <div className="mt-6 p-4 bg-brand-violet/10 rounded-lg border border-brand-violet/20 prose prose-p:text-gray-700 prose-strong:text-gray-900 prose-headings:text-brand-violet">
        <h3 className="flex items-center text-lg font-semibold text-brand-violet mb-2">
            <SparkleIcon className="w-5 h-5 mr-2 text-brand-violet" />
            {title}
        </h3>
        <div className="text-gray-700 whitespace-pre-wrap">{formattedAnalysis}</div>
    </div>
  );
};

export default GeminiAnalysis;