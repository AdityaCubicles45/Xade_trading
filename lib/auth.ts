import { supabase } from './supabase';
import { User } from './types';
import { v4 as uuidv4 } from 'uuid';

// Initialize a new user in Supabase after successful Crossmint authentication
export const initializeUser = async (walletAddress: string, email?: string): Promise<User | null> => {
  try {
    if (!walletAddress) {
      console.error('No wallet address provided');
      return null;
    }

    // Check if user already exists by wallet address
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      return null;
    }
    
    // If user already exists, return it
    if (existingUser) {
      return existingUser as User;
    }
    
    // Create a new user with UUID as id
    const username = `trader_${walletAddress.substring(0, 8)}`;
    const newUser: Omit<User, 'id'> & { id: string } = {
      id: uuidv4(), // Generate UUID for id
      wallet_address: walletAddress,
      email: email || '',
      username,
      tier: 'basic',
      stage: 'demo',
      current_balance: 10000, // Start with 10,000 in demo account
      current_pnl: 0
    };
    
    const { error: insertError } = await supabase
      .from('users')
      .insert(newUser);
    
    if (insertError) {
      console.error('Error creating user:', insertError);
      return null;
    }
    
    return newUser;
  } catch (error) {
    console.error('Error in initializeUser:', error);
    return null;
  }
};

// Get the current user from Supabase
export const getCurrentUser = async (walletAddress: string): Promise<User | null> => {
  try {
    if (!walletAddress) {
      console.error('No wallet address provided to getCurrentUser');
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // User not found, try to initialize
        console.log('User not found, initializing new user...');
        return await initializeUser(walletAddress);
      }
      console.error('Error fetching current user:', error);
      return null;
    }
    
    return data as User;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const walletAddress = localStorage.getItem('walletAddress');
  const authStatus = localStorage.getItem('isAuthenticated') === 'true';
  
  return !!(walletAddress && authStatus);
};

// Get wallet address from storage
export const getWalletAddress = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('walletAddress');
};

// Update user's balance and PnL
export const updateUserBalance = async (userId: string, balance: number, pnl: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        current_balance: balance,
        current_pnl: pnl
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user balance:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateUserBalance:', error);
    return false;
  }
};