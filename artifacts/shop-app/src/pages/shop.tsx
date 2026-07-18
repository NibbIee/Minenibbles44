import React, { useState } from 'react';
import { useStore, SHOP_ITEMS, CRATE_ITEMS, getRarityColorClass } from '../lib/store';
import { ItemGraphic } from '../components/flags';
import { CrateAnimation } from '../components/crate-animation';
import { Lock, Unlock, ShoppingCart, Info, AlertTriangle, PackageOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Shop() {
  const [activeTab, setActiveTab] = useState<'items' | 'crates'>('items');
  const { coins, setCoins, inventory, addInventoryItem, incrementCratesOpened } = useStore();
  const [isOpeningCrate, setIsOpeningCrate] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleBuyItem = (item: any) => {
    if (coins < item.price) {
      setErrorMsg("Insufficient coins!");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setCoins(prev => prev - item.price);
    addInventoryItem(item, 'purchased');
  };

  const handleOpenCrate = () => {
    if (coins < 50) {
      setErrorMsg("Insufficient coins to open crate!");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setIsOpeningCrate(true);
  };

  const onCrateClaim = (item: any) => {
    setCoins(prev => prev - 50);
    incrementCratesOpened();
    addInventoryItem(item, 'crate');
    setIsOpeningCrate(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'items' ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Items
          </button>
          <button
            onClick={() => setActiveTab('crates')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'crates' ? 'bg-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Crates
          </button>
        </div>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'items' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {SHOP_ITEMS.map(item => {
            const isOwned = inventory.some(i => i.id === item.id);
            const canAfford = coins >= (item.price || 0);

            return (
              <div key={item.id} className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
                <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[160px] bg-secondary/20 relative overflow-hidden">
                  <div className={`absolute top-0 w-full h-1 ${getRarityColorClass(item.rarity, 'bg')}`} />
                  <ItemGraphic item={item} className="w-20 h-20 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-foreground">{item.name}</h3>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${getRarityColorClass(item.rarity, 'text')}`}>
                        {item.rarity}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-secondary/80 px-2 py-1 rounded text-sm font-medium">
                      <span>🪙</span>
                      <span>{item.price}</span>
                    </div>
                  </div>
                  
                  {isOwned ? (
                    <button disabled className="w-full py-2 bg-secondary text-muted-foreground rounded-md font-medium text-sm flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4" /> Owned
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleBuyItem(item)}
                      disabled={!canAfford}
                      className={`w-full py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors
                        ${canAfford 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }
                      `}
                    >
                      <ShoppingCart className="w-4 h-4" /> Buy
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'crates' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto flex flex-col gap-8">
          
          <div className="relative group overflow-hidden rounded-2xl border-2 border-primary/50 bg-[#0a0d14] shadow-[0_0_30px_rgba(251,191,36,0.15)] hover:shadow-[0_0_40px_rgba(251,191,36,0.25)] transition-all">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
            
            {/* Background patterns */}
            <div className="absolute inset-0 opacity-10 flex flex-wrap gap-4 p-4 pointer-events-none justify-center items-center overflow-hidden mix-blend-screen">
              {CRATE_ITEMS.slice(0, 10).map((i, idx) => (
                <div key={idx} className="scale-150 rotate-12 blur-[2px]">
                  {i.type === 'emoji' ? i.emoji : '🚩'}
                </div>
              ))}
            </div>

            <div className="relative z-10 p-10 flex flex-col items-center text-center space-y-6">
              <div className="w-32 h-32 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-xl bg-primary/30 animate-pulse" />
                  <PackageOpen className="w-24 h-24 text-primary relative z-10 drop-shadow-xl" strokeWidth={1.5} />
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl font-black uppercase tracking-widest text-foreground">Premium Crate</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="h-[2px] w-8 bg-rarity-common" />
                  <div className="h-[2px] w-8 bg-rarity-rare" />
                  <div className="h-[2px] w-8 bg-rarity-epic" />
                  <div className="h-[2px] w-8 bg-rarity-legendary" />
                </div>
              </div>

              <button 
                onClick={handleOpenCrate}
                className="w-full sm:w-auto px-10 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl shadow-[0_4px_14px_0_rgba(251,191,36,0.39)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.23)] hover:-translate-y-1 transition-all active:translate-y-0 flex items-center justify-center gap-3"
              >
                <Unlock className="w-5 h-5" />
                Open for 50 🪙
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-secondary/50 p-4 border-b border-border flex items-center gap-2">
              <Info className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Drop Rates</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-rarity-common font-bold">Common</span>
                  <span>65%</span>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                  {CRATE_ITEMS.filter(i => i.rarity === 'Common').map(i => (
                    <span key={i.id} className="bg-secondary px-2 py-1 rounded">{i.name}</span>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-rarity-rare font-bold">Rare</span>
                  <span>25%</span>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                  {CRATE_ITEMS.filter(i => i.rarity === 'Rare').map(i => (
                    <span key={i.id} className="bg-secondary px-2 py-1 rounded">{i.name}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-rarity-epic font-bold">Epic</span>
                  <span>8%</span>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                  {CRATE_ITEMS.filter(i => i.rarity === 'Epic').map(i => (
                    <span key={i.id} className="bg-secondary px-2 py-1 rounded">{i.name}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-rarity-legendary font-bold flex items-center gap-1">
                    Legendary 
                    <span className="animate-pulse">✨</span>
                  </span>
                  <span>2%</span>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                  {CRATE_ITEMS.filter(i => i.rarity === 'Legendary').map(i => (
                    <span key={i.id} className="bg-secondary px-2 py-1 rounded border border-rarity-legendary/30 text-rarity-legendary">{i.name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {isOpeningCrate && (
        <CrateAnimation 
          onClose={() => setIsOpeningCrate(false)} 
          onClaim={onCrateClaim}
        />
      )}
    </div>
  );
}