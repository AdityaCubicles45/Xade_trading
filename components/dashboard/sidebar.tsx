'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  LineChart, 
  Wallet, 
  History, 
  Settings, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

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

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-[calc(100vh-64px)] border-r bg-card transition-all duration-300 flex flex-col sticky top-16",
        isCollapsed ? "w-[70px]" : "w-[250px]"
      )}
    >
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span className="mr-3 flex-shrink-0">{item.icon}</span>
              <span className={cn("flex-1", isCollapsed ? "hidden" : "block")}>
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}