import React from 'react';
import { useApp } from '../../context/AppContext';
import { BrandMark } from '../common/BrandMark';
import { Shield, Lock, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveView } = useApp();

  return (
    <footer className="app-footer w-full border-t border-[#27272A] bg-surface text-on-surface-variant py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#27272A]">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 text-on-surface font-bold text-lg">
              <BrandMark className="w-7 h-7 rounded-lg" />
              <span className="font-headline-sm">Agentic Jobs</span>
            </div>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">
              AI-powered job discovery, resume matching, recommendation, and application-tracking platform.
            </p>
            {/* Developer Credits - Explicit attribution */}
            <div className="pt-2 border-t border-[#27272A]">
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium font-code-meta">
                <Code2 className="w-3.5 h-3.5 shrink-0" />
                <span>Built by M Talha Iftikhar</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-label-md uppercase tracking-wider text-on-surface">Product</h4>
            <ul className="space-y-2 font-body-sm">
              <li>
                <button onClick={() => setActiveView('features')} className="hover:text-on-surface transition-colors">
                  Features Overview
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('discover')} className="hover:text-on-surface transition-colors">
                  Discover Jobs
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('recommended')} className="hover:text-on-surface transition-colors">
                  AI Recommendations
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('schedule')} className="hover:text-on-surface transition-colors">
                  Automated Scheduler
                </button>
              </li>
            </ul>
          </div>

          {/* Developers & Company */}
          <div className="space-y-3">
            <h4 className="font-label-md uppercase tracking-wider text-on-surface">Project &amp; Team</h4>
            <ul className="space-y-2 font-body-sm">
              <li>
                <button onClick={() => setActiveView('about')} className="hover:text-on-surface transition-colors">
                  About &amp; Project Developers
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('faq')} className="hover:text-on-surface transition-colors">
                  FAQ &amp; Help Center
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('contact')} className="hover:text-on-surface transition-colors">
                  Support &amp; Feedback
                </button>
              </li>
            </ul>
          </div>

          {/* Privacy & Security */}
          <div className="space-y-3">
            <h4 className="font-label-md uppercase tracking-wider text-on-surface">Privacy &amp; Terms</h4>
            <ul className="space-y-2 font-body-sm">
              <li>
                <button onClick={() => setActiveView('privacy')} className="hover:text-on-surface transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('cookie')} className="hover:text-on-surface transition-colors">
                  Cookie Policy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('terms')} className="hover:text-on-surface transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView('accessibility')} className="hover:text-on-surface transition-colors">
                  Accessibility Statement
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-code-meta text-on-surface-variant">
          <div>
            &copy; {new Date().getFullYear()} Agentic Jobs. Built by M Talha Iftikhar. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-primary" /> Private Resume Storage
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-secondary" /> Row Level Security
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
