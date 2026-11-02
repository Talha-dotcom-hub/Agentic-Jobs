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
      case 'recommended': return 'Recommended Matches (≥85%)';
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
      <header className="app-header sticky top-0 z-[70] isolate w-full bg-surface/85 backdrop-blur-xl border-b border-[#27272A] shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 lg:gap-8">
          {/* Zone 1: Brand Wordmark & Breadcrumb */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setActiveView(user.isAuthenticated ? 'dashboard' : 'home')}
              className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-on-surface whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
            >
              <BrandMark className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-sm" />
              <span className="hidden xs:inline font-headline-sm">Agentic Jobs</span>
            </button>

            {!isPublicPage && (
              <div className="hidden xl:flex items-center gap-2 text-xs font-label-md text-on-surface-variant pl-4 border-l border-[#27272A]">
                <span>App</span>
                <span>/</span>
                <span className="font-semibold text-on-surface">{getViewTitle()}</span>
              </div>
            )}
          </div>

          {/* Zone 2: Navigation Links or Global Search Bar */}
          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-on-surface-variant">
            {isPublicPage ? (
              <>
                <button
                  onClick={() => setActiveView('home')}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'home' ? 'text-primary font-semibold' : 'hover:text-on-surface'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setActiveView('features')}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'features' ? 'text-primary font-semibold' : 'hover:text-on-surface'
                  }`}
                >
                  Features
                </button>
                <button
                  onClick={() => setActiveView('about')}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'about' ? 'text-primary font-semibold' : 'hover:text-on-surface'
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => setActiveView('faq')}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'faq' ? 'text-primary font-semibold' : 'hover:text-on-surface'
                  }`}
                >
                  FAQ &amp; Help
                </button>
                <button
                  onClick={() => setActiveView('contact')}
                  className={`transition-colors whitespace-nowrap shrink-0 ${
                    activeView === 'contact' ? 'text-primary font-semibold' : 'hover:text-on-surface'
                  }`}
                >
                  Support
                </button>
              </>
            ) : (
              <button
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-[6px] border border-[#27272A] bg-surface-container hover:bg-surface-container-high text-xs text-on-surface-variant transition-colors w-64 justify-between"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-primary" />
                  <span>Search jobs, apps...</span>
                </div>
                <kbd className="text-[10px] font-code-meta bg-surface-container-lowest px-1.5 py-0.5 rounded-[4px] border border-[#27272A] text-on-surface-variant">
                  Ctrl K
                </kbd>
              </button>
            )}
          </div>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
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
                  className="relative p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </button>

                {/* Profile Button Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] border border-[#27272A] bg-surface-container hover:bg-surface-container-high text-xs text-on-surface transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container">
                      {user.name.charAt(0) || 'U'}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate font-medium">{user.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface-container-high border border-[#27272A] rounded-xl shadow-2xl p-2 space-y-1 z-50 animate-in fade-in duration-150 text-xs">
                      <div className="p-2 border-b border-[#27272A] text-[11px]">
                        <div className="font-bold text-on-surface">{user.name}</div>
                        <div className="text-on-surface-variant truncate font-code-meta">{user.email}</div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveView('settings');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-left transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-primary" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveView('resume');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-left transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-tertiary" />
                        <span>My Resume</span>
                      </button>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logoutUser();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-error hover:bg-error-container/30 text-left transition-colors pt-1 border-t border-[#27272A]"
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
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>Demo Mode</span>
                </span>
                <button
                  onClick={exitDemoMode}
                  className="px-2.5 py-1.5 text-xs font-semibold text-on-surface bg-surface-container hover:bg-surface-container-high border border-[#27272A] rounded-[6px] transition-colors whitespace-nowrap"
                >
                  Exit Demo
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={enterDemoMode}
                  className="hidden sm:inline-flex px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-[6px] transition-colors whitespace-nowrap"
                >
                  Live Demo
                </button>
                <button
                  onClick={() => setActiveView('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-on-primary bg-primary hover:bg-primary-fixed rounded-[6px] shadow-sm transition-colors whitespace-nowrap"
                >
                  Log In
                </button>
              </div>
            )}

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#27272A] bg-surface-container-high px-4 pt-2 pb-4 space-y-2 text-xs">
            <div className="pb-2"><PWAInstallButton /></div>
            {isPublicPage ? (
              <>
                <button
                  onClick={() => { setActiveView('home'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  Home
                </button>
                <button
                  onClick={() => { setActiveView('features'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  Features
                </button>
                <button
                  onClick={() => { setActiveView('about'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  About &amp; Developers
                </button>
                <button
                  onClick={() => { setActiveView('faq'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  FAQ &amp; Help
                </button>
                <button
                  onClick={() => { setActiveView('contact'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  Support
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  Switch to {theme === 'dark' ? 'light' : 'dark'} theme
                </button>
                <button
                  onClick={() => { setSearchModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2 text-primary font-semibold flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Quick Search Opportunities</span>
                </button>
                <button
                  onClick={() => { setActiveView('dashboard'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => { setActiveView('discover'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  Discover Jobs
                </button>
                <button
                  onClick={() => { setActiveView('recommended'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  Recommended
                </button>
                <button
                  onClick={() => { setActiveView('saved'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  Saved Jobs
                </button>
                <button
                  onClick={() => { setActiveView('resume'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  My Resume
                </button>
                <button
                  onClick={() => { setActiveView('applications'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  Applications
                </button>
                <button
                  onClick={() => { setActiveView('schedule'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
                >
                  Search Schedule
                </button>
                <button
                  onClick={() => { setActiveView('settings'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-2 text-on-surface-variant hover:text-on-surface"
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
