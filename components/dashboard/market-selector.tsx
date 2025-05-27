'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Token } from '@/lib/types';
import { formatPercentage, formatPrice, initializeWebSocket, closeWebSocket } from '@/lib/api';
import { getCurrentUser } from '@/lib/api';
import Image from 'next/image';

interface MarketSelectorProps {
  selectedMarket: string;
  onMarketChange: (market: string) => void;
  tokens: any[];
}

const FALLBACK_LOGO = 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png';

export function MarketSelector({ selectedMarket, onMarketChange, tokens }: MarketSelectorProps) {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<{ direction: 'up' | 'down' | null; price: number | null }>({
    direction: null,
    price: null
  });

  // Get the current token symbol from the selected market
  const currentTokenSymbol = selectedMarket.replace('USDT', '');
  const currentToken = tokens.find(token => token.symbol === currentTokenSymbol);
  const [logoSrc, setLogoSrc] = useState(currentToken?.image || FALLBACK_LOGO);

  useEffect(() => {
    setLogoSrc(currentToken?.image || FALLBACK_LOGO);
  }, [currentTokenSymbol, currentToken]);

  useEffect(() => {
    // Initialize WebSocket for real-time price updates
    const ws = initializeWebSocket([selectedMarket]);

    // Listen for price updates
    const handlePriceUpdate = (event: CustomEvent) => {
      if (event.detail.symbol === selectedMarket) {
        const newPrice = event.detail.price;
        if (currentPrice) {
          setPriceChange({
            direction: newPrice > currentPrice ? 'up' : 'down',
            price: newPrice
          });
        }
        setCurrentPrice(newPrice);
      }
    };

    window.addEventListener('priceUpdate', handlePriceUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('priceUpdate', handlePriceUpdate as EventListener);
      closeWebSocket();
    };
  }, [selectedMarket, currentPrice]);

  // Dummy stats for now; replace with real data as needed
  const stats = {
    change24h: '1.304%',
    volume24h: '$20.57M',
    openInterest: '$3.28M',
    fundingRate: '0.0100%'
  };

  return (
    <div className="flex items-center justify-between px-8 py-0 bg-black border-b border-neutral-800 h-16">
      {/* Market Dropdown */}
      <div className="flex items-center gap-3 min-w-[220px]">
        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
          <Image
            src={logoSrc}
            alt={currentTokenSymbol}
            width={32}
            height={32}
            className="object-contain"
            onError={() => setLogoSrc(FALLBACK_LOGO)}
          />
        </div>
        <select
          value={selectedMarket}
          onChange={e => onMarketChange(e.target.value)}
          className="bg-transparent text-white text-lg font-semibold rounded px-2 py-1 focus:outline-none appearance-none"
          style={{ minWidth: 90 }}
        >
          {tokens.map(token => (
            <option key={token.symbol} value={`${token.symbol}USDT`}>
              {token.symbol}/USD
            </option>
          ))}
        </select>
        <ChevronDown className="w-5 h-5 text-white" />
        {selectedMarket && (
          <span className={`text-xl font-bold ml-2 transition-colors duration-200 ${
            priceChange.direction === 'up' ? 'text-green-400' : 
            priceChange.direction === 'down' ? 'text-red-400' : 
            'text-white'
          }`}>
            ${currentPrice ? formatPrice(currentPrice) : '...'}
          </span>
        )}
      </div>
      {/* Stats Row */}
      <div className="flex items-center gap-8 text-white text-sm mx-auto">
        <div>24h Change <span className="text-green-400">{stats.change24h}</span></div>
        <div>24H Volume <span className="text-neutral-400">{stats.volume24h}</span></div>
        <div>Open Interest <span className="text-neutral-400">{stats.openInterest}</span></div>
        <div>Est Funding Rate <span className="text-neutral-400">{stats.fundingRate}</span></div>
      </div>
      <div className="w-32" /> {/* Spacer for right alignment */}
    </div>
  );
}
