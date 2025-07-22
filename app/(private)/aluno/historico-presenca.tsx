import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Stack } from 'expo-router';
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
import { Ionicons } from '@expo/vector-icons';

// Interface para cada item do histórico
interface Checkin {
  data_checkin: string;
}

export default function HistoricoPresencaScreen() {
  const { session } = useAuth();
  const [historico, setHistorico] = useState<Checkin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar os dados
  const fetchHistorico = useCallback(async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      setError(null);
      const data = await api.getMeuHistoricoCheckins(session);
      setHistorico(data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao buscar o histórico.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session, isRefreshing]);

  // Busca os dados quando a tela é carregada
  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  // Função para o "puxar para atualizar"
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchHistorico();
  }, [fetchHistorico]);

  // Formata a data e o horário
  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatarHorario = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Componente para renderizar cada item da lista
  const renderItem = ({ item }: { item: Checkin }) => (
    <View style={styles.itemContainer}>
      <Ionicons name="calendar-outline" size={24} color="#007bff" />
      <View style={styles.infoContainer}>
        <Text style={styles.itemDate}>{formatarData(item.data_checkin)}</Text>
        <Text style={styles.itemTime}>Check-in às {formatarHorario(item.data_checkin)}</Text>
      </View>
    </View>
  );
  
  // Telas de feedback
  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /><Text>Carregando histórico...</Text></View>;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar Novamente" onPress={fetchHistorico} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Histórico de Presença' }} />
      <FlatList
        data={historico}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.data_checkin}-${index}`}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={() => (
          <Text style={styles.title}>Meu Histórico de Presença</Text>
        )}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text>Você ainda não tem nenhum check-in registrado.</Text>
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
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  listContainer: { padding: 20, flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 25 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  infoContainer: {
    marginLeft: 15,
  },
  itemDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40',
  },
  itemTime: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  errorText: { color: 'red', marginBottom: 15 },
});
