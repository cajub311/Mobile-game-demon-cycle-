import {
  GameState,
  Demon,
  DemonType,
  Vector2D,
} from './types';
import {
  DAY_DURATION_MS,
  NIGHT_DURATION_MS,
  PLAYER_SPEED,
  PLAYER_MAX_HEALTH,
  PLAYER_INVINCIBILITY_MS,
  PLAYER_RADIUS,
  WARD_RADIUS,
  WARD_DAMAGE_PER_SEC,
  WARD_DURATION_MS,
  BASE_SPAWN_INTERVAL_MS,
  MIN_SPAWN_INTERVAL_MS,
  NIGHT_SURVIVE_SCORE,
  DEMON_STATS,
} from './constants';

let demonIdCounter = 0;
let wardIdCounter = 0;

function dist(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: Vector2D): Vector2D {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function spawnDemon(state: GameState): Demon {
  const { canvasWidth, canvasHeight, dayCount } = state;

  const types: DemonType[] = ['ground'];
  if (dayCount >= 2) types.push('flame');
  if (dayCount >= 4) types.push('rock');

  const type = types[Math.floor(Math.random() * types.length)];
  const stats = DEMON_STATS[type];
  const diffMult = 1 + (dayCount - 1) * 0.12;

  const edge = Math.floor(Math.random() * 4);
  let position: Vector2D;
  switch (edge) {
    case 0: position = { x: Math.random() * canvasWidth, y: -25 }; break;
    case 1: position = { x: canvasWidth + 25, y: Math.random() * canvasHeight }; break;
    case 2: position = { x: Math.random() * canvasWidth, y: canvasHeight + 25 }; break;
    default: position = { x: -25, y: Math.random() * canvasHeight }; break;
  }

  return {
    id: `d${++demonIdCounter}`,
    position,
    health: stats.health * diffMult,
    maxHealth: stats.health * diffMult,
    speed: stats.speed * (1 + (dayCount - 1) * 0.06),
    damage: stats.damage,
    type,
    attackCooldownMs: 0,
  };
}

export function createInitialState(canvasWidth: number, canvasHeight: number): GameState {
  demonIdCounter = 0;
  wardIdCounter = 0;
  return {
    player: {
      position: { x: canvasWidth / 2, y: canvasHeight / 2 },
      target: null,
      health: PLAYER_MAX_HEALTH,
      maxHealth: PLAYER_MAX_HEALTH,
      speed: PLAYER_SPEED,
      invincibleMs: 0,
    },
    demons: [],
    wards: [],
    phase: 'day',
    phaseTimeMs: DAY_DURATION_MS,
    dayCount: 1,
    score: 0,
    isGameOver: false,
    spawnIntervalMs: BASE_SPAWN_INTERVAL_MS,
    nextSpawnMs: BASE_SPAWN_INTERVAL_MS,
    canvasWidth,
    canvasHeight,
  };
}

export function tick(state: GameState, deltaMs: number): GameState {
  if (state.isGameOver) return state;

  const dt = deltaMs / 1000;
  let { player, demons, wards, phase, phaseTimeMs, dayCount, score, spawnIntervalMs, nextSpawnMs } = state;

  // --- Phase transition ---
  const newPhaseTime = phaseTimeMs - deltaMs;
  if (newPhaseTime <= 0) {
    if (phase === 'day') {
      const newInterval = Math.max(
        MIN_SPAWN_INTERVAL_MS,
        BASE_SPAWN_INTERVAL_MS - (dayCount - 1) * 250,
      );
      return {
        ...state,
        phase: 'night',
        phaseTimeMs: NIGHT_DURATION_MS,
        spawnIntervalMs: newInterval,
        nextSpawnMs: 1000,
      };
    } else {
      return {
        ...state,
        phase: 'day',
        phaseTimeMs: DAY_DURATION_MS,
        dayCount: dayCount + 1,
        demons: [],
        wards: [],
        score: score + NIGHT_SURVIVE_SCORE,
      };
    }
  }

  // --- Move player toward target ---
  let newPlayer = { ...player, invincibleMs: Math.max(0, player.invincibleMs - deltaMs) };
  if (player.target) {
    const direction = normalize({
      x: player.target.x - player.position.x,
      y: player.target.y - player.position.y,
    });
    const remaining = dist(player.position, player.target);
    const step = player.speed * dt;
    if (remaining <= step) {
      newPlayer.position = { ...player.target };
      newPlayer.target = null;
    } else {
      newPlayer.position = {
        x: player.position.x + direction.x * step,
        y: player.position.y + direction.y * step,
      };
    }
  }

  newPlayer.position.x = Math.max(PLAYER_RADIUS, Math.min(state.canvasWidth - PLAYER_RADIUS, newPlayer.position.x));
  newPlayer.position.y = Math.max(PLAYER_RADIUS, Math.min(state.canvasHeight - PLAYER_RADIUS, newPlayer.position.y));

  // --- Spawn demons at night ---
  let newDemons = [...demons];
  let newNextSpawn = nextSpawnMs;

  if (phase === 'night') {
    newNextSpawn -= deltaMs;
    if (newNextSpawn <= 0) {
      newDemons.push(spawnDemon(state));
      newNextSpawn = spawnIntervalMs;
    }
  }

  // --- Tick wards ---
  const newWards = wards
    .map(w => ({ ...w, durationMs: w.durationMs - deltaMs }))
    .filter(w => w.durationMs > 0);

  // --- Move demons, apply ward damage, attack player ---
  let newScore = score;
  const defeated: string[] = [];

  newDemons = newDemons.map(demon => {
    let d = { ...demon };

    const dir = normalize({
      x: newPlayer.position.x - d.position.x,
      y: newPlayer.position.y - d.position.y,
    });
    d.position = {
      x: d.position.x + dir.x * d.speed * dt,
      y: d.position.y + dir.y * d.speed * dt,
    };

    for (const ward of newWards) {
      if (dist(d.position, ward.position) < ward.radius) {
        d.health -= ward.damagePerSec * dt;
      }
    }

    d.attackCooldownMs = Math.max(0, d.attackCooldownMs - deltaMs);
    if (dist(d.position, newPlayer.position) < PLAYER_RADIUS + 12 && d.attackCooldownMs === 0 && newPlayer.invincibleMs === 0) {
      newPlayer = { ...newPlayer, health: newPlayer.health - d.damage, invincibleMs: PLAYER_INVINCIBILITY_MS };
      d.attackCooldownMs = 1000;
    }

    if (d.health <= 0) {
      defeated.push(d.id);
      newScore += DEMON_STATS[d.type].scoreValue;
    }

    return d;
  }).filter(d => !defeated.includes(d.id));

  const isGameOver = newPlayer.health <= 0;

  return {
    ...state,
    player: { ...newPlayer, health: Math.max(0, newPlayer.health) },
    demons: newDemons,
    wards: newWards,
    phase,
    phaseTimeMs: newPhaseTime,
    dayCount,
    score: newScore,
    isGameOver,
    spawnIntervalMs,
    nextSpawnMs: newNextSpawn,
  };
}

export function addWard(state: GameState, position: Vector2D): GameState {
  const existing = state.wards.length >= 5 ? state.wards.slice(1) : state.wards;
  return {
    ...state,
    wards: [
      ...existing,
      {
        id: `w${++wardIdCounter}`,
        position,
        radius: WARD_RADIUS,
        damagePerSec: WARD_DAMAGE_PER_SEC,
        durationMs: WARD_DURATION_MS,
      },
    ],
  };
}

export function setPlayerTarget(state: GameState, target: Vector2D): GameState {
  return {
    ...state,
    player: { ...state.player, target },
  };
}
