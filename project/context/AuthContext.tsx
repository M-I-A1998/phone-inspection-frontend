import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Memory fallback for web platform where SecureStore is not available
const memoryStore: { [key: string]: string } = {};

const getItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return memoryStore[key] || null;
  }
  return await SecureStore.getItemAsync(key);
};

const setItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    memoryStore[key] = value;
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

const removeItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    delete memoryStore[key];
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userJSON = await getItem('user');
        if (userJSON) {
          const userData = JSON.parse(userJSON);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Mock authentication - replace with actual API call
      const validCredentials = [
        { username: 'admin', password: 'admin123' },
        { username: 'inspector', password: 'inspect123' }
      ];

      const matchedCredentials = validCredentials.find(
        cred => cred.username === username && cred.password === password
      );

      if (matchedCredentials) {
        const userData: User = {
          id: username === 'admin' ? '001' : '002',
          username,
          email: username === 'admin' ? 'admin@example.com' : 'inspector@example.com',
          displayName: username === 'admin' ? 'Admin User' : 'Inspector One',
          role: username === 'admin' ? 'admin' : 'inspector',
        };

        await setItem('user', JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);