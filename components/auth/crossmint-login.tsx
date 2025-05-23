'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { initializeUser } from '@/lib/auth';

// Mock component as we can't import the actual Crossmint SDK
// In a real implementation, you would use @crossmint/client-sdk-react-ui
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
      // In a real implementation, this would be handled by the Crossmint SDK
      // For demo purposes, we're mocking the wallet authentication
      const mockWalletAddress = '0x' + Math.random().toString(16).substring(2, 14);
      
      // Initialize user in Supabase
      await initializeUser(mockWalletAddress);
      
      // Store authentication in localStorage
      localStorage.setItem('walletAddress', mockWalletAddress);
      localStorage.setItem('isAuthenticated', 'true');
      
      // Redirect to dashboard
      router.push('/dashboard');
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
      onClick={handleLogin}
      disabled={isLoading}
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}