// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';


const TOKEN_KEY = 'auth-token';
const CREDENTIALS_KEY = 'biometric_credentials';

interface User {
    id: number;
    nome: string;
    email: string;
    permissao: 'admin' | 'aluno';
}

interface AuthContextType {
    signIn: (token: string, senha?: string) => Promise<void>;
    signOut: () => void;
    session: string | null;
    isLoading: boolean;
    user: User | null;
    // --- CORREÇÃO APLICADA AQUI ---
    // A função agora pode receber as credenciais como um argumento opcional.
    enableBiometrics: (credentials?: { email: string; senha: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const value = useContext(AuthContext);
    if (!value) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return value;
}

export function AuthProvider(props: any) {
    const [session, setSession] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tempCredentials, setTempCredentials] = useState<{ email: string, senha: string } | null>(null);

    useEffect(() => {
        const loadToken = async () => {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            if (token) {
                try {
                    const decoded: User = jwtDecode(token);
                    setUser(decoded);
                    setSession(token);

                } catch (e) {
                    console.error("Falha ao decodificar o token", e);
                    await signOut();
                }
            }
            setIsLoading(false);
        };
        loadToken();
    }, []);

    const signIn = async (token: string, senha?: string) => {
    console.log('[AuthContext.tsx] signIn iniciado com token:', token);
    try {
        // 1. Decodifique o token PRIMEIRO
        const decoded: User = jwtDecode(token);
        console.log('[AuthContext.tsx] Token decodificado com sucesso:', decoded);

        // 2. Atualize os estados em sequência
        setUser(decoded);
        setSession(token);

        // 3. Salve tudo de forma assíncrona
        await SecureStore.setItemAsync(TOKEN_KEY, token);

        if (senha && decoded.email) {
            setTempCredentials({ email: decoded.email, senha });
        } else {
            setTempCredentials(null);
        }
    } catch (e) {
        console.error("[AuthContext.tsx] ERRO CRÍTICO AO DECODIFICAR TOKEN:", e);
        // Em caso de erro, deslogue para garantir um estado limpo
        await signOut(); 
    }
};

    const signOut = async () => {
        setSession(null);
        setUser(null);
        setTempCredentials(null);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await AsyncStorage.removeItem('last-activity-timestamp'); 
    };

    const enableBiometrics = async (credentials?: { email: string; senha: string }): Promise<boolean> => {
        // Prioriza as credenciais passadas diretamente (da tela de login).
        // Se nenhuma for passada, usa as credenciais temporárias (da tela de configurações).
        const credsToSave = credentials || tempCredentials;

        if (!credsToSave || !credsToSave.email || !credsToSave.senha) {
            Alert.alert(
                "Ação Necessária",
                "Para ativar a biometria, por favor, saia e faça o login novamente usando seu email e senha.",
                [{ text: "Entendi" }]
            );
            return false;
        }
        try {
            await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credsToSave));
            return true;
        } catch {
            Alert.alert('Erro', 'Não foi possível salvar as credenciais para biometria.');
            return false;
        }
    };

    const value = {
        signIn,
        signOut,
        session,
        isLoading,
        user,
        enableBiometrics,
    };

    return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}
