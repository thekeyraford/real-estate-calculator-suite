
import React from 'react';
import Card from './ui/Card';

interface HomeScreenProps {
  onSelect: (view: 'downPayment' | 'roi') => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelect }) => {
  return (
    <div className="space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300">
                Your toolkit for smart real estate decisions in Dallas. Choose a calculator to get started.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8" onClick={() => onSelect('downPayment')}>
                <h3 className="text-2xl font-bold mb-2">Down Payment Estimator</h3>
                <p className="text-gray-300">
                    Calculate your required down payment, closing costs, and estimate your total cash to close for your new home.
                </p>
            </Card>
            <Card className="p-8" onClick={() => onSelect('roi')}>
                <h3 className="text-2xl font-bold mb-2">Investment ROI Calculator</h3>
                <p className="text-gray-300">
                    Analyze the potential return on an investment property by calculating cash flow, cap rate, and cash-on-cash return.
                </p>
            </Card>
        </div>
    </div>
  );
};

export default HomeScreen;
