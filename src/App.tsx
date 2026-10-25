import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';

// Public Pages
import { Home } from './pages/public/Home';
import { Features } from './pages/public/Features';
import { About } from './pages/public/About';
import { FAQ } from './pages/public/FAQ';
import { Contact } from './pages/public/Contact';
import { PrivacyPolicy } from './pages/public/PrivacyPolicy';
import { CookiePolicy } from './pages/public/CookiePolicy';
import { Terms } from './pages/public/Terms';
import { Accessibility } from './pages/public/Accessibility';
import { Auth } from './pages/public/Auth';
import { ResetPassword } from './pages/public/ResetPassword';

// Authenticated Application Views
import { Dashboard } from './pages/app/Dashboard';
import { DiscoverJobs } from './pages/app/DiscoverJobs';
import { RecommendedJobs } from './pages/app/RecommendedJobs';
import { SavedJobs } from './pages/app/SavedJobs';
import { MyResume } from './pages/app/MyResume';
import { Applications } from './pages/app/Applications';
import { SearchSchedule } from './pages/app/SearchSchedule';
import { Notifications } from './pages/app/Notifications';
import { Settings } from './pages/app/Settings';

import { CookieBanner } from './components/common/CookieBanner';
import { NotFound } from './pages/public/NotFound';

import { Sparkles, Lock, ArrowRight } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeView, setActiveView, user, isDemoMode, enterDemoMode, exitDemoMode } = useApp();

  const publicViews = [
    'home',
    'features',
    'about',
    'faq',
    'contact',
    'privacy',
    'cookie',
    'terms',
    'accessibility',
    'login',
    'signup',
    'forgot',
    'reset-password',
  ];

  const isPublicView = publicViews.includes(activeView);

  const renderView = () => {
    // Protected View Route Guard
    if (!isPublicView && !user.isAuthenticated && !isDemoMode) {
      return (
        <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Authentication Required</h2>
            <p className="text-xs text-slate-300">
              Please sign in to access your private job matches, resume data, and application tracking, or explore using the interactive demo shell.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => setActiveView('login')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
            >
              <span>Sign In to Your Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={enterDemoMode}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
            >
              Launch Interactive Demo Shell
            </button>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'home':
        return <Home />;
      case 'features':
        return <Features />;
      case 'about':
        return <About />;
      case 'faq':
        return <FAQ />;
      case 'contact':
        return <Contact />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'cookie':
        return <CookiePolicy />;
      case 'terms':
        return <Terms />;
      case 'accessibility':
        return <Accessibility />;
      case 'login':
      case 'signup':
      case 'forgot':
        return <Auth />;
      case 'reset-password':
        return <ResetPassword />;

      // App Views
      case 'dashboard':
        return <Dashboard />;
      case 'discover':
        return <DiscoverJobs />;
      case 'recommended':
        return <RecommendedJobs />;
      case 'saved':
        return <SavedJobs />;
      case 'resume':
        return <MyResume />;
      case 'applications':
        return <Applications />;
      case 'schedule':
        return <SearchSchedule />;
      case 'notifications':
        return <Notifications />;
      case 'settings':
        return <Settings />;

      default:
        return <NotFound />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100 font-sans selection:bg-violet-500/30 selection:text-violet-200">
      {isDemoMode && (
        <div className="bg-gradient-to-r from-amber-500/20 via-violet-500/20 to-cyan-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200 z-50">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Interactive Demo — Sample Data</span>
            <span className="text-slate-400 font-normal hidden sm:inline">(Sample jobs, match scores &amp; application tracking)</span>
          </div>
          <button
            onClick={exitDemoMode}
            className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-medium transition-colors text-xs flex items-center gap-1"
          >
            <span>Exit Demo</span>
          </button>
        </div>
      )}

      <Header />

      {isPublicView ? (
        <main className="flex-1">{renderView()}</main>
      ) : (
        <div className="flex-1 max-w-7xl w-full mx-auto flex">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{renderView()}</main>
        </div>
      )}

      <Footer />
      <ToastContainer />
      <CookieBanner />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
