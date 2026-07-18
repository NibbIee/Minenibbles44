import React, { useState } from 'react';
import { useStore, getRarityColorClass } from '../lib/store';
import { ItemGraphic } from '../components/flags';
import { PackageOpen, Clock, Tag } from 'lucide-react';
import { Link } from 'wouter';

export function Inventory() {
  const { inventory } = useStore();
  const [filter, setFilter] = useState<string>('All');

  const rarities = ['All', 'Legendary', 'Epic', 'Rare', 'Common'];

  const filteredInventory = inventory
    .filter(item => filter === 'All' || item.rarity === filter)
    .sort((a, b) => {
      // Sort by rarity first, then newest
      const order = { Legendary: 4, Epic: 3, Rare: 2, Common: 1 };
      if (order[a.rarity] !== order[b.rarity]) {
        return order[b.rarity] - order[a.rarity];
      }
      return b.acquiredAt - a.acquiredAt;
    });

  if (inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-32 h-32 bg-secondary rounded-full flex items-center justify-center mb-4">
          <PackageOpen className="w-16 h-16 text-muted-foreground" />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-2">Your inventory is empty</h2>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't acquired any items yet. Visit the shop to purchase items or open loot crates!
          </p>
          <Link href="/shop" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Go to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">{inventory.length} items collected</p>
        </div>
        
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredInventory.map(item => (
          <div 
            key={item.instanceId} 
            className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md animate-in fade-in zoom-in-95 duration-300"
          >
            <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[140px] bg-secondary/10 relative overflow-hidden">
              <div className={`absolute top-0 w-full h-1 ${getRarityColorClass(item.rarity, 'bg')}`} />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              <ItemGraphic item={item} className="w-16 h-16 group-hover:scale-110 transition-transform duration-300 relative z-10" />
            </div>
            
            <div className="p-3 bg-card border-t border-border/50 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-sm truncate text-foreground" title={item.name}>{item.name}</h3>
              </div>
              
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
        <div className="py-12 text-center text-muted-foreground">
          No {filter} items found in your inventory.
        </div>
      )}
    </div>
  );
}