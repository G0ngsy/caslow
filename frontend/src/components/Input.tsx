import { useState } from 'react';
import { TextInput, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface InputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onSubmitEditing?: () => void; 
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#27435F',
    color: Colors.white,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#437CA1',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
});

export default function Input({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  onSubmitEditing,
}: InputProps) {

  const [isVisible, setIsVisible] = useState(false);


  return (
    <View style={styles.wrapper}>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#ABCCEA"
      value={value}
      onChangeText={onChangeText}
      style={styles.input}
      secureTextEntry={secureTextEntry && !isVisible}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      onSubmitEditing={onSubmitEditing}
    />
    {secureTextEntry && value.length > 0 && (
  <TouchableOpacity
    style={styles.eyeButton}
    onPress={() => setIsVisible(!isVisible)}
  >
    <Ionicons
      name={isVisible ? 'eye' : 'eye-off'}
      size={22}
      color={Colors.primary}
    />
  </TouchableOpacity>
)}
    </View>
  );
}