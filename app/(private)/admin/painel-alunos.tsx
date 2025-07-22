import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Link } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  View,
  Text,
  Button,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  RefreshControl,
} from 'react-native';

// Tipos para nossos dados
interface Aluno {
  id: number;
  nome: string;
  email: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export default function HomeScreen() {
  const { signOut, session } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [termoBusca, setTermoBusca] = useState(''); // O que o usuário digita
  const [termoDebounced, setTermoDebounced] = useState(''); // O termo que será usado na busca, após a pausa
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Função para carregar os alunos da API
  const carregarAlunos = useCallback(async (page: number, busca: string) => {
    if (!isRefreshing) {
    // Mostra o loading principal apenas na primeira carga
    if (page === 1 && busca === '') setIsLoading(true);
    }
    setError(null);
    try {
      const data = await api.getAlunos(session, page, busca);
      setAlunos(data.alunos);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      // Garante que o loading pare apenas na primeira carga
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session, isRefreshing]);

  // Efeito 1: Atualiza o termoDebounced 500ms após o usuário parar de digitar
  useEffect(() => {
    const handler = setTimeout(() => {
      setTermoDebounced(termoBusca);
    }, 500);
    return () => clearTimeout(handler);
  }, [termoBusca]);

  // Efeito 2: Busca os dados na API sempre que a PÁGINA ou o TERMO DEBOUNCED mudam
  useEffect(() => {
    // Quando uma nova busca é finalizada (termoDebounced muda), voltamos para a página 1
    if (termoBusca !== termoDebounced) {
      if (currentPage !== 1) {
        setCurrentPage(1);
        return; // A mudança de página vai acionar este efeito novamente
      }
    }
    carregarAlunos(currentPage, termoDebounced);
  }, [currentPage, termoDebounced, termoBusca, carregarAlunos]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTermoBusca(''); 
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      carregarAlunos(1, '');
    }
  }, [currentPage, carregarAlunos]);

  // Funções para os botões de paginação
  const irParaPaginaAnterior = () => {
    if (pagination && pagination.currentPage > 1) {
      setCurrentPage((pagina) => pagina - 1);
    }
  };
  const irParaProximaPagina = () => {
    if (pagination && pagination.currentPage < pagination.totalPages) {
      setCurrentPage((pagina) => pagina + 1);
    }
  };

  // Componente para renderizar cada item da lista (com link)
  const renderItem = ({ item }: { item: Aluno }) => (
    // O <Link> envolve todo o item clicável
        <Link href={{pathname: "/(private)/admin/aluno/[id]", params: { id: item.id }}}asChild>
        <TouchableOpacity style={styles.itemContainer}>
        <View>
          <Text style={styles.itemNome}>{item.nome}</Text>
          <Text style={styles.itemEmail}>{item.email}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#ccc" />
      </TouchableOpacity>
    </Link>
  );

  // Componente para renderizar o rodapé com os botões de paginação
  const renderFooter = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <Button title="« Anterior" onPress={irParaPaginaAnterior} disabled={pagination.currentPage === 1} />
        <Text style={styles.pageInfo}>
          Página {pagination.currentPage} de {pagination.totalPages}
        </Text>
        <Button title="Próxima »" onPress={irParaProximaPagina} disabled={pagination.currentPage === pagination.totalPages} />
      </View>
    );
  };

  // Renderização condicional para loading e erro
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Carregando...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Erro ao carregar alunos:</Text>
        <Text>{error}</Text>
        <Button title="Tentar Novamente" onPress={() => carregarAlunos(1, termoBusca)} />
      </View>
    );
  }

  // Renderização principal da tela
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Painel de Alunos</Text>
        <Button title="Sair" onPress={signOut} color="#ff3b30" />
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar aluno por nome..."
          value={termoBusca}
          onChangeText={setTermoBusca}
        />
      </View>
      
      <FlatList
        data={alunos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
          <Text style={styles.listHeader}>Alunos Cadastrados ({pagination?.totalItems || 0})</Text>
        )}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => (
          <View style={styles.centeredEmpty}>
            <Text>Nenhum aluno encontrado.</Text>
            {termoBusca === '' && (
              <Link href="/(private)/admin/cadastro" asChild>
                <TouchableOpacity style={styles.linkButton}>
                  <Text style={styles.linkText}>Cadastrar o primeiro aluno</Text>
                </TouchableOpacity>
              </Link>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#007bff']} tintColor={'#007bff'} />
        }
      />
    </SafeAreaView>
  );
}

// Adicionamos novos estilos para a busca
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 20,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  itemNome: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemEmail: {
    fontSize: 14,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centeredEmpty: {
    marginTop: 50,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  linkButton: {
    marginTop: 15,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  linkText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  paginationContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 20 
  },
  pageInfo: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});