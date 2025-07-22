//import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

const CREDENTIALS_KEY = 'biometric_credentials';
const HAS_ASKED_KEY = 'has_asked_to_save_credentials';



export default function LoginScreen() {
  const { signIn, session } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const biometricCalledRef = useRef(false);

  const performLogin = useCallback(async (loginEmail: string, loginPassword: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(loginEmail, loginPassword);
      if (data.token) {
        await signIn(data.token, senha);
        return true;
      }
      throw new Error('Token não recebido da API');
    } catch (error: any) {
      Alert.alert('Falha no Login', error.message || 'Não foi possível fazer login.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [signIn]);

  const handleBiometricAuth = useCallback(async () => {
    if (session || biometricCalledRef.current) return; // ✅ Evita duplicação
    biometricCalledRef.current = true;

    const savedCredentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (!savedCredentials) return;

    const biometricAuth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login com Impressão Digital',
      cancelLabel: 'Usar Senha',
    });

    if (biometricAuth.success) {
      const { email: savedEmail, senha: savedPassword } = JSON.parse(savedCredentials);
      await performLogin(savedEmail, savedPassword);
    }
  }, [performLogin, session]);

  useEffect(() => {
    const checkAndAttemptBiometrics = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const credentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);

      const supported = hasHardware && isEnrolled;
      setIsBiometricSupported(supported);

      if (supported && credentials && !session) {
        handleBiometricAuth();
      }
    };
    checkAndAttemptBiometrics();
  }, [handleBiometricAuth, session]);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Por favor, preencha o email e a senha.');
      return;
    }
    const success = await performLogin(email, senha);
    const credentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    const hasAsked = await SecureStore.getItemAsync(HAS_ASKED_KEY);

    if (success && isBiometricSupported && !credentials && !hasAsked) {
      Alert.alert(
        'Login Rápido',
        'Deseja habilitar o Login por digital?',
        [
          { text: 'Não', style: 'cancel' },
          {
            text: 'Sim',
            onPress: async () => {
              await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify({ email, senha }));
              Alert.alert('Credenciais Salvas!', 'Você já pode ativar o login por digital na tela de Configurações.');
            },
          },
        ]
      );
      await SecureStore.setItemAsync(HAS_ASKED_KEY, 'true');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email:</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="seuemail@exemplo.com"
              placeholderTextColor="#999"
              editable={!isLoading}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Senha:</Text>
            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              placeholder="********"
              placeholderTextColor="#999"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
          </TouchableOpacity>

          {isBiometricSupported && (
            <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
              <Ionicons name="finger-print" size={32} color="#007bff" />
              <Text style={styles.biometricText}>Usar Digital</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f9', justifyContent: 'center' },
  container: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 10,
    marginHorizontal: 20,
    elevation: 8,
    alignItems: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  form: { width: '100%' },
  formGroup: { marginBottom: 15, width: '100%' },
  label: { marginBottom: 5, fontWeight: 'bold', color: '#333', fontSize: 16 },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    fontSize: 16,
  },
  btn: {
    width: '100%',
    padding: 15,
    backgroundColor: '#28a745',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  btnDisabled: { backgroundColor: '#9fdba9' },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    padding: 10,
  },
  biometricText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});