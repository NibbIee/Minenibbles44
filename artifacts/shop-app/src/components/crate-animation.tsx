import React, { useState } from 'react';
import { useStore, CRATE_ITEMS, ItemType, getRarityColorClass } from '../lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ItemGraphic } from './flags';
import { Sparkles, Trophy } from 'lucide-react';

interface CrateAnimationProps {
  onClose: () => void;
  onClaim: (item: ItemType) => void;
}

const generateStripItems = (winningItem: ItemType) => {
  // Common (65%): Carrot, Broccoli, Mushroom, Wheat
  // Rare (25%): Diamond Shard, Crystal Orb, Crown
  // Epic (8%): Radiant Star, Neon Crescent
  // Legendary (2%): Volcano Fury, Cyber Hack

  const items: ItemType[] = [];
  const TOTAL_ITEMS = 80;
  const WINNING_INDEX = 65; // Position where it stops (offset from left edge)

  const pool = {
    Common: CRATE_ITEMS.filter(i => i.rarity === 'Common'),
    Rare: CRATE_ITEMS.filter(i => i.rarity === 'Rare'),
    Epic: CRATE_ITEMS.filter(i => i.rarity === 'Epic'),
    Legendary: CRATE_ITEMS.filter(i => i.rarity === 'Legendary')
  };

  const getRandomItem = () => {
    const rand = Math.random() * 100;
    let rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' = 'Common';
    if (rand < 65) rarity = 'Common';
    else if (rand < 90) rarity = 'Rare';
    else if (rand < 98) rarity = 'Epic';
    else rarity = 'Legendary';
    
    const itemsOfRarity = pool[rarity];
    return itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
  };

  for (let i = 0; i < TOTAL_ITEMS; i++) {
    if (i === WINNING_INDEX) {
      items.push(winningItem);
    } else {
      items.push(getRandomItem());
    }
  }

  return { items, winningIndex: WINNING_INDEX };
};

export function CrateAnimation({ onClose, onClaim }: CrateAnimationProps) {
  const [step, setStep] = useState<'intro' | 'rolling' | 'revealed'>('intro');
  const [winningItem, setWinningItem] = useState<ItemType | null>(null);
  const [stripData, setStripData] = useState<{ items: ItemType[], winningIndex: number } | null>(null);

  React.useEffect(() => {
    // Determine winner based on odds
    const rand = Math.random() * 100;
    let rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' = 'Common';
    if (rand < 65) rarity = 'Common';
    else if (rand < 90) rarity = 'Rare';
    else if (rand < 98) rarity = 'Epic';
    else rarity = 'Legendary';

    const pool = CRATE_ITEMS.filter(i => i.rarity === rarity);
    const winner = pool[Math.floor(Math.random() * pool.length)];
    
    setWinningItem(winner);
    setStripData(generateStripItems(winner));

    const introTimer = setTimeout(() => {
      setStep('rolling');
    }, 800);

    return () => clearTimeout(introTimer);
  }, []);

  const TILE_WIDTH = 100;
  const GAP = 16;
  const TILE_FULL_WIDTH = TILE_WIDTH + GAP;

  const handleAnimationComplete = () => {
    setStep('revealed');
  };

  if (!stripData || !winningItem) return null;

  // Calculate the final X position so the winning item centers exactly under the line
  // Screen center offset - (winning index * tile full width) - half a tile width
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const centerOffset = windowWidth / 2;
  const finalX = centerOffset - (stripData.winningIndex * TILE_FULL_WIDTH) - (TILE_WIDTH / 2);

  // Add some random offset within the winning tile so it doesn't land perfectly center every time
  const randomOffset = (Math.random() - 0.5) * (TILE_WIDTH * 0.8);
  const finalXWithOffset = finalX - randomOffset;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-hidden">
      
      {/* Intro flash */}
      {step === 'intro' && (
        <motion.div 
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      )}

      {/* Main Crate Modal Area */}
      <div className="relative w-full max-w-6xl h-96 flex items-center justify-center mt-[-10vh]">
        
        {/* The center line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-primary z-20 shadow-[0_0_10px_rgba(251,191,36,1)] -translate-x-1/2">
          <div className="absolute top-0 left-1/2 w-4 h-4 bg-primary rotate-45 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-primary rotate-45 -translate-x-1/2 translate-y-1/2" />
        </div>

        {/* The scrolling strip */}
        <div className="relative w-full h-[140px] overflow-visible flex items-center">
          {step !== 'intro' && (
            <motion.div
              className="flex items-center"
              style={{ gap: `${GAP}px` }}
              initial={{ x: centerOffset }}
              animate={step === 'rolling' ? { x: finalXWithOffset } : { x: finalXWithOffset }}
              transition={{
                x: {
                  type: "tween",
                  ease: [0.15, 0.95, 0.25, 1], // Custom cubic-bezier for a satisfying slow down
                  duration: 5.5,
                }
              }}
              onAnimationComplete={handleAnimationComplete}
            >
              {stripData.items.map((item, i) => {
                const isWinner = i === stripData.winningIndex;
                const isRevealed = step === 'revealed';
                
                return (
                  <motion.div
                    key={`${i}-${item.id}`}
                    className={`
                      relative shrink-0 w-[100px] h-[120px] rounded-lg border-2 flex flex-col items-center justify-center bg-card
                      transition-all duration-700
                      ${isRevealed && !isWinner ? 'opacity-30 scale-95 grayscale' : ''}
                      ${isRevealed && isWinner ? getRarityColorClass(item.rarity, 'glow') : ''}
                      ${isRevealed && isWinner ? getRarityColorClass(item.rarity, 'border') : 'border-border'}
                    `}
                    animate={isRevealed && isWinner ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <div className={`w-full h-1 absolute bottom-0 left-0 ${getRarityColorClass(item.rarity, 'bg')}`} />
                    <ItemGraphic item={item} className="w-16 h-16" />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Overlay fade on edges */}
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      </div>

      {/* Reveal Overlay & Button */}
      <AnimatePresence>
        {step === 'revealed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-[15%] left-1/2 -translate-x-1/2 flex flex-col items-center text-center z-30"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 ${getRarityColorClass(winningItem.rarity, 'bg')} bg-opacity-20 border ${getRarityColorClass(winningItem.rarity, 'border')}`}>
              <Sparkles className={`w-4 h-4 ${getRarityColorClass(winningItem.rarity, 'text')}`} />
              <span className={`font-bold uppercase tracking-wider text-sm ${getRarityColorClass(winningItem.rarity, 'text')}`}>
                {winningItem.rarity}
              </span>
            </div>
            
            <h2 className="text-4xl font-black mb-8 text-foreground drop-shadow-lg">
              {winningItem.name}
            </h2>

            <button
              onClick={() => onClaim(winningItem)}
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg hover:bg-primary/90 hover:scale-105 transition-all active:scale-95 text-lg"
            >
              Claim Item
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}