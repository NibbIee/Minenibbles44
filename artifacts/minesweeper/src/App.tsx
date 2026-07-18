import { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";

const ROWS = 16;
const COLS = 9;
const MINES = 27;

type CellState = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};

type GameStatus = "idle" | "playing" | "won" | "lost";

type LeaderEntry = {
  name: string;
  wins: number;
  games: number;
  best: number | null;
};

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
          const next = current.map(row => row.map(cell => ({ ...cell })));
          for (const [nr, nc] of unrevealed) next[nr][nc].flagged = true;
          current = next;
          progress = true;
        } else if (remaining === 0 && unrevealed.length > 0) {
          let next = current.map(row => row.map(cell => ({ ...cell })));
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

const NUMBER_COLORS: Record<number, string> = {
  1: "#4fc3f7",
  2: "#81c784",
  3: "#e57373",
  4: "#9575cd",
  5: "#ff7043",
  6: "#26c6da",
  7: "#ec407a",
  8: "#bdbdbd",
};

// ── Menu panel ──────────────────────────────────────────────────────────────

function MenuPanel({
  open,
  onClose,
  stats,
  leaderboard,
  playerName,
  onSaveName,
}: {
  open: boolean;
  onClose: () => void;
  stats: { wins: number; games: number; best: number | null };
  leaderboard: LeaderEntry[];
  playerName: string;
  onSaveName: (name: string) => void;
}) {
  const [nameInput, setNameInput] = useState(playerName);
  const [tab, setTab] = useState<"stats" | "board">("stats");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input when panel opens
  useEffect(() => {
    if (open) setNameInput(playerName);
  }, [open, playerName]);

  const winRate =
    stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;

  if (!open) return null;

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div className="menu-handle" />

        {/* Player name row */}
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
                if (e.key === "Enter") {
                  onSaveName(nameInput.trim());
                  inputRef.current?.blur();
                }
              }}
            />
            <button
              className="menu-name-save"
              onClick={() => {
                onSaveName(nameInput.trim());
                inputRef.current?.blur();
              }}
            >
              Save
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="menu-tabs">
          <button
            className={`menu-tab${tab === "stats" ? " active" : ""}`}
            onClick={() => setTab("stats")}
          >
            STATS
          </button>
          <button
            className={`menu-tab${tab === "board" ? " active" : ""}`}
            onClick={() => setTab("board")}
          >
            LEADERBOARD
          </button>
        </div>

        {tab === "stats" && (
          <div className="menu-stats">
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
          </div>
        )}

        {tab === "board" && (
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
                    <tr
                      key={entry.name}
                      className={entry.name === playerName ? "lb-me" : ""}
                    >
                      <td className="lb-rank">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </td>
                      <td className="lb-name">{entry.name}</td>
                      <td className="lb-wins">{entry.wins}</td>
                      <td className="lb-rate">
                        {entry.games > 0
                          ? Math.round((entry.wins / entry.games) * 100)
                          : 0}%
                      </td>
                      <td className="lb-best">{fmtTime(entry.best)}</td>
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

// ── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState<"reveal" | "flag">("reveal");
  const [board, setBoard] = useState<CellState[][]>(createEmptyBoard);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [firstClick, setFirstClick] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem("ms-player") || "";
  });

  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem("ms-stats");
    return saved
      ? JSON.parse(saved)
      : { games: 0, wins: 0, best: null as number | null };
  });

  const [bestTime, setBestTime] = useState<number>(() => {
    const saved = localStorage.getItem("best-time");
    return saved ? Number(saved) : 999;
  });

  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>(() => {
    const saved = localStorage.getItem("ms-leaderboard");
    return saved ? JSON.parse(saved) : [];
  });

  // Persist leaderboard
  useEffect(() => {
    localStorage.setItem("ms-leaderboard", JSON.stringify(leaderboard));
  }, [leaderboard]);

  const updateLeaderboard = useCallback(
    (name: string, won: boolean, time: number) => {
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
                  best:
                    won
                      ? e.best === null || time < e.best
                        ? time
                        : e.best
                      : e.best,
                }
              : e
          );
        } else {
          updated = [
            ...lb,
            { name, wins: won ? 1 : 0, games: 1, best: won ? time : null },
          ];
        }
        return updated.sort((a, b) => b.wins - a.wins);
      });
    },
    []
  );

  // Timer
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => setElapsed((t) => Math.min(t + 1, 999)), 1000);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status === "won" && elapsed > 0 && elapsed < bestTime) {
      setBestTime(elapsed);
      localStorage.setItem("best-time", String(elapsed));
    }
  }, [status, elapsed, bestTime]);

  useEffect(() => {
    localStorage.setItem("ms-stats", JSON.stringify(stats));
  }, [stats]);

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

  const reset = useCallback(() => {
    setBoard(createEmptyBoard());
    setStatus("idle");
    setFirstClick(true);
    setElapsed(0);
    setFlagCount(0);
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") reset();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [reset]);

  const handleReveal = useCallback(
    (r: number, c: number) => {
      if (status === "won" || status === "lost") return;
      const cell = board[r][c];
      if (cell.revealed || cell.flagged) return;

      let currentBoard = board;

      if (firstClick) {
        currentBoard = placeMines(board, r, c);
        setFirstClick(false);
        setStatus("playing");
        setStats((s: typeof stats) => ({ ...s, games: s.games + 1 }));
      }

      if (currentBoard[r][c].mine) {
        const exploded = currentBoard.map((row) =>
          row.map((cell) => (cell.mine ? { ...cell, revealed: true } : { ...cell }))
        );
        exploded[r][c] = { ...exploded[r][c], revealed: true };
        setBoard(exploded);
        setStatus("lost");
        updateLeaderboard(playerName || "Anonymous", false, elapsed);
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
        setStatus("won");
        setStats((s: typeof stats) => ({
          games: s.games,
          wins: s.wins + 1,
          best: s.best === null || elapsed < s.best ? elapsed : s.best,
        }));
        updateLeaderboard(playerName || "Anonymous", true, elapsed);
      }
    },
    [board, status, firstClick, playerName, elapsed, updateLeaderboard]
  );

  const handleFlag = useCallback(
    (e: React.MouseEvent, r: number, c: number) => {
      e.preventDefault();
      if (status === "won" || status === "lost") return;
      const cell = board[r][c];
      if (cell.revealed) return;
      const next = board.map((row) => row.map((c) => ({ ...c })));
      next[r][c].flagged = !next[r][c].flagged;
      setBoard(next);
      setFlagCount((f) => (cell.flagged ? f - 1 : f + 1));
    },
    [board, status]
  );

  const handleChord = useCallback(
    (r: number, c: number) => {
      if (status === "won" || status === "lost") return;
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
            updateLeaderboard(playerName || "Anonymous", false, elapsed);
            return;
          }
          currentBoard = floodReveal(currentBoard, nr, nc);
        }
      }
      setBoard(currentBoard);
      if (checkWin(currentBoard)) {
        setStatus("won");
        setStats((s: typeof stats) => ({
          games: s.games,
          wins: s.wins + 1,
          best: s.best === null || elapsed < s.best ? elapsed : s.best,
        }));
        updateLeaderboard(playerName || "Anonymous", true, elapsed);
      }
    },
    [board, status, playerName, elapsed, updateLeaderboard]
  );

  const handleSaveName = useCallback((name: string) => {
    const trimmed = name.slice(0, 16);
    setPlayerName(trimmed);
    localStorage.setItem("ms-player", trimmed);
  }, []);

  const minesLeft = MINES - flagCount;

  return (
    <div className="app">
      {/* Top bar */}
      <div className="topbar">
        <button
          className="icon-btn"
          onClick={() => setMenuOpen(true)}
          title="Menu"
          aria-label="Open menu"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="0" y1="1" x2="18" y2="1" />
            <line x1="0" y1="7" x2="18" y2="7" />
            <line x1="0" y1="13" x2="18" y2="13" />
          </svg>
        </button>
        <div className="top-counters">
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

      {/* Win / lose banner */}
      {(status === "won" || status === "lost") && (
        <div className={`banner ${status}`}>
          {status === "won" ? "YOU WIN!" : "GAME OVER"}
          <button onClick={reset} className="play-again">Play Again</button>
        </div>
      )}

      {/* Board */}
      <div className="board-wrap">
        <div className="board">
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
                  content = (
                    <span className={`number n${cell.adjacent}`}>
                      {cell.adjacent}
                    </span>
                  );
                }
              } else if (cell.flagged) {
                cellClass += " flagged";
                content = <span className="flag-dot" />;
              }

              return (
                <div
                  key={`${r}-${c}`}
                  className={cellClass}
                  onClick={() => {
                    if (mode === "flag") {
                      handleFlag({ preventDefault: () => {} } as React.MouseEvent, r, c);
                      return;
                    }
                    if (cell.revealed) {
                      handleChord(r, c);
                    } else {
                      handleReveal(r, c);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!("ontouchstart" in window)) handleFlag(e, r, c);
                  }}
                >
                  {content}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bottombar">
        <button
          className={`mode-btn${mode === "reveal" ? " active" : ""}`}
          onClick={() => setMode("reveal")}
        >
          DIG
        </button>
        <button
          className={`mode-btn${mode === "flag" ? " active" : ""}`}
          onClick={() => setMode("flag")}
        >
          FLAG
        </button>
      </div>

      {/* Menu */}
      <MenuPanel
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        stats={stats}
        leaderboard={leaderboard}
        playerName={playerName}
        onSaveName={handleSaveName}
      />
    </div>
  );
}
