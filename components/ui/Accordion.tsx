import React, { useState } from 'react';
import Card from './Card';
import { ChevronDownIcon } from '../icons';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  startOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, startOpen = false }) => {
    const [isOpen, setIsOpen] = useState(startOpen);

    return (
        <Card className="overflow-hidden">
            <button
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-lg hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <ChevronDownIcon className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div 
              className="transition-all duration-500 ease-in-out grid"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="p-4 pt-0">
                    {children}
                </div>
              </div>
            </div>
        </Card>
    );
};

export default Accordion;