import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from './types.ts';
import { useSnackbar } from "./SnackbarProvider.tsx";

interface AuthContextType {
  user: UserProfile | null;
  login: (u: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => { },
  logout: () => { }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
   const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const savedUser = localStorage.getItem('loandocx_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('loandocx_user');
      }
    }
  }, []);

  const login = (userData: UserProfile) => {
    if (userData.user_type === "AT") {
      enqueueSnackbar("Invalid user type. Please contact admin.", "error");
      return;
    }
    setUser(userData);
    localStorage.setItem('loandocx_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('loandocx_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);