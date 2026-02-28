import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, SavedState, TestResult } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<{ error: any }>;
  updateUserHistory: (result: TestResult) => Promise<void>;
  saveUserState: (state: SavedState | null) => Promise<void>;
  users: User[]; // For admin panel (profiles)
  deleteUser: (userId: string) => Promise<void>; // Admin only
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]); // List of profiles for admin
  const [loading, setLoading] = useState(true);

  // Fetch user profile and progress
  const fetchUserData = async (userId: string, email?: string) => {
    try {
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Get progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profile) {
        setUser({
          id: userId,
          email: email || profile.email,
          username: profile.username || email?.split('@')[0] || 'User',
          isAdmin: profile.is_admin || false,
          history: progress?.history || [],
          savedState: progress?.saved_state || null,
          isGuest: false,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Fetch all users for admin
  const fetchAllUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (profiles) {
      // Map profiles to User objects (simplified for list)
      const mappedUsers: User[] = profiles.map(p => ({
        id: p.id,
        email: p.email,
        username: p.username || 'User',
        isAdmin: p.is_admin,
        history: [], // Don't fetch history for all users to save bandwidth
        savedState: null,
      }));
      setUsers(mappedUsers);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email);
      } else {
        if (!user?.isGuest) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch users list if admin
  useEffect(() => {
    if (user?.isAdmin) {
      fetchAllUsers();
    }
  }, [user?.isAdmin]);

  const login = async (email: string, password?: string) => {
    if (email === 'Guest') {
      setUser({
        id: 'guest',
        username: 'Guest',
        isAdmin: false,
        history: [],
        savedState: null,
        isGuest: true,
      });
      return { error: null };
    }

    if (!password) return { error: 'Password required' };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const logout = async () => {
    if (user?.isGuest) {
      setUser(null);
    } else {
      await supabase.auth.signOut();
    }
  };

  const register = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    return { error };
  };

  const updateUserHistory = async (result: TestResult) => {
    if (!user) return;

    const newHistory = [...user.history, result];
    
    // Update local state
    setUser({ ...user, history: newHistory, savedState: null });

    // Update Supabase if not guest
    if (!user.isGuest) {
      await supabase
        .from('user_progress')
        .upsert({ 
          user_id: user.id, 
          history: newHistory, 
          saved_state: null 
        });
    }
  };

  const saveUserState = async (state: SavedState | null) => {
    if (!user) return;

    // Update local state
    setUser({ ...user, savedState: state });

    // Update Supabase if not guest
    if (!user.isGuest) {
      await supabase
        .from('user_progress')
        .upsert({ 
          user_id: user.id, 
          saved_state: state 
        });
    }
  };

  const deleteUser = async (userId: string) => {
    // Note: Deleting a user from Auth requires Service Role key which we don't have on client.
    // We can only delete their profile data or use an Edge Function.
    // For this demo, we'll just delete from the profiles table which is allowed by RLS if we set it up right,
    // but standard RLS usually prevents deleting others.
    // We will assume the user meant "remove from my list" or we'll try to delete from 'profiles'.
    
    // Actually, without admin API access, we can't fully delete the Auth user.
    // We will just filter it from the local list for now to simulate the UI action.
    setUsers(users.filter(u => u.id !== userId));
    console.warn("Full user deletion requires backend admin privileges. Removed from view only.");
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        register, 
        updateUserHistory, 
        saveUserState, 
        users, 
        deleteUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
