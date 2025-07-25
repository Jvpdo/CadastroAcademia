import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Stack } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Button,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// --- Tipos e Constantes ---
interface Horario {
  id: number;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  descricao: string;
  tipo_aula: string;
}
const DIAS_DA_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

export default function HorariosAlunoScreen() {
  const { session } = useAuth();
  const [horarios, setHorarios] = useState<Record<string, Horario>>({});
  const [horariosFixos, setHorariosFixos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Renomeado de isRefreshing para consistência
  const [error, setError] = useState<string | null>(null);

  // --- Lógica de busca de dados (ajustada para seguir o padrão) ---
  const fetchData = useCallback(async () => {
    if (!session) return;
    setError(null);
    try {
      const [dataAulas, dataGrade] = await Promise.all([
        api.getHorarios(session),
        api.getGradeHorarios(session),
      ]);

      const horariosMap = (dataAulas as Horario[]).reduce((acc, h) => {
        const key = `${h.dia_semana}-${h.horario_inicio.slice(0, 5)}`;
        acc[key] = h;
        return acc;
      }, {} as Record<string, Horario>);

      setHorarios(horariosMap);
      setHorariosFixos(dataGrade);
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar os horários.');
    } finally {
      // A lógica de loading é controlada pelo useEffect e onRefresh
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    setIsLoading(true); // Controla o loading inicial aqui
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [fetchData]);

  // --- Telas de Carregamento e Erro com o novo estilo ---
  if (isLoading) {
    return (
      <LinearGradient colors={['#f9f100', '#252403ff', '#222']} style={styles.centered}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Carregando grade...</Text>
      </LinearGradient>
    );
  }

  if (error && !horariosFixos.length) {
    return (
      <LinearGradient colors={['#f9f100', '#252403ff', '#222']} style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar Novamente" onPress={fetchData} color="#007bff"/>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#f9f100', '#252403ff', '#222']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 1.5, y: 2 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: 'Grade de Horários' }} />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF" // Cor do indicador de loading
              colors={['#FFFFFF']}
            />
          }
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Grade de Horários</Text>
          </View>
          
          {/* Container da tabela para o efeito de "card" */}
          <View style={styles.tabelaContainer}>
            {/* Cabeçalho dos dias */}
            <View style={styles.row}>
              <View style={styles.timeColumnHeader} />
              {DIAS_DA_SEMANA.map(dia => (
                <View key={dia} style={styles.dayHeaderContainer}>
                  <Text style={styles.dayHeaderText}>{dia}</Text>
                </View>
              ))}
            </View>

            {/* Linhas de horários */}
            {horariosFixos.map(horario => (
              <View key={horario} style={styles.row}>
                <Text style={styles.timeColumn}>{horario}</Text>
                {DIAS_DA_SEMANA.map(dia => {
                  const diaCompleto = `${dia}-feira`;
                  const key = `${diaCompleto}-${horario}`;
                  const aula = horarios[key];
                  return (
                    <View key={key} style={[styles.slot, aula ? styles.slotFilled : styles.slotEmpty]}>
                      {aula ? (
                        <>
                          <Text style={styles.slotText}>{aula.descricao}</Text>
                          <Text style={[styles.slotSubText, aula.tipo_aula === 'Sem Kimono' && styles.noGiText]}>
                            {aula.tipo_aula}
                          </Text>
                        </>
                      ) : (
                        // Utiliza o mesmo estilo de célula vazia da tela de gerenciamento
                        <View style={styles.slotEmptyContent} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Estilos unificados com base na tela GerenciarHorariosScreen
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContainer: { paddingHorizontal: 1, paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { paddingHorizontal: 10, paddingTop: 10, marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  tabelaContainer: { 
    backgroundColor: '#fff', 
    padding: 6, 
    paddingHorizontal: 5, 
    borderRadius: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 4.65, 
    elevation: 8, 
    marginHorizontal: 4,
  },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  timeColumnHeader: { width: 60 },
  timeColumn: { width: 65, paddingRight: 5, textAlign: 'right', fontSize: 16, color: '#333', fontWeight: 'bold', paddingTop: 20 },
  dayHeaderContainer: { flex: 1, alignItems: 'center', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#dee2e6', minWidth: 65 },
  dayHeaderText: { fontWeight: 'bold', fontSize: 15 },
  slot: { flex: 1, minHeight: 70, borderWidth: 1, borderColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center', padding: 5, margin: 1, borderRadius: 4 },
  slotEmpty: { backgroundColor: '#f8f9fa', borderStyle: 'dashed' },
  slotEmptyContent: { width: '80%', height: 2, backgroundColor: '#ff0000ff', borderRadius: 1 },
  slotFilled: { backgroundColor: '#e9f7ff' },
  slotText: { textAlign: 'center', fontSize: 12, fontWeight: 'bold' },
  slotSubText: { textAlign: 'center', fontSize: 11, color: '#007bff', marginTop: 4, fontWeight: '500' },
  noGiText: { color: '#e65252' },
  errorText: { color: '#fff', fontSize: 16, marginBottom: 15, textAlign: 'center' },
});