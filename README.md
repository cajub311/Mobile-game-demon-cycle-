# Demon Cycle — Mobile Game

A dark fantasy survival mobile game built with **Expo + React Native + TypeScript**.

Survive nightly waves of corelings (demons) using magical wards. Inspired by *The Demon Cycle* series.

---

## Gameplay

| Phase | Duration | What happens |
|-------|----------|-------------|
| ☀ **Day** | 30 seconds | Prepare — move your ward painter and place protective runes |
| 🌙 **Night** | 50 seconds | Corelings rise — they march toward you, use wards to stop them |

### Controls
- **Tap** (Move Mode) → move your character to that position
- **Toggle WARD MODE → Tap** → plant a ward rune at that location (max 5 wards)
- **⏸ Pause** → pause/resume game

### Demon Types
| Coreling | Appears | HP | Speed | Threat |
|----------|---------|-----|-------|--------|
| 🔴 Ground | Night 1 | 30 | Normal | Medium |
| 🟠 Flame  | Night 2+ | 20 | Fast | Low HP, high speed |
| ⬛ Rock   | Night 4+ | 85 | Slow | Tanky, high damage |

### Scoring
- **+50 pts** per night survived
- **+10 pts** Ground coreling
- **+15 pts** Flame coreling
- **+25 pts** Rock coreling

---

## Setup & Run

```bash
npm install
npx expo start
```

- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with **Expo Go** app for physical device

## Project Structure

```
src/
├── game/
│   ├── types.ts        # TypeScript interfaces
│   ├── constants.ts    # Tunable game parameters
│   └── engine.ts       # Core game logic (tick, spawn, combat)
├── screens/
│   ├── MenuScreen.tsx  # Main menu with how-to-play
│   ├── GameScreen.tsx  # Game canvas + HUD + game loop
│   └── GameOverScreen.tsx
```

## Tech Stack

- [Expo](https://expo.dev) ~52
- React Native 0.76
- TypeScript
- react-native-svg (rendering)
- React Navigation (screen management)
