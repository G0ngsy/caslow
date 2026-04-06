import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    color: '#2D1B54',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B3FA0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9F6',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F5EEF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionText: {
    color: '#2D1B54',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default function ExpenseScreen() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <Header title="지출 입력" />

      <View style={styles.content}>
        <Text style={styles.title}>입력 방법을 선택해주세요.</Text>
        <Text style={styles.subtitle}>영수증 촬영 또는 직접 입력을 선택해주세요</Text>

        <View style={styles.buttonRow}>
          {/* 사진 촬영 */}
          <TouchableOpacity style={styles.optionButton}>
            <View style={styles.iconBox}>
              <Ionicons name="camera" size={32} color="#7C3AED" />
            </View>
            <Text style={styles.optionText}>사진 촬영</Text>
          </TouchableOpacity>

          {/* 직접 입력 */}
          <TouchableOpacity style={styles.optionButton}
            onPress={() => navigation.navigate('ExpenseForm')}
          >
            <View style={styles.iconBox}>
              <Ionicons name="create" size={32} color="#7C3AED" />
            </View>
            <Text style={styles.optionText}>직접 입력</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}