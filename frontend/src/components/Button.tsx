import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,     // #255DAA
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,         // #255DAA
  },
  text: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  outlineText: {
    color: Colors.primary,               // #255DAA
  },
});

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
}

export default function Button({ title, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, variant === 'outline' && styles.outline]}
      onPress={onPress}
    >
      <Text style={[styles.text, variant === 'outline' && styles.outlineText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

