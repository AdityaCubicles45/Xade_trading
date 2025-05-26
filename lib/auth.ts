import { supabase } from './supabase';
import { User } from './types';
import { v4 as uuidv4 } from 'uuid';

// Set demo balance for a user
export const setDemoBalance = async (walletAddress: string): Promise<boolean> => {
  try {
    if (!walletAddress) {
      console.error('No wallet address provided');
      return false;
    }

    const { error } = await supabase
      .from('users')
      .update({
        current_balance: 10000,
        current_pnl: 0,
        stage: 'demo',
        tier: 'basic'
      })
      .eq('wallet_address', walletAddress);

    if (error) {
      console.error('Error setting demo balance:', error);
      return false;
    }

    console.log('Demo balance set successfully for wallet:', walletAddress);
    return true;
  } catch (error) {
    console.error('Error in setDemoBalance:', error);
    return false;
  }
};

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
    
    // If user already exists, update their balance to demo amount
    if (existingUser) {
      console.log('Existing user found, updating to demo balance:', existingUser);
      await setDemoBalance(walletAddress);
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();
      return updatedUser as User;
    }
    
    // Create a new user with UUID as id
    const username = `trader_${walletAddress.substring(0, 8)}`;
    const newUser = {
      id: uuidv4(),
      wallet_address: walletAddress,
      email: email || '',
      username,
      tier: 'basic',
      stage: 'demo',
      current_balance: 10000, // Start with 10,000 in demo account
      current_pnl: 0
    };
    
    console.log('Creating new user:', newUser);
    
    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating user:', insertError);
      return null;
    }
    
    console.log('User created successfully:', insertedUser);
    return insertedUser as User;
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

    console.log('Fetching user with wallet address:', walletAddress);

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
    
    console.log('User found:', data);
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
export const updateUserBalance = async (walletAddress: string, balance: number, pnl: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        current_balance: balance,
        current_pnl: pnl
      })
      .eq('wallet_address', walletAddress);
    
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