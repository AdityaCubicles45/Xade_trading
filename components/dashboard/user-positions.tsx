'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Position } from '@/lib/types';
import { getUserPositions, closePosition } from '@/lib/trading';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/api';
import { Loader } from 'lucide-react';
import { getWalletAddress } from '@/lib/auth';

export function UserPositions() {
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const walletAddress = getWalletAddress();
        if (!walletAddress) {
          setError('Please connect your wallet to view positions');
          return;
        }
        
        const positionsData = await getUserPositions(walletAddress);
        setPositions(positionsData);
      } catch (error) {
        console.error('Error fetching positions:', error);
        setError('Failed to load positions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPositions();
    
    // Refresh positions every 5 seconds
    const interval = setInterval(fetchPositions, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleClosePosition = async (positionId: string) => {
    try {
      // Use current price from the position for closing
      const position = positions.find(p => p.id === positionId);
      if (!position) return;
      
      const result = await closePosition(positionId, position.current_price);
      
      if (result) {
        toast({
          title: "Position closed",
          description: `Position closed with ${position.pnl > 0 ? 'profit' : 'loss'} of $${Math.abs(position.pnl).toFixed(2)}`,
        });
        
        // Refresh positions
        const walletAddress = getWalletAddress();
        if (walletAddress) {
          const positionsData = await getUserPositions(walletAddress);
          setPositions(positionsData);
        }
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Open Positions</CardTitle>
        <CardDescription>Your active trading positions</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            {error}
          </div>
        ) : positions.length === 0 ? (
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
                
                <div className="space-y-1 text-sm">
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