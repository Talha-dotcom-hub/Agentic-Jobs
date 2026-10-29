import React, { useState, useEffect } from 'react';
import { useApp, ActiveView } from '../../context/AppContext';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { JobDetailDrawer } from '../jobs/JobDetailDrawer';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { BrandMark } from '../common/BrandMark';
import {
  Menu,
  X,
  User,
  Bell,
  LogOut,
  Sparkles,
  Search,
  Settings,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeView,
    setActiveView,
    user,
    isDemoMode,
    enterDemoMode,
    exitDemoMode,
    logoutUser,
    notifications,
    registerOverlay,
    unregisterOverlay,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchJobDrawer, setSearchJobDrawer] = useState<any | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  );

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = nextTheme === 'dark' ? '#10120E' : '#F3F4EA';
    try {
      localStorage.setItem('agentic-jobs-theme', nextTheme);
    } catch (error) {
      console.warn('Theme preference could not be saved:', error);
    }
    setTheme(nextTheme);
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      registerOverlay('mobile-menu', () => setMobileMenuOpen(false));
      return () => unregisterOverlay('mobile-menu');
    }
  }, [mobileMenuOpen, registerOverlay, unregisterOverlay]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const publicViews: ActiveView[] = [
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
  ];

  const isPublicPage = publicViews.includes(activeView);

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Dashboard Overview';
      case 'discover': return 'Discover Opportunities';
      case 'recommended': return 'Recommended Matches (>85%)';
      case 'saved': return 'Saved Opportunities';
      case 'resume': return 'My Resume & Skills';
      case 'applications': return 'Application Tracker';
      case 'schedule': return 'Automated Scan Schedule';
      case 'notifications': return 'Notifications Center';
      case 'settings': return 'Account & Integration Settings';
      default: return '';
    }
  };

  return (
    <>
      <header className="app-header sticky top-0 z-[70] isolate w-full backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
          {/* Zone 1: Brand Wordmark & Breadcrumb */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setActiveView(user.isAuthenticated ? 'dashboard' : 'home')}
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
            >
              <BrandMark className="w-8 h-8 rounded-lg shadow-md shadow-black/20" />
              <span className="hidden sm:inline">Agentic Jobs</span>
            </button>

            {!isPublicPage && (
              <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400 pl-4 border-l border-slate-800">
                <span>App</span>
                <span>/</span>
                <span className="font-semibold text-slate-200">{getViewTitle()}</span>
              </div>
            )}
          </div>

          {/* Zone 2: Navigation Links or Global Search Bar */}
          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            {isPublicPage ? (
              <>
                <button
                  onClick={() => setActiveView('home')}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'home' ? 'text-violet-400 font-semibold' : 'hover:text-white'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setActiveView('features')}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'features' ? 'text-violet-400 font-semibold' : 'hover:text-white'
                  }`}
                >
                  Features
                </button>
                <button
                  onClick={() => setActiveView('about')}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'about' ? 'text-violet-400 font-semibold' : 'hover:text-white'
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => setActiveView('faq')}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'faq' ? 'text-violet-400 font-semibold' : 'hover:text-white'
                  }`}
                >
                  FAQ &amp; Help
                </button>
                <button
                  onClick={() => setActiveView('contact')}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'contact' ? 'text-violet-400 font-semibold' : 'hover:text-white'
                  }`}
                >
                  Support
                </button>
              </>
            ) : (
              <button
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-xs text-slate-400 transition-colors w-64 justify-between"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Search jobs, apps...</span>
                </div>
                <kbd className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 font-mono">
                  Ctrl K
                </kbd>
              </button>
            )}
          </div>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="hidden md:block"><PWAInstallButton /></div>
            {user.isAuthenticated ? (
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={() => setActiveView('notifications')}
                  className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </button>

                {/* Profile Button Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                      {user.name.charAt(0) || 'U'}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate font-medium">{user.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#0B0F19] border border-slate-800 rounded-xl shadow-2xl p-2 space-y-1 z-50 animate-in fade-in duration-150 text-xs">
                      <div className="p-2 border-b border-slate-800 text-[11px]">
                        <div className="font-bold text-white">{user.name}</div>
                        <div className="text-slate-400 truncate">{user.email}</div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveView('settings');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 text-left transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-violet-400" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveView('resume');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 text-left transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>My Resume</span>
                      </button>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logoutUser();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/30 text-left transition-colors pt-1 border-t border-slate-800/60"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : isDemoMode ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-300">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Demo Mode</span>
                </span>
                <button
                  onClick={exitDemoMode}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
                >
                  Exit Demo
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={enterDemoMode}
                  className="hidden sm:inline-flex px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap"
                >
                  Live Demo
                </button>
                <button
                  onClick={() => setActiveView('login')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-xl shadow-lg shadow-violet-600/20 btn-hover-effect whitespace-nowrap"
                >
                  Log In
                </button>

              </div>
            )}

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#0B0F19] px-4 pt-2 pb-4 space-y-2 text-xs">
            <div className="pb-2"><PWAInstallButton /></div>
            {isPublicPage ? (
              <>
                <button
                  onClick={() => { setActiveView('home'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  Home
                </button>
                <button
                  onClick={() => { setActiveView('features'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  Features
                </button>
                <button
                  onClick={() => { setActiveView('about'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  About &amp; Developers
                </button>
                <button
                  onClick={() => { setActiveView('faq'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  FAQ &amp; Help
                </button>
                <button
                  onClick={() => { setActiveView('contact'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  Support
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  Switch to {theme === 'dark' ? 'light' : 'dark'} theme
                </button>
                <button
                  onClick={() => { setSearchModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2 text-cyan-400 font-semibold flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Quick Search Opportunities</span>
                </button>
                <button
                  onClick={() => { setActiveView('dashboard'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => { setActiveView('discover'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  Discover Jobs
                </button>
                <button
                  onClick={() => { setActiveView('recommended'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  Recommended
                </button>
                <button
                  onClick={() => { setActiveView('saved'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  Saved Jobs
                </button>
                <button
                  onClick={() => { setActiveView('resume'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  My Resume
                </button>
                <button
                  onClick={() => { setActiveView('applications'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  Applications
                </button>
                <button
                  onClick={() => { setActiveView('schedule'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  Search Schedule
                </button>
                <button
                  onClick={() => { setActiveView('settings'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-slate-300 hover:text-white"
                >
                  Settings
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectJob={(j) => setSearchJobDrawer(j)}
      />

      {/* Job Detail Drawer from global search */}
      <JobDetailDrawer job={searchJobDrawer} onClose={() => setSearchJobDrawer(null)} />
    </>
  );
};
