import React from 'react';
import { useStore, SHOP_ITEMS, CRATE_ITEMS, getRarityColorClass } from '../lib/store';
import { PackageOpen, Coins } from 'lucide-react';
import { Link } from 'wouter';

export function Home() {
  const { coins, inventory, cratesOpened } = useStore();

  const totalValue = inventory.reduce((acc, item) => {
    const shopItem = SHOP_ITEMS.find(s => s.id === item.id) || CRATE_ITEMS.find(c => c.id === item.id);
    // Rough estimate of crate items value based on rarity if no price
    let val = shopItem?.price || 0;
    if (!val) {
      if (item.rarity === 'Common') val = 10;
      if (item.rarity === 'Rare') val = 50;
      if (item.rarity === 'Epic') val = 200;
      if (item.rarity === 'Legendary') val = 1000;
    }
    return acc + val;
  }, 0);

  const legendaries = inventory.filter(i => i.rarity === 'Legendary').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-8 sm:p-12 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-secondary rounded-full mb-4 shadow-lg ring-1 ring-border">
            <span className="text-6xl drop-shadow-md">🪙</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Balance: <span className="text-primary">{coins.toLocaleString()}</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg">
            Welcome to NibbleStore. Buy premium items or try your luck with our exclusive loot crates.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/shop" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 shadow-lg shadow-primary/20">
              Open Shop
            </Link>
            <Link href="/inventory" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8">
              View Inventory
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <PackageOpen className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Items Owned</h3>
          </div>
          <div className="text-3xl font-bold">{inventory.length}</div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <PackageOpen className="w-5 h-5 text-rarity-epic" />
            <h3 className="font-semibold text-foreground">Crates Opened</h3>
          </div>
          <div className="text-3xl font-bold">{cratesOpened}</div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <Coins className="w-5 h-5 text-rarity-legendary" />
            <h3 className="font-semibold text-foreground">Est. Value</h3>
          </div>
          <div className="text-3xl font-bold text-rarity-legendary">
            ~{totalValue.toLocaleString()}
          </div>
        </div>
      </div>
      
      {legendaries > 0 && (
        <div className="mt-8 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rarity-legendary/30 bg-rarity-legendary/10 text-rarity-legendary text-sm font-medium">
            🏆 You own {legendaries} Legendary item{legendaries > 1 ? 's' : ''}!
          </span>
        </div>
      )}

    </div>
  );
}