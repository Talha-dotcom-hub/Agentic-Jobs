import React from 'react';
import { useApp } from '../../context/AppContext';
import { Briefcase, Shield, Lock, Code2 } from 'lucide-react';
import { InstallPWA } from '../common/InstallPWA';

export const Footer: React.FC = () => {
  const { setActiveView } = useApp();

  return (
    <footer className="w-full bg-[#070A12] border-t border-slate-800/80 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800/60">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <span>Agentic Jobs</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-powered job discovery, resume matching, recommendation, and application-tracking platform.
            </p>
            {/* Developer Credits - Explicit equal visual importance requirement */}
            <div className="pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5 text-xs text-violet-300 font-medium">
                <Code2 className="w-3.5 h-3.5 shrink-0" />
                <span>Built by M Talha Iftikhar &amp; Laiba Asif</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveView('features')} className="hover:text-white transition-colors">
                  Features Overview
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('discover')} className="hover:text-white transition-colors">
                  Discover Jobs
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('recommended')} className="hover:text-white transition-colors">
                  AI Recommendations
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('schedule')} className="hover:text-white transition-colors">
                  Automated Scheduler
                </button>
              </li>
            </ul>
          </div>

          {/* Developers & Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Project &amp; Team</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveView('about')} className="hover:text-white transition-colors">
                  About &amp; Project Developers
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('faq')} className="hover:text-white transition-colors">
                  FAQ &amp; Help Center
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('contact')} className="hover:text-white transition-colors">
                  Support &amp; Feedback
                </button>
              </li>
            </ul>
          </div>

          {/* Privacy & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Privacy &amp; Terms</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveView('privacy')} className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('cookie')} className="hover:text-white transition-colors">
                  Cookie Policy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('terms')} className="hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('accessibility')} className="hover:text-white transition-colors">
                  Accessibility Statement
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Agentic Jobs. Built by M Talha Iftikhar &amp; Laiba Asif. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Private Resume Storage
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-cyan-400" /> Row Level Security
            </span>
          </div>
        </div>
      </div>
      <InstallPWA />
    </footer>
  );
};
