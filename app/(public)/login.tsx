// app/(public)/login.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform, Image, ScrollView
} from 'react-native';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

const CREDENTIALS_KEY = 'biometric_credentials';
const HAS_ASKED_KEY = 'has_asked_to_save_credentials';

export default function LoginScreen() {
    // A lógica interna do componente permanece a mesma
    const { signIn, session, enableBiometrics } = useAuth();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const biometricCalledRef = useRef(false);
    const [showPassword, setShowPassword] = useState(false);


    const performLogin = useCallback(async (loginEmail: string, loginPassword: string, isBiometricLogin: boolean = false) => {
        setIsLoading(true);
        try {
            const data = await api.login(loginEmail, loginPassword);
             console.log('[login.tsx] Resposta da API:', JSON.stringify(data, null, 2));
            if (data.token) {
                await signIn(data.token, isBiometricLogin ? undefined : loginPassword);
                console.log('[login.tsx] Chamou signIn do contexto.');
                return true;
            }
            throw new Error('Token não recebido da API');
        } catch (error: any) {
            console.error("--- ERRO DETALHADO NO performLogin ---");

    let errorMessage = 'Verifique suas credenciais ou a conexão com a internet.';

    if (error.response) {
        // O servidor respondeu com um status de erro (4xx, 5xx)
        console.error("Status do Erro:", error.response.status);
        console.error("Dados do Erro da API:", JSON.stringify(error.response.data, null, 2));
        
        // Tenta pegar uma mensagem de erro específica do seu backend
        const apiError = error.response.data.message || error.response.data.error;
        if (apiError) {
            errorMessage = apiError;
        }

    } else if (error.request) {
        // A requisição foi feita mas não houve resposta (servidor offline, sem internet)
        console.error("Erro de requisição: Nenhuma resposta do servidor.");
        errorMessage = "Não foi possível conectar ao servidor. Verifique sua internet e se o servidor está online.";
    } else {
        // Algum outro erro aconteceu ao montar a requisição
        console.error("Erro geral na configuração:", error.message);
        errorMessage = error.message;
    }
            Alert.alert('Falha no Login', errorMessage || 'Não foi possível fazer login.');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [signIn]);

    const handleBiometricAuth = useCallback(async () => {
        if (session || biometricCalledRef.current) return;
        biometricCalledRef.current = true;
        try {
            const savedCredentialsJSON = await SecureStore.getItemAsync(CREDENTIALS_KEY);
            if (!savedCredentialsJSON) {
                biometricCalledRef.current = false;
                return;
            }
            const biometricAuth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Login com Impressão Digital',
                cancelLabel: 'Usar Senha',
            });
            if (biometricAuth.success) {
                const { email: savedEmail, senha: savedPassword } = JSON.parse(savedCredentialsJSON);
                await performLogin(savedEmail, savedPassword, true);
            } else {
                biometricCalledRef.current = false;
            }
        } catch  {
            Alert.alert('Erro Biométrico', 'Não foi possível processar o login com digital.');
            biometricCalledRef.current = false;
        }
    }, [performLogin, session]);

    useEffect(() => {
        const checkBiometrics = async () => {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const supported = hasHardware && isEnrolled;
            setIsBiometricSupported(supported);
            const credentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
            if (supported && credentials && !session) {
                handleBiometricAuth();
            }
        };
        checkBiometrics();
    }, [handleBiometricAuth, session]);

    const handleLogin = async () => {
          console.log('--- Iniciando handleLogin ---');

        if (!email || !senha) {
            Alert.alert('Erro', 'Por favor, preencha o email e a senha.');
            return;
        }
        console.log('Definindo isLoading para TRUE');
  setIsLoading(true);
        const success = await performLogin(email, senha, false);
        if (success && isBiometricSupported) {
            const hasAsked = await SecureStore.getItemAsync(HAS_ASKED_KEY);
            if (!hasAsked) {
                Alert.alert('Login Rápido', 'Deseja usar sua impressão digital para entrar mais rápido da próxima vez?',
                    [
                        { text: 'Agora não', style: 'cancel' },
                        {
                            text: 'Sim, habilitar',
                            onPress: async () => {
                                const enabled = await enableBiometrics({ email, senha });
                                if (enabled) {
                                    Alert.alert('Sucesso!', 'Login por digital ativado.');
                                }
                            },
                        },
                    ]
                );
                await SecureStore.setItemAsync(HAS_ASKED_KEY, 'true');
            }
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
>
  <ScrollView
    contentContainerStyle={styles.scrollContainer}
    keyboardShouldPersistTaps="handled"
  >
                {/* --- SEÇÃO DO LOGO (TOPO) --- */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('@/assets/images/logo-com-nome.jpeg')}
                        style={styles.logo}
                    />
                </View>

                {/* --- SEÇÃO DO FORMULÁRIO (MEIO) --- */}
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Login</Text>
                    <View style={styles.form}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email:</Text>
                            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="seuemail@exemplo.com" placeholderTextColor="#999" editable={!isLoading}/>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Senha:</Text>
                            <TextInput style={styles.input} value={senha} onChangeText={setSenha} secureTextEntry={!showPassword} placeholder="********" placeholderTextColor="#999" editable={!isLoading} />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#999" />
                        </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={[styles.btn, isLoading && styles.btnDisabled]} onPress={handleLogin} disabled={isLoading}>
                            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
                        </TouchableOpacity>
                        {isBiometricSupported && (
                            <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
                                <Ionicons name="finger-print" size={32} color="#007bff" />
                                <Text style={styles.biometricText}>Usar Digital</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* --- SEÇÃO DO BANNER (INFERIOR) --- */}
                {/* Este container agora vai crescer para preencher o espaço e empurrar a imagem para baixo */}
                <View style={styles.bannerContainer}>
                    <Image
                        source={require('@/assets/images/banner-com-nome.png')}
                        style={styles.banner}
                    />
                </View>
               </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#121212' },
    keyboardView: {
        flex: 1,
        alignItems: 'center', // Alinha tudo no centro horizontalmente
        padding: 20, // Adiciona um padding geral
    },
    logoContainer: {
          marginTop: 10 // O logo fica no topo naturalmente
    },
    logo: {
        width: 200,
        height: 120,
        resizeMode: 'contain',
    },
    // O container do formulário agora tem margens verticais para dar espaço
    formContainer: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 16,
        width: '100%', // Ocupa a largura total (respeitando o padding do keyboardView)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
        alignItems: 'center',
        marginTop: 40, // Espaço abaixo do logo
        marginBottom: 20, // Espaço acima do banner
    },
    // --- MUDANÇA PRINCIPAL AQUI ---
    bannerContainer: {
        flex: 1, // Faz o container crescer e ocupar todo o espaço vertical restante
        width: '100%', // Ocupa toda a largura
        justifyContent: 'flex-end', // Empurra a imagem para o final (embaixo)
        alignItems: 'center', // Centraliza a imagem horizontalmente
    },
    banner: {
        width: '105%', // A imagem ocupa 100% da largura do seu container
        height: 210, // Altura fixa (ajuste conforme necessário)
        resizeMode: 'contain', // Garante que a imagem caiba sem distorcer
    },
    // Estilos do formulário (sem grandes mudanças)
    title: { fontSize: 30, fontWeight: 800, marginBottom: 30, color: '#333' },
    form: { width: '100%' },
    formGroup: { marginBottom: 15, width: '100%' },
    label: { marginBottom: 8, fontWeight: '600', color: '#555', fontSize: 16 },
    input: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        fontSize: 16,
        color: '#000',
    },
    btn: {
        width: '100%',
        padding: 15,
        backgroundColor: '#007bff',
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 3,
    },
    btnDisabled: { backgroundColor: '#cce0ff' },
    btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 25,
        padding: 10,
    },
    eyeIcon: {
        position: 'absolute',
        right: 15,
        top: 40,
    },

    biometricText: {
        color: '#007bff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },

});
