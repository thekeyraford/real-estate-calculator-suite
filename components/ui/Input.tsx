
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  leadingAddon?: React.ReactNode;
  trailingAddon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, leadingAddon, trailingAddon, ...props }, ref) => {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div 
          className={`
            flex items-stretch w-full rounded-md bg-white border border-gray-300 shadow-sm
            focus-within:border-brand-violet focus-within:ring-1 focus-within:ring-brand-violet
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
        >
          {leadingAddon && (
            <div className="flex items-center pl-3 pr-2 border-r border-gray-300">
                <span className="text-gray-500 sm:text-sm whitespace-nowrap">{leadingAddon}</span>
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={`
              block w-full border-0 bg-transparent sm:text-sm text-gray-900 placeholder-gray-500 p-2.5
              focus:ring-0
              ${!leadingAddon ? 'rounded-l-md' : ''}
              ${!trailingAddon ? 'rounded-r-md' : ''}
            `}
            {...props}
          />
           {trailingAddon && (
            <div className="flex items-center pl-2 pr-3 border-l border-gray-300">
              <span className="text-gray-500 sm:text-sm whitespace-nowrap">{trailingAddon}</span>
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;