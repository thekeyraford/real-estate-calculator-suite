
import React, { useState, useCallback } from 'react';
import HomeScreen from './components/HomeScreen';
import DownPaymentEstimator from './components/DownPaymentEstimator';
import InvestmentRoiCalculator from './components/InvestmentRoiCalculator';

type View = 'home' | 'downPayment' | 'roi';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');

  const navigateTo = useCallback((newView: View) => {
    setView(newView);
    window.scrollTo(0, 0);
  }, []);

  const renderView = () => {
    switch (view) {
      case 'downPayment':
        return <DownPaymentEstimator onBack={() => navigateTo('home')} />;
      case 'roi':
        return <InvestmentRoiCalculator onBack={() => navigateTo('home')} />;
      case 'home':
      default:
        return <HomeScreen onSelect={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-violet-50 text-gray-800 font-sans" style={{backgroundColor: '#f5f3ff'}}>
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Dallas Home Calculator Suite</h1>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>&copy; 2024 Dallas Home Calculator Suite. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;