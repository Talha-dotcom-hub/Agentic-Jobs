import React from 'react';

export const Accessibility: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-xs text-slate-300 leading-relaxed">
      <h1 className="text-3xl font-bold text-white border-b border-slate-800 pb-4">Accessibility Statement</h1>
      <p>
        Agentic Jobs is committed to digital accessibility and WCAG AA compliance.
      </p>
      <h2 className="text-sm font-bold text-white pt-2">Accessibility Standards</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>WCAG AA compliant color contrast (minimum 4.5:1 text contrast)</li>
        <li>Visible focus rings and full keyboard navigation support</li>
        <li>Respect for reduced motion preferences (<code className="text-cyan-300">prefers-reduced-motion</code>)</li>
        <li>Screen reader accessible form controls and ARIA attributes</li>
      </ul>
    </div>
  );
};
