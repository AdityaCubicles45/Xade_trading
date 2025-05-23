'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Token } from '@/lib/types';
import { formatPrice } from '@/lib/api';

interface TradeButtonsProps {
  selectedToken: Token | undefined;
  currentPrice: number;
}

export function TradeButtons({ selectedToken, currentPrice }: TradeButtonsProps) {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!selectedToken || !amount) return;

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log the trade details
      console.log(`Placing ${type} order:`, {
        token: selectedToken.symbol,
        amount: parseFloat(amount),
        price: currentPrice,
        total: parseFloat(amount) * currentPrice
      });

      // Here you would typically make an API call to your backend
      // For now, we'll just show a success message
      alert(`${type.toUpperCase()} order placed successfully!\nAmount: ${amount} ${selectedToken.symbol}\nPrice: $${formatPrice(currentPrice)}\nTotal: $${formatPrice(parseFloat(amount) * currentPrice)}`);
      
      // Clear the input after successful trade
      setAmount('');
    } catch (error) {
      console.error(`Error placing ${type} order:`, error);
      alert(`Failed to place ${type} order. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Trade {selectedToken?.symbol || 'Token'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
              min="0"
              step="0.0001"
            />
            <span className="text-sm text-muted-foreground">
              {selectedToken?.symbol}
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            Current Price: ${formatPrice(currentPrice)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="default"
              className="bg-green-500 hover:bg-green-600"
              onClick={() => handleTrade('buy')}
              disabled={!selectedToken || !amount || isLoading}
            >
              {isLoading ? 'Buying...' : 'Buy'}
            </Button>
            <Button
              variant="default"
              className="bg-red-500 hover:bg-red-600"
              onClick={() => handleTrade('sell')}
              disabled={!selectedToken || !amount || isLoading}
            >
              {isLoading ? 'Selling...' : 'Sell'}
            </Button>
          </div>

          {amount && selectedToken && (
            <div className="text-sm text-muted-foreground">
              Total: ${formatPrice(parseFloat(amount) * currentPrice)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 