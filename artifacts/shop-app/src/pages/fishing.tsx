import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../lib/store';
import { FISH_TYPES, FishType, FishRarity, FISH_RARITY_CHANCES } from '../lib/fish';
import { FishSVG } from '../components/fish-svg';
import { FishingGame } from '../components/fishing-game';
import { Fish, Trophy, Info, X } from 'lucide-react';

const RARITY_COLORS: Record<FishRarity, { text: string; border: string; bg: string; glow: string }> = {
  Common: {
    text: 'text-gray-400',
    border: 'border-gray-500',
    bg: 'bg-gray-500/10',
    glow: '',
  },
  Rare: {
    text: 'text-blue-400',
    border: 'border-blue-500',
    bg: 'bg-blue-500/10',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]',
  },
  Epic: {
    text: 'text-purple-400',
    border: 'border-purple-500',
    bg: 'bg-purple-500/10',
    glow: 'shadow-[0_0_16px_rgba(168,85,247,0.5)]',
  },
  Legendary: {
    text: 'text-amber-400',
    border: 'border-amber-500',
    bg: 'bg-amber-500/10',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.6)]',
  },
};

export function Fishing() {
  const { fishInventory, addFish } = useStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<{ fish: FishType; caught: boolean } | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [totalCaught, setTotalCaught] = useState(() => {
    const s = localStorage.getItem('nibble_total_caught');
    return s ? parseInt(s) : 0;
  });

  const handleCast = () => {
    setLastResult(null);
    setIsPlaying(true);
  };

  const handleCatch = (fish: FishType) => {
    addFish(fish);
    const newTotal = totalCaught + 1;
    setTotalCaught(newTotal);
    localStorage.setItem('nibble_total_caught', String(newTotal));
    setLastResult({ fish, caught: true });
    setIsPlaying(false);
  };

  const handleEscape = () => {
    setLastResult({ fish: null as any, caught: false });
    setIsPlaying(false);
  };

  const totalFishCount = Object.values(fishInventory).reduce((a, b) => a + b, 0);
  const legendaryCount = FISH_TYPES.filter(f => f.rarity === 'Legendary')
    .reduce((a, f) => a + (fishInventory[f.id] || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Fish className="w-8 h-8 text-blue-400" />
            Fishing
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">WIP</span>
          </h1>
          <p className="text-muted-foreground mt-1">Cast your rod and reel in rare catches</p>
        </div>
        <button
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">How to Fish</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Fish Caught</p>
          <p className="text-3xl font-bold">{totalCaught}</p>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">In Bucket</p>
          <p className="text-3xl font-bold text-blue-400">{totalFishCount}</p>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Legendaries</p>
          <p className="text-3xl font-bold text-amber-400">{legendaryCount}</p>
        </div>
      </div>

      {/* Cast area */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-900/50 bg-gradient-to-b from-blue-950/60 to-gray-950/80 p-8 flex flex-col items-center gap-6 shadow-xl">
        {/* Water FX */}
        <motion.div
          animate={{ x: [-20, 20, -20] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-blue-500/5 to-blue-900/10 pointer-events-none"
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-950/40 to-transparent pointer-events-none" />

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="text-8xl relative z-10 drop-shadow-2xl"
        >
          🎣
        </motion.div>

        {/* Last result banner */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              key={lastResult.caught ? lastResult.fish?.id : 'escaped'}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`relative z-10 flex items-center gap-3 px-5 py-3 rounded-2xl border ${
                lastResult.caught
                  ? `${RARITY_COLORS[lastResult.fish.rarity].bg} ${RARITY_COLORS[lastResult.fish.rarity].border} ${RARITY_COLORS[lastResult.fish.rarity].glow}`
                  : 'bg-red-950/40 border-red-700/50'
              }`}
            >
              {lastResult.caught ? (
                <>
                  <FishSVG fish={lastResult.fish} size={36} />
                  <div>
                    <p className="font-bold text-white text-sm">Caught a {lastResult.fish.name}!</p>
                    <p className={`text-xs ${RARITY_COLORS[lastResult.fish.rarity].text}`}>
                      {lastResult.fish.rarity} · Added to inventory
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-2xl">💨</span>
                  <p className="text-red-400 font-semibold text-sm">The fish got away!</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCast}
          className="relative z-10 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-2xl border-2 border-blue-400/50 shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-colors"
        >
          🎣 Cast Rod
        </motion.button>

        <p className="text-white/40 text-sm relative z-10">
          Rare fish have a harder mini-game — hold your nerve!
        </p>
      </div>

      {/* Fish Bestiary */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Fish Bestiary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {FISH_TYPES.map(fish => {
            const owned = fishInventory[fish.id] || 0;
            const rc = RARITY_COLORS[fish.rarity];
            return (
              <motion.div
                key={fish.id}
                whileHover={{ y: -3 }}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border bg-card transition-all ${
                  owned > 0 ? `${rc.border} ${rc.glow}` : 'border-border opacity-50'
                }`}
              >
                {owned > 0 && (
                  <div
                    className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${rc.bg} ${rc.text} border ${rc.border}`}
                  >
                    {owned > 99 ? '99+' : `×${owned}`}
                  </div>
                )}
                <FishSVG fish={fish} size={52} />
                <p className="text-xs font-bold text-center text-foreground leading-tight">{fish.name}</p>
                <span className={`text-[10px] uppercase font-bold tracking-wide ${rc.text}`}>
                  {fish.rarity}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Minigame overlay */}
      {isPlaying && (
        <FishingGame
          onCatch={handleCatch}
          onEscape={handleEscape}
          onClose={() => setIsPlaying(false)}
        />
      )}

      {/* Guide modal */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold">How to Fish</h3>
                <button onClick={() => setShowGuide(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3"><span className="text-blue-400 font-bold">1.</span> Hit <strong className="text-foreground">Cast Rod</strong> to throw your line.</li>
                <li className="flex gap-3"><span className="text-blue-400 font-bold">2.</span> Wait for a bite — the bobber will shake!</li>
                <li className="flex gap-3"><span className="text-blue-400 font-bold">3.</span> A mini-game starts: a <span className="text-green-400 font-bold">green zone</span> and a fish appear in a bar.</li>
                <li className="flex gap-3"><span className="text-blue-400 font-bold">4.</span> <strong className="text-foreground">Hold the button</strong> to move the zone up, release to let it fall.</li>
                <li className="flex gap-3"><span className="text-blue-400 font-bold">5.</span> Keep the fish inside the zone to fill the <span className="text-green-400 font-bold">catch meter</span> to 100%!</li>
              </ol>
              <div className="mt-5 p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Drop Rates</p>
                {(Object.entries(FISH_RARITY_CHANCES) as [FishRarity, number][]).sort((a, b) => b[1] - a[1]).map(([r, c]) => (
                  <div key={r} className="flex justify-between text-sm py-0.5">
                    <span className={RARITY_COLORS[r].text + ' font-semibold'}>{r}</span>
                    <span className="text-muted-foreground">{c}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
