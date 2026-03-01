import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Circle, G, Line, Polygon, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'GameOver'>;
type RoutePropType = RouteProp<RootStackParamList, 'GameOver'>;

const { width } = Dimensions.get('window');

export default function GameOverScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { score, nightsSurvived } = route.params;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(shakeAnim, { toValue: 1, friction: 3, tension: 80, useNativeDriver: true }),
    ]).start();

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, shakeAnim, slideAnim]);

  const shakeInterp = shakeAnim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -12, 12, -8, 6, 0],
  });

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <Svg width={width} height={400} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="deathGlow" cx="50%" cy="40%" r="50%">
            <Stop offset="0%" stopColor="#b71c1c" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#b71c1c" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={width / 2} cy={200} r={250} fill="url(#deathGlow)" />
      </Svg>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Broken ward symbol */}
        <Animated.View style={{ transform: [{ translateX: shakeInterp }] }}>
          <Svg width={100} height={100} style={styles.wardSymbol}>
            <G opacity={0.6}>
              <Circle cx={50} cy={50} r={44} fill="none" stroke="#E53935" strokeWidth={2} strokeDasharray="8 5" />
              <Polygon
                points="50,16 54,35 72,35 58,46 63,65 50,54 37,65 42,46 28,35 46,35"
                fill="#E53935"
                opacity={0.7}
              />
              {/* Crack lines */}
              <Line x1={35} y1={20} x2={65} y2={80} stroke="#E53935" strokeWidth={2.5} opacity={0.9} />
              <Line x1={38} y1={20} x2={40} y2={45} stroke="#E53935" strokeWidth={2} opacity={0.7} />
            </G>
          </Svg>
        </Animated.View>

        {/* Title */}
        <Text style={styles.defeatLabel}>WARD SHATTERED</Text>
        <Text style={styles.title}>DEFEATED</Text>

        {/* Stats card */}
        <Animated.View
          style={[styles.statsCard, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>SCORE</Text>
            <Text style={styles.statsValue}>{score}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>NIGHTS SURVIVED</Text>
            <Text style={[styles.statsValue, { color: '#CE93D8' }]}>{nightsSurvived}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>RANK</Text>
            <Text style={[styles.statsValue, { color: '#FFD700' }]}>
              {nightsSurvived === 0
                ? 'NOVICE'
                : nightsSurvived < 3
                ? 'INITIATE'
                : nightsSurvived < 6
                ? 'WARD PAINTER'
                : nightsSurvived < 10
                ? 'CORELING BANE'
                : 'ARLEN REBORN'}
            </Text>
          </View>
        </Animated.View>

        {/* Tip */}
        <Text style={styles.tip}>
          {nightsSurvived === 0
            ? '💡 Place wards BEFORE night falls to defend against corelings.'
            : nightsSurvived < 3
            ? '💡 Switch to WARD MODE and tap to place runes at chokepoints.'
            : '💡 Rock corelings appear on day 4+. Flame wards stop them cold.'}
        </Text>

        {/* Buttons */}
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => navigation.replace('Game')}
        >
          <Text style={styles.retryBtnText}>TRY AGAIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation.replace('Menu')}
        >
          <Text style={styles.menuBtnText}>MAIN MENU</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07071a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 16,
    width: '100%',
  },
  wardSymbol: {
    marginBottom: 4,
  },
  defeatLabel: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 5,
    textShadowColor: '#E53935',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    width: '100%',
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  statsValue: {
    color: '#E0E0E0',
    fontSize: 22,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tip: {
    color: '#9E9E9E',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  retryBtn: {
    backgroundColor: '#E53935',
    paddingHorizontal: 52,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  menuBtn: {
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  menuBtnText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
