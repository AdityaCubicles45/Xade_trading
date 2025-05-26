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
import { fetchTopTokens, initializeWebSocket, closeWebSocket } from '@/lib/api';
import { isAuthenticated, getWalletAddress } from '@/lib/auth';
import TokenSelect from '@/components/ui/token-select';
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
    // Initialize WebSocket for all tokens
    if (tokens.length > 0) {
      const symbols = tokens.map(token => token.id);
      initializeWebSocket(symbols);
    }

    // Listen for price updates
    const handlePriceUpdate = (event: CustomEvent) => {
      const { symbol, price } = event.detail;
      if (selectedToken?.id === symbol) {
        setCurrentPrice(price);
      }
    };

    window.addEventListener('priceUpdate', handlePriceUpdate as EventListener);

    // Cleanup WebSocket connection and event listener
    return () => {
      window.removeEventListener('priceUpdate', handlePriceUpdate as EventListener);
      closeWebSocket();
    };
  }, [tokens, selectedToken]);

  useEffect(() => {
    // Update selected token when market changes
    const token = tokens.find(t => `${t.symbol}USDT` === selectedMarket);
    if (token) {
      setSelectedToken(token);
    }
  }, [selectedMarket, tokens]);

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
    <div className="flex flex-col h-screen">
      <DashboardHeader />
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-rows-[auto_1fr] gap-4 p-4">
          {/* Market selector */}
          <MarketSelector 
            selectedMarket={selectedMarket}
            onMarketChange={handleMarketChange}
            tokens={tokens}
          />
          
          {/* Main content area with scrolling */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 h-[500px]">  {/* Chart container with fixed height */}
              <TradingViewChart />
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="h-[500px]">  {/* Order book with same height */}
                <OrderBook />
              </div>
              <div className="h-[500px]">  {/* Trade panel with same height */}
                <TradePanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
