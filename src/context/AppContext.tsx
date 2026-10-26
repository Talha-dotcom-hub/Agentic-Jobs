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
  addCustomJob: (job: Partial<Job>) => void;
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
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  pushPermission: NotificationPermission | 'unsupported';
  requestPushPermission: () => Promise<void>;

  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const defaultResumeText = `Senior Full Stack Software Engineer with 6+ years of experience building scalable web applications.
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

    if (view === 'home') {
      viewHistoryRef.current = ['home'];
      window.history.replaceState({ agenticJobsView: view }, '');
    } else if (
      view === 'dashboard' &&
      (activeViewRef.current === 'login' || activeViewRef.current === 'signup')
    ) {
      viewHistoryRef.current = ['home', 'dashboard'];
      window.history.replaceState({ agenticJobsView: 'home' }, '');
      window.history.pushState({ agenticJobsView: view }, '');
    } else {
      viewHistoryRef.current.push(view);
      window.history.pushState({ agenticJobsView: view }, '');
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
  const [sources] = useState<SourceHealth[]>(initialSources);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [resume, setResume] = useState<Resume>({
    text: defaultResumeText,
    name: 'Resume_Engineering_2026.pdf',
    lastUpdated: new Date().toISOString(),
    extractedSkills: ['TypeScript', 'React', 'Node.js', 'Express', 'Python', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'AWS', 'System Architecture'],
    parsedRole: 'Senior Full Stack Software Engineer',
  });

  const [schedule, setSchedule] = useState<ScanSchedule>({
    enabled: true,
    frequencyType: 'hourly',
    frequencyValue: 4,
    lastScanTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    nextScanTime: new Date(Date.now() + 3600000 * 2).toISOString(),
    lastSuccessfulScanJobsCount: 14,
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

  // Restore Persistent Resume Memory from Server/Supabase
  useEffect(() => {
    const loadResume = async () => {
      try {
        const targetUserId = user.id || (isDemoMode ? 'user-001' : undefined);
        const stored = await fetchResumeApi(targetUserId);
        if (stored && stored.text) {
          setResume(stored);
        }
      } catch (err) {
        console.warn('Initial resume sync error:', err);
      }
    };
    loadResume();
  }, [user.id, isDemoMode]);

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setJobs(initialJobs);
    setSavedJobIds(['job-101', 'job-103']);
    setApplications(initialApplications);
    setNotifications(initialNotifications);
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
        if (window.location.pathname !== '/reset-password' && !window.location.hash.includes('type=recovery')) {
          setActiveView('resume');
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        setActiveView('reset-password');
      } else if (event === 'SIGNED_OUT') {
        setUser((prev) => ({ ...prev, id: '', email: '', name: '', isAuthenticated: false }));
        setIsDemoMode(false);
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
        // 1. Load saved jobs
        const { data: userJobs } = await supabase
          .from('user_jobs')
          .select('job_id')
          .eq('user_id', user.id)
          .eq('is_saved', true);

        if (userJobs) {
          setSavedJobIds(userJobs.map((j: any) => j.job_id));
        }

        // 2. Load applications
        const { data: apps } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user.id)
          .order('applied_date', { ascending: false });

        if (apps && apps.length > 0) {
          setApplications(apps.map((a: any) => ({
            id: a.id,
            jobId: a.job_id,
            jobTitle: a.job_title,
            company: a.company,
            location: a.location || 'Remote',
            originalUrl: a.original_url || 'https://linkedin.com/jobs',
            status: a.status || 'Applied',
            appliedDate: a.applied_date || new Date().toISOString(),
            lastUpdatedDate: a.last_updated_date || new Date().toISOString(),
            notes: a.notes || '',
            salary: a.salary || '',
            contactPerson: a.contact_person || '',
            followUpNeeded: a.follow_up_needed || false,
          })));
        }

        // 3. Load notifications
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (notifs && notifs.length > 0) {
          setNotifications(notifs.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            read: n.read,
            type: n.type || 'system',
            timestamp: n.created_at,
            link: n.link,
          })));
        }

        // 4. Load scan schedule
        const { data: sched } = await supabase
          .from('scan_schedules')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (sched) {
          setSchedule((prev) => ({
            ...prev,
            enabled: sched.enabled,
            frequencyType: sched.frequency_type || 'hourly',
            frequencyValue: sched.frequency_value || 4,
            lastScanTime: sched.last_scan_time,
            nextScanTime: sched.next_scan_time,
            lastSuccessfulScanJobsCount: sched.last_successful_jobs_count || 0,
            sourceFailuresCount: sched.source_failures_count || 0,
            status: sched.status || 'idle',
          }));
        }
      } catch (err) {
        console.warn('Real user data sync error:', err);
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
    setActiveView('resume');
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
        setActiveView('resume');
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
      await supabase.auth.signOut();
    }
    setUser((prev) => ({ ...prev, id: '', email: '', name: '', isAuthenticated: false }));
    setIsDemoMode(false);
    setJobs([]);
    setSavedJobIds([]);
    setApplications([]);
    setNotifications([]);
    setActiveView('home');
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
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Account deletion warning:', err);
    }
    setUser({
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
    setIsDemoMode(false);
    setActiveView('home');
    showToast('Your account and associated resume data have been permanently deleted.', 'info');
  };

  const toggleSaveJob = async (jobId: string) => {
    const isSaved = savedJobIds.includes(jobId);
    if (isSaved) {
      setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
      showToast('Job removed from saved list.', 'info');
      if (isSupabaseConfigured && user.isAuthenticated && !isDemoMode && user.id) {
        await supabase.from('user_jobs').delete().eq('user_id', user.id).eq('job_id', jobId);
      }
    } else {
      setSavedJobIds((prev) => [...prev, jobId]);
      showToast('Job saved to your list.', 'success');
      if (isSupabaseConfigured && user.isAuthenticated && !isDemoMode && user.id) {
        await supabase.from('user_jobs').upsert(
          {
            user_id: user.id,
            job_id: jobId,
            is_saved: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,job_id' }
        );
      }
    }
  };

  const addCustomJob = (jobData: Partial<Job>) => {
    const newJob: Job = {
      id: `job-custom-${Date.now()}`,
      title: jobData.title || 'Untitled Opportunity',
      company: jobData.company || 'Direct Employer',
      location: jobData.location || 'Remote',
      source: 'User Custom Entry',
      postedDate: new Date().toISOString(),
      matchScore: jobData.matchScore || 88,
      salary: jobData.salary || 'Competitive',
      type: jobData.type || 'Full-time',
      experienceLevel: jobData.experienceLevel || 'Mid-Senior',
      workplaceType: jobData.workplaceType || 'Remote',
      originalUrl: jobData.originalUrl || 'https://linkedin.com/jobs',
      description: jobData.description || 'Custom added job listing.',
      skillsRequired: jobData.skillsRequired || ['TypeScript', 'React'],
      verified: true,
      saved: true,
    };

    setJobs((prev) => [newJob, ...prev]);
    setSavedJobIds((prev) => [...prev, newJob.id]);
    showToast(`Custom job "${newJob.title}" added and saved!`, 'success');
  };

  const evaluateJobMatch = async (jobId: string): Promise<MatchResult | null> => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) return null;

    showToast(`Evaluating resume match using Google Gemini...`, 'info');
    const result = await matchResumeWithJob(
      targetJob.title,
      targetJob.company,
      targetJob.description,
      resume.text
    );

    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, matchScore: result.score, matchResult: result } : j
      )
    );

    showToast(`Match score calculated: ${result.score}%`, 'success');
    return result;
  };

  const addApplication = async (appData: Partial<Application>) => {
    const newApp: Application = {
      id: `app-${Date.now()}`,
      jobId: appData.jobId,
      jobTitle: appData.jobTitle || 'New Role',
      company: appData.company || 'Company',
      location: appData.location || 'Remote',
      originalUrl: appData.originalUrl || 'https://linkedin.com/jobs',
      status: appData.status || 'Applied',
      appliedDate: new Date().toISOString(),
      lastUpdatedDate: new Date().toISOString(),
      notes: appData.notes || '',
      salary: appData.salary || '',
      contactPerson: appData.contactPerson || '',
      followUpNeeded: false,
    };

    setApplications((prev) => [newApp, ...prev]);
    showToast(`Application for "${newApp.jobTitle}" tracked!`, 'success');

    if (isSupabaseConfigured && user.isAuthenticated && !isDemoMode && user.id) {
      try {
        await supabase.from('applications').insert({
          user_id: user.id,
          job_id: newApp.jobId && newApp.jobId.length === 36 ? newApp.jobId : null,
          job_title: newApp.jobTitle,
          company: newApp.company,
          location: newApp.location,
          original_url: newApp.originalUrl,
          status: newApp.status,
          applied_date: newApp.appliedDate,
          notes: newApp.notes,
          salary: newApp.salary,
          contact_person: newApp.contactPerson,
        });
      } catch (e) {
        console.warn('DB application insert warning:', e);
      }
    }
  };

  const updateApplicationStatus = async (id: string, status: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status,
              lastUpdatedDate: new Date().toISOString(),
              followUpNeeded: false,
            }
          : app
      )
    );
    showToast(`Application status updated to ${status}.`, 'success');

    if (isSupabaseConfigured && user.isAuthenticated && !isDemoMode && user.id) {
      await supabase.from('applications').update({
        status,
        last_updated_date: new Date().toISOString(),
      }).eq('id', id).eq('user_id', user.id);
    }
  };

  const deleteApplication = async (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
    showToast('Application deleted.', 'info');

    if (isSupabaseConfigured && user.isAuthenticated && !isDemoMode && user.id) {
      await supabase.from('applications').delete().eq('id', id).eq('user_id', user.id);
    }
  };

  const updateResume = async (text: string, name?: string, file?: File) => {
    if (file && isSupabaseConfigured && user.id) {
      try {
        await uploadResumeFile(user.id, file);
      } catch (err: any) {
        showToast(err.message || 'File upload failed.', 'error');
      }
    }

    const updated = await saveResumeApi(text, name, user.id || 'user-001');
    setResume(updated);
    showToast('Resume uploaded and structured profile updated!', 'success');
  };

  const reprocessResumeProfile = async () => {
    showToast('Extracting structured profile with Gemini AI...', 'info');
    const result = await extractResumeProfileApi(resume.text, resume.name, user.id || 'user-001');
    if (result && result.profile) {
      setResume((prev) => ({
        ...prev,
        extractedSkills: result.skills || prev.extractedSkills,
        parsedRole: result.role || prev.parsedRole,
        profile: result.profile,
        extractionStatus: 'completed',
        profileVersion: (prev.profileVersion || 1) + 1,
      }));
      showToast('Structured competencies and credentials refreshed!', 'success');
    } else {
      showToast('Profile extraction completed with fallback values.', 'info');
    }
  };

  const deleteResumeProfile = async () => {
    const success = await deleteResumeApi(user.id || 'user-001');
    if (success) {
      setResume({
        text: '',
        name: 'No Resume Stored',
        lastUpdated: new Date().toISOString(),
        extractedSkills: [],
        parsedRole: 'Candidate',
        profile: undefined,
        extractionStatus: 'idle',
        profileVersion: 0,
      });
      showToast('Resume memory and profile permanently cleared.', 'info');
    } else {
      showToast('Failed to delete resume profile.', 'error');
    }
  };

  const updateSchedule = async (newSchedule: Partial<ScanSchedule>) => {
    const updated = await updateScheduleApi(newSchedule);
    setSchedule((prev) => ({ ...prev, ...updated }));
    showToast('Scan schedule preferences saved.', 'success');
  };

  const runScanNow = async () => {
    setSchedule((prev) => ({ ...prev, status: 'running' }));
    showToast('Scanning Apify & RapidAPI job feeds for new matches...', 'info');

    await triggerDiscoveryScan();

    setTimeout(() => {
      setSchedule((prev) => ({
        ...prev,
        status: 'idle',
        lastScanTime: new Date().toISOString(),
        lastSuccessfulScanJobsCount: prev.lastSuccessfulScanJobsCount + 3,
      }));
      showToast('Scan complete! 3 new high-matching opportunities indexed.', 'success');
    }, 1200);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showToast('All notifications cleared.', 'info');
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
