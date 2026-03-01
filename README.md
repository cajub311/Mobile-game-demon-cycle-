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
  GameData.gd                   ← Cross-scene state carrier
  Game.gd                       ← Game loop, entities, drawing, HUD
  Menu.gd  /  GameOver.gd
  singletons/
    data_registry.gd            ← Scans data/ folders, exposes query helpers
    corruption_manager.gd       ← Corruption 0–1, signals, path names
    player_save.gd              ← Save/load  user://warded_cycle_save.tres
  resources/
    save_data.gd                ← SaveData Resource (@export fields)
```

## Adding Content

Copy any `_template.json`, rename it, fill the fields. DataRegistry auto-loads it next run. Files starting with `_` are ignored.

```
# New demon:   data/demons/rock_demon.json
# New ward:    data/wards/ward_heat.json
# New NPC:     data/characters/jardir.json
# New village: data/villages/fort_krasia.json
```

## Corruption System

| Range | Path | Effect |
|-------|------|--------|
| 0.0–0.3 | Ward-Bearer | Faster, cheaper, ward zones safe |
| 0.3–0.7 | Gray Walker | Balanced |
| 0.7–1.0 | Demon-Eater | More spawns, hostile ward zones, pricey shops |

## Tech

- Godot 4.3 · GDScript
- Procedural `_draw()` rendering — no sprites needed
- Modular JSON data system — new content never requires code changes
