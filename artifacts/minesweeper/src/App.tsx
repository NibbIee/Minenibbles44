import { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";

const ROWS = 16;
const COLS = 9;
const MINES = 27;

// Board pixel dimensions (used for transition clip)
const BOARD_W = COLS * 32 + (COLS - 1) * 3; // 312px
const BOARD_H = ROWS * 32 + (ROWS - 1) * 3; // 557px

type CellState = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};

type GameStatus = "idle" | "playing" | "won" | "lost" | "transitioning";

type LeaderEntry = {
  name: string;
  wins: number;
  games: number;
  best: number | null;
};

type InfiniteEntry = {
  name: string;
  boards: number;
  date: string;
};

// ── Pure helpers ──────────────────────────────────────────────────────────────

function createEmptyBoard(): CellState[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    }))
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
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && next[nr][nc].mine) count++;
        }
      }
      next[r][c].adjacent = count;
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
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
            const n = current[nr][nc];
            if (n.flagged) flagged++;
            else if (!n.revealed) unrevealed.push([nr, nc]);
          }
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
    if (next[r][c].adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          queue.push([r + dr, c + dc]);
        }
      }
    }
  }
  return next;
}

function checkWin(board: CellState[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!board[r][c].mine && !board[r][c].revealed) return false;
    }
  }
  return true;
}

function fmtTime(s: number | null): string {
  if (s === null) return "—";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ── Board renderer (pure, no interaction logic) ───────────────────────────────

function BoardGrid({
  board,
  onCellClick,
  onCellContext,
  interactive,
}: {
  board: CellState[][];
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
              content = "💣";
              cellClass += " mine";
            } else if (cell.adjacent > 0) {
              content = <span className={`number n${cell.adjacent}`}>{cell.adjacent}</span>;
            }
          } else if (cell.flagged) {
            cellClass += " flagged";
            content = <span className="flag-dot" />;
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

// ── Menu panel ────────────────────────────────────────────────────────────────

function MenuPanel({
  open,
  onClose,
  stats,
  leaderboard,
  infiniteLB,
  playerName,
  onSaveName,
  infiniteMode,
  onToggleInfinite,
  bestInfinite,
}: {
  open: boolean;
  onClose: () => void;
  stats: { wins: number; games: number; best: number | null };
  leaderboard: LeaderEntry[];
  infiniteLB: InfiniteEntry[];
  playerName: string;
  onSaveName: (name: string) => void;
  infiniteMode: boolean;
  onToggleInfinite: () => void;
  bestInfinite: number;
}) {
  const [nameInput, setNameInput] = useState(playerName);
  const [tab, setTab] = useState<"stats" | "classic" | "infinite">("stats");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setNameInput(playerName);
  }, [open, playerName]);

  const winRate =
    stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;

  if (!open) return null;

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="menu-handle" />

        {/* Player name */}
        <div className="menu-name-row">
          <span className="menu-name-label">PLAYER</span>
          <div className="menu-name-field">
            <input
              ref={inputRef}
              className="menu-name-input"
              value={nameInput}
              placeholder="Enter your name"
              maxLength={16}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { onSaveName(nameInput.trim()); inputRef.current?.blur(); }
              }}
            />
            <button
              className="menu-name-save"
              onClick={() => { onSaveName(nameInput.trim()); inputRef.current?.blur(); }}
            >
              Save
            </button>
          </div>
        </div>

        {/* Infinite mode toggle */}
        <div className="infinite-toggle-row">
          <div>
            <span className="infinite-toggle-label">∞ INFINITE MODE</span>
            <span className="infinite-toggle-sub">Clear board after board non-stop</span>
          </div>
          <button
            className={`toggle-switch${infiniteMode ? " on" : ""}`}
            onClick={onToggleInfinite}
            aria-label="Toggle infinite mode"
          >
            <span className="toggle-knob" />
          </button>
        </div>

        {/* Tabs */}
        <div className="menu-tabs">
          <button className={`menu-tab${tab === "stats" ? " active" : ""}`} onClick={() => setTab("stats")}>STATS</button>
          <button className={`menu-tab${tab === "classic" ? " active" : ""}`} onClick={() => setTab("classic")}>CLASSIC</button>
          <button className={`menu-tab${tab === "infinite" ? " active" : ""}`} onClick={() => setTab("infinite")}>INFINITE</button>
        </div>

        {/* Stats tab */}
        {tab === "stats" && (
          <div className="menu-stats">
            <div className="stat-section-title">Classic</div>
            <div className="stat-row">
              <span className="stat-label">Win Rate</span>
              <span className="stat-value">{winRate}%</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-row">
              <span className="stat-label">Wins</span>
              <span className="stat-value">{stats.wins}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-row">
              <span className="stat-label">Games Played</span>
              <span className="stat-value">{stats.games}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-row">
              <span className="stat-label">Best Time</span>
              <span className="stat-value stat-best">{fmtTime(stats.best)}</span>
            </div>
            <div className="stat-section-title" style={{ marginTop: 20 }}>Infinite</div>
            <div className="stat-row">
              <span className="stat-label">Best Run</span>
              <span className="stat-value stat-best">
                {bestInfinite > 0 ? `${bestInfinite} boards` : "—"}
              </span>
            </div>
          </div>
        )}

        {/* Classic leaderboard */}
        {tab === "classic" && (
          <div className="menu-leaderboard">
            {leaderboard.length === 0 ? (
              <p className="lb-empty">No entries yet. Win a game to appear!</p>
            ) : (
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Wins</th>
                    <th>Rate</th>
                    <th>Best</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, i) => (
                    <tr key={entry.name} className={entry.name === playerName ? "lb-me" : ""}>
                      <td className="lb-rank">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
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

        {/* Infinite leaderboard */}
        {tab === "infinite" && (
          <div className="menu-leaderboard">
            {infiniteLB.length === 0 ? (
              <p className="lb-empty">No runs yet. Enable Infinite Mode and survive as long as you can!</p>
            ) : (
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Boards</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {infiniteLB.map((entry, i) => (
                    <tr key={`${entry.name}-${i}`} className={entry.name === playerName ? "lb-me" : ""}>
                      <td className="lb-rank">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
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

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState<"reveal" | "flag">("reveal");
  const [board, setBoard] = useState<CellState[][]>(createEmptyBoard);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [firstClick, setFirstClick] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Infinite mode
  const [infiniteMode, setInfiniteMode] = useState(() => localStorage.getItem("ms-infinite") === "true");
  const [infiniteCount, setInfiniteCount] = useState(0); // boards cleared this run
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

  // Persist
  useEffect(() => { localStorage.setItem("ms-stats", JSON.stringify(stats)); }, [stats]);
  useEffect(() => { localStorage.setItem("ms-leaderboard", JSON.stringify(leaderboard)); }, [leaderboard]);
  useEffect(() => { localStorage.setItem("ms-infinite-lb", JSON.stringify(infiniteLB)); }, [infiniteLB]);
  useEffect(() => { infiniteCountRef.current = infiniteCount; }, [infiniteCount]);

  // Timer — runs during playing; pauses during transitioning / idle / won / lost
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => setElapsed((t) => Math.min(t + 1, 999)), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Classic win confetti
  useEffect(() => {
    if (status !== "won") return;
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#4caf50", "#ffffff", "#aaaaaa", "#81c784"];
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [status]);

  // ── Leaderboard helpers ──

  const updateLeaderboard = useCallback((name: string, won: boolean, time: number) => {
    if (!name) return;
    setLeaderboard((lb) => {
      const existing = lb.find((e) => e.name === name);
      let updated: LeaderEntry[];
      if (existing) {
        updated = lb.map((e) =>
          e.name === name
            ? {
                ...e,
                wins: won ? e.wins + 1 : e.wins,
                games: e.games + 1,
                best: won ? (e.best === null || time < e.best ? time : e.best) : e.best,
              }
            : e
        );
      } else {
        updated = [...lb, { name, wins: won ? 1 : 0, games: 1, best: won ? time : null }];
      }
      return updated.sort((a, b) => b.wins - a.wins);
    });
  }, []);

  const saveInfiniteScore = useCallback((name: string, boards: number) => {
    if (!name || boards === 0) return;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
    setInfiniteLB((lb) => {
      const updated = [...lb, { name, boards, date: today }];
      return updated.sort((a, b) => b.boards - a.boards).slice(0, 20);
    });
  }, []);

  const bestInfinite =
    infiniteLB.filter((e) => e.name === (playerName || "Anonymous"))
      .reduce((m, e) => Math.max(m, e.boards), 0);

  // ── End of infinite run ──

  const endInfiniteRun = useCallback(() => {
    const count = infiniteCountRef.current;
    if (infiniteMode && count > 0) {
      saveInfiniteScore(playerName || "Anonymous", count);
    }
  }, [infiniteMode, playerName, saveInfiniteScore]);

  // ── Reset ──

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

  // ── Toggle infinite mode ──

  const handleToggleInfinite = useCallback(() => {
    setInfiniteMode((prev) => {
      const next = !prev;
      localStorage.setItem("ms-infinite", String(next));
      return next;
    });
    // Reset game when toggling
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

  // ── Infinite board transition ──

  const triggerInfiniteTransition = useCallback((clearedBoard: CellState[][]) => {
    // Show cleared board as the one sliding OUT; new board is blank immediately
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

  // ── Handle reveal ──

  const handleReveal = useCallback(
    (r: number, c: number) => {
      if (status === "won" || status === "lost" || status === "transitioning") return;
      const cell = board[r][c];
      if (cell.revealed || cell.flagged) return;

      let currentBoard = board;

      if (firstClick) {
        currentBoard = placeMines(board, r, c);
        setFirstClick(false);
        setStatus("playing");
        if (!infiniteMode) {
          setStats((s: typeof stats) => ({ ...s, games: s.games + 1 }));
        }
      }

      if (currentBoard[r][c].mine) {
        const exploded = currentBoard.map((row) =>
          row.map((cell) => (cell.mine ? { ...cell, revealed: true } : { ...cell }))
        );
        exploded[r][c] = { ...exploded[r][c], revealed: true };
        setBoard(exploded);
        setStatus("lost");
        if (!infiniteMode) updateLeaderboard(playerName || "Anonymous", false, elapsed);
        endInfiniteRun();
        setInfiniteCount(0);
        infiniteCountRef.current = 0;
        return;
      }

      const revealed = floodReveal(currentBoard, r, c);
      setBoard(revealed);

      if (checkWin(revealed)) {
        const finished = revealed.map((row) =>
          row.map((cell) => (cell.mine ? { ...cell, flagged: true } : cell))
        );
        setBoard(finished);
        setFlagCount(MINES);

        if (infiniteMode) {
          const newCount = infiniteCountRef.current + 1;
          setInfiniteCount(newCount);
          infiniteCountRef.current = newCount;
          triggerInfiniteTransition(finished);
        } else {
          setStatus("won");
          setStats((s: typeof stats) => ({
            games: s.games,
            wins: s.wins + 1,
            best: s.best === null || elapsed < s.best ? elapsed : s.best,
          }));
          updateLeaderboard(playerName || "Anonymous", true, elapsed);
        }
      }
    },
    [board, status, firstClick, infiniteMode, playerName, elapsed, updateLeaderboard, triggerInfiniteTransition, endInfiniteRun]
  );

  // ── Handle flag ──

  const handleFlag = useCallback(
    (e: React.MouseEvent, r: number, c: number) => {
      e.preventDefault();
      if (status === "won" || status === "lost" || status === "transitioning") return;
      const cell = board[r][c];
      if (cell.revealed) return;
      const next = board.map((row) => row.map((c) => ({ ...c })));
      next[r][c].flagged = !next[r][c].flagged;
      setBoard(next);
      setFlagCount((f) => (cell.flagged ? f - 1 : f + 1));
    },
    [board, status]
  );

  // ── Handle chord ──

  const handleChord = useCallback(
    (r: number, c: number) => {
      if (status === "won" || status === "lost" || status === "transitioning") return;
      const cell = board[r][c];
      if (!cell.revealed || cell.adjacent === 0) return;
      let flags = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].flagged) flags++;
        }
      }
      if (flags !== cell.adjacent) return;
      let currentBoard = board;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
          const neighbor = currentBoard[nr][nc];
          if (neighbor.revealed || neighbor.flagged) continue;
          if (neighbor.mine) {
            const boom = currentBoard.map((row) =>
              row.map((c) => (c.mine ? { ...c, revealed: true } : { ...c }))
            );
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
      }
      setBoard(currentBoard);
      if (checkWin(currentBoard)) {
        const finished = currentBoard.map((row) =>
          row.map((cell) => (cell.mine ? { ...cell, flagged: true } : cell))
        );
        setBoard(finished);
        setFlagCount(MINES);
        if (infiniteMode) {
          const newCount = infiniteCountRef.current + 1;
          setInfiniteCount(newCount);
          infiniteCountRef.current = newCount;
          triggerInfiniteTransition(finished);
        } else {
          setStatus("won");
          setStats((s: typeof stats) => ({
            games: s.games,
            wins: s.wins + 1,
            best: s.best === null || elapsed < s.best ? elapsed : s.best,
          }));
          updateLeaderboard(playerName || "Anonymous", true, elapsed);
        }
      }
    },
    [board, status, infiniteMode, playerName, elapsed, updateLeaderboard, triggerInfiniteTransition, endInfiniteRun]
  );

  const handleSaveName = useCallback((name: string) => {
    const trimmed = name.slice(0, 16);
    setPlayerName(trimmed);
    localStorage.setItem("ms-player", trimmed);
  }, []);

  const minesLeft = MINES - flagCount;

  // Cell click handler
  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (mode === "flag") {
        handleFlag({ preventDefault: () => {} } as React.MouseEvent, r, c);
        return;
      }
      if (board[r][c].revealed) {
        handleChord(r, c);
      } else {
        handleReveal(r, c);
      }
    },
    [mode, board, handleFlag, handleChord, handleReveal]
  );

  const handleCellContext = useCallback(
    (e: React.MouseEvent, r: number, c: number) => {
      e.preventDefault();
      if (!("ontouchstart" in window)) handleFlag(e, r, c);
    },
    [handleFlag]
  );

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

        <button className="icon-btn" onClick={reset} title="New game">↺</button>
      </div>

      {/* Classic win / lose banner (infinite mode has no banner) */}
      {!infiniteMode && (status === "won" || status === "lost") && (
        <div className={`banner ${status}`}>
          {status === "won" ? "YOU WIN!" : "GAME OVER"}
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
        <div
          className="board-clip"
          style={{ width: BOARD_W, height: BOARD_H }}
        >
          {/* Exiting board (slides down) */}
          {transitioning && exitBoard && (
            <div className="board-pos board-exit">
              <div className="board" style={{ pointerEvents: "none" }}>
                {exitBoard.map((row, r) =>
                  row.map((cell, c) => {
                    let content: React.ReactNode = null;
                    let cellClass = "cell";
                    if (cell.revealed) {
                      cellClass += " revealed";
                      if (cell.mine) { content = "💣"; cellClass += " mine"; }
                      else if (cell.adjacent > 0) {
                        content = <span className={`number n${cell.adjacent}`}>{cell.adjacent}</span>;
                      }
                    } else if (cell.flagged) {
                      cellClass += " flagged";
                      content = <span className="flag-dot" />;
                    }
                    return <div key={`${r}-${c}`} className={cellClass}>{content}</div>;
                  })
                )}
              </div>
            </div>
          )}

          {/* Current / entering board */}
          <div className={`board-pos ${transitioning ? "board-enter" : ""}`}>
            <div
              className="board"
              style={{ pointerEvents: transitioning ? "none" : "auto" }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  let content: React.ReactNode = null;
                  let cellClass = "cell";
                  if (cell.revealed) {
                    cellClass += " revealed";
                    if (cell.mine) { content = "💣"; cellClass += " mine"; }
                    else if (cell.adjacent > 0) {
                      content = <span className={`number n${cell.adjacent}`}>{cell.adjacent}</span>;
                    }
                  } else if (cell.flagged) {
                    cellClass += " flagged";
                    content = <span className="flag-dot" />;
                  }
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={cellClass}
                      onClick={() => handleCellClick(r, c)}
                      onContextMenu={(e) => handleCellContext(e, r, c)}
                    >
                      {content}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bottombar">
        <button className={`mode-btn${mode === "reveal" ? " active" : ""}`} onClick={() => setMode("reveal")}>DIG</button>
        <button className={`mode-btn${mode === "flag" ? " active" : ""}`} onClick={() => setMode("flag")}>FLAG</button>
      </div>

      {/* Menu */}
      <MenuPanel
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        stats={stats}
        leaderboard={leaderboard}
        infiniteLB={infiniteLB}
        playerName={playerName}
        onSaveName={handleSaveName}
        infiniteMode={infiniteMode}
        onToggleInfinite={handleToggleInfinite}
        bestInfinite={bestInfinite}
      />
    </div>
  );
}
