import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FishType, rollFish, formatWeight } from '../lib/fish';
import { FishSVG } from './fish-svg';

type Phase = 'cast' | 'waiting' | 'minigame' | 'caught' | 'escaped';

interface FishingGameProps {
  onCatch: (fish: FishType) => void;
  onEscape: () => void;
  onClose: () => void;
}

const ZONE_HEIGHT = 80;
const BAR_HEIGHT = 300;
const FISH_SIZE = 36;

const RARITY_COLORS: Record<string, string> = {
  Common: '#9ca3af',
  Rare: '#3b82f6',
  Epic: '#a855f7',
  Legendary: '#f59e0b',
};

export function FishingGame({ onCatch, onEscape }: FishingGameProps) {
  const [phase, setPhase] = useState<Phase>('cast');
  const [rolledFish, setRolledFish] = useState<FishType | null>(null);
  const [progress, setProgress] = useState(30);
  const [fishY, setFishY] = useState(BAR_HEIGHT / 2);
  const [zoneY, setZoneY] = useState(BAR_HEIGHT / 2 - ZONE_HEIGHT / 2);
  const [holdingDown, setHoldingDown] = useState(false);
  const [biteFlash, setBiteFlash] = useState(false);
  const [waitDots, setWaitDots] = useState(0);

  const holdingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  // Cast → waiting
  useEffect(() => {
    const t = setTimeout(() => setPhase('waiting'), 1200);
    return () => clearTimeout(t);
  }, []);

  // Waiting dots
  useEffect(() => {
    if (phase !== 'waiting') return undefined;
    const id = setInterval(() => setWaitDots(d => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, [phase]);

  // Random wait → bite → minigame
  useEffect(() => {
    if (phase !== 'waiting') return undefined;
    const waitMs = 2500 + Math.random() * 3500;
    const t = setTimeout(() => {
      const fish = rollFish();
      setRolledFish(fish);
      setBiteFlash(true);
      setTimeout(() => setBiteFlash(false), 600);
      setTimeout(() => setPhase('minigame'), 1200);
    }, waitMs);
    return () => clearTimeout(t);
  }, [phase]);

  // Game loop
  useEffect(() => {
    if (phase !== 'minigame') return undefined;
    if (startedRef.current) return undefined;
    startedRef.current = true;

    let lastTime = performance.now();
    let fishPos = BAR_HEIGHT / 2;
    let zonePos = BAR_HEIGHT / 2 - ZONE_HEIGHT / 2;
    let vel = 0;
    let prog = 30;

    const loop = (now: number): void => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const targetY =
        Math.random() < 0.02
          ? Math.random() * (BAR_HEIGHT - FISH_SIZE) + FISH_SIZE / 2
          : fishPos;
      const accel = (targetY - fishPos) * 3 + (Math.random() - 0.5) * 200;
      vel = (vel + accel * dt) * 0.92;
      fishPos = Math.max(FISH_SIZE / 2, Math.min(BAR_HEIGHT - FISH_SIZE / 2, fishPos + vel * dt));

      const zoneSpeed = holdingRef.current ? -280 : 180;
      zonePos = Math.max(0, Math.min(BAR_HEIGHT - ZONE_HEIGHT, zonePos + zoneSpeed * dt));

      const fishInZone = fishPos >= zonePos && fishPos <= zonePos + ZONE_HEIGHT;
      prog = fishInZone
        ? Math.min(100, prog + 22 * dt * 60)
        : Math.max(0, prog - 14 * dt * 60);

      setFishY(fishPos);
      setZoneY(zonePos);
      setProgress(prog);

      if (prog >= 100) {
        setPhase('caught');
        return;
      }
      if (prog <= 0) {
        setPhase('escaped');
        return;
      }

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
    if (phase === 'caught' && rolledFish) {
      const t = setTimeout(() => onCatch(rolledFish), 2200);
      return () => clearTimeout(t);
    }
    if (phase === 'escaped') {
      const t = setTimeout(() => onEscape(), 1800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, rolledFish, onCatch, onEscape]);

  const handleHoldStart = useCallback((e: React.PointerEvent | React.TouchEvent) => {
    e.preventDefault();
    holdingRef.current = true;
    setHoldingDown(true);
  }, []);

  const handleHoldEnd = useCallback(() => {
    holdingRef.current = false;
    setHoldingDown(false);
  }, []);

  const progressColor =
    progress > 70 ? '#22c55e' : progress > 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <AnimatePresence mode="wait">

        {/* CASTING */}
        {phase === 'cast' && (
          <motion.div key="cast" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6">
            <motion.div animate={{ rotate: [0, -30, 10, -10, 0], y: [0, -30, 0] }} transition={{ duration: 1, ease: 'easeOut' }}
              className="text-7xl select-none">🎣</motion.div>
            <p className="text-white/80 text-xl font-semibold">Casting line…</p>
            <motion.div initial={{ width: 0 }} animate={{ width: '140px' }} transition={{ duration: 1.1, ease: 'easeOut' }}
              className="h-0.5 bg-white/40 rounded-full" />
          </motion.div>
        )}

        {/* WAITING */}
        {phase === 'waiting' && (
          <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6">
            <div className="relative w-48 h-32 flex items-end justify-center">
              <div className="w-full h-16 bg-blue-900/60 rounded-xl border border-blue-500/30 relative overflow-hidden">
                <motion.div animate={{ x: [-20, 20, -20] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
                {biteFlash && (
                  <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 m-auto w-8 h-8 border-2 border-yellow-400 rounded-full" />
                )}
                <div className="absolute top-0 left-1/2 w-0.5 h-8 bg-white/50 -translate-x-1/2" />
                <motion.div
                  animate={biteFlash
                    ? { y: [0, -6, 2, -4, 0], scale: [1, 1.3, 1] }
                    : { y: [0, -2, 0] }}
                  transition={biteFlash
                    ? { duration: 0.5 }
                    : { repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="absolute top-8 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-400 rounded-full border border-white/50" />
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-white/40" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-3xl">🎣</div>
            </div>
            {biteFlash ? (
              <motion.p initial={{ scale: 0.8 }} animate={{ scale: [1, 1.2, 1] }}
                className="text-yellow-400 text-2xl font-bold">!! BITE !!</motion.p>
            ) : (
              <p className="text-white/70 text-lg font-medium">Waiting{'.'.repeat(waitDots)}</p>
            )}
          </motion.div>
        )}

        {/* MINIGAME */}
        {phase === 'minigame' && rolledFish && (
          <motion.div key="minigame" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 select-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
            <p className="text-white font-bold text-lg">Reel it in!</p>

            <div className="flex gap-4 items-center">
              {/* Catch bar */}
              <div className="relative bg-blue-950/80 border-2 border-blue-700/50 rounded-2xl overflow-hidden flex-shrink-0"
                style={{ width: 110, height: BAR_HEIGHT }}>
                <motion.div animate={{ x: [-20, 20, -20] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-blue-300/10 to-transparent pointer-events-none" />

                {/* Catch zone */}
                <div
                  className="absolute left-0 right-0 border-2 border-green-400/80 rounded-lg"
                  style={{
                    top: zoneY,
                    height: ZONE_HEIGHT,
                    background: 'rgba(34,197,94,0.15)',
                    transition: 'none',
                  }}
                />

                {/* Fish */}
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ top: fishY - FISH_SIZE / 2, transition: 'none' }}
                >
                  <FishSVG fish={rolledFish} size={FISH_SIZE} />
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex flex-col items-center gap-2" style={{ height: BAR_HEIGHT }}>
                <div className="relative flex-1 w-5 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                  <div
                    className="absolute bottom-0 w-full rounded-full transition-none"
                    style={{
                      height: `${progress}%`,
                      background: `linear-gradient(to top, ${progressColor}, ${progressColor}88)`,
                    }}
                  />
                </div>
                <span className="text-white/60 text-xs font-mono">{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Hold button */}
            <motion.button
              onPointerDown={handleHoldStart}
              onPointerUp={handleHoldEnd}
              onPointerLeave={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
              animate={holdingDown ? { scale: 0.93 } : { scale: 1 }}
              className={`w-44 h-16 rounded-2xl font-bold text-lg text-white border-4 transition-colors touch-none ${
                holdingDown
                  ? 'bg-green-500 border-green-300 shadow-[0_0_24px_rgba(34,197,94,0.6)]'
                  : 'bg-blue-600 border-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.4)]'
              }`}
              style={{ cursor: 'pointer', touchAction: 'none' }}
            >
              {holdingDown ? '🎣 Reeling!' : 'Hold to Reel'}
            </motion.button>
            <p className="text-white/50 text-xs">Keep the fish in the green zone</p>
          </motion.div>
        )}

        {/* CAUGHT */}
        {phase === 'caught' && rolledFish && (
          <motion.div key="caught" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="flex flex-col items-center gap-5 p-8 bg-gray-900/90 rounded-3xl border border-gray-700 max-w-xs w-full mx-4">
            <motion.div animate={{ rotate: [-5, 5, -5], y: [0, -4, 0] }} transition={{ repeat: 3, duration: 0.4 }}>
              <FishSVG fish={rolledFish} size={96} />
            </motion.div>
            <div className="text-center">
              <p className="text-white/70 text-sm uppercase tracking-widest mb-1">You caught a</p>
              <h2 className="text-3xl font-extrabold text-white">{rolledFish.name}</h2>
              <p className="text-white/50 text-sm mt-1">{formatWeight(rolledFish.weight)}</p>
            </div>
            <div className="px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider border"
              style={{
                color: RARITY_COLORS[rolledFish.rarity],
                borderColor: RARITY_COLORS[rolledFish.rarity] + '80',
                background: RARITY_COLORS[rolledFish.rarity] + '20',
              }}>
              {rolledFish.rarity}
            </div>
            <p className="text-white/60 text-sm text-center italic">"{rolledFish.description}"</p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
              className="text-white/40 text-xs">Adding to inventory…</motion.p>
          </motion.div>
        )}

        {/* ESCAPED */}
        {phase === 'escaped' && (
          <motion.div key="escaped" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 p-8">
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.5 }} className="text-6xl">💨</motion.div>
            <p className="text-red-400 text-2xl font-bold">It got away!</p>
            <p className="text-white/50 text-sm">Better luck next time…</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
