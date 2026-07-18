import { useState, useEffect, useCallback } from 'react';

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface ItemType {
  id: string;
  name: string;
  rarity: Rarity;
  price?: number;
  emoji?: string;
  type?: 'emoji' | 'flag';
  flagId?: string;
}

export interface InventoryItem extends ItemType {
  instanceId: string;
  acquiredFrom: 'crate' | 'purchased';
  acquiredAt: number;
}

export const SHOP_ITEMS: ItemType[] = [
  { id: 'apple', name: 'Apple', rarity: 'Common', price: 15, emoji: '🍎', type: 'emoji' },
  { id: 'blossom', name: 'Blossom', rarity: 'Common', price: 20, emoji: '🌸', type: 'emoji' },
  { id: 'music', name: 'Music Note', rarity: 'Common', price: 25, emoji: '🎵', type: 'emoji' },
  { id: 'hat', name: 'Top Hat', rarity: 'Rare', price: 80, emoji: '🎩', type: 'emoji' },
  { id: 'wave', name: 'Wave', rarity: 'Rare', price: 90, emoji: '🌊', type: 'emoji' },
  { id: 'guitar', name: 'Guitar', rarity: 'Rare', price: 100, emoji: '🎸', type: 'emoji' },
  { id: 'inferno', name: 'Inferno', rarity: 'Epic', price: 250, emoji: '🔥', type: 'emoji' },
  { id: 'thunder', name: 'Thunder', rarity: 'Epic', price: 300, emoji: '⚡', type: 'emoji' },
  { id: 'diamond', name: 'Diamond', rarity: 'Legendary', price: 800, emoji: '💎', type: 'emoji' },
];

export const CRATE_ITEMS: ItemType[] = [
  { id: 'carrot', name: 'Carrot', rarity: 'Common', emoji: '🥕', type: 'emoji' },
  { id: 'broccoli', name: 'Broccoli', rarity: 'Common', emoji: '🥦', type: 'emoji' },
  { id: 'mushroom', name: 'Mushroom', rarity: 'Common', emoji: '🍄', type: 'emoji' },
  { id: 'wheat', name: 'Wheat', rarity: 'Common', emoji: '🌾', type: 'emoji' },
  { id: 'shard', name: 'Diamond Shard', rarity: 'Rare', emoji: '💎', type: 'emoji' },
  { id: 'orb', name: 'Crystal Orb', rarity: 'Rare', emoji: '🔮', type: 'emoji' },
  { id: 'crown', name: 'Crown', rarity: 'Rare', emoji: '👑', type: 'emoji' },
  { id: 'flag-star', name: 'Radiant Star', rarity: 'Epic', type: 'flag', flagId: 'radiant-star' },
  { id: 'flag-moon', name: 'Neon Crescent', rarity: 'Epic', type: 'flag', flagId: 'neon-crescent' },
  { id: 'flag-volcano', name: 'Volcano Fury', rarity: 'Legendary', type: 'flag', flagId: 'volcano' },
  { id: 'flag-hack', name: 'Cyber Hack', rarity: 'Legendary', type: 'flag', flagId: 'cyber' },
];

export function useStore() {
  const [coins, setCoinsState] = useState<number>(1000);
  const [inventory, setInventoryState] = useState<InventoryItem[]>([]);
  const [cratesOpened, setCratesOpenedState] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const c = localStorage.getItem('nibble_coins');
    if (c !== null) {
      setCoinsState(parseInt(c, 10));
    } else {
      localStorage.setItem('nibble_coins', '1000');
    }

    const inv = localStorage.getItem('nibble_inventory');
    if (inv !== null) {
      try {
        setInventoryState(JSON.parse(inv));
      } catch (e) {
        setInventoryState([]);
      }
    }

    const co = localStorage.getItem('nibble_cratesOpened');
    if (co !== null) {
      setCratesOpenedState(parseInt(co, 10));
    }
    
    setIsLoaded(true);
  }, []);

  const setCoins = useCallback((amount: number | ((prev: number) => number)) => {
    setCoinsState(prev => {
      const next = typeof amount === 'function' ? amount(prev) : amount;
      localStorage.setItem('nibble_coins', next.toString());
      return next;
    });
  }, []);

  const addInventoryItem = useCallback((item: ItemType, acquiredFrom: 'crate' | 'purchased') => {
    setInventoryState(prev => {
      const next = [...prev, { 
        ...item, 
        instanceId: crypto.randomUUID(), 
        acquiredFrom, 
        acquiredAt: Date.now() 
      }];
      localStorage.setItem('nibble_inventory', JSON.stringify(next));
      return next;
    });
  }, []);

  const incrementCratesOpened = useCallback(() => {
    setCratesOpenedState(prev => {
      const next = prev + 1;
      localStorage.setItem('nibble_cratesOpened', next.toString());
      return next;
    });
  }, []);

  return {
    coins,
    setCoins,
    inventory,
    addInventoryItem,
    cratesOpened,
    incrementCratesOpened,
    isLoaded
  };
}

export const getRarityColorClass = (rarity: Rarity, mode: 'text' | 'bg' | 'border' | 'shadow' | 'glow') => {
  const map = {
    Common: { text: 'text-rarity-common', bg: 'bg-rarity-common', border: 'border-rarity-common', shadow: 'shadow-rarity-common', glow: 'shadow-[0_0_15px_rgba(156,163,175,0.5)]' },
    Rare: { text: 'text-rarity-rare', bg: 'bg-rarity-rare', border: 'border-rarity-rare', shadow: 'shadow-rarity-rare', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.6)]' },
    Epic: { text: 'text-rarity-epic', bg: 'bg-rarity-epic', border: 'border-rarity-epic', shadow: 'shadow-rarity-epic', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.7)]' },
    Legendary: { text: 'text-rarity-legendary', bg: 'bg-rarity-legendary', border: 'border-rarity-legendary', shadow: 'shadow-rarity-legendary', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.8)]' },
  };
  return map[rarity][mode];
};
