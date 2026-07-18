import { useState, useRef, useCallback } from "react";

// ── Local CoinIcon ─────────────────────────────────────────────────────────────
function CoinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6.5" fill="#c89a1a" stroke="#ffd700" strokeWidth="1" />
      <text x="7" y="10.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ffd700" fontFamily="Arial, sans-serif">C</text>
    </svg>
  );
}

// ── SVG Components ─────────────────────────────────────────────────────────────
function RadiantStarSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <radialGradient id="rs-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffde0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ff8c00" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rs-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff7a0" />
          <stop offset="50%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#ff8c00" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#rs-bg)" />
      <polygon
        points="24,3 27.8,16 42,16.5 31.2,24.8 34.5,38 24,30.5 13.5,38 16.8,24.8 6,16.5 20.2,16"
        fill="url(#rs-fill)"
        stroke="#fff9c0"
        strokeWidth="0.5"
      />
      <circle cx="24" cy="24" r="2.5" fill="white" opacity="0.9" />
    </svg>
  );
}

function NeonCrescentSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="nc-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ffee" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path
        d="M28 6 A16 16 0 1 0 28 42 A12 12 0 1 1 28 6"
        fill="url(#nc-fill)"
        opacity="0.95"
      />
      <circle cx="35" cy="12" r="2" fill="white" opacity="0.9" />
      <circle cx="39" cy="22" r="1.2" fill="#00ffee" opacity="0.8" />
      <circle cx="37" cy="32" r="1.5" fill="white" opacity="0.7" />
    </svg>
  );
}

function VolcanoFurySVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="vf-rock" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#666" />
          <stop offset="100%" stopColor="#222" />
        </linearGradient>
      </defs>
      <polygon points="24,18 40,44 8,44" fill="url(#vf-rock)" />
      <ellipse cx="24" cy="19" rx="7" ry="4" fill="#ff4500" opacity="0.85">
        <animate attributeName="opacity" values="0.85;0.5;0.85" dur="1.2s" repeatCount="indefinite" />
      </ellipse>
      <circle cx="20" cy="16" r="2.5" fill="#ff8c00">
        <animate attributeName="cy" values="16;4;16" dur="1.0s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0;1" dur="1.0s" repeatCount="indefinite" />
      </circle>
      <circle cx="24" cy="14" r="3" fill="#ff4500">
        <animate attributeName="cy" values="14;1;14" dur="0.85s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0;1" dur="0.85s" repeatCount="indefinite" />
      </circle>
      <circle cx="28" cy="17" r="2" fill="#ffaa00">
        <animate attributeName="cy" values="17;5;17" dur="1.15s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0;1" dur="1.15s" repeatCount="indefinite" />
      </circle>
      <ellipse cx="24" cy="44" rx="16" ry="3" fill="#ff3300" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.7;0.4" dur="1.5s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}

function CyberHackSVG({ size = 48 }: { size?: number }) {
  const cols = [8, 16, 24, 32, 40];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="3" fill="#001800" />
      <rect width="48" height="48" rx="3" fill="none" stroke="#00ff41" strokeWidth="1" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.15;0.6" dur="2s" repeatCount="indefinite" />
      </rect>
      {cols.map((x, i) => (
        <text key={i} x={x} y="8" fontSize="7" fill="#00ff41" fontFamily="monospace" textAnchor="middle">
          <animate
            attributeName="y"
            values={`${-8 + i * 4};56;${-8 + i * 4}`}
            dur={`${1.1 + i * 0.25}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;1;0.8;1;0"
            dur={`${1.1 + i * 0.25}s`}
            repeatCount="indefinite"
          />
          {i % 2 === 0 ? "0" : "1"}
        </text>
      ))}
      <text x="24" y="28" fontSize="7" fill="#00ff41" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
        HACKED
        <animate attributeName="opacity" values="1;0.1;1;0.3;1" dur="0.7s" repeatCount="indefinite" />
      </text>
      <rect x="0" y="0" width="48" height="2" fill="#00ff41" opacity="0.15">
        <animate attributeName="y" values="-2;50;-2" dur="1.8s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

// ── Crate Data ─────────────────────────────────────────────────────────────────
export type CrateRarity = "common" | "rare" | "epic" | "legendary";

export interface CrateItem {
  id: string;
  label: string;
  rarity: CrateRarity;
  type: "emoji" | "svg";
  emoji?: string;
  flagId?: string; // if type==="emoji", the FLAGS id to add to ownedFlags
}

export const CRATE_ITEMS: CrateItem[] = [
  // Commons (65%)
  { id: "crate-carrot",    label: "Carrot",        rarity: "common",    type: "emoji", emoji: "🥕", flagId: "crate-carrot"    },
  { id: "crate-broccoli",  label: "Broccoli",      rarity: "common",    type: "emoji", emoji: "🥦", flagId: "crate-broccoli"  },
  { id: "crate-wheat",     label: "Wheat",         rarity: "common",    type: "emoji", emoji: "🌾", flagId: "crate-wheat"     },
  { id: "crate-clover",    label: "Four-Leaf",     rarity: "common",    type: "emoji", emoji: "🍀", flagId: "crate-clover"    },
  // Rares (25%)
  { id: "crate-wave",      label: "Wave",          rarity: "rare",      type: "emoji", emoji: "🌊", flagId: "crate-wave"      },
  { id: "crate-cherry",    label: "Cherry",        rarity: "rare",      type: "emoji", emoji: "🍒", flagId: "crate-cherry"    },
  { id: "crate-target",    label: "Target",        rarity: "rare",      type: "emoji", emoji: "🎯", flagId: "crate-target"    },
  // Epics (8%)
  { id: "crate-radiant",   label: "Radiant Star",  rarity: "epic",      type: "svg" },
  { id: "crate-crescent",  label: "Neon Crescent", rarity: "epic",      type: "svg" },
  // Legendaries (2%)
  { id: "crate-volcano",   label: "Volcano Fury",  rarity: "legendary", type: "svg" },
  { id: "crate-cyberhack", label: "Cyber Hack",    rarity: "legendary", type: "svg" },
];

export function getRarityColor(rarity: CrateRarity): string {
  switch (rarity) {
    case "common":    return "#8a9bb0";
    case "rare":      return "#4d9fff";
    case "epic":      return "#c084fc";
    case "legendary": return "#ffd700";
  }
}

export function getRarityLabel(rarity: CrateRarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

export function CrateItemDisplay({ item, size = 48 }: { item: CrateItem; size?: number }) {
  if (item.type === "emoji") {
    return <span style={{ fontSize: Math.round(size * 0.75), lineHeight: 1 }}>{item.emoji}</span>;
  }
  switch (item.id) {
    case "crate-radiant":   return <RadiantStarSVG size={size} />;
    case "crate-crescent":  return <NeonCrescentSVG size={size} />;
    case "crate-volcano":   return <VolcanoFurySVG size={size} />;
    case "crate-cyberhack": return <CyberHackSVG size={size} />;
    default: return <span>❓</span>;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function pickCrateItem(): CrateItem {
  const rand = Math.random() * 100;
  let rarity: CrateRarity;
  if (rand < 2)       rarity = "legendary";
  else if (rand < 10) rarity = "epic";
  else if (rand < 35) rarity = "rare";
  else                rarity = "common";
  const pool = CRATE_ITEMS.filter((i) => i.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildStrip(winner: CrateItem): CrateItem[] {
  const STRIP_COUNT = 80;
  const strip: CrateItem[] = Array.from({ length: STRIP_COUNT }, () => pickCrateItem());
  strip[WINNER_IDX] = winner;
  return strip;
}

// ── CrateModal ─────────────────────────────────────────────────────────────────
const ITEM_W = 80;    // px width per reel item
const WINNER_IDX = 65; // strip index where winner is placed
export const CRATE_COST = 50;

export interface CrateModalProps {
  open: boolean;
  onClose: () => void;
  coins: number;
  ownedCrateItems: string[];
  onPay: () => void;            // called immediately when user clicks Open (deducts coins)
  onClaim: (item: CrateItem) => void; // called when user clicks Claim (adds to collection)
}

export function CrateModal({ open, onClose, coins, ownedCrateItems, onPay, onClaim }: CrateModalProps) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "done">("idle");
  const [strip, setStrip] = useState<CrateItem[]>([]);
  const [winner, setWinner] = useState<CrateItem | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const reelRef  = useRef<HTMLDivElement>(null);

  const canAfford = coins >= CRATE_COST;

  const handleOpen = useCallback(() => {
    if (!canAfford || phase !== "idle") return;
    const won = pickCrateItem();
    const newStrip = buildStrip(won);
    setWinner(won);
    setStrip(newStrip);
    setPhase("spinning");
    onPay(); // deduct coins now

    // Two-frame trick: reset position (no transition) then animate to target
    requestAnimationFrame(() => {
      if (!stripRef.current || !reelRef.current) return;
      const containerW = reelRef.current.offsetWidth || 320;
      const centerOffset = containerW / 2 - ITEM_W / 2;
      const targetX = -(WINNER_IDX * ITEM_W - centerOffset);

      stripRef.current.style.transition = "none";
      stripRef.current.style.transform = "translateX(0px)";

      requestAnimationFrame(() => {
        if (!stripRef.current) return;
        stripRef.current.style.transition = "transform 5.5s cubic-bezier(0.12, 0.8, 0.32, 1)";
        stripRef.current.style.transform = `translateX(${targetX}px)`;
      });
    });

    setTimeout(() => setPhase("done"), 5700);
  }, [canAfford, phase, onPay]);

  const handleClaim = useCallback(() => {
    if (!winner) return;
    onClaim(winner);
    setPhase("idle");
    setStrip([]);
    setWinner(null);
  }, [winner, onClaim]);

  const handleClose = useCallback(() => {
    if (phase === "spinning") return; // block close during spin
    setPhase("idle");
    setStrip([]);
    setWinner(null);
    onClose();
  }, [phase, onClose]);

  if (!open) return null;

  const alreadyOwned = winner ? ownedCrateItems.includes(winner.id) : false;
  const winnerColor = winner ? getRarityColor(winner.rarity) : "#ffd700";

  const DROP_RATES = [
    { label: "Common",    pct: "65%", color: "#8a9bb0", preview: "🥕🥦🌾🍀" },
    { label: "Rare",      pct: "25%", color: "#4d9fff", preview: "🌊🍒🎯" },
    { label: "Epic",      pct: "8%",  color: "#c084fc", preview: "★ ☽" },
    { label: "Legendary", pct: "2%",  color: "#ffd700", preview: "🌋 💻" },
  ] as const;

  return (
    <div className="menu-overlay" onClick={handleClose}>
      <div className="menu-sheet" onClick={(e) => e.stopPropagation()} style={{ overflowY: "auto" }}>
        <div className="menu-handle" />

        {/* Header */}
        <div className="shop-header">
          <span className="shop-title">CRATE #1</span>
          <span className="shop-coins"><CoinIcon size={16} /><span>{coins}</span></span>
        </div>

        {/* Drop rates */}
        <div className="crate-drop-rates">
          {DROP_RATES.map((r) => (
            <div key={r.label} className="crate-drop-row">
              <span className="crate-drop-dot" style={{ background: r.color }} />
              <span className="crate-drop-label" style={{ color: r.color }}>{r.label}</span>
              <span className="crate-drop-pct">{r.pct}</span>
              <span className="crate-drop-preview">{r.preview}</span>
            </div>
          ))}
        </div>

        {/* Reel */}
        <div className="crate-reel-wrap" ref={reelRef}>
          {/* Selector highlight */}
          <div
            className="crate-selector"
            style={{
              borderColor: phase === "done" ? winnerColor : "#ffd700",
              boxShadow: `0 0 14px ${phase === "done" ? winnerColor : "#ffd700"}50`,
            }}
          />
          {/* Fade overlays */}
          <div className="crate-fade crate-fade-l" />
          <div className="crate-fade crate-fade-r" />
          {/* Overflow clip */}
          <div className="crate-reel-clip">
            {strip.length === 0 ? (
              <div className="crate-idle-placeholder">
                <span style={{ fontSize: 38 }}>📦</span>
              </div>
            ) : (
              <div className="crate-strip" ref={stripRef}>
                {strip.map((item, i) => (
                  <div key={i} className="crate-strip-item">
                    <div className="crate-strip-icon">
                      <CrateItemDisplay item={item} size={36} />
                    </div>
                    <div className="crate-strip-bar" style={{ background: getRarityColor(item.rarity) }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Winner reveal */}
        {phase === "done" && winner && (
          <div
            className="crate-winner-card"
            style={{ borderColor: winnerColor, boxShadow: `0 0 24px ${winnerColor}25` }}
          >
            <div className="crate-winner-icon">
              <CrateItemDisplay item={winner} size={56} />
            </div>
            <div className="crate-winner-info">
              <span className="crate-winner-rarity" style={{ color: winnerColor }}>
                {getRarityLabel(winner.rarity)}
              </span>
              <span className="crate-winner-name">{winner.label}</span>
              {winner.type === "emoji" && (
                <span className="crate-winner-hint">
                  {alreadyOwned ? "Already owned" : "Added to flags!"}
                </span>
              )}
              {winner.type === "svg" && (
                <span className="crate-winner-hint">
                  {alreadyOwned ? "Already owned" : "Added to collection!"}
                </span>
              )}
            </div>
            <button
              className="crate-claim-btn"
              style={{ borderColor: winnerColor, color: winnerColor }}
              onClick={handleClaim}
            >
              {alreadyOwned ? "Dismiss" : "Claim"}
            </button>
          </div>
        )}

        {/* Action button */}
        {phase === "idle" && (
          <button
            className={`crate-open-btn${canAfford ? "" : " cant-afford"}`}
            onClick={handleOpen}
            disabled={!canAfford}
          >
            <CoinIcon size={14} />
            Open Crate — {CRATE_COST}
          </button>
        )}
        {phase === "spinning" && (
          <div className="crate-rolling">Rolling…</div>
        )}
      </div>
    </div>
  );
}
