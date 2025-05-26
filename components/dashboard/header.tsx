'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  LineChart, 
  Wallet, 
  History, 
  Settings, 
  HelpCircle,
  Bell, // Add this import
  User,
  Moon,
  Sun,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: 'Trading',
    href: '/dashboard/trading',
    icon: <LineChart className="h-5 w-5" />,
  },
  {
    name: 'Wallet',
    href: '/dashboard/wallet',
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    name: 'History',
    href: '/dashboard/history',
    icon: <History className="h-5 w-5" />,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    name: 'Help',
    href: '/dashboard/help',
    icon: <HelpCircle className="h-5 w-5" />,
  },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side - Navigation */}
        <nav className="flex items-center space-x-6 mx-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors flex items-center gap-2",
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
        
        {/* Right side - Icons */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}