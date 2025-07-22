import { useAuth } from '@/context/AuthContext';
import { Redirect, Slot } from 'expo-router';
import { View } from 'react-native';

export default function PrivateGatekeeperLayout() {
  const { session, isLoading } = useAuth();

  // Enquanto o status da sessão está sendo verificado, não mostramos nada.
  if (isLoading) {
    return <View />;
  }

  // Se, após a verificação, não houver sessão,
  // este é um caso de segurança que manda o usuário de volta para o login.
  if (!session) {
    return <Redirect href="/(public)/login" />;
  }

  // Se há uma sessão, o <Slot /> renderiza o layout filho apropriado
  // (seja o (admin)/_layout.tsx ou o (aluno)/_layout.tsx).
  // A decisão de qual "home" carregar já foi tomada pelo layout raiz.
  return <Slot />;
}
