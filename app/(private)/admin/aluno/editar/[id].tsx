import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StyledPicker } from '@/components/StyledPicker';
import MaskInput from 'react-native-mask-input';

// Arrays com as opções para os seletores
const sexos = [ { label: 'Masculino', value: 'masculino' }, { label: 'Feminino', value: 'feminino' } ];
const faixas = [ { label: 'Branca', value: 'branca' }, { label: 'Cinza', value: 'cinza' }, { label: 'Amarela', value: 'amarela' }, { label: 'Laranja', value: 'laranja' }, { label: 'Verde', value: 'verde' }, { label: 'Azul', value: 'azul' }, { label: 'Roxa', value: 'roxa' }, { label: 'Marrom', value: 'marrom' }, { label: 'Preta', value: 'preta' } ];
const graus = [ { label: 'Nenhum Grau', value: 'nenhum grau' }, { label: '1 Grau', value: '1 Grau' }, { label: '2 Graus', value: '2 Graus' }, { label: '3 Graus', value: '3 Graus' }, { label: '4 Graus', value: '4 Graus' } ];
const planos = [ { label: 'Mensal', value: 'mensal' }, { label: 'Trimestral', value: 'trimestral' }, { label: 'Semestral', value: 'semestral' } ];

export default function EditarAlunoScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();
  const alunoId = Number(id);

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [sexo, setSexo] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [faixa, setFaixa] = useState('');
  const [grau, setGrau] = useState('');
  const [plano, setPlano] = useState('');
  
  // Estados de controle da tela
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null); // Agora será usado

  // Busca os dados do aluno para preencher o formulário
  const fetchAluno = useCallback(async () => {
    if (!alunoId) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getAlunoById(alunoId, session);
      const aluno = response.data;
      if (aluno) {
        setNome(aluno.nome);
        setEmail(aluno.email);
        setTelefone(aluno.telefone);
        setSexo(aluno.sexo);
        setDataNascimento(aluno.dataNascimento ? new Date(aluno.dataNascimento).toLocaleDateString('pt-BR').replace(/\//g, '') : '');
        setFaixa(aluno.faixa);
        setGrau(aluno.grau);
        setPlano(aluno.plano);
      }
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar os dados do aluno.');
    } finally {
      setIsLoading(false);
    }
  }, [alunoId, session]);

  useEffect(() => {
    fetchAluno();
  }, [fetchAluno]);

  const handleSalvarEdicao = async () => {
    const formatarDataParaAPI = (data: string) => {
      if (data.length !== 8) return null;
      const dia = data.substring(0, 2);
      const mes = data.substring(2, 4);
      const ano = data.substring(4, 8);
      return `${ano}-${mes}-${dia}`;
    };
    const dataFormatada = formatarDataParaAPI(dataNascimento);

    if (!nome || !email || !dataFormatada) {
      Alert.alert('Erro', 'Nome, Email e Data de Nascimento são obrigatórios.');
      return;
    }

    const alunoData = { nome, email, telefone, sexo, dataNascimento: dataFormatada, faixa, grau, plano };

    setIsSaving(true);
    try {
      await api.updateAluno(alunoId, alunoData, session);
      Alert.alert('Sucesso', 'Dados do aluno atualizados!');
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível salvar as alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  // Renderização condicional para loading e erro
  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /><Text>Carregando dados...</Text></View>;
  }

  // ===== CORREÇÃO AQUI =====
  // Adicionamos a verificação de erro para usar a variável
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Tentar Novamente" onPress={fetchAluno} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: `Editar: ${nome}` }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Editar Aluno</Text>
        <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Nome *" value={nome} onChangeText={setNome} />
            <TextInput style={styles.input} placeholder="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <MaskInput style={styles.input} placeholder="Telefone" value={telefone} onChangeText={(m, u) => setTelefone(u)} mask={['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]} />
            <MaskInput style={styles.input} placeholder="Data de Nascimento (DD/MM/AAAA)" value={dataNascimento} onChangeText={(m, u) => setDataNascimento(u)} mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/]} />
            <StyledPicker label="Sexo" items={sexos} onValueChange={setSexo} value={sexo} />
            <StyledPicker label="Faixa" items={faixas} onValueChange={setFaixa} value={faixa} />
            <StyledPicker label="Grau" items={graus} onValueChange={setGrau} value={grau} />
            <StyledPicker label="Plano" items={planos} onValueChange={setPlano} value={plano} />

            <View style={styles.buttonContainer}>
            {isSaving ? (
              <ActivityIndicator size="large" />
            ) : (
              <Button title="Salvar Alterações" onPress={handleSalvarEdicao} />
            )}
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 8, elevation: 2 },
  input: { height: 45, borderColor: '#ccc', borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, marginBottom: 15, backgroundColor: '#fff', fontSize: 16 },
  buttonContainer: { marginTop: 20 },
  errorText: { color: 'red', marginBottom: 15, textAlign: 'center' },
});
