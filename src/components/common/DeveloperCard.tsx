import React from 'react';
import { TiltCard } from './TiltCard';

interface DeveloperCardProps {
  name: string;
  title: string;
  description: string;
  accentColor: 'violet' | 'cyan';
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({ name, title, description, accentColor }) => {
  return (
    <TiltCard className="relative group p-[1px] rounded-2xl bg-gradient-to-br from-violet-500/50 to-cyan-500/50">
      <div className="px-8 py-6 rounded-[15px] bg-[#0B0F19] text-center min-w-[280px] max-w-[320px] space-y-2 h-full">
        <div className="text-lg font-bold text-white">{name}</div>
        <div className={`text-sm font-semibold ${accentColor === 'violet' ? 'text-violet-400' : 'text-cyan-400'}`}>
          {title}
        </div>
        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          {description}
        </p>
      </div>
    </TiltCard>
  );
};
