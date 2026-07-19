import React from 'react';
import { FishType } from '../lib/fish';

interface FishSVGProps {
  fish: FishType;
  className?: string;
  size?: number;
}

export function FishSVG({ fish, className = '', size = 64 }: FishSVGProps) {
  const props = { width: size, height: size, className, viewBox: '0 0 64 64' };

  switch (fish.id) {
    case 'sardine':
      return (
        <svg {...props}>
          <ellipse cx="32" cy="32" rx="22" ry="10" fill={fish.color} />
          <ellipse cx="32" cy="32" rx="22" ry="10" fill="url(#sardine-shine)" opacity="0.4"/>
          <polygon points="54,32 62,24 62,40" fill={fish.accentColor} />
          <ellipse cx="14" cy="32" rx="6" ry="5" fill={fish.accentColor} />
          <circle cx="13" cy="30" r="2" fill="#1a1a2e" />
          <circle cx="13.6" cy="29.4" r="0.6" fill="white" />
          <line x1="20" y1="26" x2="50" y2="26" stroke={fish.accentColor} strokeWidth="1" opacity="0.5"/>
          <defs>
            <linearGradient id="sardine-shine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white"/>
              <stop offset="100%" stopColor="transparent"/>
            </linearGradient>
          </defs>
        </svg>
      );

    case 'carp':
      return (
        <svg {...props}>
          <ellipse cx="30" cy="33" rx="20" ry="14" fill={fish.color} />
          <ellipse cx="30" cy="30" rx="20" ry="14" fill={fish.color} />
          <polygon points="50,30 60,22 60,38" fill={fish.accentColor} />
          <ellipse cx="13" cy="30" rx="8" ry="7" fill={fish.accentColor} />
          <path d="M20 22 Q30 16 40 22" stroke={fish.accentColor} strokeWidth="2" fill="none"/>
          <path d="M20 38 Q30 44 40 38" stroke={fish.accentColor} strokeWidth="2" fill="none"/>
          <circle cx="13" cy="28" r="2.5" fill="#1a1a2e" />
          <circle cx="13.7" cy="27.3" r="0.8" fill="white" />
          {/* Scales */}
          <path d="M25 26 Q28 23 31 26" stroke="#c07828" strokeWidth="1" fill="none" opacity="0.7"/>
          <path d="M30 26 Q33 23 36 26" stroke="#c07828" strokeWidth="1" fill="none" opacity="0.7"/>
          <path d="M28 31 Q31 28 34 31" stroke="#c07828" strokeWidth="1" fill="none" opacity="0.7"/>
        </svg>
      );

    case 'bluegill':
      return (
        <svg {...props}>
          <ellipse cx="32" cy="32" rx="18" ry="11" fill={fish.color} />
          <polygon points="50,32 60,25 60,39" fill={fish.accentColor} />
          <ellipse cx="16" cy="32" rx="7" ry="6" fill={fish.accentColor} />
          {/* Blue stripe */}
          <rect x="20" y="26" width="26" height="4" rx="2" fill="#3060a8" opacity="0.6"/>
          <rect x="20" y="34" width="26" height="3" rx="1.5" fill="#3060a8" opacity="0.4"/>
          <circle cx="15" cy="30" r="2.2" fill="#1a1a2e" />
          <circle cx="15.7" cy="29.3" r="0.7" fill="white" />
          <path d="M30 22 L34 17 L38 22" stroke={fish.accentColor} strokeWidth="1.5" fill={fish.accentColor} opacity="0.8"/>
        </svg>
      );

    case 'catfish':
      return (
        <svg {...props}>
          <ellipse cx="30" cy="33" rx="21" ry="12" fill={fish.color} />
          <polygon points="51,33 61,26 61,40" fill={fish.accentColor} />
          <ellipse cx="11" cy="33" rx="9" ry="8" fill={fish.accentColor} />
          <circle cx="10" cy="31" r="2.5" fill="#1a1a2e" />
          <circle cx="10.8" cy="30.2" r="0.8" fill="white" />
          {/* Whiskers */}
          <line x1="10" y1="35" x2="2" y2="40" stroke={fish.accentColor} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="10" y1="36" x2="1" y2="44" stroke={fish.accentColor} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="14" y1="35" x2="8" y2="42" stroke={fish.accentColor} strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M30 22 L32 15 L34 22" fill={fish.color} stroke={fish.accentColor} strokeWidth="1"/>
          <ellipse cx="30" cy="34" rx="10" ry="4" fill="#5a4a38" opacity="0.4"/>
        </svg>
      );

    case 'bass':
      return (
        <svg {...props}>
          <ellipse cx="31" cy="32" rx="21" ry="13" fill={fish.color} />
          <polygon points="52,32 62,24 62,40" fill={fish.accentColor} />
          <ellipse cx="12" cy="32" rx="8" ry="7" fill={fish.accentColor} />
          <circle cx="11" cy="30" r="2.5" fill="#1a1a2e" />
          <circle cx="11.8" cy="29.2" r="0.8" fill="white" />
          {/* Dorsal fin spikes */}
          <path d="M22 20 L25 12 L28 20 L31 13 L34 20 L37 14 L40 20" fill={fish.color} stroke={fish.accentColor} strokeWidth="1.5"/>
          {/* Lateral line */}
          <path d="M20 32 Q36 30 50 32" stroke="#2a5a2a" strokeWidth="1.5" fill="none" strokeDasharray="2,2"/>
          {/* Green sheen */}
          <ellipse cx="31" cy="29" rx="15" ry="6" fill="#70c870" opacity="0.2"/>
        </svg>
      );

    case 'trout':
      return (
        <svg {...props}>
          <ellipse cx="32" cy="32" rx="20" ry="11" fill={fish.color} />
          <polygon points="52,32 62,25 62,39" fill="#f0c0d8" />
          <ellipse cx="14" cy="32" rx="8" ry="7" fill="#f0c0d8" />
          {/* Rainbow stripe */}
          <path d="M18 30 Q35 28 50 30" stroke="#ff6090" strokeWidth="3" fill="none" opacity="0.8"/>
          <path d="M18 30 Q35 28 50 30" stroke="#a040d0" strokeWidth="1.5" fill="none" opacity="0.5"/>
          {/* Spots */}
          <circle cx="28" cy="28" r="2" fill="#c03060" opacity="0.7"/>
          <circle cx="35" cy="30" r="1.5" fill="#c03060" opacity="0.7"/>
          <circle cx="42" cy="28" r="2" fill="#c03060" opacity="0.7"/>
          <circle cx="32" cy="35" r="1.5" fill="#c03060" opacity="0.6"/>
          <circle cx="13" cy="30" r="2.5" fill="#1a1a2e" />
          <circle cx="13.8" cy="29.2" r="0.8" fill="white" />
        </svg>
      );

    case 'tuna':
      return (
        <svg {...props}>
          {/* Streamlined body */}
          <ellipse cx="32" cy="32" rx="24" ry="10" fill={fish.color} />
          <ellipse cx="32" cy="32" rx="24" ry="10" fill="url(#tuna-dark)" />
          <polygon points="56,32 64,26 64,38" fill={fish.accentColor} />
          <ellipse cx="10" cy="32" rx="7" ry="6" fill={fish.accentColor} />
          {/* Silver belly */}
          <ellipse cx="32" cy="35" rx="18" ry="5" fill="#8090a8" opacity="0.6"/>
          {/* Finlets */}
          <line x1="48" y1="26" x2="50" y2="22" stroke={fish.accentColor} strokeWidth="2"/>
          <line x1="51" y1="27" x2="54" y2="23" stroke={fish.accentColor} strokeWidth="2"/>
          <circle cx="10" cy="30" r="2.5" fill="#1a1a2e" />
          <circle cx="10.8" cy="29.2" r="0.8" fill="white" />
          <defs>
            <linearGradient id="tuna-dark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1830"/>
              <stop offset="50%" stopColor="transparent"/>
            </linearGradient>
          </defs>
        </svg>
      );

    case 'swordfish':
      return (
        <svg {...props}>
          {/* Body */}
          <ellipse cx="36" cy="32" rx="18" ry="9" fill={fish.color} />
          {/* Sword bill */}
          <polygon points="18,32 54,30 54,34" fill={fish.accentColor} />
          <polygon points="8,32 18,30 18,34" fill="#90c8e8" />
          {/* Tail */}
          <polygon points="54,32 63,24 63,40" fill={fish.accentColor} />
          {/* Dorsal fin */}
          <path d="M30 23 Q36 12 44 23" fill={fish.accentColor} opacity="0.9"/>
          {/* Belly */}
          <ellipse cx="36" cy="35" rx="12" ry="4" fill="#e0eef8" opacity="0.5"/>
          <circle cx="22" cy="30" r="2.5" fill="#1a1a2e" />
          <circle cx="22.8" cy="29.2" r="0.8" fill="white" />
        </svg>
      );

    case 'pufferfish':
      return (
        <svg {...props}>
          {/* Round inflated body */}
          <circle cx="32" cy="32" r="20" fill={fish.color} />
          <circle cx="32" cy="32" r="20" fill="url(#puff-shine)" opacity="0.3"/>
          {/* Spikes */}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 32 + 20 * Math.cos(rad);
            const y1 = 32 + 20 * Math.sin(rad);
            const x2 = 32 + 27 * Math.cos(rad);
            const y2 = 32 + 27 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a08820" strokeWidth="2" strokeLinecap="round"/>;
          })}
          {/* Spots */}
          <circle cx="28" cy="28" r="3" fill="#a08820" opacity="0.5"/>
          <circle cx="38" cy="26" r="2" fill="#a08820" opacity="0.5"/>
          <circle cx="34" cy="36" r="2.5" fill="#a08820" opacity="0.5"/>
          {/* Eyes */}
          <circle cx="22" cy="29" r="4" fill="white" />
          <circle cx="22" cy="29" r="2.5" fill="#1a1a2e" />
          <circle cx="22.8" cy="28.2" r="0.8" fill="white" />
          {/* Tiny fins */}
          <ellipse cx="32" cy="14" rx="4" ry="3" fill={fish.accentColor} opacity="0.8"/>
          <ellipse cx="32" cy="50" rx="4" ry="3" fill={fish.accentColor} opacity="0.8"/>
          <defs>
            <radialGradient id="puff-shine">
              <stop offset="0%" stopColor="white"/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>
          </defs>
        </svg>
      );

    case 'shark':
      return (
        <svg {...props}>
          {/* Massive body */}
          <ellipse cx="33" cy="34" rx="26" ry="14" fill={fish.color} />
          {/* White belly */}
          <ellipse cx="33" cy="38" rx="20" ry="7" fill="#e8eef2" />
          {/* Tail */}
          <polygon points="59,34 64,20 64,48" fill={fish.color} />
          {/* Dorsal fin - iconic */}
          <polygon points="33,20 40,6 47,20" fill={fish.color} />
          {/* Pectoral fins */}
          <polygon points="20,36 10,48 35,38" fill="#505f6f" opacity="0.9"/>
          <polygon points="45,36 55,48 35,38" fill="#505f6f" opacity="0.7"/>
          {/* Gills */}
          <line x1="16" y1="30" x2="16" y2="38" stroke="#404f5f" strokeWidth="1.5"/>
          <line x1="19" y1="29" x2="19" y2="39" stroke="#404f5f" strokeWidth="1.5"/>
          <line x1="22" y1="29" x2="22" y2="39" stroke="#404f5f" strokeWidth="1.5"/>
          {/* Fearsome eye */}
          <circle cx="10" cy="32" r="3.5" fill="#1a2530" />
          <circle cx="10.8" cy="31.2" r="1" fill="white" />
          {/* Teeth hint */}
          <path d="M8 37 L10 40 L12 37 L14 40 L16 37" stroke="white" strokeWidth="1.5" fill="none"/>
          {/* Shine */}
          <ellipse cx="33" cy="27" rx="16" ry="4" fill="#a0b8c8" opacity="0.25"/>
        </svg>
      );

    default:
      return (
        <svg {...props}>
          <text x="32" y="40" textAnchor="middle" fontSize="32">🐟</text>
        </svg>
      );
  }
}

export function FishSVGById({ id, className, size }: { id: string; className?: string; size?: number }) {
  const fish = { id, color: '#888', accentColor: '#aaa', rarity: 'Common' } as FishType;
  return <FishSVG fish={fish} className={className} size={size} />;
}
