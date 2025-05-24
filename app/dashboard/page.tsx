'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { MarketSelector } from '@/components/dashboard/market-selector';
import { TradePanel } from '@/components/dashboard/trade-panel';
import { TradingViewChart } from '@/components/TradingViewChart';
import { OrderBook } from '@/components/dashboard/order-book';
import { UserPositions } from '@/components/dashboard/user-positions';
import { UserOrders } from '@/components/dashboard/user-orders';
import { Skeleton } from '@/components/ui/skeleton';
import { Token } from '@/lib/types';
import { fetchTopTokens, fetchCurrentPrice } from '@/lib/api';
import { isAuthenticated, getWalletAddress } from '@/lib/auth';
import { TokenSelect } from '@/components/ui/token-select';
import { TradeButtons } from '@/components/dashboard/trade-buttons';

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<string>('BTCUSDT');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | undefined>();
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  useEffect(() => {
    setIsClient(true);
    
    // Check authentication
    if (!isAuthenticated()) {
      console.log('User not authenticated, redirecting to home...');
      redirect('/');
      return;
    }

    // Fetch top tokens
    const getTokens = async () => {
      try {
        setIsLoading(true);
        const tokensData = await fetchTopTokens();
        setTokens(tokensData);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getTokens();
  }, []);

  useEffect(() => {
    const getPrice = async () => {
      if (selectedMarket) {
        const price = await fetchCurrentPrice(selectedMarket);
        setCurrentPrice(price);
      }
    };
    getPrice();
  }, [selectedMarket]);

  // If not authenticated and on the client, redirect to home
  if (isClient && !isAuthenticated()) {
    console.log('Client-side auth check failed, redirecting...');
    redirect('/');
    return null;
  }

  const handleMarketChange = (market: string) => {
    setSelectedMarket(market);
  };

  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setCurrentPrice(token.current_price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex">
          <DashboardSidebar />
          <main className="flex-1 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <Skeleton className="h-[500px] rounded-lg" />
              <Skeleton className="h-[500px] rounded-lg" />
              <Skeleton className="h-[500px] rounded-lg" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-4">
          <div className="mb-4">
            <MarketSelector 
              tokens={tokens} 
              selectedMarket={selectedMarket} 
              onMarketChange={handleMarketChange}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <TokenSelect 
                tokens={tokens} 
                onSelect={handleTokenSelect}
                selectedToken={selectedToken}
              />
              {selectedToken && (
                <OrderBook market={selectedToken.id} />
              )}
            </div>
            <div>
              {selectedToken && (
                <TradeButtons 
                  selectedToken={selectedToken}
                  currentPrice={currentPrice}
                />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TradingViewChart 
                symbol={selectedMarket}
                theme="dark"
                height={500}
                interval="D"
                showDrawingTools={true}
                showIndicators={true}
                showVolume={true}
                showTimeScale={true}
                showToolbar={true}
                studies={[
                  'RSI@tv-basicstudies',
                  'MASimple@tv-basicstudies',
                  'MACD@tv-basicstudies',
                  'Volume@tv-basicstudies',
                  'BB@tv-basicstudies'
                ]}
              />
            </div>
            <div>
              <OrderBook market={selectedMarket} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <TradePanel 
                market={selectedMarket} 
                currentPrice={currentPrice}
              />
            </div>
            <div>
              <UserPositions />
            </div>
            <div>
              <UserOrders />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}