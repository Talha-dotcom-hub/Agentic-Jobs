import React from 'react';
import { useApp } from '../../context/AppContext';
import { Code2, Shield, Bot, Layers } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">About Agentic Jobs</h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
          Agentic Jobs was created to empower job seekers with transparent AI matching, multi-source job discovery, and application tracking.
        </p>
      </div>

      {/* Project Developers Section */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900 border border-violet-500/30 space-y-6">
        <div className="flex items-center gap-2 text-violet-300 font-semibold text-sm">
          <Code2 className="w-5 h-5 text-cyan-400" />
          <span>Project Developers</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Agentic Jobs was developed by M Talha Iftikhar and Laiba Asif as a full-stack SaaS application combining React, TypeScript, Express, and Google Gemini SDK integrations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Developer 1 */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h3 className="text-base font-bold text-white">M Talha Iftikhar</h3>
            <p className="text-xs text-violet-300 font-medium">Software Architect &amp; Backend Engineer</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed the server-side architecture, Express API endpoints, Gemini AI evaluation schemas, and background job scheduling integration.
            </p>
          </div>

          {/* Developer 2 */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h3 className="text-base font-bold text-white">Laiba Asif</h3>
            <p className="text-xs text-cyan-300 font-medium">Frontend Engineer &amp; UI Designer</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Designed and built the responsive glassmorphism UI, interactive job drawer components, application tracker, and dashboard analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Product Mission & Principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>Honest AI Match Estimates</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Our Gemini evaluation outputs estimated match scores, supporting evidence, and cautious gap analysis. We never claim a skill is absent merely because it was omitted from the resume text.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>User Control &amp; Direct Application</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            You apply on the official employer website. We do not implement mass-apply bots, fake submission scripts, or automatic application form fillers.
          </p>
        </div>
      </div>
    </div>
  );
};
