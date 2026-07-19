export type FishRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface FishType {
  id: string;
  name: string;
  rarity: FishRarity;
  description: string;
  weight: number; // grams, for display
  color: string; // primary color for SVG
  accentColor: string;
  chance: number; // drop weight (not percentage, used for weighted random)
}

export const FISH_TYPES: FishType[] = [
  // Common (60% total)
  {
    id: 'sardine',
    name: 'Sardine',
    rarity: 'Common',
    description: 'A tiny silver fish. Plentiful in these waters.',
    weight: 80,
    color: '#a8b8c8',
    accentColor: '#d0e0ee',
    chance: 18,
  },
  {
    id: 'carp',
    name: 'Carp',
    rarity: 'Common',
    description: 'A chubby orange carp. Classic catch for beginners.',
    weight: 1200,
    color: '#e8a050',
    accentColor: '#f5c878',
    chance: 16,
  },
  {
    id: 'bluegill',
    name: 'Bluegill',
    rarity: 'Common',
    description: 'A spunky little fighter with blue-striped fins.',
    weight: 300,
    color: '#5b8fd4',
    accentColor: '#88bfee',
    chance: 15,
  },
  {
    id: 'catfish',
    name: 'Catfish',
    rarity: 'Common',
    description: 'Whiskers, slippery scales, and attitude to spare.',
    weight: 2500,
    color: '#7a6a50',
    accentColor: '#a08860',
    chance: 11,
  },
  // Rare (25% total)
  {
    id: 'bass',
    name: 'Largemouth Bass',
    rarity: 'Rare',
    description: 'A trophy-worthy bass with emerald scales.',
    weight: 3400,
    color: '#4a7a4a',
    accentColor: '#70b870',
    chance: 10,
  },
  {
    id: 'trout',
    name: 'Rainbow Trout',
    rarity: 'Rare',
    description: 'Shimmering with every color of the rainbow.',
    weight: 1800,
    color: '#e05080',
    accentColor: '#f0a0c0',
    chance: 8,
  },
  {
    id: 'tuna',
    name: 'Bluefin Tuna',
    rarity: 'Rare',
    description: 'Sleek, fast, and built like a torpedo.',
    weight: 8000,
    color: '#1e3a5a',
    accentColor: '#4070a0',
    chance: 7,
  },
  // Epic (10% total)
  {
    id: 'swordfish',
    name: 'Swordfish',
    rarity: 'Epic',
    description: 'Its blade could slice right through your fishing line.',
    weight: 25000,
    color: '#2a5080',
    accentColor: '#60a0c8',
    chance: 5,
  },
  {
    id: 'pufferfish',
    name: 'Pufferfish',
    rarity: 'Epic',
    description: 'Inflates to 3x its size when startled. Handle with care.',
    weight: 900,
    color: '#d4b840',
    accentColor: '#f0e080',
    chance: 5,
  },
  // Legendary (5% total)
  {
    id: 'shark',
    name: 'Great White Shark',
    rarity: 'Legendary',
    description: 'HOW did you even fit this on a hook?! A living legend.',
    weight: 1100000,
    color: '#607080',
    accentColor: '#a0b8c8',
    chance: 5,
  },
];

export const FISH_RARITY_CHANCES: Record<FishRarity, number> = {
  Common: 60,
  Rare: 25,
  Epic: 10,
  Legendary: 5,
};

export function rollFish(): FishType {
  const roll = Math.random() * 100;
  let rarity: FishRarity;
  if (roll < 5) rarity = 'Legendary';
  else if (roll < 15) rarity = 'Epic';
  else if (roll < 40) rarity = 'Rare';
  else rarity = 'Common';

  const pool = FISH_TYPES.filter(f => f.rarity === rarity);
  const totalWeight = pool.reduce((s, f) => s + f.chance, 0);
  let r = Math.random() * totalWeight;
  for (const fish of pool) {
    r -= fish.chance;
    if (r <= 0) return fish;
  }
  return pool[pool.length - 1];
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
  return `${grams} g`;
}
