
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const cardClasses = `bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 transition-all duration-300 ${className} ${onClick ? 'cursor-pointer hover:bg-white/20 hover:border-white/30' : ''}`;
  
  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
