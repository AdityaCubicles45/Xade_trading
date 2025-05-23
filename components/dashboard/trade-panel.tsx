'use client';

import { useState, useEffect } from 'react';
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

interface TradePanelProps {
  market: string;
}

export function TradePanel({ market }: TradePanelProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(0);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [price, setPrice] = useState<number>(50000); // Mock price
  const [total, setTotal] = useState<number>(0);
  const [balance, setBalance] = useState<number>(10000);
  const [walletAddress, setWalletAddress] = useState<string>('');
  
  useEffect(() => {
    // Calculate total based on amount and price
    setTotal(amount * price);
    
    // Get user balance
    const getUser = async () => {
      const walletAddr = localStorage.getItem('walletAddress') || '';
      setWalletAddress(walletAddr);
      
      if (walletAddr) {
        const user = await getCurrentUser(walletAddr);
        if (user) {
          setBalance(user.current_balance);
        }
      }
    };
    
    getUser();
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

  const handleBuy = async () => {
    if (amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    if (total > balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance to place this order",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await createOrder(
        walletAddress,
        market,
        'Buy',
        amount,
        price
      );
      
      if (result) {
        toast({
          title: "Order placed successfully",
          description: `Bought ${amount.toFixed(4)} ${market} at $${price.toFixed(2)}`,
        });
        
        // Refresh balance
        const user = await getCurrentUser(walletAddress);
        if (user) {
          setBalance(user.current_balance);
        }
      } else {
        toast({
          title: "Failed to place order",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error placing order",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSell = async () => {
    if (amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await createOrder(
        walletAddress,
        market,
        'Sell',
        amount,
        price
      );
      
      if (result) {
        toast({
          title: "Order placed successfully",
          description: `Sold ${amount.toFixed(4)} ${market} at $${price.toFixed(2)}`,
        });
        
        // Refresh balance
        const user = await getCurrentUser(walletAddress);
        if (user) {
          setBalance(user.current_balance);
        }
      } else {
        toast({
          title: "Failed to place order",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error placing order",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Place Order</CardTitle>
        <CardDescription>Available Balance: ${balance.toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="market" value={orderType} onValueChange={(value) => setOrderType(value as 'market' | 'limit')}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="market" className="flex-1">Market</TabsTrigger>
            <TabsTrigger value="limit" className="flex-1">Limit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="market">
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount || ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="font-mono"
                  step="0.0001"
                  min="0"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
                <Slider
                  defaultValue={[0]}
                  max={100}
                  step={1}
                  onValueChange={handleSliderChange}
                />
              </div>
              
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  readOnly
                  className="font-mono"
                />
              </div>
              
              <div>
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  type="number"
                  value={total.toFixed(2)}
                  readOnly
                  className="font-mono"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={handleBuy}
                >
                  Buy
                </Button>
                <Button 
                  className="w-full bg-red-500 hover:bg-red-600"
                  onClick={handleSell}
                >
                  Sell
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="limit">
            <div className="space-y-4">
              <div>
                <Label htmlFor="limit-price">Limit Price</Label>
                <Input
                  id="limit-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value))}
                  className="font-mono"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div>
                <Label htmlFor="limit-amount">Amount</Label>
                <Input
                  id="limit-amount"
                  type="number"
                  value={amount || ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="font-mono"
                  step="0.0001"
                  min="0"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
                <Slider
                  defaultValue={[0]}
                  max={100}
                  step={1}
                  onValueChange={handleSliderChange}
                />
              </div>
              
              <div>
                <Label htmlFor="limit-total">Total</Label>
                <Input
                  id="limit-total"
                  type="number"
                  value={total.toFixed(2)}
                  readOnly
                  className="font-mono"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={handleBuy}
                >
                  Buy
                </Button>
                <Button 
                  className="w-full bg-red-500 hover:bg-red-600"
                  onClick={handleSell}
                >
                  Sell
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}