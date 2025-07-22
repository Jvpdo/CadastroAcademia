import { useAuth } from '@/context/AuthContext';
import { api, BASE_URL } from '@/services/api';
import { useLocalSearchParams, Stack, useRouter, useFocusEffect } from 'expo-router';
import React, {useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Button,
  Alert,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

// Interface para os dados do aluno
interface AlunoDetalhado {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  sexo: string;
  dataNascimento: string;
  faixa: string;
  grau: string;
  plano: string;
  foto_path: string | null;
}

export default function AlunoDetalheScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter(); // Para navegar de volta

  const [aluno, setAluno] = useState<AlunoDetalhado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const alunoId = Number(id);

  const fetchAluno = useCallback(async () => {
    if (!alunoId) return;
    try {
if (!isRefreshing) setIsLoading(true); 
      setError(null);
      const response = await api.getAlunoById(alunoId, session);
      setAluno(response.data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao buscar os detalhes.');
    } finally {
      setIsLoading(false);
    }
  }, [alunoId, session, isRefreshing]);

  useFocusEffect(
    useCallback(() => {
      fetchAluno();
    }, [fetchAluno])
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAluno();
  }, [fetchAluno]);

  const handleDeletar = () => {
    Alert.alert(
      "Confirmar Exclusão",
      `Você tem certeza que deseja deletar o aluno ${aluno?.nome}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.deleteAluno(alunoId, session);
              Alert.alert("Sucesso", response.message);
              router.back(); 
            } catch (error: any) {
              Alert.alert("Erro ao Deletar", error.message);
            }
          }
        }
      ]
    );
  };

  const handleEditar = () => {
    // Navega para a nova tela de edição, passando o ID do aluno
    router.push(`/(private)/admin/aluno/editar/${alunoId}`);
  };

  const formatarData = (dataISO: string) => {
    if (!dataISO) return 'Não informado';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error || !aluno) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Aluno não encontrado.'}</Text>
        <Button title="Tentar Novamente" onPress={fetchAluno} />
      </View>
    );
  }

  // Se passou pelas verificações acima, 'aluno' não é mais nulo
  const fotoUrl = aluno.foto_path
    ? `${BASE_URL}/${aluno.foto_path.replace(/\\/g, '/')}`
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: aluno.nome }} />
      <ScrollView contentContainerStyle={styles.container}
      refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        >
        {fotoUrl ? (
          <Image source={{ uri: fotoUrl }} style={styles.alunoFoto} />
        ) : (
          <View style={styles.placeholderFoto}>
            <Ionicons name="person-circle-outline" size={80} color="#ccc" />
          </View>
        )}
        <Text style={styles.alunoNome}>{aluno.nome}</Text>
        
        <View style={styles.infoBox}>
          <InfoRow label="Email:" value={aluno.email} />
          <InfoRow label="Telefone:" value={aluno.telefone} />
          <InfoRow label="Sexo:" value={aluno.sexo} />
          <InfoRow label="Nascimento:" value={formatarData(aluno.dataNascimento)} />
          <InfoRow label="Faixa:" value={aluno.faixa} />
          <InfoRow label="Grau:" value={aluno.grau} />
          <InfoRow label="Plano:" value={aluno.plano} />
        </View>

        <View style={styles.actionsContainer}>
          <Button title="Editar Aluno" onPress={handleEditar} />
          <View style={{ marginTop: 10 }}>
            <Button 
                title="Histórico de Check-in" 
                onPress={() => router.push(`/(private)/admin/aluno/historico/${alunoId}`)}
                color="#6c757d"
            />
            </View>
          <View style={{ marginTop: 10 }}>
            <Button title="Deletar Aluno" onPress={handleDeletar} color="#dc3545" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { paddingVertical: 20, paddingHorizontal: 25 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  alunoFoto: { width: 150, height: 150, borderRadius: 75, alignSelf: 'center', marginBottom: 20, backgroundColor: '#e9ecef' },
  placeholderFoto: { width: 150, height: 150, borderRadius: 75, alignSelf: 'center', marginBottom: 20, backgroundColor: '#e9ecef', justifyContent: 'center', alignItems: 'center' },
  alunoNome: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  infoBox: { backgroundColor: '#f8f9fa', padding: 20, borderRadius: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  infoLabel: { fontSize: 16, fontWeight: 'bold', color: '#6c757d' },
  infoValue: { fontSize: 16, color: '#212529', textTransform: 'capitalize' },
  actionsContainer: { marginTop: 30 },
  errorText: { color: 'red', marginBottom: 15, textAlign: 'center' },
});