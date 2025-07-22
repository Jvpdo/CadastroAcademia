import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, Href } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Button, // 1. Importamos o componente Button
} from 'react-native';

// O componente DashboardButton continua o mesmo
interface DashboardButtonProps {
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  description: string;
}
const DashboardButton: React.FC<DashboardButtonProps> = ({ href, icon, text, description }) => (
  <Link href={href} asChild>
    <TouchableOpacity style={styles.button}>
      <Ionicons name={icon} size={32} color="#007bff" />
      <View style={styles.buttonTextContainer}>
        <Text style={styles.buttonTitle}>{text}</Text>
        <Text style={styles.buttonDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  </Link>
);

export default function AdminHomeScreen() {
  // 2. Pegamos a função 'signOut' do nosso contexto de autenticação
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 3. O cabeçalho agora contém o título e o botão de logout */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Olá, {user?.nome || 'Admin'}!</Text>
            <Text style={styles.headerSubtitle}>Bem-vindo ao seu painel.</Text>
          </View>
          <Button title="Sair" onPress={signOut} color="#dc3545" />
        </View>

        <View style={styles.menuGrid}>
          <DashboardButton
            href="/(private)/admin/painel-alunos"
            icon="people-outline"
            text="Alunos"
            description="Gerencie seus alunos"
          />
          <DashboardButton
            href="/(private)/admin/cadastro"
            icon="person-add-outline"
            text="Cadastrar"
            description="Adicione um novo aluno"
          />
          <DashboardButton
            href="/(private)/admin/gerenciar-horarios"
            icon="time-outline"
            text="Horários"
            description="Edite a grade de aulas"
          />
          <DashboardButton
            href="/(private)/admin/gerenciar-katas"
            icon="book-outline"
            text="Katas"
            description="Gerencie a biblioteca"
          />
          <DashboardButton
            href="/(private)/admin/lista-presenca"
            icon="checkbox-outline"
            text="Presença"
            description="Veja os check-ins do dia"
          />
          <DashboardButton
            href="/(private)/admin/configuracoes"
            icon="settings-outline"
            text="Configurações"
            description="Ajustes de conta e perfil"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  container: { padding: 20 },
  // 4. Estilos do cabeçalho atualizados para alinhar os itens
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D3D47',
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#6c757d',
  },
  menuGrid: {},
  button: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
});
