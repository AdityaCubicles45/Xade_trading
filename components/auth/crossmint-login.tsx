'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { initializeUser } from '@/lib/auth';

export function CrossmintLoginButton({ 
  variant = "default", 
  size = "default"
}: { 
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link",
  size?: "default" | "sm" | "lg" | "icon"
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      // For now, use a mock wallet address until Crossmint SDK is properly set up
      const mockWalletAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      
      // Initialize user in Supabase with demo balance
      const user = await initializeUser(mockWalletAddress);
      
      if (!user) {
        throw new Error('Failed to initialize user');
      }
      
      // Store authentication in localStorage
      localStorage.setItem('walletAddress', mockWalletAddress);
      localStorage.setItem('isAuthenticated', 'true');
      
      // Redirect to dashboard
      router.push('/pricing');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      disabled={isLoading}
      onClick={handleLogin}
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isLoading ? 'Connecting...' : 'Connect Wallet (Demo)'}
    </Button>
  );
}