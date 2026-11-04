import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { TiltCard } from '../../components/common/TiltCard';
import {
  Sparkles,
  Compass,
  Clock,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  Code2,
  Bot,
  Layers,
  Database,
  Cpu,
} from 'lucide-react';

// â”€â”€ Scroll Reveal Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useScrollReveal<T extends HTMLElement>(
  threshold = 0.12
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      if (ref.current) ref.current.style.opacity = '1';
      return;
    }

    const el = ref.current;
    if (!el) return;

    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

// â”€â”€ Staggered children reveal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useStaggerReveal<T extends HTMLElement>(count: number, baseDelay = 80): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const parent = ref.current;
    if (!parent) return;

    const children = Array.from(parent.children) as HTMLElement[];
    if (prefersReduced) {
      children.forEach((c) => { c.style.opacity = '1'; });
      return;
    }

    children.slice(0, count).forEach((child, i) => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(16px)';
      child.style.transition = `opacity 0.5s ease ${i * baseDelay}ms, transform 0.5s ease ${i * baseDelay}ms`;
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          children.slice(0, count).forEach((child) => {
            child.style.opacity = '1';
            child.style.transform = 'translateY(0)';
          });
          observer.unobserve(parent);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(parent);
    return () => observer.disconnect();
  }, [count, baseDelay]);

  return ref;
}


export const Home: React.FC = () => {
  const { setActiveView, enterDemoMode, user, isDemoMode, setUser } = useApp();

  // Scroll-reveal refs
  const heroRef = useScrollReveal<HTMLElement>(0.05);
  const howItWorksRef = useScrollReveal<HTMLElement>();
  const howItWorksGridRef = useStaggerReveal<HTMLDivElement>(3, 100);
  const featuresRef = useScrollReveal<HTMLElement>();
  const featuresGridRef = useStaggerReveal<HTMLDivElement>(6, 80);
  const developerRef = useScrollReveal<HTMLElement>();
  const ctaRef = useScrollReveal<HTMLElement>();

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

      {/* â”€â”€ Hero Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section
        ref={heroRef}
        className="relative pt-8 lg:pt-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-7"
      >
        {/* Category badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#84CC16]/10 border border-[#84CC16]/25 text-[10px] sm:text-xs font-semibold text-[#84CC16]">
          <Cpu className="w-3 h-3" />
          <span>Google Gemini Â· Agentic Intelligence Â· Resume-Aware Discovery</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1] max-w-3xl mx-auto">
          Agentic Job Discovery
          <br className="hidden sm:inline" />
          <span className="text-[#84CC16]">
            {' '}Powered by AI Resume Intelligence
          </span>
        </h1>

        <p className="text-[#A1A1AA] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Discover opportunities across LinkedIn, public job boards, and employer career pages. Compare your resume with Google Gemini to receive estimated match scores, evidence, and gap insights.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => { void handleGetStarted(); }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-[6px] bg-[#84CC16] hover:bg-[#9ee939] text-[#0A0A0B] font-semibold shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={enterDemoMode}
            className="w-full sm:w-auto px-6 py-2.5 rounded-[6px] bg-[#141416] hover:bg-[#27272A] border border-[#27272A] text-[#D4D4D8] font-semibold transition-colors text-sm flex items-center justify-center gap-2"
          >
            <span>Explore Interactive Demo</span>
          </button>
        </div>

        {/* Genuine dashboard preview image */}
        <div className="pt-4 max-w-5xl mx-auto">
          <div className="relative rounded-[20px] p-1.5 bg-[#141416] border border-[#27272A] shadow-2xl overflow-hidden group">
            <picture>
              <source
                media="(max-width: 640px)"
                srcSet="/assets/agentic-jobs-dashboard-mobile.webp"
              />
              <img
                src="/assets/agentic-jobs-dashboard-desktop.webp"
                alt="Agentic Jobs demo dashboard showing job matches and application tracking"
                className="rounded-[14px] w-full object-cover shadow-inner group-hover:scale-[1.003] transition-transform duration-700"
              />
            </picture>
            <div className="absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/5 pointer-events-none" />
          </div>
        </div>
      </section>


      {/* â”€â”€ How It Works â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section
        ref={howItWorksRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12"
      >
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How Agentic Jobs Works</h2>
          <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-xl mx-auto">
            A continuous automated pipeline from multi-source discovery to AI resume evaluation and manual application management.
          </p>
        </div>

        <div ref={howItWorksGridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#141416] border border-[#27272A] space-y-4">
            <div className="w-10 h-10 rounded-lg bg-[#84CC16]/10 border border-[#84CC16]/25 flex items-center justify-center text-[#84CC16]">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">1. Multi-Source Discovery</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Connect Apify LinkedIn Actors, RapidAPI LinkedIn host, public RSS feeds, and employer ATS job boards for unified indexing.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#141416] border border-[#27272A] space-y-4">
            <div className="w-10 h-10 rounded-lg bg-[#84CC16]/10 border border-[#84CC16]/25 flex items-center justify-center text-[#84CC16]">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">2. Gemini AI Resume Matching</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Google Gemini evaluates job descriptions against your resume text, delivering 0â€“100 match scores, evidence list, and cautious gap notes.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#141416] border border-[#27272A] space-y-4">
            <div className="w-10 h-10 rounded-lg bg-[#84CC16]/10 border border-[#84CC16]/25 flex items-center justify-center text-[#84CC16]">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">3. Track &amp; Apply Directly</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Apply directly on official employer websites while tracking applications, interviews, offers, and follow-up timelines in your dashboard.
            </p>
          </div>
        </div>
      </section>


      {/* â”€â”€ Key Features Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section
        ref={featuresRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Built for Serious Job Seekers</h2>
          <p className="text-xs sm:text-sm text-[#A1A1AA]">Everything you need without fake mass-apply shortcuts or cover-letter spam.</p>
        </div>

        <div ref={featuresGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
          <TiltCard>
            <div className="p-5 rounded-xl bg-[#141416] border border-[#27272A] hover:border-[#3F3F46] transition-colors space-y-2.5 h-full">
              <div className="text-[#84CC16] font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Recommended Matches â‰¥85%
              </div>
              <p className="text-[#A1A1AA] leading-relaxed">
                Automatically filter jobs scoring 85% or higher match accuracy with detailed evidence highlights and potential gap notes.
              </p>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="p-5 rounded-xl bg-[#141416] border border-[#27272A] hover:border-[#3F3F46] transition-colors space-y-2.5 h-full">
              <div className="text-[#84CC16] font-bold flex items-center gap-2">
                <Clock className="w-4 h-4" /> Automated Background Scans
              </div>
              <p className="text-[#A1A1AA] leading-relaxed">
                Schedule scans every 1 to 24 hours or every 1 to 5 days across integrated Apify and RapidAPI connectors.
              </p>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="p-5 rounded-xl bg-[#141416] border border-[#27272A] hover:border-[#3F3F46] transition-colors space-y-2.5 h-full">
              <div className="text-[#84CC16] font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Private Storage &amp; RLS
              </div>
              <p className="text-[#A1A1AA] leading-relaxed">
                Resumes and search credentials are private to your user session and protected by Row Level Security.
              </p>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="p-5 rounded-xl bg-[#141416] border border-[#27272A] hover:border-[#3F3F46] transition-colors space-y-2.5 h-full">
              <div className="text-[#84CC16] font-bold flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Application Follow-Up Alerts
              </div>
              <p className="text-[#A1A1AA] leading-relaxed">
                Automatic alert badges when an application stays in &quot;Applied&quot; status for over 5 days without updates.
              </p>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="p-5 rounded-xl bg-[#141416] border border-[#27272A] hover:border-[#3F3F46] transition-colors space-y-2.5 h-full">
              <div className="text-[#84CC16] font-bold flex items-center gap-2">
                <Layers className="w-4 h-4" /> Multi-Board Connector Engine
              </div>
              <p className="text-[#A1A1AA] leading-relaxed">
                Extensible source connectors for Apify LinkedIn, RapidAPI, Greenhouse, Lever, and custom RSS feeds.
              </p>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="p-5 rounded-xl bg-[#141416] border border-[#27272A] hover:border-[#3F3F46] transition-colors space-y-2.5 h-full">
              <div className="text-[#84CC16] font-bold flex items-center gap-2">
                <Database className="w-4 h-4" /> Direct Employer Apply
              </div>
              <p className="text-[#A1A1AA] leading-relaxed">
                Apply directly on official employer sites. No automatic submission or spam bots.
              </p>
            </div>
          </TiltCard>
        </div>
      </section>


      {/* â”€â”€ Developer Credit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section
        ref={developerRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="p-6 sm:p-8 rounded-2xl bg-[#141416] border border-[#27272A] flex flex-col items-center text-center space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Built by</h2>
            <p className="text-sm text-[#A1A1AA]">Built by M Talha Iftikhar</p>
          </div>
          <TiltCard>
            <div className="px-8 py-6 rounded-xl bg-[#0A0A0B] border border-[#27272A] text-center min-w-[280px] max-w-[320px] space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#84CC16]/10 border border-[#84CC16]/25 flex items-center justify-center text-[#84CC16] mx-auto">
                <Code2 className="w-5 h-5" />
              </div>
              <div className="text-lg font-bold text-white">M Talha Iftikhar</div>
              <div className="text-sm font-semibold text-[#84CC16]">
                Software Architect &amp; Full-Stack Engineer
              </div>
              <p className="text-xs text-[#A1A1AA] mt-3 leading-relaxed">
                Designed and built the server-side architecture, Express API endpoints, Gemini AI evaluation schemas, background job scheduling, and the complete responsive frontend.
              </p>
            </div>
          </TiltCard>
        </div>
      </section>


      {/* â”€â”€ CTA Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section
        ref={ctaRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="p-8 sm:p-12 rounded-2xl bg-[#141416] border border-[#84CC16]/20 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Start Your Agentic Job Search</h2>
          <p className="text-sm text-[#A1A1AA] max-w-md mx-auto">
            Upload your resume, connect your Gemini key, and let the agent discover and rank opportunities matched to your actual background.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => { void handleGetStarted(); }}
              className="w-full sm:w-auto px-7 py-3 rounded-[6px] bg-[#84CC16] hover:bg-[#9ee939] text-[#0A0A0B] font-semibold transition-colors text-sm flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={enterDemoMode}
              className="w-full sm:w-auto px-7 py-3 rounded-[6px] border border-[#27272A] text-[#D4D4D8] hover:bg-[#27272A] font-semibold transition-colors text-sm"
            >
              Explore Demo
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
