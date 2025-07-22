import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router'; // 1. Removemos a importação do 'useRouter'
import React from 'react';
import { BiometricSwitch } from '@/components/BiometricSwitch';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

// O componente SettingsRow continua o mesmo
type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress?: () => void;
  href?: string;
};

const SettingsRow: React.FC<SettingsRowProps> = ({ icon, text, onPress, href }) => {
  const content = (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#666" />
      <Text style={styles.rowText}>{text}</Text>
      <Ionicons name="chevron-forward" size={22} color="#ccc" />
    </TouchableOpacity>
  );

  if (href) {
    return <Link href={href as any} asChild>{content}</Link>;
  }

  return content;
};

export default function AlunoConfiguracoesScreen() {
  const { signOut, user } = useAuth();
  const router = useRouter();
  
  const handleEditProfile = () => {
    // Navega para a nova tela de edição de perfil
    router.push('/(private)/aluno/editar-perfil');
  };

  const handleChangePassword = () => {
    router.push('/(private)/aluno/alterar-senha');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeader}>
          <Ionicons name="person-circle" size={80} color="#007bff" />
          <Text style={styles.profileName}>{user?.nome || 'Usuário'}</Text>
          <Text style={styles.profileRole}>{user?.permissao}</Text>
        </View>

        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.section}>
          <SettingsRow icon="person-outline" text="Editar Perfil" onPress={handleEditProfile} />
          <SettingsRow icon="key-outline" text="Alterar Senha" onPress={handleChangePassword} />
          
        </View>

        <Text style={styles.sectionTitle}>Segurança</Text>
            <View style={styles.section}>
                <View style={styles.row}>
                    <BiometricSwitch email={user.email} senha={user.senha} />
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
  container: { paddingVertical: 20 },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
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
});
