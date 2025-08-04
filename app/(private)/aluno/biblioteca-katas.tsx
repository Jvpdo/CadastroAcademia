// app/(private)/aluno/biblioteca-katas.tsx (VERSÃO FINAL COM ESTILOS UNIFICADOS)

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
  LayoutAnimation, 
  Linking,
} from 'react-native'; 
import { Ionicons } from '@expo/vector-icons'; 
import { LinearGradient } from 'expo-linear-gradient';

// --- Interfaces de Dados (sem alterações) ---
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
  nome: string;
  faixa_pai_id: number | null;
  graus: Grau[];
  sub_faixas: Faixa[];
}
interface Categoria {
  id: number;
  nome: string;
  faixas: Faixa[];
}

// --- Componente Acordeão (usando seu componente com LayoutAnimation) --- 
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
    <View style={styles.acordeaoContainer}> 
      <TouchableOpacity onPress={toggleExpand} style={styles.accordionHeader}> 
        <Text style={styles.accordionTitle}>{title}</Text> 
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={22} color="#555" /> 
      </TouchableOpacity> 
      {expanded && <View style={styles.accordionContent}>{children}</View>} 
    </View> 
  ); 
}; 

export default function BibliotecaKatasScreen() { 
  const { session } = useAuth(); 
  const [biblioteca, setBiblioteca] = useState<Categoria[]>([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null); 

  const fetchData = useCallback(async () => { 
    if (!session) return;
    try { 
      setIsLoading(true); 
      setError(null); 
      const bibliotecaData = await api.getKataBiblioteca(session); 
      setBiblioteca(bibliotecaData); 
    } catch (err: any) { 
      setError(err.message || 'Não foi possível carregar a biblioteca.'); 
    } finally { 
      setIsLoading(false); 
    } 
  }, [session]); 

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]); 

  const handleOpenVideo = (url: string | undefined) => { 
    if (url) { 
      Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o link do vídeo.')); 
    } else { 
      Alert.alert('Vídeo não disponível', 'Não há um link de vídeo para esta posição.'); 
    } 
  }; 

  const renderPosicoes = (grupos: Grupo[]) => {
    if (!grupos) return null;

    // Define a ordem de exibição desejada para os grupos da categoria infantil.
    const ordemGrupos = [
	      'Ataque',
	      'Defesa',
	      'Queda e/ou parte em pé',
        'Postura/Comportamento/Educativo',
        'Posições/Golpes',
        'Defesa pessoal',
        'Teoria'
    ];

    // Cria uma cópia e ordena o array de grupos com base na lista de ordem.
    const gruposOrdenados = [...grupos].sort((a, b) => {
        const indexA = ordemGrupos.indexOf(a.nome);
        const indexB = ordemGrupos.indexOf(b.nome);

        // Mantém a ordem original para grupos que não estão na lista de ordenação.
        if (indexA === -1 && indexB === -1) return 0;
        // Coloca grupos não listados no final.
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        // Ordena com base na posição na lista `ordemGrupos`.
        return indexA - indexB;
    });

    // Renderiza a lista de grupos já ordenada.
    return gruposOrdenados.map((gr) => (
      <View key={gr.id}>
        <Text style={styles.grupoTitle}>{gr.nome}</Text>
        {gr.posicoes.map(p => (
          <TouchableOpacity key={p.id} style={styles.posicaoItem} onPress={() => handleOpenVideo(p.video_url)}>
            <Text style={styles.posicaoText}>{p.nome}</Text>
            {p.video_url && (
              <Ionicons name="play-circle" size={24} color="#007bff" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    ));
  };

  if (isLoading) { 
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007bff" /></View>; 
  } 

  if (error) { 
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text><Button title="Tentar Novamente" onPress={fetchData} /></View>; 
  } 

  return ( 
    <LinearGradient
                    colors={['#f9f100', '#252403ff', '#222']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{flex: 1}}
                  >
    <SafeAreaView style={styles.safeArea}> 
      <Stack.Screen options={{ title: 'Biblioteca de Katas' }} /> 
      <ScrollView contentContainerStyle={styles.container}> 
        
        {biblioteca.map(categoria => (
            <View key={categoria.id} style={styles.categoriaContainer}>
                <Text style={styles.categoriaTitle}>{categoria.nome}</Text>
                {categoria.faixas.map(faixa => {
                    const nomeCategoria = categoria.nome.toLowerCase();

                    if (nomeCategoria.includes('infantil')) {
                        const faixasInfantisDesejadas = ['cinza', 'amarela', 'laranja', 'verde'];
                        if (!faixasInfantisDesejadas.includes(faixa.nome.toLowerCase())) return null;

                        const baseName = faixa.nome;
                        const subFaixaBranca = faixa.sub_faixas.find(sf => sf.nome.toLowerCase().includes('branca'));
                        const subFaixaPreta = faixa.sub_faixas.find(sf => sf.nome.toLowerCase().includes('preta'));
                        
                        return (
                            <AccordionItem key={faixa.id} title={faixa.nome}>
                                {subFaixaBranca && (
                                    <AccordionItem title={subFaixaBranca.nome}>
                                        {subFaixaBranca.graus.map(g => renderPosicoes(g.grupos))}
                                    </AccordionItem>
                                )}
                                <AccordionItem title={`Toda ${baseName}`}>
                                   {faixa.graus.map(g => renderPosicoes(g.grupos))}
                                </AccordionItem>
                                {subFaixaPreta && (
                                    <AccordionItem title={subFaixaPreta.nome}>
                                        {subFaixaPreta.graus.map(g => renderPosicoes(g.grupos))}
                                    </AccordionItem>
                                )}
                            </AccordionItem>
                        );
                    }
                    
                    if (nomeCategoria.includes('adulto')) {
                        const faixasAdultoDesejadas = ['branca', 'azul', 'roxa', 'marrom'];
                        if (!faixasAdultoDesejadas.includes(faixa.nome.toLowerCase())) return null;

                        return (
                            <AccordionItem key={faixa.id} title={faixa.nome}>
                                {faixa.graus
                                    .sort((a,b) => a.grau - b.grau)
                                    .map((grauItem) => (
                                        <AccordionItem key={grauItem.grau} title={grauItem.titulo}>
                                            {renderPosicoes(grauItem.grupos)}
                                        </AccordionItem>
                                ))}
                            </AccordionItem>
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
} 

// ESTILOS SUBSTITUÍDOS (baseados nos da tela Gerenciar Katas)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
     // Fundo geral da tela
  },
  container: {
    paddingBottom: 40, 
    paddingHorizontal: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  categoriaContainer: {
    marginBottom: 20,
  },
  categoriaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f2f21fff',
    marginBottom: 5,
    paddingLeft: 5,
    backgroundColor: '#333',
    alignSelf: 'flex-start',
  },
  acordeaoContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e7e7e7'
  },
  accordionHeader: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  accordionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    flex: 1,
  },
  accordionContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#e7e7e7',
  },
  grupoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  posicaoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  posicaoText: {
    fontSize: 15,
    flex: 1,
    color: '#333',
  },
  errorText: { 
    color: 'red',
    fontSize: 16,
    textAlign: 'center'
  },
  // Mantive o estilo do seu accordion item original
  faixaContainer: {
    marginBottom: 5,
  },
});