import { useState, useEffect, useCallback } from "react";

const ROWS = 9;
const COLS = 14;
const MINES = 27;

type CellState = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};

type GameStatus = "idle" | "playing" | "won" | "lost";

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

function placeMines(board: CellState[][], safeRow: number, safeCol: number): CellState[][] {
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
  // compute adjacency
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (next[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && next[nr][nc].mine) count++;
        }
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

export default function App() {
  const [board, setBoard] = useState<CellState[][]>(createEmptyBoard);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [firstClick, setFirstClick] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem("ms-stats");
    return saved
      ? JSON.parse(saved)
      : {
          games: 0,
          wins: 0,
          best: null,
        };
  });
  const [bestTime, setBestTime] = useState<number>(() => {
    const saved = localStorage.getItem("best-time");
    return saved ? Number(saved) : 999;
  });

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

  const reset = useCallback(() => {
    setBoard(createEmptyBoard());
    setStatus("idle");
    setFirstClick(true);
    setElapsed(0);
    setFlagCount(0);
    setStats((s: typeof stats) => ({
      ...s,
      games: s.games + 1,
    }));
  }, []);

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
      }

      if (currentBoard[r][c].mine) {
        // Reveal all mines
        const exploded = currentBoard.map((row) =>
          row.map((cell) => (cell.mine ? { ...cell, revealed: true } : { ...cell }))
        );
        // Mark the clicked mine
        exploded[r][c] = { ...exploded[r][c], revealed: true };
        setBoard(exploded);
        setStatus("lost");
        return;
      }

      const revealed = floodReveal(currentBoard, r, c);
      setBoard(revealed);
      if (checkWin(revealed)) {
        setStatus("won");
        setStats((s: typeof stats) => ({
          games: s.games,
          wins: s.wins + 1,
          best:
            s.best === null || elapsed < s.best
              ? elapsed
              : s.best,
        }));
      }
    },
    [board, status, firstClick]
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
      // Count adjacent flags
      let flags = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].flagged) flags++;
        }
      }
      if (flags !== cell.adjacent) return;
      // Reveal all non-flagged neighbors
      let currentBoard = board;
      let exploded = false;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
          const neighbor = currentBoard[nr][nc];
          if (neighbor.revealed || neighbor.flagged) continue;
          if (neighbor.mine) {
            exploded = true;
            const boom = currentBoard.map((row) =>
              row.map((c) => (c.mine ? { ...c, revealed: true } : { ...c }))
            );
            setBoard(boom);
            setStatus("lost");
            return;
          }
          currentBoard = floodReveal(currentBoard, nr, nc);
        }
      }
      if (!exploded) {
        setBoard(currentBoard);
        if (checkWin(currentBoard)) setStatus("won");
      }
    },
    [board, status]
  );

  const minesLeft = MINES - flagCount;

  return (
    <div className="game-root">
      <h1 className="title">
        💣 Minesweeper
      </h1>

      <div className="hud">
        <div className="hud-box">
          <span className="hud-icon">💣</span>
          <span className="hud-value">{minesLeft}</span>
        </div>

        <button
          className={`reset-btn ${status === "lost" ? "sad" : status === "won" ? "cool" : ""}`}
          onClick={reset}
          title="New game"
        >
          {status === "lost" ? "😵" : status === "won" ? "😎" : "🙂"}
        </button>

        <div className="hud-box">
          <span className="hud-icon">⏱</span>
          <span className="hud-value">{String(elapsed).padStart(3, "0")}</span>
        </div>

        <div className="hud-box">
          <span className="hud-icon">🏆</span>
          <span className="hud-value">
            {bestTime === 999 ? "---" : bestTime}
          </span>
        </div>
      </div>

      {(status === "won" || status === "lost") && (
        <div className={`banner ${status}`}>
          {status === "won" ? "You win! 🎉" : "Boom! Game over 💥"}
        </div>
      )}

      <div
        className="board"
        style={{ gridTemplateColumns: `repeat(${COLS}, 36px)` }}
      >
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
                  <span style={{ color: NUMBER_COLORS[cell.adjacent] }}>
                    {cell.adjacent}
                  </span>
                );
              }
            } else if (cell.flagged) {
              cellClass += " flagged";
              content = "🚩";
            }

            return (
              <div
                key={`${r}-${c}`}
                className={cellClass}
                onClick={() => {
                  if (cell.revealed) {
                    handleChord(r, c);
                  } else {
                    handleReveal(r, c);
                  }
                }}
                onContextMenu={(e) => handleFlag(e, r, c)}
              />
            );
          })
        )}
      </div>

      <div className="stats">
        <h2>Statistics</h2>
        <p>Games: {stats.games}</p>
        <p>Wins: {stats.wins}</p>
        <p>
          Win rate:{" "}
          {stats.games === 0
            ? 0
            : Math.round((stats.wins / stats.games) * 100)}
          %
        </p>
        <p>
          Best Time:{" "}
          {stats.best === null ? "--" : stats.best + "s"}
        </p>
      </div>

      <p className="hint">Left-click to reveal · Right-click to flag · Click a number to chord</p>
    </div>
  );
}
