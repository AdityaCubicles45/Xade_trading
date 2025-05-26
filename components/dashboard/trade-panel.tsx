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
import { Loader } from 'lucide-react';

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
  
  useEffect(() => {
    // Update price when currentPrice changes
    if (currentPrice > 0) {
      setPrice(currentPrice);
    }
  }, [currentPrice]);
  
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
        toast({
          title: "Order placed successfully",
          description: `${positionType} ${amount.toFixed(4)} ${market} at $${price.toFixed(2)}`,
        });
        
        // Reset form
        setAmount(0);
        
        // Refresh balance
        const user = await getCurrentUser(walletAddress);
        if (user) {
          setBalance(user.current_balance);
        }
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
    <Card className="bg-[#1E1F25] border border-[#2D2E36] rounded-lg shadow-sm">
      <CardHeader className="pb-2 border-b border-[#2D2E36]">
        <CardTitle className="text-[#F5F5F7] text-lg">Place Order</CardTitle>
        <CardDescription className="text-[#8F939E]">Available Balance: ${balance.toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="market" value={orderType} onValueChange={(value) => setOrderType(value as 'market' | 'limit')}>
          <TabsList className="w-full mb-4 bg-[#2D2E36] p-1 h-10">
            <TabsTrigger value="market" className="flex-1 data-[state=active]:bg-[#3A3B45] data-[state=active]:text-white">Market</TabsTrigger>
            <TabsTrigger value="limit" className="flex-1 data-[state=active]:bg-[#3A3B45] data-[state=active]:text-white">Limit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="market">
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-[#8F939E] text-sm">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount || ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="font-mono bg-[#2D2E36] border-[#3A3B45] text-white h-10"
                  step="0.0001"
                  min="0"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-[#8F939E] mb-2">
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
                  className="[&>span]:bg-[#4E9EFD] [&>span]:h-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleOrder('Buy')}
                  disabled={isLoading}
                  className="bg-[#0ECB81] hover:bg-[#0ECB81]/90 text-white h-10 font-medium"
                >
                  {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'Buy'}
                </Button>
                <Button
                  onClick={() => handleOrder('Sell')}
                  disabled={isLoading}
                  className="bg-[#F6465D] hover:bg-[#F6465D]/90 text-white h-10 font-medium"
                >
                  {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'Sell'}
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
                  value={price || ''}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
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
                <Label className="text-xs text-muted-foreground">Price</Label>
                <div className="font-mono text-lg">${price.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Total</Label>
                <div className="font-mono text-lg">${total.toFixed(2)}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleOrder('Buy')}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'Buy'}
                </Button>
                <Button
                  onClick={() => handleOrder('Sell')}
                  disabled={isLoading}
                  variant="destructive"
                >
                  {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : 'Sell'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}