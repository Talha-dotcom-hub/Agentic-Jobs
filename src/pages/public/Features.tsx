import React from 'react';
import { useApp } from '../../context/AppContext';
import { TiltCard } from '../../components/common/TiltCard';
import {
  Compass,
  Sparkles,
  Clock,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Database,
  Layers,
  Cpu,
} from 'lucide-react';

export const Features: React.FC = () => {
  const { setActiveView } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Complete Platform Capabilities
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Agentic Jobs replaces scattered job alerts and spreadsheet trackers with an automated AI pipeline for discovery, matching, and application tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature 1: Multi-Source Job Discovery */}
        <TiltCard>
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 card-hover-effect">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">1. Multi-Source Job Discovery Engine</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Connect permitted data sources including a server-side integration for Apify LinkedIn jobs Actor and RapidAPI host <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">linkedin-data-api.p.rapidapi.com</code>. Search by title, keywords, skills, company, location, remote status, experience level, date posted, and salary.
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Unified search across LinkedIn, public feeds, and employer ATS boards</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Detect stale, unverified, or expired listings automatically</span>
            </li>
          </ul>
        </div>
        </TiltCard>

        {/* Feature 2: Google Gemini AI Matching */}
        <TiltCard>
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 card-hover-effect">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">2. Gemini AI Resume Matching</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every opportunity is evaluated against your uploaded resume using official <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">@google/genai</code> SDK server calls. Receive an estimated 0–100 match score, key matching evidence, and potential skill gaps.
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cautious skill gap phrasing (&quot;Not explicitly mentioned in resume text&quot;)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Automatic recommendations view for jobs scoring &gt; 85% match</span>
            </li>
          </ul>
        </div>
        </TiltCard>

        {/* Feature 3: Automated Scan Scheduler */}
        <TiltCard>
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 card-hover-effect">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">3. Automated Scan Scheduler</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Configure automated discovery scans every 1 to 24 hours or every 1 to 5 days. Track last scan time, next scheduled check, successful jobs found, and source health statuses with server-side background job monitoring.
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real server background schedule status representation (no fake timers)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Automatic deduplication of new job entries</span>
            </li>
          </ul>
        </div>
        </TiltCard>

        {/* Feature 4: Application Tracker & Follow-Ups */}
        <TiltCard>
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 card-hover-effect">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white">4. Manual Application Tracker &amp; Follow-Up Reminders</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Track Applied, Interview, Offer, and Rejected statuses with custom notes, salary details, and contact persons. Built-in follow-up alert badges flag applications remaining in &quot;Applied&quot; status for more than 5 days.
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Automatic 5-day follow-up reminder indicator</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full manual CRUD with status filters and notes search</span>
            </li>
          </ul>
        </div>
        </TiltCard>
      </div>

      <div className="text-center pt-8">
        <button
          onClick={() => setActiveView('signup')}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-cyan-500 transition-all inline-flex items-center gap-2"
        >
          <span>Get Started with Agentic Jobs</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
