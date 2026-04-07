import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import Header from '../components/Header';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
});

export default function GoalScreen() {
  return (
    <View style={styles.container}>
      <Header title="목표" />
    </View>
  );
}