import React from 'react';
import { Shield, Lock } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-xs text-slate-300 leading-relaxed">
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <Shield className="w-5 h-5" />
          <span>Privacy &amp; Data Security Standard</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-slate-400">Last updated: October 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">1. Data Ownership &amp; Storage Boundaries</h2>
        <p>
          Agentic Jobs respects your privacy. Resume content uploaded to our platform is stored in private user storage protected by Row Level Security (RLS). Your resume text is never shared with third-party data brokers or used to train open models.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">2. AI Processing with Google Gemini</h2>
        <p>
          AI resume evaluations are executed via trusted server-side Google Gemini SDK calls using <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">@google/genai</code>. API keys and secret headers remain strictly on the server and are never exposed in client bundles or public logs.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">3. Account &amp; Data Deletion Guarantee</h2>
        <p>
          You retain total control over your data. You may delete your uploaded resume, custom job entries, application tracking records, or initiate full account purge at any time from your account Settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">4. Developer Credits</h2>
        <p>
          Agentic Jobs is built and maintained by M Talha Iftikhar &amp; Laiba Asif.
        </p>
      </section>
    </div>
  );
};
