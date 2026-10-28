import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import {
  Job,
  Application,
  Resume,
  ScanSchedule,
  SourceHealth,
  AppNotification,
  UserProfile,
  ApplicationStatus,
  MatchResult,
} from '../types';
import { initialJobs, initialApplications, initialSources, initialNotifications } from '../services/mockData';
import {
  matchResumeWithJob,
  triggerDiscoveryScan,
  updateScanSchedule as updateScheduleApi,
  saveResumeApi,
  fetchResumeApi,
  extractResumeProfileApi,
  deleteResumeApi,
  deleteAccountApi,
  fetchDiscoveredJobsApi,
  fetchSavedJobsApi,
  saveJobApi,
  removeSavedJobApi,
  addCustomJobApi,
  markNotificationReadApi,
  clearNotificationsApi,
  fetchScanSchedule,
  fetchSourcesApi,
} from '../services/api';
import { supabase, isSupabaseConfigured, uploadResumeFile } from '../lib/supabase';
import { subscribeUserToWebPush } from '../lib/pushClient';

export type ActiveView =
  | 'home'
  | 'features'
  | 'about'
  | 'faq'
  | 'contact'
  | 'privacy'
  | 'cookie'
  | 'terms'
  | 'accessibility'
  | 'login'
  | 'signup'
  | 'forgot'
  | 'reset-password'
  | 'dashboard'
  | 'discover'
  | 'recommended'
  | 'saved'
  | 'resume'
  | 'applications'
  | 'schedule'
  | 'notifications'
  | 'settings';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  loginUser: (email: string, password?: string, name?: string) => Promise<void>;
  signUpUser: (email: string, password: string, name: string) => Promise<{ success: boolean; confirmationRequired?: boolean } | void>;
  logoutUser: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  deleteUserAccount: () => Promise<void>;

  jobs: Job[];
  savedJobIds: string[];
  toggleSaveJob: (jobId: string) => void;
  addCustomJob: (job: Partial<Job>) => Promise<boolean>;
  evaluateJobMatch: (jobId: string) => Promise<MatchResult | null>;

  applications: Application[];
  addApplication: (app: Partial<Application>) => void;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  deleteApplication: (id: string) => void;

  resume: Resume;
  updateResume: (text: string, name?: string, file?: File) => Promise<void>;
  reprocessResumeProfile: () => Promise<void>;
  deleteResumeProfile: () => Promise<void>;

  registerOverlay: (id: string, closeFn: () => void) => void;
  unregisterOverlay: (id: string) => void;
  closeTopOverlay: () => boolean;

  schedule: ScanSchedule;
  updateSchedule: (newSchedule: Partial<ScanSchedule>) => Promise<void>;
  runScanNow: () => Promise<void>;

  sources: SourceHealth[];
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;

  pushPermission: NotificationPermission | 'unsupported';
  requestPushPermission: () => Promise<void>;

  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const demoResumeText = `Senior Full Stack Software Engineer with 6+ years of experience building scalable web applications.
Core Skills: React, TypeScript, Node.js, Express, Python, GraphQL, PostgreSQL, Tailwind CSS, Docker, AWS, REST APIs, Git, CI/CD pipelines, System Architecture.
Experience: Led frontend architecture for cloud platforms, implemented microservices with Express and Python, optimized database queries, built real-time WebSocket dashboards.
Education: B.S. in Computer Science.`;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveViewState] = useState<ActiveView>('home');
  const activeViewRef = useRef<ActiveView>('home');
  const viewHistoryRef = useRef<ActiveView[]>(['home']);

  const setActiveView = useCallback((view: ActiveView) => {
    if (activeViewRef.current === view) return;

    const url = new URL(window.location.href);
    if (view === 'home' || view === 'login' || view === 'signup' || view === 'forgot' || view === 'features' || view === 'about' || view === 'faq' || view === 'contact' || view === 'privacy' || view === 'cookie' || view === 'terms' || view === 'accessibility') {
      url.searchParams.delete('view');
    } else {
      // Keep the selected app tab in the URL so reloads and shared deep links
      // return to the same screen instead of silently falling back to Home.
      url.searchParams.set('view', view);
    }
    const state = { ...(window.history.state || {}), agenticJobsView: view };
    if (view === 'home') {
      viewHistoryRef.current = ['home'];
      window.history.replaceState(state, '', url);
    } else {
      viewHistoryRef.current.push(view);
      window.history.pushState(state, '', url);
    }
    activeViewRef.current = view;
    setActiveViewState(view);
  }, []);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile>({
    id: '',
    email: '',
    name: '',
    isAuthenticated: false,
    role: 'Candidate',
    joinedDate: 'October 2026',
    preferences: {
      pushNotifications: false,
      highMatchAlerts: true,
      emailSummaries: true,
      autoSaveHighMatches: false,
    },
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const emptyResume: Resume = {
    text: '', name: 'No Resume Stored', lastUpdated: '', extractedSkills: [], parsedRole: '',
    profile: undefined, extractionStatus: 'idle', profileVersion: 0,
  };
  const [resume, setResume] = useState<Resume>(emptyResume);

  const [schedule, setSchedule] = useState<ScanSchedule>({
    enabled: false,
    frequencyType: 'hourly',
    frequencyValue: 4,
    lastScanTime: '',
    nextScanTime: '',
    lastSuccessfulScanJobsCount: 0,
    sourceFailuresCount: 0,
    status: 'idle',
  });

  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Overlays stack for smart back navigation (drawers, modals, mobile menus)
  const overlaysRef = useRef<{ id: string; closeFn: () => void }[]>([]);

  const registerOverlay = useCallback((id: string, closeFn: () => void) => {
    overlaysRef.current = overlaysRef.current.filter((o) => o.id !== id);
    overlaysRef.current.push({ id, closeFn });
  }, []);

  const unregisterOverlay = useCallback((id: string) => {
    overlaysRef.current = overlaysRef.current.filter((o) => o.id !== id);
  }, []);

  const closeTopOverlay = useCallback(() => {
    if (overlaysRef.current.length > 0) {
      const top = overlaysRef.current.pop();
      if (top) {
        top.closeFn();
        return true;
      }
    }
    return false;
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Mobile Back follows in-app navigation history.
  useEffect(() => {
    window.history.replaceState(
      { ...(window.history.state || {}), agenticJobsView: activeViewRef.current },
      ''
    );

    const handlePopState = () => {
      const currentView = activeViewRef.current;

      // Close the top modal/drawer before leaving the current screen.
      if (overlaysRef.current.length > 0) {
        const top = overlaysRef.current.pop();
        if (top) top.closeFn();
        window.history.pushState({ agenticJobsView: currentView }, '');
        return;
      }

      const stack = viewHistoryRef.current;
      if (stack.length > 1) {
        if (stack[stack.length - 1] === currentView) stack.pop();
        const previousView = stack[stack.length - 1] || 'home';
        activeViewRef.current = previousView;
        setActiveViewState(previousView);
      }
      // At the first screen, allow the platform's normal Back behavior.
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // URL / Path / Recovery Listener (e.g. from Push Notification click or reset email)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check pathname and hash for password recovery
    if (window.location.pathname === '/reset-password' || window.location.hash.includes('type=recovery')) {
      setActiveView('reset-password');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam) {
      const validViews: ActiveView[] = [
        'home', 'features', 'about', 'faq', 'contact', 'privacy', 'cookie', 'terms', 'accessibility',
        'login', 'signup', 'forgot', 'reset-password', 'dashboard', 'discover', 'recommended', 'saved',
        'resume', 'applications', 'schedule', 'notifications', 'settings'
      ];
      if (validViews.includes(viewParam as ActiveView)) {
        setActiveView(viewParam as ActiveView);
      }
    }
  }, []);

  // Reconnect an already-authorized push subscription after login/reload.
  // Browsers require an explicit user gesture for the first permission request;
  // this only reuses a permission the user has already granted.
  useEffect(() => {
    if (!user.isAuthenticated || !user.id || isDemoMode || typeof window === 'undefined') return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    let cancelled = false;
    void (async () => {
      try {
        const registration = await navigator.serviceWorker?.register('/sw.js', { scope: '/' });
        if (!registration || cancelled || !('PushManager' in window)) return;
        const existing = await registration.pushManager.getSubscription();
        if (!existing && !cancelled) await subscribeUserToWebPush(user.id);
      } catch (error) {
        console.warn('Push subscription restore skipped:', error);
      }
    })();
    return () => { cancelled = true; };
  }, [user.id, user.isAuthenticated, isDemoMode]);

  // Restore Persistent Resume Memory from Server/Supabase
  useEffect(() => {
    let cancelled = false;
    const loadResume = async () => {
      if (isDemoMode) return;
      if (!user.isAuthenticated || !user.id) {
        setResume(emptyResume);
        return;
      }
      try {
        const stored = await fetchResumeApi();
        if (cancelled) return;
        setResume(stored?.text ? stored : emptyResume);
      } catch (err) {
        console.warn('Initial resume sync failed:', err);
        if (!cancelled) showToast('Could not load your saved resume. Check your connection and retry.', 'error');
      }
    };
    void loadResume();
    return () => { cancelled = true; };
  }, [user.id, user.isAuthenticated, isDemoMode]);

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setJobs(initialJobs);
    setSavedJobIds(['job-101', 'job-103']);
    setApplications(initialApplications);
    setNotifications(initialNotifications);
    setSources(initialSources);
    setResume({ text: demoResumeText, name: 'Sample Resume (Demo)', lastUpdated: new Date().toISOString(), extractedSkills: ['TypeScript', 'React', 'Node.js', 'Python'], parsedRole: 'Sample Software Engineer', extractionStatus: 'completed', profileVersion: 1 });
    setSchedule({ enabled: false, frequencyType: 'hourly', frequencyValue: 4, lastScanTime: '', nextScanTime: '', lastSuccessfulScanJobsCount: 0, sourceFailuresCount: 0, status: 'idle' });
    setActiveView('dashboard');
    showToast('Entered Interactive Demo Mode (Sample Data).', 'info');
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    if (!user.isAuthenticated) {
      setJobs([]);
      setSavedJobIds([]);
      setApplications([]);
      setNotifications([]);
      setSources([]);
      setResume(emptyResume);
      setSchedule({ enabled: false, frequencyType: 'hourly', frequencyValue: 4, lastScanTime: '', nextScanTime: '', lastSuccessfulScanJobsCount: 0, sourceFailuresCount: 0, status: 'idle' });
      setActiveView('home');
    }
    showToast('Exited Demo Mode.', 'info');
  };

  // Restore Supabase Auth session on mount
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser((prev) => ({
          ...prev,
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          isAuthenticated: true,
        }));
        setIsDemoMode(false);
        setJobs([]);
        setSavedJobIds([]);
        setApplications([]);
        setNotifications([]);
        setSources([]);
        const requestedView = new URLSearchParams(window.location.search).get('view') as ActiveView | null;
        const appViews: ActiveView[] = ['dashboard','discover','recommended','saved','resume','applications','schedule','notifications','settings'];
        if (!requestedView || !appViews.includes(requestedView)) {
          activeViewRef.current = 'dashboard';
          setActiveViewState('dashboard');
          const url = new URL(window.location.href);
          url.searchParams.set('view', 'dashboard');
          window.history.replaceState({ ...(window.history.state || {}), agenticJobsView: 'dashboard' }, '', url);
          viewHistoryRef.current = ['dashboard'];
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser((prev) => ({
          ...prev,
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          isAuthenticated: true,
        }));
        setIsDemoMode(false);
        setJobs([]);
        setSavedJobIds([]);
        setApplications([]);
        setNotifications([]);
        setSources([]);
        if (window.location.pathname !== '/reset-password' && !window.location.hash.includes('type=recovery')) {
          const requestedView = new URLSearchParams(window.location.search).get('view') as ActiveView | null;
          const appViews: ActiveView[] = ['dashboard','discover','recommended','saved','resume','applications','schedule','notifications','settings'];
          setActiveView(requestedView && appViews.includes(requestedView) ? requestedView : 'dashboard');
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        setActiveView('reset-password');
      } else if (event === 'SIGNED_OUT') {
        setUser((prev) => ({ ...prev, id: '', email: '', name: '', isAuthenticated: false }));
        setIsDemoMode(false);
        setJobs([]);
        setSavedJobIds([]);
        setApplications([]);
        setNotifications([]);
        setSources([]);
        setResume(emptyResume);
        setSchedule({ enabled: false, frequencyType: 'hourly', frequencyValue: 4, lastScanTime: '', nextScanTime: '', lastSuccessfulScanJobsCount: 0, sourceFailuresCount: 0, status: 'idle' });
        setActiveView('home');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sync Real User Data from Supabase Tables
  useEffect(() => {
    if (!user.isAuthenticated || isDemoMode || !user.id || !isSupabaseConfigured) return;

    const fetchUserData = async () => {
      try {
        const [discoveredJobs, savedJobs] = await Promise.all([
          fetchDiscoveredJobsApi(),
          fetchSavedJobsApi(),
        ]);
        const savedIds = savedJobs.map((job) => job.id);
        setSavedJobIds(savedIds);
        const allJobs = new Map<string, Job>();
        for (const job of discoveredJobs) allJobs.set(job.id, job);
        for (const job of savedJobs) if (!allJobs.has(job.id)) allJobs.set(job.id, job);
        setJobs(Array.from(allJobs.values()).map((job) => ({ ...job, saved: savedIds.includes(job.id) })));
      } catch (err) {
        console.warn('Saved/discovered jobs sync failed:', err);
        showToast('Could not load saved or discovered jobs. Try refreshing after checking the backend.', 'error');
      }

      try {
        const { data: apps, error: appsError } = await supabase
          .from('applications').select('*').eq('user_id', user.id).order('applied_date', { ascending: false });
        if (appsError) throw appsError;
        setApplications((apps || []).map((a: any) => ({
          id: a.id, jobId: a.job_id || undefined, jobTitle: a.job_title, company: a.company,
          location: a.location || 'Not specified', originalUrl: a.original_url || '',
          status: a.status || 'Applied', appliedDate: a.applied_date || new Date().toISOString(),
          lastUpdatedDate: a.last_updated_date || a.applied_date || new Date().toISOString(),
          notes: a.notes || '', salary: a.salary || '', contactPerson: a.contact_person || '',
          followUpNeeded: a.follow_up_needed || false,
        })));
      } catch (err) {
        console.warn('Applications sync failed:', err);
      }

      try {
        const { data: notifs, error: notificationError } = await supabase
          .from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (notificationError) throw notificationError;
        setNotifications((notifs || []).map((n: any) => ({
          id: n.id, title: n.title, message: n.message, read: Boolean(n.read),
          type: n.type || 'system', timestamp: n.created_at, link: n.link || undefined,
        })));
      } catch (err) {
        console.warn('Notifications sync failed:', err);
      }

      try {
        const savedSchedule = await fetchScanSchedule();
        setSchedule(savedSchedule);
      } catch (err) {
        console.warn('Schedule sync failed:', err);
        showToast('Could not load your saved scan schedule.', 'error');
      }

      try {
        setSources(await fetchSourcesApi());
      } catch (err) {
        console.warn('Source configuration lookup failed:', err);
        setSources([]);
      }
    };
    fetchUserData();
  }, [user.id, user.isAuthenticated, isDemoMode]);

  const loginUser = async (email: string, password?: string, name?: string) => {
    if (!password) {
      showToast('Please enter your password to sign in.', 'error');
      return;
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        showToast(error?.message || 'Invalid email or password.', 'error');
        return;
      }

      setUser({
        id: data.session.user.id,
        email: data.session.user.email || email,
        name: data.session.user.user_metadata?.full_name || name || email.split('@')[0],
        isAuthenticated: true,
        role: 'Candidate',
        joinedDate: 'October 2026',
        preferences: user.preferences,
      });
    } else {
      showToast(
        'Sign-in is unavailable because Supabase is not configured. Check the Netlify environment variables and redeploy.',
        'error'
      );
      return;
    }

    setIsDemoMode(false);
    setActiveView('dashboard');
    showToast(`Welcome back, ${name || email}!`, 'success');
  };

  const signUpUser = async (email: string, password: string, name: string) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: name },
        },
      });

      if (error) {
        showToast(error.message, 'error');
        return { success: false };
      }

      // Check if email confirmation is required before session exists
      if (data?.user && !data?.session) {
        showToast('Please check your email to verify your account.', 'info');
        return { success: true, confirmationRequired: true };
      }

      if (data?.session) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || email,
          name: data.session.user.user_metadata?.full_name || name,
          isAuthenticated: true,
          role: 'Candidate',
          joinedDate: 'October 2026',
          preferences: user.preferences,
        });
        setIsDemoMode(false);
        setActiveView('dashboard');
        showToast('Account created successfully!', 'success');
        return { success: true, confirmationRequired: false };
      }
    }

    showToast(
      isSupabaseConfigured
        ? 'Supabase did not establish a signup session. Check its Auth and email-confirmation settings.'
        : 'Sign-up is unavailable because Supabase is not configured. Check the Netlify environment variables and redeploy.',
      'error'
    );
    return { success: false, confirmationRequired: false };
  };

  const logoutUser = async () => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) console.warn('Remote sign-out warning; local session state will still be cleared:', error.message);
      } catch (error: any) {
        console.warn('Remote sign-out failed; local session state will still be cleared:', error?.message || error);
      }
    }
    setUser((prev) => ({ ...prev, id: '', email: '', name: '', isAuthenticated: false }));
    setIsDemoMode(false);
    setJobs([]);
    setSavedJobIds([]);
    setApplications([]);
    setNotifications([]);
    setActiveView('home');
    setJobs([]); setSavedJobIds([]); setApplications([]); setNotifications([]); setResume(emptyResume);
    setSchedule({ enabled: false, frequencyType: 'hourly', frequencyValue: 4, lastScanTime: '', nextScanTime: '', lastSuccessfulScanJobsCount: 0, sourceFailuresCount: 0, status: 'idle' });
    showToast('Logged out successfully.', 'info');
  };

  const resetUserPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      showToast(
        'Password reset is unavailable because Supabase is not configured. Please try again later.',
        'error'
      );
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      showToast(error.message, 'error');
      return;
    }

    showToast(
      'If an account exists for that email, a recovery link will be sent. Check your inbox and spam folder.',
      'success'
    );
  };

  const deleteUserAccount = async () => {
    try {
      await deleteAccountApi();
      if (isSupabaseConfigured) await supabase.auth.signOut();
      setUser({
        id: '', email: '', name: '', isAuthenticated: false, role: 'Candidate', joinedDate: 'October 2026',
        preferences: { pushNotifications: false, highMatchAlerts: true, emailSummaries: true, autoSaveHighMatches: false },
      });
      setIsDemoMode(false);
      setJobs([]); setSavedJobIds([]); setApplications([]); setNotifications([]); setResume(emptyResume);
      setSchedule({ enabled: false, frequencyType: 'hourly', frequencyValue: 4, lastScanTime: '', nextScanTime: '', lastSuccessfulScanJobsCount: 0, sourceFailuresCount: 0, status: 'idle' });
      setActiveView('home');
      showToast('Your account and associated data were deleted.', 'success');
    } catch (err: any) {
      console.error('Account deletion failed:', err);
      showToast(err?.message || 'Account deletion failed. Your session was kept; please retry or contact support.', 'error');
    }
  };

  const toggleSaveJob = async (jobId: string) => {
    const isSaved = savedJobIds.includes(jobId);
    const targetJob = jobs.find((job) => job.id === jobId);
    if (!targetJob && !isSaved) {
      showToast('This job is no longer available in the current list. Refresh jobs and retry.', 'error');
      return;
    }
    if (isDemoMode) {
      setSavedJobIds((prev) => isSaved ? prev.filter((id) => id !== jobId) : [...prev, jobId]);
      setJobs((prev) => prev.map((job) => job.id === jobId ? { ...job, saved: !isSaved } : job));
      showToast(isSaved ? 'Job removed from demo saved list.' : 'Job saved in demo mode.', 'info');
      return;
    }
    if (!user.isAuthenticated) {
      showToast('Sign in to save jobs to your account.', 'error');
      return;
    }
    try {
      if (isSaved) await removeSavedJobApi(jobId);
      else if (targetJob) await saveJobApi(targetJob);
      setSavedJobIds((prev) => isSaved ? prev.filter((id) => id !== jobId) : prev.includes(jobId) ? prev : [...prev, jobId]);
      setJobs((prev) => prev.map((job) => job.id === jobId ? { ...job, saved: !isSaved } : job));
      showToast(isSaved ? 'Job removed from saved list.' : 'Job saved to your account.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Could not update saved jobs.', 'error');
    }
  };

  const addCustomJob = async (jobData: Partial<Job>): Promise<boolean> => {
    const title = String(jobData.title || '').trim();
    const company = String(jobData.company || '').trim();
    if (!title || !company) {
      showToast('Job title and company are required.', 'error');
      return false;
    }
    const newJob: Job = {
      id: `demo-custom-${Date.now()}`,
      title,
      company,
      location: jobData.location?.trim() || 'Not specified',
      source: 'User Custom Entry',
      postedDate: new Date().toISOString(),
      matchScore: null,
      salary: jobData.salary?.trim() || undefined,
      type: jobData.type || 'Not specified',
      experienceLevel: jobData.experienceLevel || 'Not specified',
      workplaceType: jobData.workplaceType || 'Not specified',
      originalUrl: jobData.originalUrl?.trim() || '',
      description: jobData.description?.trim() || '',
      skillsRequired: Array.isArray(jobData.skillsRequired) ? jobData.skillsRequired.filter(Boolean) : [],
      verified: false,
      saved: true,
    };
    if (isDemoMode) {
      setJobs((prev) => [newJob, ...prev]);
      setSavedJobIds((prev) => [newJob.id, ...prev]);
      showToast(`Custom job "${newJob.title}" added to demo data.`, 'info');
      return true;
    }
    if (!user.isAuthenticated) {
      showToast('Sign in to add a custom job.', 'error');
      return false;
    }
    try {
      const persisted = await addCustomJobApi(newJob);
      await saveJobApi(persisted);
      setJobs((prev) => [persisted, ...prev.filter((job) => job.id !== persisted.id)]);
      setSavedJobIds((prev) => prev.includes(persisted.id) ? prev : [...prev, persisted.id]);
      showToast(`Custom job "${persisted.title}" added. No match score was fabricated.`, 'success');
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Could not save this custom job.', 'error');
      return false;
    }
  };

  const evaluateJobMatch = async (jobId: string): Promise<MatchResult | null> => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) return null;
    if (isDemoMode) {
      showToast('Real AI matching is disabled in Demo Mode. Sign in and connect your own Gemini key to evaluate actual jobs.', 'info');
      return null;
    }
    if (!user.isAuthenticated || !resume.text.trim()) {
      showToast('Sign in and save your resume before evaluating job matches.', 'error');
      setActiveView('resume');
      return null;
    }
    showToast('Evaluating resume match using Gemini model fallback...', 'info');
    try {
      const result = await matchResumeWithJob(targetJob.title, targetJob.company, targetJob.description, resume.text, targetJob.id);
      setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, matchScore: result.score, matchResult: result } : j));
      showToast(`Match score calculated: ${result.score}% using real AI evaluation.`, 'success');
      return result;
    } catch (error: any) {
      showToast(error?.message || 'AI matching failed. Connect Gemini in Settings and retry.', 'error');
      return null;
    }
  };
  const addApplication = async (appData: Partial<Application>) => {
    const jobTitle = String(appData.jobTitle || '').trim();
    const company = String(appData.company || '').trim();
    if (!jobTitle || !company) { showToast('A job title and company are required to track an application.', 'error'); return; }

    const now = new Date().toISOString();
    const localRecord: Application = {
      id: `demo-app-${Date.now()}`, jobId: appData.jobId, jobTitle, company,
      location: appData.location?.trim() || 'Not specified', originalUrl: appData.originalUrl?.trim() || '',
      status: appData.status || 'Applied', appliedDate: now, lastUpdatedDate: now,
      notes: appData.notes || '', salary: appData.salary || '', contactPerson: appData.contactPerson || '', followUpNeeded: false,
    };

    if (isDemoMode) {
      setApplications((prev) => [localRecord, ...prev]);
      showToast(`Demo application for "${jobTitle}" tracked locally.`, 'info');
      return;
    }
    if (!user.isAuthenticated || !user.id || !isSupabaseConfigured) {
      showToast('Sign in with a configured Supabase backend before tracking a real application.', 'error');
      return;
    }
    try {
      const { data, error } = await supabase.from('applications').insert({
        user_id: user.id, job_id: appData.jobId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(appData.jobId) ? appData.jobId : null,
        job_title: jobTitle, company, location: localRecord.location, original_url: localRecord.originalUrl,
        status: localRecord.status, applied_date: now, last_updated_date: now, notes: localRecord.notes,
        salary: localRecord.salary, contact_person: localRecord.contactPerson, follow_up_needed: false,
      }).select('*').single();
      if (error) throw error;
      if (!data) throw new Error('The database did not confirm the application record.');
      const savedRecord: Application = {
        id: data.id, jobId: data.job_id || undefined, jobTitle: data.job_title, company: data.company,
        location: data.location || 'Not specified', originalUrl: data.original_url || '', status: data.status || 'Applied',
        appliedDate: data.applied_date || now, lastUpdatedDate: data.last_updated_date || now,
        notes: data.notes || '', salary: data.salary || '', contactPerson: data.contact_person || '', followUpNeeded: Boolean(data.follow_up_needed),
      };
      setApplications((prev) => [savedRecord, ...prev]);
      showToast(`Application for "${savedRecord.jobTitle}" was saved.`, 'success');
    } catch (error: any) {
      showToast(error?.message || 'Application could not be saved. No success was recorded.', 'error');
    }
  };

  const updateApplicationStatus = async (id: string, status: ApplicationStatus) => {
    if (isDemoMode) {
      setApplications((prev) => prev.map((app) => app.id === id ? { ...app, status, lastUpdatedDate: new Date().toISOString(), followUpNeeded: false } : app));
      showToast(`Demo application status updated to ${status}.`, 'info');
      return;
    }
    if (!user.isAuthenticated || !user.id || !isSupabaseConfigured) { showToast('Sign in to update a saved application.', 'error'); return; }
    const updatedAt = new Date().toISOString();
    try {
      const { data, error } = await supabase.from('applications').update({ status, last_updated_date: updatedAt })
        .eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Application not found for this account.');
      setApplications((prev) => prev.map((app) => app.id === id ? { ...app, status, lastUpdatedDate: updatedAt, followUpNeeded: false } : app));
      showToast(`Application status updated to ${status}.`, 'success');
    } catch (error: any) { showToast(error?.message || 'Application status could not be saved.', 'error'); }
  };

  const deleteApplication = async (id: string) => {
    if (isDemoMode) {
      setApplications((prev) => prev.filter((app) => app.id !== id));
      showToast('Demo application removed locally.', 'info');
      return;
    }
    if (!user.isAuthenticated || !user.id || !isSupabaseConfigured) { showToast('Sign in to delete a saved application.', 'error'); return; }
    try {
      const { data, error } = await supabase.from('applications').delete().eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Application not found for this account.');
      setApplications((prev) => prev.filter((app) => app.id !== id));
      showToast('Application deleted.', 'success');
    } catch (error: any) { showToast(error?.message || 'Application could not be deleted.', 'error'); }
  };

  const updateResume = async (text: string, name?: string, file?: File) => {
    if (!text.trim()) {
      showToast('Extracted resume text is empty. Upload a text-readable PDF/DOCX or paste resume text.', 'error');
      throw new Error('Resume text is empty.');
    }
    if (isDemoMode) {
      setResume({ text, name: name || 'Sample Resume (Demo)', lastUpdated: new Date().toISOString(), extractedSkills: [], parsedRole: '', extractionStatus: 'completed', profileVersion: (resume.profileVersion || 0) + 1 });
      showToast('Demo resume updated locally; it was not sent to the backend.', 'info');
      return;
    }
    if (!user.isAuthenticated || !user.id) throw new Error('Sign in before saving a resume.');
    if (file) {
      if (!isSupabaseConfigured) throw new Error('Supabase must be configured to upload a resume file securely.');
      await uploadResumeFile(user.id, file);
    }
    const updated = await saveResumeApi(text, name || file?.name, user.id);
    setResume(updated);
    showToast('Resume text and structured profile saved to your account.', 'success');
  };

  const reprocessResumeProfile = async () => {
    if (!resume.text.trim()) {
      showToast('Upload and save your resume before extracting a profile.', 'error');
      return;
    }
    showToast('Extracting structured profile from the saved resume...', 'info');
    try {
      const result = await extractResumeProfileApi(undefined, resume.name, user.id);
      if (!result?.profile) throw new Error('The backend did not return a structured profile.');
      const refreshed = await fetchResumeApi();
      if (refreshed) setResume(refreshed);
      else setResume((prev) => ({ ...prev, extractedSkills: result.skills || [], parsedRole: result.role || '', profile: result.profile, extractionStatus: 'completed' }));
      showToast('Structured profile refreshed from the saved resume.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Profile extraction failed. No fabricated profile was saved.', 'error');
    }
  };

  const deleteResumeProfile = async () => {
    if (isDemoMode) {
      setResume(emptyResume);
      showToast('Demo resume cleared locally.', 'info');
      return;
    }
    try {
      const success = await deleteResumeApi(user.id);
      if (!success) throw new Error('Backend did not confirm resume deletion.');
      setResume(emptyResume);
      showToast('Resume and structured profile cleared.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete resume profile.', 'error');
    }
  };

  const updateSchedule = async (newSchedule: Partial<ScanSchedule>) => {
    if (isDemoMode) {
      setSchedule((prev) => ({ ...prev, ...newSchedule, status: prev.status }));
      showToast('Demo schedule updated locally. It will not run in the background.', 'info');
      return;
    }
    try {
      const updated = await updateScheduleApi(newSchedule);
      setSchedule(updated);
      showToast(updated.enabled ? 'Background scan schedule saved.' : 'Background scans disabled; preferences saved.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Schedule could not be saved. Your previous schedule remains active.', 'error');
    }
  };

  const runScanNow = async () => {
    if (isDemoMode) {
      showToast('Demo Mode does not run real background scans. Sign in and configure a resume to scan genuine vacancies.', 'info');
      return;
    }
    if (!user.isAuthenticated || !resume.text.trim()) {
      showToast('Sign in and upload/save your resume before running a scan.', 'error');
      setActiveView('resume');
      return;
    }
    setSchedule((prev) => ({ ...prev, status: 'running' }));
    showToast('Scan queued on the backend. You can leave this page while the worker runs.', 'info');
    try {
      const result = await triggerDiscoveryScan();
      const [discoveredJobs, savedJobs, savedSchedule] = await Promise.all([
        fetchDiscoveredJobsApi(), fetchSavedJobsApi(), fetchScanSchedule(),
      ]);
      const allJobs = new Map<string, Job>();
      for (const job of discoveredJobs) allJobs.set(job.id, job);
      for (const job of savedJobs) if (!allJobs.has(job.id)) allJobs.set(job.id, job);
      const savedIds = savedJobs.map((job) => job.id);
      setJobs(Array.from(allJobs.values()).map((job) => ({ ...job, saved: savedIds.includes(job.id) })));
      setSavedJobIds(savedIds);
      setSchedule(savedSchedule);
      if (result.aiScoringError || result.aiScoringExhausted || (result.jobsDiscovered > 0 && result.aiScoringConfigured && Number(result.scoredJobsCount || 0) === 0)) {
        showToast(result.aiScoringError || `Scan discovered ${result.jobsDiscovered} jobs, but AI scoring was unavailable. Unscored jobs were saved without invented scores.`, 'info');
      } else if (result.aiScoringConfigured === false) {
        showToast(`Scan discovered ${result.jobsDiscovered} jobs. Connect your personal Gemini key for AI match scores.`, 'info');
      } else {
        showToast(`Scan completed: ${result.jobsDiscovered} jobs discovered, ${result.highMatchJobsCount} high matches.`, 'success');
      }
    } catch (error: any) {
      setSchedule((prev) => ({ ...prev, status: 'error' }));
      showToast(error?.message || 'Live scan did not finish. Check scan history and backend worker health.', 'error');
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (isDemoMode) {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      return;
    }
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch (err: any) {
      showToast(err?.message || 'Could not mark notification as read.', 'error');
    }
  };

  const clearAllNotifications = async () => {
    if (isDemoMode) {
      setNotifications([]);
      showToast('Demo notifications cleared locally.', 'info');
      return;
    }
    try {
      await clearNotificationsApi();
      setNotifications([]);
      showToast('All notifications cleared.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Could not clear notifications.', 'error');
    }
  };

  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPushPermission(res);
        if (res === 'granted') {
          showToast('Browser & PWA Push Notifications enabled!', 'success');
          if (user.id) {
            const subscribed = await subscribeUserToWebPush(user.id);
            if (subscribed) {
              setUser((prev) => ({
                ...prev,
                preferences: { ...prev.preferences, pushNotifications: true },
              }));
            }
          }
        } else {
          showToast('Notification permission denied or dismissed.', 'info');
        }
      } catch (e) {
        console.error('Notification error', e);
      }
    } else {
      showToast('Push notifications not supported in this browser.', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
        user,
        setUser,
        loginUser,
        signUpUser,
        logoutUser,
        resetUserPassword,
        deleteUserAccount,
        jobs,
        savedJobIds,
        toggleSaveJob,
        addCustomJob,
        evaluateJobMatch,
        applications,
        addApplication,
        updateApplicationStatus,
        deleteApplication,
        resume,
        updateResume,
        reprocessResumeProfile,
        deleteResumeProfile,
        registerOverlay,
        unregisterOverlay,
        closeTopOverlay,
        schedule,
        updateSchedule,
        runScanNow,
        sources,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        pushPermission,
        requestPushPermission,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
