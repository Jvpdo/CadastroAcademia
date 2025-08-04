import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Button,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

// Interface para os dados de presença que vêm da API
interface Presenca {
  id: number;
  nome: string;
  foto_path: string | null;
  data_checkin: string;
}

export default function ListaPresencaScreen() {
  const { session } = useAuth();
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  

  // Função para buscar os dados
  const fetchPresenca = useCallback(async () => { 
    if (!isRefreshing) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await api.getPresencaHoje(session);
      setPresencas(data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao buscar a lista de presença.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);

    }
  }, [session, isRefreshing]);

  // Busca os dados quando a tela é carregada
  useEffect(() => {
    fetchPresenca();
  }, [fetchPresenca]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPresenca();
  }, [fetchPresenca]);

  // Formata a data para exibir apenas o horário
  const formatarHorario = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Componente para renderizar cada aluno na lista
  const renderItem = ({ item }: { item: Presenca }) => {
    // Constrói a URL completa da foto, substituindo barras invertidas se necessário
    const fotoUrl = item.foto_path;

    return (
      <View style={styles.itemContainer}>
        {fotoUrl ? (
          <Image source={{ uri: fotoUrl }} style={styles.alunoFoto} />
        ) : (
          <View style={styles.placeholderFoto}>
            <Ionicons name="person" size={24} color="#ccc" />
          </View>
        )}
        <View style={styles.infoContainer}>
          <Text style={styles.alunoNome}>{item.nome}</Text>
          <Text style={styles.checkinHorario}>
            Check-in às: {formatarHorario(item.data_checkin)}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar Novamente" onPress={fetchPresenca} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={presencas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={() => (
          <Text style={styles.title}>Presença do Dia</Text>
        )}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text>Nenhum aluno fez check-in hoje.</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  listContainer: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  alunoFoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  placeholderFoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  alunoNome: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkinHorario: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});