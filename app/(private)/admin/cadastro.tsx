import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
// NOVO: Importar o useTheme para pegar as cores do tema
import { useTheme, Theme } from '@react-navigation/native';
// Usaremos a Image do expo-image que é mais performática, mas a do react-native também funciona
import { Image } from 'expo-image'; 
import { StyledPicker } from '@/components/StyledPicker';
import MaskInput from 'react-native-mask-input';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Os arrays de Pickers permanecem os mesmos...
const sexos = [ { label: 'Masculino', value: 'masculino' }, { label: 'Feminino', value: 'feminino' } ];
const faixas = [ { label: 'Branca', value: 'branca' }, { label: 'Cinza', value: 'cinza' }, { label: 'Amarela', value: 'amarela' }, { label: 'Laranja', value: 'laranja' }, { label: 'Verde', value: 'verde' }, { label: 'Azul', value: 'azul' }, { label: 'Roxa', value: 'roxa' }, { label: 'Marrom', value: 'marrom' }, { label: 'Preta', value: 'preta' } ];
const graus = [ { label: 'Nenhum Grau', value: 'nenhum grau' }, { label: '1 Grau', value: '1 Grau' }, { label: '2 Graus', value: '2 Graus' }, { label: '3 Graus', value: '3 Graus' }, { label: '4 Graus', value: '4 Graus' } ];
const planos = [ { label: 'Mensal', value: 'mensal' }, { label: 'Trimestral', value: 'trimestral' }, { label: 'Semestral', value: 'semestral' } ];

export default function CadastroScreen() {
  // 1. Pegar as cores e se o tema é escuro
  const { colors, dark } = useTheme(); 
  const { user, session } = useAuth();
  
  // Os estados do formulário permanecem os mesmos...
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
  const [refreshing, setRefreshing] = useState(false);

  // 2. Criar os estilos dinamicamente com base nas cores do tema
  const styles = getStyles(colors, dark);
  
  // Todas as funções (pickImage, resetForm, etc.) permanecem as mesmas...
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permissão necessária", "Você precisa permitir o acesso à galeria.");
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

  const resetForm = useCallback(() => {
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
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    resetForm();
    setTimeout(() => setRefreshing(false), 500);
  }, [resetForm]);

  const handleSalvarAluno = async () => {
    // Lógica de salvar permanece a mesma
    const formatarDataParaAPI = (data: string) => {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = data.match(regex);
  if (!match) return null;

  const [, dia, mes, ano] = match;
  return `${ano}-${mes}-${dia}`;
};
    const dataFormatada = formatarDataParaAPI(dataNascimento);
    if (!dataFormatada) {
      Alert.alert('Erro', 'Data de nascimento inválida. Use o formato DD/MM/AAAA.');
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
      formData.append('foto', { uri: foto.uri, name: `photo_${Date.now()}.jpg`, type: 'image/jpeg' });
    }
    setIsLoading(true);
    try {
      const response = await api.cadastrarAluno(formData, session);
      Alert.alert('Sucesso!', response.message || 'Aluno cadastrado.');
      resetForm();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível cadastrar.');
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

  // A cor do placeholder agora é definida dinamicamente
  const placeholderColor = colors.border;

  return (
    <LinearGradient
            colors={['#f9f100', '#252403ff', '#222']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{flex: 1}}
          >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> }
        >
          <Text style={styles.title}>Cadastro de Alunos</Text>

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome completo" placeholderTextColor={placeholderColor} editable={!isLoading} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@exemplo.com" placeholderTextColor={placeholderColor} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Telefone *</Text>
              <MaskInput style={styles.input} value={telefone} onChangeText={(masked, unmasked) => setTelefone(unmasked)} mask={['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]} placeholder="(00) 99999-9999" placeholderTextColor={placeholderColor} keyboardType="phone-pad" editable={!isLoading}/>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Data de Nascimento *</Text>
              <MaskInput style={styles.input} value={dataNascimento} onChangeText={(masked, unmasked) => setDataNascimento(masked)} mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/]} placeholder="DD/MM/AAAA" placeholderTextColor={placeholderColor} keyboardType="numeric" editable={!isLoading} />
            </View>

            <StyledPicker label="Sexo *" items={sexos} onValueChange={setSexo} value={sexo} disabled={isLoading} />
            <StyledPicker label="Faixa *" items={faixas} onValueChange={setFaixa} value={faixa} disabled={isLoading} />
            <StyledPicker label="Grau *" items={graus} onValueChange={setGrau} value={grau} disabled={isLoading} />
            <StyledPicker label="Plano *" items={planos} onValueChange={setPlano} value={plano} disabled={isLoading} />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Senha *</Text>
              <View style={styles.passwordContainer}>
                <TextInput style={styles.passwordInput} value={senha} onChangeText={setSenha} placeholder="Mínimo de 6 caracteres" placeholderTextColor={placeholderColor} secureTextEntry={!isSenhaVisivel} editable={!isLoading}/>
                <TouchableOpacity onPress={() => setIsSenhaVisivel(!isSenhaVisivel)}>
                  <Ionicons name={isSenhaVisivel ? "eye-off" : "eye"} size={24} color={colors.border} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Foto do Aluno</Text>
              <Button title="Selecionar Foto" onPress={pickImage} disabled={isLoading} color={colors.primary} />
              {foto && <Image source={{ uri: foto.uri }} style={styles.imagePreview} />}
            </View>

            <View style={styles.buttonContainer}>
              {isLoading ? <ActivityIndicator size="large" color={colors.primary} /> : <Button title="Salvar Aluno" onPress={handleSalvarAluno} color={colors.primary}/>}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// 3. A função que cria o StyleSheet
// Ela recebe as cores do tema e cria os estilos com base nelas
const getStyles = (colors: Theme['colors'], isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 5,
    backgroundColor: '#ffffffea',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
  },
  form: {
    backgroundColor: '#ffffffea', // Cor do card do tema
    padding: 20,
    borderRadius: 12,
  },
  formGroup: { marginBottom: 15 },
  label: { 
    marginBottom: 6, 
    color: '#333', // Cor do texto do tema
    fontWeight: '600', 
    fontSize: 15,
    opacity: 0.8
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border, // Cor da borda do tema
    borderRadius: 10,
    backgroundColor: '#fff', // Fundo sutilmente diferente
    fontSize: 16,
    color: '#000', // Cor do texto digitado do tema
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border, // Cor da borda do tema
    borderRadius: 10,
    backgroundColor: '#fff', // Fundo sutilmente diferente
  },
  passwordInput: { 
    flex: 1, 
    padding: 12,
    fontSize: 16, 
    color: '#000' // Cor do texto da senha
  },
  buttonContainer: { marginTop: 20 },
  permissionText: { fontSize: 20, fontWeight: 'bold', color: 'red' },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginTop: 15,
    alignSelf: 'center',
    borderColor: colors.border,
    borderWidth: 1,
  },
});
