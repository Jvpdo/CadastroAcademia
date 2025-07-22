import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'; 
import React, { useEffect, useRef, useCallback } from 'react'; // Importamos o useRef
import { AppState, View } from 'react-native'; // Importamos AppState e View
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';

// Defina o tempo de inatividade em milissegundos
// Exemplo: 15 minutos = 15 * 60 * 1000
const TEMPO_DE_INATIVIDADE_MS = 15 * 60 * 1000;

// Garante que a tela de splash não desapareça sozinha
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading, session, user, signOut } = useAuth(); // Pegamos a função signOut
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments(); 
  const timerId = useRef<any>(null);

  // Função para reiniciar o cronômetro de inatividade
  const reiniciarTimer = useCallback(() => {
  if (timerId.current) clearTimeout(timerId.current);
  timerId.current = setTimeout(() => {
    if (session) {
      signOut();
    }
  }, TEMPO_DE_INATIVIDADE_MS);
}, [session, signOut]);


  // Efeito principal para redirecionamento E controle do timer
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(private)';

    if (session) {
      // Se o usuário está logado, iniciamos o cronômetro de inatividade
      reiniciarTimer();

      if (!inAuthGroup) {
        // E se ele estiver fora da área privada, o redirecionamos para a home correta
        if (user?.permissao === 'admin') {
          router.replace('/(private)/admin/home');
        } else {
          router.replace('/(private)/aluno/home');
        }
      }
    } else {
      // Se não há sessão, limpamos qualquer cronômetro existente
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
      if (inAuthGroup) {
        // E se ele estiver em uma área privada, o mandamos para o login
        router.replace('/(public)/login');
      }
    }

    // Limpeza ao desmontar o componente
    return () => {
      if (timerId.current) clearTimeout(timerId.current);
    };
  }, [isLoading, session, user, segments, router, reiniciarTimer]);

  // Efeito para gerenciar o estado do aplicativo (ativo, background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && session) {
        reiniciarTimer(); // Reinicia o timer quando o app volta a ficar ativo
      } else {
        if (timerId.current) clearTimeout(timerId.current); // Pausa o timer se o app for para o background
      }
    });

    return () => {
      subscription.remove();
    };
  }, [reiniciarTimer, session]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }
 
  return (
    // Este <View> age como um "detector de toques" global para reiniciar o timer
    <View style={{ flex: 1 }} onStartShouldSetResponder={() => {
      if (session) {
        reiniciarTimer();
      }
      return false; // Permite que o toque continue para o componente filho (botão, etc.)
    }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(public)" />
          <Stack.Screen name="(private)" />
        </Stack>
      </ThemeProvider>
    </View>
  );
}


// O componente principal que envolve tudo
export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }
 
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
