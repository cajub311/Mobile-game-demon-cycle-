export interface Vector2D {
  x: number;
  y: number;
}

export type DemonType = 'ground' | 'flame' | 'rock';
export type GamePhase = 'day' | 'night';

export interface Player {
  position: Vector2D;
  target: Vector2D | null;
  health: number;
  maxHealth: number;
  speed: number;
  invincibleMs: number;
}

export interface Demon {
  id: string;
  position: Vector2D;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  type: DemonType;
  attackCooldownMs: number;
}

export interface Ward {
  id: string;
  position: Vector2D;
  radius: number;
  damagePerSec: number;
  durationMs: number;
}

export interface GameState {
  player: Player;
  demons: Demon[];
  wards: Ward[];
  phase: GamePhase;
  phaseTimeMs: number;
  dayCount: number;
  score: number;
  isGameOver: boolean;
  spawnIntervalMs: number;
  nextSpawnMs: number;
  canvasWidth: number;
  canvasHeight: number;
}
