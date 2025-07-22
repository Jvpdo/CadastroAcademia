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

// --- Tipos e Constantes ---
interface Horario { id: number; dia_semana: string; horario_inicio: string; horario_fim: string; descricao: string; tipo_aula: string; }
const DIAS_DA_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

export default function HorariosAlunoScreen() {
  const { session } = useAuth();
  const [horarios, setHorarios] = useState<Record<string, Horario>>({});
  const [horariosFixos, setHorariosFixos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isRefreshing) setIsLoading(true);
    setError(null);
    try {
      // Buscamos tanto as aulas quanto a grade de horários
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
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session, isRefreshing]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (isLoading) { return <View style={styles.centered}><ActivityIndicator size="large" /><Text style={{color: '#fff'}}>Carregando grade...</Text></View>; }
  if (error) { return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text><Button title="Tentar Novamente" onPress={fetchData}/></View>; }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Grade de Horários' }} />
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Grade de Horários</Text>

        <View>
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
                  // Usamos uma View simples em vez de um botão
                  <View key={key} style={[styles.slot, aula ? styles.slotFilled : styles.slotEmpty]}>
                    {aula ? (
                      <>
                        <Text style={styles.slotText}>{aula.descricao}</Text>
                        <Text style={[styles.slotSubText, aula.tipo_aula === 'Sem Kimono' && styles.noGiText]}>
                          {aula.tipo_aula}
                        </Text>
                      </>
                    ) : ( 
                      <Text style={[styles.slotText, styles.semAulaText]}>Sem Aula</Text> 
                    )}
                  </View>
                )
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { paddingHorizontal: 1, paddingBottom: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    row: { flexDirection: 'row', alignItems: 'stretch' },
    timeColumnHeader: { width: 65 },
    timeColumn: { width: 65, paddingRight: 5, textAlign: 'right', fontSize: 16, color: '#333', fontWeight: 'bold', paddingTop: 20 },
    dayHeaderContainer: { flex: 1, alignItems: 'center', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#dee2e6', minWidth: 60 },
    dayHeaderText: { fontWeight: 'bold', fontSize: 15 },
    slot: { flex: 1, minHeight: 70, borderWidth: 1, borderColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center', padding: 5, margin: 1, borderRadius: 4 },
    slotEmpty: { backgroundColor: '#f8f9fa' },
    slotFilled: { backgroundColor: '#e9f7ff' },
    slotText: { textAlign: 'center', fontSize: 13, fontWeight: 'bold' },
    slotSubText: { fontSize: 11, color: '#007bff', marginTop: 4, fontWeight: '500' },
    noGiText: { color: '#e65252' },
    semAulaText: { color: '#adb5bd' }, // Estilo para o texto "Sem Aula"
    errorText: { color: 'red', marginBottom: 15, textAlign: 'center' },
});
