// app/(private)/admin/gerenciar-katas.tsx (VERSÃO CORRIGIDA E TIPADA)

import React, { useState, useEffect, useCallback } from 'react'; // CORREÇÃO: Adicionado useCallback
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
// CORREÇÃO: Usando alias de caminho. Verifique se o seu projeto usa '@' ou ajuste o caminho relativo.
import { api } from '@/services/api'; 
import { useAuth } from '@/context/AuthContext';

// --- INTERFACES DE TIPO (Solução para erros de 'any' e 'never') ---
interface Posicao {
  id: number;
  nome: string;
  video_url?: string;
}

interface Grupo {
  id: number;
  nome: string;
  posicoes: Posicao[];
}

interface Grau {
  grau: number;
  titulo: string;
  grupos: Grupo[];
}

interface Faixa {
  id: number;
  nome: string; // Nome da faixa principal ou sub-faixa
  nome_faixa?: string; // Nome usado no formulário
  faixa_pai_id: number | null;
  graus: Grau[];
  sub_faixas: Faixa[];
}

interface Categoria {
  id: number;
  nome: string;
  faixas: Faixa[];
}

interface FormFaixa {
    id: number;
    nome_faixa: string;
}

interface FormGrupo {
    id: number;
    nome_grupo: string;
}

// --- Componentes Tipados ---
const PosicaoItem = ({ posicao, onDelete }: { posicao: Posicao, onDelete: (id: number) => void }) => (
  <View style={styles.posicaoItem}>
    <Text style={styles.posicaoTexto}>{posicao.nome}</Text>
    <TouchableOpacity onPress={() => onDelete(posicao.id)} style={styles.deleteButton}>
      <Text style={styles.deleteButtonText}>&times;</Text>
    </TouchableOpacity>
  </View>
);

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

const GerenciarKatasScreen = () => {
  const { session  } = useAuth();

  // CORREÇÃO: Estados tipados
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


  // CORREÇÃO: Usando useCallback para a função de carregamento
  const loadData = useCallback(async () => {
    if (!session ) return;
    try {
      setLoading(true);
      const [bibliotecaData, adminData] = await Promise.all([
        api.getKataBiblioteca(session ),
        api.getKataAdminData(session ),
      ]);
      setBiblioteca(bibliotecaData);
      setFormFaixas(adminData.faixas);
      setFormGrupos(adminData.grupos);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar os dados. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [session ]);

  // CORREÇÃO: Adicionando 'loadData' como dependência do useEffect
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
  try {
    setRefreshing(true);
    await loadData();
  } finally {
    setRefreshing(false);
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
      await api.addKataPosicao(dadosPosicao, session );
      Alert.alert('Sucesso', 'Posição adicionada com sucesso!');
      
      setSelectedFaixa('');
      setSelectedGrupo('');
      setNomePosicao('');
      setTituloGrau('');
      setGrau('');
      setVideoUrl('');
      loadData();
    } catch (err) {
      Alert.alert('Erro', (err as Error).message || 'Não foi possível adicionar a posição.');
      console.error(err);
    }
  };

  const handleDeletePosicao = (posicaoId: number) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar a posição ID ${posicaoId}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteKataPosicao(posicaoId, session );
              Alert.alert('Sucesso', 'Posição deletada com sucesso!');
              loadData();
            } catch (err) {
              Alert.alert('Erro', (err as Error).message || 'Não foi possível deletar a posição.');
              console.error(err);
            }
          },
        },
      ]
    );
  };
  
  // CORREÇÃO: Função tipada
  const renderPosicoes = (grupos: Grupo[]) => {
    if (!grupos) return null;
    return grupos.map((grupo) => (
      <View key={grupo.id}>
        <Text style={styles.grupoTitle}>{grupo.nome}</Text>
        {grupo.posicoes.map((posicao) => (
          <PosicaoItem key={posicao.id} posicao={posicao} onDelete={handleDeletePosicao} />
        ))}
      </View>
    ));
  }

  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
        <Button title="Tentar Novamente" onPress={loadData} />
      </View>
    );
  }

  return (
        <SafeAreaView style={styles.safeArea}>
  <ScrollView
    style={styles.container}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        colors={['#2196F3']} // Android
        tintColor="#2196F3" // iOS
      />
    }
  >

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Adicionar Nova Posição</Text>
        <Picker selectedValue={selectedFaixa} onValueChange={(itemValue) => setSelectedFaixa(itemValue)} style={styles.picker}>
            <Picker.Item label="Selecione uma faixa..." value="" />
            {formFaixas.map((faixa) => (
              <Picker.Item key={faixa.id} label={faixa.nome_faixa} value={String(faixa.id)} />
            ))}
        </Picker>
        <Picker selectedValue={selectedGrupo} onValueChange={(itemValue) => setSelectedGrupo(itemValue)} style={styles.picker}>
           <Picker.Item label="Selecione um grupo..." value="" />
           {formGrupos.map((grupo) => (
             <Picker.Item key={grupo.id} label={grupo.nome_grupo} value={String(grupo.id)} />
           ))}
        </Picker>
        <TextInput style={styles.input} placeholder="Nome da Posição" value={nomePosicao} onChangeText={setNomePosicao} />
        <TextInput style={styles.input} placeholder="Grau (ex: 1, 2...)" value={grau} onChangeText={setGrau} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Título do Grau (opcional)" value={tituloGrau} onChangeText={setTituloGrau} />
        <TextInput style={styles.input} placeholder="URL do Vídeo (opcional)" value={videoUrl} onChangeText={setVideoUrl} />
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
                        {subFaixaBranca && (
                          <AcordeaoItem title={subFaixaBranca.nome}>
                            {subFaixaBranca.graus.map(g => renderPosicoes(g.grupos))}
                          </AcordeaoItem>
                        )}
                        <AcordeaoItem title={`Toda ${baseName}`}>
                           {faixa.graus.map(g => renderPosicoes(g.grupos))}
                        </AcordeaoItem>
                        {subFaixaPreta && (
                          <AcordeaoItem title={subFaixaPreta.nome}>
                            {subFaixaPreta.graus.map(g => renderPosicoes(g.grupos))}
                          </AcordeaoItem>
                        )}
                    </AcordeaoItem>
                );
            }
            
            if (nomeCategoria.includes('adulto')) {
                const faixasAdultoDesejadas = ['branca', 'azul', 'roxa', 'marrom'];
                if (!faixasAdultoDesejadas.includes(faixa.nome.toLowerCase())) return null;

                return (
                  <AcordeaoItem key={faixa.id} title={faixa.nome}>
                    {faixa.graus
                      .sort((a,b) => a.grau - b.grau)
                      .map((grauItem) => (
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

  );
};

// ... (os estilos permanecem os mesmos)
const styles = StyleSheet.create({
  safeArea: {
        flex: 1,
        backgroundColor: '#000000ff' 
    },

  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    margin: 10,
    borderWidth: 1,
    borderColor: '#eee'
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  picker: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  separator: {
    height: 2,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  categoriaContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  categoriaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f2f21fff',
    marginBottom: 10,
  },
  acordeaoContainer: {
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e7e7e7'
  },
  acordeaoHeader: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  acordeaoTitle: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1, // Permite que o texto quebre a linha se necessário
  },
  acordeaoIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  acordeaoContent: {
    paddingLeft: 15,
    borderTopWidth: 1,
    borderTopColor: '#e7e7e7',
  },
  grupoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0',
    paddingVertical: 5,
  },
  posicaoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  posicaoTexto: {
    fontSize: 14,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 30
  }
});

export default GerenciarKatasScreen;