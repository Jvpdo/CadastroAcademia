import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Drawer screenOptions={{ headerTintColor: '#f2f21fff' }}>
      <Drawer.Screen
        name="home"
        options={{
          drawerLabel: 'Início',
          title: 'Painel Principal',
          // CORREÇÃO AQUI
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="painel-alunos"
        options={{
          drawerLabel: 'Gerenciar Alunos',
          title: 'Painel de Alunos',
          // CORREÇÃO AQUI
          drawerIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="cadastro"
        options={{
          drawerLabel: 'Cadastrar Aluno',
          title: 'Cadastro de Aluno',
          // CORREÇÃO AQUI
          drawerIcon: ({ color, size }) => <Ionicons name="person-add-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="gerenciar-horarios"
        options={{
          drawerLabel: 'Gerenciar Horários',
          title: 'Gerenciar Horários',
          // CORREÇÃO AQUI
          drawerIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="gerenciar-katas"
        options={{
          drawerLabel: 'Gerenciar Katas',
          title: 'Gerenciar Katas',
          // CORREÇÃO AQUI
          drawerIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="lista-presenca"
        options={{
          drawerLabel: 'Lista de Presença',
          title: 'Lista de Presença',
          // CORREÇÃO AQUI
          drawerIcon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="configuracoes"
        options={{
          drawerLabel: 'Configurações',
          title: 'Configurações',
          // CORREÇÃO AQUI
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />

      {/* Telas ocultas do admin */}
      <Drawer.Screen name="aluno/[id]" options={{ drawerItemStyle: { display: 'none' }, title: 'Detalhes do Aluno' }} />
      <Drawer.Screen name="aluno/editar/[id]" options={{ drawerItemStyle: { display: 'none' }, title: 'Editar Aluno' }} />
      <Drawer.Screen name="aluno/historico/[id]" options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="alterar-senha" options={{ drawerItemStyle: { display: 'none' }, title: 'Alterar Senha' }} />
      <Drawer.Screen name="editar-perfil" options={{ drawerItemStyle: { display: 'none' }, title: 'Editar Perfil' }} />
    </Drawer>
  );
}
