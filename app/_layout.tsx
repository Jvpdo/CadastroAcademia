// app/_layout.tsx
import { AuthProvider, useAuth } from '@/context/AuthContext';
// AJUSTE 1: Importar o tipo 'Theme' para usar com TypeScript
import { DarkTheme, DefaultTheme, ThemeProvider, Theme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useCallback } from 'react';
// AJUSTE 2: Usar o 'useColorScheme' padrão do React Native e centralizar imports
import { AppState, View, useColorScheme } from 'react-native';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lógica de inatividade (permanece a mesma)
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const LAST_ACTIVITY_TIMESTAMP_KEY = 'last-activity-timestamp';

// AJUSTE 3: DEFINIÇÃO DAS SUAS PALETAS DE CORES PERSONALIZADAS
// Aqui você pode ajustar qualquer cor para se adequar à identidade da sua marca.

const MyLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#005A9C',       // Azul para botões e ações principais
    background: '#F0F2F5',    // Fundo geral das telas (cinza muito claro)
    card: '#FFFFFF',          // Fundo de formulários, headers (branco)
    text: '#1C1C1E',          // Cor do texto principal (preto suave)
    border: '#D1D1D6',        // Cor de bordas e separadores (cinza claro)
    notification: '#FF3B30',
  },
};

const MyDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#1535d6ff',      
    background: '#121212',    // Fundo geral das telas (preto)
    card: '#1E1E1E',          // Fundo de formulários (cinza escuro, um tom acima do fundo)
    text: '#E5E5E7',          // Cor do texto principal (branco suave)
    border: '#38383A',        // Cor de bordas e separadores (cinza escuro)
    notification: '#FF453A',
  },
};


// Impede que a tela de splash se esconda automaticamente
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { isLoading, session, user, signOut } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    // Agora usando o hook padrão do React Native
    const colorScheme = useColorScheme();

    // TODA A SUA LÓGICA DE INATIVIDADE E REDIRECIONAMENTO ESTÁ MANTIDA AQUI
    const updateLastActivity = useCallback(async () => {
        if (session) {
            try {
                const now = Date.now().toString();
                await AsyncStorage.setItem(LAST_ACTIVITY_TIMESTAMP_KEY, now);
            } catch (e) {
                console.error("Falha ao salvar a hora da atividade.", e);
            }
        }
    }, [session]);

    useEffect(() => {
        console.log('[ROOT _layout.tsx] useEffect disparado. Estado:', { 
        isLoading, 
        session: !!session, 
        userNome: user?.nome, 
        userPermissao: user?.permissao 
    });
        const checkInactivity = async () => {
            if (!session) return;
            try {
                const lastActivityStr = await AsyncStorage.getItem(LAST_ACTIVITY_TIMESTAMP_KEY);
                if (lastActivityStr) {
                    const lastActivityTimestamp = parseInt(lastActivityStr, 10);
                    const now = Date.now();
                    if (now - lastActivityTimestamp > INACTIVITY_TIMEOUT_MS) {
                        console.log("Usuário deslogado por inatividade.");
                        signOut();
                    } else {
                        await updateLastActivity();
                    }
                } else {
                    await updateLastActivity();
                }
            } catch (e) {
                console.error("Falha ao verificar inatividade.", e);
            }
        };

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkInactivity();
            }
        });

        checkInactivity();

        if (!isLoading) {
            const inPrivateGroup = segments[0] === '(private)';
            if (session && user) {
                if (!inPrivateGroup) {
                    const targetRoute = user.permissao === 'admin' ? '/(private)/admin/home' : '/(private)/aluno/home';
                    router.replace(targetRoute);
                }
            } else {
                if (inPrivateGroup) {
                    router.replace('/(public)/login');
                }
            }
        }

        return () => {
            subscription.remove();
        };
    }, [isLoading, session, user, segments, router, signOut, updateLastActivity]);

    useEffect(() => {
        if (!isLoading) {
            SplashScreen.hideAsync();
        }
    }, [isLoading]);

    if (isLoading) {
        return null;
    }

    // O retorno do componente com a UI
    return (
        <View style={{ flex: 1 }} onStartShouldSetResponder={() => {
            updateLastActivity();
            return false;
        }}>
            {/* AJUSTE 4: USAR OS TEMAS PERSONALIZADOS NO PROVIDER */}
            <ThemeProvider value={colorScheme === 'dark' ? MyDarkTheme : MyLightTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(public)" />
                    <Stack.Screen name="(private)" />
                    <Stack.Screen name="+not-found" />
                </Stack>
            </ThemeProvider>
        </View>
    );
}

// Componente principal que envolve a aplicação com o provedor de autenticação e fontes.
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
