import { useAuth } from '@/context/AuthContext';
import { api, BASE_URL } from '@/services/api'; // 1. Importamos a api e a BASE_URL
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { BiometricSwitch } from '@/components/BiometricSwitch';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Button, // Importamos o Button para o erro
} from 'react-native';
import { Image } from 'expo-image'; // Importamos o componente de Imagem

// Interface para os dados do usuário
interface UserData {
    email: string;
    nome: string;
    permissao: string;
    foto_path: string | null;
}

// O componente SettingsRow continua o mesmo
type SettingsRowProps = { icon: keyof typeof Ionicons.glyphMap; text: string; onPress: () => void; };
const SettingsRow: React.FC<SettingsRowProps> = ({ icon, text, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <Ionicons name={icon} size={22} color="#666" />
    <Text style={styles.rowText}>{text}</Text>
    <Ionicons name="chevron-forward" size={22} color="#ccc" />
  </TouchableOpacity>
);

export default function ConfiguracoesScreen() {
  const { signOut, user, session } = useAuth(); // Pegamos também a 'session' para a API
  const router = useRouter();
  
  // 2. Novos estados para controlar os dados, loading e refresh
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. Função para buscar os dados do usuário
  const fetchUserData = useCallback(async () => {
    if(!isRefreshing) setIsLoading(true);
    setError(null);
    try {
        const data = await api.getMeusDados(session);
        setUserData(data);
    } catch (err: any) {
        setError(err.message || 'Não foi possível carregar os dados.');
    } finally {
        setIsLoading(false);
        setIsRefreshing(false);
    }
  }, [session, isRefreshing]);

  // Busca os dados quando a tela é carregada
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchUserData();
  }, [fetchUserData]);

  const handleEditProfile = () => {
    router.push('/(private)/admin/editar-perfil');
  };

  const handleChangePassword = () => {
    router.push('/(private)/admin/alterar-senha');
  };

  // Renderização condicional
  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>
  }

  if (error) {
    return (
        <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Tentar Novamente" onPress={fetchUserData} />
        </View>
    );
  }

  const fotoUrl = userData?.foto_path ? `${BASE_URL}/${userData.foto_path.replace(/\\/g, '/')}` : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileHeader}>
          {/* 4. Exibimos a foto real ou um placeholder */}
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle" size={80} color="#007bff" />
          )}
          <Text style={styles.profileName}>{userData?.nome || user?.nome || 'Usuário'}</Text>
          <Text style={styles.profileRole}>{userData?.permissao || user?.permissao}</Text>
        </View>

        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.section}>
          <SettingsRow icon="person-outline" text="Editar Perfil" onPress={handleEditProfile} />
          <SettingsRow icon="key-outline" text="Alterar Senha" onPress={handleChangePassword} />
        </View>

        <Text style={styles.sectionTitle}>Segurança</Text>
            <View style={styles.section}>
                <View style={styles.row}>
                    <BiometricSwitch email={user?.email} senha={user?.senha} />
                </View>
            </View>
              
        <View style={styles.section}>
          <SettingsRow icon="log-out-outline" text="Sair" onPress={signOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { paddingVertical: 20, flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center'},
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  profileImage: { // Novo estilo para a imagem de perfil
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  profileRole: {
    fontSize: 16,
    color: '#6c757d',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6c757d',
    marginHorizontal: 25,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});
