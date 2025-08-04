// app/(private)/admin/configuracoes.tsx
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { BiometricSwitch } from '@/components/BiometricSwitch';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Button,
    Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as Updates from 'expo-updates';

// Interface para os dados do usuário
interface UserData {
    email: string;
    nome: string;
    permissao: string;
    foto_path: string | null;
}

// Componente de linha de configuração
type SettingsRowProps = { icon: keyof typeof Ionicons.glyphMap; text: string; onPress: () => void; };
const SettingsRow: React.FC<SettingsRowProps> = ({ icon, text, onPress }) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
        <Ionicons name={icon} size={22} color="#666" />
        <Text style={styles.rowText}>{text}</Text>
        <Ionicons name="chevron-forward" size={22} color="#ccc" />
    </TouchableOpacity>
);

export default function ConfiguracoesAdminScreen() {
    const { signOut, user, session } = useAuth();
    const router = useRouter();
    
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isChecking, setIsChecking] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const lastUpdateTime = Updates.createdAt ? new Date(Updates.createdAt).toLocaleString('pt-BR') : 'N/A';

    const fetchUserData = useCallback(async () => {
        if (!session) {
            setError('Sessão inválida.');
            setIsLoading(false);
            return;
        }
        if (!isRefreshing) setIsLoading(true);
        setError(null);
        try {
            const data = await api.getMeusDados(session);
            setUserData(data);
        } catch (err: any) {
            setError(err.message || 'Não foi possível carregar os dados.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [session, isRefreshing]);

    useFocusEffect(
        useCallback(() => {
            fetchUserData();
        }, [fetchUserData])
    );

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchUserData();
    }, [fetchUserData]);

    const handleEditProfile = () => {
        router.push('/(private)/admin/editar-perfil');
    };

    const handleChangePassword = () => {
        router.push('/(private)/admin/alterar-senha');
    };

    async function handleCheckForUpdate() {
        setIsChecking(true);
        try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
                Alert.alert('Atualização Disponível', 'Baixando nova versão...');
                setIsDownloading(true);
                await Updates.fetchUpdateAsync();
                Alert.alert(
                  'Atualização Pronta',
                  'Deseja reiniciar o aplicativo agora para aplicar a nova versão?',
                  [
                    { text: 'Agora não', style: 'cancel' },
                    { text: 'Reiniciar', onPress: () => Updates.reloadAsync() },
                  ]
                );
            } else {
                Alert.alert('Tudo Certo!', 'Você já está com a versão mais recente.');
            }
        } catch {
            Alert.alert('Erro', 'Não foi possível verificar as atualizações. Verifique sua conexão com a internet.');
        } finally {
            setIsChecking(false);
            setIsDownloading(false);
        }
    }

    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#007bff" /></View>;
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <Button title="Tentar Novamente" onPress={fetchUserData} />
            </View>
        );
    }
    
    // BUG FIX: Adicionamos uma verificação para garantir que `userData` não é nulo antes de renderizar.
    // Isso previne erros caso a API retorne com sucesso, mas sem dados.
    if (!userData) {
        return (
            <View style={styles.centered}>
                <Text>Não foi possível carregar os dados do usuário.</Text>
                <Button title="Tentar Novamente" onPress={fetchUserData} />
            </View>
        );
    }

    const fotoUrl = userData.foto_path ;
    const isUpdateLoading = isChecking || isDownloading;
    const buttonTitle = isChecking ? "Verificando..." : isDownloading ? "Baixando..." : "Verificar Atualizações";

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.profileHeader}>
                    {fotoUrl ? (
                        <Image source={{ uri: fotoUrl }} style={styles.profileImage} transition={300} />
                    ) : (
                        <View style={styles.profileImagePlaceholder}>
                            <Ionicons name="person" size={40} color="#fff" />
                        </View>
                    )}
                    <Text style={styles.profileName}>{userData.nome}</Text>
                    {/* BUG FIX: Garantimos que a permissão seja tratada como string */}
                    <Text style={styles.profileRole}>{String(userData.permissao)}</Text>
                </View>

                <Text style={styles.sectionTitle}>Conta</Text>
                <View style={styles.section}>
                    <SettingsRow icon="person-outline" text="Editar Perfil" onPress={handleEditProfile} />
                    <SettingsRow icon="key-outline" text="Alterar Senha" onPress={handleChangePassword} />
                </View>

                <Text style={styles.sectionTitle}>Segurança</Text>
                <View style={styles.section}>
                    <View style={styles.row}>
                        <BiometricSwitch email={user?.email || ''} />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Aplicativo</Text>
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Ionicons name="cloud-download-outline" size={22} color="#666" />
                        <View style={styles.updateContent}>
                            <Text style={styles.rowText}>Versão</Text>
                            <Text style={styles.updateDateText}>Instalada em: {lastUpdateTime}</Text>
                        </View>
                    </View>
                    <View style={styles.updateButtonContainer}>
                        {isUpdateLoading ? (
                            <ActivityIndicator />
                        ) : (
                            <Button
                                title={buttonTitle}
                                onPress={handleCheckForUpdate}
                                disabled={isUpdateLoading}
                            />
                        )}
                    </View>
                </View>
                        
                <View style={[styles.section, { marginTop: 20 }]}>
                    <SettingsRow icon="log-out-outline" text="Sair" onPress={signOut} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    container: { paddingVertical: 20, flexGrow: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e9ecef',
    },
    profileImagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 12,
        color: '#343a40',
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
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
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f0f2f5',
    },
    rowText: {
        flex: 1,
        fontSize: 16,
        marginLeft: 15,
        color: '#495057',
    },
    errorText: {
        color: 'red',
        marginBottom: 15,
        textAlign: 'center',
    },
    updateContent: {
        flex: 1,
        marginLeft: 15,
    },
    updateDateText: {
        fontSize: 12,
        color: '#888',
    },
    updateButtonContainer: {
        padding: 15,
    },
});
