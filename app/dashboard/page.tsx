'use client';

import { useState, useEffect, useRef } from 'react';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { MarketSelector } from '@/components/dashboard/market-selector';
import { TradePanel } from '@/components/dashboard/trade-panel';
import { TradingViewChart } from '@/components/dashboard/tradingview-chart';
import { OrderBook } from '@/components/dashboard/order-book';
import { UserPositions } from '@/components/dashboard/user-positions';
import { UserOrders } from '@/components/dashboard/user-orders';
import { Skeleton } from '@/components/ui/skeleton';
import { Token } from '@/lib/types';
import { fetchTopTokens, initializeWebSocket, closeWebSocket } from '@/lib/api';
import { isAuthenticated, getWalletAddress, updateUserBalance } from '@/lib/auth';
import TokenSelect from '@/components/ui/token-select';
import { TradeButtons } from '@/components/dashboard/trade-buttons';
import { PositionsReloadProvider } from '@/components/dashboard/PositionsReloadContext';

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<string>('BTCUSDT');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | undefined>();
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const priceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [ordersReloadSignal, setOrdersReloadSignal] = useState(0);
  const reloadOrders = () => setOrdersReloadSignal((prev) => prev + 1);

  useEffect(() => {
    const initializeDashboard = async () => {
      setIsClient(true);

      // Check authentication
      if (!isAuthenticated()) {
        console.log('User not authenticated, redirecting to home...');
        redirect('/');
        return;
      }

      // Handle selected balance from pricing page
      const selectedBalance = localStorage.getItem('selectedBalance');
      const walletAddress = localStorage.getItem('walletAddress');
      if (selectedBalance && walletAddress) {
        // Update the user's balance in the database
        await updateUserBalance(walletAddress, Number(selectedBalance), 0);
        // Trigger a storage event to update other components
        window.dispatchEvent(new Event('storage'));
        localStorage.removeItem('selectedBalance');
      }

      // Fetch top tokens
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

    initializeDashboard();
  }, []);

  useEffect(() => {
    // Initialize WebSocket for all tokens
    if (tokens.length > 0) {
      const symbols = tokens.map(token => token.id);
      initializeWebSocket(symbols);
    }

    // Listen for price updates with debouncing
    const handlePriceUpdate = (event: CustomEvent) => {
      const { symbol, price } = event.detail;
      if (selectedToken?.id === symbol) {
        // Clear any existing timeout
        if (priceUpdateTimeoutRef.current) {
          clearTimeout(priceUpdateTimeoutRef.current);
        }
        
        // Set a new timeout to update the price
        priceUpdateTimeoutRef.current = setTimeout(() => {
          setCurrentPrice(price);
        }, 100); // Debounce for 100ms
      }
    };

    window.addEventListener('priceUpdate', handlePriceUpdate as EventListener);

    // Cleanup WebSocket connection and event listener
    return () => {
      window.removeEventListener('priceUpdate', handlePriceUpdate as EventListener);
      closeWebSocket();
      if (priceUpdateTimeoutRef.current) {
        clearTimeout(priceUpdateTimeoutRef.current);
      }
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
    <PositionsReloadProvider>
      <div className="flex flex-col min-h-screen bg-black">
        <DashboardHeader />
        {/* Market Selector at the very top, spanning full width */}
        <MarketSelector 
          selectedMarket={selectedMarket}
          onMarketChange={handleMarketChange}
          tokens={tokens}
        />
        {/* Main content row: Chart | Order Book | Trade Panel */}
        <div className="flex flex-row w-full bg-black border-b border-neutral-800" style={{height: '420px', minHeight: '420px', maxHeight: '420px'}}>
          {/* Chart */}
          <div className="flex-1 min-w-0 h-full m-0 p-0 overflow-hidden flex flex-col">
            <div className="h-full w-full">
              <TradingViewChart symbol={selectedMarket} />
            </div>
          </div>
          {/* Order Book */}
          <div className="w-[340px] h-full border-l border-neutral-800 m-0 p-0 overflow-hidden flex flex-col">
            <OrderBook market={selectedMarket} />
          </div>
          {/* Trade Panel */}
          <div className="w-[340px] h-full border-l border-neutral-800 m-0 p-0 overflow-hidden flex flex-col">
            <TradePanel market={selectedMarket} currentPrice={currentPrice} />
          </div>
        </div>
        {/* Portfolio Bar below main content row */}
        <div className="flex flex-row items-center justify-between w-full px-8 py-0 bg-black border-b border-neutral-800 h-16">
          <div className="flex flex-col items-start justify-center">
            <span className="text-xs text-neutral-400">Portfolio Value</span>
            <span className="text-white text-lg font-semibold">$0.000</span>
          </div>
          <div className="flex flex-col items-start justify-center">
            <span className="text-xs text-neutral-400">PnL</span>
            <span className="text-green-400 text-lg font-semibold">0(0.00000%)</span>
          </div>
          <div className="flex flex-col items-start justify-center">
            <span className="text-xs text-neutral-400">Leverage</span>
            <span className="text-white text-lg font-semibold">0.00x</span>
          </div>
          <div className="flex flex-col items-start justify-center">
            <span className="text-xs text-neutral-400">Xade Shards</span>
            <span className="text-orange-400 text-lg font-semibold">0</span>
          </div>
          <div className="flex flex-col items-start justify-center">
            <span className="text-xs text-neutral-400">$ORDER</span>
            <span className="text-blue-400 text-lg font-semibold">0</span>
          </div>
        </div>
        {/* Positions and Orders row below portfolio bar */}
        <div className="flex flex-row w-full bg-black min-h-0 border-t border-neutral-800" style={{height: '180px'}}>
          <div className="flex-1 flex flex-col border-r border-neutral-800 min-h-0">
            <UserPositions reloadOrders={reloadOrders} />
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <UserOrders ordersReloadSignal={ordersReloadSignal} />
          </div>
        </div>
      </div>
    </PositionsReloadProvider>
  );
}
