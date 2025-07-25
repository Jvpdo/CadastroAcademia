// app/_layout.tsx
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useRef, useCallback } from 'react';
import { AppState, View } from 'react-native';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';

// Defina o tempo de inatividade em milissegundos (15 minutos)
const TEMPO_DE_INATIVIDADE_MS = 15 * 60 * 1000;

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { isLoading, session, user, signOut } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const colorScheme = useColorScheme();
    const timerId = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // --- LÓGICA DO TIMER DE INATIVIDADE ---
    const reiniciarTimer = useCallback(() => {
        if (timerId.current) clearTimeout(timerId.current);
        
        timerId.current = setTimeout(() => {
            // Se ainda houver uma sessão após o tempo limite, desloga o usuário.
            if (session) {
                console.log("Usuário deslogado por inatividade.");
                signOut();
            }
        }, TEMPO_DE_INATIVIDADE_MS);
    }, [session, signOut]);

    // Efeito para redirecionamento e controle do timer
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(private)';

        if (session && user) {
            // Se o usuário está logado, iniciamos/reiniciamos o cronômetro.
            reiniciarTimer();

            if (!inAuthGroup) {
                if (user.permissao === 'admin') {
                    router.replace('/(private)/admin/home');
                } else {
                    router.replace('/(private)/aluno/home');
                }
            }
        } else {
            // Se não há sessão, limpamos qualquer cronômetro.
            if (timerId.current) {
                clearTimeout(timerId.current);
            }
            if (inAuthGroup) {
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
            return false; // Permite que o toque continue para o componente filho
        }}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(public)" />
                    <Stack.Screen name="(private)" />
                    <Stack.Screen name="+not-found" />
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
