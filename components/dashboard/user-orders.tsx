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
import { Loader, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getWalletAddress } from '@/lib/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OrderStatus = 'all' | 'filled' | 'cancelled' | 'pending';
type OrderType = 'all' | 'market' | 'limit';

export function UserOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [typeFilter, setTypeFilter] = useState<OrderType>('all');

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

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (typeFilter !== 'all' && order.order_type !== typeFilter) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Order History</CardTitle>
            <CardDescription>Recent trading activity</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as OrderType)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="limit">Limit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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
        ) : filteredOrders.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            No order history
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{order.market}</div>
                    {getStatusIcon(order.status || 'pending')}
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className={cn(
                        "text-sm font-medium px-2 py-1 rounded-full flex items-center gap-1",
                        order.position_type === 'Buy' 
                          ? "bg-green-500/10 text-green-500" 
                          : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {order.position_type === 'Buy' ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {order.position_type}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.order_type || 'market'}
                    </div>
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
                    <span className="font-mono">{format(new Date(order.created_at), 'MMM d, HH:mm')}</span>
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