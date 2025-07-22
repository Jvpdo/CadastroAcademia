// Em components/StyledPicker.tsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';

interface PickerProps {
  label: string;
  items: { label: string; value: any }[];
  onValueChange: (value: any) => void;
  value: any;
  placeholder?: { label: string; value: null };
  disabled?: boolean;
}

export const StyledPicker: React.FC<PickerProps> = ({
  label,
  items,
  onValueChange,
  value,
  placeholder = {},
  disabled = false,
}) => {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <RNPickerSelect
        onValueChange={onValueChange}
        items={items}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={false}
        Icon={() => {
          return <Ionicons name="chevron-down" size={24} color="gray" />;
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    color: '#333',
    fontWeight: 'bold',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // para garantir que o texto não fique atrás do ícone
    backgroundColor: '#fff',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // para garantir que o texto não fique atrás do ícone
    backgroundColor: '#fff',
  },
  iconContainer: {
    top: 10,
    right: 15,
  },
});