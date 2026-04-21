// src/components/CoinLoader.tsx
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';

interface CoinLoaderProps {
  size?: 'small' | 'large';
  style?: object;
}

export default function CoinLoader({ size = 'large', style }: CoinLoaderProps) {
  const coinRotate = useRef(new Animated.Value(0)).current;

  const diameter = size === 'large' ? 48 : 28;
  const fontSize  = size === 'large' ? 20 : 12;
  const r         = diameter / 2 - 2;
  const cx        = diameter / 2;
  const cy        = diameter / 2;
  const innerR    = r - 4;

  useEffect(() => {
    // iterations: -1 로 무한 반복 보장
    Animated.loop(
      Animated.sequence([
        // 1 → 0 (앞면 → 측면)
        Animated.timing(coinRotate, {
          toValue: 0.5,
          duration: 450,
          useNativeDriver: true,
        }),
        // 0 → -1 (측면 → 뒷면)
        Animated.timing(coinRotate, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 } // 무한 반복
    ).start();

    // 컴포넌트 언마운트 시 애니메이션 정지
    return () => {
      coinRotate.stopAnimation();
    };
  }, []);

  const coinScaleX = coinRotate.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 0, -1, 0, 1],
  });

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View style={{ transform: [{ scaleX: coinScaleX }] }}>
        <Svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
          <Defs>
            <SvgLinearGradient id="coinGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%"   stopColor="#FFE57A" stopOpacity="1" />
              <Stop offset="40%"  stopColor="#FAD493" stopOpacity="1" />
              <Stop offset="100%" stopColor="#E3C170" stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
          <Circle cx={cx} cy={cy} r={r} fill="url(#coinGold)" />
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke="#C9A84C" strokeWidth="1.5" />
          <Circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#C9A84C" strokeWidth="1" strokeOpacity="0.5" />
          <SvgText
            x={cx}
            y={cy + fontSize * 0.38}
            fontSize={fontSize}
            fontWeight="900"
            fill="#9A6F1E"
            textAnchor="middle"
          >
            C
          </SvgText>
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});