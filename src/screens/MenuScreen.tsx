import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Svg, { Circle, Polygon, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

const { width, height } = Dimensions.get('window');

const DECORATIVE_DEMONS = [
  { x: width * 0.15, y: height * 0.22, scale: 1.4, type: 'ground' },
  { x: width * 0.82, y: height * 0.18, scale: 1.0, type: 'flame' },
  { x: width * 0.07, y: height * 0.65, scale: 0.9, type: 'ground' },
  { x: width * 0.9,  y: height * 0.60, scale: 1.1, type: 'rock' },
];

export default function MenuScreen() {
  const navigation = useNavigation<NavProp>();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, pulseAnim, floatAnim]);

  return (
    <View style={styles.container}>
      {/* Decorative SVG background demons */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#9C27B0" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#9C27B0" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={width / 2} cy={height * 0.38} r={160} fill="url(#glow)" />

        {DECORATIVE_DEMONS.map((d, i) => (
          <G key={i} x={d.x} y={d.y} scale={d.scale} opacity={0.35}>
            {d.type === 'ground' && <Polygon points="0,-22 16,14 -16,14" fill="#E53935" />}
            {d.type === 'flame' && (
              <>
                <Polygon points="0,-22 10,8 0,0 -10,8" fill="#FF8F00" />
                <Circle r={6} fill="#FFCC00" cy={-12} />
              </>
            )}
            {d.type === 'rock' && (
              <Polygon points="-16,-10 0,-22 16,-10 16,10 0,18 -16,10" fill="#546E7A" />
            )}
          </G>
        ))}
      </Svg>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Logo / Title */}
          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            <Text style={styles.titleSmall}>⚔ SURVIVE THE NIGHT ⚔</Text>
            <Text style={styles.title}>DEMON{'\n'}CYCLE</Text>
          </Animated.View>

          {/* Ward symbol decoration */}
          <Svg width={80} height={80} style={styles.wardIcon}>
            <Circle cx={40} cy={40} r={36} fill="none" stroke="#FFD700" strokeWidth={2} strokeDasharray="6 4" />
            <Polygon
              points="40,14 44,32 62,32 48,43 53,61 40,50 27,61 32,43 18,32 36,32"
              fill="#FFD700"
              opacity={0.9}
            />
          </Svg>

          {/* Play Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.playBtn} onPress={() => navigation.navigate('Game')} activeOpacity={0.85}>
              <Text style={styles.playBtnText}>ENTER THE CYCLE</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* How to play */}
          <View style={styles.howToPlay}>
            <Text style={styles.howTitle}>HOW TO PLAY</Text>
            <View style={styles.howRow}>
              <Text style={styles.howIcon}>👆</Text>
              <Text style={styles.howText}>Tap to move your ward painter</Text>
            </View>
            <View style={styles.howRow}>
              <Text style={styles.howIcon}>🔶</Text>
              <Text style={styles.howText}>Switch to WARD mode and tap to place protective runes</Text>
            </View>
            <View style={styles.howRow}>
              <Text style={styles.howIcon}>🌙</Text>
              <Text style={styles.howText}>Survive each night — demons grow stronger every day</Text>
            </View>
            <View style={styles.howRow}>
              <Text style={styles.howIcon}>⭐</Text>
              <Text style={styles.howText}>+50pts per night survived, +10-25pts per demon slain</Text>
            </View>
          </View>

          {/* Demon types legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <Svg width={32} height={32}>
                <Polygon points="16,2 28,28 4,28" fill="#E53935" />
              </Svg>
              <Text style={styles.legendText}>Ground{'\n'}Coreling</Text>
            </View>
            <View style={styles.legendItem}>
              <Svg width={32} height={32}>
                <Polygon points="16,2 23,20 16,13 9,20" fill="#FF8F00" />
                <Circle cx={16} cy={9} r={4} fill="#FFCC00" />
              </Svg>
              <Text style={styles.legendText}>Flame{'\n'}Coreling</Text>
            </View>
            <View style={styles.legendItem}>
              <Svg width={32} height={32}>
                <Polygon points="8,6 16,2 24,6 24,22 16,28 8,22" fill="#546E7A" />
              </Svg>
              <Text style={styles.legendText}>Rock{'\n'}Coreling</Text>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07071a',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  titleSmall: {
    color: '#9C27B0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    lineHeight: 62,
    textShadowColor: '#9C27B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  wardIcon: {
    marginVertical: 4,
  },
  playBtn: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CE93D8',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
  howToPlay: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    width: '100%',
    gap: 8,
  },
  howTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  howIcon: {
    fontSize: 16,
    width: 22,
  },
  howText: {
    color: '#BDBDBD',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  legend: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  legendItem: {
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
});
