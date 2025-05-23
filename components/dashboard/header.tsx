'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/theme-toggle';
import { User, Bell, Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User as UserType } from '@/lib/types';
import { getCurrentUser } from '@/lib/auth';

export function DashboardHeader() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserType | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const walletAddr = localStorage.getItem('walletAddress') || '';
      setWalletAddress(walletAddr);
      
      if (walletAddr) {
        const user = await getCurrentUser(walletAddr);
        setUserData(user);
      }
    };
    
    getUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('isAuthenticated');
    router.push('/');
  };

  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <span className="font-bold text-xl">AlphaTrade</span>
        </Link>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 bg-muted/50 rounded-full px-3 py-1">
            <span className="text-sm text-muted-foreground">Balance:</span>
            <span className="text-sm font-mono">
              ${userData?.current_balance.toLocaleString() || '0.00'}
            </span>
          </div>
          
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          
          <ModeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{userData?.username || 'Trader'}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {walletAddress}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}