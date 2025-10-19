import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  goal_weight_kg: number | null;
  activity_level: string | null;
  locale: string | null;
  preferences: any;
  subscription_tier: string | null;
  subscription_status: string | null;
  subscription_end_date: string | null;
  trial_start: string | null;
  trial_end: string | null;
  stripe_customer_id: string | null;
  region: string | null;
  dietary_preferences: any;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      if (!data) {
        console.log('No profile found, creating one...');
        // Create a profile if it doesn't exist
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userData.user.id,
              email: userData.user.email,
              locale: 'en-IN',
              preferences: {},
            });
          
          if (profileError) {
            console.error('Error creating profile:', profileError);
            throw profileError;
          }
          
          // Fetch the newly created profile
          const { data: newProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (fetchError) {
            console.error('Error fetching new profile:', fetchError);
            throw fetchError;
          }
          
          console.log('Profile created and fetched successfully:', newProfile);
          setProfile(newProfile);
        }
      } else {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      // Always set loading to false after profile fetch attempt
      console.log('Profile fetch completed, setting loading to false');
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    console.log('AuthContext: Initializing auth state...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthContext: User found, fetching profile...');
        fetchProfile(session.user.id);
      } else {
        console.log('AuthContext: No user, setting loading to false');
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, 'Session:', !!session);
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('User authenticated, fetching profile...');
          await fetchProfile(session.user.id);
        } else {
          console.log('No user, clearing profile');
          setProfile(null);
        }
        console.log('Auth state change completed');
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error && data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          locale: 'en-IN',
          preferences: {},
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
