import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AlterarSenhaScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [senhaAntiga, setSenhaAntiga] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [isConfirmarSenhaVisivel, setIsConfirmarSenhaVisivel] = useState(false);
  const [isSenhaAntigaVisivel, setIsSenhaAntigaVisivel] = useState(false);
  const [isNovaSenhaVisivel, setIsNovaSenhaVisivel] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleSalvar = async () => {
    if (!senhaAntiga || !novaSenha || !confirmarNovaSenha) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios.');
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      Alert.alert('Erro', 'A nova senha e a confirmação não correspondem.');
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert('Erro', 'A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.updatePassword({ senhaAntiga, novaSenha }, session);
      Alert.alert('Sucesso!', response.message, [
        { text: 'OK', onPress: () => router.back() }, // Volta para a tela de Configurações
      ]);
    } catch (error: any) {
      Alert.alert('Falha ao Alterar Senha', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Alterar Senha' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Altere sua Senha</Text>
        <Text style={styles.subtitle}>
          Para sua segurança, digite sua senha antiga e depois a nova senha duas vezes.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Senha Antiga</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              secureTextEntry={!isSenhaAntigaVisivel}
              value={senhaAntiga}
              onChangeText={setSenhaAntiga}
            />
            <TouchableOpacity onPress={() => setIsSenhaAntigaVisivel(v => !v)}>
              <Ionicons name={isSenhaAntigaVisivel ? 'eye-off' : 'eye'} size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nova Senha</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              secureTextEntry={!isNovaSenhaVisivel}
              value={novaSenha}
              onChangeText={setNovaSenha}
            />
            <TouchableOpacity onPress={() => setIsNovaSenhaVisivel(v => !v)}>
              <Ionicons name={isNovaSenhaVisivel ? 'eye-off' : 'eye'} size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar Nova Senha</Text>
          <View style={styles.passwordContainer}>
  <TextInput
    style={styles.input}
    secureTextEntry={!isConfirmarSenhaVisivel}
    value={confirmarNovaSenha}
    onChangeText={setConfirmarNovaSenha}
  />
  <TouchableOpacity onPress={() => setIsConfirmarSenhaVisivel(v => !v)}>
    <Ionicons name={isConfirmarSenhaVisivel ? 'eye-off' : 'eye'} size={24} color="gray" />
  </TouchableOpacity>
</View>

          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" />
            ) : (
              <Button title="Salvar Nova Senha" onPress={handleSalvar} />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6c757d', textAlign: 'center', marginTop: 10, marginBottom: 30 },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#000',
  },
  lastInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 30,
  },
});
