import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { StyledPicker } from '@/components/StyledPicker';
import { Ionicons } from '@expo/vector-icons';

// Habilita a animação LayoutAnimation no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Interfaces para os tipos de dados ---
interface Faixa { id: number; nome?: string; nome_faixa?: string; }
interface Grupo { id: number; nome_grupo: string; }
interface Posicao { id: number; nome: string; video_url: string; }
interface Grau { grau: number; titulo: string; grupos: { id: number; nome: string; posicoes: Posicao[] }[]; }
interface FaixaCompleta extends Faixa { graus: Grau[]; sub_faixas: any; }
interface Categoria { id: number; nome: string; faixas: FaixaCompleta[]; }

// --- Componente Acordeão Reutilizável com Tipos Corrigidos ---
interface AccordionProps {
  title: string;
  children: React.ReactNode;
}
const AccordionItem: React.FC<AccordionProps> = ({ title, children }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View>
      <TouchableOpacity onPress={toggleExpand} style={styles.accordionHeader}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#333" />
      </TouchableOpacity>
      {expanded && <View style={styles.accordionContent}>{children}</View>}
    </View>
  );
};

export default function GerenciarKatasScreen() {
  const { session } = useAuth();
  
  const [biblioteca, setBiblioteca] = useState<Categoria[]>([]);
  const [faixas, setFaixas] = useState<Faixa[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados do formulário
  const [faixaId, setFaixaId] = useState<number | null>(null);
  const [grau, setGrau] = useState('0');
  const [grupoId, setGrupoId] = useState<number | null>(null);
  const [tituloGrau, setTituloGrau] = useState('');
  const [nomePosicao, setNomePosicao] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [adminData, bibliotecaData] = await Promise.all([
        api.getKataAdminData(session),
        api.getKataBiblioteca(session),
      ]);
      setFaixas(adminData.faixas);
      setGrupos(adminData.grupos);
      setBiblioteca(bibliotecaData);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível carregar os dados dos katas.');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddPosicao = async () => {
    if (!faixaId || !grupoId || !nomePosicao) {
      Alert.alert('Erro', 'Faixa, Grupo e Nome da Posição são obrigatórios.');
      return;
    }
    const posicaoData = { faixa_id: faixaId, grau, grupo_id: grupoId, titulo_grau: tituloGrau, nome_posicao: nomePosicao, video_url: videoUrl };
    try {
      await api.addKataPosicao(posicaoData, session);
      Alert.alert('Sucesso', 'Posição adicionada!');
      setNomePosicao('');
      setVideoUrl('');
      setTituloGrau('');
      fetchData();
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  const handleDeletePosicao = (id: number) => {
    Alert.alert('Confirmar Exclusão', 'Deseja deletar esta posição?', [
      { text: 'Cancelar' },
      { text: 'Deletar', style: 'destructive', onPress: async () => {
        try {
          await api.deleteKataPosicao(id, session);
          Alert.alert('Sucesso', 'Posição deletada.');
          fetchData();
        } catch (error: any) {
          Alert.alert('Erro', error.message);
        }
      }},
    ]);
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Gerenciar Biblioteca de Katas</Text>

        {/* Formulário */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Adicionar Nova Posição</Text>
          <StyledPicker
            label="Faixa *" items={faixas.map(f => ({ label: f.nome_faixa || f.nome || 'Nome inválido', value: f.id, key: f.id }))} onValueChange={setFaixaId} value={faixaId} />
          <StyledPicker label="Grupo da Técnica *" items={grupos.map(g => ({ label: g.nome_grupo, value: g.id, key: g.id }))} onValueChange={setGrupoId} value={grupoId} />
          <TextInput style={styles.input} placeholder="Grau (0-4)" value={grau} onChangeText={setGrau} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Nome da Posição / Golpe *" value={nomePosicao} onChangeText={setNomePosicao} />
          <TextInput style={styles.input} placeholder="Título Principal do Grau (opcional)" value={tituloGrau} onChangeText={setTituloGrau} />
          <TextInput style={styles.input} placeholder="URL do Vídeo (opcional)" value={videoUrl} onChangeText={setVideoUrl} />
          <Button title="Adicionar Posição" onPress={handleAddPosicao} />
        </View>

        {/* Biblioteca de Katas com Acordeão */}
        <View style={styles.listContainer}>
          <Text style={styles.formTitle}>Posições Cadastradas</Text>
          {biblioteca.map(categoria => (
            <View key={categoria.id}>
              <Text style={styles.categoriaTitle}>{categoria.nome}</Text>
              {categoria.faixas.map(faixa => (
                <View key={faixa.id} style={styles.faixaContainer}>
                  <AccordionItem title={faixa.nome || faixa.nome_faixa || 'Faixa sem nome'}>
                    {faixa.graus.map(g => ( // CORREÇÃO: Usamos .map() no array
                      <View key={g.grau} style={styles.grauContainer}>
                        <AccordionItem title={g.titulo || `Grau ${g.grau}`}>
                          {g.grupos.map(gr => ( // CORREÇÃO: Usamos .map() no array
                            <View key={gr.id}>
                              <Text style={styles.grupoTitle}>{gr.nome}</Text>
                              {gr.posicoes.map(p => ( // CORREÇÃO: Usamos .map() no array
                                <View key={p.id} style={styles.posicaoItem}>
                                  <Text style={styles.posicaoText}>{p.nome}</Text>
                                  <TouchableOpacity onPress={() => handleDeletePosicao(p.id)}>
                                    <Ionicons name="trash-bin" size={20} color="#dc3545" />
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                          ))}
                        </AccordionItem>
                      </View>
                    ))}
                  </AccordionItem>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


// Estilos Atualizados
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  formContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 8, marginBottom: 30, elevation: 2 },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { height: 45, borderColor: '#ccc', borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, marginBottom: 15, backgroundColor: '#fff' },
  listContainer: { marginTop: 10 },
  categoriaTitle: { fontSize: 22, fontWeight: 'bold', color: '#007bff', marginTop: 10, borderBottomWidth: 2, borderBottomColor: '#007bff', paddingBottom: 5 },
  faixaContainer: { marginTop: 10 },
  grauContainer: { marginTop: 5 },
  grupoTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 5, marginLeft: 15, color: '#495057' },
  posicaoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 4, marginTop: 5, marginLeft: 15, borderWidth: 1, borderColor: '#eee' },
  posicaoText: { flex: 1 }, // Garante que o texto use o espaço disponível
  
  // Estilos do Acordeão
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    padding: 15,
    borderRadius: 5,
  },
  accordionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
  },
  accordionContent: {
    paddingLeft: 10,
    marginTop: 5,
  },
});