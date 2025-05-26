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

interface Position {
  id: string;
  market: string;
  amount: number;
  entry_price: number;
  current_price: number;
  pnl: number;
}

export function UserPositions() {
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const CACHE_DURATION = 60000; // 1 minute cache

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

    return () => {
      if (userFetchTimeoutRef.current) {
        clearTimeout(userFetchTimeoutRef.current);
      }
    };
  }, []);

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

  return (
    <Card className="bg-[#23262F] border-none rounded-xl shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>Open Positions</CardTitle>
        <CardDescription>Your active trading positions</CardDescription>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No open positions
          </div>
        ) : (
          <div className="space-y-4">
            {positions.map((position) => (
              <div 
                key={position.id} 
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">{position.market}</div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleClosePosition(position.id)}
                  >
                    Close
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-mono">{position.amount.toFixed(4)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry:</span>
                    <span className="font-mono">${formatPrice(position.entry_price)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current:</span>
                    <span className="font-mono">${formatPrice(position.current_price)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PnL:</span>
                    <span 
                      className={cn(
                        "font-mono",
                        position.pnl > 0 ? "text-green-500" : position.pnl < 0 ? "text-red-500" : ""
                      )}
                    >
                      ${formatPrice(position.pnl)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}