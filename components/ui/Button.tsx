
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  leftIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', leftIcon, className, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 px-4 py-2';

  const variantClasses = {
    primary: 'bg-brand-violet text-white hover:opacity-90 focus-visible:ring-brand-violet',
    secondary: 'bg-brand-violet/10 text-brand-violet hover:bg-brand-violet/20 border border-transparent focus-visible:ring-brand-violet',
    ghost: 'text-gray-700 hover:bg-gray-200 hover:text-gray-900',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {leftIcon && <span className="mr-2 -ml-1 h-5 w-5">{leftIcon}</span>}
      {children}
    </button>
  );
};

export default Button;