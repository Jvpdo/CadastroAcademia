// components/BiometricSwitch.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'biometric_credentials';

interface BiometricSwitchProps {
  email: string;
  senha: string;
}


export const BiometricSwitch: React.FC<BiometricSwitchProps> = ({ email, senha }) => {
  const [isSwitchEnabled, setIsSwitchEnabled] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  const checkBiometricStatus = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const savedCredentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);

      setIsBiometricSupported(hasHardware && isEnrolled);
      setIsSwitchEnabled(!!savedCredentials);
    } catch (error) {
      console.error('Erro ao verificar biometria:', error);
    }
  }, []);

  useEffect(() => {
    checkBiometricStatus();
  }, [checkBiometricStatus]);

  const handleToggleSwitch = async (newValue: boolean) => {
    if (newValue === true) {
      const savedCredentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);

      if (!savedCredentials) {
        if (!email || !senha) {
          Alert.alert(
            "Credenciais ausentes",
            "Faça login com email e senha antes de ativar a biometria."
          );
          return;
        }

        await SecureStore.setItemAsync(
          CREDENTIALS_KEY,
          JSON.stringify({ email, senha })
        );

        Alert.alert('Biometria ativada', 'Login por digital foi ativado com sucesso.');
      }

      setIsSwitchEnabled(true);
    } else {
      await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
      setIsSwitchEnabled(false);
      Alert.alert('Desabilitado', 'O login por impressão digital foi desabilitado.');
    }
  };

  if (!isBiometricSupported) {
    return (
      <View style={styles.container}>
        <Text style={styles.textDisabled}>
          Login por digital não disponível neste aparelho.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Habilitar login por impressão digital</Text>
      <Switch
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={isSwitchEnabled ? '#007bff' : '#f4f3f4'}
        onValueChange={handleToggleSwitch}
        value={isSwitchEnabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  text: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  textDisabled: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
    color: '#999',
  },
});