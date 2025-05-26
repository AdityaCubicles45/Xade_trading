'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/api';
import { Loader } from 'lucide-react';
import { getWalletAddress } from '@/lib/auth';
import { getCurrentUser, fetchPositions, closePosition } from '@/lib/api';
import { usePositionsReload } from './PositionsReloadContext';

interface Position {
  id: string;
  market: string;
  amount: number;
  entry_price: number;
  current_price: number;
  pnl: number;
}

interface UserPositionsProps {
  reloadOrders: () => void;
}

export function UserPositions({ reloadOrders }: UserPositionsProps) {
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const CACHE_DURATION = 60000; // 1 minute cache
  const { reloadSignal } = usePositionsReload();

  const loadPositions = async () => {
    try {
      setLoading(true);
      setError(null);

      const walletAddress = localStorage.getItem('walletAddress');
      if (!walletAddress) {
        setError('No wallet address found');
        return;
      }

      // Check if we need to fetch user data
      const now = Date.now();
      if (now - lastFetchTimeRef.current < CACHE_DURATION) {
        return; // Use cached data
      }

      // Clear any existing timeout
      if (userFetchTimeoutRef.current) {
        clearTimeout(userFetchTimeoutRef.current);
      }

      // Set a new timeout to fetch user data
      userFetchTimeoutRef.current = setTimeout(async () => {
        const user = await getCurrentUser(walletAddress);
        if (user) {
          lastFetchTimeRef.current = now;
          const fetchedPositions = await fetchPositions(walletAddress);
          setPositions(fetchedPositions.map(p => ({
            id: p.id,
            market: p.symbol,
            amount: p.size,
            entry_price: p.entryPrice,
            current_price: p.currentPrice,
            pnl: p.pnl
          })));
        }
      }, 1000); // Debounce for 1 second

    } catch (error) {
      console.error('Error fetching positions:', error);
      setError('Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPositions();

    // Listen for real-time price updates
    const handlePriceUpdate = (event: CustomEvent) => {
      const { symbol, price } = event.detail;
      setPositions(prevPositions =>
        prevPositions.map(pos =>
          pos.market === symbol ? { ...pos, current_price: price } : pos
        )
      );
    };
    window.addEventListener('priceUpdate', handlePriceUpdate as EventListener);

    return () => {
      if (userFetchTimeoutRef.current) {
        clearTimeout(userFetchTimeoutRef.current);
      }
      window.removeEventListener('priceUpdate', handlePriceUpdate as EventListener);
    };
  }, [reloadSignal]);

  const handleClosePosition = async (positionId: string) => {
    try {
      // Use current price from the position for closing
      const position = positions.find(p => p.id === positionId);
      if (!position) return;
      
      const result = await closePosition(positionId);
      
      if (result) {
        toast({
          title: "Position closed",
          description: `Position closed with ${position.pnl > 0 ? 'profit' : 'loss'} of $${Math.abs(position.pnl).toFixed(2)}`,
        });
        
        // Refresh positions
        loadPositions();
        // Trigger order history reload
        reloadOrders();
      } else {
        toast({
          title: "Failed to close position",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error closing position:', error);
      toast({
        title: "Error closing position",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-[#23262F] border-none rounded-xl shadow-md">
        <CardHeader className="pb-2">
          <CardTitle>Open Positions</CardTitle>
          <CardDescription>Your active trading positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#23262F] border-none rounded-xl shadow-md">
        <CardHeader className="pb-2">
          <CardTitle>Open Positions</CardTitle>
          <CardDescription>Your active trading positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-black py-8">
        <div className="flex flex-col items-center">
          <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#23262F"/><path d="M24 16v16M16 24h16" stroke="#8F939E" strokeWidth="2" strokeLinecap="round"/></svg>
          <span className="mt-4 text-neutral-500 text-base">You don't have any open position</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black px-4 py-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white text-base font-semibold">Positions</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-white">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="px-2 py-1 font-medium text-left">Market</th>
              <th className="px-2 py-1 font-medium text-left">Amount</th>
              <th className="px-2 py-1 font-medium text-left">Entry</th>
              <th className="px-2 py-1 font-medium text-left">Current</th>
              <th className="px-2 py-1 font-medium text-left">PnL</th>
              <th className="px-2 py-1 font-medium text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.id} className="border-b border-neutral-800">
                <td className="px-2 py-1">{position.market}</td>
                <td className="px-2 py-1">{position.amount.toFixed(4)}</td>
                <td className="px-2 py-1">${formatPrice(position.entry_price)}</td>
                <td className="px-2 py-1">${formatPrice(position.current_price)}</td>
                <td className="px-2 py-1">
                  <span className={cn(
                    position.pnl > 0 ? "text-green-500" : position.pnl < 0 ? "text-red-500" : "text-white"
                  )}>
                    ${formatPrice(position.pnl)}
                  </span>
                </td>
                <td className="px-2 py-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-neutral-900 text-white border border-neutral-800 rounded px-3 py-1 text-xs"
                    onClick={() => handleClosePosition(position.id)}
                  >
                    Close
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}