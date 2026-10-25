import React from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, Home as HomeIcon, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const { setActiveView, user } = useApp();

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto">
        <Compass className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-white">404</h1>
        <h2 className="text-lg font-bold text-slate-200">Page Not Found</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The route or page you are searching for does not exist or may have been moved.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => setActiveView(user.isAuthenticated ? 'dashboard' : 'home')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold text-xs shadow-md shadow-violet-600/20 flex items-center justify-center gap-2"
        >
          <HomeIcon className="w-4 h-4" />
          <span>Return to {user.isAuthenticated ? 'Dashboard' : 'Home'}</span>
        </button>
        <button
          onClick={() => setActiveView('discover')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Discover Opportunities</span>
        </button>
      </div>
    </div>
  );
};
