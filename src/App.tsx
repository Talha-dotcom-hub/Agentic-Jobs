import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { isSupabaseConfigured } from './lib/supabase';

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
import { PWAStatus } from './components/common/PWAStatus';
import { NotFound } from './pages/public/NotFound';

import { Sparkles, Lock, ArrowRight, LayoutDashboard, Compass, FileText, Bookmark, MoreHorizontal } from 'lucide-react';
import { More } from './pages/app/More';

const MobileBottomNav: React.FC = () => {
  const { activeView, setActiveView, savedJobIds } = useApp();
  const items = [
    { view: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { view: 'discover' as const, label: 'Discover', icon: Compass },
    { view: 'saved' as const, label: 'Saved', icon: Bookmark, badge: savedJobIds.length },
    { view: 'resume' as const, label: 'Resume', icon: FileText },
    { view: 'more' as const, label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav aria-label="Main navigation" className="mobile-bottom-nav">
      {items.map(({ view, label, icon: Icon, badge }) => (
        <button
          key={view}
          type="button"
          onClick={() => setActiveView(view)}
          aria-current={activeView === view ? 'page' : undefined}
          className={`mobile-nav-item ${activeView === view ? 'is-active' : ''}`}
        >
          <span className="mobile-nav-icon-wrap">
            <Icon size={18} strokeWidth={activeView === view ? 2.2 : 1.7} />
            {badge && badge > 0 ? <span className="mobile-nav-badge">{badge}</span> : null}
          </span>
          <span className="font-label-sm">{label}</span>
          {activeView === view && <span className="mobile-nav-pip" />}
        </button>
      ))}
    </nav>
  );
};

const MainContent: React.FC = () => {
  const { activeView, setActiveView, user, isDemoMode, authReady, enterDemoMode, exitDemoMode } = useApp();

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

  // Progressive reveal on content cards, with reduced-motion accessibility support.
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(
      'main section, main article, main .card-hover-effect, main [data-reveal]'
    ));
    targets.forEach((el) => el.classList.add('reveal-on-scroll'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeView]);

  const renderView = () => {
    // Protected View Route Guard
    if (!isPublicView && !user.isAuthenticated && !isDemoMode) {
      if (!authReady) {
        return (
          <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto animate-pulse">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Restoring Your Session</h2>
              <p className="text-xs text-slate-300">Checking your secure session before loading private job data.</p>
            </div>
          </div>
        );
      }
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
      case 'more':
        return <More />;

      default:
        return <NotFound />;
    }
  };

  if (isSupabaseConfigured && !authReady) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6 text-on-surface" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="h-10 w-10 rounded-full border-2 border-primary/25 border-t-primary motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
          <div className="space-y-1">
            <h1 className="text-sm font-semibold">Restoring your session</h1>
            <p className="text-xs text-on-surface-variant">Checking your secure sign-in before loading your workspace.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell min-h-screen flex flex-col font-sans">
      {isDemoMode && (
        <div className="border-b border-[rgba(199,255,90,0.18)] bg-[linear-gradient(90deg,rgba(199,255,90,0.08),rgba(129,140,248,0.08),rgba(160,212,255,0.08))] px-4 py-2 flex items-center justify-between text-xs text-[var(--app-text)] z-50">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="w-4 h-4 text-[var(--app-accent)] shrink-0" />
            <span>Interactive Demo — Sample Data</span>
            <span className="text-[var(--app-text-muted)] font-normal hidden sm:inline">(Sample jobs, match scores &amp; application tracking)</span>
          </div>
          <button
            onClick={exitDemoMode}
            className="px-3 py-1 rounded-lg border border-[rgba(199,255,90,0.2)] bg-[rgba(199,255,90,0.08)] hover:bg-[rgba(199,255,90,0.12)] text-[var(--app-text)] font-medium transition-colors text-xs flex items-center gap-1"
          >
            <span>Exit Demo</span>
          </button>
        </div>
      )}

      <Header />

      {isPublicView ? (
        <main className="flex-1">
          <div key={activeView} className="page-transition">{renderView()}</div>
        </main>
      ) : (
        <div className="flex-1 w-full">
          <main className="app-main mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 min-w-0">
            <div key={activeView} className="page-transition">{renderView()}</div>
          </main>
        </div>
      )}

      {isPublicView && <Footer />}
      {(!isPublicView && (user.isAuthenticated || isDemoMode)) && <MobileBottomNav />}
      <ToastContainer />
      <CookieBanner />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <>
        <PWAStatus />
        <MainContent />
      </>
    </AppProvider>
  );
}
