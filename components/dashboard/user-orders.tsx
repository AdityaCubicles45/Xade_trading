'use client';

import { useState, useEffect } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [typeFilter, setTypeFilter] = useState<OrderType>('all');

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const walletAddress = localStorage.getItem('walletAddress');
      if (!walletAddress) {
        setError('No wallet address found');
        return;
      }

      const fetchedOrders = await getUserOrders(walletAddress);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [ordersReloadSignal]);

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (typeFilter !== 'all' && order.order_type !== typeFilter) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getPositionTypeIcon = (type: string) => {
    return type === 'Buy' ? 
      <ArrowUpRight className="w-4 h-4 text-green-500" /> : 
      <ArrowDownRight className="w-4 h-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="w-full bg-black px-4 py-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white text-base font-semibold">Orders</span>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-800 rounded"></div>
          <div className="h-4 bg-neutral-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-black px-4 py-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white text-base font-semibold">Orders</span>
        </div>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <div className="w-full bg-black px-4 py-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white text-base font-semibold">Orders</span>
        </div>
        <div className="flex flex-col items-center justify-center h-full w-full py-8">
          <div className="flex flex-col items-center">
            <svg width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#23262F"/><path d="M24 16v16M16 24h16" stroke="#8F939E" strokeWidth="2" strokeLinecap="round"/></svg>
            <span className="mt-4 text-neutral-500 text-base">No orders found</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black px-4 py-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white text-base font-semibold">Orders</span>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus)}>
            <SelectTrigger className="w-[120px] h-8 bg-neutral-900 border-neutral-800 text-xs">
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
            <SelectTrigger className="w-[120px] h-8 bg-neutral-900 border-neutral-800 text-xs">
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
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-white">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="px-2 py-1 font-medium text-left">Market</th>
              <th className="px-2 py-1 font-medium text-left">Type</th>
              <th className="px-2 py-1 font-medium text-left">Side</th>
              <th className="px-2 py-1 font-medium text-left">Amount</th>
              <th className="px-2 py-1 font-medium text-left">Price</th>
              <th className="px-2 py-1 font-medium text-left">Total</th>
              <th className="px-2 py-1 font-medium text-left">Status</th>
              <th className="px-2 py-1 font-medium text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-neutral-800">
                <td className="px-2 py-1">{order.market}</td>
                <td className="px-2 py-1">{order.order_type}</td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-1">
                    {getPositionTypeIcon(order.position_type)}
                    <span>{order.position_type}</span>
                  </div>
                </td>
                <td className="px-2 py-1">{order.amount.toFixed(4)}</td>
                <td className="px-2 py-1">${order.entry_price.toFixed(2)}</td>
                <td className="px-2 py-1">${(order.amount * order.entry_price).toFixed(2)}</td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-1">
                    {getStatusIcon(order.status)}
                    <span className={cn(
                      order.status === 'filled' ? 'text-green-500' :
                      order.status === 'cancelled' ? 'text-red-500' :
                      'text-yellow-500'
                    )}>
                      {order.status}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-1">{format(new Date(order.created_at), 'MMM d, HH:mm')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}