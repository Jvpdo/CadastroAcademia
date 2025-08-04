// components/BiometricSwitch.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    Switch, 
    StyleSheet, 
    Alert, 
    Platform, 
    Modal, 
    TextInput, 
    TouchableOpacity,
    ActivityIndicator // <-- ERRO CORRIGIDO: Importação adicionada
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

const CREDENTIALS_KEY = 'biometric_credentials';

export const BiometricSwitch: React.FC<{ email: string; }> = ({ email }) => {
    const { session } = useAuth();
    const [isSwitchEnabled, setIsSwitchEnabled] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalVisible, setModalVisible] = useState(false);
    const [password, setPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const checkBiometricStatus = useCallback(async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const savedCredentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
            setIsBiometricSupported(hasHardware && isEnrolled);
            setIsSwitchEnabled(!!savedCredentials);
        } catch (error) {
            console.error('Erro ao verificar biometria:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkBiometricStatus();
    }, [checkBiometricStatus]);

    const handleVerifyPassword = async () => {
        if (!password) {
            Alert.alert("Erro", "Por favor, insira sua senha.");
            return;
        }
        setIsVerifying(true);
        try {
            const response = await api.verifyPassword(session!, password);
            if (response.success) {
                await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify({ email, senha: password }));
                setIsSwitchEnabled(true);
                setModalVisible(false);
                Alert.alert('Sucesso!', 'Login por digital ativado.');
            }
        } catch (err: any) {
            Alert.alert('Falha na verificação', err.message || 'Senha incorreta.');
        } finally {
            setIsVerifying(false);
            setPassword('');
        }
    };

    const handleToggleSwitch = async (newValue: boolean) => {
        if (newValue === true) {
            setModalVisible(true);
        } else {
            try {
                await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
                setIsSwitchEnabled(false);
                Alert.alert('Biometria Desativada', 'O login por impressão digital foi desativado.');
            } catch {
                Alert.alert('Erro', 'Não foi possível desativar a biometria.');
            }
        }
    };

    if (isLoading) return null;
    if (!isBiometricSupported) {
        return (
            <View style={styles.container}>
                <Ionicons name="finger-print-outline" size={22} color="#999" />
                <Text style={styles.textDisabled}>Login por digital não disponível</Text>
            </View>
        );
    }

    return (
        <>
            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Confirmar Identidade</Text>
                        <Text style={styles.modalText}>Para sua segurança, por favor, insira sua senha para ativar o login biométrico.</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Sua senha" placeholderTextColor="#333" 
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!isVerifying}
                        />
                        <TouchableOpacity 
                            style={[styles.modalButton, isVerifying && styles.modalButtonDisabled]} 
                            onPress={handleVerifyPassword}
                            disabled={isVerifying}
                        >
                            {isVerifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Confirmar</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.container}>
                <Ionicons name={Platform.OS === 'ios' ? 'logo-apple' : 'finger-print'} size={22} color="#666" />
                <Text style={styles.text}>Usar biometria para entrar</Text>
                <Switch
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={isSwitchEnabled ? '#007bff' : '#f4f3f4'}
                    onValueChange={handleToggleSwitch}
                    value={isSwitchEnabled}
                />
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    text: { fontSize: 16, flex: 1, marginLeft: 15, color: '#495057' },
    textDisabled: { fontSize: 16, flex: 1, marginLeft: 15, color: '#999' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContainer: { width: '100%', backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    modalText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
    modalInput: { width: '100%', borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 15, color: '#000' },
    modalButton: { backgroundColor: '#007bff', padding: 12, borderRadius: 5, width: '100%', alignItems: 'center' },
    modalButtonDisabled: { backgroundColor: '#a1cfff' },
    modalButtonText: { color: 'white', fontWeight: 'bold' },
    modalCancelButton: { marginTop: 15 },
    modalCancelText: { color: '#007bff' },
});
