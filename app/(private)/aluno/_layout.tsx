import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';

export default function AlunoLayout() {
  return (
    <Drawer screenOptions={{ headerTintColor: '#f2f21fff' }}>
      <Drawer.Screen
        name="home" // Aponta para o arquivo que agora é o "Meu Painel"
        options={{
          drawerLabel: 'Inicio', // O nome no menu
          title: 'Meu Painel',     // O título no topo da tela
          drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="horarios"
        options={{
          drawerLabel: 'Horários',
          title: 'Horários das Aulas',
          drawerIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="biblioteca-katas"
        options={{
          drawerLabel: 'Biblioteca de Katas',
          title: 'Biblioteca de Katas',
          drawerIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="historico-presenca"
        options={{
          drawerLabel: 'Histórico de Presença',
          title: 'Histórico de Presença',
          drawerIcon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} />,
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
      
       {/* Telas que não aparecem no menu, mas podem ser navegadas */}
       <Drawer.Screen name="editar-perfil" options={{ drawerItemStyle: { display: 'none' } }} />
       <Drawer.Screen name="alterar-senha" options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer>
  );
}
