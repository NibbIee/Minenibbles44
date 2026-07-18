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
];

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
  // Crate-exclusive emoji flags (levelReq 99 = never shown in shop)
  { id: "crate-carrot",   label: "Carrot",    emoji: "🥕", price: 0, levelReq: 99 },
  { id: "crate-broccoli", label: "Broccoli",  emoji: "🥦", price: 0, levelReq: 99 },
  { id: "crate-wheat",    label: "Wheat",     emoji: "🌾", price: 0, levelReq: 99 },
  { id: "crate-clover",   label: "Four-Leaf", emoji: "🍀", price: 0, levelReq: 99 },
  { id: "crate-wave",     label: "Wave",      emoji: "🌊", price: 0, levelReq: 99 },
  { id: "crate-cherry",   label: "Cherry",    emoji: "🍒", price: 0, levelReq: 99 },
  { id: "crate-target",   label: "Target",    emoji: "🎯", price: 0, levelReq: 99 },
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
  type: "achievement" | "levelup" | "daily" | "keydrop";
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
                      <span className="lvl-reward-emoji">{reward.flagEmoji}</span>
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

// ── MenuPanel ─────────────────────────────────────────────────────────────────
function MenuPanel({ open, onClose, stats, playerName, onSaveName, infiniteMode, onToggleInfinite,
  bestInfinite, coins, onOpenShop, onOpenInventory, onOpenAchievements, onOpenLevels, onOpenDaily,
  pendingCount, currentLevel, totalXP, dailyIncomplete }: {
  open: boolean; onClose: () => void;
  stats: { wins: number; games: number; best: number | null };
  playerName: string; onSaveName: (name: string) => void;
  infiniteMode: boolean; onToggleInfinite: () => void; bestInfinite: number;
  coins: number; onOpenShop: () => void; onOpenInventory: () => void;
  onOpenAchievements: () => void; onOpenLevels: () => void; onOpenDaily: () => void;
  pendingCount: number; currentLevel: number; totalXP: number;
  dailyIncomplete: boolean;
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
  const shopThemes = THEMES.filter(t => t.levelReq === 0);
  const shopFlags = FLAGS.filter(f => f.levelReq === 0);

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
                  <div className="flag-preview">{f.emoji}</div>
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
function InventoryModal({ open, onClose, ownedThemes, ownedFlags, activeTheme, activeFlag, onEquipTheme, onEquipFlag, ownedCrateItems, miscKeys }: {
  open: boolean; onClose: () => void;
  ownedThemes: string[]; ownedFlags: string[];
  activeTheme: string; activeFlag: string;
  onEquipTheme: (id: string) => void; onEquipFlag: (id: string) => void;
  ownedCrateItems: string[];
  miscKeys: number;
}) {
  const [tab, setTab] = useState<"themes" | "flags" | "misc">("themes");
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
                      <div className="flag-preview">{f.emoji}</div>
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
  const [crateOpen,     setCrateOpen]     = useState(false);
  const [crateAutoOpen, setCrateAutoOpen] = useState<1 | 3 | undefined>(undefined);
  const [crateKeyOpen,  setCrateKeyOpen]  = useState(false);
  const [shopInitTab,   setShopInitTab]   = useState<"themes" | "flags" | "crates">("themes");
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
            setTimeout(() => pushToast({ type: "daily", title: c.title, subtitle: c.desc }), 200);
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
                setTimeout(() => pushToast({ type: "daily", title: "All Dailies Complete!", subtitle: "+25 coins · +20 XP", reward: 25 }), 600);
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
  }, [pushToast]);

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
      // Daily: wave challenges
      advanceDailyChallenge("wave", 1);
      triggerInfiniteTransition(finished);
    } else {
      setStatus("won");
      setCoins(c => c + COINS_PER_WIN);
      const xpEarned = getWinXP(time);
      awardXP(xpEarned);
      setStats((s: typeof stats) => {
        const newWins = s.wins + 1;
        const newBest = s.best === null || time < s.best ? time : s.best;
        checkAchievements({ wins: newWins, time, neverFlagged: !everFlaggedRef.current });
        return { games: s.games, wins: newWins, best: newBest };
      });
      // Daily challenges for wins and speed
      advanceDailyChallenge("wins", 1);
      if (time < 60) advanceDailyChallenge("speed", time);
      if (!everFlaggedRef.current) advanceDailyChallenge("no_flags", 1);
    }
  }, [infiniteMode, checkAchievements, awardXP, triggerInfiniteTransition, advanceDailyChallenge]);

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
          // Daily: games played
          advanceDailyChallenge("games", 1);
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
            ? <><span>YOU WIN!</span><span className="coin-earn"><CoinIcon size={13} />+{COINS_PER_WIN}</span><span className="xp-earn">+{getWinXP(elapsed)} XP</span></>
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
        pendingCount={pendingAchievements.length}
        currentLevel={currentLevel} totalXP={totalXP}
        dailyIncomplete={dailyBadge}
      />
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
        ownedCrateItems={ownedCrateItems} miscKeys={miscKeys} />
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
