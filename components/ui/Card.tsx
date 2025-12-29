
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const cardClasses = `bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300 ${className} ${onClick ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-300' : ''}`;
  
  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;