---
name: Fishing system in Nibble's Minesweeper
description: How fishing was added to artifacts/minesweeper and key gotchas.
---

## Location
All fishing code lives in `artifacts/minesweeper/src/App.tsx` (monolithic file) and `artifacts/minesweeper/src/index.css`.

## Architecture
- `FishType`, `FISH_TYPES`, `rollFish()`, `FISH_RARITY_COLOR`, `formatFishWeight()` — fish data constants added near top of App.tsx (after FLAGS array, before Battle Pass data)
- `FishingModal` component — added just before the main `App` export
- Fish inventory state: `fishInventory: Record<string, number>` with key `ms-fish` in localStorage; total catch count in `ms-fish-total`
- `handleCatchFish` callback uses `pushToast` — **must be defined AFTER pushToast** (placed after the Toasts section, not near the other state declarations)

## Why handleCatchFish placement matters
Moving `handleCatchFish` before `pushToast` causes a "Cannot access 'pushToast' before initialization" runtime error. The callback must be declared after the `pushToast = useCallback(...)` line.

## UI integration
- Fishing button added to `MenuPanel` (cyan color, `#00c8ff`) with fishing rod SVG icon
- `onOpenFishing` prop added to MenuPanel's type signature
- FISH tab added to `InventoryModal` (4th tab after THEMES/FLAGS/MISC)
- `fishInventory` prop added to `InventoryModal`
- `FishingModal` rendered alongside other modals in the App JSX

## Minigame
- RAF loop drives fish bounce, green zone movement, and progress bar
- `startedRef` guards against double-RAF on re-render; reset to false on close and on escape/caught
- Hold button uses `onPointerDown`/`onPointerUp`/`onPointerLeave` + `onTouchStart`/`onTouchEnd` for mobile compatibility; `touch-action: none` required

## Pre-existing TS errors (not introduced by fishing)
- `CrateRarity` not found (line ~1876 in InventoryModal)
- BattlePass tab comparison overlap
- CrateModal.tsx not-all-code-paths-return
These do not affect runtime.
