import React from 'react';

export const FlagRadiantStar = () => (
  <svg viewBox="0 0 100 60" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="epic-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4c1d95" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
      <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fde047" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#fde047" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100" height="60" rx="4" fill="url(#epic-bg)" stroke="#8b5cf6" strokeWidth="2" />
    <circle cx="50" cy="30" r="20" fill="url(#star-glow)" />
    <path d="M50 10 L54 26 L70 30 L54 34 L50 50 L46 34 L30 30 L46 26 Z" fill="#fef08a" />
  </svg>
);

export const FlagNeonCrescent = () => (
  <svg viewBox="0 0 100 60" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <rect width="100" height="60" rx="4" fill="#020617" stroke="#0ea5e9" strokeWidth="2" />
    <path d="M45 15 A 15 15 0 1 0 65 35 A 18 18 0 1 1 45 15" fill="#22d3ee" filter="url(#neon-glow)" />
    <circle cx="30" cy="20" r="1.5" fill="#fff" />
    <circle cx="75" cy="15" r="1" fill="#fff" />
    <circle cx="25" cy="45" r="2" fill="#fff" />
  </svg>
);

export const FlagVolcanoFury = () => (
  <svg viewBox="0 0 100 60" className="w-full h-full overflow-hidden" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="volcano-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7f1d1d" />
        <stop offset="100%" stopColor="#450a0a" />
      </linearGradient>
      <radialGradient id="crater-glow" cx="50%" cy="30%" r="30%">
        <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="100" height="60" rx="4" fill="url(#volcano-sky)" stroke="#f59e0b" strokeWidth="2" />
    
    <circle cx="50" cy="30" r="15" fill="url(#crater-glow)" />
    
    <g className="volcano-particles">
      {Array.from({ length: 8 }).map((_, i) => (
        <circle 
          key={i}
          cx="50" 
          cy="35" 
          r="1.5" 
          fill="#fcd34d" 
          className="animate-lava"
          style={{ 
            animationDelay: `${i * 0.25}s`,
            '--x-offset': `${(Math.random() - 0.5) * 30}px`,
            '--x-offset2': `${(Math.random() - 0.5) * 40}px`
          } as React.CSSProperties}
        />
      ))}
    </g>

    <path d="M20 60 L45 30 L55 30 L80 60 Z" fill="#1c1917" />
    <path d="M40 35 L45 30 L55 30 L60 35 L50 45 Z" fill="#ea580c" opacity="0.8" />
  </svg>
);

export const FlagCyberHack = () => {
  return (
    <svg viewBox="0 0 100 60" className="w-full h-full overflow-hidden" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="screen-clip">
          <rect x="5" y="5" width="90" height="50" rx="2" />
        </clipPath>
        <filter id="glitch" x="-20%" y="-20%" width="140%" height="140%">
          <feColorMatrix type="matrix" values="
            1 0 0 0 0
            0 2 0 0 0
            0 0 1 0 0
            0 0 0 1 0" />
        </filter>
      </defs>
      
      <rect width="100" height="60" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
      <rect x="5" y="5" width="90" height="50" rx="2" fill="#022c22" />
      
      <g clipPath="url(#screen-clip)">
        {Array.from({ length: 15 }).map((_, col) => (
          <g 
            key={col} 
            className="animate-matrix" 
            style={{ 
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1.5 + Math.random()}s` 
            }}
          >
            {Array.from({ length: 6 }).map((_, row) => (
              <text 
                key={row}
                x={8 + col * 6} 
                y={row * 8} 
                fontSize="6" 
                fill="#34d399"
                fontFamily="monospace"
                fontWeight="bold"
                opacity={1 - (row * 0.15)}
              >
                {Math.random() > 0.5 ? '1' : '0'}
              </text>
            ))}
          </g>
        ))}
        
        <text 
          x="50" 
          y="32" 
          fontSize="12" 
          fill="#bef264" 
          textAnchor="middle" 
          fontFamily="monospace" 
          fontWeight="900"
          filter="url(#glitch)"
          style={{ textShadow: '0 0 4px #4ade80' }}
        >
          HACKED
        </text>

        <rect x="5" y="5" width="90" height="50" fill="url(#scanline)" className="animate-scanline" opacity="0.3">
          <animate attributeName="y" values="5; 55; 5" dur="4s" repeatCount="indefinite" />
        </rect>
        <line x1="5" y1="5" x2="95" y2="5" stroke="#4ade80" strokeWidth="1" opacity="0.2" className="animate-scanline" />
      </g>
    </svg>
  );
};

export const ItemGraphic = ({ item, className = "" }: { item: any, className?: string }) => {
  if (item.type === 'emoji' || !item.type) {
    return <div className={`flex items-center justify-center ${className}`} style={{ fontSize: '3em' }}>{item.emoji}</div>;
  }
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {item.flagId === 'radiant-star' && <FlagRadiantStar />}
      {item.flagId === 'neon-crescent' && <FlagNeonCrescent />}
      {item.flagId === 'volcano' && <FlagVolcanoFury />}
      {item.flagId === 'cyber' && <FlagCyberHack />}
    </div>
  );
};