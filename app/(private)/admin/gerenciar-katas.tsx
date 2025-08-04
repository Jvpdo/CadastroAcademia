// app/(private)/admin/gerenciar-katas.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Button, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, SafeAreaView, Linking, Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { api } from '@/services/api'; 
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// --- Interfaces de Tipo ---
interface Posicao { id: number; nome: string; video_url?: string; }
interface Grupo { id: number; nome: string; posicoes: Posicao[]; }
interface Grau { grau: number; titulo: string; grupos: Grupo[]; }
interface Faixa { id: number; nome: string; nome_faixa?: string; faixa_pai_id: number | null; graus: Grau[]; sub_faixas: Faixa[]; }
interface Categoria { id: number; nome: string; faixas: Faixa[]; }
interface FormFaixa { id: number; nome_faixa: string; }
interface FormGrupo { id: number; nome_grupo: string; }

// --- Componentes Internos ---

const AcordeaoItem = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={styles.acordeaoContainer}>
      <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={styles.acordeaoHeader}>
        <Text style={styles.acordeaoTitle}>{title}</Text>
        <Text style={styles.acordeaoIcon}>{isOpen ? '−' : '+'}</Text>
      </TouchableOpacity>
      {isOpen && <View style={styles.acordeaoContent}>{children}</View>}
    </View>
  );
};

// --- Tela Principal ---

const GerenciarKatasScreen = () => {
  const { session } = useAuth();
  
  const [biblioteca, setBiblioteca] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formFaixas, setFormFaixas] = useState<FormFaixa[]>([]);
  const [formGrupos, setFormGrupos] = useState<FormGrupo[]>([]);
  const [selectedFaixa, setSelectedFaixa] = useState<string>('');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('');
  const [nomePosicao, setNomePosicao] = useState('');
  const [tituloGrau, setTituloGrau] = useState('');
  const [grau, setGrau] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Estados para controlar o Modal de edição de vídeo
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Posicao | null>(null);
  const [modalVideoUrl, setModalVideoUrl] = useState('');

  const loadData = useCallback(async () => {
    if (!session) return;
    try {
      if (!refreshing) setLoading(true);
      const [bibliotecaData, adminData] = await Promise.all([
        api.getKataBiblioteca(session),
        api.getKataAdminData(session),
      ]);
      setBiblioteca(bibliotecaData);
      setFormFaixas(adminData.faixas);
      setFormGrupos(adminData.grupos);
      if (adminData.faixas.length > 0 && !selectedFaixa) setSelectedFaixa(String(adminData.faixas[0].id));
      if (adminData.grupos.length > 0 && !selectedGrupo) setSelectedGrupo(String(adminData.grupos[0].id));
      setError(null);
    } catch (err) {
      setError('Falha ao carregar os dados. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, refreshing, selectedFaixa, selectedGrupo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  useEffect(() => {
    if (refreshing) {
      loadData();
    }
  }, [refreshing, loadData]);
  
  // --- LÓGICA DE ATUALIZAÇÃO E EDIÇÃO DO VÍDEO (COM MODAL) ---

  const handleOpenVideoEditor = (posicao: Posicao) => {
    setEditingPosition(posicao);
    setModalVideoUrl(posicao.video_url || '');
    setIsModalVisible(true);
  };

  const handleSaveVideoUrl = async () => {
    if (!editingPosition) return;
    try {
      await api.updateKataPosicaoVideo(editingPosition.id, modalVideoUrl, session);
      Alert.alert('Sucesso!', 'O link do vídeo foi atualizado.');
      setIsModalVisible(false);
      setEditingPosition(null);
      handleRefresh();
    } catch (err) {
      Alert.alert('Erro', (err as Error).message || 'Não foi possível salvar o link.');
    }
  };

  const handleVideoAction = (posicao: Posicao) => {
    if (posicao.video_url) {
      Alert.alert(
        'Vídeo da Posição',
        'O que você gostaria de fazer?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Vídeo', onPress: () => Linking.openURL(posicao.video_url!).catch(() => Alert.alert('Erro', 'Não foi possível abrir o link.'))},
          { text: 'Editar Link', onPress: () => handleOpenVideoEditor(posicao) },
        ]
      );
    } else {
      Alert.alert(
        'Adicionar Vídeo',
        'Deseja adicionar um link de vídeo para esta posição?',
        [
          { text: 'Não', style: 'cancel' },
          { text: 'Sim, Adicionar', onPress: () => handleOpenVideoEditor(posicao) },
        ]
      );
    }
  };

  const handleAddPosicao = async () => {
    if (!selectedFaixa || !selectedGrupo || !nomePosicao) {
      Alert.alert('Erro', 'Faixa, Grupo e Nome da Posição são obrigatórios.');
      return;
    }
    const dadosPosicao = {
      faixa_id: selectedFaixa,
      grupo_id: selectedGrupo,
      nome_posicao: nomePosicao,
      grau: grau || 0,
      titulo_grau: tituloGrau,
      video_url: videoUrl,
    };
    try {
      await api.addKataPosicao(dadosPosicao, session);
      Alert.alert('Sucesso', 'Posição adicionada com sucesso!');
      setNomePosicao('');
      setTituloGrau('');
      setGrau('');
      setVideoUrl('');
      handleRefresh();
    } catch (err) {
      Alert.alert('Erro', (err as Error).message || 'Não foi possível adicionar a posição.');
    }
  };

  const handleDeletePosicao = (posicaoId: number) => {
    Alert.alert('Confirmar Exclusão', `Tem certeza que deseja deletar esta posição?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar', style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteKataPosicao(posicaoId, session);
              Alert.alert('Sucesso', 'Posição deletada!');
              handleRefresh();
            } catch (err) {
              Alert.alert('Erro', (err as Error).message);
            }
          },
        },
      ]
    );
  };
  
  const renderPosicoes = (grupos: Grupo[]) => {
    if (!grupos) return null;
    const ordemGrupos = ['Ataque', 'Defesa', 'Queda e/ou parte em pé', 'Postura/Comportamento/Educativo', 'Posições/Golpes', 'Defesa pessoal', 'Teoria'];
    const gruposOrdenados = [...grupos].sort((a, b) => {
        const indexA = ordemGrupos.indexOf(a.nome);
        const indexB = ordemGrupos.indexOf(b.nome);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
    return gruposOrdenados.map((grupo) => (
      <View key={grupo.id}>
        <Text style={styles.grupoTitle}>{grupo.nome}</Text>
        {grupo.posicoes.map((posicao) => (
          <PosicaoItem 
            key={posicao.id} 
            posicao={posicao} 
            onDelete={handleDeletePosicao}
            onVideoAction={handleVideoAction}
          />
        ))}
      </View>
    ));
  }

  const PosicaoItem = ({ posicao, onDelete, onVideoAction }: { posicao: Posicao, onDelete: (id: number) => void, onVideoAction: (posicao: Posicao) => void }) => (
    <View style={styles.posicaoItem}>
      <TouchableOpacity style={styles.posicaoClickableArea} onPress={() => onVideoAction(posicao)}>
        <Text style={styles.posicaoTexto}>{posicao.nome}</Text>
        <Ionicons 
          name={posicao.video_url ? "play-circle" : "add-circle-outline"} 
          size={24} 
          color={posicao.video_url ? "#007bff" : "#ccc"}
          style={styles.playIcon} 
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(posicao.id)} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>&times;</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }
  if (error) {
    return <View style={styles.centered}><Text>{error}</Text><Button title="Tentar Novamente" onPress={loadData} /></View>;
  }

  return (
    <LinearGradient colors={['#f9f100', '#252403ff', '#222']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{flex: 1}}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
            
            <Modal
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Editar Link do Vídeo</Text>
                        <Text style={styles.modalSubtitle}>Para: {editingPosition?.nome}</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Cole a URL do vídeo aqui"
                            placeholderTextColor="#999"
                            value={modalVideoUrl}
                            onChangeText={setModalVideoUrl}
                        />
                        <View style={styles.modalButtonRow}>
                            <Button title="Cancelar" onPress={() => setIsModalVisible(false)} color="#6c757d" />
                            <View style={{ width: 10 }} />
                            <Button title="Salvar" onPress={handleSaveVideoUrl} />
                        </View>
                    </View>
                </View>
            </Modal>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Adicionar Nova Posição</Text>
            <Picker selectedValue={selectedFaixa} onValueChange={(itemValue) => setSelectedFaixa(itemValue)} style={styles.picker}>
                <Picker.Item label="Selecione uma faixa..." value="" />
                {formFaixas.map((faixa) => ( <Picker.Item key={faixa.id} label={faixa.nome_faixa} value={String(faixa.id)} /> ))}
            </Picker>
            <Picker selectedValue={selectedGrupo} onValueChange={(itemValue) => setSelectedGrupo(itemValue)} style={styles.picker}>
               <Picker.Item label="Selecione um grupo..." value="" />
               {formGrupos.map((grupo) => ( <Picker.Item key={grupo.id} label={grupo.nome_grupo} value={String(grupo.id)} /> ))}
            </Picker>
            <TextInput style={styles.input} placeholder="Nome da Posição" placeholderTextColor="#888" value={nomePosicao} onChangeText={setNomePosicao} />
            <TextInput style={styles.input} placeholder="Grau (ex: 1, 2...)" placeholderTextColor="#888" value={grau} onChangeText={setGrau} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Título do Grau (opcional)" placeholderTextColor="#888" value={tituloGrau} onChangeText={setTituloGrau} />
            <TextInput style={styles.input} placeholder="URL do Vídeo (opcional)" placeholderTextColor="#888" value={videoUrl} onChangeText={setVideoUrl} />
            <Button title="Adicionar Posição" onPress={handleAddPosicao} />
          </View>
          
          <View style={styles.separator} />

          {biblioteca.map((categoria) => (
            <View key={categoria.id} style={styles.categoriaContainer}>
              <Text style={styles.categoriaTitle}>{categoria.nome}</Text>
              {categoria.faixas.map((faixa) => {
                const nomeCategoria = categoria.nome.toLowerCase();
                if (nomeCategoria.includes('infantil')) {
                    const faixasInfantisDesejadas = ['cinza', 'amarela', 'laranja', 'verde'];
                    if (!faixasInfantisDesejadas.includes(faixa.nome.toLowerCase())) return null;
                    const baseName = faixa.nome;
                    const subFaixaBranca = faixa.sub_faixas.find(sf => sf.nome.toLowerCase().includes('branca'));
                    const subFaixaPreta = faixa.sub_faixas.find(sf => sf.nome.toLowerCase().includes('preta'));
                    return (
                        <AcordeaoItem key={faixa.id} title={faixa.nome}>
                            {subFaixaBranca && ( <AcordeaoItem title={subFaixaBranca.nome}> {subFaixaBranca.graus.map(g => renderPosicoes(g.grupos))} </AcordeaoItem> )}
                            <AcordeaoItem title={`Toda ${baseName}`}> {faixa.graus.map(g => renderPosicoes(g.grupos))} </AcordeaoItem>
                            {subFaixaPreta && ( <AcordeaoItem title={subFaixaPreta.nome}> {subFaixaPreta.graus.map(g => renderPosicoes(g.grupos))} </AcordeaoItem> )}
                        </AcordeaoItem>
                    );
                }
                if (nomeCategoria.includes('adulto')) {
                    const faixasAdultoDesejadas = ['branca', 'azul', 'roxa', 'marrom'];
                    if (!faixasAdultoDesejadas.includes(faixa.nome.toLowerCase())) return null;
                    return (
                      <AcordeaoItem key={faixa.id} title={faixa.nome}>
                        {faixa.graus.sort((a,b) => a.grau - b.grau).map((grauItem) => (
                            <AcordeaoItem key={grauItem.grau} title={grauItem.titulo}>
                              {renderPosicoes(grauItem.grupos)}
                            </AcordeaoItem>
                        ))}
                      </AcordeaoItem>
                    );
                }
                return null;
              })}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  formContainer: { padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8, margin: 10, borderWidth: 1, borderColor: '#eee' },
  formTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  picker: { marginBottom: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, backgroundColor: '#fff', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, marginBottom: 10, backgroundColor: '#fff', color: '#333' },
  separator: { height: 2, backgroundColor: '#eee', marginVertical: 10 },
  categoriaContainer: { marginBottom: 20, paddingHorizontal: 10 },
  categoriaTitle: { fontSize: 22, fontWeight: 'bold', color: '#f2f21fff', marginBottom: 10, backgroundColor: '#333', alignSelf: 'flex-start', padding: 5, borderRadius: 5 },
  acordeaoContainer: { backgroundColor: '#fff', borderRadius: 5, marginBottom: 5, overflow: 'hidden', borderWidth: 1, borderColor: '#e7e7e7' },
  acordeaoHeader: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f7f7f7' },
  acordeaoTitle: { fontSize: 16, fontWeight: '600', color: '#333', flexShrink: 1 },
  acordeaoIcon: { fontSize: 18, fontWeight: 'bold' },
  acordeaoContent: { paddingLeft: 15, borderTopWidth: 1, borderTopColor: '#e7e7e7' },
  grupoTitle: { fontSize: 15, fontWeight: 'bold', color: '#555', marginTop: 10, marginBottom: 5, paddingHorizontal: 10, backgroundColor: '#f0f0f0', paddingVertical: 5 },
  posicaoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f0f0f0' },
  posicaoClickableArea: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  posicaoTexto: { fontSize: 14, flex: 1, color: '#333' },
  playIcon: { marginLeft: 10 },
  deleteButton: { backgroundColor: '#ff4d4d', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  deleteButtonText: { color: 'white', fontSize: 20, fontWeight: 'bold', lineHeight: 30 },
  // --- NOVOS ESTILOS PARA O MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

export default GerenciarKatasScreen;
