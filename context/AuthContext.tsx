import { Platform } from 'react-native'; // Import Platform
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useContext, useEffect, useState } from 'react';

const TOKEN_KEY = 'auth-token';
const SENHA_KEY = 'auth-senha';

const senhaStore = {
  async setItem(senha: string) {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(SENHA_KEY, senha);
      } catch (e) {
        console.error('Local storage is unavailable:', e);
      }
    } else {
      await SecureStore.setItemAsync(SENHA_KEY, senha);
    }
  },
  async getItem() {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(SENHA_KEY);
      } catch (e) {
        console.error('Local storage is unavailable:', e);
        return null;
      }
    } else {
      return await SecureStore.getItemAsync(SENHA_KEY);
    }
  },
  async deleteItem() {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(SENHA_KEY);
      } catch (e) {
        console.error('Local storage is unavailable:', e);
      }
    } else {
      await SecureStore.deleteItemAsync(SENHA_KEY);
    }
  },
};

// Objeto de armazenamento que escolhe a melhor opção para a plataforma
const tokenStore = {
  async setItem(token: string) {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch (e) {
        console.error('Local storage is unavailable:', e);
      }
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  },
  async getItem() {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(TOKEN_KEY);
      } catch (e) {
        console.error('Local storage is unavailable:', e);
        return null;
      }
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  },
  async deleteItem() {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch (e) {
        console.error('Local storage is unavailable:', e);
      }
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },
};

interface User {
  nome: string;
  permissao: 'admin' | 'aluno';
}

const AuthContext = createContext<{
  signIn: (token: string, senha: string) => void;
  signOut: () => void;
  session: string | null;
  user: User | null;
  senha: string | null;
  isLoading: boolean;
}>({
  signIn: () => {},
  signOut: () => {},
  session: null,
  user: null,
  senha: null,
  isLoading: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [senha, setSenha] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
  async function loadTokenUserAndSenha() {
    try {
      const token = await tokenStore.getItem();
      const savedSenha = await senhaStore.getItem();
      if (token) {
        const decodedUser = jwtDecode<User>(token);
        setUser(decodedUser);
        setSession(token);
      }
      if (savedSenha) {
        setSenha(savedSenha);
      }
    } catch (e) {
      console.error('Failed to load token, user or senha', e);
    } finally {
      setIsLoading(false);
    }
  }
  loadTokenUserAndSenha();
}, []);


  const signIn = async (token: string, senha: string) => {
  const decodedUser = jwtDecode<User>(token);
  setUser(decodedUser);
  setSession(token);
  setSenha(senha);
  await tokenStore.setItem(token);
  await senhaStore.setItem(senha); // salva a senha no armazenamento seguro
};


  const signOut = async () => {
  await tokenStore.deleteItem();
  await senhaStore.deleteItem();  // remove senha do armazenamento seguro
  setUser(null);
  setSession(null);
  setSenha(null);
};


  return (
    <AuthContext.Provider value={{ signIn, signOut, session, user, senha, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}