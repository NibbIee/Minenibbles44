import { useState, useRef, useCallback, useEffect } from "react";

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

// Fixed crescent moon using mask — clean proper crescent shape
function NeonCrescentSVG({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="nc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8e8ff" />
          <stop offset="45%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <mask id="nc-mask">
          {/* Full circle defines the moon body */}
          <circle cx="21" cy="26" r="18" fill="white" />
          {/* Offset circle cuts out the crescent */}
          <circle cx="29" cy="20" r="14" fill="black" />
        </mask>
      </defs>
      {/* Moon crescent body */}
      <circle cx="21" cy="26" r="18" fill="url(#nc-grad)" mask="url(#nc-mask)" />
      {/* Stars scattered in the cut-out region */}
      <circle cx="36" cy="9"  r="1.6" fill="#b8e8ff" opacity="0.95" />
      <circle cx="42" cy="19" r="1.0" fill="white"   opacity="0.85" />
      <circle cx="39" cy="31" r="1.3" fill="#ec4899"  opacity="0.85" />
      <circle cx="44" cy="13" r="0.9" fill="white"   opacity="0.70" />
      <circle cx="41" cy="6"  r="1.1" fill="#7c3aed"  opacity="0.80" />
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
          <animate attributeName="y" values={`${-8 + i * 4};56;${-8 + i * 4}`} dur={`${1.1 + i * 0.25}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0.8;1;0" dur={`${1.1 + i * 0.25}s`} repeatCount="indefinite" />
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
  flagId?: string;
}

export const CRATE_ITEMS: CrateItem[] = [
  { id: "crate-carrot",    label: "Carrot",        rarity: "common",    type: "emoji", emoji: "🥕", flagId: "crate-carrot"    },
  { id: "crate-broccoli",  label: "Broccoli",      rarity: "common",    type: "emoji", emoji: "🥦", flagId: "crate-broccoli"  },
  { id: "crate-wheat",     label: "Wheat",         rarity: "common",    type: "emoji", emoji: "🌾", flagId: "crate-wheat"     },
  { id: "crate-clover",    label: "Four-Leaf",     rarity: "common",    type: "emoji", emoji: "🍀", flagId: "crate-clover"    },
  { id: "crate-wave",      label: "Wave",          rarity: "rare",      type: "emoji", emoji: "🌊", flagId: "crate-wave"      },
  { id: "crate-cherry",    label: "Cherry",        rarity: "rare",      type: "emoji", emoji: "🍒", flagId: "crate-cherry"    },
  { id: "crate-target",    label: "Target",        rarity: "rare",      type: "emoji", emoji: "🎯", flagId: "crate-target"    },
  { id: "crate-radiant",   label: "Radiant Star",  rarity: "epic",      type: "svg" },
  { id: "crate-crescent",  label: "Neon Crescent", rarity: "epic",      type: "svg" },
  { id: "crate-volcano",   label: "Volcano Fury",  rarity: "legendary", type: "svg" },
  { id: "crate-cyberhack", label: "Cyber Hack",    rarity: "legendary", type: "svg" },
];

export const RARITY_RANK: Record<CrateRarity, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };

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
  const strip: CrateItem[] = Array.from({ length: 80 }, () => pickCrateItem());
  strip[WINNER_IDX] = winner;
  return strip;
}

// ── CrateModal ─────────────────────────────────────────────────────────────────
const ITEM_W    = 80;
const WINNER_IDX = 65;
export const CRATE_COST = 50;

export interface CrateModalProps {
  open: boolean;
  onClose: () => void;
  coins: number;
  ownedCrateItems: string[];
  onPay: (amount: number) => void;
  onClaim: (item: CrateItem) => void;
  /** If set, spin immediately on open with this quantity — skips idle button press */
  autoOpen?: 1 | 3;
  /** Number of free crate keys in the player's misc inventory */
  miscKeys?: number;
  /** Called when the player uses a key to open a crate */
  onUseKey?: () => void;
}

export function CrateModal({ open, onClose, coins, ownedCrateItems, onPay, onClaim, autoOpen, miscKeys = 0, onUseKey }: CrateModalProps) {
  const [phase,    setPhase]    = useState<"idle" | "spinning" | "done">("idle");
  const [quantity, setQuantity] = useState<1 | 3>(1);
  const [strip,    setStrip]    = useState<CrateItem[]>([]);
  const [winners,  setWinners]  = useState<CrateItem[]>([]);

  const stripRef = useRef<HTMLDivElement>(null);
  const reelRef  = useRef<HTMLDivElement>(null);

  // Core spin logic — accepts explicit qty so it works from both button and autoOpen
  const startSpin = useCallback((qty: 1 | 3) => {
    const cost = CRATE_COST * qty;
    if (coins < cost || phase !== "idle") return;

    const wonItems  = Array.from({ length: qty }, () => pickCrateItem());
    const reelWinner = wonItems.reduce((best, cur) =>
      RARITY_RANK[cur.rarity] > RARITY_RANK[best.rarity] ? cur : best
    );
    const newStrip = buildStrip(reelWinner);

    setQuantity(qty);
    setWinners(wonItems);
    setStrip(newStrip);
    setPhase("spinning");
    onPay(cost);

    requestAnimationFrame(() => {
      if (!stripRef.current || !reelRef.current) return;
      const containerW  = reelRef.current.offsetWidth || 320;
      const centerOffset = containerW / 2 - ITEM_W / 2;
      const targetX      = -(WINNER_IDX * ITEM_W - centerOffset);

      stripRef.current.style.transition = "none";
      stripRef.current.style.transform  = "translateX(0px)";
      requestAnimationFrame(() => {
        if (!stripRef.current) return;
        stripRef.current.style.transition = "transform 5.5s cubic-bezier(0.12, 0.8, 0.32, 1)";
        stripRef.current.style.transform  = `translateX(${targetX}px)`;
      });
    });

    setTimeout(() => setPhase("done"), 5700);
  }, [coins, phase, onPay]);

  // Keep a stable ref so the autoOpen effect always sees the latest startSpin
  const startSpinRef = useRef(startSpin);
  startSpinRef.current = startSpin;

  // Auto-spin when opened via shop 1x / 3x button
  const hasAutoSpun = useRef(false);
  useEffect(() => {
    if (!open) {
      hasAutoSpun.current = false;
      return;
    }
    if (autoOpen && !hasAutoSpun.current) {
      hasAutoSpun.current = true;
      // Small delay so the DOM (reel refs) is mounted
      const t = setTimeout(() => startSpinRef.current(autoOpen), 60);
      return () => clearTimeout(t);
    }
  }, [open, autoOpen]);

  const handleOpen = useCallback(() => startSpin(quantity), [startSpin, quantity]);

  // Open 1 crate for free using a key (no coin cost)
  const handleKeyOpen = useCallback(() => {
    if (miscKeys <= 0 || phase !== "idle") return;
    onUseKey?.();

    const winner = pickCrateItem();
    const newStrip = buildStrip(winner);
    setQuantity(1);
    setWinners([winner]);
    setStrip(newStrip);
    setPhase("spinning");

    requestAnimationFrame(() => {
      if (!stripRef.current || !reelRef.current) return;
      const containerW  = reelRef.current.offsetWidth || 320;
      const centerOffset = containerW / 2 - ITEM_W / 2;
      const targetX      = -(WINNER_IDX * ITEM_W - centerOffset);
      stripRef.current.style.transition = "none";
      stripRef.current.style.transform  = "translateX(0px)";
      requestAnimationFrame(() => {
        if (!stripRef.current) return;
        stripRef.current.style.transition = "transform 5.5s cubic-bezier(0.12, 0.8, 0.32, 1)";
        stripRef.current.style.transform  = `translateX(${targetX}px)`;
      });
    });
    setTimeout(() => setPhase("done"), 5700);
  }, [miscKeys, phase, onUseKey]);

  const handleClaimAll = useCallback(() => {
    winners.forEach((w) => onClaim(w));
    setPhase("idle");
    setStrip([]);
    setWinners([]);
    if (autoOpen) onClose();
  }, [winners, onClaim, autoOpen, onClose]);

  const handleClose = useCallback(() => {
    if (phase === "spinning") return;
    setPhase("idle");
    setStrip([]);
    setWinners([]);
    onClose();
  }, [phase, onClose]);

  if (!open) return null;

  const bestWinner  = winners.length > 0
    ? winners.reduce((best, cur) => RARITY_RANK[cur.rarity] > RARITY_RANK[best.rarity] ? cur : best)
    : null;
  const winnerColor = bestWinner ? getRarityColor(bestWinner.rarity) : "#ffd700";
  const multi       = winners.length > 1;

  const DROP_RATES = [
    { label: "Common",    pct: "65%", color: "#8a9bb0", preview: "🥕🥦🌾🍀" },
    { label: "Rare",      pct: "25%", color: "#4d9fff", preview: "🌊🍒🎯" },
    { label: "Epic",      pct: "8%",  color: "#c084fc", preview: <span style={{ display: "flex", gap: 3, alignItems: "center" }}><RadiantStarSVG size={20} /><NeonCrescentSVG size={20} /></span> },
    { label: "Legendary", pct: "2%",  color: "#ffd700", preview: <span style={{ display: "flex", gap: 3, alignItems: "center" }}><VolcanoFurySVG size={20} /><CyberHackSVG size={20} /></span> },
  ];

  return (
    <div className="menu-overlay" onClick={handleClose}>
      <div className="menu-sheet crate-modal-sheet" onClick={(e) => e.stopPropagation()}>
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
          <div
            className="crate-selector"
            style={{
              borderColor: phase === "done" ? winnerColor : "#ffd700",
              boxShadow: `0 0 14px ${phase === "done" ? winnerColor : "#ffd700"}50`,
            }}
          />
          <div className="crate-fade crate-fade-l" />
          <div className="crate-fade crate-fade-r" />
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
        {phase === "done" && winners.length > 0 && (
          <div className="crate-winners-list">
            {winners.map((winner, idx) => {
              const alreadyOwned = ownedCrateItems.includes(winner.id);
              const color = getRarityColor(winner.rarity);
              return (
                <div
                  key={idx}
                  className={`crate-winner-card${multi ? " crate-winner-compact" : ""}`}
                  style={{ borderColor: color, boxShadow: `0 0 14px ${color}18` }}
                >
                  <div className="crate-winner-icon">
                    <CrateItemDisplay item={winner} size={multi ? 36 : 48} />
                  </div>
                  <div className="crate-winner-info">
                    <span className="crate-winner-rarity" style={{ color }}>
                      {getRarityLabel(winner.rarity)}
                    </span>
                    <span className="crate-winner-name">{winner.label}</span>
                    <span className="crate-winner-hint">
                      {alreadyOwned ? "Already owned" : "Added to flags!"}
                    </span>
                  </div>
                </div>
              );
            })}
            <button
              className="crate-claim-all-btn"
              style={{ borderColor: winnerColor, color: winnerColor }}
              onClick={handleClaimAll}
            >
              {multi ? "Claim All" : "Claim"}
            </button>
          </div>
        )}

        {/* Quantity toggle + open button — only shown when no autoOpen (manual open mode) */}
        {phase === "idle" && !autoOpen && (
          <div className="crate-open-area">
            <div className="crate-qty-toggle">
              <button className={`crate-qty-btn${quantity === 1 ? " active" : ""}`} onClick={() => setQuantity(1)}>1x</button>
              <button className={`crate-qty-btn${quantity === 3 ? " active" : ""}`} onClick={() => setQuantity(3)}>3x</button>
            </div>
            <button
              className={`crate-open-btn${coins >= CRATE_COST * quantity ? "" : " cant-afford"}`}
              onClick={handleOpen}
              disabled={coins < CRATE_COST * quantity}
            >
              <CoinIcon size={14} />
              Open {quantity > 1 ? `${quantity}x ` : ""}Crate{quantity > 1 ? "s" : ""} — {CRATE_COST * quantity}
            </button>
            {miscKeys > 0 && (
              <button
                className="crate-open-btn"
                style={{ marginTop: 6, background: "transparent", borderColor: "#ffd700", color: "#ffd700" }}
                onClick={handleKeyOpen}
              >
                🗝️ Use Key — Open 1 Free ({miscKeys} key{miscKeys !== 1 ? "s" : ""})
              </button>
            )}
          </div>
        )}
        {/* Key button also visible when autoOpen is set (after claiming) */}
        {phase === "idle" && autoOpen && miscKeys > 0 && (
          <div className="crate-open-area" style={{ paddingTop: 0 }}>
            <button
              className="crate-open-btn"
              style={{ background: "transparent", borderColor: "#ffd700", color: "#ffd700" }}
              onClick={handleKeyOpen}
            >
              🗝️ Use Key — Open 1 Free ({miscKeys} key{miscKeys !== 1 ? "s" : ""})
            </button>
          </div>
        )}
        {phase === "spinning" && (
          <div className="crate-rolling">Rolling…</div>
        )}
        {/* After auto-open claim: let user open again manually */}
        {phase === "idle" && autoOpen && (
          <div style={{ height: 8 }} />
        )}
      </div>
    </div>
  );
}
