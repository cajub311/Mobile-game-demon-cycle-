export const GAME_TICK_MS = 50; // 20 fps game logic

export const DAY_DURATION_MS = 30_000;
export const NIGHT_DURATION_MS = 50_000;

export const PLAYER_SPEED = 130; // px/s
export const PLAYER_MAX_HEALTH = 10;
export const PLAYER_INVINCIBILITY_MS = 900;
export const PLAYER_RADIUS = 16;

export const WARD_RADIUS = 48;
export const WARD_DAMAGE_PER_SEC = 22;
export const WARD_DURATION_MS = NIGHT_DURATION_MS;
export const MAX_WARDS = 5;

export const BASE_SPAWN_INTERVAL_MS = 3200;
export const MIN_SPAWN_INTERVAL_MS = 700;
export const NIGHT_SURVIVE_SCORE = 50;

export const DEMON_STATS = {
  ground: { health: 30, speed: 52, damage: 2, scoreValue: 10 },
  flame:  { health: 20, speed: 95, damage: 1, scoreValue: 15 },
  rock:   { health: 85, speed: 28, damage: 3, scoreValue: 25 },
} as const;
