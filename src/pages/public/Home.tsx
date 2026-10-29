import React from 'react';
import { useApp } from '../../context/AppContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { DeveloperCard } from '../../components/common/DeveloperCard';
import { TiltCard } from '../../components/common/TiltCard';
import heroDashboardPreview from '../../assets/images/hero_dashboard_preview_1792923568924.jpg';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Compass,
  Clock,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Code2,
  Bot,
  Layers,
  Database,
} from 'lucide-react';


export const Home: React.FC = () => {
  const { setActiveView, enterDemoMode, user, isDemoMode, setUser } = useApp();
  const reduceMotion = useReducedMotion();

  const handleGetStarted = async () => {
    if (user.isAuthenticated || isDemoMode) {
      setActiveView('resume');
      return;
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!error && data.session?.user) {
          const sessionUser = data.session.user;

          setUser((prev) => ({
            ...prev,
            id: sessionUser.id,
            email: sessionUser.email || '',
            name:
              sessionUser.user_metadata?.full_name ||
              sessionUser.email?.split('@')[0] ||
              'User',
            isAuthenticated: true,
          }));

          setActiveView('resume');
          return;
        }

        if (error) {
          console.error('Supabase session check failed:', error);
        }
      } catch (error) {
        console.error('Could not retrieve Supabase session:', error);
      }
    }

    setActiveView('signup');
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-8 lg:pt-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] sm:text-xs font-semibold text-violet-300">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Google Gemini Powered Job Discovery &amp; Tracking</span>
        </div>

        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1] max-w-3xl mx-auto"
        >
          Agentic Job Discovery <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400">
            Powered by AI Resume Intelligence
          </span>
        </motion.h1>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed"
        >
          Discover opportunities across LinkedIn, public job boards, and employer career pages. Compare your resume with Google Gemini to receive estimated match scores, evidence, and gap insights.
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
        >
          <button
            onClick={() => { void handleGetStarted(); }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-violet-600/20 transition-all text-sm flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={enterDemoMode}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold transition-colors text-sm flex items-center justify-center gap-2"
          >
            <span>Explore Interactive Demo</span>
          </button>
        </motion.div>


        {/* Hero Image Asset Preview */}
        <div className="pt-4 max-w-4xl mx-auto">
          <div className="relative rounded-xl p-1.5 bg-gradient-to-b from-violet-500/10 to-slate-800/20 border border-slate-700/40 shadow-xl overflow-hidden group">
            <img
              src={heroDashboardPreview}
              alt="Agentic Jobs SaaS Dashboard Preview"
              className="rounded-lg w-full object-cover shadow-inner group-hover:scale-[1.005] transition-transform duration-500"
            />
          </div>
        </div>
      </section>


      {/* Mechanism-to-Outcome How It Works Chain */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How Agentic Jobs Works</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            A continuous automated pipeline from multi-source discovery to AI resume evaluation and manual application management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">1. Multi-Source Discovery</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connect Apify LinkedIn Actors, RapidAPI LinkedIn host, public RSS feeds, and employer ATS job boards for unified indexing.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">2. Gemini AI Resume Matching</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Google Gemini evaluates job descriptions against your resume text, delivering 0–100 match scores, evidence list, and cautious gap notes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">3. Track &amp; Apply Directly</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Apply directly on official employer websites while tracking applications, interviews, offers, and follow-up timelines in your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Developer Credits Spotlight Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Built by</h2>
            <p className="text-sm text-slate-400">The team behind Agentic Jobs</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <DeveloperCard
              name="M Talha Iftikhar"
              title="Software Architect & Backend Engineer"
              description="Designed the server-side architecture, Express API endpoints, Gemini AI evaluation schemas, and background job scheduling integration."
              accentColor="violet"
            />
            <DeveloperCard
              name="Laiba Asif"
              title="Frontend Engineer & UI Designer"
              description="Designed and built the responsive glassmorphism UI, interactive job drawer components, application tracker, and dashboard analytics."
              accentColor="cyan"
            />
          </div>
        </div>
      </section>


      {/* Key Core Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Built for Serious Job Seekers</h2>
          <p className="text-xs sm:text-sm text-slate-400">Everything you need without fake mass-apply shortcuts or cover-letter spam.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          <TiltCard>
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5 card-hover-effect h-full">
              <div className="text-cyan-400 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Recommended Matches &gt;85%
              </div>
              <p className="text-slate-300 leading-relaxed">
                Automatically filter jobs scoring above 85% match accuracy with detailed evidence highlights and potential gap notes.
              </p>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5 card-hover-effect h-full">
              <div className="text-violet-400 font-bold flex items-center gap-2">
                <Clock className="w-4 h-4" /> Automated Background Scans
              </div>
              <p className="text-slate-300 leading-relaxed">
                Schedule scans every 1 to 24 hours or every 1 to 5 days across integrated Apify and RapidAPI connectors.
              </p>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5 card-hover-effect h-full">
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Private Storage &amp; RLS
              </div>
              <p className="text-slate-300 leading-relaxed">
                Resumes and search credentials are private to your user session and protected by Row Level Security.
              </p>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5 card-hover-effect h-full">
              <div className="text-amber-400 font-bold flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Application Follow-Up Alerts
              </div>
              <p className="text-slate-300 leading-relaxed">
                Automatic alert badges when an application stays in &quot;Applied&quot; status for over 5 days without updates.
              </p>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5 card-hover-effect h-full">
              <div className="text-rose-400 font-bold flex items-center gap-2">
                <Layers className="w-4 h-4" /> Multi-Board Connector Engine
              </div>
              <p className="text-slate-300 leading-relaxed">
                Extensible source connectors for Apify LinkedIn, RapidAPI, Greenhouse, Lever, and custom RSS feeds.
              </p>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5 card-hover-effect h-full">
              <div className="text-sky-400 font-bold flex items-center gap-2">
                <Database className="w-4 h-4" /> Direct Employer Apply
              </div>
              <p className="text-slate-300 leading-relaxed">
                Apply directly on official employer sites. No automatic submission or spam bots.
              </p>
            </div>
          </TiltCard>
        </div>
      </section>
    </div>
  );
};
