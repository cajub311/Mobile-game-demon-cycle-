import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import Svg, {
  Circle,
  Polygon,
  G,
  Line,
  Rect,
  Path,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

import { GameState } from '../game/types';
import { createInitialState, tick, addWard, setPlayerTarget } from '../game/engine';
import { GAME_TICK_MS, PLAYER_MAX_HEALTH } from '../game/constants';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;

const HUD_HEIGHT = 115;

// Stars positions are deterministic to avoid recompute
const STARS = Array.from({ length: 30 }, (_, i) => ({
  cx: ((i * 137.508) % 375),
  cy: ((i * 97.31) % 500),
  r: i % 5 === 0 ? 2.5 : 1.5,
  op: 0.4 + (i % 4) * 0.15,
}));

export default function GameScreen() {
  const navigation = useNavigation<NavProp>();
  const { width, height } = useWindowDimensions();
  const gameAreaH = height - HUD_HEIGHT;

  const stateRef = useRef<GameState>(createInitialState(width, gameAreaH));
  const [, forceRender] = useReducer(n => n + 1, 0);
  const [isWardMode, setIsWardMode] = useState(false);
  const isWardModeRef = useRef(false);
  const isPausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  // Keep refs in sync
  useEffect(() => { isWardModeRef.current = isWardMode; }, [isWardMode]);

  // Toggle pause
  const togglePause = useCallback(() => {
    isPausedRef.current = !isPausedRef.current;
    setIsPaused(p => !p);
  }, []);

  // Reinitialize if screen dimensions change significantly
  const prevDimsRef = useRef({ width, gameAreaH });
  useEffect(() => {
    const prev = prevDimsRef.current;
    if (Math.abs(prev.width - width) > 10 || Math.abs(prev.gameAreaH - gameAreaH) > 10) {
      stateRef.current = createInitialState(width, gameAreaH);
      prevDimsRef.current = { width, gameAreaH };
      forceRender();
    }
  }, [width, gameAreaH]);

  // Game loop
  useEffect(() => {
    let lastTime = Date.now();

    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      const now = Date.now();
      const delta = Math.min(now - lastTime, 120);
      lastTime = now;

      stateRef.current = tick(stateRef.current, delta);
      forceRender();

      if (stateRef.current.isGameOver) {
        clearInterval(interval);
        const { score, dayCount } = stateRef.current;
        setTimeout(() => {
          navigation.replace('GameOver', {
            score,
            nightsSurvived: Math.max(0, dayCount - 1),
          });
        }, 700);
      }
    }, GAME_TICK_MS);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGamePress = useCallback((e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    if (isWardModeRef.current) {
      stateRef.current = addWard(stateRef.current, { x: locationX, y: locationY });
    } else {
      stateRef.current = setPlayerTarget(stateRef.current, { x: locationX, y: locationY });
    }
  }, []);

  const gs = stateRef.current;
  const isNight = gs.phase === 'night';
  const timeLeft = Math.ceil(gs.phaseTimeMs / 1000);
  const hpPct = gs.player.health / PLAYER_MAX_HEALTH;

  const bgColor = isNight ? '#06061a' : '#0e2744';
  const groundColor = isNight ? '#0a0a1e' : '#0a2e10';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Game Canvas */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleGamePress}
        style={{ width, height: gameAreaH }}
      >
        <Svg width={width} height={gameAreaH}>
          <Defs>
            <RadialGradient id="wardGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFD700" stopOpacity={0.18} />
              <Stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="playerGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#4FC3F7" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#4FC3F7" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* Sky/ground split */}
          <Rect x={0} y={0} width={width} height={gameAreaH} fill={bgColor} />
          <Rect x={0} y={gameAreaH * 0.88} width={width} height={gameAreaH * 0.12} fill={groundColor} />

          {/* Stars at night */}
          {isNight && STARS.map((s, i) => (
            <Circle
              key={i}
              cx={(s.cx / 375) * width}
              cy={(s.cy / 500) * gameAreaH}
              r={s.r}
              fill="white"
              opacity={s.op}
            />
          ))}

          {/* Day sun / night moon */}
          {!isNight && (
            <Circle cx={width * 0.85} cy={gameAreaH * 0.12} r={28} fill="#FDD835" opacity={0.7} />
          )}
          {isNight && (
            <>
              <Circle cx={width * 0.8} cy={gameAreaH * 0.1} r={20} fill="#ECEFF1" opacity={0.6} />
              <Circle cx={width * 0.82} cy={gameAreaH * 0.08} r={14} fill={bgColor} opacity={0.85} />
            </>
          )}

          {/* Phase label in sky */}
          <G>
            <Rect
              x={width / 2 - 55}
              y={8}
              width={110}
              height={26}
              rx={13}
              fill={isNight ? 'rgba(100,0,180,0.5)' : 'rgba(0,60,120,0.5)'}
            />
          </G>

          {/* Wards */}
          {gs.wards.map(ward => {
            const fadePct = ward.durationMs / (gs.spawnIntervalMs > 0 ? ward.durationMs : 1);
            return (
              <G key={ward.id} x={ward.position.x} y={ward.position.y}>
                <Circle r={ward.radius} fill="url(#wardGlow)" />
                <Circle
                  r={ward.radius}
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth={1.8}
                  strokeDasharray="6 5"
                  opacity={0.75 + fadePct * 0.25}
                />
                {/* Star of Solomon */}
                <Polygon
                  points="0,-13 3,−4 12.4,−4 5.3,2.6 8.1,12 0,6.5 -8.1,12 -5.3,2.6 -12.4,-4 -3,-4"
                  fill="#FFD700"
                  opacity={0.9}
                />
                <Path
                  d="M 0 -14 L 3.5 -5 L 13 -5 L 6 1 L 9 11 L 0 5 L -9 11 L -6 1 L -13 -5 L -3.5 -5 Z"
                  fill="#FFD700"
                  opacity={0.95}
                />
              </G>
            );
          })}

          {/* Demons */}
          {gs.demons.map(demon => {
            const hp = demon.health / demon.maxHealth;
            const colors = { ground: '#E53935', flame: '#FF8F00', rock: '#607D8B' };
            const col = colors[demon.type];

            return (
              <G key={demon.id} x={demon.position.x} y={demon.position.y}>
                {demon.type === 'ground' && (
                  <Polygon points="0,-18 14,12 -14,12" fill={col} />
                )}
                {demon.type === 'flame' && (
                  <>
                    <Polygon points="0,-18 10,8 0,1 -10,8" fill={col} />
                    <Circle r={6} fill="#FFCA28" cy={-10} />
                    <Circle r={3} fill="#FF6F00" cy={-10} />
                  </>
                )}
                {demon.type === 'rock' && (
                  <Polygon points="-14,-8 0,-18 14,-8 14,8 0,16 -14,8" fill={col} />
                )}
                {/* Health bar */}
                <Rect x={-16} y={20} width={32} height={4} fill="#1a1a1a" rx={2} />
                <Rect x={-16} y={20} width={32 * hp} height={4} fill={col} rx={2} />
              </G>
            );
          })}

          {/* Player glow */}
          <Circle
            cx={gs.player.position.x}
            cy={gs.player.position.y}
            r={38}
            fill="url(#playerGlow)"
          />

          {/* Player sprite */}
          <G
            x={gs.player.position.x}
            y={gs.player.position.y}
            opacity={gs.player.invincibleMs > 0 ? 0.45 : 1}
          >
            <Circle r={16} fill="#1565C0" stroke="#4FC3F7" strokeWidth={2.5} />
            {/* Ward cross rune */}
            <Line x1={-9} y1={0} x2={9} y2={0} stroke="#4FC3F7" strokeWidth={2.5} />
            <Line x1={0} y1={-9} x2={0} y2={9} stroke="#4FC3F7" strokeWidth={2.5} />
            <Line x1={-6} y1={-6} x2={6} y2={6} stroke="#81D4FA" strokeWidth={1.5} />
            <Line x1={6} y1={-6} x2={-6} y2={6} stroke="#81D4FA" strokeWidth={1.5} />
          </G>

          {/* Move-to target indicator */}
          {gs.player.target && (
            <G x={gs.player.target.x} y={gs.player.target.y}>
              <Circle r={8} fill="none" stroke="#4FC3F7" strokeWidth={1.5} opacity={0.6} />
              <Circle r={2} fill="#4FC3F7" opacity={0.8} />
            </G>
          )}
        </Svg>
      </TouchableOpacity>

      {/* HUD */}
      <View style={[styles.hud, { height: HUD_HEIGHT, backgroundColor: '#07071a' }]}>
        {/* Row 1: Phase badge, timer, score, pause */}
        <View style={styles.hudRow}>
          <View style={[styles.phaseBadge, { backgroundColor: isNight ? '#1a0a32' : '#0a2040' }]}>
            <Text style={[styles.phaseText, { color: isNight ? '#CE93D8' : '#4FC3F7' }]}>
              {isNight ? '🌙 NIGHT' : '☀ DAY'} {gs.dayCount}
            </Text>
          </View>

          <View style={styles.timerBlock}>
            <Text style={[styles.timerText, { color: timeLeft <= 10 ? '#EF5350' : '#FFD700' }]}>
              {timeLeft}s
            </Text>
          </View>

          <Text style={styles.scoreText}>⭐ {gs.score}</Text>

          <TouchableOpacity onPress={togglePause} style={styles.pauseBtn}>
            <Text style={styles.pauseIcon}>{isPaused ? '▶' : '⏸'}</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Health bar */}
        <View style={styles.healthRow}>
          <Text style={styles.hpLabel}>HP</Text>
          <View style={styles.hpBarBg}>
            <View
              style={[
                styles.hpBarFill,
                {
                  width: `${hpPct * 100}%`,
                  backgroundColor: hpPct > 0.5 ? '#EF5350' : hpPct > 0.25 ? '#FF8F00' : '#EF9A9A',
                },
              ]}
            />
          </View>
          <Text style={styles.hpText}>
            {Math.ceil(gs.player.health)}/{PLAYER_MAX_HEALTH}
          </Text>
        </View>

        {/* Row 3: Mode toggle + ward count */}
        <View style={styles.controlsRow}>
          <Text style={styles.modeHint}>
            {isWardMode ? '🔶 Tap to place ward' : '👆 Tap to move'}
          </Text>
          <TouchableOpacity
            style={[styles.modeBtn, isWardMode && styles.modeBtnActive]}
            onPress={() => setIsWardMode(m => !m)}
          >
            <Text style={[styles.modeBtnText, isWardMode && styles.modeBtnTextActive]}>
              {isWardMode ? 'WARD MODE' : 'MOVE MODE'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.wardCountText}>{gs.wards.length}/5 wards</Text>
        </View>
      </View>

      {/* Pause overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseTitle}>PAUSED</Text>
          <TouchableOpacity style={styles.resumeBtn} onPress={togglePause}>
            <Text style={styles.resumeBtnText}>RESUME</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.replace('Menu')}
          >
            <Text style={styles.menuBtnText}>MAIN MENU</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hud: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    flex: 1,
  },
  phaseText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timerBlock: {
    minWidth: 44,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 20,
    fontWeight: '800',
  },
  scoreText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  pauseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
  },
  pauseIcon: {
    color: '#AAA',
    fontSize: 14,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hpLabel: {
    color: '#EF5350',
    fontSize: 11,
    fontWeight: '700',
    width: 18,
  },
  hpBarBg: {
    flex: 1,
    height: 9,
    backgroundColor: '#1c1c2e',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  hpText: {
    color: '#CCC',
    fontSize: 11,
    width: 38,
    textAlign: 'right',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeHint: {
    color: '#888',
    fontSize: 11,
    flex: 1,
  },
  modeBtn: {
    backgroundColor: '#141428',
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: '#1f150a',
    borderColor: '#FFD700',
  },
  modeBtnText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modeBtnTextActive: {
    color: '#FFD700',
  },
  wardCountText: {
    color: '#666',
    fontSize: 11,
    width: 52,
    textAlign: 'right',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  pauseTitle: {
    color: '#CE93D8',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 6,
    textShadowColor: '#9C27B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  resumeBtn: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  resumeBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  menuBtn: {
    borderWidth: 1,
    borderColor: '#444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  menuBtnText: {
    color: '#AAA',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
