import { View, Text,StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
});

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text>ChatScreen</Text>
    </View>
  );
}