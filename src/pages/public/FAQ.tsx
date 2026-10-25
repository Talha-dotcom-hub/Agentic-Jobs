import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'AI Matching' | 'Job Sources' | 'Privacy & Security' | 'Application Tracker';
}

const faqs: FAQItem[] = [
  {
    category: 'AI Matching',
    question: 'How does Gemini calculate my estimated job match score?',
    answer: 'Google Gemini analyzes your uploaded resume text against the job description requirements. It evaluates core technical skills, experience alignment, and role expectations to output an estimated score from 0 to 100, alongside matching evidence and potential skill gaps.',
  },
  {
    category: 'AI Matching',
    question: 'Does the AI claim I lack a skill if it is missing from my resume?',
    answer: 'No. Skill gaps are phrased cautiously as "Not explicitly mentioned in resume text". The AI never definitively states you lack an ability merely because your resume did not mention it.',
  },
  {
    category: 'Job Sources',
    question: 'What job boards and integrations are supported?',
    answer: 'Agentic Jobs supports Apify LinkedIn Actors, RapidAPI (linkedin-data-api.p.rapidapi.com), public job board RSS feeds, and direct ATS feeds like Greenhouse and Lever.',
  },
  {
    category: 'Job Sources',
    question: 'Does Agentic Jobs apply to listings automatically on my behalf?',
    answer: 'No. You apply on the official employer or job-board website. Agentic Jobs does not support mass-apply bots or automated application form submissions.',
  },
  {
    category: 'Application Tracker',
    question: 'How does the 5-day follow-up reminder work?',
    answer: 'When you log an application in "Applied" status and it remains un-updated for more than 5 days, an indicator badge flags the record in your dashboard so you can send a follow-up inquiry.',
  },
  {
    category: 'Privacy & Security',
    question: 'Is my resume data stored securely?',
    answer: 'Yes. Resume content is stored in private user storage protected by Row Level Security (RLS). Server-side Gemini API calls do not expose your credentials or resume to client bundles.',
  },
];

export const FAQ: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center justify-center gap-2">
          <HelpCircle className="w-8 h-8 text-cyan-400" />
          <span>FAQ &amp; Help Center</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Frequently asked questions about job discovery, Gemini AI matching, and privacy.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-lg mx-auto">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search questions (e.g., Gemini, LinkedIn, Follow-up)..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-xl bg-slate-900/50 border border-slate-800/80 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 text-xs font-semibold text-slate-200 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                    {faq.category}
                  </span>
                  <span>{faq.question}</span>
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 bg-slate-950/30">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
