import React, { useRef } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export const TiltCard: React.FC<TiltCardProps> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current || e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rotateY = ((mouseX / width) - 0.5) * 4;
    const rotateX = ((mouseY / height) - 0.5) * -4;

    ref.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`;

    // Shine effect
    const shine = ref.current.querySelector('.tilt-shine') as HTMLDivElement;
    if (shine) {
      shine.style.opacity = '1';
      shine.style.background = `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.08), transparent 80%)`;
    }
  };

  const handlePointerLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    const shine = ref.current.querySelector('.tilt-shine') as HTMLDivElement;
    if (shine) {
      shine.style.opacity = '0';
    }
  };

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={(event) => {
        if (event.pointerType !== 'mouse') handlePointerLeave();
      }}
      className={`relative transition-transform duration-150 ease-out motion-reduce:transform-none ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="tilt-shine absolute inset-0 rounded-[inherit] opacity-0 pointer-events-none transition-opacity duration-300" />
      {children}
    </div>
  );
};
