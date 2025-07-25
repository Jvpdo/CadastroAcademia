import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { useLocalSearchParams, Stack, } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  TouchableOpacity,
  Button,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaskInput from 'react-native-mask-input';

interface Checkin {
  id: number;
  data_checkin: string;
}
interface Pagination {
  currentPage: number;
  totalPages: number;
}

export default function HistoricoCheckinScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const alunoId = Number(id);

  const [historico, setHistorico] = useState<Checkin[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [dataManual, setDataManual] = useState(''); // Para o input de data

  const fetchHistorico = useCallback(async (page: number) => {
    if (!alunoId) return;
    setIsLoading(true);
    try {
      const data = await api.getHistoricoAluno(alunoId, page, session);
      setHistorico(data.checkins);
      setPagination(data.pagination);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar o histórico.');
    } finally {
      setIsLoading(false);
    }
  }, [alunoId, session]);

  useEffect(() => {
    fetchHistorico(currentPage);
  }, [currentPage, fetchHistorico]);

  const handleAddCheckin = async () => {
    const formatarDataParaAPI = (data: string) => {
        if (data.length !== 8) return null;
        const dia = data.substring(0, 2);
        const mes = data.substring(2, 4);
        const ano = data.substring(4, 8);
        return `${ano}-${mes}-${dia}`;
    };
    const dataFormatada = formatarDataParaAPI(dataManual);
    if (!dataFormatada) {
        Alert.alert('Erro', 'Por favor, insira uma data válida no formato DD/MM/AAAA.');
        return;
    }
    
    try {
        await api.addCheckinManual(alunoId, dataFormatada, session);
        Alert.alert('Sucesso', 'Check-in manual adicionado!');
        setDataManual('');
        fetchHistorico(1); // Volta para a primeira página
    } catch (error: any) {
        Alert.alert('Erro', error.message);
    }
  };
  
  const handleDeleteCheckin = (checkinId: number) => {
    Alert.alert('Confirmar Exclusão', 'Deseja deletar este check-in?', [
      { text: 'Cancelar' },
      { text: 'Deletar', style: 'destructive', onPress: async () => {
        try {
          await api.deleteCheckin(checkinId, session);
          Alert.alert('Sucesso', 'Check-in deletado.');
          fetchHistorico(currentPage);
        } catch (error: any) {
          Alert.alert('Erro', error.message);
        }
      }},
    ]);
  };
  
  const renderItem = ({ item }: { item: Checkin }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>
        {new Date(item.data_checkin).toLocaleDateString('pt-BR', { dateStyle: 'full' })}
      </Text>
      <TouchableOpacity onPress={() => handleDeleteCheckin(item.id)}>
        <Ionicons name="trash-bin-outline" size={22} color="#dc3545" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Histórico de Check-ins' }} />

      {/* Formulário de Adição Manual */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Adicionar Check-in Manual</Text>
        <MaskInput
          style={styles.input}
          value={dataManual}
          onChangeText={(masked, unmasked) => setDataManual(unmasked)}
          mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/]}
          placeholder="DD/MM/AAAA"
          keyboardType="numeric"
        />
        <Button title="Adicionar" onPress={handleAddCheckin} />
      </View>
      
      {isLoading ? <ActivityIndicator size="large" style={{flex: 1}}/> : (
        <FlatList
            data={historico}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum check-in encontrado.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  formContainer: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#dee2e6' },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { height: 45, borderColor: '#ccc', borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, marginBottom: 10, backgroundColor: '#fff' },
  list: { padding: 20 },
  itemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  itemText: { fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: '#6c757d' },
});
