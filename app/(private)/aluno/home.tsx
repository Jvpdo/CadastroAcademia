import { useAuth } from '@/context/AuthContext';
import { api, BASE_URL } from '@/services/api';
import { Stack } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Button,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

// Interface for student data
interface AlunoDados {
  nome: string;
  email: string;
  telefone: string;
  faixa: string;
  grau: string;
  plano: string;
  dataNascimento: string;
  foto_path: string | null;
}

// Component to display each row of information
const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

export default function AlunoHomeScreen() {
  const { session } = useAuth();
  const [aluno, setAluno] = useState<AlunoDados | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null); // This will now be used

  // Function to fetch student data
  const fetchData = useCallback(async () => {
    if (!isRefreshing) {
    setIsLoading(true);
    }
    setError(null); // Clear previous errors
    try {
      const dadosAluno = await api.getMeusDados(session);
      setAluno(dadosAluno);
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar seus dados.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session, isRefreshing]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true); // Ativa a animação
    fetchData(); // Busca os dados novamente
  }, [fetchData]);

  // Check-in function (no changes)
  const handleCheckin = async () => {
    try {
      const response = await api.fazerCheckin(session);
      Alert.alert('Sucesso!', response.message);
      onRefresh();
    } catch (error: any) {
      Alert.alert('Atenção', error.message);
    }
  };

  // Age calculation function (no changes)
  const calcularIdade = (dataNasc: string): string => {
    if (!dataNasc) return 'N/A';
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade.toString();
  };

  // Conditional rendering
  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /><Text>Carregando seu perfil...</Text></View>;
  }

  // ===== CORRECTION HERE =====
  // We added this block to handle and display any errors
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar Novamente" onPress={fetchData} />
      </View>
    );
  }

  if (!aluno) {
    return (
      <View style={styles.centered}>
        <Text>Não foi possível carregar os dados do aluno.</Text>
        <Button title="Tentar Novamente" onPress={fetchData} />
      </View>
    );
  }
  
  const fotoUrl = aluno.foto_path ? `${BASE_URL}/${aluno.foto_path.replace(/\\/g, '/')}` : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Meu Painel' }} />
      <ScrollView contentContainerStyle={styles.container}
      refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        >
        <View style={styles.profileHeader}>
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle" size={100} color="#007bff" />
          )}
          <Text style={styles.profileName}>{aluno.nome}</Text>
          <Text style={styles.profileBelt}>{aluno.faixa} - {aluno.grau}</Text>
        </View>

        <TouchableOpacity style={styles.checkinButton} onPress={handleCheckin}>
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
          <Text style={styles.checkinButtonText}>Fazer Check-in</Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Minhas Informações</Text>
          <View style={styles.infoBox}>
            <InfoRow label="Plano:" value={aluno.plano || 'N/A'} />
            <InfoRow label="Email:" value={aluno.email || 'N/A'} />
            <InfoRow label="Telefone:" value={aluno.telefone || 'N/A'} />
            <InfoRow label="Idade:" value={`${calcularIdade(aluno.dataNascimento)} anos`} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#007bff' },
  profileName: { fontSize: 24, fontWeight: 'bold', marginTop: 15, color: '#343a40' },
  profileBelt: { fontSize: 18, color: '#6c757d', marginTop: 5, textTransform: 'capitalize' },
  checkinButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#28a745', paddingVertical: 15, borderRadius: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
  checkinButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  infoContainer: { marginTop: 40 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  infoBox: { backgroundColor: '#fff', padding: 5, borderRadius: 10, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  infoLabel: { fontSize: 16, fontWeight: '500', color: '#6c757d' },
  infoValue: { fontSize: 16, color: '#212529', textTransform: 'capitalize' },
  errorText: { color: 'red', marginBottom: 15, textAlign: 'center' },
});