import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import MaskInput from 'react-native-mask-input';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function EditarPerfilScreen() {
  const { session } = useAuth();
  const router = useRouter();

  // Estados dos dados
  const [telefone, setTelefone] = useState('');
  const [fotoAtualUrl, setFotoAtualUrl] = useState<string | null>(null);
  
  // Estados de controle da tela
  const [novaFoto, setNovaFoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Busca os dados atuais do próprio usuário logado
  const fetchDados = useCallback(async () => {
    if(!isRefreshing) 
    setIsLoading(true);
    setError(null);
    try {
      const dados = await api.getMeusDados(session);
      setTelefone(dados.telefone || '');
      if (dados.foto_path) {
        setFotoAtualUrl(dados.foto_path);
      }
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar seus dados.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session, isRefreshing]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchDados();
  }, [fetchDados])

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso à galeria.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!pickerResult.canceled) {
      setNovaFoto(pickerResult.assets[0]);
    }
  };

  const handleSalvarFoto = async () => {
    if (!novaFoto) return;
    const formData = new FormData();
    // @ts-ignore
    formData.append('foto', { uri: novaFoto.uri, name: `profile_${Date.now()}.jpg`, type: 'image/jpeg' });
    setIsSaving(true);
    try {
      const response = await api.updateMinhaFoto(formData, session);
      Alert.alert('Sucesso!', response.message, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Erro ao Salvar Foto', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSalvarDados = async () => {
    if (!telefone) {
        Alert.alert('Erro', 'O campo de telefone não pode ficar vazio.');
        return;
    }
    setIsSaving(true);
    try {
      await api.updateMeusDados({ telefone }, session);
      Alert.alert('Sucesso', 'Dados atualizados!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Erro ao Salvar', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }
  
  if (error) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Tentar Novamente" onPress={fetchDados} />
        </View>
    );
  }

  const imageUriToShow = novaFoto?.uri || fotoAtualUrl;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Editar Perfil' }} />
      <ScrollView contentContainerStyle={styles.container}
      refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        >
        <Text style={styles.title}>Edite seu Perfil</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Foto de Perfil</Text>
          <View style={styles.imageContainer}>
            {imageUriToShow ? (
              <Image source={{ uri: imageUriToShow }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.placeholderImage]}>
                <Ionicons name="person-circle" size={80} color="#ccc" />
              </View>
            )}

            <Button title="Trocar Foto" onPress={pickImage} disabled={isSaving} />
            {novaFoto && (
              <View style={styles.buttonContainer}>
                <Button title="Salvar Nova Foto" onPress={handleSalvarFoto} disabled={isSaving} color="#28a745" />
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Telefone</Text>
          <MaskInput style={styles.input} value={telefone} onChangeText={(m, u) => setTelefone(u)} mask={['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]} />
          <View style={styles.buttonContainer}>
            {isSaving ? <ActivityIndicator /> : <Button title="Salvar Dados" onPress={handleSalvarDados} />}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  section: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  input: { height: 50, fontSize: 16, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, paddingHorizontal: 15, color: '#000' },
  buttonContainer: { marginTop: 15 },
  imageContainer: { alignItems: 'center', paddingVertical: 10 },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 20, backgroundColor: '#e9ecef' },
  placeholderImage: { justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', marginBottom: 15, textAlign: 'center' },
});
