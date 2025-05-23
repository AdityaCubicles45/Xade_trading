import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Order } from '@/lib/types';
import { getUserOrders } from '@/lib/trading';
import { format } from 'date-fns';
import { Loader } from 'lucide-react';
import { getWalletAddress } from '@/lib/auth';

export function UserOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const walletAddress = getWalletAddress();
        
        if (!walletAddress) {
          console.error('No wallet address found');
          setError('Please connect your wallet to view orders');
          return;
        }
        
        const ordersData = await getUserOrders(walletAddress);
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    getOrders();
    
    // Refresh orders every 10 seconds
    const interval = setInterval(getOrders, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Order History</CardTitle>
        <CardDescription>Recent trading activity</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="h-32 flex items-center justify-center text-red-500">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            No order history
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="p-3 border rounded-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">{order.market}</div>
                  <div 
                    className={cn(
                      "text-sm font-medium px-2 py-1 rounded-full",
                      order.position_type === 'Buy' 
                        ? "bg-green-500/10 text-green-500" 
                        : "bg-red-500/10 text-red-500"
                    )}
                  >
                    {order.position_type}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-mono">{order.amount.toFixed(4)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-mono">${order.entry_price.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-mono">${(order.amount * order.entry_price).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-mono">{format(new Date(order.timestamp), 'MMM d, HH:mm')}</span>
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