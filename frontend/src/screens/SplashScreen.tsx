import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import Svg, { G, Rect, Polygon, Circle, Line, Path } from 'react-native-svg';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    color: '#8B5CF6',
    fontSize: 11,
    letterSpacing: 5,
    marginTop: 8,
  },
  title: {
    color: '#F3E8FF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 6,
    marginTop: 24,
  },
  line: {
    width: 200,
    height: 3,
    backgroundColor: '#7C3AED',
    borderRadius: 2,
    marginTop: 8,
  },
});

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      {/* 저울 SVG */}
      <Svg width="200" height="160" viewBox="0 0 200 200">
        <G transform="translate(0, 10)">
          {/* 받침대 */}
          <Rect x="85" y="155" width="30" height="8" rx="4" fill="#A78BFA"/>
          <Polygon points="100,115 72,155 128,155" fill="#C4B5FD"/>
          {/* 기둥 */}
          <Rect x="97" y="30" width="6" height="90" rx="3" fill="#C4B5FD"/>
          {/* 중앙 피벗 원 */}
          <Circle cx="100" cy="28" r="9" fill="#F3E8FF"/>
          {/* 빔 */}
          <Line x1="100" y1="28" x2="20" y2="55" stroke="#C4B5FD" strokeWidth="4" strokeLinecap="round"/>
          <Line x1="100" y1="28" x2="180" y2="55" stroke="#C4B5FD" strokeWidth="4" strokeLinecap="round"/>
          {/* 끝 원 */}
          <Circle cx="20" cy="55" r="6" fill="#F3E8FF"/>
          <Circle cx="180" cy="55" r="6" fill="#F3E8FF"/>
          {/* 왼쪽 줄 */}
          <Line x1="20" y1="61" x2="6" y2="115" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round"/>
          <Line x1="20" y1="61" x2="34" y2="115" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round"/>
          {/* 오른쪽 줄 */}
          <Line x1="180" y1="61" x2="166" y2="115" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round"/>
          <Line x1="180" y1="61" x2="194" y2="115" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round"/>
          {/* 왼쪽 접시 */}
          <Path d="M-8,115 Q20,138 48,115" fill="#2D1B54" stroke="#C4B5FD" strokeWidth="2.5"/>
          {/* 오른쪽 접시 */}
          <Path d="M152,115 Q180,138 208,115" fill="#2D1B54" stroke="#C4B5FD" strokeWidth="2.5"/>
        </G>
      </Svg>

      {/* 텍스트 */}
      <Text style={styles.title}>Caslow</Text>
      <View style={styles.line}/>
      <Text style={styles.subtitle}>AI BUDGET MANAGER</Text>
    </View>
  );
}