import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
// 1. Importe o hook useTheme para pegar as cores
import { useTheme } from '@react-navigation/native';

export default function AdminLayout() {
  // 2. Pegue as cores do tema atual
  const { colors } = useTheme();

  return (
    <Drawer 
      // 3. Aplique as cores do tema às screenOptions
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card, // Fundo do cabeçalho
        },
        headerTintColor: colors.text, // Cor do título e dos botões do cabeçalho
        
        drawerStyle: {
          backgroundColor: colors.card, // Fundo do menu lateral
        },
        drawerLabelStyle: {
          color: colors.text, // Cor do texto dos itens do menu
        },
        drawerActiveTintColor: colors.primary, // Cor do item de menu ativo (texto e ícone)

        // 4. Adicione a regra do fundo transparente para as telas
        // @ts-ignore 
        sceneContainerStyle: { backgroundColor: 'transparent' }
      }} 
      initialRouteName="home"
    >
      <Drawer.Screen
        name="home"
        options={{
          drawerLabel: 'Início',
          title: 'Painel Principal',
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="painel-alunos"
        options={{
          drawerLabel: 'Gerenciar Alunos',
          title: 'Painel de Alunos',
          drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="cadastro"
        options={{
          drawerLabel: 'Cadastrar Aluno',
          title: 'Cadastro de Aluno',
          drawerIcon: ({ color, size }) => <Ionicons name="person-add-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="gerenciar-horarios"
        options={{
          drawerLabel: 'Gerenciar Horários',
          title: 'Gerenciamento de Horarios',
          drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="gerenciar-katas"
        options={{
          drawerLabel: 'Gerenciar Katas',
          title: 'Gerenciamento de Katas',
          drawerIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="lista-presenca"
        options={{
          drawerLabel: 'Lista Presença',
          title: 'Lista de Presença',
          drawerIcon: ({ color, size }) => <Ionicons name="checkmark-done-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="configuracoes"
        options={{
          drawerLabel: 'Configurações',
          title: 'Configurações',
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />

      {/* Telas ocultas do admin */}
      <Drawer.Screen name="aluno/[id]" options={{ drawerItemStyle: { display: 'none' }, title: 'Detalhes do Aluno' }} />
      <Drawer.Screen name="aluno/editar/[id]" options={{ drawerItemStyle: { display: 'none' }, title: 'Editar Aluno' }} />
      <Drawer.Screen name="aluno/historico/[id]" options={{ drawerItemStyle: { display: 'none' }, title: 'Histórico' }} />
      <Drawer.Screen name="alterar-senha" options={{ drawerItemStyle: { display: 'none' }, title: 'Alterar Senha' }} />
      <Drawer.Screen name="editar-perfil" options={{ drawerItemStyle: { display: 'none' }, title: 'Editar Perfil' }} />
    </Drawer>
  );
}