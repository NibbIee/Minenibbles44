import { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";

const ROWS = 16;
const COLS = 9;
const MINES = 27;
const COINS_PER_WIN = 10;

const BOARD_W = COLS * 32 + (COLS - 1) * 3;
const BOARD_H = ROWS * 32 + (ROWS - 1) * 3;

// ── Shop data ──────────────────────────────────────────────────────────────────

const THEMES = [
  { id: "dark",  label: "Dark",  bg: "#000000", cell: "#3a3a3a", accent: "#4caf50", price: 0 },
  { id: "light", label: "Light", bg: "#f0f0f0", cell: "#bdbdbd", accent: "#4caf50", price: 0 },
  { id: "blue",  label: "Blue",  bg: "#060d1f", cell: "#112244", accent: "#4d9fff", price: 25 },
  { id: "green", label: "Green", bg: "#000000", cell: "#0a1a0a", accent: "#00e676", price: 25 },
  { id: "red",   label: "Red",   bg: "#0d0000", cell: "#2a0808", accent: "#ff4444", price: 25 },
  { id: "pink",  label: "Pink",  bg: "#110010", cell: "#2a0a22", accent: "#ff69b4", price: 25 },
];

const FLAGS = [
  { id: "default", label: "Classic",  emoji: "🚩", price: 0 },
  { id: "cat",     label: "Cat",      emoji: "🐱", price: 10 },
  { id: "red",     label: "Red",      emoji: "🔴", price: 10 },
  { id: "green",   label: "Green",    emoji: "🟢", price: 10 },
  { id: "blue",    label: "Blue",     emoji: "🔵", price: 10 },
  { id: "frog",    label: "Frog",     emoji: "🐸", price: 15 },
  { id: "dog",     label: "Dog",      emoji: "🐶", price: 15 },
  { id: "purple",  label: "Purple",   emoji: "🟣", price: 15 },
  { id: "yellow",  label: "Yellow",   emoji: "🟡", price: 15 },
  { id: "orange",  label: "Orange",   emoji: "🟠", price: 15 },
  { id: "bunny",   label: "Bunny",    emoji: "🐰", price: 20 },
  { id: "fox",     label: "Fox",      emoji: "🦊", price: 20 },
  { id: "star",    label: "Star",     emoji: "⭐", price: 30 },
  { id: "skull",   label: "Skull",    emoji: "💀", price: 40 },
  { id: "fire",    label: "Fire",     emoji: "🔥", price: 50 },
  { id: "mushroom",label: "Mushroom", emoji: "🍄", price: 60 },
  { id: "alien",   label: "Alien",    emoji: "👾", price: 75 },
  { id: "rainbow", label: "Rainbow",  emoji: "🌈", price: 100 },
];

const CONFETTI_COLORS: Record<string, string[]> = {
  dark:  ["#4caf50", "#81c784", "#ffffff", "#aaaaaa"],
  light: ["#4caf50", "#81c784", "#888888", "#cccccc"],
  blue:  ["#4d9fff", "#1a78ff", "#b0d0ff", "#ffffff"],
  green: ["#00e676", "#00c853", "#b9f6ca", "#69f0ae"],
  red:   ["#ff4444", "#cc0000", "#ff8888", "#ffcccc"],
  pink:  ["#ff69b4", "#ff1493", "#ffb6c1", "#ff80c0"],
};

// ── Achievements ───────────────────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  // Classic wins
  { id: "first_win",  title: "First Blood",    desc: "Win your first game",          reward: 10,  category: "Classic"   },
  { id: "wins_10",    title: "Getting Good",   desc: "Win 10 games",                 reward: 25,  category: "Classic"   },
  { id: "wins_50",    title: "Veteran",        desc: "Win 50 games",                 reward: 75,  category: "Classic"   },
  { id: "wins_100",   title: "Legend",         desc: "Win 100 games",                reward: 200, category: "Classic"   },
  { id: "no_flags",   title: "Naked Sweep",    desc: "Win without placing any flags", reward: 50, category: "Classic"   },
  // Speed
  { id: "speed_60",   title: "Speed Runner",   desc: "Win in under 60 seconds",      reward: 15,  category: "Speed"     },
  { id: "speed_30",   title: "Blazing Fast",   desc: "Win in under 30 seconds",      reward: 35,  category: "Speed"     },
  { id: "speed_15",   title: "Untouchable",    desc: "Win in under 15 seconds",      reward: 75,  category: "Speed"     },
  // General
  { id: "games_10",   title: "Newcomer",       desc: "Play 10 games",                reward: 5,   category: "General"   },
  { id: "games_50",   title: "Dedicated",      desc: "Play 50 games",                reward: 15,  category: "General"   },
  { id: "games_100",  title: "Obsessed",       desc: "Play 100 games",               reward: 30,  category: "General"   },
  // Infinite
  { id: "wave_5",     title: "Wave Surfer",    desc: "Reach Wave 5 in Infinite Mode",  reward: 15,  category: "Infinite" },
  { id: "wave_10",    title: "Wave Master",    desc: "Reach Wave 10 in Infinite Mode", reward: 35,  category: "Infinite" },
  { id: "wave_25",    title: "Endless",        desc: "Reach Wave 25 in Infinite Mode", reward: 100, category: "Infinite" },
  { id: "wave_50",    title: "Unstoppable",    desc: "Reach Wave 50 in Infinite Mode", reward: 250, category: "Infinite" },
  // Collector
  { id: "flags_5",    title: "Flag Collector", desc: "Own 5 different flags",         reward: 20,  category: "Collector" },
  { id: "flags_all",  title: "Flag Master",    desc: "Own all flags",                 reward: 100, category: "Collector" },
  { id: "themes_all", title: "Art Director",   desc: "Own all themes",                reward: 75,  category: "Collector" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type CellState = { mine: boolean; revealed: boolean; flagged: boolean; adjacent: number };
type GameStatus = "idle" | "playing" | "won" | "lost" | "transitioning";

interface AchievementToastItem { id: string; title: string; reward: number; key: number }

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
  for (let r = 0; r < ROWS; r++) {
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
    for (let r = 0; r < ROWS; r++) {
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

// ── Coin icon SVG ─────────────────────────────────────────────────────────────

function CoinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6.5" fill="#c89a1a" stroke="#ffd700" strokeWidth="1"/>
      <text x="7" y="10.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffd700" fontFamily="Arial, sans-serif">C</text>
    </svg>
  );
}

// ── Achievement Toast ──────────────────────────────────────────────────────────

function AchievementToastStack({ toasts }: { toasts: AchievementToastItem[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.key} className="achievement-toast">
          <div className="toast-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8.5" fill="#6d28d9" stroke="#a78bfa" strokeWidth="1"/>
              <text x="9" y="13" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">★</text>
            </svg>
          </div>
          <div className="toast-body">
            <span className="toast-label">Achievement Unlocked</span>
            <span className="toast-title">{t.title}</span>
          </div>
          <span className="toast-reward"><CoinIcon size={13} />+{t.reward}</span>
        </div>
      ))}
    </div>
  );
}

// ── BoardGrid ─────────────────────────────────────────────────────────────────

function BoardGrid({
  board,
  flagEmoji,
  onCellClick,
  onCellContext,
  interactive,
}: {
  board: CellState[][];
  flagEmoji: string;
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
            if (cell.mine) {
              content = <span className="mine-marker">✕</span>;
              cellClass += " mine";
            } else if (cell.adjacent > 0)
              content = <span className={`number n${cell.adjacent}`}>{cell.adjacent}</span>;
          } else if (cell.flagged) {
            cellClass += " flagged";
            content = <span className="flag-emoji">{flagEmoji}</span>;
          }
          return (
            <div
              key={`${r}-${c}`}
              className={cellClass}
              onClick={() => onCellClick?.(r, c)}
              onContextMenu={(e) => onCellContext?.(e, r, c)}
            >
              {content}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Achievements Modal ─────────────────────────────────────────────────────────

function AchievementsModal({
  open, onClose, claimed, pending, onClaim,
}: {
  open: boolean;
  onClose: () => void;
  claimed: string[];
  pending: string[];
  onClaim: (id: string) => void;
}) {
  const [tab, setTab] = useState<"Classic" | "Speed" | "Infinite" | "General" | "Collector">("Classic");
  if (!open) return null;

  const categories = ["Classic", "Speed", "Infinite", "General", "Collector"] as const;
  const filtered = ACHIEVEMENTS.filter((a) => a.category === tab);
  const totalPending = pending.length;

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="menu-handle" />
        <div className="shop-header">
          <span className="shop-title">ACHIEVEMENTS</span>
          {totalPending > 0 && (
            <span className="ach-claim-badge">{totalPending} to claim</span>
          )}
        </div>

        <div className="ach-cat-tabs">
          {categories.map((cat) => {
            const catPending = ACHIEVEMENTS.filter(
              (a) => a.category === cat && pending.includes(a.id)
            ).length;
            return (
              <button
                key={cat}
                className={`ach-cat-tab${tab === cat ? " active" : ""}`}
                onClick={() => setTab(cat)}
              >
                {cat}
                {catPending > 0 && <span className="ach-cat-dot" />}
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
                  {isClaimed ? (
                    <span className="ach-done">Claimed</span>
                  ) : isPending ? (
                    <button className="ach-claim-btn" onClick={() => onClaim(a.id)}>
                      <CoinIcon size={12} />&nbsp;+{a.reward}
                    </button>
                  ) : (
                    <span className="ach-reward-label"><CoinIcon size={11} />&nbsp;{a.reward}</span>
                  )}
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

function MenuPanel({
  open, onClose, stats,
  playerName, onSaveName,
  infiniteMode, onToggleInfinite, bestInfinite,
  coins, onOpenShop, onOpenInventory, onOpenAchievements,
  pendingCount,
}: {
  open: boolean; onClose: () => void;
  stats: { wins: number; games: number; best: number | null };
  playerName: string; onSaveName: (name: string) => void;
  infiniteMode: boolean; onToggleInfinite: () => void; bestInfinite: number;
  coins: number; onOpenShop: () => void; onOpenInventory: () => void;
  onOpenAchievements: () => void;
  pendingCount: number;
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

        {/* Quick-access buttons */}
        <div className="menu-actions">
          <button className="menu-action-btn" onClick={() => { onClose(); onOpenShop(); }}>
            <span className="menu-action-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 2h2l1.5 7.5h8l1.5-5H5.5"/>
                <circle cx="8" cy="15" r="1"/>
                <circle cx="13" cy="15" r="1"/>
              </svg>
            </span>
            <span className="menu-action-label">SHOP</span>
            <span className="menu-action-coins"><CoinIcon size={13} /><span>{coins}</span></span>
            <span className="menu-action-arrow">›</span>
          </button>
          <button className="menu-action-btn" onClick={() => { onClose(); onOpenInventory(); }}>
            <span className="menu-action-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="14" height="10" rx="2"/>
                <path d="M6 6V4a3 3 0 0 1 6 0v2"/>
                <line x1="9" y1="10" x2="9" y2="13"/>
                <line x1="7.5" y1="11.5" x2="10.5" y2="11.5"/>
              </svg>
            </span>
            <span className="menu-action-label">INVENTORY</span>
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
        </div>

        <div className="menu-divider" />

        <div className="menu-name-row">
          <span className="menu-name-label">PLAYER</span>
          <div className="menu-name-field">
            <input
              ref={inputRef} className="menu-name-input" value={nameInput}
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

function ShopModal({
  open, onClose, coins, ownedThemes, ownedFlags, onBuyTheme, onBuyFlag,
}: {
  open: boolean; onClose: () => void; coins: number;
  ownedThemes: string[]; ownedFlags: string[];
  onBuyTheme: (id: string) => void; onBuyFlag: (id: string) => void;
}) {
  const [tab, setTab] = useState<"themes" | "flags">("themes");
  if (!open) return null;

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
        </div>

        {tab === "themes" && (
          <div className="shop-grid">
            {THEMES.map((t) => {
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
                  {owned ? (
                    <span className="shop-owned-badge">Owned</span>
                  ) : (
                    <button
                      className={`shop-buy-btn${canAfford ? "" : " cant-afford"}`}
                      onClick={() => onBuyTheme(t.id)}
                      disabled={!canAfford}
                    >
                      <CoinIcon size={11} /> {t.price}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "flags" && (
          <div className="shop-grid">
            {FLAGS.map((f) => {
              const owned = ownedFlags.includes(f.id);
              const canAfford = coins >= f.price;
              return (
                <div key={f.id} className={`shop-card${owned ? " owned" : ""}`}>
                  <div className="flag-preview">{f.emoji}</div>
                  <span className="shop-card-label">{f.label}</span>
                  {owned ? (
                    <span className="shop-owned-badge">Owned</span>
                  ) : (
                    <button
                      className={`shop-buy-btn${canAfford ? "" : " cant-afford"}`}
                      onClick={() => onBuyFlag(f.id)}
                      disabled={!canAfford}
                    >
                      <CoinIcon size={11} /> {f.price}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── InventoryModal ────────────────────────────────────────────────────────────

function InventoryModal({
  open, onClose, ownedThemes, ownedFlags, activeTheme, activeFlag,
  onEquipTheme, onEquipFlag,
}: {
  open: boolean; onClose: () => void;
  ownedThemes: string[]; ownedFlags: string[];
  activeTheme: string; activeFlag: string;
  onEquipTheme: (id: string) => void; onEquipFlag: (id: string) => void;
}) {
  const [tab, setTab] = useState<"themes" | "flags">("themes");
  if (!open) return null;

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
        </div>

        {tab === "themes" && (
          <div className="shop-grid">
            {THEMES.filter((t) => ownedThemes.includes(t.id)).map((t) => {
              const active = activeTheme === t.id;
              return (
                <button
                  key={t.id}
                  className={`shop-card inv-card${active ? " inv-active" : ""}`}
                  onClick={() => onEquipTheme(t.id)}
                >
                  <div className="theme-swatch" style={{ background: t.bg }}>
                    <div className="theme-swatch-cell" style={{ background: t.cell }} />
                    <div className="theme-swatch-cell" style={{ background: t.cell }} />
                    <div className="theme-swatch-accent" style={{ background: t.accent }} />
                  </div>
                  <span className="shop-card-label">{t.label}</span>
                  {active && <span className="inv-check">✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {tab === "flags" && (
          <div className="shop-grid">
            {FLAGS.filter((f) => ownedFlags.includes(f.id)).map((f) => {
              const active = activeFlag === f.id;
              return (
                <button
                  key={f.id}
                  className={`shop-card inv-card${active ? " inv-active" : ""}`}
                  onClick={() => onEquipFlag(f.id)}
                >
                  <div className="flag-preview">{f.emoji}</div>
                  <span className="shop-card-label">{f.label}</span>
                  {active && <span className="inv-check">✓</span>}
                </button>
              );
            })}
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

  // Track if any flag was placed this game (for no_flags achievement)
  const everFlaggedRef = useRef(false);

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

  const flagEmoji = FLAGS.find((f) => f.id === activeFlag)?.emoji ?? "🚩";

  // ── Achievements state ──────────────────────────────────────────────────────

  const [claimedAchievements, setClaimedAchievements] = useState<string[]>(() => {
    const s = localStorage.getItem("ms-claimed-achievements");
    return s ? JSON.parse(s) : [];
  });
  const [pendingAchievements, setPendingAchievements] = useState<string[]>(() => {
    const s = localStorage.getItem("ms-pending-achievements");
    return s ? JSON.parse(s) : [];
  });
  const [toasts, setToasts] = useState<AchievementToastItem[]>([]);
  const toastKeyRef = useRef(0);

  useEffect(() => { localStorage.setItem("ms-claimed-achievements", JSON.stringify(claimedAchievements)); }, [claimedAchievements]);
  useEffect(() => { localStorage.setItem("ms-pending-achievements", JSON.stringify(pendingAchievements)); }, [pendingAchievements]);

  // Show toast + mark pending for a list of newly unlocked achievement IDs
  const unlockAchievements = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setPendingAchievements((prev) => {
      const toAdd = ids.filter((id) => !prev.includes(id));
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
    // Queue toasts
    ids.forEach((id, i) => {
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return;
      const key = ++toastKeyRef.current;
      setTimeout(() => {
        setToasts((t) => [...t, { id, title: def.title, reward: def.reward, key }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 3500);
      }, i * 600);
    });
  }, []);

  // Claim a pending achievement → give coins, move to claimed
  const handleClaimAchievement = useCallback((id: string) => {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return;
    setPendingAchievements((prev) => prev.filter((x) => x !== id));
    setClaimedAchievements((prev) => [...prev, id]);
    setCoins((c) => c + def.reward);
  }, []);

  // Check achievements given current snapshot of stats + game data
  const checkAchievements = useCallback((opts: {
    wins?: number;
    games?: number;
    time?: number;
    neverFlagged?: boolean;
    waveCount?: number;
    ownedFlagsCount?: number;
    allFlagsOwned?: boolean;
    allThemesOwned?: boolean;
  }) => {
    setPendingAchievements((pending) => {
      setClaimedAchievements((claimed) => {
        const newIds: string[] = [];
        const has = (id: string) => claimed.includes(id) || pending.includes(id) || newIds.includes(id);

        const { wins, games, time, neverFlagged, waveCount, ownedFlagsCount, allFlagsOwned, allThemesOwned } = opts;

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
        if (ownedFlagsCount !== undefined) {
          if (ownedFlagsCount >= 5 && !has("flags_5")) newIds.push("flags_5");
        }
        if (allFlagsOwned && !has("flags_all")) newIds.push("flags_all");
        if (allThemesOwned && !has("themes_all")) newIds.push("themes_all");

        if (newIds.length > 0) unlockAchievements(newIds);
        return claimed; // no change to claimed here
      });
      return pending; // no change to pending here (unlockAchievements handles it)
    });
  }, [unlockAchievements]);

  // ── Shop handlers ───────────────────────────────────────────────────────────

  const handleBuyTheme = useCallback((id: string) => {
    const t = THEMES.find((t) => t.id === id);
    if (!t || ownedThemes.includes(id) || coins < t.price) return;
    setCoins((c) => c - t.price);
    setOwnedThemes((prev) => {
      const next = [...prev, id];
      const allOwned = THEMES.every((th) => next.includes(th.id));
      setTimeout(() => checkAchievements({ allThemesOwned: allOwned }), 0);
      return next;
    });
  }, [coins, ownedThemes, checkAchievements]);

  const handleBuyFlag = useCallback((id: string) => {
    const f = FLAGS.find((f) => f.id === id);
    if (!f || ownedFlags.includes(id) || coins < f.price) return;
    setCoins((c) => c - f.price);
    setOwnedFlags((prev) => {
      const next = [...prev, id];
      const allOwned = FLAGS.every((fl) => next.includes(fl.id));
      setTimeout(() => checkAchievements({ ownedFlagsCount: next.length, allFlagsOwned: allOwned }), 0);
      return next;
    });
  }, [coins, ownedFlags, checkAchievements]);

  const handleEquipTheme = useCallback((id: string) => {
    setTheme(id);
    setInventoryOpen(false);
  }, []);

  const handleEquipFlag = useCallback((id: string) => {
    setActiveFlag(id);
    setInventoryOpen(false);
  }, []);

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

  const bestInfinite = infiniteLB
    .filter((e) => e.name === (playerName || "Anonymous"))
    .reduce((m, e) => Math.max(m, e.boards), 0);

  // Timer
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => setElapsed((t) => Math.min(t + 1, 999)), 1000);
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

  useEffect(() => {
    if (status === "won") fireConfetti();
  }, [status, fireConfetti]);

  const saveInfiniteScore = useCallback((name: string, boards: number) => {
    if (!name || boards === 0) return;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
    setInfiniteLB((lb) => [...lb, { name, boards, date: today }].sort((a, b) => b.boards - a.boards).slice(0, 20));
  }, []);

  const endInfiniteRun = useCallback(() => {
    if (infiniteMode && infiniteCountRef.current > 0)
      saveInfiniteScore(playerName || "Anonymous", infiniteCountRef.current);
  }, [infiniteMode, playerName, saveInfiniteScore]);

  // Reset
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
    setInfiniteMode((prev) => {
      localStorage.setItem("ms-infinite", String(!prev));
      return !prev;
    });
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

  // Win handler
  const handleWin = useCallback((revealed: CellState[][], time: number) => {
    const finished = revealed.map((row) => row.map((cell) => (cell.mine ? { ...cell, flagged: true } : cell)));
    setBoard(finished);
    setFlagCount(MINES);
    if (infiniteMode) {
      const newCount = infiniteCountRef.current + 1;
      setInfiniteCount(newCount);
      infiniteCountRef.current = newCount;
      // Check wave achievements
      checkAchievements({ waveCount: newCount });
      triggerInfiniteTransition(finished);
    } else {
      setStatus("won");
      setCoins((c) => c + COINS_PER_WIN);
      setStats((s: typeof stats) => {
        const newWins = s.wins + 1;
        const newBest = s.best === null || time < s.best ? time : s.best;
        // Check win/speed/no-flags achievements
        checkAchievements({
          wins: newWins,
          time,
          neverFlagged: !everFlaggedRef.current,
        });
        return { games: s.games, wins: newWins, best: newBest };
      });
    }
  }, [infiniteMode, checkAchievements, triggerInfiniteTransition]);

  // Handle reveal
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
          return { ...s, games: newGames };
        });
      }
    }
    if (currentBoard[r][c].mine) {
      const exploded = currentBoard.map((row) => row.map((cell) => (cell.mine ? { ...cell, revealed: true } : { ...cell })));
      setBoard(exploded);
      setStatus("lost");
      endInfiniteRun();
      setInfiniteCount(0);
      infiniteCountRef.current = 0;
      return;
    }
    const revealed = floodReveal(currentBoard, r, c);
    if (checkWin(revealed)) {
      handleWin(revealed, elapsed);
    } else {
      setBoard(revealed);
    }
  }, [board, status, firstClick, infiniteMode, elapsed, endInfiniteRun, handleWin, checkAchievements]);

  // Handle flag
  const handleFlag = useCallback((e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (status === "won" || status === "lost" || status === "transitioning") return;
    const cell = board[r][c];
    if (cell.revealed) return;
    const next = board.map((row) => row.map((c) => ({ ...c })));
    next[r][c].flagged = !next[r][c].flagged;
    setBoard(next);
    setFlagCount((f) => (cell.flagged ? f - 1 : f + 1));
    if (!cell.flagged) everFlaggedRef.current = true; // placing a flag
  }, [board, status]);

  // Handle chord
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
          const boom = currentBoard.map((row) => row.map((c) => (c.mine ? { ...c, revealed: true } : { ...c })));
          setBoard(boom);
          setStatus("lost");
          endInfiniteRun();
          setInfiniteCount(0);
          infiniteCountRef.current = 0;
          return;
        }
        currentBoard = floodReveal(currentBoard, nr, nc);
      }
    if (checkWin(currentBoard)) {
      handleWin(currentBoard, elapsed);
    } else {
      setBoard(currentBoard);
    }
  }, [board, status, elapsed, endInfiniteRun, handleWin]);

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
    <div className="app">
      {/* Top bar */}
      <div className="topbar">
        <button className="icon-btn menu-btn-wrap" onClick={() => setMenuOpen(true)} title="Menu" aria-label="Open menu">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="0" y1="1" x2="18" y2="1" />
            <line x1="0" y1="7" x2="18" y2="7" />
            <line x1="0" y1="13" x2="18" y2="13" />
          </svg>
          {hasPending && <span className="menu-badge-dot" />}
        </button>

        <div className="top-counters">
          {infiniteMode && (
            <>
              <div className="counter-box">
                <span className="counter-num infinite-wave-num">{infiniteCount}</span>
                <span className="counter-label">WAVE</span>
              </div>
              <div className="counter-divider" />
            </>
          )}
          <div className="counter-box">
            <span className="counter-num">{minesLeft}</span>
            <span className="counter-label">MINES</span>
          </div>
          <div className="counter-divider" />
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

      {/* Banners */}
      {!infiniteMode && (status === "won" || status === "lost") && (
        <div className={`banner ${status}`}>
          {status === "won"
            ? <><span>YOU WIN!</span><span className="coin-earn"><CoinIcon size={13} />+{COINS_PER_WIN}</span></>
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
      <div className="board-wrap">
        <div className="board-clip" style={{ width: BOARD_W, height: BOARD_H }}>
          {transitioning && exitBoard && (
            <div className="board-pos board-exit">
              <BoardGrid board={exitBoard} flagEmoji={flagEmoji} interactive={false} />
            </div>
          )}
          <div className={`board-pos ${transitioning ? "board-enter" : ""}`}>
            <BoardGrid
              board={board}
              flagEmoji={flagEmoji}
              onCellClick={handleCellClick}
              onCellContext={handleCellContext}
              interactive={!transitioning}
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bottombar">
        <button className={`mode-btn${mode === "reveal" ? " active" : ""}`} onClick={() => setMode("reveal")}>DIG</button>
        <button className={`mode-btn${mode === "flag" ? " active" : ""}`} onClick={() => setMode("flag")}>FLAG</button>
      </div>

      {/* Achievement toasts */}
      <AchievementToastStack toasts={toasts} />

      {/* Modals */}
      <MenuPanel
        open={menuOpen} onClose={() => setMenuOpen(false)}
        stats={stats}
        playerName={playerName} onSaveName={handleSaveName}
        infiniteMode={infiniteMode} onToggleInfinite={handleToggleInfinite}
        bestInfinite={bestInfinite}
        coins={coins}
        onOpenShop={() => setShopOpen(true)}
        onOpenInventory={() => setInventoryOpen(true)}
        onOpenAchievements={() => setAchievementsOpen(true)}
        pendingCount={pendingAchievements.length}
      />
      <ShopModal
        open={shopOpen} onClose={() => setShopOpen(false)}
        coins={coins} ownedThemes={ownedThemes} ownedFlags={ownedFlags}
        onBuyTheme={handleBuyTheme} onBuyFlag={handleBuyFlag}
      />
      <InventoryModal
        open={inventoryOpen} onClose={() => setInventoryOpen(false)}
        ownedThemes={ownedThemes} ownedFlags={ownedFlags}
        activeTheme={theme} activeFlag={activeFlag}
        onEquipTheme={handleEquipTheme} onEquipFlag={handleEquipFlag}
      />
      <AchievementsModal
        open={achievementsOpen} onClose={() => setAchievementsOpen(false)}
        claimed={claimedAchievements}
        pending={pendingAchievements}
        onClaim={handleClaimAchievement}
      />
    </div>
  );
}
