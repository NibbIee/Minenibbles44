import React, { useState } from 'react';
import { useStore, getRarityColorClass } from '../lib/store';
import { FISH_TYPES, FishType, FishRarity, formatWeight } from '../lib/fish';
import { FishSVG } from '../components/fish-svg';
import { ItemGraphic } from '../components/flags';
import { PackageOpen, Tag, Fish } from 'lucide-react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';

type Tab = 'items' | 'fish';

const FISH_RARITY_COLORS: Record<FishRarity, { text: string; border: string; bg: string; glow: string }> = {
  Common: { text: 'text-gray-400', border: 'border-gray-500', bg: 'bg-gray-500/10', glow: '' },
  Rare: { text: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-500/10', glow: 'shadow-[0_0_12px_rgba(59,130,246,0.35)]' },
  Epic: { text: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-500/10', glow: 'shadow-[0_0_16px_rgba(168,85,247,0.4)]' },
  Legendary: { text: 'text-amber-400', border: 'border-amber-500', bg: 'bg-amber-500/10', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]' },
};

export function Inventory() {
  const { inventory, fishInventory } = useStore();
  const [tab, setTab] = useState<Tab>('items');
  const [filter, setFilter] = useState<string>('All');
  const [fishFilter, setFishFilter] = useState<string>('All');

  const rarities = ['All', 'Legendary', 'Epic', 'Rare', 'Common'];

  const filteredInventory = inventory
    .filter(item => filter === 'All' || item.rarity === filter)
    .sort((a, b) => {
      const order = { Legendary: 4, Epic: 3, Rare: 2, Common: 1 };
      if (order[a.rarity] !== order[b.rarity]) return order[b.rarity] - order[a.rarity];
      return b.acquiredAt - a.acquiredAt;
    });

  const totalFishCount = Object.values(fishInventory).reduce((a, b) => a + b, 0);

  const ownedFish = FISH_TYPES
    .filter(f => (fishInventory[f.id] || 0) > 0)
    .filter(f => fishFilter === 'All' || f.rarity === fishFilter)
    .sort((a, b) => {
      const order: Record<FishRarity, number> = { Legendary: 4, Epic: 3, Rare: 2, Common: 1 };
      if (order[a.rarity] !== order[b.rarity]) return order[b.rarity] - order[a.rarity];
      return (fishInventory[b.id] || 0) - (fishInventory[a.id] || 0);
    });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            {tab === 'items' ? `${inventory.length} items collected` : `${totalFishCount} fish in bucket`}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border">
          <button
            onClick={() => setTab('items')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'items' ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PackageOpen className="w-4 h-4" />
            Items
          </button>
          <button
            onClick={() => setTab('fish')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'fish' ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Fish className="w-4 h-4" />
            Fish
            {totalFishCount > 0 && (
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {totalFishCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── ITEMS TAB ── */}
      {tab === 'items' && (
        <>
          {inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
              <div className="w-28 h-28 bg-secondary rounded-full flex items-center justify-center">
                <PackageOpen className="w-14 h-14 text-muted-foreground" />
              </div>
              <div className="max-w-md">
                <h2 className="text-2xl font-bold mb-2">No items yet</h2>
                <p className="text-muted-foreground mb-6">Visit the shop to buy items or crack open some crates!</p>
                <Link href="/shop" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                  Go to Shop
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {rarities.map(r => (
                  <button
                    key={r}
                    onClick={() => setFilter(r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      filter === r
                        ? r === 'All' ? 'bg-foreground text-background' : getRarityColorClass(r as any, 'bg') + ' text-background'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredInventory.map(item => (
                  <div
                    key={item.instanceId}
                    className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md"
                  >
                    <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[140px] bg-secondary/10 relative overflow-hidden">
                      <div className={`absolute top-0 w-full h-1 ${getRarityColorClass(item.rarity, 'bg')}`} />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                      <ItemGraphic item={item} className="w-16 h-16 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                    </div>
                    <div className="p-3 bg-card border-t border-border/50 flex flex-col gap-2">
                      <h3 className="font-bold text-sm truncate text-foreground" title={item.name}>{item.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-background border ${getRarityColorClass(item.rarity, 'border')} ${getRarityColorClass(item.rarity, 'text')}`}>
                          {item.rarity}
                        </span>
                        <div className="flex items-center gap-1 text-muted-foreground text-[10px] bg-secondary/50 px-1.5 py-0.5 rounded-sm">
                          {item.acquiredFrom === 'crate' ? <PackageOpen className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                          <span>{item.acquiredFrom === 'crate' ? 'Drop' : 'Bought'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredInventory.length === 0 && filter !== 'All' && (
                <div className="py-12 text-center text-muted-foreground">No {filter} items found.</div>
              )}
            </>
          )}
        </>
      )}

      {/* ── FISH TAB ── */}
      {tab === 'fish' && (
        <>
          {totalFishCount === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
              <div className="text-7xl">🎣</div>
              <div className="max-w-md">
                <h2 className="text-2xl font-bold mb-2">No fish yet</h2>
                <p className="text-muted-foreground mb-6">Head over to Fishing and cast your first line!</p>
                <Link href="/fishing" className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-500">
                  Go Fishing
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {rarities.map(r => (
                  <button
                    key={r}
                    onClick={() => setFishFilter(r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      fishFilter === r
                        ? r === 'All' ? 'bg-foreground text-background' : getRarityColorClass(r as any, 'bg') + ' text-background'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {ownedFish.map(fish => {
                  const count = fishInventory[fish.id] || 0;
                  const rc = FISH_RARITY_COLORS[fish.rarity];
                  return (
                    <motion.div
                      key={fish.id}
                      whileHover={{ y: -4 }}
                      className={`relative group flex flex-col bg-card rounded-xl border overflow-hidden shadow-sm transition-all ${rc.border} ${rc.glow}`}
                    >
                      {/* Stack badge */}
                      <div className={`absolute top-2 right-2 z-10 text-[11px] font-bold px-2 py-0.5 rounded-full border ${rc.bg} ${rc.text} ${rc.border}`}>
                        ×{count > 999 ? '999+' : count}
                      </div>

                      {/* Rarity top bar */}
                      <div className={`absolute top-0 w-full h-1 ${fish.rarity === 'Common' ? 'bg-gray-500' : fish.rarity === 'Rare' ? 'bg-blue-500' : fish.rarity === 'Epic' ? 'bg-purple-500' : 'bg-amber-500'}`} />

                      <div className="p-5 flex flex-col items-center justify-center min-h-[140px] bg-secondary/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="group-hover:scale-110 transition-transform duration-300 relative z-10">
                          <FishSVG fish={fish} size={64} />
                        </div>
                      </div>

                      <div className="p-3 bg-card border-t border-border/50 flex flex-col gap-1.5">
                        <h3 className="font-bold text-sm truncate text-foreground">{fish.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-background border ${rc.border} ${rc.text}`}>
                            {fish.rarity}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{formatWeight(fish.weight)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {ownedFish.length === 0 && fishFilter !== 'All' && (
                <div className="py-12 text-center text-muted-foreground">No {fishFilter} fish in your bucket.</div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
