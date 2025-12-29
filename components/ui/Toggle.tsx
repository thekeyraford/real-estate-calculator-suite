
import React from 'react';

interface ToggleProps<T extends string> {
  value: T;
  onChange: (newValue: T) => void;
  options: { value: T; label: string }[];
}

export function Toggle<T extends string,>({ value, onChange, options }: ToggleProps<T>): React.ReactElement {
  return (
    <div className="flex items-center bg-gray-900/50 rounded-lg p-1 space-x-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`w-full px-3 py-1 text-sm font-medium rounded-md transition-colors focus:outline-none ${
            value === option.value ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
