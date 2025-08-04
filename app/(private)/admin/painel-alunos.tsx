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
  const [termoDebounced, setTermoDebounced] = useState(''); // O termo que será usado na busca
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Função centralizada para carregar os alunos da API.
  const carregarAlunos = useCallback(async (page: number, busca: string) => {
    try {
      const data = await api.getAlunos(session, page, busca);
      setAlunos(data.alunos);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao buscar alunos.');
    }
  }, [session]);

  // Efeito 1: Aplica "debounce" ao termo de busca.
  useEffect(() => {
    const handler = setTimeout(() => {
      setTermoDebounced(termoBusca);
      setCurrentPage(1); // Sempre reseta para a página 1 ao fazer uma nova busca
    }, 500);
    return () => clearTimeout(handler);
  }, [termoBusca]);

  // Efeito 2: Busca os dados na API quando a página ou o termo (debounced) mudam.
  useEffect(() => {
    const fetchData = async () => {
      if (isRefreshing) return;

      setIsLoading(true);
      setError(null);
      await carregarAlunos(currentPage, termoDebounced);
      setIsLoading(false);
    };

    fetchData();
  }, [currentPage, termoDebounced, carregarAlunos, isRefreshing]);

  // Função para o "puxar para atualizar" (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setTermoBusca('');

    await carregarAlunos(1, '');

    if (currentPage !== 1) setCurrentPage(1);
    if (termoDebounced !== '') setTermoDebounced('');

    setIsRefreshing(false);
  }, [carregarAlunos, currentPage, termoDebounced]); // CORREÇÃO: Adicionadas as dependências

  // Handler para o botão "Tentar Novamente" em caso de erro
  const tentarNovamente = useCallback(() => {
    setError(null);
    setIsLoading(true);
    carregarAlunos(currentPage, termoDebounced).finally(() => setIsLoading(false));
  }, [carregarAlunos, currentPage, termoDebounced]);

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

  // Componente para renderizar cada item da lista
  const renderItem = ({ item }: { item: Aluno }) => (
    <Link href={{ pathname: "/(private)/admin/aluno/[id]", params: { id: item.id } }} asChild>
      <TouchableOpacity style={styles.itemContainer}>
        <View>
          <Text style={styles.itemNome}>{item.nome}</Text>
          <Text style={styles.itemEmail}>{item.email}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#ccc" />
      </TouchableOpacity>
    </Link>
  );

  // Componente para renderizar o rodapé com a paginação
  const renderFooter = () => {
    if (isLoading || !pagination || pagination.totalPages <= 1) return null;

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

  // Renderização condicional
  if (isLoading && !isRefreshing && alunos.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Carregando...</Text>
      </View>
    );
  }

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
          placeholderTextColor="#000"
          value={termoBusca}
          onChangeText={setTermoBusca}
          clearButtonMode="while-editing"
        />
      </View>

      {error && !isRefreshing ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Ocorreu um erro:</Text>
          <Text>{error}</Text>
          <Button title="Tentar Novamente" onPress={tentarNovamente} />
        </View>
      ) : (
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
            !isLoading && (
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
            )
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={['#007bff']}
              tintColor={'#007bff'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  searchInput: {
    height: 44,
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#000',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  itemNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemEmail: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f4f6f9',
  },
  centeredEmpty: {
    marginTop: 60,
    alignItems: 'center',
  },
  errorText: {
    color: '#d9534f',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 16,
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  linkText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  pageInfo: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
  },
});
