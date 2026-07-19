import { useState, useEffect, useCallback, useRef } from "react";
import { CrateModal, CrateItem, CRATE_ITEMS, CrateItemDisplay, getRarityColor, getRarityLabel, CRATE_COST } from "./CrateModal";
import confetti from "canvas-confetti";

const ROWS = 16;
const COLS = 9;
const MINES = 27;
const COINS_PER_WIN = 10;
const MAX_LEVEL = 15;

const BOARD_W = COLS * 32 + (COLS - 1) * 3;
const BOARD_H = ROWS * 32 + (ROWS - 1) * 3;

// ── XP thresholds ─────────────────────────────────────────────────────────────
const XP_THRESHOLDS = Array.from({ length: MAX_LEVEL + 1 }, (_, i) => 20 * i * (i + 1) / 2);

function computeLevel(xp: number): number {
  for (let i = MAX_LEVEL; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i;
  }
  return 0;
}

function getWinXP(time: number): number {
  if (time < 30) return 50;
  if (time < 60) return 40;
  if (time < 90) return 32;
  return 25;
}

// ── Level rewards ─────────────────────────────────────────────────────────────
const LEVEL_REWARDS: {
  level: number; coins: number;
  flag?: string; flagLabel?: string; flagEmoji?: string;
  theme?: string; themeLabel?: string;
}[] = [
  { level: 1,  coins: 20 },
  { level: 2,  coins: 20 },
  { level: 3,  coins: 20 },
  { level: 4,  coins: 20 },
  { level: 5,  coins: 25, flag: "gem",    flagLabel: "Gem",    flagEmoji: "💎", theme: "cyber",  themeLabel: "Cyber"  },
  { level: 6,  coins: 30 },
  { level: 7,  coins: 30 },
  { level: 8,  coins: 30 },
  { level: 9,  coins: 30 },
  { level: 10, coins: 40, flag: "dragon", flagLabel: "Dragon", flagEmoji: "🐉", theme: "void",   themeLabel: "Void"   },
  { level: 11, coins: 50 },
  { level: 12, coins: 50 },
  { level: 13, coins: 50 },
  { level: 14, coins: 50 },
  { level: 15, coins: 100, flag: "crown",  flagLabel: "Crown",  flagEmoji: "👑", theme: "galaxy", themeLabel: "Galaxy" },
];

// ── Shop data ──────────────────────────────────────────────────────────────────
const THEMES = [
  // Free defaults
  { id: "dark",      label: "Dark",       bg: "#000000",                                                                                        cell: "#3a3a3a", accent: "#4caf50",  price: 0,   levelReq: 0 },
  { id: "light",     label: "Light",      bg: "#f0f0f0",                                                                                        cell: "#bdbdbd", accent: "#4caf50",  price: 0,   levelReq: 0 },
  // Purchasable solid themes
  { id: "blue",      label: "Blue",       bg: "#060d1f",                                                                                        cell: "#112244", accent: "#4d9fff",  price: 25,  levelReq: 0 },
  { id: "green",     label: "Green",      bg: "#000000",                                                                                        cell: "#0a1a0a", accent: "#00e676",  price: 25,  levelReq: 0 },
  { id: "red",       label: "Red",        bg: "#0d0000",                                                                                        cell: "#2a0808", accent: "#ff4444",  price: 25,  levelReq: 0 },
  { id: "pink",      label: "Pink",       bg: "#110010",                                                                                        cell: "#2a0a22", accent: "#ff69b4",  price: 25,  levelReq: 0 },
  // Gradient purchasable themes
  { id: "sunset",    label: "Sunset",     bg: "linear-gradient(145deg,#1a0800 0%,#3d0d1a 55%,#1a0030 100%)",                                   cell: "#3a1208", accent: "#ff7a30",  price: 50,  levelReq: 0 },
  { id: "ocean",     label: "Ocean",      bg: "linear-gradient(145deg,#00081a 0%,#001a2e 55%,#002a18 100%)",                                   cell: "#0a1e2e", accent: "#00c8ff",  price: 75,  levelReq: 0 },
  { id: "inferno",   label: "Inferno",    bg: "linear-gradient(145deg,#1a0000 0%,#2d0800 55%,#1a0600 100%)",                                   cell: "#3a0e00", accent: "#ff6a00",  price: 100, levelReq: 0 },
  { id: "aurora",    label: "Aurora",     bg: "linear-gradient(145deg,#000d1a 0%,#001a0d 45%,#0d0025 100%)",                                   cell: "#0a1a18", accent: "#00ffaa",  price: 150, levelReq: 0 },
  { id: "neon",      label: "Neon City",  bg: "linear-gradient(145deg,#0d001a 0%,#1a0030 50%,#001a2a 100%)",                                   cell: "#180028", accent: "#ff00cc",  price: 200, levelReq: 0 },
  { id: "deepspace", label: "Deep Space", bg: "linear-gradient(160deg,#020010 0%,#080020 40%,#100030 70%,#040015 100%)",                        cell: "#12002a", accent: "#c084fc",  price: 250, levelReq: 0 },
  // Level-exclusive themes (not in shop, awarded automatically)
  { id: "cyber",     label: "Cyber",      bg: "#001a1a",                                                                                        cell: "#0a3030", accent: "#00ffcc",  price: 0,   levelReq: 5  },
  { id: "void",      label: "Void",       bg: "#060010",                                                                                        cell: "#1a0050", accent: "#9d4dfa",  price: 0,   levelReq: 10 },
  { id: "galaxy",    label: "Galaxy",     bg: "#08001a",                                                                                        cell: "#18003a", accent: "#ffd700",  price: 0,   levelReq: 15 },
  // Battle Pass exclusive themes (bpReq = tier needed to unlock)
  { id: "ember",    label: "Ember",    bg: "#100400",                                                                                           cell: "#2a0c00", accent: "#ff8c00",  price: 0,   levelReq: 0, bpReq: 4  },
  { id: "forest",   label: "Forest",   bg: "#001008",                                                                                           cell: "#0a2010", accent: "#22cc44",  price: 0,   levelReq: 0, bpReq: 9  },
  { id: "sapphire", label: "Sapphire", bg: "#020018",                                                                                           cell: "#0a0840", accent: "#4488ff",  price: 0,   levelReq: 0, bpReq: 14 },
  { id: "blossom",  label: "Blossom",  bg: "#120008",                                                                                           cell: "#280018", accent: "#ff2288",  price: 0,   levelReq: 0, bpReq: 19 },
  { id: "dusk",     label: "Dusk",     bg: "#080012",                                                                                           cell: "#180838", accent: "#aa55ff",  price: 0,   levelReq: 0, bpReq: 24 },
  { id: "prism",    label: "Prism",    bg: "linear-gradient(135deg,#0a0018 0%,#001818 33%,#180a00 66%,#0a0018 100%)",                           cell: "#1a0828", accent: "#cc44ff",  price: 0,   levelReq: 0, bpReq: 45 },
  { id: "nebula",   label: "Nebula",   bg: "linear-gradient(135deg,#0d0028 0%,#001a1a 25%,#1a0008 50%,#00081a 75%,#0d0028 100%)",              cell: "#120030", accent: "#ff55cc",  price: 0,   levelReq: 0, bpReq: 50 },
];

// ── Level-Exclusive Flag SVGs ──────────────────────────────────────────────────

function GemFlagSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="gem-bg-glow" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#80f0ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0088bb" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gem-top-face" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c8f8ff" />
          <stop offset="100%" stopColor="#40c8e8" />
        </linearGradient>
        <linearGradient id="gem-left-face" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0090cc" />
          <stop offset="100%" stopColor="#004e70" />
        </linearGradient>
        <linearGradient id="gem-right-face" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ccee" />
          <stop offset="100%" stopColor="#007099" />
        </linearGradient>
      </defs>
      {/* Outer glow pulse */}
      <ellipse cx="24" cy="30" rx="20" ry="17" fill="url(#gem-bg-glow)">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </ellipse>
      {/* Gem base fill */}
      <polygon points="16,13 32,13 38,23 24,44 10,23" fill="#0e6080" />
      {/* Top flat face (table) */}
      <polygon points="16,13 32,13 34,21 14,21" fill="url(#gem-top-face)" />
      {/* Upper-left facet */}
      <polygon points="10,23 16,13 14,21" fill="#006090" />
      {/* Upper-right facet */}
      <polygon points="32,13 38,23 34,21" fill="url(#gem-right-face)" />
      {/* Lower-left facet */}
      <polygon points="10,23 14,21 24,44" fill="url(#gem-left-face)" />
      {/* Lower-right facet */}
      <polygon points="34,21 38,23 24,44" fill="#00b0d8" />
      {/* Center-bottom facet */}
      <polygon points="14,21 34,21 24,44" fill="#00a8cc" />
      {/* Outline */}
      <polygon points="16,13 32,13 38,23 24,44 10,23" fill="none" stroke="#80eeff" strokeWidth="0.9" opacity="0.75" />
      {/* Inner facet lines */}
      <line x1="14" y1="21" x2="24" y2="44" stroke="#80eeff" strokeWidth="0.5" opacity="0.45" />
      <line x1="34" y1="21" x2="24" y2="44" stroke="#80eeff" strokeWidth="0.5" opacity="0.45" />
      <line x1="14" y1="21" x2="34" y2="21" stroke="#80eeff" strokeWidth="0.5" opacity="0.3" />
      {/* Moving light reflection on top face */}
      <polygon points="18,14 23,14 21,20 17,19" fill="white" opacity="0.35">
        <animate attributeName="opacity" values="0.1;0.45;0.1" dur="2.8s" repeatCount="indefinite" />
      </polygon>
      {/* Blinking sparkle top-right */}
      <circle cx="30" cy="11" r="1.6" fill="white">
        <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="r" values="0.6;2.1;0.6" dur="1.5s" repeatCount="indefinite" />
      </circle>
      {/* Blinking sparkle top-left */}
      <circle cx="18" cy="11" r="1.1" fill="#b0f4ff">
        <animate attributeName="opacity" values="0;0.9;0" dur="2s" begin="0.6s" repeatCount="indefinite" />
        <animate attributeName="r" values="0.4;1.5;0.4" dur="2s" begin="0.6s" repeatCount="indefinite" />
      </circle>
      {/* Tiny bottom sparkle */}
      <circle cx="24" cy="44" r="1.2" fill="#80eeff">
        <animate attributeName="opacity" values="0;0.8;0" dur="1.8s" begin="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function DragonFlagSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="dragon-bg-glow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#9d4dfa" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#3b0070" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Background glow */}
      <ellipse cx="24" cy="26" rx="20" ry="18" fill="url(#dragon-bg-glow)">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
      </ellipse>
      {/* Dragon head body */}
      <ellipse cx="24" cy="27" rx="14" ry="12" fill="#3b0764" />
      <ellipse cx="24" cy="27" rx="14" ry="12" fill="none" stroke="#7c3aed" strokeWidth="1.2" opacity="0.8" />
      {/* Forehead dome */}
      <ellipse cx="24" cy="19" rx="11" ry="6" fill="#4c0d8f" />
      {/* Left horn */}
      <polygon points="13,17 10,4 18,15" fill="#6b21a8" />
      <polygon points="13,17 10,4 18,15" fill="none" stroke="#9d4dfa" strokeWidth="0.8" opacity="0.7" />
      {/* Right horn */}
      <polygon points="35,17 38,4 30,15" fill="#6b21a8" />
      <polygon points="35,17 38,4 30,15" fill="none" stroke="#9d4dfa" strokeWidth="0.8" opacity="0.7" />
      {/* Left eye socket */}
      <ellipse cx="18" cy="24" rx="4.5" ry="4" fill="#1a003a" />
      {/* Left iris — animated fire glow */}
      <ellipse cx="18" cy="24" rx="3" ry="2.8" fill="#ff4500">
        <animate attributeName="fill" values="#ff4500;#ffaa00;#ff4500" dur="1.8s" repeatCount="indefinite" />
      </ellipse>
      {/* Left pupil */}
      <ellipse cx="18" cy="24" rx="1.2" ry="2.2" fill="#000" />
      {/* Left eye halo */}
      <ellipse cx="18" cy="24" rx="4.5" ry="4" fill="none" stroke="#ff6600" strokeWidth="0.6">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.8s" repeatCount="indefinite" />
      </ellipse>
      {/* Right eye socket */}
      <ellipse cx="30" cy="24" rx="4.5" ry="4" fill="#1a003a" />
      {/* Right iris */}
      <ellipse cx="30" cy="24" rx="3" ry="2.8" fill="#ff4500">
        <animate attributeName="fill" values="#ff4500;#ffaa00;#ff4500" dur="1.8s" repeatCount="indefinite" />
      </ellipse>
      {/* Right pupil */}
      <ellipse cx="30" cy="24" rx="1.2" ry="2.2" fill="#000" />
      {/* Right eye halo */}
      <ellipse cx="30" cy="24" rx="4.5" ry="4" fill="none" stroke="#ff6600" strokeWidth="0.6">
        <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.8s" repeatCount="indefinite" />
      </ellipse>
      {/* Snout */}
      <ellipse cx="24" cy="33" rx="6" ry="3.5" fill="#4c0d8f" />
      <ellipse cx="24" cy="33" rx="6" ry="3.5" fill="none" stroke="#7c3aed" strokeWidth="0.8" opacity="0.55" />
      {/* Nostrils */}
      <ellipse cx="21.5" cy="33" rx="1.3" ry="0.9" fill="#1a003a" />
      <ellipse cx="26.5" cy="33" rx="1.3" ry="0.9" fill="#1a003a" />
      {/* Scale arcs on forehead */}
      <path d="M19,22 Q24,19 29,22" fill="none" stroke="#7c3aed" strokeWidth="0.6" opacity="0.5" />
      <path d="M20,20 Q24,18 28,20" fill="none" stroke="#7c3aed" strokeWidth="0.6" opacity="0.35" />
      {/* Left nostril fire wisp */}
      <circle cx="21.5" cy="32" r="1.5" fill="#ff4500">
        <animate attributeName="cy" values="32;24;32" dur="0.9s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.85;0;0.85" dur="0.9s" repeatCount="indefinite" />
        <animate attributeName="r" values="1.5;0.5;1.5" dur="0.9s" repeatCount="indefinite" />
      </circle>
      {/* Right nostril fire wisp */}
      <circle cx="26.5" cy="32" r="1.2" fill="#ffaa00">
        <animate attributeName="cy" values="32;23;32" dur="1.1s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.85;0;0.85" dur="1.1s" repeatCount="indefinite" />
        <animate attributeName="r" values="1.2;0.4;1.2" dur="1.1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function CrownFlagSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="crown-gold-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe566" />
          <stop offset="100%" stopColor="#b87700" />
        </linearGradient>
        <radialGradient id="crown-bg-glow" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#ffd700" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Outer glow */}
      <ellipse cx="24" cy="32" rx="22" ry="14" fill="url(#crown-bg-glow)">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite" />
      </ellipse>
      {/* Left tall spike */}
      <polygon points="9,34 13,14 17,34" fill="url(#crown-gold-grad)" />
      <polygon points="9,34 13,14 17,34" fill="none" stroke="#ffcc00" strokeWidth="0.7" opacity="0.7" />
      {/* Middle tall spike (highest) */}
      <polygon points="18,34 24,7 30,34" fill="url(#crown-gold-grad)" />
      <polygon points="18,34 24,7 30,34" fill="none" stroke="#ffdd00" strokeWidth="0.8" opacity="0.9" />
      {/* Right tall spike */}
      <polygon points="31,34 35,14 39,34" fill="url(#crown-gold-grad)" />
      <polygon points="31,34 35,14 39,34" fill="none" stroke="#ffcc00" strokeWidth="0.7" opacity="0.7" />
      {/* Crown band */}
      <rect x="5" y="34" width="38" height="9" rx="2" fill="url(#crown-gold-grad)" />
      <rect x="5" y="34" width="38" height="9" rx="2" fill="none" stroke="#ffcc00" strokeWidth="0.8" opacity="0.8" />
      {/* Band jewels */}
      <circle cx="14" cy="38.5" r="2.2" fill="#cc2200">
        <animate attributeName="opacity" values="0.65;1;0.65" dur="1.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="24" cy="38.5" r="2.8" fill="#00ccee">
        <animate attributeName="opacity" values="0.65;1;0.65" dur="1.7s" begin="0.3s" repeatCount="indefinite" />
      </circle>
      <circle cx="34" cy="38.5" r="2.2" fill="#00cc66">
        <animate attributeName="opacity" values="0.65;1;0.65" dur="1.5s" begin="0.6s" repeatCount="indefinite" />
      </circle>
      {/* Left spike jewel */}
      <circle cx="13" cy="14" r="3.8" fill="#ff2200">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="13" cy="14" r="3.8" fill="none" stroke="#ff8866" strokeWidth="0.8">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="12" cy="12.8" r="1.2" fill="white" opacity="0.65" />
      {/* Middle spike jewel (biggest) */}
      <circle cx="24" cy="7" r="5" fill="#00ddff">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="1.7s" repeatCount="indefinite" />
      </circle>
      <circle cx="24" cy="7" r="5" fill="none" stroke="#88eeff" strokeWidth="0.9">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.7s" repeatCount="indefinite" />
      </circle>
      <circle cx="22.5" cy="5.5" r="1.8" fill="white" opacity="0.7" />
      {/* Right spike jewel */}
      <circle cx="35" cy="14" r="3.8" fill="#00dd44">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="1.4s" begin="0.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="35" cy="14" r="3.8" fill="none" stroke="#44ff88" strokeWidth="0.8">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" begin="0.4s" repeatCount="indefinite" />
      </circle>
      <circle cx="34" cy="12.8" r="1.2" fill="white" opacity="0.65" />
      {/* Floating sparkle particles */}
      <circle cx="6" cy="28" r="1.1" fill="#ffd700">
        <animate attributeName="opacity" values="0;0.9;0" dur="2.2s" begin="0.2s" repeatCount="indefinite" />
        <animate attributeName="cy" values="34;20;34" dur="2.2s" begin="0.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="42" cy="28" r="1.1" fill="#ffd700">
        <animate attributeName="opacity" values="0;0.9;0" dur="2.6s" begin="1s" repeatCount="indefinite" />
        <animate attributeName="cy" values="34;18;34" dur="2.6s" begin="1s" repeatCount="indefinite" />
      </circle>
      <circle cx="24" cy="3" r="0.9" fill="white">
        <animate attributeName="opacity" values="0;1;0" dur="1.6s" begin="0.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ── Battle Pass SVG Flags ──────────────────────────────────────────────────────

function SpecterFlagSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="specter-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d8eeff" />
          <stop offset="100%" stopColor="#5888bb" />
        </linearGradient>
        <radialGradient id="specter-glow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#88bbff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#88bbff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Soft glow behind */}
      <ellipse cx="24" cy="28" rx="18" ry="16" fill="url(#specter-glow)" />
      {/* Ghost body */}
      <path d="M10,22 Q10,6 24,6 Q38,6 38,22 L38,44 Q33,39 29,44 Q24,39 19,44 Q14,39 10,44 Z"
        fill="url(#specter-body)" stroke="#90c0e8" strokeWidth="1" opacity="0.95" />
      {/* Inner depth shading */}
      <path d="M14,22 Q14,10 24,10 Q34,10 34,22 L34,40 Q30,36 26,40 Q22,36 18,40 Q15,37 14,40 Z"
        fill="#001830" opacity="0.22" />
      {/* Left eye socket */}
      <ellipse cx="19" cy="23" rx="4.5" ry="5.5" fill="#001435" />
      <ellipse cx="19" cy="23" rx="4.5" ry="5.5" fill="none" stroke="#4a80b0" strokeWidth="0.7" opacity="0.7" />
      <circle cx="17.5" cy="21.5" r="1.4" fill="#3a70a0" opacity="0.75" />
      {/* Right eye socket */}
      <ellipse cx="29" cy="23" rx="4.5" ry="5.5" fill="#001435" />
      <ellipse cx="29" cy="23" rx="4.5" ry="5.5" fill="none" stroke="#4a80b0" strokeWidth="0.7" opacity="0.7" />
      <circle cx="27.5" cy="21.5" r="1.4" fill="#3a70a0" opacity="0.75" />
      {/* Outer ghost outline glow */}
      <path d="M10,22 Q10,6 24,6 Q38,6 38,22 L38,44 Q33,39 29,44 Q24,39 19,44 Q14,39 10,44 Z"
        fill="none" stroke="#c0ddff" strokeWidth="1.5" opacity="0.35" />
      {/* Subtle face line */}
      <path d="M19,32 Q24,35 29,32" fill="none" stroke="#80aad0" strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
    </svg>
  );
}

function BlazeFlagSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="blaze-ground" cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="#ff4400" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="blaze-core-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ffff00" />
          <stop offset="40%" stopColor="#ff8800" />
          <stop offset="100%" stopColor="#ff2200" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Ground glow */}
      <ellipse cx="24" cy="45" rx="13" ry="4" fill="url(#blaze-ground)">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.1s" repeatCount="indefinite" />
      </ellipse>
      {/* Outer flame – slowest */}
      <path d="M12,44 Q7,30 15,19 Q18,11 24,5 Q30,11 33,19 Q41,30 36,44 Q30,38 24,41 Q18,38 12,44 Z" fill="#ff1a00">
        <animate attributeName="d"
          values="M12,44 Q7,30 15,19 Q18,11 24,5 Q30,11 33,19 Q41,30 36,44 Q30,38 24,41 Q18,38 12,44 Z;M13,44 Q5,28 14,17 Q18,9 24,3 Q30,9 34,17 Q43,28 35,44 Q29,37 24,41 Q19,37 13,44 Z;M12,44 Q7,30 15,19 Q18,11 24,5 Q30,11 33,19 Q41,30 36,44 Q30,38 24,41 Q18,38 12,44 Z"
          dur="1.4s" repeatCount="indefinite" />
      </path>
      {/* Mid flame */}
      <path d="M15,44 Q11,31 17,22 Q20,14 24,9 Q28,14 31,22 Q37,31 33,44 Q28,38 24,41 Q20,38 15,44 Z" fill="#ff5500">
        <animate attributeName="d"
          values="M15,44 Q11,31 17,22 Q20,14 24,9 Q28,14 31,22 Q37,31 33,44 Q28,38 24,41 Q20,38 15,44 Z;M16,44 Q9,29 16,20 Q19,12 24,7 Q29,12 32,20 Q39,29 32,44 Q27,37 24,41 Q21,37 16,44 Z;M15,44 Q11,31 17,22 Q20,14 24,9 Q28,14 31,22 Q37,31 33,44 Q28,38 24,41 Q20,38 15,44 Z"
          dur="0.9s" repeatCount="indefinite" />
      </path>
      {/* Inner flame */}
      <path d="M18,44 Q15,33 20,25 Q22,18 24,14 Q26,18 28,25 Q33,33 30,44 Q26,39 24,42 Q22,39 18,44 Z" fill="#ff8800">
        <animate attributeName="d"
          values="M18,44 Q15,33 20,25 Q22,18 24,14 Q26,18 28,25 Q33,33 30,44 Q26,39 24,42 Q22,39 18,44 Z;M19,44 Q14,32 19,23 Q21,16 24,12 Q27,16 29,23 Q34,32 29,44 Q25,38 24,42 Q23,38 19,44 Z;M18,44 Q15,33 20,25 Q22,18 24,14 Q26,18 28,25 Q33,33 30,44 Q26,39 24,42 Q22,39 18,44 Z"
          dur="0.7s" repeatCount="indefinite" />
      </path>
      {/* Hot core */}
      <path d="M20,44 Q19,36 22,29 Q23,24 24,21 Q25,24 26,29 Q29,36 28,44 Q25,40 24,43 Q23,40 20,44 Z"
        fill="url(#blaze-core-grad)">
        <animate attributeName="opacity" values="0.85;1;0.85" dur="0.55s" repeatCount="indefinite" />
      </path>
      {/* Rising sparks */}
      <circle cx="19" cy="17" r="1.5" fill="#ffee00">
        <animate attributeName="cy" values="17;3;17" dur="0.78s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0;1" dur="0.78s" repeatCount="indefinite" />
        <animate attributeName="r" values="1.5;0.2;1.5" dur="0.78s" repeatCount="indefinite" />
      </circle>
      <circle cx="29" cy="13" r="1.2" fill="#ffaa00">
        <animate attributeName="cy" values="13;0;13" dur="1.05s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0;1" dur="1.05s" repeatCount="indefinite" />
        <animate attributeName="r" values="1.2;0.2;1.2" dur="1.05s" repeatCount="indefinite" />
      </circle>
      <circle cx="24" cy="10" r="1" fill="#ffff88">
        <animate attributeName="cy" values="10;-3;10" dur="0.9s" begin="0.3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0;1" dur="0.9s" begin="0.3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/** Returns an SVG node for level-exclusive or battle-pass-exclusive custom flags, or null for emoji flags. */
function getLevelFlagNode(flagId: string, size: number): React.ReactNode | null {
  if (flagId === "gem")     return <GemFlagSVG size={size} />;
  if (flagId === "dragon")  return <DragonFlagSVG size={size} />;
  if (flagId === "crown")   return <CrownFlagSVG size={size} />;
  if (flagId === "specter") return <SpecterFlagSVG size={size} />;
  if (flagId === "blaze")   return <BlazeFlagSVG size={size} />;
  return null;
}

const FLAGS = [
  // Free
  { id: "default",   label: "Classic",   emoji: "🚩", price: 0,    levelReq: 0 },
  // Cheap (10-20)
  { id: "cat",       label: "Cat",       emoji: "🐱", price: 10,   levelReq: 0 },
  { id: "red",       label: "Red",       emoji: "🔴", price: 10,   levelReq: 0 },
  { id: "green",     label: "Green",     emoji: "🟢", price: 10,   levelReq: 0 },
  { id: "blue",      label: "Blue",      emoji: "🔵", price: 10,   levelReq: 0 },
  { id: "frog",      label: "Frog",      emoji: "🐸", price: 15,   levelReq: 0 },
  { id: "dog",       label: "Dog",       emoji: "🐶", price: 15,   levelReq: 0 },
  { id: "purple",    label: "Purple",    emoji: "🟣", price: 15,   levelReq: 0 },
  { id: "yellow",    label: "Yellow",    emoji: "🟡", price: 15,   levelReq: 0 },
  { id: "orange",    label: "Orange",    emoji: "🟠", price: 15,   levelReq: 0 },
  { id: "bunny",     label: "Bunny",     emoji: "🐰", price: 20,   levelReq: 0 },
  { id: "fox",       label: "Fox",       emoji: "🦊", price: 20,   levelReq: 0 },
  // Mid-range (30-75)
  { id: "star",      label: "Star",      emoji: "⭐", price: 30,   levelReq: 0 },
  { id: "skull",     label: "Skull",     emoji: "💀", price: 40,   levelReq: 0 },
  { id: "fire",      label: "Fire",      emoji: "🔥", price: 50,   levelReq: 0 },
  { id: "mushroom",  label: "Mushroom",  emoji: "🍄", price: 60,   levelReq: 0 },
  { id: "alien",     label: "Alien",     emoji: "👾", price: 75,   levelReq: 0 },
  { id: "rainbow",   label: "Rainbow",   emoji: "🌈", price: 100,  levelReq: 0 },
  // Premium (125-1000)
  { id: "butterfly", label: "Butterfly", emoji: "🦋", price: 125,  levelReq: 0 },
  { id: "lightning", label: "Lightning", emoji: "⚡", price: 150,  levelReq: 0 },
  { id: "unicorn",   label: "Unicorn",   emoji: "🦄", price: 200,  levelReq: 0 },
  { id: "comet",     label: "Comet",     emoji: "☄️", price: 300,  levelReq: 0 },
  { id: "crystal",   label: "Crystal",   emoji: "🔮", price: 500,  levelReq: 0 },
  { id: "explosion", label: "Explosion", emoji: "💥", price: 1000, levelReq: 0 },
  // Level-exclusive flags (not in shop, awarded automatically)
  { id: "gem",       label: "Gem",       emoji: "💎", price: 0,    levelReq: 5  },
  { id: "dragon",    label: "Dragon",    emoji: "🐉", price: 0,    levelReq: 10 },
  { id: "crown",     label: "Crown",     emoji: "👑", price: 0,    levelReq: 15 },
  // Battle Pass exclusive emoji flags (bpReq = tier needed to unlock)
  { id: "sakura",       label: "Sakura",       emoji: "🌸", price: 0, levelReq: 0, bpReq: 6  },
  { id: "paw",          label: "Paw Print",    emoji: "🐾", price: 0, levelReq: 0, bpReq: 11 },
  { id: "cyclone",      label: "Cyclone",      emoji: "🌀", price: 0, levelReq: 0, bpReq: 17 },
  { id: "swords",       label: "Swords",       emoji: "⚔️", price: 0, levelReq: 0, bpReq: 22 },
  { id: "starfall",     label: "Star Fall",    emoji: "🌠", price: 0, levelReq: 0, bpReq: 28 },
  // Battle Pass SVG flags (no emoji — rendered by getLevelFlagNode)
  { id: "specter",      label: "Specter",      emoji: "",   price: 0, levelReq: 0, bpReq: 40 },
  { id: "blaze",        label: "Blaze",        emoji: "",   price: 0, levelReq: 0, bpReq: 50 },
  // Crate-exclusive emoji flags (levelReq 99 = never shown in shop)
  { id: "crate-carrot",   label: "Carrot",    emoji: "🥕", price: 0, levelReq: 99 },
  { id: "crate-broccoli", label: "Broccoli",  emoji: "🥦", price: 0, levelReq: 99 },
  { id: "crate-wheat",    label: "Wheat",     emoji: "🌾", price: 0, levelReq: 99 },
  { id: "crate-clover",   label: "Four-Leaf", emoji: "🍀", price: 0, levelReq: 99 },
  { id: "crate-wave",     label: "Wave",      emoji: "🌊", price: 0, levelReq: 99 },
  { id: "crate-cherry",   label: "Cherry",    emoji: "🍒", price: 0, levelReq: 99 },
  { id: "crate-target",   label: "Target",    emoji: "🎯", price: 0, levelReq: 99 },
];

// ── Fish Data ─────────────────────────────────────────────────────────────────
type FishRarity = "Common" | "Rare" | "Epic" | "Legendary";
interface FishType {
  id: string; name: string; emoji: string; rarity: FishRarity;
  weight: [number, number]; description: string;
}
const FISH_TYPES: FishType[] = [
  { id: "sardine",    name: "Sardine",         emoji: "🐟", rarity: "Common",    weight: [0.05, 0.2],   description: "Tiny but plentiful." },
  { id: "carp",       name: "Carp",            emoji: "🐠", rarity: "Common",    weight: [0.5, 3],      description: "A pond classic." },
  { id: "bluegill",   name: "Bluegill",        emoji: "🐡", rarity: "Common",    weight: [0.1, 0.8],    description: "Common lake fish." },
  { id: "catfish",    name: "Catfish",         emoji: "🐟", rarity: "Common",    weight: [0.5, 5],      description: "Bottom feeder." },
  { id: "bass",       name: "Largemouth Bass", emoji: "🐠", rarity: "Rare",      weight: [0.5, 4],      description: "Fighter of the lake." },
  { id: "trout",      name: "Rainbow Trout",   emoji: "🐠", rarity: "Rare",      weight: [0.3, 3],      description: "Colorful and quick." },
  { id: "tuna",       name: "Bluefin Tuna",    emoji: "🐟", rarity: "Rare",      weight: [50, 300],     description: "Ocean powerhouse." },
  { id: "swordfish",  name: "Swordfish",       emoji: "🐡", rarity: "Epic",      weight: [40, 200],     description: "Blades through water." },
  { id: "pufferfish", name: "Pufferfish",      emoji: "🐡", rarity: "Epic",      weight: [0.3, 5],      description: "Danger in disguise." },
  { id: "shark",      name: "Great White",     emoji: "🦈", rarity: "Legendary", weight: [500, 2000],   description: "King of the ocean." },
];
function rollFish(): FishType {
  const rand = Math.random() * 100;
  let rarity: FishRarity;
  if (rand < 2) rarity = "Legendary";
  else if (rand < 10) rarity = "Epic";
  else if (rand < 35) rarity = "Rare";
  else rarity = "Common";
  const pool = FISH_TYPES.filter(f => f.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}
const FISH_RARITY_COLOR: Record<FishRarity, string> = {
  Common: "#8a9bb0", Rare: "#4d9fff", Epic: "#c084fc", Legendary: "#ffd700",
};
function formatFishWeight(fish: FishType): string {
  const w = fish.weight[0] + Math.random() * (fish.weight[1] - fish.weight[0]);
  return w >= 1 ? `${w.toFixed(1)} kg` : `${Math.round(w * 1000)} g`;
}

// ── Battle Pass Data ──────────────────────────────────────────────────────────
const BP_BXP_PER_TIER = 100;
const BP_MAX_TIER = 50;

function computeBPTier(bxp: number): number {
  return Math.min(BP_MAX_TIER, Math.floor(bxp / BP_BXP_PER_TIER));
}

function getWinBXP(time: number): number {
  if (time < 30) return 50;
  if (time < 60) return 40;
  if (time < 90) return 32;
  return 25;
}

interface BPTierData {
  tier: number;
  coins?: number;
  keys?: number;
  themeId?: string; themeLabel?: string;
  flagId?: string;  flagLabel?: string; flagEmoji?: string;
}

const BATTLE_PASS: BPTierData[] = [
  { tier: 1,  coins: 25 },
  { tier: 2  },                                                                 // empty
  { tier: 3,  coins: 35 },
  { tier: 4,  themeId: "ember",    themeLabel: "Ember" },
  { tier: 5,  coins: 35 },
  { tier: 6,  flagId: "sakura",    flagLabel: "Sakura",      flagEmoji: "🌸" },
  { tier: 7  },                                                                 // empty
  { tier: 8,  keys: 1 },
  { tier: 9,  themeId: "forest",   themeLabel: "Forest" },
  { tier: 10, coins: 50 },
  { tier: 11, flagId: "paw",       flagLabel: "Paw Print",   flagEmoji: "🐾" },
  { tier: 12 },                                                                 // empty
  { tier: 13, coins: 50 },
  { tier: 14, themeId: "sapphire", themeLabel: "Sapphire" },
  { tier: 15, coins: 55 },
  { tier: 16 },                                                                 // empty
  { tier: 17, flagId: "cyclone",   flagLabel: "Cyclone",     flagEmoji: "🌀" },
  { tier: 18, keys: 1 },
  { tier: 19, themeId: "blossom",  themeLabel: "Blossom" },
  { tier: 20, coins: 75 },
  { tier: 21 },                                                                 // empty
  { tier: 22, flagId: "swords",    flagLabel: "Swords",      flagEmoji: "⚔️" },
  { tier: 23, coins: 65 },
  { tier: 24, themeId: "dusk",     themeLabel: "Dusk" },
  { tier: 25, coins: 100 },
  { tier: 26 },                                                                 // empty
  { tier: 27, coins: 70 },
  { tier: 28, flagId: "starfall",  flagLabel: "Star Fall",   flagEmoji: "🌠" },
  { tier: 29, keys: 1 },
  { tier: 30, coins: 100 },
  { tier: 31 },                                                                 // empty
  { tier: 32, coins: 75 },
  { tier: 33 },                                                                 // empty
  { tier: 34, coins: 80 },
  { tier: 35, coins: 100 },
  { tier: 36, coins: 85 },
  { tier: 37, keys: 1 },
  { tier: 38, coins: 90 },
  { tier: 39 },                                                                 // empty
  { tier: 40, flagId: "specter",   flagLabel: "Specter" },
  { tier: 41, coins: 100 },
  { tier: 42, coins: 95 },
  { tier: 43 },                                                                 // empty
  { tier: 44, coins: 100 },
  { tier: 45, themeId: "prism",    themeLabel: "Prism" },
  { tier: 46, coins: 100 },
  { tier: 47, keys: 1 },
  { tier: 48, coins: 100 },
  { tier: 49, coins: 100 },
  { tier: 50, themeId: "nebula",   themeLabel: "Nebula",   flagId: "blaze", flagLabel: "Blaze" },
];

// ── Battle Pass Quests ────────────────────────────────────────────────────────
const BP_QUEST_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

function getBPQuestPeriod(): number {
  return Math.floor(Date.now() / BP_QUEST_PERIOD_MS);
}

function getNextBPQuestReset(): Date {
  return new Date((getBPQuestPeriod() + 1) * BP_QUEST_PERIOD_MS);
}

interface BPQuestData {
  id: string;
  title: string;
  desc: string;
  type: "wins" | "games" | "speed" | "no_flags" | "wave";
  target: number;
  bxpReward: number;
}

const BP_QUESTS: BPQuestData[] = [
  { id: "bpq_win1",    title: "First Win",        desc: "Win 1 game",                    type: "wins",     target: 1, bxpReward: 25 },
  { id: "bpq_win3",    title: "Hat Trick",         desc: "Win 3 games",                   type: "wins",     target: 3, bxpReward: 50 },
  { id: "bpq_win5",    title: "High Five",         desc: "Win 5 games",                   type: "wins",     target: 5, bxpReward: 75 },
  { id: "bpq_play3",   title: "Warm Up",           desc: "Play 3 games",                  type: "games",    target: 3, bxpReward: 30 },
  { id: "bpq_play5",   title: "Five Rounds",       desc: "Play 5 games",                  type: "games",    target: 5, bxpReward: 50 },
  { id: "bpq_speed90", title: "Quick Clear",       desc: "Win a game in under 90s",       type: "speed",    target: 90, bxpReward: 35 },
  { id: "bpq_speed60", title: "Speed Sweep",       desc: "Win a game in under 60s",       type: "speed",    target: 60, bxpReward: 55 },
  { id: "bpq_noflag",  title: "Bare Hands",        desc: "Win without placing any flags", type: "no_flags", target: 1, bxpReward: 40 },
  { id: "bpq_wave2",   title: "Wave Watcher",      desc: "Reach Wave 2 in Infinite Mode", type: "wave",     target: 2, bxpReward: 55 },
  { id: "bpq_wave3",   title: "Wave Chaser",       desc: "Reach Wave 3 in Infinite Mode", type: "wave",     target: 3, bxpReward: 80 },
];

const CONFETTI_COLORS: Record<string, string[]> = {
  dark:      ["#4caf50", "#81c784", "#ffffff", "#aaaaaa"],
  light:     ["#4caf50", "#81c784", "#888888", "#cccccc"],
  blue:      ["#4d9fff", "#1a78ff", "#b0d0ff", "#ffffff"],
  green:     ["#00e676", "#00c853", "#b9f6ca", "#69f0ae"],
  red:       ["#ff4444", "#cc0000", "#ff8888", "#ffcccc"],
  pink:      ["#ff69b4", "#ff1493", "#ffb6c1", "#ff80c0"],
  sunset:    ["#ff7a30", "#ff3060", "#a040ff", "#ffa060"],
  ocean:     ["#00c8ff", "#0080ff", "#00ffcc", "#80e0ff"],
  inferno:   ["#ff6a00", "#ff2200", "#ffcc00", "#ff8800"],
  aurora:    ["#00ffaa", "#00ccff", "#aa00ff", "#00ff66"],
  neon:      ["#ff00cc", "#00ccff", "#cc00ff", "#ff66ff"],
  deepspace: ["#c084fc", "#8040cc", "#e0b0ff", "#ffffff"],
  cyber:     ["#00ffcc", "#00e5b0", "#80fff0", "#ccffff"],
  void:      ["#9d4dfa", "#6d28d9", "#c4b5fd", "#e9d5ff"],
  galaxy:    ["#ffd700", "#a78bfa", "#ff69b4", "#ffffff"],
};

// ── Achievements ───────────────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id: "first_win",  title: "First Blood",    desc: "Win your first game",           reward: 10,  category: "Classic"   },
  { id: "wins_10",    title: "Getting Good",   desc: "Win 10 games",                  reward: 25,  category: "Classic"   },
  { id: "wins_50",    title: "Veteran",        desc: "Win 50 games",                  reward: 75,  category: "Classic"   },
  { id: "wins_100",   title: "Legend",         desc: "Win 100 games",                 reward: 200, category: "Classic"   },
  { id: "no_flags",   title: "Naked Sweep",    desc: "Win without placing any flags",  reward: 50, category: "Classic"   },
  { id: "speed_60",   title: "Speed Runner",   desc: "Win in under 60 seconds",       reward: 15,  category: "Speed"     },
  { id: "speed_30",   title: "Blazing Fast",   desc: "Win in under 30 seconds",       reward: 35,  category: "Speed"     },
  { id: "speed_15",   title: "Untouchable",    desc: "Win in under 15 seconds",       reward: 75,  category: "Speed"     },
  { id: "games_10",   title: "Newcomer",       desc: "Play 10 games",                 reward: 5,   category: "General"   },
  { id: "games_50",   title: "Dedicated",      desc: "Play 50 games",                 reward: 15,  category: "General"   },
  { id: "games_100",  title: "Obsessed",       desc: "Play 100 games",                reward: 30,  category: "General"   },
  { id: "wave_5",     title: "Wave Surfer",    desc: "Reach Wave 5 in Infinite Mode",  reward: 15, category: "Infinite"  },
  { id: "wave_10",    title: "Wave Master",    desc: "Reach Wave 10 in Infinite Mode", reward: 35, category: "Infinite"  },
  { id: "wave_25",    title: "Endless",        desc: "Reach Wave 25 in Infinite Mode", reward: 100, category: "Infinite" },
  { id: "wave_50",    title: "Unstoppable",    desc: "Reach Wave 50 in Infinite Mode", reward: 250, category: "Infinite" },
  { id: "flags_5",    title: "Flag Collector", desc: "Own 5 different flags",          reward: 20, category: "Collector" },
  { id: "flags_all",  title: "Flag Master",    desc: "Own all purchasable flags",      reward: 100, category: "Collector"},
  { id: "themes_all", title: "Art Director",   desc: "Own all purchasable themes",     reward: 75, category: "Collector" },
];

// ── Daily Challenges ───────────────────────────────────────────────────────────
const DAILY_CHALLENGE_POOL = [
  { id: "dc_win1",    title: "First Win",       desc: "Win 1 game",               type: "wins",     target: 1  },
  { id: "dc_win2",    title: "Double Down",     desc: "Win 2 games",              type: "wins",     target: 2  },
  { id: "dc_win3",    title: "Hat Trick",       desc: "Win 3 games",              type: "wins",     target: 3  },
  { id: "dc_play5",   title: "Practice Run",    desc: "Play 5 games",             type: "games",    target: 5  },
  { id: "dc_play10",  title: "Marathon",        desc: "Play 10 games",            type: "games",    target: 10 },
  { id: "dc_speed60", title: "Speed Run",       desc: "Win in under 60 seconds",  type: "speed",    target: 60 },
  { id: "dc_speed45", title: "Lightning Fast",  desc: "Win in under 45 seconds",  type: "speed",    target: 45 },
  { id: "dc_noflag",  title: "Bare Knuckle",    desc: "Win without placing flags", type: "no_flags", target: 1  },
  { id: "dc_wave3",   title: "Wave Rider",      desc: "Reach Wave 3 in Infinite", type: "wave",     target: 3  },
  { id: "dc_wave5",   title: "Surfer",          desc: "Reach Wave 5 in Infinite", type: "wave",     target: 5  },
];

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getDailyChallenges() {
  const key = getTodayKey();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const indices: number[] = [];
  let seed = hash;
  while (indices.length < 3) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const idx = seed % DAILY_CHALLENGE_POOL.length;
    if (!indices.includes(idx)) indices.push(idx);
  }
  return indices.map(i => DAILY_CHALLENGE_POOL[i]);
}

// ── Galaxy background ─────────────────────────────────────────────────────────
function _lcg(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}
function _genStarShadow(count: number, seed: number, ri = 255, gi = 255, bi = 255): string {
  const r = _lcg(seed);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = ((r() * 440) | 0) - 20;
    const y = ((r() * 900) | 0) - 50;
    const a = (0.25 + r() * 0.75).toFixed(2);
    out.push(`${x}px ${y}px rgba(${ri},${gi},${bi},${a})`);
  }
  return out.join(",");
}
const GX_SM = _genStarShadow(220, 0xdeadbeef);
const GX_MD = _genStarShadow(80,  0x12345678);
const GX_LG = _genStarShadow(28,  0xabcdef01);
// Splash screen particles
const SP_STARS_SM = _genStarShadow(220, 0xfeedbeef);
const SP_STARS_MD = _genStarShadow(70,  0x0badf00d);
const SP_STARS_LG = _genStarShadow(22,  0x1337c0de, 0, 255, 204);
// Cyber particles — teal/cyan
const CY_PART_SM = _genStarShadow(160, 0xc0debabe, 0,   255, 204);
const CY_PART_LG = _genStarShadow(25,  0xfadedead, 140, 255, 230);
// Void particles — violet/purple
const VD_PART_SM = _genStarShadow(180, 0xdeadface, 157, 77,  250);
const VD_PART_LG = _genStarShadow(30,  0xcafebabe, 210, 150, 255);

function GalaxyBackground() {
  return (
    <div className="galaxy-backdrop" aria-hidden="true">
      <div className="gx-stars gx-sm" style={{ boxShadow: GX_SM }} />
      <div className="gx-stars gx-md" style={{ boxShadow: GX_MD }} />
      <div className="gx-stars gx-lg" style={{ boxShadow: GX_LG }} />
      <div className="gx-nebula" />
      <div className="gx-core" />
      <div className="gx-arm gx-arm-1" />
      <div className="gx-arm gx-arm-2" />
      <div className="gx-arm gx-arm-3" />
    </div>
  );
}

function CyberBackground() {
  return (
    <div className="cyber-backdrop" aria-hidden="true">
      <div className="cy-grid" />
      <div className="cy-horizon" />
      <div className="cy-scan" />
      <div className="cy-scan cy-scan-2" />
      <div className="cy-glow cy-glow-1" />
      <div className="cy-glow cy-glow-2" />
      <div className="cy-hline cy-hline-1" />
      <div className="cy-hline cy-hline-2" />
      <div className="cy-hline cy-hline-3" />
      <div className="cy-particles" style={{ boxShadow: CY_PART_SM }} />
      <div className="cy-particles cy-particles-lg" style={{ boxShadow: CY_PART_LG }} />
    </div>
  );
}

function VoidBackground() {
  return (
    <div className="void-backdrop" aria-hidden="true">
      <div className="vd-swirl vd-swirl-1" />
      <div className="vd-swirl vd-swirl-2" />
      <div className="vd-swirl vd-swirl-3" />
      <div className="vd-ring vd-ring-1" />
      <div className="vd-ring vd-ring-2" />
      <div className="vd-ring vd-ring-3" />
      <div className="vd-rift" />
      <div className="vd-core" />
      <div className="vd-particles" style={{ boxShadow: VD_PART_SM }} />
      <div className="vd-particles vd-particles-lg" style={{ boxShadow: VD_PART_LG }} />
    </div>
  );
}

// ── Splash screen ─────────────────────────────────────────────────────────────
function SplashScreen({ onPlay }: { onPlay: () => void }) {
  const [fading, setFading] = useState(false);
  function handlePlay() {
    setFading(true);
    setTimeout(onPlay, 900);
  }
  return (
    <div className={`splash-screen${fading ? " splash-fading" : ""}`}>
      <div className="sp-bg" aria-hidden="true">
        <div className="sp-stars sp-stars-sm" style={{ boxShadow: SP_STARS_SM }} />
        <div className="sp-stars sp-stars-md" style={{ boxShadow: SP_STARS_MD }} />
        <div className="sp-stars sp-stars-lg" style={{ boxShadow: SP_STARS_LG }} />
        <div className="sp-grid" />
        <div className="sp-radar" />
        <div className="sp-ring sp-ring-1" />
        <div className="sp-ring sp-ring-2" />
        <div className="sp-ring sp-ring-3" />
        <div className="sp-scan" />
        <div className="sp-glow-teal" />
        <div className="sp-glow-violet" />
      </div>
      <div className="sp-content">
        <div className="sp-mine-icon">💣</div>
        <h1 className="sp-title">
          <span className="sp-title-sub">Nibble's</span>
          <span className="sp-title-main">Minesweeper</span>
        </h1>
        <button className="sp-play-btn" onClick={handlePlay}>PLAY</button>
        <p className="sp-credits">credits to mibble</p>
      </div>
    </div>
  );
}

// ── Stockholm countdown ───────────────────────────────────────────────────────
function getSecsUntilStockholmMidnight(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Stockholm",
    hour: "numeric", minute: "numeric", second: "numeric", hour12: false,
  }).formatToParts(now);
  const h = parseInt(parts.find(p => p.type === "hour")?.value   ?? "0");
  const m = parseInt(parts.find(p => p.type === "minute")?.value ?? "0");
  const s = parseInt(parts.find(p => p.type === "second")?.value ?? "0");
  const elapsed = (h === 24 ? 0 : h) * 3600 + m * 60 + s;
  return 86400 - elapsed;
}
function fmtCountdown(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type CellState = { mine: boolean; revealed: boolean; flagged: boolean; adjacent: number };
type GameStatus = "idle" | "playing" | "won" | "lost" | "transitioning";
interface ToastItem {
  key: number;
  type: "achievement" | "levelup" | "daily" | "keydrop" | "battlepass";
  title: string;
  subtitle?: string;
  reward?: number;
  coins?: number;
}

// ── Pure helpers ──────────────────────────────────────────────────────────────
function createEmptyBoard(): CellState[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  );
}

function buildBoard(board: CellState[][], safeRow: number, safeCol: number): CellState[][] {
  const next = board.map((r) => r.map((c) => ({ ...c })));
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!next[r][c].mine && !(Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1)) {
      next[r][c].mine = true;
      placed++;
    }
  }
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (next[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && next[nr][nc].mine) count++;
        }
      next[r][c].adjacent = count;
    }
  return next;
}

function floodReveal(board: CellState[][], startRow: number, startCol: number): CellState[][] {
  const next = board.map((r) => r.map((c) => ({ ...c })));
  const queue: [number, number][] = [[startRow, startCol]];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
    if (next[r][c].flagged || next[r][c].revealed || next[r][c].mine) continue;
    next[r][c].revealed = true;
    if (next[r][c].adjacent === 0)
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          queue.push([r + dr, c + dc]);
        }
  }
  return next;
}

function isSolvable(board: CellState[][], startRow: number, startCol: number): boolean {
  let current = floodReveal(board, startRow, startCol);
  let progress = true;
  while (progress) {
    progress = false;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const cell = current[r][c];
        if (!cell.revealed || cell.mine || cell.adjacent === 0) continue;
        const unrevealed: [number, number][] = [];
        let flagged = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
            const n = current[nr][nc];
            if (n.flagged) flagged++;
            else if (!n.revealed) unrevealed.push([nr, nc]);
          }
        const remaining = cell.adjacent - flagged;
        if (remaining === unrevealed.length && unrevealed.length > 0) {
          const next = current.map((row) => row.map((cell) => ({ ...cell })));
          for (const [nr, nc] of unrevealed) next[nr][nc].flagged = true;
          current = next;
          progress = true;
        } else if (remaining === 0 && unrevealed.length > 0) {
          let next = current.map((row) => row.map((cell) => ({ ...cell })));
          for (const [nr, nc] of unrevealed) next = floodReveal(next, nr, nc);
          current = next;
          progress = true;
        }
      }
  }
  return checkWin(current);
}

function placeMines(board: CellState[][], safeRow: number, safeCol: number): CellState[][] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const candidate = buildBoard(board, safeRow, safeCol);
    if (isSolvable(candidate, safeRow, safeCol)) return candidate;
  }
  return buildBoard(board, safeRow, safeCol);
}

function checkWin(board: CellState[][]): boolean {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (!board[r][c].mine && !board[r][c].revealed) return false;
  return true;
}

function fmtTime(s: number | null): string {
  if (s === null) return "—";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ── CoinIcon ──────────────────────────────────────────────────────────────────
function CoinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6.5" fill="#c89a1a" stroke="#ffd700" strokeWidth="1"/>
      <text x="7" y="10.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffd700" fontFamily="Arial, sans-serif">C</text>
    </svg>
  );
}

// ── XP Bar ────────────────────────────────────────────────────────────────────
function XPBar({ totalXP }: { totalXP: number }) {
  const level = computeLevel(totalXP);
  const isMax = level >= MAX_LEVEL;
  const xpAtLevel = XP_THRESHOLDS[level];
  const xpToNext = isMax ? 1 : XP_THRESHOLDS[level + 1] - xpAtLevel;
  const xpInLevel = isMax ? xpToNext : totalXP - xpAtLevel;
  const pct = Math.min(100, (xpInLevel / xpToNext) * 100);

  return (
    <div className="xp-bar-wrap">
      <span className="xp-lvl-label">
        LVL <strong className="xp-lvl-num">{level}</strong>
      </span>
      <div className="xp-track">
        <div className="xp-fill" style={{ width: `${pct}%` }} />
      </div>
      {isMax
        ? <span className="xp-right xp-max">MAX</span>
        : <span className="xp-right">{xpInLevel}<span className="xp-sep">/</span>{xpToNext}</span>
      }
    </div>
  );
}

// ── Toast stack ───────────────────────────────────────────────────────────────
function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.key} className={`achievement-toast toast-${t.type}`}>
          <div className="toast-icon">
            {t.type === "achievement" ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9.5" fill="#2d1a4a" stroke="#a78bfa" strokeWidth="1.5"/>
                <text x="10" y="14.5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#a78bfa" fontFamily="Arial, sans-serif">★</text>
              </svg>
            ) : t.type === "daily" ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9.5" fill="#0a2010" stroke="#00e676" strokeWidth="1.5"/>
                <text x="10" y="14.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#00e676" fontFamily="Arial, sans-serif">✓</text>
              </svg>
            ) : t.type === "keydrop" ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9.5" fill="#1a1400" stroke="#ffd700" strokeWidth="1.5"/>
                <text x="10" y="14.5" textAnchor="middle" fontSize="11" fill="#ffd700" fontFamily="Arial, sans-serif">🗝</text>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9.5" fill="#2a1a00" stroke="#ffd700" strokeWidth="1.5"/>
                <text x="10" y="14.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ffd700" fontFamily="Arial, sans-serif">▲</text>
              </svg>
            )}
          </div>
          <div className="toast-body">
            <span className="toast-label">
              {t.type === "achievement" ? "Achievement Unlocked" : t.type === "daily" ? "Daily Challenge" : t.type === "keydrop" ? "Item Found!" : "Level Up!"}
            </span>
            <span className="toast-title">{t.title}</span>
            {t.subtitle && <span className="toast-subtitle">{t.subtitle}</span>}
          </div>
          {(t.type === "achievement" || t.type === "daily") && t.reward !== undefined && (
            <span className="toast-reward"><CoinIcon size={13} />+{t.reward}</span>
          )}
          {t.type === "levelup" && t.coins !== undefined && (
            <span className="toast-reward toast-lvl-coins"><CoinIcon size={13} />+{t.coins}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── BoardGrid ─────────────────────────────────────────────────────────────────
function BoardGrid({ board, flagContent, onCellClick, onCellContext, interactive }: {
  board: CellState[][]; flagContent: React.ReactNode;
  onCellClick?: (r: number, c: number) => void;
  onCellContext?: (e: React.MouseEvent, r: number, c: number) => void;
  interactive: boolean;
}) {
  return (
    <div className="board" style={{ pointerEvents: interactive ? "auto" : "none" }}>
      {board.map((row, r) =>
        row.map((cell, c) => {
          let content: React.ReactNode = null;
          let cellClass = "cell";
          if (cell.revealed) {
            cellClass += " revealed";
            if (cell.mine) { content = <span className="mine-marker">✕</span>; cellClass += " mine"; }
            else if (cell.adjacent > 0) content = <span className={`number n${cell.adjacent}`}>{cell.adjacent}</span>;
          } else if (cell.flagged) {
            cellClass += " flagged";
            content = <span className="flag-emoji">{flagContent}</span>;
          }
          return (
            <div key={`${r}-${c}`} className={cellClass}
              onClick={() => onCellClick?.(r, c)}
              onContextMenu={(e) => onCellContext?.(e, r, c)}>
              {content}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Daily Challenges Modal ────────────────────────────────────────────────────
function DailyChallengesModal({ open, onClose, onViewed, challenges, progress, completed, bonusClaimed }: {
  open: boolean; onClose: () => void; onViewed: () => void;
  challenges: typeof DAILY_CHALLENGE_POOL;
  progress: Record<string, number>;
  completed: string[];
  bonusClaimed: boolean;
}) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!open) return;
    onViewed();
    setCountdown(getSecsUntilStockholmMidnight());
    const id = setInterval(() => setCountdown(getSecsUntilStockholmMidnight()), 1000);
    return () => clearInterval(id);
  }, [open, onViewed]);

  if (!open) return null;
  const allDone = challenges.every(c => completed.includes(c.id));
  const completedCount = challenges.filter(c => completed.includes(c.id)).length;

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="menu-handle" />
        <div className="shop-header">
          <span className="shop-title">DAILY CHALLENGES</span>
          <span className="daily-date-badge">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>

        {/* All-complete bonus */}
        <div className={`daily-bonus-card${allDone ? " daily-bonus-done" : ""}`}>
          <div className="daily-bonus-left">
            <span className="daily-bonus-label">COMPLETE ALL</span>
            <div className="daily-bonus-rewards">
              <span className="daily-bonus-coin"><CoinIcon size={13} /> +25</span>
              <span className="daily-bonus-xp">+20 XP</span>
            </div>
          </div>
          <div className="daily-bonus-right">
            <div className="daily-progress-dots">
              {challenges.map((c) => (
                <div key={c.id} className={`daily-dot${completed.includes(c.id) ? " daily-dot-done" : ""}`} />
              ))}
            </div>
            {allDone
              ? <span className="daily-bonus-status">{bonusClaimed ? "Claimed ✓" : "Bonus earned!"}</span>
              : <span className="daily-bonus-status">{completedCount}/{challenges.length}</span>
            }
          </div>
        </div>

        <div className="daily-list">
          {challenges.map((c) => {
            const prog = progress[c.id] ?? 0;
            const isDone = completed.includes(c.id);
            const pct = Math.min(100, (prog / c.target) * 100);
            return (
              <div key={c.id} className={`daily-row${isDone ? " daily-row-done" : ""}`}>
                <div className="daily-check">
                  {isDone
                    ? <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <circle cx="11" cy="11" r="10.5" fill="#0a2a0a" stroke="#4caf50" strokeWidth="1.5"/>
                        <polyline points="6,11 9.5,14.5 16,8" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    : <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <circle cx="11" cy="11" r="10.5" fill="var(--tab-bg)" stroke="var(--tab-border)" strokeWidth="1.5"/>
                        <text x="11" y="15" textAnchor="middle" fontSize="11" fill="var(--stat-label-color)" fontFamily="Arial, sans-serif">○</text>
                      </svg>
                  }
                </div>
                <div className="daily-info">
                  <span className="daily-title">{c.title}</span>
                  <span className="daily-desc">{c.desc}</span>
                  {!isDone && (
                    <div className="daily-prog-bar">
                      <div className="daily-prog-fill" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                <div className="daily-meta">
                  {isDone
                    ? <span className="daily-done">Done</span>
                    : <span className="daily-count">{prog}/{c.target}</span>
                  }
                </div>
              </div>
            );
          })}
        </div>

        <div className="daily-reset-note">
          Resets in <span className="daily-countdown">{fmtCountdown(countdown)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Levels Modal ──────────────────────────────────────────────────────────────
function LevelsModal({ open, onClose, totalXP }: {
  open: boolean; onClose: () => void; totalXP: number;
}) {
  if (!open) return null;
  const currentLevel = computeLevel(totalXP);

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="menu-handle" />
        <div className="shop-header">
          <span className="shop-title">LEVELS</span>
          <span className="lvl-modal-current">
            <span className="lvl-modal-lbl">CURRENT</span>
            <span className="lvl-modal-num">{currentLevel === MAX_LEVEL ? "MAX" : currentLevel}</span>
          </span>
        </div>

        <div className="lvl-modal-xpbar">
          <XPBar totalXP={totalXP} />
        </div>

        <div className="lvl-list">
          {Array.from({ length: MAX_LEVEL }, (_, i) => {
            const lvl = i + 1;
            const reward = LEVEL_REWARDS.find(r => r.level === lvl)!;
            const unlocked = currentLevel >= lvl;
            const isCurrent = currentLevel === lvl - 1;
            const isMaxReached = currentLevel === MAX_LEVEL;
            const xpNeeded = XP_THRESHOLDS[lvl];
            const isMilestone = lvl % 5 === 0;

            return (
              <div
                key={lvl}
                className={[
                  "lvl-row",
                  unlocked ? "lvl-unlocked" : "",
                  isCurrent && !isMaxReached ? "lvl-current" : "",
                  isMilestone ? "lvl-milestone" : "",
                ].join(" ")}
              >
                <div className={`lvl-badge${isMilestone ? " lvl-badge-milestone" : ""}`}>
                  <span className="lvl-badge-num">{lvl}</span>
                  {lvl === MAX_LEVEL && <span className="lvl-badge-max-dot" />}
                </div>

                <div className="lvl-rewards">
                  <div className="lvl-reward-row">
                    <CoinIcon size={12} />
                    <span className="lvl-reward-text">+{reward.coins} coins</span>
                  </div>
                  {reward.flag && (
                    <div className="lvl-reward-row lvl-exclusive">
                      <span className="lvl-reward-emoji" style={{ display: "flex", alignItems: "center" }}>
                        {getLevelFlagNode(reward.flag, 18) ?? reward.flagEmoji}
                      </span>
                      <span className="lvl-reward-text">{reward.flagLabel} flag</span>
                      <span className="lvl-excl-badge">exclusive</span>
                    </div>
                  )}
                  {reward.theme && (
                    <div className="lvl-reward-row lvl-exclusive">
                      <span className="lvl-theme-dot" style={{
                        background: lvl === 5 ? "#00ffcc" : lvl === 10 ? "#9d4dfa" : "#ffd700"
                      }} />
                      <span className="lvl-reward-text">{reward.themeLabel} theme</span>
                      <span className="lvl-excl-badge">exclusive</span>
                    </div>
                  )}
                </div>

                <div className="lvl-meta">
                  <span className="lvl-xp-req">{xpNeeded >= 1000 ? `${(xpNeeded/1000).toFixed(1)}k` : xpNeeded} XP</span>
                  {unlocked
                    ? <span className="lvl-status-done">✓</span>
                    : isCurrent && !isMaxReached
                      ? <span className="lvl-status-next">NEXT</span>
                      : <span className="lvl-status-lock">—</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Achievements Modal ─────────────────────────────────────────────────────────
function AchievementsModal({ open, onClose, claimed, pending, onClaim }: {
  open: boolean; onClose: () => void;
  claimed: string[]; pending: string[]; onClaim: (id: string) => void;
}) {
  const [tab, setTab] = useState<"Classic" | "Speed" | "Infinite" | "General" | "Collector">("Classic");
  if (!open) return null;
  const categories = ["Classic", "Speed", "Infinite", "General", "Collector"] as const;
  const filtered = ACHIEVEMENTS.filter((a) => a.category === tab);

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="menu-handle" />
        <div className="shop-header">
          <span className="shop-title">ACHIEVEMENTS</span>
          {pending.length > 0 && <span className="ach-claim-badge">{pending.length} to claim</span>}
        </div>
        <div className="ach-cat-tabs">
          {categories.map((cat) => {
            const catPending = ACHIEVEMENTS.filter(a => a.category === cat && pending.includes(a.id)).length;
            return (
              <button key={cat} className={`ach-cat-tab${tab === cat ? " active" : ""}`} onClick={() => setTab(cat)}>
                {cat}{catPending > 0 && <span className="ach-cat-dot" />}
              </button>
            );
          })}
        </div>
        <div className="ach-list">
          {filtered.map((a) => {
            const isClaimed = claimed.includes(a.id);
            const isPending = pending.includes(a.id);
            return (
              <div key={a.id} className={`ach-row${isClaimed ? " ach-claimed" : ""}${isPending ? " ach-pending" : ""}`}>
                <div className="ach-icon-wrap">
                  {isClaimed ? (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <circle cx="11" cy="11" r="10.5" fill="#1a3a1a" stroke="#4caf50" strokeWidth="1.5"/>
                      <polyline points="6,11 9.5,14.5 16,8" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : isPending ? (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <circle cx="11" cy="11" r="10.5" fill="#2d1a4a" stroke="#a78bfa" strokeWidth="1.5"/>
                      <text x="11" y="15" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#a78bfa" fontFamily="Arial, sans-serif">★</text>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <circle cx="11" cy="11" r="10.5" fill="var(--tab-bg)" stroke="var(--tab-border)" strokeWidth="1.5"/>
                      <text x="11" y="15" textAnchor="middle" fontSize="12" fill="var(--stat-label-color)" fontFamily="Arial, sans-serif">★</text>
                    </svg>
                  )}
                </div>
                <div className="ach-info">
                  <span className="ach-title">{a.title}</span>
                  <span className="ach-desc">{a.desc}</span>
                </div>
                <div className="ach-right">
                  {isClaimed ? <span className="ach-done">Claimed</span>
                    : isPending ? (
                      <button className="ach-claim-btn" onClick={() => onClaim(a.id)}>
                        <CoinIcon size={12} />&nbsp;+{a.reward}
                      </button>
                    ) : <span className="ach-reward-label"><CoinIcon size={11} />&nbsp;{a.reward}</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Battle Pass Modal ─────────────────────────────────────────────────────────

function BPThemeSwatch({ themeId }: { themeId: string }) {
  const t = THEMES.find(th => th.id === themeId);
  if (!t) return null;
  return (
    <div className="bp-theme-swatch" style={{ background: t.cell }}>
      <div className="bp-theme-swatch-dot" style={{ background: t.accent }} />
    </div>
  );
}

function BPRewardPreview({ reward }: { reward: BPTierData }) {
  const isEmpty = reward.coins == null && !reward.flagId && !reward.themeId && !reward.keys;
  return (
    <div className="bp-reward-wrap">
      {isEmpty && (
        <div className="bp-reward-item bp-ri-empty">
          <span>—</span>
        </div>
      )}
      {reward.coins != null && (
        <div className="bp-reward-item bp-ri-coins">
          <CoinIcon size={13} />
          <span>+{reward.coins} coins</span>
        </div>
      )}
      {reward.keys != null && (
        <div className="bp-reward-item bp-ri-key">
          <span style={{ fontSize: 14, lineHeight: 1 }}>🗝️</span>
          <span>×{reward.keys} Crate Key</span>
        </div>
      )}
      {reward.flagId && !reward.flagEmoji && (
        <div className="bp-reward-item">
          <span style={{ display: "flex", alignItems: "center" }}>
            {getLevelFlagNode(reward.flagId, 18)}
          </span>
          <span>{reward.flagLabel} Flag</span>
          {reward.tier === 40 && <span className="bp-excl-badge">CUSTOM</span>}
          {reward.tier === 50 && <span className="bp-excl-badge">ANIMATED</span>}
        </div>
      )}
      {reward.flagId && reward.flagEmoji && (
        <div className="bp-reward-item">
          <span style={{ fontSize: 15, lineHeight: 1 }}>{reward.flagEmoji}</span>
          <span>{reward.flagLabel} Flag</span>
        </div>
      )}
      {reward.themeId && (
        <div className="bp-reward-item">
          <BPThemeSwatch themeId={reward.themeId} />
          <span>{reward.themeLabel} Theme</span>
          {reward.tier === 45 && <span className="bp-excl-badge">SPECIAL</span>}
          {(reward.tier === 50 && reward.themeId) && <span className="bp-excl-badge">ANIMATED</span>}
        </div>
      )}
    </div>
  );
}

function BPQuestsPanel({ bpQuestProgress, bpQuestCompleted, onClaimQuest, resetAt }: {
  bpQuestProgress: Record<string, number>;
  bpQuestCompleted: string[];
  onClaimQuest: (id: string) => void;
  resetAt: Date;
}) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const ms = resetAt.getTime() - Date.now();
      if (ms <= 0) { setTimeLeft("Resetting…"); return; }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1_000);
      setTimeLeft(`${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [resetAt]);

  return (
    <div className="bp-quest-list">
      <div className="bp-quest-reset-bar">
        <span className="bp-quest-reset-label">🔄 Resets in</span>
        <span className="bp-quest-reset-timer">{timeLeft}</span>
      </div>
      {BP_QUESTS.map(q => {
        const prog = bpQuestProgress[q.id] ?? 0;
        const isDone = bpQuestCompleted.includes(q.id);
        const pct = Math.min(100, (prog / q.target) * 100);
        return (
          <div key={q.id} className={`bp-quest-row${isDone ? " bp-quest-done" : ""}`}>
            <div className="bp-quest-info">
              <span className="bp-quest-title">{q.title}</span>
              <span className="bp-quest-desc">{q.desc}</span>
              {!isDone && (
                <div className="bp-quest-bar">
                  <div className="bp-quest-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
            <div className="bp-quest-right">
              <span className="bp-quest-reward">+{q.bxpReward} BXP</span>
              {isDone ? (
                <span className="bp-quest-claimed">✓</span>
              ) : prog >= q.target ? (
                <button className="bp-claim-btn" onClick={() => onClaimQuest(q.id)}>CLAIM</button>
              ) : (
                <span className="bp-quest-prog">{prog}/{q.target}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BattlePassModal({ open, onClose, totalBXP, bpClaimed, onClaim, bpQuestProgress, bpQuestCompleted, onClaimQuest, questResetAt }: {
  open: boolean; onClose: () => void;
  totalBXP: number; bpClaimed: number[];
  onClaim: (tier: number) => void;
  bpQuestProgress: Record<string, number>;
  bpQuestCompleted: string[];
  onClaimQuest: (id: string) => void;
  questResetAt: Date;
}) {
  const [tab, setTab] = useState<"rewards" | "quests">("rewards");
  const bpTier = computeBPTier(totalBXP);
  const bxpInTier = bpTier >= BP_MAX_TIER ? BP_BXP_PER_TIER : totalBXP % BP_BXP_PER_TIER;
  const pct = bpTier >= BP_MAX_TIER ? 100 : (bxpInTier / BP_BXP_PER_TIER) * 100;

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || tab !== "tiers") return;
    const idx = Math.max(0, bpTier - 1);
    const rows = listRef.current?.querySelectorAll(".bp-tier-row");
    if (rows && rows[idx]) {
      setTimeout(() => (rows[idx] as HTMLElement).scrollIntoView({ block: "center", behavior: "smooth" }), 100);
    }
  }, [open, bpTier, tab]);

  useEffect(() => { if (open) setTab("rewards"); }, [open]);

  if (!open) return null;

  const questsPendingClaim = BP_QUESTS.filter(q =>
    !bpQuestCompleted.includes(q.id) && (bpQuestProgress[q.id] ?? 0) >= q.target
  ).length;

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet bp-sheet" onClick={e => e.stopPropagation()}>
        <div className="menu-handle" />
        <div className="shop-header">
          <span className="shop-title">BATTLE PASS</span>
          <span className="bp-header-tier">
            <span className="bp-htier-label">TIER</span>
            <span className="bp-htier-num">{bpTier >= BP_MAX_TIER ? "MAX" : bpTier}</span>
            <span className="bp-htier-of">/ {BP_MAX_TIER}</span>
          </span>
        </div>
        <div className="bp-progress-wrap">
          <div className="bp-progress-track">
            <div className="bp-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="bp-progress-label">
            {bpTier >= BP_MAX_TIER
              ? "COMPLETE ✦ All rewards unlocked"
              : `${bxpInTier} / ${BP_BXP_PER_TIER} BXP → Tier ${bpTier + 1}`}
          </span>
        </div>
        {/* Tabs */}
        <div className="bp-tabs">
          <button className={`bp-tab${tab === "rewards" ? " active" : ""}`} onClick={() => setTab("rewards")}>REWARDS</button>
          <button className={`bp-tab${tab === "quests" ? " active" : ""}`} onClick={() => setTab("quests")}>
            QUESTS{questsPendingClaim > 0 && <span className="bp-tab-dot" />}
          </button>
        </div>

        {tab === "rewards" && (
          <div className="bp-tier-list" ref={listRef}>
            {BATTLE_PASS.map(reward => {
              const earned = bpTier >= reward.tier;
              const claimed = bpClaimed.includes(reward.tier);
              const claimable = earned && !claimed;
              const isEmpty = reward.coins == null && !reward.flagId && !reward.themeId && !reward.keys;
              const isMilestone = reward.tier % 10 === 0 || reward.tier === 45;
              const isGrand = reward.tier === 50;
              const isCurrent = bpTier === reward.tier - 1;
              return (
                <div
                  key={reward.tier}
                  className={[
                    "bp-tier-row",
                    earned      ? "bp-earned"        : "",
                    claimed     ? "bp-claimed"        : "",
                    isMilestone ? "bp-milestone-row"  : "",
                    isGrand     ? "bp-grand-row"      : "",
                    isCurrent   ? "bp-current-row"    : "",
                    isEmpty     ? "bp-empty-row"      : "",
                  ].filter(Boolean).join(" ")}
                >
                  <div className={[
                    "bp-tier-num-badge",
                    isMilestone ? "bp-num-milestone" : "",
                    isGrand     ? "bp-num-grand"     : "",
                  ].filter(Boolean).join(" ")}>
                    {reward.tier}
                  </div>
                  <BPRewardPreview reward={reward} />
                  <div className="bp-status-col">
                    {isEmpty ? (
                      <span className="bp-status-lock" style={{ opacity: 0.3 }}>—</span>
                    ) : claimed ? (
                      <span className="bp-status-check">✓</span>
                    ) : claimable ? (
                      <button className="bp-claim-btn" onClick={() => onClaim(reward.tier)}>CLAIM</button>
                    ) : (
                      <span className="bp-status-lock">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "quests" && (
          <BPQuestsPanel
            bpQuestProgress={bpQuestProgress}
            bpQuestCompleted={bpQuestCompleted}
            onClaimQuest={onClaimQuest}
            resetAt={questResetAt}
          />
        )}
      </div>
    </div>
  );
}

// ── MenuPanel ─────────────────────────────────────────────────────────────────
function MenuPanel({ open, onClose, stats, playerName, onSaveName, infiniteMode, onToggleInfinite,
  bestInfinite, coins, onOpenShop, onOpenInventory, onOpenAchievements, onOpenLevels, onOpenDaily,
  onOpenBattlePass, bpUnclaimedCount,
  pendingCount, currentLevel, totalXP, dailyIncomplete, onOpenFishing }: {
  open: boolean; onClose: () => void;
  stats: { wins: number; games: number; best: number | null };
  playerName: string; onSaveName: (name: string) => void;
  infiniteMode: boolean; onToggleInfinite: () => void; bestInfinite: number;
  coins: number; onOpenShop: () => void; onOpenInventory: () => void;
  onOpenAchievements: () => void; onOpenLevels: () => void; onOpenDaily: () => void;
  onOpenBattlePass: () => void; bpUnclaimedCount: number;
  pendingCount: number; currentLevel: number; totalXP: number;
  dailyIncomplete: boolean; onOpenFishing: () => void;
}) {
  const [nameInput, setNameInput] = useState(playerName);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setNameInput(playerName); }, [open, playerName]);
  const winRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;
  if (!open) return null;

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="menu-handle" />

        <div className="menu-actions">
          <button className="menu-action-btn" onClick={() => { onClose(); onOpenShop(); }}>
            <span className="menu-action-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 2h2l1.5 7.5h8l1.5-5H5.5"/><circle cx="8" cy="15" r="1"/><circle cx="13" cy="15" r="1"/>
              </svg>
            </span>
            <span className="menu-action-label">SHOP</span>
            <span className="menu-action-coins"><CoinIcon size={13} /><span>{coins}</span></span>
            <span className="menu-action-arrow">›</span>
          </button>
          <button className="menu-action-btn" onClick={() => { onClose(); onOpenInventory(); }}>
            <span className="menu-action-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="14" height="10" rx="2"/><path d="M6 6V4a3 3 0 0 1 6 0v2"/>
                <line x1="9" y1="10" x2="9" y2="13"/><line x1="7.5" y1="11.5" x2="10.5" y2="11.5"/>
              </svg>
            </span>
            <span className="menu-action-label">INVENTORY</span>
            <span className="menu-action-arrow">›</span>
          </button>
          <button className="menu-action-btn" onClick={() => { onClose(); onOpenDaily(); }}>
            <span className="menu-action-icon" style={{ color: "#00e676" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="14" height="13" rx="2"/>
                <line x1="6" y1="1" x2="6" y2="5"/><line x1="12" y1="1" x2="12" y2="5"/>
                <line x1="2" y1="8" x2="16" y2="8"/>
                <line x1="6" y1="11" x2="8" y2="13"/><line x1="8" y1="13" x2="12" y2="10"/>
              </svg>
            </span>
            <span className="menu-action-label" style={{ color: dailyIncomplete ? "#00e676" : undefined }}>DAILY</span>
            {dailyIncomplete && <span className="menu-action-badge" style={{ background: "#00e676" }}>!</span>}
            <span className="menu-action-arrow">›</span>
          </button>
          <button className="menu-action-btn" onClick={() => { onClose(); onOpenAchievements(); }}>
            <span className="menu-action-icon" style={{ color: "#a78bfa" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="9,2 11.3,7 17,7.6 12.9,11.5 14,17 9,14.3 4,17 5.1,11.5 1,7.6 6.7,7"/>
              </svg>
            </span>
            <span className="menu-action-label" style={{ color: pendingCount > 0 ? "#a78bfa" : undefined }}>ACHIEVEMENTS</span>
            {pendingCount > 0 && <span className="menu-action-badge">{pendingCount}</span>}
            <span className="menu-action-arrow">›</span>
          </button>
          <button className="menu-action-btn" onClick={() => { onClose(); onOpenLevels(); }}>
            <span className="menu-action-icon" style={{ color: "#ffd700" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2L11 7H16.5L12.1 10.3L13.8 16L9 12.7L4.2 16L5.9 10.3L1.5 7H7L9 2Z"/>
              </svg>
            </span>
            <span className="menu-action-label" style={{ color: "#ffd700" }}>LEVELS</span>
            <span className="menu-action-coins" style={{ color: currentLevel >= MAX_LEVEL ? "#ffd700" : "var(--stat-label-color)" }}>
              {currentLevel >= MAX_LEVEL ? "MAX" : `LVL ${currentLevel}`}
            </span>
            <span className="menu-action-arrow">›</span>
          </button>
          <button className="menu-action-btn" onClick={() => { onClose(); onOpenBattlePass(); }}>
            <span className="menu-action-icon" style={{ color: "#f59e0b" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="7" width="16" height="4" rx="1.5"/>
                <path d="M5 7V15M13 7V15"/>
                <path d="M1 11h16"/>
                <circle cx="5" cy="5" r="2"/><circle cx="13" cy="5" r="2"/>
              </svg>
            </span>
            <span className="menu-action-label" style={{ color: bpUnclaimedCount > 0 ? "#f59e0b" : undefined }}>BATTLE PASS</span>
            {bpUnclaimedCount > 0 && <span className="menu-action-badge" style={{ background: "#f59e0b", color: "#000" }}>{bpUnclaimedCount}</span>}
            <span className="menu-action-arrow">›</span>
          </button>
          <button className="menu-action-btn" onClick={() => { onClose(); onOpenFishing(); }}>
            <span className="menu-action-icon" style={{ color: "#00c8ff" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 16c2-4 6-4 8 0"/><path d="M12 4c0 0-1 3 1 5s5 1 5 1"/>
                <path d="M12 4L8 8"/><circle cx="7" cy="9" r="1.5"/>
              </svg>
            </span>
            <span className="menu-action-label" style={{ color: "#00c8ff" }}>FISHING</span>
            <span className="menu-action-arrow">›</span>
          </button>
        </div>

        <div className="menu-divider" />

        <div className="menu-name-row">
          <span className="menu-name-label">PLAYER</span>
          <div className="menu-name-field">
            <input ref={inputRef} className="menu-name-input" value={nameInput}
              placeholder="Enter your name" maxLength={16}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { onSaveName(nameInput.trim()); inputRef.current?.blur(); } }}
            />
            <button className="menu-name-save" onClick={() => { onSaveName(nameInput.trim()); inputRef.current?.blur(); }}>Save</button>
          </div>
        </div>

        <div className="infinite-toggle-row">
          <div>
            <span className="infinite-toggle-label">INFINITE MODE</span>
            <span className="infinite-toggle-sub">Clear board after board non-stop</span>
          </div>
          <button className={`toggle-switch${infiniteMode ? " on" : ""}`} onClick={onToggleInfinite} aria-label="Toggle infinite mode">
            <span className="toggle-knob" />
          </button>
        </div>

        <div className="menu-stats">
          <div className="stat-section-title">Classic</div>
          <div className="stat-row"><span className="stat-label">Win Rate</span><span className="stat-value">{winRate}%</span></div>
          <div className="stat-divider" />
          <div className="stat-row"><span className="stat-label">Wins</span><span className="stat-value">{stats.wins}</span></div>
          <div className="stat-divider" />
          <div className="stat-row"><span className="stat-label">Games Played</span><span className="stat-value">{stats.games}</span></div>
          <div className="stat-divider" />
          <div className="stat-row"><span className="stat-label">Best Time</span><span className="stat-value stat-best">{fmtTime(stats.best)}</span></div>
          <div className="stat-section-title" style={{ marginTop: 20 }}>Infinite</div>
          <div className="stat-row"><span className="stat-label">Best Run</span><span className="stat-value stat-best">{bestInfinite > 0 ? `${bestInfinite} boards` : "—"}</span></div>
        </div>
      </div>
    </div>
  );
}

// ── ShopModal ─────────────────────────────────────────────────────────────────
function ShopModal({ open, onClose, coins, ownedThemes, ownedFlags, onBuyTheme, onBuyFlag, onOpenCrate, onOpenCrateWithKey, miscKeys = 0, defaultTab = "themes" }: {
  open: boolean; onClose: () => void; coins: number;
  ownedThemes: string[]; ownedFlags: string[];
  onBuyTheme: (id: string) => void; onBuyFlag: (id: string) => void;
  onOpenCrate: (qty: 1 | 3) => void;
  onOpenCrateWithKey: () => void;
  miscKeys?: number;
  defaultTab?: "themes" | "flags" | "crates";
}) {
  const [tab, setTab] = useState<"themes" | "flags" | "crates">(defaultTab);
  useEffect(() => { if (open) setTab(defaultTab); }, [open, defaultTab]);
  if (!open) return null;
  const shopThemes = THEMES.filter(t => t.levelReq === 0 && !('bpReq' in t));
  const shopFlags  = FLAGS.filter(f => f.levelReq === 0 && !('bpReq' in f));

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="menu-handle" />
        <div className="shop-header">
          <span className="shop-title">SHOP</span>
          <span className="shop-coins"><CoinIcon size={18} /><span>{coins}</span></span>
        </div>
        <div className="menu-tabs">
          <button className={`menu-tab${tab === "themes" ? " active" : ""}`} onClick={() => setTab("themes")}>THEMES</button>
          <button className={`menu-tab${tab === "flags" ? " active" : ""}`} onClick={() => setTab("flags")}>FLAGS</button>
          <button className={`menu-tab${tab === "crates" ? " active" : ""}`} onClick={() => setTab("crates")}>CRATES</button>
        </div>
        {tab === "themes" && (
          <div className="shop-grid">
            {shopThemes.map((t) => {
              const owned = ownedThemes.includes(t.id);
              const canAfford = coins >= t.price;
              return (
                <div key={t.id} className={`shop-card${owned ? " owned" : ""}`}>
                  <div className="theme-swatch" style={{ background: t.bg }}>
                    <div className="theme-swatch-cell" style={{ background: t.cell }} />
                    <div className="theme-swatch-cell" style={{ background: t.cell }} />
                    <div className="theme-swatch-accent" style={{ background: t.accent }} />
                  </div>
                  <span className="shop-card-label">{t.label}</span>
                  {t.price > 0 && !owned && <span className="shop-price-tier" style={{ color: t.price >= 200 ? "#ffd700" : t.price >= 100 ? "#c084fc" : t.price >= 50 ? "#00c8ff" : "var(--accent)" }}>
                    {t.price >= 200 ? "★ PREMIUM" : t.price >= 100 ? "● RARE" : "◆ COOL"}
                  </span>}
                  {owned ? <span className="shop-owned-badge">Owned</span> : (
                    <button className={`shop-buy-btn${canAfford ? "" : " cant-afford"}`}
                      onClick={() => onBuyTheme(t.id)} disabled={!canAfford}>
                      <CoinIcon size={11} /> {t.price === 0 ? "Free" : t.price}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {tab === "flags" && (
          <div className="shop-grid">
            {shopFlags.map((f) => {
              const owned = ownedFlags.includes(f.id);
              const canAfford = coins >= f.price;
              return (
                <div key={f.id} className={`shop-card${owned ? " owned" : ""}`}>
                  <div className="flag-preview" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {getLevelFlagNode(f.id, 28) ?? f.emoji}
                  </div>
                  <span className="shop-card-label">{f.label}</span>
                  {f.price >= 500 && !owned && <span className="shop-price-tier" style={{ color: "#ffd700" }}>★ LEGENDARY</span>}
                  {f.price >= 200 && f.price < 500 && !owned && <span className="shop-price-tier" style={{ color: "#c084fc" }}>● EPIC</span>}
                  {owned ? <span className="shop-owned-badge">Owned</span> : (
                    <button className={`shop-buy-btn${canAfford ? "" : " cant-afford"}`}
                      onClick={() => onBuyFlag(f.id)} disabled={!canAfford}>
                      <CoinIcon size={11} /> {f.price === 0 ? "Free" : f.price}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {tab === "crates" && (
          <div className="crate-shop-panel">
            {/* Crate #1 card */}
            <div className="crate-shop-card">
              <div className="crate-shop-card-top">
                <span style={{ fontSize: 36 }}>📦</span>
                <div>
                  <div className="crate-shop-name">Crate #1</div>
                  <div className="crate-shop-sub">Themed flags &amp; animated items</div>
                </div>
                <span className="crate-shop-cost"><CoinIcon size={13} /> {CRATE_COST}</span>
              </div>
              {/* Mini drop rate list */}
              <div className="crate-shop-rates">
                {([
                  { label: "Common",    pct: "65%", color: "#8a9bb0" },
                  { label: "Rare",      pct: "25%", color: "#4d9fff" },
                  { label: "Epic",      pct: "8%",  color: "#c084fc" },
                  { label: "Legendary", pct: "2%",  color: "#ffd700" },
                ] as const).map(r => (
                  <div key={r.label} className="crate-shop-rate-row">
                    <span className="crate-drop-dot" style={{ background: r.color }} />
                    <span style={{ color: r.color, fontSize: 11, fontWeight: 600 }}>{r.label}</span>
                    <span style={{ color: "var(--stat-label-color)", fontSize: 11, marginLeft: "auto" }}>{r.pct}</span>
                  </div>
                ))}
              </div>
              <div className="crate-shop-open-row" style={{ marginTop: 12 }}>
                <button
                  className={`crate-open-btn crate-open-qty${coins >= CRATE_COST ? "" : " cant-afford"}`}
                  onClick={() => { onClose(); onOpenCrate(1); }}
                  disabled={coins < CRATE_COST}
                >
                  <CoinIcon size={12} /> 1× — {CRATE_COST}
                </button>
                <button
                  className={`crate-open-btn crate-open-qty crate-open-qty-3x${coins >= CRATE_COST * 3 ? "" : " cant-afford"}`}
                  onClick={() => { onClose(); onOpenCrate(3); }}
                  disabled={coins < CRATE_COST * 3}
                >
                  <CoinIcon size={12} /> 3× — {CRATE_COST * 3}
                </button>
              </div>
              {miscKeys > 0 && (
                <button
                  className="crate-open-btn"
                  style={{ marginTop: 8, width: "100%", background: "transparent", borderColor: "#ffd700", color: "#ffd700" }}
                  onClick={() => { onClose(); onOpenCrateWithKey(); }}
                >
                  🗝️ Use Key — Open Free ({miscKeys} key{miscKeys !== 1 ? "s" : ""})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── InventoryModal ────────────────────────────────────────────────────────────
function InventoryModal({ open, onClose, ownedThemes, ownedFlags, activeTheme, activeFlag, onEquipTheme, onEquipFlag, ownedCrateItems, miscKeys, fishInventory }: {
  open: boolean; onClose: () => void;
  ownedThemes: string[]; ownedFlags: string[];
  activeTheme: string; activeFlag: string;
  onEquipTheme: (id: string) => void; onEquipFlag: (id: string) => void;
  ownedCrateItems: string[];
  miscKeys: number;
  fishInventory: Record<string, number>;
}) {
  const [tab, setTab] = useState<"themes" | "flags" | "misc" | "fish">("themes");
  if (!open) return null;

  // Regular flags (bought from shop or earned by leveling) — exclude crate-only emoji flags
  const regularFlags = FLAGS.filter(f => ownedFlags.includes(f.id) && f.levelReq !== 99);

  // Crate items the user owns (both emoji and svg), ordered by rarity
  const rarityOrder: CrateRarity[] = ["legendary", "epic", "rare", "common"];
  const ownedCrateItemObjects = rarityOrder
    .flatMap(r => CRATE_ITEMS.filter(i => i.rarity === r && ownedCrateItems.includes(i.id)));

  // Active equippable id: for emoji items it's item.flagId; for svg items it's item.id
  const getEquipId = (item: CrateItem) => item.type === "emoji" ? item.flagId! : item.id;

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="menu-handle" />
        <div className="shop-header">
          <span className="shop-title">INVENTORY</span>
        </div>
        <div className="menu-tabs">
          <button className={`menu-tab${tab === "themes" ? " active" : ""}`} onClick={() => setTab("themes")}>THEMES</button>
          <button className={`menu-tab${tab === "flags" ? " active" : ""}`} onClick={() => setTab("flags")}>FLAGS</button>
          <button className={`menu-tab${tab === "misc" ? " active" : ""}`} onClick={() => setTab("misc")}>
            MISC{miscKeys > 0 ? <span style={{ marginLeft: 4, background: "#ffd700", color: "#000", borderRadius: 8, padding: "0 5px", fontSize: 9, fontWeight: 700 }}>{miscKeys}</span> : null}
          </button>
          <button className={`menu-tab${tab === "fish" ? " active" : ""}`} onClick={() => setTab("fish")}>
            FISH{Object.values(fishInventory).some(v => v > 0) ? <span style={{ marginLeft: 4, background: "#00c8ff", color: "#000", borderRadius: 8, padding: "0 5px", fontSize: 9, fontWeight: 700 }}>🐟</span> : null}
          </button>
        </div>
        {tab === "themes" && (
          <div className="shop-grid">
            {THEMES.filter(t => ownedThemes.includes(t.id)).map((t) => {
              const active = activeTheme === t.id;
              const isExclusive = t.levelReq > 0;
              return (
                <button key={t.id} className={`shop-card inv-card${active ? " inv-active" : ""}`} onClick={() => onEquipTheme(t.id)}>
                  <div className="theme-swatch" style={{ background: t.bg }}>
                    <div className="theme-swatch-cell" style={{ background: t.cell }} />
                    <div className="theme-swatch-cell" style={{ background: t.cell }} />
                    <div className="theme-swatch-accent" style={{ background: t.accent }} />
                  </div>
                  <span className="shop-card-label">{t.label}</span>
                  {isExclusive && <span className="inv-exclusive-dot" />}
                  {active && <span className="inv-check">✓</span>}
                </button>
              );
            })}
          </div>
        )}
        {tab === "flags" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Regular purchased / level-unlock flags */}
            {regularFlags.length > 0 && (
              <div className="shop-grid">
                {regularFlags.map((f) => {
                  const active = activeFlag === f.id;
                  const isExclusive = f.levelReq > 0;
                  return (
                    <button key={f.id} className={`shop-card inv-card${active ? " inv-active" : ""}`} onClick={() => onEquipFlag(f.id)}>
                      <div className="flag-preview" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {getLevelFlagNode(f.id, 28) ?? f.emoji}
                      </div>
                      <span className="shop-card-label">{f.label}</span>
                      {isExclusive && <span className="inv-exclusive-dot" />}
                      {active && <span className="inv-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Crate #1 section */}
            {ownedCrateItemObjects.length > 0 && (
              <>
                <div className="inv-section-header">
                  <span>Crate #1</span>
                  <span className="inv-section-count">{ownedCrateItemObjects.length}</span>
                </div>
                <div className="shop-grid">
                  {ownedCrateItemObjects.map((item) => {
                    const equipId = getEquipId(item);
                    const active = activeFlag === equipId;
                    const color = getRarityColor(item.rarity);
                    return (
                      <button
                        key={item.id}
                        className={`shop-card inv-card${active ? " inv-active" : ""}`}
                        onClick={() => onEquipFlag(equipId)}
                        style={{ position: "relative" }}
                      >
                        <div className="flag-preview" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CrateItemDisplay item={item} size={28} />
                        </div>
                        <span className="shop-card-label">{item.label}</span>
                        <span style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: 0.5 }}>
                          {getRarityLabel(item.rarity)}
                        </span>
                        {active && <span className="inv-check">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Empty state */}
            {regularFlags.length === 0 && ownedCrateItemObjects.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--stat-label-color)", fontSize: 13 }}>
                No flags yet — buy some in the Shop!
              </div>
            )}
          </div>
        )}
        {tab === "misc" && (
          <div style={{ padding: "4px 0" }}>
            <div className="inv-section-header">
              <span>Crate Keys</span>
              <span className="inv-section-count">{miscKeys}</span>
            </div>
            {miscKeys > 0 ? (
              <div className="shop-grid" style={{ marginTop: 8 }}>
                <div className="shop-card" style={{ pointerEvents: "none", textAlign: "center" }}>
                  <div className="flag-preview" style={{ fontSize: 28 }}>🗝️</div>
                  <span className="shop-card-label">Crate Key</span>
                  <span style={{ fontSize: 11, color: "#ffd700", fontWeight: 700 }}>×{miscKeys}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "28px 0", color: "var(--stat-label-color)", fontSize: 13 }}>
                No keys yet!
              </div>
            )}
            <div style={{ marginTop: 16, fontSize: 11, color: "var(--stat-label-color)", textAlign: "center", lineHeight: 1.6 }}>
              Keys drop randomly when clearing tiles<br />(1 in 50 chance per reveal).<br />
              Use a key in the Crate to open it for free!
            </div>
          </div>
        )}
        {tab === "fish" && (
          <div style={{ padding: "4px 0" }}>
            {FISH_TYPES.filter(f => (fishInventory[f.id] || 0) > 0).length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--stat-label-color)", fontSize: 13 }}>
                No fish yet — go fishing! 🎣
              </div>
            ) : (
              <>
                <div className="inv-section-header">
                  <span>Your Catch</span>
                  <span className="inv-section-count">{Object.values(fishInventory).reduce((a, b) => a + b, 0)}</span>
                </div>
                <div className="shop-grid" style={{ marginTop: 8 }}>
                  {FISH_TYPES.filter(f => (fishInventory[f.id] || 0) > 0).map(f => {
                    const color = FISH_RARITY_COLOR[f.rarity];
                    return (
                      <div key={f.id} className="shop-card" style={{ pointerEvents: "none", textAlign: "center" }}>
                        <div className="flag-preview" style={{ fontSize: 28 }}>{f.emoji}</div>
                        <span className="shop-card-label">{f.name}</span>
                        <span style={{ fontSize: 11, color, fontWeight: 700 }}>×{fishInventory[f.id] || 0}</span>
                        <span style={{ fontSize: 9, color, fontWeight: 600 }}>{f.rarity}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FishingModal ──────────────────────────────────────────────────────────────
type FishPhase = "idle" | "cast" | "waiting" | "minigame" | "caught" | "escaped";

function FishingModal({ open, onClose, fishInventory, onCatch }: {
  open: boolean; onClose: () => void;
  fishInventory: Record<string, number>;
  onCatch: (fish: FishType) => void;
}) {
  const [phase, setPhase] = useState<FishPhase>("idle");
  const [rolledFish, setRolledFish] = useState<FishType | null>(null);
  const [caughtWeight, setCaughtWeight] = useState("");
  const [fishY, setFishY] = useState(120);
  const [zoneY, setZoneY] = useState(85);
  const [progress, setProgress] = useState(30);
  const [holdingDown, setHoldingDown] = useState(false);
  const [biteFlash, setBiteFlash] = useState(false);
  const [waitDots, setWaitDots] = useState(0);
  const [tab, setTab] = useState<"fish" | "bestiary">("fish");

  const holdingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  const BAR_H = 240;
  const ZONE_H = 68;
  const FISH_SZ = 32;

  // Reset when closing
  useEffect(() => {
    if (!open) {
      setPhase("idle");
      setRolledFish(null);
      setBiteFlash(false);
      setWaitDots(0);
      setProgress(30);
      setFishY(BAR_H / 2);
      setZoneY(BAR_H / 2 - ZONE_H / 2);
      holdingRef.current = false;
      startedRef.current = false;
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    }
  }, [open]);

  // Cast → waiting
  useEffect(() => {
    if (phase !== "cast") return undefined;
    const t = setTimeout(() => setPhase("waiting"), 1100);
    return () => clearTimeout(t);
  }, [phase]);

  // Waiting dots animation
  useEffect(() => {
    if (phase !== "waiting") return undefined;
    const id = setInterval(() => setWaitDots(d => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, [phase]);

  // Random bite timer
  useEffect(() => {
    if (phase !== "waiting") return undefined;
    const delay = 2500 + Math.random() * 3500;
    const t = setTimeout(() => {
      const fish = rollFish();
      setRolledFish(fish);
      setBiteFlash(true);
      setTimeout(() => setBiteFlash(false), 700);
      setTimeout(() => {
        setProgress(30);
        setFishY(BAR_H / 2);
        setZoneY(BAR_H / 2 - ZONE_H / 2);
        setPhase("minigame");
      }, 1300);
    }, delay);
    return () => clearTimeout(t);
  }, [phase]);

  // Minigame RAF loop
  useEffect(() => {
    if (phase !== "minigame") return undefined;
    if (startedRef.current) return undefined;
    startedRef.current = true;

    let lastTime = performance.now();
    let fishPos = BAR_H / 2;
    let zonePos = BAR_H / 2 - ZONE_H / 2;
    let vel = 0;
    let prog = 30;

    const loop = (now: number): void => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const targetY = Math.random() < 0.02
        ? Math.random() * (BAR_H - FISH_SZ) + FISH_SZ / 2
        : fishPos;
      const accel = (targetY - fishPos) * 3 + (Math.random() - 0.5) * 200;
      vel = (vel + accel * dt) * 0.92;
      fishPos = Math.max(FISH_SZ / 2, Math.min(BAR_H - FISH_SZ / 2, fishPos + vel * dt));

      const zoneSpeed = holdingRef.current ? -270 : 170;
      zonePos = Math.max(0, Math.min(BAR_H - ZONE_H, zonePos + zoneSpeed * dt));

      const inZone = fishPos >= zonePos && fishPos <= zonePos + ZONE_H;
      prog = inZone
        ? Math.min(100, prog + 20 * dt * 60)
        : Math.max(0, prog - 13 * dt * 60);

      setFishY(fishPos);
      setZoneY(zonePos);
      setProgress(prog);

      if (prog >= 100) { setPhase("caught"); return; }
      if (prog <= 0)   { setPhase("escaped"); return; }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      startedRef.current = false;
    };
  }, [phase]);

  // Outcome callbacks
  useEffect(() => {
    if (phase === "caught" && rolledFish) {
      const w = formatFishWeight(rolledFish);
      setCaughtWeight(w);
      const t = setTimeout(() => {
        onCatch(rolledFish);
        setPhase("idle");
        setRolledFish(null);
        startedRef.current = false;
      }, 2500);
      return () => clearTimeout(t);
    }
    if (phase === "escaped") {
      const t = setTimeout(() => {
        setPhase("idle");
        startedRef.current = false;
      }, 1600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, rolledFish, onCatch]);

  const handleHoldStart = useCallback((e: React.PointerEvent | React.TouchEvent) => {
    e.preventDefault();
    holdingRef.current = true;
    setHoldingDown(true);
  }, []);

  const handleHoldEnd = useCallback(() => {
    holdingRef.current = false;
    setHoldingDown(false);
  }, []);

  if (!open) return null;

  const totalFish = Object.values(fishInventory).reduce((a, b) => a + b, 0);
  const totalCaught = Number(localStorage.getItem("ms-fish-total") || "0");
  const legendaryCount = FISH_TYPES.filter(f => f.rarity === "Legendary")
    .reduce((a, f) => a + (fishInventory[f.id] || 0), 0);

  const progressColor = progress > 70 ? "#4caf50" : progress > 30 ? "#ffd700" : "#ff4444";

  return (
    <div className="menu-overlay" onClick={() => { if (phase === "idle") onClose(); }}>
      <div className="menu-sheet fish-modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="menu-handle" />
        <div className="shop-header">
          <span className="shop-title">FISHING 🎣</span>
          <span className="shop-coins" style={{ fontSize: 13 }}>
            {totalFish} in bucket
          </span>
        </div>

        {/* IDLE PHASE */}
        {phase === "idle" && (
          <>
            {/* Stats row */}
            <div className="fish-stats-row">
              <div className="fish-stat"><span className="fish-stat-num">{totalCaught}</span><span className="fish-stat-lbl">Caught</span></div>
              <div className="fish-stat"><span className="fish-stat-num" style={{ color: "#4d9fff" }}>{totalFish}</span><span className="fish-stat-lbl">In Bucket</span></div>
              <div className="fish-stat"><span className="fish-stat-num" style={{ color: "#ffd700" }}>{legendaryCount}</span><span className="fish-stat-lbl">Legendary</span></div>
            </div>

            <button className="fish-cast-btn" onClick={() => setPhase("cast")}>
              🎣 Cast Rod
            </button>

            {/* Tab: bucket / bestiary */}
            <div className="menu-tabs" style={{ marginTop: 16 }}>
              <button className={`menu-tab${tab === "fish" ? " active" : ""}`} onClick={() => setTab("fish")}>BUCKET</button>
              <button className={`menu-tab${tab === "bestiary" ? " active" : ""}`} onClick={() => setTab("bestiary")}>BESTIARY</button>
            </div>

            {tab === "fish" && (
              <div style={{ padding: "8px 0" }}>
                {totalFish === 0 ? (
                  <div className="fish-empty">No fish yet — cast your rod!</div>
                ) : (
                  <div className="fish-bucket-grid">
                    {FISH_TYPES.filter(f => (fishInventory[f.id] || 0) > 0).map(f => {
                      const color = FISH_RARITY_COLOR[f.rarity];
                      const count = fishInventory[f.id] || 0;
                      return (
                        <div key={f.id} className="fish-bucket-card" style={{ borderColor: color + "60" }}>
                          <span className="fish-bucket-emoji">{f.emoji}</span>
                          <span className="fish-bucket-name">{f.name}</span>
                          <span className="fish-bucket-count" style={{ color }}>×{count}</span>
                          <span className="fish-bucket-rarity" style={{ color }}>{f.rarity}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === "bestiary" && (
              <div className="fish-bucket-grid" style={{ paddingTop: 8 }}>
                {FISH_TYPES.map(f => {
                  const owned = (fishInventory[f.id] || 0) > 0;
                  const color = FISH_RARITY_COLOR[f.rarity];
                  return (
                    <div key={f.id} className={`fish-bucket-card${owned ? "" : " fish-undiscovered"}`}
                      style={{ borderColor: owned ? color + "60" : undefined }}>
                      <span className="fish-bucket-emoji">{owned ? f.emoji : "❓"}</span>
                      <span className="fish-bucket-name">{owned ? f.name : "???"}</span>
                      <span className="fish-bucket-rarity" style={{ color }}>{f.rarity}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* CAST PHASE */}
        {phase === "cast" && (
          <div className="fish-phase-center">
            <div className="fish-cast-anim">🎣</div>
            <p className="fish-phase-label">Casting…</p>
          </div>
        )}

        {/* WAITING PHASE */}
        {phase === "waiting" && (
          <div className="fish-phase-center">
            <div className="fish-water-scene">
              <div className={`fish-bobber${biteFlash ? " fish-bobber-bite" : ""}`} />
              {biteFlash && <div className="fish-ripple" />}
            </div>
            {biteFlash
              ? <p className="fish-phase-label" style={{ color: "#ffd700", fontWeight: 700 }}>!! BITE !!</p>
              : <p className="fish-phase-label">Waiting{".".repeat(waitDots)}</p>
            }
          </div>
        )}

        {/* MINIGAME PHASE */}
        {phase === "minigame" && rolledFish && (
          <div className="fish-minigame-wrap">
            <p className="fish-phase-label" style={{ marginBottom: 8 }}>Reel it in!</p>
            <div className="fish-minigame-row">
              {/* Vertical catch bar */}
              <div className="fish-bar" style={{ height: BAR_H }}>
                {/* Green zone */}
                <div className="fish-zone" style={{
                  top: zoneY,
                  height: ZONE_H,
                  transition: "none",
                }} />
                {/* Fish icon */}
                <div className="fish-icon-in-bar" style={{
                  top: fishY - FISH_SZ / 2,
                  fontSize: FISH_SZ,
                  transition: "none",
                }}>
                  {rolledFish.emoji}
                </div>
              </div>

              {/* Progress bar */}
              <div className="fish-progress-wrap" style={{ height: BAR_H }}>
                <div className="fish-progress-track">
                  <div className="fish-progress-fill" style={{
                    height: `${progress}%`,
                    background: progressColor,
                    transition: "none",
                  }} />
                </div>
                <span className="fish-progress-pct">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Hold button */}
            <button
              className={`fish-hold-btn${holdingDown ? " fish-hold-active" : ""}`}
              onPointerDown={handleHoldStart}
              onPointerUp={handleHoldEnd}
              onPointerLeave={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
              style={{ touchAction: "none" }}
            >
              {holdingDown ? "🎣 Reeling!" : "Hold to Reel"}
            </button>
            <p className="fish-hint">Keep the fish inside the green zone</p>
          </div>
        )}

        {/* CAUGHT PHASE */}
        {phase === "caught" && rolledFish && (() => {
          const color = FISH_RARITY_COLOR[rolledFish.rarity];
          return (
            <div className="fish-phase-center">
              <div className="fish-caught-emoji">{rolledFish.emoji}</div>
              <p className="fish-caught-label" style={{ color }}>You caught a {rolledFish.rarity}!</p>
              <p className="fish-caught-name">{rolledFish.name}</p>
              <p className="fish-caught-weight">{caughtWeight}</p>
              <p className="fish-caught-desc">"{rolledFish.description}"</p>
            </div>
          );
        })()}

        {/* ESCAPED PHASE */}
        {phase === "escaped" && (
          <div className="fish-phase-center">
            <div style={{ fontSize: 56, marginBottom: 8 }}>💨</div>
            <p className="fish-caught-name">It got away!</p>
            <p className="fish-caught-desc">Better luck next time…</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState<"reveal" | "flag">("reveal");
  const [board, setBoard] = useState<CellState[][]>(createEmptyBoard);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [firstClick, setFirstClick] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [bpOpen, setBPOpen] = useState(false);
  const [bpClaimed, setBPClaimed] = useState<number[]>(() => {
    const s = localStorage.getItem("ms-bp-claimed");
    return s ? JSON.parse(s) : [];
  });
  useEffect(() => { localStorage.setItem("ms-bp-claimed", JSON.stringify(bpClaimed)); }, [bpClaimed]);

  const handleBPClaim = useCallback((tier: number) => {
    const reward = BATTLE_PASS.find(r => r.tier === tier);
    if (!reward || bpClaimed.includes(tier)) return;
    setBPClaimed(prev => [...prev, tier]);
    if (reward.coins)   setCoins(c => c + reward.coins!);
    if (reward.keys)    setMiscKeys(k => k + reward.keys!);
    if (reward.themeId) setOwnedThemes(prev => prev.includes(reward.themeId!) ? prev : [...prev, reward.themeId!]);
    if (reward.flagId)  setOwnedFlags (prev => prev.includes(reward.flagId!)  ? prev : [...prev, reward.flagId!]);
  }, [bpClaimed]);
  const [crateOpen,     setCrateOpen]     = useState(false);
  const [crateAutoOpen, setCrateAutoOpen] = useState<1 | 3 | undefined>(undefined);
  const [crateKeyOpen,  setCrateKeyOpen]  = useState(false);
  const [shopInitTab,   setShopInitTab]   = useState<"themes" | "flags" | "crates">("themes");
  const [fishingOpen,   setFishingOpen]   = useState(false);
  const [fishInventory, setFishInventory] = useState<Record<string, number>>(() => {
    const s = localStorage.getItem("ms-fish");
    return s ? JSON.parse(s) : {};
  });
  useEffect(() => { localStorage.setItem("ms-fish", JSON.stringify(fishInventory)); }, [fishInventory]);
  const [shaking, setShaking] = useState(false);
  const everFlaggedRef = useRef(false);

  // Splash screen
  const [splashDone, setSplashDone] = useState(false);
  const [gameFadingIn, setGameFadingIn] = useState(false);
  const handleSplashPlay = useCallback(() => {
    setGameFadingIn(true);
    setTimeout(() => setSplashDone(true), 900);
  }, []);

  // Theme
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("ms-theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ms-theme", theme);
  }, [theme]);

  // Shop state
  const [coins, setCoins] = useState<number>(() => Number(localStorage.getItem("ms-coins") || "0"));
  const [ownedThemes, setOwnedThemes] = useState<string[]>(() => {
    const s = localStorage.getItem("ms-owned-themes");
    return s ? JSON.parse(s) : ["dark", "light"];
  });
  const [ownedFlags, setOwnedFlags] = useState<string[]>(() => {
    const s = localStorage.getItem("ms-owned-flags");
    return s ? JSON.parse(s) : ["default"];
  });
  const [activeFlag, setActiveFlag] = useState<string>(() => localStorage.getItem("ms-active-flag") || "default");
  useEffect(() => { localStorage.setItem("ms-coins", String(coins)); }, [coins]);
  useEffect(() => { localStorage.setItem("ms-owned-themes", JSON.stringify(ownedThemes)); }, [ownedThemes]);
  useEffect(() => { localStorage.setItem("ms-owned-flags", JSON.stringify(ownedFlags)); }, [ownedFlags]);
  useEffect(() => { localStorage.setItem("ms-active-flag", activeFlag); }, [activeFlag]);

  // Compute what to render on flagged cells — emoji string or SVG React node
  const flagContent: React.ReactNode = (() => {
    const lvlSvg = getLevelFlagNode(activeFlag, 22);
    if (lvlSvg) return lvlSvg;
    const flag = FLAGS.find((f) => f.id === activeFlag);
    if (flag) return flag.emoji;
    const crateItem = CRATE_ITEMS.find((i) => i.id === activeFlag);
    if (crateItem) return <CrateItemDisplay item={crateItem} size={22} />;
    return "🚩";
  })();

  // Crate collection
  const [ownedCrateItems, setOwnedCrateItems] = useState<string[]>(() => {
    const s = localStorage.getItem("ms-crate-items");
    return s ? JSON.parse(s) : [];
  });
  useEffect(() => { localStorage.setItem("ms-crate-items", JSON.stringify(ownedCrateItems)); }, [ownedCrateItems]);

  // Misc inventory (crate keys, etc.)
  const [miscKeys, setMiscKeys] = useState<number>(() => Number(localStorage.getItem("ms-misc-keys") || "0"));
  useEffect(() => { localStorage.setItem("ms-misc-keys", String(miscKeys)); }, [miscKeys]);

  const handleUseKey = useCallback(() => {
    setMiscKeys(k => Math.max(0, k - 1));
  }, []);

  const handleCratePay = useCallback((amount: number) => {
    setCoins((c) => c - amount);
  }, []);

  const handleCrateClaim = useCallback((item: CrateItem) => {
    setOwnedCrateItems((prev) => {
      if (prev.includes(item.id)) return prev;
      return [...prev, item.id];
    });
    // Emoji items: add to ownedFlags so they can be equipped
    // SVG items: add item.id to ownedFlags so equipping works via flagContent lookup
    const equippableId = item.type === "emoji" ? item.flagId! : item.id;
    if (equippableId) {
      setOwnedFlags((prev) => prev.includes(equippableId) ? prev : [...prev, equippableId]);
    }
    // Stay on crate page — modal stays open and resets to idle via CrateModal's own state
  }, []);

  // XP & Level
  const [totalXP, setTotalXP] = useState<number>(() => Number(localStorage.getItem("ms-xp") || "0"));
  const totalXPRef = useRef(totalXP);
  useEffect(() => { totalXPRef.current = totalXP; localStorage.setItem("ms-xp", String(totalXP)); }, [totalXP]);
  const currentLevel = computeLevel(totalXP);

  // BXP (Battle Pass XP — separate from regular XP)
  const [totalBXP, setTotalBXP] = useState<number>(() => Number(localStorage.getItem("ms-bxp") || "0"));
  useEffect(() => { localStorage.setItem("ms-bxp", String(totalBXP)); }, [totalBXP]);

  // BP Quests — period-based reset every 3 days
  const [bpQuestProgress, setBPQuestProgress] = useState<Record<string, number>>(() => {
    // Check if the stored period is still current; if not, wipe quest data
    const currentPeriod = getBPQuestPeriod();
    const storedPeriod = localStorage.getItem("ms-bpq-period");
    if (storedPeriod === null || Number(storedPeriod) !== currentPeriod) {
      localStorage.setItem("ms-bpq-period", String(currentPeriod));
      localStorage.setItem("ms-bpq-progress", "{}");
      localStorage.setItem("ms-bpq-completed", "[]");
    }
    const s = localStorage.getItem("ms-bpq-progress");
    return s ? JSON.parse(s) : {};
  });
  const [bpQuestCompleted, setBPQuestCompleted] = useState<string[]>(() => {
    const s = localStorage.getItem("ms-bpq-completed");
    return s ? JSON.parse(s) : [];
  });
  useEffect(() => { localStorage.setItem("ms-bpq-progress", JSON.stringify(bpQuestProgress)); }, [bpQuestProgress]);
  useEffect(() => { localStorage.setItem("ms-bpq-completed", JSON.stringify(bpQuestCompleted)); }, [bpQuestCompleted]);

  // Watch for period rollover while the app is open
  const [questResetAt] = useState<Date>(() => getNextBPQuestReset());
  useEffect(() => {
    const id = setInterval(() => {
      const currentPeriod = getBPQuestPeriod();
      const storedPeriod = Number(localStorage.getItem("ms-bpq-period") || "-1");
      if (currentPeriod !== storedPeriod) {
        localStorage.setItem("ms-bpq-period", String(currentPeriod));
        setBPQuestProgress({});
        setBPQuestCompleted([]);
      }
    }, 10_000); // check every 10 s
    return () => clearInterval(id);
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastKeyRef = useRef(0);

  const pushToast = useCallback((toast: Omit<ToastItem, "key">, delayMs = 0) => {
    const key = ++toastKeyRef.current;
    setTimeout(() => {
      setToasts(t => [...t, { ...toast, key }]);
      setTimeout(() => setToasts(t => t.filter(x => x.key !== key)), 3800);
    }, delayMs);
  }, []);

  const handleCatchFish = useCallback((fish: FishType) => {
    setFishInventory(prev => ({ ...prev, [fish.id]: (prev[fish.id] || 0) + 1 }));
    const total = Number(localStorage.getItem("ms-fish-total") || "0") + 1;
    localStorage.setItem("ms-fish-total", String(total));
    pushToast({ type: "keydrop", title: `Caught ${fish.name}! ${fish.emoji}`, subtitle: fish.rarity + " fish" });
  }, [pushToast]);

  // ── Daily Challenges ─────────────────────────────────────────────────────────
  const todayKey = getTodayKey();
  const dailyChallenges = getDailyChallenges();

  const [dailyProgress, setDailyProgress] = useState<Record<string, number>>(() => {
    const storedKey = localStorage.getItem("ms-daily-key");
    if (storedKey !== todayKey) return {};
    const s = localStorage.getItem("ms-daily-progress");
    return s ? JSON.parse(s) : {};
  });
  const [dailyCompleted, setDailyCompleted] = useState<string[]>(() => {
    const storedKey = localStorage.getItem("ms-daily-key");
    if (storedKey !== todayKey) return [];
    const s = localStorage.getItem("ms-daily-completed");
    return s ? JSON.parse(s) : [];
  });
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState<boolean>(() => {
    const storedKey = localStorage.getItem("ms-daily-key");
    if (storedKey !== todayKey) return false;
    return localStorage.getItem("ms-daily-bonus") === "true";
  });

  // Persist and reset daily state when the day changes
  useEffect(() => {
    const storedKey = localStorage.getItem("ms-daily-key");
    if (storedKey !== todayKey) {
      localStorage.setItem("ms-daily-key", todayKey);
      localStorage.setItem("ms-daily-progress", "{}");
      localStorage.setItem("ms-daily-completed", "[]");
      localStorage.setItem("ms-daily-bonus", "false");
      localStorage.setItem("ms-daily-viewed", "false");
    }
  }, [todayKey]);

  useEffect(() => { localStorage.setItem("ms-daily-progress", JSON.stringify(dailyProgress)); }, [dailyProgress]);
  useEffect(() => { localStorage.setItem("ms-daily-completed", JSON.stringify(dailyCompleted)); }, [dailyCompleted]);
  useEffect(() => { localStorage.setItem("ms-daily-bonus", String(dailyBonusClaimed)); }, [dailyBonusClaimed]);

  // Daily badge: cleared once user opens the daily modal
  const [dailyViewed, setDailyViewed] = useState<boolean>(() => {
    const storedKey = localStorage.getItem("ms-daily-key");
    if (storedKey !== todayKey) return false;
    return localStorage.getItem("ms-daily-viewed") === "true";
  });
  useEffect(() => { localStorage.setItem("ms-daily-viewed", String(dailyViewed)); }, [dailyViewed]);
  const handleViewedDaily = useCallback(() => setDailyViewed(true), []);

  const dailyIncomplete = dailyChallenges.some(c => !dailyCompleted.includes(c.id));
  // Badge only shows while there are incomplete challenges AND user hasn't opened modal yet today
  const dailyBadge = dailyIncomplete && !dailyViewed;

  const advanceDailyChallenge = useCallback((type: string, value: number) => {
    setDailyCompleted(completed => {
      setDailyProgress(progress => {
        const newProgress = { ...progress };
        const newCompleted = [...completed];
        let anyNewlyCompleted = false;

        for (const c of dailyChallenges) {
          if (completed.includes(c.id)) continue;
          if (c.type !== type) continue;

          let newVal: number;
          // speed: value is the time, lower is better — check threshold
          if (type === "speed") {
            newVal = value <= c.target ? 1 : 0;
          } else if (type === "no_flags") {
            newVal = value >= 1 ? 1 : 0;
          } else {
            newVal = (progress[c.id] ?? 0) + value;
          }

          newProgress[c.id] = Math.min(newVal, c.target);

          if (newProgress[c.id] >= c.target && !newCompleted.includes(c.id)) {
            newCompleted.push(c.id);
            anyNewlyCompleted = true;
            // Award 20 BXP per completed daily quest
            setTotalBXP(prev => prev + 20);
            setTimeout(() => pushToast({ type: "daily", title: c.title, subtitle: `${c.desc} · +20 BXP` }), 200);
          }
        }

        // Check if all complete — award bonus
        if (anyNewlyCompleted) {
          const allDone = dailyChallenges.every(c => newCompleted.includes(c.id));
          if (allDone) {
            setDailyBonusClaimed(prev => {
              if (!prev) {
                setCoins(c => c + 25);
                setTotalXP(prev2 => prev2 + 20);
                setTotalBXP(prev2 => prev2 + 25);
                setTimeout(() => pushToast({ type: "daily", title: "All Dailies Complete!", subtitle: "+25 coins · +20 XP · +25 BXP", reward: 25 }), 600);
                return true;
              }
              return prev;
            });
          }
          setDailyCompleted(newCompleted);
        }

        return newProgress;
      });
      return completed;
    });
  }, [dailyChallenges, pushToast]);

  // Advance BP Quest progress (permanent one-time quests)
  const advanceBPQuest = useCallback((type: string, value: number) => {
    setBPQuestProgress(progress => {
      const newProgress = { ...progress };
      for (const q of BP_QUESTS) {
        if (q.type !== type) continue;
        let newVal: number;
        if (type === "speed") {
          newVal = value <= q.target ? q.target : (progress[q.id] ?? 0);
        } else if (type === "no_flags") {
          newVal = value >= 1 ? q.target : (progress[q.id] ?? 0);
        } else {
          newVal = Math.min((progress[q.id] ?? 0) + value, q.target);
        }
        newProgress[q.id] = newVal;
      }
      return newProgress;
    });
  }, []);

  // Award BXP and handle Battle Pass tier notifications
  const awardBXP = useCallback((amount: number) => {
    setTotalBXP(prev => {
      const oldBXP = prev;
      const newBXP = oldBXP + amount;
      const oldBPTier = computeBPTier(oldBXP);
      const newBPTier = computeBPTier(newBXP);
      if (newBPTier > oldBPTier) {
        for (let bpt = oldBPTier + 1; bpt <= newBPTier; bpt++) {
          const capturedTier = bpt;
          const bpDelay = 500 + (capturedTier - oldBPTier - 1) * 500;
          setTimeout(() => {
            const k = ++toastKeyRef.current;
            setToasts(ts => [...ts, {
              type: "battlepass" as const,
              title: `Battle Pass — Tier ${capturedTier}${capturedTier === BP_MAX_TIER ? " 🏆" : ""}!`,
              subtitle: "Open menu → Battle Pass to claim",
              key: k,
            }]);
            setTimeout(() => setToasts(ts => ts.filter(x => x.key !== k)), 4500);
          }, bpDelay);
        }
      }
      return newBXP;
    });
  }, []);

  // Award XP and handle level-ups
  const awardXP = useCallback((amount: number) => {
    setTotalXP(prev => {
      const oldXP = prev;
      const newXP = oldXP + amount;
      const oldLevel = computeLevel(oldXP);
      const newLevel = Math.min(MAX_LEVEL, computeLevel(newXP));

      if (newLevel > oldLevel) {
        let delay = 400;
        for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
          const reward = LEVEL_REWARDS.find(r => r.level === lvl);
          if (!reward) continue;
          setCoins(c => c + reward.coins);
          if (reward.flag) setOwnedFlags(prev2 => prev2.includes(reward.flag!) ? prev2 : [...prev2, reward.flag!]);
          if (reward.theme) setOwnedThemes(prev2 => prev2.includes(reward.theme!) ? prev2 : [...prev2, reward.theme!]);

          const extras: string[] = [];
          if (reward.flag) extras.push(`${reward.flagEmoji} ${reward.flagLabel} flag`);
          if (reward.theme) extras.push(`${reward.themeLabel} theme`);
          const subtitle = extras.length > 0 ? extras.join(" · ") : undefined;

          const toastPayload: Omit<ToastItem, "key"> = {
            type: "levelup",
            title: lvl >= MAX_LEVEL ? "Max Level Reached!" : `Level ${lvl}`,
            subtitle,
            coins: reward.coins,
          };
          const capturedDelay = delay;
          setTimeout(() => {
            const k = ++toastKeyRef.current;
            setToasts(t => [...t, { ...toastPayload, key: k }]);
            setTimeout(() => setToasts(t => t.filter(x => x.key !== k)), 4000);
          }, capturedDelay);
          delay += 700;
        }
      }
      return newXP;
    });
  }, []);

  // Achievements state
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>(() => {
    const s = localStorage.getItem("ms-claimed-achievements");
    return s ? JSON.parse(s) : [];
  });
  const [pendingAchievements, setPendingAchievements] = useState<string[]>(() => {
    const s = localStorage.getItem("ms-pending-achievements");
    return s ? JSON.parse(s) : [];
  });
  useEffect(() => { localStorage.setItem("ms-claimed-achievements", JSON.stringify(claimedAchievements)); }, [claimedAchievements]);
  useEffect(() => { localStorage.setItem("ms-pending-achievements", JSON.stringify(pendingAchievements)); }, [pendingAchievements]);

  const unlockAchievements = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setPendingAchievements(prev => {
      const toAdd = ids.filter(id => !prev.includes(id));
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
    ids.forEach((id, i) => {
      const def = ACHIEVEMENTS.find(a => a.id === id);
      if (!def) return;
      pushToast({ type: "achievement", title: def.title, reward: def.reward }, i * 650);
    });
  }, [pushToast]);

  const handleClaimAchievement = useCallback((id: string) => {
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return;
    setPendingAchievements(prev => prev.filter(x => x !== id));
    setClaimedAchievements(prev => [...prev, id]);
    setCoins(c => c + def.reward);
    awardXP(10);
  }, [awardXP]);

  const handleClaimBPQuest = useCallback((id: string) => {
    const q = BP_QUESTS.find(q => q.id === id);
    if (!q || bpQuestCompleted.includes(id)) return;
    if ((bpQuestProgress[id] ?? 0) < q.target) return;
    setBPQuestCompleted(prev => [...prev, id]);
    awardBXP(q.bxpReward);
    pushToast({ type: "battlepass", title: `Quest: ${q.title}`, subtitle: `+${q.bxpReward} BXP earned!` });
  }, [bpQuestCompleted, bpQuestProgress, awardBXP, pushToast]);

  const checkAchievements = useCallback((opts: {
    wins?: number; games?: number; time?: number;
    neverFlagged?: boolean; waveCount?: number;
    ownedFlagsCount?: number; allPurchasableFlagsOwned?: boolean; allPurchasableThemesOwned?: boolean;
  }) => {
    setPendingAchievements(pending => {
      setClaimedAchievements(claimed => {
        const newIds: string[] = [];
        const has = (id: string) => claimed.includes(id) || pending.includes(id) || newIds.includes(id);
        const { wins, games, time, neverFlagged, waveCount, ownedFlagsCount, allPurchasableFlagsOwned, allPurchasableThemesOwned } = opts;
        if (wins !== undefined) {
          if (wins >= 1   && !has("first_win")) newIds.push("first_win");
          if (wins >= 10  && !has("wins_10"))   newIds.push("wins_10");
          if (wins >= 50  && !has("wins_50"))   newIds.push("wins_50");
          if (wins >= 100 && !has("wins_100"))  newIds.push("wins_100");
        }
        if (time !== undefined) {
          if (time < 60 && !has("speed_60")) newIds.push("speed_60");
          if (time < 30 && !has("speed_30")) newIds.push("speed_30");
          if (time < 15 && !has("speed_15")) newIds.push("speed_15");
        }
        if (neverFlagged && !has("no_flags")) newIds.push("no_flags");
        if (games !== undefined) {
          if (games >= 10  && !has("games_10"))  newIds.push("games_10");
          if (games >= 50  && !has("games_50"))  newIds.push("games_50");
          if (games >= 100 && !has("games_100")) newIds.push("games_100");
        }
        if (waveCount !== undefined) {
          if (waveCount >= 5  && !has("wave_5"))  newIds.push("wave_5");
          if (waveCount >= 10 && !has("wave_10")) newIds.push("wave_10");
          if (waveCount >= 25 && !has("wave_25")) newIds.push("wave_25");
          if (waveCount >= 50 && !has("wave_50")) newIds.push("wave_50");
        }
        if (ownedFlagsCount !== undefined && ownedFlagsCount >= 5 && !has("flags_5")) newIds.push("flags_5");
        if (allPurchasableFlagsOwned && !has("flags_all")) newIds.push("flags_all");
        if (allPurchasableThemesOwned && !has("themes_all")) newIds.push("themes_all");
        if (newIds.length > 0) unlockAchievements(newIds);
        return claimed;
      });
      return pending;
    });
  }, [unlockAchievements]);

  // Shop handlers
  const handleBuyTheme = useCallback((id: string) => {
    const t = THEMES.find(t => t.id === id);
    if (!t || ownedThemes.includes(id) || coins < t.price) return;
    setCoins(c => c - t.price);
    setOwnedThemes(prev => {
      const next = [...prev, id];
      const shopThemes = THEMES.filter(th => th.levelReq === 0 && th.price > 0);
      const allOwned = shopThemes.every(th => next.includes(th.id));
      setTimeout(() => checkAchievements({ allPurchasableThemesOwned: allOwned }), 0);
      return next;
    });
  }, [coins, ownedThemes, checkAchievements]);

  const handleBuyFlag = useCallback((id: string) => {
    const f = FLAGS.find(f => f.id === id);
    if (!f || ownedFlags.includes(id) || coins < f.price) return;
    setCoins(c => c - f.price);
    setOwnedFlags(prev => {
      const next = [...prev, id];
      const shopFlags = FLAGS.filter(fl => fl.levelReq === 0 && fl.price > 0);
      const allOwned = shopFlags.every(fl => next.includes(fl.id));
      const purchasableOwned = next.filter(id => FLAGS.find(fl => fl.id === id && fl.levelReq === 0) !== undefined);
      setTimeout(() => checkAchievements({ ownedFlagsCount: purchasableOwned.length, allPurchasableFlagsOwned: allOwned }), 0);
      return next;
    });
  }, [coins, ownedFlags, checkAchievements]);

  const handleEquipTheme = useCallback((id: string) => { setTheme(id); setInventoryOpen(false); }, []);
  const handleEquipFlag = useCallback((id: string) => { setActiveFlag(id); setInventoryOpen(false); }, []);

  // Infinite mode
  const [infiniteMode, setInfiniteMode] = useState(() => localStorage.getItem("ms-infinite") === "true");
  const [infiniteCount, setInfiniteCount] = useState(0);
  const infiniteCountRef = useRef(0);
  const [transitioning, setTransitioning] = useState(false);
  const [exitBoard, setExitBoard] = useState<CellState[][] | null>(null);
  const [infiniteLB, setInfiniteLB] = useState<{ name: string; boards: number; date: string }[]>(() => {
    const s = localStorage.getItem("ms-infinite-lb");
    return s ? JSON.parse(s) : [];
  });
  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem("ms-player") || "");
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem("ms-stats");
    return saved ? JSON.parse(saved) : { games: 0, wins: 0, best: null as number | null };
  });
  useEffect(() => { localStorage.setItem("ms-stats", JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem("ms-infinite-lb", JSON.stringify(infiniteLB)); }, [infiniteLB]);
  useEffect(() => { infiniteCountRef.current = infiniteCount; }, [infiniteCount]);

  const bestInfinite = infiniteLB.filter(e => e.name === (playerName || "Anonymous")).reduce((m, e) => Math.max(m, e.boards), 0);

  // Timer
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => setElapsed(t => Math.min(t + 1, 999)), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Confetti
  const fireConfetti = useCallback(() => {
    const colors = CONFETTI_COLORS[theme] ?? CONFETTI_COLORS.dark;
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [theme]);
  useEffect(() => { if (status === "won") fireConfetti(); }, [status, fireConfetti]);

  // Screen shake on loss
  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 650);
  }, []);

  const saveInfiniteScore = useCallback((name: string, boards: number) => {
    if (!name || boards === 0) return;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
    setInfiniteLB(lb => [...lb, { name, boards, date: today }].sort((a, b) => b.boards - a.boards).slice(0, 20));
  }, []);

  const endInfiniteRun = useCallback(() => {
    if (infiniteMode && infiniteCountRef.current > 0)
      saveInfiniteScore(playerName || "Anonymous", infiniteCountRef.current);
  }, [infiniteMode, playerName, saveInfiniteScore]);

  const reset = useCallback(() => {
    endInfiniteRun();
    setBoard(createEmptyBoard());
    setStatus("idle");
    setFirstClick(true);
    setElapsed(0);
    setFlagCount(0);
    setInfiniteCount(0);
    infiniteCountRef.current = 0;
    everFlaggedRef.current = false;
    setTransitioning(false);
    setExitBoard(null);
  }, [endInfiniteRun]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "r" || e.key === "R") reset(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [reset]);

  const handleToggleInfinite = useCallback(() => {
    setInfiniteMode(prev => { localStorage.setItem("ms-infinite", String(!prev)); return !prev; });
    endInfiniteRun();
    setBoard(createEmptyBoard());
    setStatus("idle");
    setFirstClick(true);
    setElapsed(0);
    setFlagCount(0);
    setInfiniteCount(0);
    infiniteCountRef.current = 0;
    everFlaggedRef.current = false;
    setTransitioning(false);
    setExitBoard(null);
  }, [endInfiniteRun]);

  const triggerInfiniteTransition = useCallback((clearedBoard: CellState[][]) => {
    setExitBoard(clearedBoard);
    setBoard(createEmptyBoard());
    setFlagCount(0);
    setTransitioning(true);
    setStatus("transitioning");
    setTimeout(() => {
      setStatus("idle");
      setFirstClick(true);
      setElapsed(0);
      setTransitioning(false);
      setExitBoard(null);
      everFlaggedRef.current = false;
    }, 600);
  }, []);

  const handleWin = useCallback((revealed: CellState[][], time: number) => {
    const finished = revealed.map(row => row.map(cell => (cell.mine ? { ...cell, flagged: true } : cell)));
    setBoard(finished);
    setFlagCount(MINES);
    if (infiniteMode) {
      const newCount = infiniteCountRef.current + 1;
      setInfiniteCount(newCount);
      infiniteCountRef.current = newCount;
      checkAchievements({ waveCount: newCount });
      awardXP(15);
      awardBXP(25);
      // Daily: wave challenges
      advanceDailyChallenge("wave", 1);
      advanceBPQuest("wave", 1);
      triggerInfiniteTransition(finished);
    } else {
      setStatus("won");
      setCoins(c => c + COINS_PER_WIN);
      const xpEarned = getWinXP(time);
      const bxpEarned = getWinBXP(time);
      awardXP(xpEarned);
      awardBXP(bxpEarned);
      setStats((s: typeof stats) => {
        const newWins = s.wins + 1;
        const newBest = s.best === null || time < s.best ? time : s.best;
        checkAchievements({ wins: newWins, time, neverFlagged: !everFlaggedRef.current });
        return { games: s.games, wins: newWins, best: newBest };
      });
      // Daily & BP quest challenges for wins, speed, no_flags
      advanceDailyChallenge("wins", 1);
      advanceBPQuest("wins", 1);
      advanceDailyChallenge("speed", time);
      advanceBPQuest("speed", time);
      if (!everFlaggedRef.current) {
        advanceDailyChallenge("no_flags", 1);
        advanceBPQuest("no_flags", 1);
      }
    }
  }, [infiniteMode, checkAchievements, awardXP, awardBXP, triggerInfiniteTransition, advanceDailyChallenge, advanceBPQuest]);

  const handleReveal = useCallback((r: number, c: number) => {
    if (status === "won" || status === "lost" || status === "transitioning") return;
    const cell = board[r][c];
    if (cell.revealed || cell.flagged) return;
    let currentBoard = board;
    if (firstClick) {
      currentBoard = placeMines(board, r, c);
      setFirstClick(false);
      setStatus("playing");
      if (!infiniteMode) {
        setStats((s: typeof stats) => {
          const newGames = s.games + 1;
          checkAchievements({ games: newGames });
          // Daily & BP quest: games played
          advanceDailyChallenge("games", 1);
          advanceBPQuest("games", 1);
          return { ...s, games: newGames };
        });
      }
    }
    if (currentBoard[r][c].mine) {
      const exploded = currentBoard.map(row => row.map(cell => (cell.mine ? { ...cell, revealed: true } : { ...cell })));
      setBoard(exploded);
      setStatus("lost");
      triggerShake();
      endInfiniteRun();
      setInfiniteCount(0);
      infiniteCountRef.current = 0;
      return;
    }
    const revealed = floodReveal(currentBoard, r, c);
    // 1/50 chance: a key drops when clearing a tile
    if (Math.random() < 1 / 50) {
      setMiscKeys(k => k + 1);
      pushToast({ type: "keydrop", title: "Key Found! 🗝️", subtitle: "Use it to open any crate free" });
    }
    if (checkWin(revealed)) handleWin(revealed, elapsed);
    else setBoard(revealed);
  }, [board, status, firstClick, infiniteMode, elapsed, endInfiniteRun, handleWin, checkAchievements, triggerShake, advanceDailyChallenge, pushToast]);

  const handleFlag = useCallback((e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (status === "won" || status === "lost" || status === "transitioning") return;
    const cell = board[r][c];
    if (cell.revealed) return;
    const next = board.map(row => row.map(c => ({ ...c })));
    next[r][c].flagged = !next[r][c].flagged;
    setBoard(next);
    setFlagCount(f => (cell.flagged ? f - 1 : f + 1));
    if (!cell.flagged) everFlaggedRef.current = true;
  }, [board, status]);

  const handleChord = useCallback((r: number, c: number) => {
    if (status === "won" || status === "lost" || status === "transitioning") return;
    const cell = board[r][c];
    if (!cell.revealed || cell.adjacent === 0) return;
    let flags = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].flagged) flags++;
      }
    if (flags !== cell.adjacent) return;
    let currentBoard = board;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const neighbor = currentBoard[nr][nc];
        if (neighbor.revealed || neighbor.flagged) continue;
        if (neighbor.mine) {
          const boom = currentBoard.map(row => row.map(c => (c.mine ? { ...c, revealed: true } : { ...c })));
          setBoard(boom);
          setStatus("lost");
          triggerShake();
          endInfiniteRun();
          setInfiniteCount(0);
          infiniteCountRef.current = 0;
          return;
        }
        currentBoard = floodReveal(currentBoard, nr, nc);
      }
    // 1/50 chance: a key drops when chording clears tiles
    if (Math.random() < 1 / 50) {
      setMiscKeys(k => k + 1);
      pushToast({ type: "keydrop", title: "Key Found! 🗝️", subtitle: "Use it to open any crate free" });
    }
    if (checkWin(currentBoard)) handleWin(currentBoard, elapsed);
    else setBoard(currentBoard);
  }, [board, status, elapsed, endInfiniteRun, handleWin, triggerShake, pushToast]);

  const handleSaveName = useCallback((name: string) => {
    const trimmed = name.slice(0, 16);
    setPlayerName(trimmed);
    localStorage.setItem("ms-player", trimmed);
  }, []);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (mode === "flag") { handleFlag({ preventDefault: () => {} } as React.MouseEvent, r, c); return; }
    if (board[r][c].revealed) handleChord(r, c);
    else handleReveal(r, c);
  }, [mode, board, handleFlag, handleChord, handleReveal]);

  const handleCellContext = useCallback((e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (!("ontouchstart" in window)) handleFlag(e, r, c);
  }, [handleFlag]);

  const minesLeft = MINES - flagCount;
  const hasPending = pendingAchievements.length > 0;

  return (
    <>
    {!splashDone && <SplashScreen onPlay={handleSplashPlay} />}
    <div
      className="app"
      style={{
        opacity: gameFadingIn ? 1 : 0,
        transition: gameFadingIn ? "opacity 0.8s ease 0.35s" : "none",
      }}
    >
      {theme === "galaxy" && <GalaxyBackground />}
      {theme === "cyber"  && <CyberBackground  />}
      {theme === "void"   && <VoidBackground   />}
      {/* Top bar */}
      <div className="topbar">
        <button className="icon-btn menu-btn-wrap" onClick={() => setMenuOpen(true)} title="Menu" aria-label="Open menu">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="0" y1="1" x2="18" y2="1" />
            <line x1="0" y1="7" x2="18" y2="7" />
            <line x1="0" y1="13" x2="18" y2="13" />
          </svg>
          {(hasPending || dailyBadge) && <span className="menu-badge-dot" />}
        </button>

        <div className="top-counters">
          {infiniteMode ? (
            <>
              <div className="counter-box">
                <span className="counter-num infinite-wave-num">{infiniteCount}</span>
                <span className="counter-label">WAVE</span>
              </div>
              <div className="counter-divider" />
            </>
          ) : (
            <>
              <div className="counter-box">
                <span className="counter-num">{minesLeft}</span>
                <span className="counter-label">MINES</span>
              </div>
              <div className="counter-divider" />
            </>
          )}
          <div className="counter-box">
            <span className="counter-num">{String(elapsed).padStart(3, "0")}</span>
            <span className="counter-label">TIME</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="coin-counter">
            <CoinIcon size={14} />
            <span className="coin-amount">{coins}</span>
          </div>
          <button className="icon-btn" onClick={reset} title="New game" aria-label="New game">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.4.87 4.4 2.2"/>
              <polyline points="11 2 13.5 4.5 11 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* XP Bar */}
      <XPBar totalXP={totalXP} />

      {/* Banners */}
      {!infiniteMode && (status === "won" || status === "lost") && (
        <div className={`banner ${status}`}>
          {status === "won"
            ? <><span>YOU WIN!</span><span className="coin-earn"><CoinIcon size={13} />+{COINS_PER_WIN}</span><span className="xp-earn">+{getWinXP(elapsed)} XP</span><span className="xp-earn" style={{ color: "#f59e0b" }}>+{getWinBXP(elapsed)} BXP</span></>
            : "GAME OVER"}
          <button onClick={reset} className="play-again">Play Again</button>
        </div>
      )}
      {infiniteMode && status === "lost" && (
        <div className="banner lost">
          GAME OVER — {infiniteCountRef.current} board{infiniteCountRef.current !== 1 ? "s" : ""}
          <button onClick={reset} className="play-again">Try Again</button>
        </div>
      )}

      {/* Board */}
      <div className={`board-wrap${shaking ? " shaking" : ""}`}>
        <div className="board-clip" style={{ width: BOARD_W, height: BOARD_H }}>
          {transitioning && exitBoard && (
            <div className="board-pos board-exit">
              <BoardGrid board={exitBoard} flagContent={flagContent} interactive={false} />
            </div>
          )}
          <div className={`board-pos ${transitioning ? "board-enter" : ""}`}>
            <BoardGrid board={board} flagContent={flagContent}
              onCellClick={handleCellClick} onCellContext={handleCellContext}
              interactive={!transitioning} />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bottombar">
        <button className={`mode-btn${mode === "reveal" ? " active" : ""}`} onClick={() => setMode("reveal")}>DIG</button>
        <button className={`mode-btn${mode === "flag" ? " active" : ""}`} onClick={() => setMode("flag")}>FLAG</button>
      </div>

      {/* Toasts */}
      <ToastStack toasts={toasts} />

      {/* Modals */}
      <MenuPanel
        open={menuOpen} onClose={() => setMenuOpen(false)}
        stats={stats} playerName={playerName} onSaveName={handleSaveName}
        infiniteMode={infiniteMode} onToggleInfinite={handleToggleInfinite}
        bestInfinite={bestInfinite} coins={coins}
        onOpenShop={() => setShopOpen(true)}
        onOpenInventory={() => setInventoryOpen(true)}
        onOpenAchievements={() => setAchievementsOpen(true)}
        onOpenLevels={() => setLevelsOpen(true)}
        onOpenDaily={() => setDailyOpen(true)}
        onOpenBattlePass={() => setBPOpen(true)}
        onOpenFishing={() => setFishingOpen(true)}
        bpUnclaimedCount={BATTLE_PASS.filter(r => computeBPTier(totalBXP) >= r.tier && !bpClaimed.includes(r.tier) && (r.coins != null || r.keys != null || r.flagId != null || r.themeId != null)).length}
        pendingCount={pendingAchievements.length}
        currentLevel={currentLevel} totalXP={totalXP}
        dailyIncomplete={dailyBadge}
      />
      <BattlePassModal open={bpOpen} onClose={() => setBPOpen(false)}
        totalBXP={totalBXP} bpClaimed={bpClaimed} onClaim={handleBPClaim}
        bpQuestProgress={bpQuestProgress} bpQuestCompleted={bpQuestCompleted}
        onClaimQuest={handleClaimBPQuest} questResetAt={questResetAt} />
      <ShopModal open={shopOpen} onClose={() => { setShopOpen(false); setShopInitTab("themes"); }}
        coins={coins} ownedThemes={ownedThemes} ownedFlags={ownedFlags}
        onBuyTheme={handleBuyTheme} onBuyFlag={handleBuyFlag}
        onOpenCrate={(qty) => { setShopOpen(false); setCrateAutoOpen(qty); setCrateOpen(true); }}
        onOpenCrateWithKey={() => { setShopOpen(false); setCrateKeyOpen(true); setCrateOpen(true); }}
        miscKeys={miscKeys}
        defaultTab={shopInitTab} />
      <InventoryModal open={inventoryOpen} onClose={() => setInventoryOpen(false)}
        ownedThemes={ownedThemes} ownedFlags={ownedFlags}
        activeTheme={theme} activeFlag={activeFlag}
        onEquipTheme={handleEquipTheme} onEquipFlag={handleEquipFlag}
        ownedCrateItems={ownedCrateItems} miscKeys={miscKeys}
        fishInventory={fishInventory} />
      <FishingModal open={fishingOpen} onClose={() => setFishingOpen(false)}
        fishInventory={fishInventory} onCatch={handleCatchFish} />
      <CrateModal open={crateOpen} onClose={() => { setCrateOpen(false); setCrateAutoOpen(undefined); setCrateKeyOpen(false); setShopInitTab("crates"); setShopOpen(true); }}
        coins={coins} ownedCrateItems={ownedCrateItems}
        onPay={handleCratePay} onClaim={handleCrateClaim}
        autoOpen={crateAutoOpen} keyOpen={crateKeyOpen} miscKeys={miscKeys} onUseKey={handleUseKey} />
      <AchievementsModal open={achievementsOpen} onClose={() => setAchievementsOpen(false)}
        claimed={claimedAchievements} pending={pendingAchievements}
        onClaim={handleClaimAchievement} />
      <LevelsModal open={levelsOpen} onClose={() => setLevelsOpen(false)} totalXP={totalXP} />
      <DailyChallengesModal open={dailyOpen} onClose={() => setDailyOpen(false)}
        onViewed={handleViewedDaily}
        challenges={dailyChallenges} progress={dailyProgress}
        completed={dailyCompleted} bonusClaimed={dailyBonusClaimed} />
    </div>
    </>
  );
}
