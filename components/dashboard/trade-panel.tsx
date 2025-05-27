'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { createOrder } from '@/lib/trading';
import { Loader } from 'lucide-react';
import { usePositionsReload } from './PositionsReloadContext';

interface TradePanelProps {
  market: string;
  currentPrice?: number;
}

export function TradePanel({ market, currentPrice = 0 }: TradePanelProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(0);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [price, setPrice] = useState<number>(currentPrice);
  const [total, setTotal] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const userFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const CACHE_DURATION = 60000; // 1 minute cache
  const { reloadPositions } = usePositionsReload();
  const [summaryOpen, setSummaryOpen] = useState(true);
  
  useEffect(() => {
    // Update price when currentPrice changes
    if (currentPrice > 0) {
      setPrice(currentPrice);
    }
  }, [currentPrice]);
  
  useEffect(() => {
    // Calculate total based on amount and price
    setTotal(amount * price);
    
    // Get user balance with caching
    const getUser = async () => {
      const walletAddr = localStorage.getItem('walletAddress') || '';
      setWalletAddress(walletAddr);
      
      if (walletAddr) {
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
          const user = await getCurrentUser(walletAddr);
          if (user) {
            lastFetchTimeRef.current = now;
            setBalance(user.current_balance);
          }
        }, 1000); // Debounce for 1 second
      }
    };
    
    getUser();

    return () => {
      if (userFetchTimeoutRef.current) {
        clearTimeout(userFetchTimeoutRef.current);
      }
    };
  }, [amount, price]);

  const handleAmountChange = (value: string) => {
    const newAmount = parseFloat(value);
    if (!isNaN(newAmount)) {
      setAmount(newAmount);
    } else {
      setAmount(0);
    }
  };

  const handleSliderChange = (value: number[]) => {
    // Convert percentage to amount
    const percentage = value[0];
    const newAmount = (balance * percentage) / 100 / price;
    setAmount(newAmount);
  };

  const handleOrder = async (positionType: 'Buy' | 'Sell') => {
    if (!walletAddress) {
      toast({
        title: "Not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    if (positionType === 'Buy' && total > balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance to place this order",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Creating order with params:', {
        walletAddress,
        market,
        positionType,
        amount,
        price,
        orderType
      });

      const result = await createOrder(
        walletAddress,
        market,
        positionType,
        amount,
        price,
        orderType
      );
      
      if (result) {
        // Calculate new balance immediately
        const newBalance = positionType === 'Buy' 
          ? balance - total 
          : balance + total;
        
        // Update local balance state
        setBalance(newBalance);
        lastFetchTimeRef.current = Date.now();

        toast({
          title: "Order placed successfully",
          description: `${positionType} ${amount.toFixed(4)} ${market} at $${price.toFixed(2)}`,
        });
        
        // Reset form
        setAmount(0);
        
        // Fetch latest balance from server in background
        const user = await getCurrentUser(walletAddress);
        if (user) {
          setBalance(user.current_balance);
          lastFetchTimeRef.current = Date.now();
        }
        reloadPositions(); // Trigger positions reload
      } else {
        toast({
          title: "Failed to place order",
          description: "Please check your balance and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error placing order",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-black px-0 py-0 flex flex-col gap-0">
      {/* Account Summary Collapsible Header */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 cursor-pointer select-none" onClick={() => setSummaryOpen(!summaryOpen)}>
        <span className="text-white text-base font-semibold">ACCOUNT SUMMARY</span>
        <svg className={`w-4 h-4 text-white transition-transform ${summaryOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </div>
      {summaryOpen && (
        <div className="bg-black px-6 pb-2">
          <div className="flex flex-col gap-1 text-white text-sm mb-2">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Buying Power</span>
              <span className="text-white font-semibold">${balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Available Margin</span>
              <span className="text-white font-semibold">${balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Leverage</span>
              <span className="text-white font-semibold">x1</span>
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            <button className="flex-1 bg-neutral-900 text-white border border-neutral-800 rounded py-2 font-semibold">Deposit</button>
            <button className="flex-1 bg-neutral-900 text-white border border-neutral-800 rounded py-2 font-semibold">Withdraw</button>
              </div>
                </div>
      )}
      {/* Order Form */}
      <div className="bg-black px-6 pb-4 flex flex-col gap-2">
        <div className="flex gap-2 mb-2">
          <button 
            className={`flex-1 py-2 rounded text-white font-semibold ${orderType === 'market' ? 'bg-green-500' : 'bg-neutral-900 border border-neutral-800'}`} 
            onClick={() => setOrderType('market')}
          >
            MARKET
          </button>
          <button 
            className={`flex-1 py-2 rounded text-white font-semibold ${orderType === 'limit' ? 'bg-green-500' : 'bg-neutral-900 border border-neutral-800'}`} 
            onClick={() => setOrderType('limit')}
          >
            LIMIT
          </button>
              </div>
        <div className="flex gap-2 mb-2">
          <button 
            className="flex-1 bg-green-500 text-white font-semibold rounded py-2"
                  onClick={() => handleOrder('Buy')}
                  disabled={isLoading}
                >
            {isLoading ? 'PLACING ORDER...' : 'BUY/LONG'}
          </button>
          <button 
            className="flex-1 bg-red-500 text-white font-semibold rounded py-2"
                  onClick={() => handleOrder('Sell')}
                  disabled={isLoading}
                >
            {isLoading ? 'PLACING ORDER...' : 'SELL/SHORT'}
          </button>
              </div>
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 text-xs">Order value</span>
            <input 
                  type="number"
                  value={amount || ''}
              onChange={e => handleAmountChange(e.target.value)} 
              className="bg-neutral-900 text-white text-xs rounded px-2 py-1 w-24 border border-neutral-800 focus:outline-none" 
              placeholder="0" 
            />
            <span className="text-neutral-400 text-xs">USDC</span>
            <span className="text-neutral-400 text-xs">{market}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-neutral-400">
            <span>Order Size:</span>
            <span className="text-white">{amount.toFixed(4)} {market}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-xs text-neutral-400 mb-2">
          <div className="flex justify-between items-center">
            <span>Market</span>
            <span className="text-white">{market}</span>
              </div>
          <div className="flex justify-between items-center">
            <span>Estimated entry price:</span>
            <span className="text-white">${price.toFixed(2)}</span>
                </div>
          <div className="flex justify-between items-center">
            <span>Total Value:</span>
            <span className="text-white">${total.toFixed(2)}</span>
              </div>
          <div className="flex justify-between items-center">
            <span>Fees:</span>
            <span className="text-white">${(total * 0.001).toFixed(2)} USDC</span>
              </div>
              </div>
              </div>
            </div>
  );
}