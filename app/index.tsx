import { Redirect } from 'expo-router';

export default function Index() {
  // Esta tela é o ponto de entrada da raiz do aplicativo (/).
  // Sua única função é redirecionar imediatamente para a tela de login.
  // A lógica no _layout.tsx cuidará do resto se o usuário já estiver logado.
  return <Redirect href="/(public)/login" />;
}