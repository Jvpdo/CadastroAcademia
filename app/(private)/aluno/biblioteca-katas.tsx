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
  Platform,
  UIManager,
  Linking, // Para abrir links de vídeo
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Habilita a animação LayoutAnimation no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Interfaces para os tipos de dados ---
interface Posicao { id: number; nome: string; video_url: string; }
interface Grau { grau: number; titulo: string; grupos: { id: number; nome: string; posicoes: Posicao[] }[]; }
interface Faixa { id: number; nome: string; graus: Grau[]; }
interface Categoria { id: number; nome: string; faixas: Faixa[]; }

// --- Componente Acordeão Reutilizável ---
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

export default function BibliotecaKatasScreen() {
  const { session } = useAuth();
  const [biblioteca, setBiblioteca] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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

  const handleOpenVideo = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o link do vídeo.'));
    } else {
      Alert.alert('Vídeo não disponível', 'Não há um link de vídeo para esta posição.');
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text><Button title="Tentar Novamente" onPress={fetchData} /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Biblioteca de Katas' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Biblioteca de Katas</Text>
        
        {biblioteca.map(categoria => (
          <View key={categoria.id}>
            <Text style={styles.categoriaTitle}>{categoria.nome}</Text>
            {categoria.faixas.map(faixa => (
              <View key={faixa.id} style={styles.faixaContainer}>
                <AccordionItem title={faixa.nome}>
                  {faixa.graus.map(g => (
                    <View key={g.grau} style={styles.grauContainer}>
                      <AccordionItem title={g.titulo || `Grau ${g.grau}`}>
                        {g.grupos.map(gr => (
                          <View key={gr.id}>
                            <Text style={styles.grupoTitle}>{gr.nome}</Text>
                            {gr.posicoes.map(p => (
                              <TouchableOpacity key={p.id} style={styles.posicaoItem} onPress={() => handleOpenVideo(p.video_url)}>
                                <Text style={styles.posicaoText}>{p.nome}</Text>
                                {p.video_url && (
                                  <Ionicons name="play-circle-outline" size={24} color="#007bff" />
                                )}
                              </TouchableOpacity>
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
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  categoriaTitle: { fontSize: 22, fontWeight: 'bold', color: '#007bff', marginTop: 10, borderBottomWidth: 2, borderBottomColor: '#007bff', paddingBottom: 5 },
  faixaContainer: { marginTop: 10 },
  grauContainer: { marginTop: 5 },
  grupoTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 5, marginLeft: 15, color: '#495057' },
  posicaoItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 6, 
    marginTop: 5, 
    marginLeft: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  posicaoText: { 
    flex: 1, 
    fontSize: 16,
    color: '#343a40',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    padding: 15,
    borderRadius: 5,
    marginBottom: 5,
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
  errorText: {
    color: 'red'
  }
});
