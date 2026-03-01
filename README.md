# Demon Cycle

A dark fantasy mobile survival game built with **Godot 4 (GDScript)**.

Survive nightly waves of corelings (demons) by painting magical ward runes on the ground.

---

## How to Open

1. Download **Godot 4.3** from [godotengine.org](https://godotengine.org/download)
2. Open Godot → **Import** → select this folder (`project.godot`)
3. Press **F5** or the ▶ Play button to run

> For mobile export, see [Godot Android export docs](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_android.html).

---

## Gameplay

| Phase | Duration | What happens |
|-------|----------|-------------|
| ☀ **Day**   | 30 s | Prepare — move your character and plant ward runes |
| 🌙 **Night** | 50 s | Corelings rise and march toward you — wards burn them |

### Controls
| Action | How |
|--------|-----|
| Move player | Tap anywhere on the game canvas (MOVE MODE) |
| Place ward  | Switch to **WARD MODE** → tap location |
| Pause       | ⏸ button (top-right of HUD) |

### Coreling types
| Name | HP | Speed | Unlock |
|------|----|-------|--------|
| 🔴 Ground | 30  | Normal | Night 1 |
| 🟠 Flame  | 20  | Fast   | Night 2 |
| ⬛ Rock   | 85  | Slow   | Night 4 |

### Scoring
- **+50 pts** per night survived
- **+10** Ground · **+15** Flame · **+25** Rock

---

## Project Structure

```
project.godot          ← Godot project config + autoload registration
icon.svg               ← App icon (ward star symbol)
scenes/
  Menu.tscn            ← Main menu scene
  Game.tscn            ← Gameplay scene
  GameOver.tscn        ← Defeat screen
scripts/
  GameData.gd          ← Autoload singleton (passes score between scenes)
  Menu.gd              ← Menu UI + decorative drawing
  Game.gd              ← Game loop, entities, drawing, HUD
  GameOver.gd          ← Defeat screen UI + drawing
```

## Tech

- Godot Engine 4.3
- GDScript
- Pure procedural rendering via `_draw()` — no external assets needed
