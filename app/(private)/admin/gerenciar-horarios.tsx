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
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Button,
  Modal,
  TextInput,
  FlatList,
  RefreshControl, // 1. Importar RefreshControl
} from 'react-native';
import MaskInput from 'react-native-mask-input';
import { StyledPicker } from '@/components/StyledPicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


// --- Tipos e Constantes ---
interface Horario { id: number; dia_semana: string; horario_inicio: string; horario_fim: string; descricao: string; tipo_aula: string; }
const DIAS_DA_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const TIPOS_DE_AULA = [{ label: 'Com Kimono', value: 'Com Kimono' }, { label: 'Sem Kimono (No Gi)', value: 'Sem Kimono' }];

export default function GerenciarHorariosScreen() {
  const { session } = useAuth();
  const [horarios, setHorarios] = useState<Record<string, Horario>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // 2. Novo estado para o RefreshControl
  
  const [horariosFixos, setHorariosFixos] = useState<string[]>([]);

  // --- Estados para os Modais ---
  const [isModalAulaVisible, setIsModalAulaVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{dia: string, horario: string, data?: Horario} | null>(null);
  const [descricao, setDescricao] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGradeModalVisible, setIsGradeModalVisible] = useState(false);
  const [tipoAula, setTipoAula] = useState('Com Kimono');
  const [novoHorarioFixo, setNovoHorarioFixo] = useState('');

  const fetchData = useCallback(async () => {
    if (!session) return;
    // Não seta mais o isLoading aqui para não mostrar a tela de carregamento inteira no refresh
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
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar os dados.');
    } finally {
      setIsLoading(false); // Garante que o loading inicial termine
    }
  }, [session]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]); // Removido `session` pois já é dependência de `fetchData`

  // 3. Nova função para lidar com o "deslizar para atualizar"
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [fetchData]);


  // --- Funções dos Modais (sem alterações) ---
  const openModalAula = (dia: string, horario: string, data?: Horario) => {
    setSelectedSlot({ dia, horario, data });
    setDescricao(data?.descricao || '');
    setTipoAula(data?.tipo_aula || 'Com Kimono');
    setIsModalAulaVisible(true);
  };
 
  const handleSaveAula = async () => {
    if (!selectedSlot || !descricao) {
      Alert.alert('Erro', 'A descrição da aula é obrigatória.');
      return;
    }
    setIsSaving(true);
    const horarioData = {
      descricao,
      horario_inicio: selectedSlot.data?.horario_inicio || selectedSlot.horario,
      horario_fim: selectedSlot.data?.horario_fim || `${String(Number(selectedSlot.horario.slice(0, 2)) + 1).padStart(2, '0')}:00`,
      tipo_aula: tipoAula
    };
    try {
      if (selectedSlot.data) {
        await api.updateHorario(selectedSlot.data.id, horarioData, session);
      } else {
        const novoHorario = { ...horarioData, dia_semana: selectedSlot.dia };
        await api.addHorario(novoHorario, session);
      }
      Alert.alert('Sucesso', selectedSlot.data ? 'Aula atualizada!' : 'Aula adicionada!');
      fetchData();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
    setIsSaving(false);
    setIsModalAulaVisible(false);
  };
 
  const handleDeleteAula = async () => {
    if (!selectedSlot?.data) return;
    Alert.alert('Confirmar Exclusão', 'Deseja apagar esta aula?', [
      { text: 'Cancelar' },
      {
        text: 'Deletar', style: 'destructive', onPress: async () => {
          try {
            await api.deleteHorario(selectedSlot.data!.id, session);
            fetchData();
            Alert.alert('Sucesso', 'Aula deletada!');
          } catch (error: any) {
            Alert.alert('Erro', error.message);
          } finally {
            setIsModalAulaVisible(false);
          }
        }
      },
    ]);
  };
  
  const handleAddHorarioFixo = async () => {
    if (novoHorarioFixo.length < 5) {
      Alert.alert('Erro', 'Por favor, insira um horário válido no formato HH:MM.');
      return;
    }
    try {
      await api.addGradeHorario(novoHorarioFixo, session);
      setNovoHorarioFixo('');
      fetchData();
      Alert.alert('Sucesso', 'Horário adicionado à grade!');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };
  
  const handleDeleteHorarioFixo = async (horarioParaDeletar: string) => {
    try {
      await api.deleteGradeHorario(horarioParaDeletar, session);
      fetchData();
      Alert.alert('Sucesso', 'Horário removido da grade!');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  // Alterado para não mostrar o loading de tela cheia durante o refresh
  if (isLoading) {
    return (
      <LinearGradient colors={['#f9f100', '#252403ff', '#222']} style={styles.centered}>
        <ActivityIndicator size="large" color="#FFFFFF" />
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
        <Stack.Screen options={{ title: 'Gerenciar Horários' }} />
        {/* 4. Adicionar a prop refreshControl ao ScrollView */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007bff" // Cor do indicador de loading no iOS
              colors={['#007bff']} // Cor do indicador no Android
            />
          }
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Grade de Horários</Text>
            <TouchableOpacity style={styles.button} onPress={() => setIsGradeModalVisible(true)}>
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Editar Grade</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Clique em uma célula para editar a aula.</Text>

          <View style={styles.tabelaContainer}>
            <View style={styles.row}>
              <View style={styles.timeColumnHeader} />
              {DIAS_DA_SEMANA.map(dia => (
                <View key={dia} style={styles.dayHeaderContainer}>
                  <Text style={styles.dayHeaderText}>{dia}</Text>
                </View>
              ))}
            </View>

            {horariosFixos.map(horario => (
              <View key={horario} style={styles.row}>
                <Text style={styles.timeColumn}>{horario}</Text>
                {DIAS_DA_SEMANA.map(dia => {
                  const diaCompleto = `${dia}-feira`;
                  const key = `${diaCompleto}-${horario}`;
                  const aula = horarios[key];
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.slot, aula ? styles.slotFilled : styles.slotEmpty]}
                      onPress={() => openModalAula(diaCompleto, horario, aula)}
                    >
                      {aula ? (
                        <>
                          <Text style={styles.slotText}>{aula.descricao}</Text>
                          <Text style={[styles.slotSubText, aula.tipo_aula === 'Sem Kimono' && styles.noGiText]}>
                            {aula.tipo_aula}
                          </Text>
                        </>
                      ) : (
                        <View style={styles.slotEmptyContent} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Modal de Edição de AULA (sem alterações) */}
        <Modal visible={isModalAulaVisible} animationType="fade" transparent={true}>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>{selectedSlot?.data ? 'Editar Aula' : 'Adicionar Aula'}</Text>
                    <Text style={styles.modalInfo}>{selectedSlot?.dia} às {selectedSlot?.horario}</Text>
                    <TextInput style={styles.input} placeholder="Descrição da Aula" value={descricao} onChangeText={setDescricao} />
                    <StyledPicker label="Tipo de Aula" items={TIPOS_DE_AULA} onValueChange={setTipoAula} value={tipoAula} />
                    <View style={styles.modalButtonContainer}>
                        <Button title="Cancelar" onPress={() => setIsModalAulaVisible(false)} color="#6c757d" />
                        {selectedSlot?.data && <Button title="Deletar" onPress={handleDeleteAula} color="#dc3545" />}
                        {isSaving ? <ActivityIndicator/> : <Button title="Salvar" onPress={handleSaveAula} />}
                    </View>
                </View>
            </View>
        </Modal>

        {/* Modal de Edição de GRADE (sem alterações) */}
        <Modal visible={isGradeModalVisible} animationType="slide" onRequestClose={() => setIsGradeModalVisible(false)}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.modalPage}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Editar Grade</Text>
                        <TouchableOpacity onPress={() => setIsGradeModalVisible(false)}>
                            <Ionicons name="close-circle" size={30} color="#6c757d" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Adicionar Horário à Grade (HH:MM)</Text>
                        <View style={styles.addHorarioContainer}>
                            <MaskInput style={[styles.input, {flex: 1}]} value={novoHorarioFixo} onChangeText={setNovoHorarioFixo} mask={[/\d/,/\d/,':',/\d/,/\d/]} placeholder="HH:MM" keyboardType="numeric"/>
                            <Button title="Adicionar" onPress={handleAddHorarioFixo} />
                        </View>
                    </View>
                    <FlatList
                        data={horariosFixos}
                        keyExtractor={(item) => item}
                        ListHeaderComponent={<Text style={styles.label}>Horários Atuais:</Text>}
                        renderItem={({item}) => (
                            <View style={styles.horarioFixoItem}>
                                <Text style={styles.horarioFixoText}>{item}</Text>
                                <TouchableOpacity onPress={() => handleDeleteHorarioFixo(item)}>
                                    <Ionicons name="trash-outline" size={24} color="#dc3545" />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                </View>
            </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Estilos (adicionado scrollContainer e container ajustado)
const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    // Container principal do gradiente
    container: { flex: 1 },
    // Container para o conteúdo da ScrollView, para ter padding
    scrollContainer: { paddingHorizontal: 1, paddingBottom: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, paddingHorizontal: 10, paddingTop: 10 },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: '#000000ff', textAlign: 'center', marginBottom: 20 },
    row: { flexDirection: 'row', alignItems: 'stretch' },
    timeColumnHeader: { width: 60 },
    timeColumn: { width: 65, paddingRight: 5, textAlign: 'right', fontSize: 16, color: '#333', fontWeight: 'bold', paddingTop: 20 },
    dayHeaderContainer: { flex: 1, alignItems: 'center', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#dee2e6', minWidth: 65 },
    dayHeaderText: { fontWeight: 'bold', fontSize: 15 },
    slot: { flex: 1, minHeight: 70, borderWidth: 1, borderColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center', padding: 5, margin: 1, borderRadius: 4 },
    slotEmpty: { backgroundColor: '#f8f9fa', borderStyle: 'dashed' },
    slotEmptyContent: { width: '80%', height: 2, backgroundColor: '#ff0202ff', borderRadius: 1 },
    slotFilled: { backgroundColor: '#e9f7ff' },
    noGiText: { color: '#e65252' },
    slotSubText: { textAlign: 'center', fontSize: 11, color: '#007bff', marginTop: 4, fontWeight: '500' },
    slotText: { textAlign: 'center', fontSize: 12, fontWeight: 'bold' },
    modalPage: { flex: 1, padding: 20, backgroundColor: '#fff' }, // Fundo adicionado para visibilidade
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 22, fontWeight: 'bold' },
    formContainer: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '500', marginBottom: 10 },
    addHorarioContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    input: { height: 45, width: '100%', borderColor: '#ccc', borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, color: '#000', backgroundColor: '#fff', },
    horarioFixoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 15, borderRadius: 5, marginBottom: 10 },
    horarioFixoText: { fontSize: 18, fontWeight: 'bold' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 10 },
    modalInfo: { fontSize: 16, color: '#6c757d', marginBottom: 20, textTransform: 'capitalize' },
    modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 },
    tabelaContainer: { backgroundColor: '#fff', padding: 6, paddingHorizontal: 5, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8, marginBottom: 24, },
    button: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#007bff', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, elevation: 2, },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', },
});