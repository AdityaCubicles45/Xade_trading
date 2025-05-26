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

export function UserOrders({ ordersReloadSignal }: { ordersReloadSignal: number }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [typeFilter, setTypeFilter] = useState<OrderType>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const walletAddress = getWalletAddress();
        if (!walletAddress) {
          setError('Please connect your wallet');
          return;
        }
        const userOrders = await getUserOrders(walletAddress);
        setOrders(userOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [ordersReloadSignal]);

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

  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    const typeMatch = typeFilter === 'all' || order.order_type === typeFilter;
    return statusMatch && typeMatch;
  });

  return (
    <div className="w-full bg-black px-4 py-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white text-base font-semibold">Orders</span>
      </div>
      {error ? (
        <div className="flex flex-col items-center justify-center h-full w-full py-8">
          <div className="flex flex-col items-center">
            <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#23262F"/><path d="M24 16v16M16 24h16" stroke="#8F939E" strokeWidth="2" strokeLinecap="round"/></svg>
            <span className="mt-4 text-neutral-500 text-base">No orders found</span>
          </div>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-8">
          <Loader className="animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full w-full py-8">
          <div className="flex flex-col items-center">
            <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#23262F"/><path d="M24 16v16M16 24h16" stroke="#8F939E" strokeWidth="2" strokeLinecap="round"/></svg>
            <span className="mt-4 text-neutral-500 text-base">No orders found</span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-white">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-2 py-1 font-medium text-left">Market</th>
                <th className="px-2 py-1 font-medium text-left">Type</th>
                <th className="px-2 py-1 font-medium text-left">Side</th>
                <th className="px-2 py-1 font-medium text-left">Amount</th>
                <th className="px-2 py-1 font-medium text-left">Price</th>
                <th className="px-2 py-1 font-medium text-left">Status</th>
                <th className="px-2 py-1 font-medium text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-neutral-800">
                  <td className="px-2 py-1">{order.market}</td>
                  <td className="px-2 py-1">{order.order_type}</td>
                  <td className="px-2 py-1">{order.position_type}</td>
                  <td className="px-2 py-1">{order.amount}</td>
                  <td className="px-2 py-1">${order.entry_price}</td>
                  <td className="px-2 py-1">{order.status}</td>
                  <td className="px-2 py-1">{format(new Date(order.created_at), 'MMM d, HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}