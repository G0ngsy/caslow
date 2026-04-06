import { View, Text,StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
});

export default function AnalysisScreen(){
  return (
    <View style={styles.container}>
      <Text>AnalysisScreen</Text>
    </View>
  );
}