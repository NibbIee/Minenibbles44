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

// ── Types ─────────────────────────────────────────────────────────────────────

type CellState = { mine: boolean; revealed: boolean; flagged: boolean; adjacent: number };
type GameStatus = "idle" | "playing" | "won" | "lost" | "transitioning";
type LeaderEntry = { name: string; wins: number; games: number; best: number | null };
type InfiniteEntry = { name: string; boards: number; date: string };

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

// ── Rank label (no medals) ────────────────────────────────────────────────────

function RankLabel({ index }: { index: number }) {
  const rankColors = ["#ffd700", "#c0c0c0", "#cd7f32"];
  if (index < 3) {
    return (
      <span className="lb-rank-num" style={{ color: rankColors[index] }}>
        {index + 1}
      </span>
    );
  }
  return <span className="lb-rank-num lb-rank-plain">{index + 1}</span>;
}

// ── MenuPanel ─────────────────────────────────────────────────────────────────

function MenuPanel({
  open, onClose, stats, leaderboard, infiniteLB, playerName, onSaveName,
  infiniteMode, onToggleInfinite, bestInfinite,
  coins, onOpenShop, onOpenInventory,
}: {
  open: boolean; onClose: () => void;
  stats: { wins: number; games: number; best: number | null };
  leaderboard: LeaderEntry[]; infiniteLB: InfiniteEntry[];
  playerName: string; onSaveName: (name: string) => void;
  infiniteMode: boolean; onToggleInfinite: () => void; bestInfinite: number;
  coins: number; onOpenShop: () => void; onOpenInventory: () => void;
}) {
  const [nameInput, setNameInput] = useState(playerName);
  const [tab, setTab] = useState<"stats" | "classic" | "infinite">("stats");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setNameInput(playerName); }, [open, playerName]);

  const winRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;
  if (!open) return null;

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="menu-handle" />

        {/* Shop & Inventory quick-access */}
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

        <div className="menu-tabs">
          <button className={`menu-tab${tab === "stats" ? " active" : ""}`} onClick={() => setTab("stats")}>STATS</button>
          <button className={`menu-tab${tab === "classic" ? " active" : ""}`} onClick={() => setTab("classic")}>CLASSIC</button>
          <button className={`menu-tab${tab === "infinite" ? " active" : ""}`} onClick={() => setTab("infinite")}>INFINITE</button>
        </div>

        {tab === "stats" && (
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
        )}

        {tab === "classic" && (
          <div className="menu-leaderboard">
            {leaderboard.length === 0 ? (
              <p className="lb-empty">No entries yet. Win a game to appear!</p>
            ) : (
              <table className="lb-table">
                <thead><tr><th>#</th><th>Name</th><th>Wins</th><th>Rate</th><th>Best</th></tr></thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr key={entry.name} className={entry.name === playerName ? "lb-me" : ""}>
                      <td className="lb-rank"><RankLabel index={i} /></td>
                      <td className="lb-name">{entry.name}</td>
                      <td className="lb-wins">{entry.wins}</td>
                      <td className="lb-rate">{entry.games > 0 ? Math.round((entry.wins / entry.games) * 100) : 0}%</td>
                      <td className="lb-best">{fmtTime(entry.best)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "infinite" && (
          <div className="menu-leaderboard">
            {infiniteLB.length === 0 ? (
              <p className="lb-empty">No runs yet. Enable Infinite Mode and survive as long as you can!</p>
            ) : (
              <table className="lb-table">
                <thead><tr><th>#</th><th>Name</th><th>Boards</th><th>Date</th></tr></thead>
                <tbody>
                  {infiniteLB.map((entry, i) => (
                    <tr key={`${entry.name}-${i}`} className={entry.name === playerName ? "lb-me" : ""}>
                      <td className="lb-rank"><RankLabel index={i} /></td>
                      <td className="lb-name">{entry.name}</td>
                      <td className="lb-wins" style={{ color: "#a78bfa" }}>{entry.boards}</td>
                      <td className="lb-rate">{entry.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
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

  const handleBuyTheme = useCallback((id: string) => {
    const t = THEMES.find((t) => t.id === id);
    if (!t || ownedThemes.includes(id) || coins < t.price) return;
    setCoins((c) => c - t.price);
    setOwnedThemes((prev) => [...prev, id]);
  }, [coins, ownedThemes]);

  const handleBuyFlag = useCallback((id: string) => {
    const f = FLAGS.find((f) => f.id === id);
    if (!f || ownedFlags.includes(id) || coins < f.price) return;
    setCoins((c) => c - f.price);
    setOwnedFlags((prev) => [...prev, id]);
  }, [coins, ownedFlags]);

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
  const [infiniteLB, setInfiniteLB] = useState<InfiniteEntry[]>(() => {
    const s = localStorage.getItem("ms-infinite-lb");
    return s ? JSON.parse(s) : [];
  });

  const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem("ms-player") || "");
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem("ms-stats");
    return saved ? JSON.parse(saved) : { games: 0, wins: 0, best: null as number | null };
  });
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>(() => {
    const saved = localStorage.getItem("ms-leaderboard");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem("ms-stats", JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem("ms-leaderboard", JSON.stringify(leaderboard)); }, [leaderboard]);
  useEffect(() => { localStorage.setItem("ms-infinite-lb", JSON.stringify(infiniteLB)); }, [infiniteLB]);
  useEffect(() => { infiniteCountRef.current = infiniteCount; }, [infiniteCount]);

  // Timer
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => setElapsed((t) => Math.min(t + 1, 999)), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Confetti — colors match active theme
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

  // Leaderboard helpers
  const updateLeaderboard = useCallback((name: string, won: boolean, time: number) => {
    if (!name) return;
    setLeaderboard((lb) => {
      const existing = lb.find((e) => e.name === name);
      let updated: LeaderEntry[];
      if (existing) {
        updated = lb.map((e) => e.name === name
          ? { ...e, wins: won ? e.wins + 1 : e.wins, games: e.games + 1, best: won ? (e.best === null || time < e.best ? time : e.best) : e.best }
          : e);
      } else {
        updated = [...lb, { name, wins: won ? 1 : 0, games: 1, best: won ? time : null }];
      }
      return updated.sort((a, b) => b.wins - a.wins);
    });
  }, []);

  const saveInfiniteScore = useCallback((name: string, boards: number) => {
    if (!name || boards === 0) return;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
    setInfiniteLB((lb) => [...lb, { name, boards, date: today }].sort((a, b) => b.boards - a.boards).slice(0, 20));
  }, []);

  const bestInfinite = infiniteLB.filter((e) => e.name === (playerName || "Anonymous")).reduce((m, e) => Math.max(m, e.boards), 0);

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
      triggerInfiniteTransition(finished);
    } else {
      setStatus("won");
      setCoins((c) => c + COINS_PER_WIN);
      setStats((s: typeof stats) => ({ games: s.games, wins: s.wins + 1, best: s.best === null || time < s.best ? time : s.best }));
      updateLeaderboard(playerName || "Anonymous", true, time);
    }
  }, [infiniteMode, playerName, updateLeaderboard, triggerInfiniteTransition]);

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
      if (!infiniteMode) setStats((s: typeof stats) => ({ ...s, games: s.games + 1 }));
    }
    if (currentBoard[r][c].mine) {
      const exploded = currentBoard.map((row) => row.map((cell) => (cell.mine ? { ...cell, revealed: true } : { ...cell })));
      setBoard(exploded);
      setStatus("lost");
      if (!infiniteMode) updateLeaderboard(playerName || "Anonymous", false, elapsed);
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
  }, [board, status, firstClick, infiniteMode, playerName, elapsed, updateLeaderboard, endInfiniteRun, handleWin]);

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
          if (!infiniteMode) updateLeaderboard(playerName || "Anonymous", false, elapsed);
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
  }, [board, status, infiniteMode, playerName, elapsed, updateLeaderboard, endInfiniteRun, handleWin]);

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

  return (
    <div className="app">
      {/* Top bar */}
      <div className="topbar">
        <button className="icon-btn" onClick={() => setMenuOpen(true)} title="Menu" aria-label="Open menu">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="0" y1="1" x2="18" y2="1" />
            <line x1="0" y1="7" x2="18" y2="7" />
            <line x1="0" y1="13" x2="18" y2="13" />
          </svg>
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

      {/* Modals */}
      <MenuPanel
        open={menuOpen} onClose={() => setMenuOpen(false)}
        stats={stats} leaderboard={leaderboard} infiniteLB={infiniteLB}
        playerName={playerName} onSaveName={handleSaveName}
        infiniteMode={infiniteMode} onToggleInfinite={handleToggleInfinite}
        bestInfinite={bestInfinite}
        coins={coins}
        onOpenShop={() => setShopOpen(true)}
        onOpenInventory={() => setInventoryOpen(true)}
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
    </div>
  );
}
