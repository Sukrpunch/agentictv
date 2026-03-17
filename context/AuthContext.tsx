'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabase } from '@/lib/supabase';

interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabase();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        setUser(authUser as User | null);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
