import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import Svg, { G, Rect, Polygon, Circle, Line, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

// ── 그라데이션 로딩 바 ──
// SVG LinearGradient를 활용해서 골드 그라데이션 효과
function GradientLoadingBar({ progress }: { progress: Animated.Value }) {
  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <View style={styles.loadingTrack}>
      {/* 그라데이션 배경 (전체 200px) */}
      <View style={styles.gradientBg} />
      {/* 실제 진행 마스크 */}
      <Animated.View style={[styles.loadingMask, { width: barWidth }]}>
        <Svg width="200" height="3">
          <Defs>
            <SvgLinearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%"   stopColor="#E3C170" stopOpacity="0.6" />
              <Stop offset="50%"  stopColor="#FAD493" stopOpacity="1"   />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="200" height="3" fill="url(#barGrad)" rx="2" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export default function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const logoY = useRef(new Animated.Value(30)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1단계 — 로고 떠오르기
      Animated.parallel([
        Animated.timing(logoY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // 2단계 — 텍스트 페이드인
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // 3단계 — 로딩 바 채워지기
      Animated.timing(progress, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // 로딩 바 다 채워진 후 홈화면 이동
      onFinish?.();
    });
  }, []);

  return (
    <View style={styles.container}>

      {/* 로고 */}
      <Animated.View style={{
        transform: [{ translateY: logoY }],
        opacity: logoOpacity,
      }}>
        <Svg width="200" height="160" viewBox="0 0 200 200">
          <Defs>
            <SvgLinearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%"   stopColor={Colors.accentLight} stopOpacity="0.6" />
              <Stop offset="50%"  stopColor={Colors.accentLight} stopOpacity="1"   />
              <Stop offset="100%" stopColor={Colors.accentLight} stopOpacity="0.6" />
            </SvgLinearGradient>
          </Defs>
          <G transform="translate(0, 10)">
            <Rect x="85" y="155" width="30" height="8" rx="4" fill="#437CA1"/>
            <Polygon points="100,115 72,155 128,155" fill="#A3D8F1"/>
            <Rect x="97" y="30" width="6" height="90" rx="3" fill="#A3D8F1"/>
            <Circle cx="100" cy="28" r="9" fill={Colors.accentLight}/>
            <Line x1="100" y1="28" x2="20"  y2="55" stroke="url(#beamGrad)" strokeWidth="4" strokeLinecap="round"/>
            <Line x1="100" y1="28" x2="180" y2="55" stroke="url(#beamGrad)" strokeWidth="4" strokeLinecap="round"/>
            <Circle cx="20"  cy="55" r="6" fill={Colors.accentLight}/>
            <Circle cx="180" cy="55" r="6" fill={Colors.accentLight}/>
            <Line x1="20" y1="61" x2="6"   y2="115" stroke="#437CA1" strokeWidth="2.5" strokeLinecap="round"/>
            <Line x1="20" y1="61" x2="34"  y2="115" stroke="#437CA1" strokeWidth="2.5" strokeLinecap="round"/>
            <Line x1="180" y1="61" x2="166" y2="115" stroke="#437CA1" strokeWidth="2.5" strokeLinecap="round"/>
            <Line x1="180" y1="61" x2="194" y2="115" stroke="#437CA1" strokeWidth="2.5" strokeLinecap="round"/>
            <Path d="M-8,115 Q20,138 48,115"   fill="#1D3052" stroke="#A3D8F1" strokeWidth="2.5"/>
            <Path d="M152,115 Q180,138 208,115" fill="#1D3052" stroke="#A3D8F1" strokeWidth="2.5"/>
          </G>
        </Svg>
      </Animated.View>

      {/* 텍스트 + 로딩 바 */}
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.title}>Caslow</Text>
        <GradientLoadingBar progress={progress} />
        <Text style={styles.subtitle}>AI BUDGET MANAGER</Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: Colors.accentLight,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 6,
    marginTop: 24,
  },
  subtitle: {
    color: '#437CA1',
    fontSize: 11,
    letterSpacing: 5,
    marginTop: 10,
  },
  loadingTrack: {
    width: 200,
    height: 3,
    backgroundColor: '#1D3052',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBg: {
    position: 'absolute',
    width: 200,
    height: 3,
  },
  loadingMask: {
    height: 3,
    overflow: 'hidden',
    borderRadius: 2,
  },
});