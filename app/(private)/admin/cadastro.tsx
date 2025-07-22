import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { StyledPicker } from '@/components/StyledPicker';
import MaskInput from 'react-native-mask-input';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// ... (arrays de opções para os pickers continuam os mesmos) ...
const sexos = [
  { label: 'Masculino', value: 'masculino' },
  { label: 'Feminino', value: 'feminino' },
];
const faixas = [
  { label: 'Branca', value: 'branca' },
  { label: 'Cinza', value: 'cinza' },
  { label: 'Amarela', value: 'amarela' },
  { label: 'Laranja', value: 'laranja' },
  { label: 'Verde', value: 'verde' },
  { label: 'Azul', value: 'azul' },
  { label: 'Roxa', value: 'roxa' },
  { label: 'Marrom', value: 'marrom' },
  { label: 'Preta', value: 'preta' },
];
const graus = [
  { label: 'Nenhum Grau', value: 'nenhum grau' },
  { label: '1 Grau', value: '1 Grau' },
  { label: '2 Graus', value: '2 Graus' },
  { label: '3 Graus', value: '3 Graus' },
  { label: '4 Graus', value: '4 Graus' },
];
const planos = [
  { label: 'Mensal', value: 'mensal' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Semestral', value: 'semestral' },
];

export default function CadastroScreen() {
  const { user, session } = useAuth();

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [sexo, setSexo] = useState('masculino');
  const [dataNascimento, setDataNascimento] = useState('');
  const [faixa, setFaixa] = useState('branca');
  const [grau, setGrau] = useState('nenhum grau');
  const [plano, setPlano] = useState('mensal');
  const [senha, setSenha] = useState('');
  const [foto, setFoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSenhaVisivel, setIsSenhaVisivel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    // Pedimos permissão para acessar a galeria de mídia
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso à galeria para selecionar uma foto.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.5,
    });

    if (!pickerResult.canceled) {
      setFoto(pickerResult.assets[0]);
    }
  };

  // ... (as funções resetForm e handleSalvarAluno continuam as mesmas) ...
  const resetForm = () => {
    setNome('');
    setEmail('');
    setTelefone('');
    setSexo('masculino');
    setDataNascimento('');
    setFaixa('branca');
    setGrau('nenhum grau');
    setPlano('mensal');
    setSenha('');
    setFoto(null);
  };

  const handleSalvarAluno = async () => {
    const formatarDataParaAPI = (data: string) => {
      if (data.length !== 8) return null; // Retorna nulo se a data estiver incompleta
      const dia = data.substring(0, 2);
      const mes = data.substring(2, 4);
      const ano = data.substring(4, 8);
      return `${ano}-${mes}-${dia}`;
    };

    const dataFormatada = formatarDataParaAPI(dataNascimento);

    if (!dataFormatada) {
        Alert.alert('Erro', 'Por favor, insira uma data de nascimento válida.');
        return;
    }

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('email', email);
    formData.append('telefone', telefone);
    formData.append('sexo', sexo);
    formData.append('dataNascimento', dataFormatada);
    formData.append('faixa', faixa);
    formData.append('grau', grau);
    formData.append('plano', plano);
    formData.append('senha', senha);

    if (foto) {
      // @ts-ignore
      formData.append('foto', {
        uri: foto.uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    }

    setIsLoading(true);
    try {
      const response = await api.cadastrarAluno(formData, session);
      Alert.alert('Sucesso!', response.message || 'Aluno cadastrado com sucesso.');
      resetForm();
    } catch (error: any) {
      Alert.alert('Falha no Cadastro', error.message || 'Não foi possível cadastrar o aluno.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.permissao !== 'admin') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.permissionText}>Acesso Negado</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Cadastro de Alunos</Text>
        
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome completo do aluno" editable={!isLoading} />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@exemplo.com" keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
          </View>

          {/* ===== INÍCIO DA MODIFICAÇÃO ===== */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Telefone *</Text>
            <MaskInput
              style={styles.input}
              value={telefone}
              onChangeText={(masked: string, unmasked: string) => {
                setTelefone(unmasked); // Salva o valor sem a máscara
              }}
              mask={['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]}
              placeholder="(00) 99999-9999"
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Data de Nascimento *</Text>
            <MaskInput
              style={styles.input}
              value={dataNascimento}
              onChangeText={(masked: string, unmasked: string) => {
                setDataNascimento(unmasked); // Salva o valor sem a máscara
              }}
              mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/,/\d/, /\d/]}
              placeholder="DD-MM-AAAA"
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>
          {/* ===== FIM DA MODIFICAÇÃO ===== */}

          <StyledPicker label="Sexo *" items={sexos} onValueChange={setSexo} value={sexo} disabled={isLoading} />
          <StyledPicker label="Faixa *" items={faixas} onValueChange={setFaixa} value={faixa} disabled={isLoading} />
          <StyledPicker label="Grau *" items={graus} onValueChange={setGrau} value={grau} disabled={isLoading} />
          <StyledPicker label="Plano *" items={planos} onValueChange={setPlano} value={plano} disabled={isLoading} />
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Senha *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={senha}
                onChangeText={setSenha}
                placeholder="Mínimo de 6 caracteres"
                secureTextEntry={!isSenhaVisivel} // Controlado pelo estado
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setIsSenhaVisivel(!isSenhaVisivel)}>
                <Ionicons name={isSenhaVisivel ? "eye-off" : "eye"} size={24} color="gray" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Foto do Aluno</Text>
            <Button title="Selecionar Foto" onPress={pickImage} disabled={isLoading} />
            {foto && (
              <Image source={{ uri: foto.uri }} style={styles.imagePreview} />
            )}
          </View>

          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <Button title="Salvar Aluno" onPress={handleSalvarAluno} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(249, 241, 0, 0.981)',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'center',
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 5,
    // Sombra para a web
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    // Sombra para o nativo
    elevation: 5,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    // No React Native, 'display: block' não é necessário
    marginBottom: 5,
    color: '#333',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    // Web e mobile têm necessidades de preenchimento (padding) diferentes
    padding: Platform.OS === 'web' ? 10 : 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 3,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  // Estilos do seletor temporário
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 3,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 16,
  },
  pickerInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 3,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 10 : 12,
    fontSize: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50, // Deixa a pré-visualização redonda
    marginTop: 15,
    alignSelf: 'center',
  },
});