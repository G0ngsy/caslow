import { View, Text, StyleSheet, TouchableOpacity,Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { recognizeReceipt,uploadExcel } from '../lib/api';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,       // #E3F2FF
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    color: Colors.textDark,               // #1B1E3E
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#437CA1',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 48,
  },
  // 버튼 2x2 그리드
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  optionButton: {
    width: '45%',
    backgroundColor: Colors.bgCard,       // #FFFFFF
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,           // #ABCCEA
    shadowColor: '#255DAA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#D2EEFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionText: {
    color: Colors.textDark,               // #1B1E3E
    fontSize: 15,
    fontWeight: '600',
  },

  // 로딩 오버레이
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default function ExpenseScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

   // 이미지 → base64 변환 후 OCR 호출
  const handleOCR = async (base64: string, mimeType: string) => {
    setLoading(true);
    try {
      const result = await recognizeReceipt(base64, mimeType);
      if (result.success) {
        // OCR 결과를 ExpenseForm으로 전달
        navigation.navigate('ExpenseForm', { ocrData: result.data });
      }
    } catch (error) {
      console.error('OCR 실패:', error);
      Alert.alert('오류', '영수증 인식에 실패했습니다. 직접 입력해주세요.');
      navigation.navigate('ExpenseForm');
    } finally {
      setLoading(false);
    }
  };

  // 엑셀/CSV 파일 가져오기
const handleExcel = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
        'application/vnd.ms-excel', // xls
        'text/csv', // csv
      ],
    });

    if (result.canceled) return;

    const file = result.assets[0];
    setLoading(true);

    // 웹에서는 File 객체로 변환
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const fileObj = new File([blob], file.name, { type: file.mimeType || 'application/octet-stream' });

    const uploadResult = await uploadExcel(fileObj);

    window.alert(`${uploadResult.saved}건의 지출이 저장되었습니다!`);
    navigation.navigate('HomeMain' as never);

  } catch (error) {
    console.error('엑셀 가져오기 실패:', error);
    window.alert('파일 가져오기에 실패했습니다.');
  } finally {
    setLoading(false);
  }
};

  // 카메라 촬영
  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await handleOCR(result.assets[0].base64, 'image/jpeg');
    }
  };

  // 갤러리 선택
  const handleGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '갤러리 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await handleOCR(result.assets[0].base64, 'image/jpeg');
    }
  };
  
  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <Header title="지출 입력" />

      <View style={styles.content}>
        <Text style={styles.title}>입력 방법을 선택해주세요.</Text>
        <Text style={styles.subtitle}>영수증 촬영 또는 직접 입력을 선택해주세요</Text>

        <View style={styles.buttonGrid}>
          {/* 카메라 촬영 */}
          <TouchableOpacity style={styles.optionButton} onPress={handleCamera}>
            <View style={styles.iconBox}>
              <Ionicons name="camera" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.optionText}>카메라 촬영</Text>
          </TouchableOpacity>

          {/* 갤러리 선택 */}
          <TouchableOpacity style={styles.optionButton} onPress={handleGallery}>
            <View style={styles.iconBox}>
              <Ionicons name="images" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.optionText}>갤러리 선택</Text>
          </TouchableOpacity>

          {/* 엑셀/CSV 가져오기 */}
          <TouchableOpacity style={styles.optionButton} onPress={handleExcel}>
            <View style={styles.iconBox}>
              <Ionicons name="document-text" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.optionText}>엑셀 가져오기</Text>
          </TouchableOpacity>

          {/* 직접 입력 */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => navigation.navigate('ExpenseForm')}
          >
            <View style={styles.iconBox}>
              <Ionicons name="create" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.optionText}>직접 입력</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* OCR 로딩 오버레이 */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.white} />
          <Text style={styles.loadingText}>영수증 분석 중... ✨</Text>
        </View>
      )}
    </View>
  );
}