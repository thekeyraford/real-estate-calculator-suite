
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
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
        <div className="relative rounded-md shadow-sm">
          {leadingAddon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-400 sm:text-sm">{leadingAddon}</span>
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={`block w-full rounded-md bg-white/10 border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white placeholder-gray-400 p-2.5 ${leadingAddon ? 'pl-7' : ''} ${trailingAddon ? 'pr-20' : ''} ${error ? 'border-red-500' : 'border-gray-600'}`}
            {...props}
          />
           {trailingAddon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-400 sm:text-sm">{trailingAddon}</span>
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
