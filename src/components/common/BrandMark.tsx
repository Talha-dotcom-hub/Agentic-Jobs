import React from 'react';

interface BrandMarkProps {
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ className = '' }) => (
  <svg
    aria-hidden="true"
    className={`brand-mark ${className}`}
    viewBox="0 0 64 64"
    fill="none"
  >
    <rect x="1" y="1" width="62" height="62" rx="18" fill="#10120E" />
    <path d="M17 25V20a4 4 0 0 1 4-4h22a4 4 0 0 1 4 4v5" stroke="#D8FF3E" strokeWidth="3" />
    <rect x="11" y="23" width="42" height="28" rx="7" stroke="#D8FF3E" strokeWidth="3" />
    <path d="M11 33h12l4 4h10l4-4h12" stroke="#D8FF3E" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="m23 44 7-6 5 3 8-9" stroke="#9EC5B0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M39 32h5v5" stroke="#9EC5B0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
