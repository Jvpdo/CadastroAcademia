// components/StyledPicker.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface StyledPickerProps {
  label: string;
  items: { label: string; value: string }[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function StyledPicker({ label, items, value, onValueChange, disabled }: StyledPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.pickerContainer, disabled && styles.disabled]}>
        <Picker
          selectedValue={value}
          onValueChange={(itemValue) => onValueChange(itemValue.toString())}
          enabled={!disabled}
          style={styles.picker}
        >
          {items.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 6,
    color: '#555',
    fontWeight: '600',
    fontSize: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    color: '#000',
  },
  disabled: {
    backgroundColor: '#e9ecef',
    opacity: 0.7,
  },
});