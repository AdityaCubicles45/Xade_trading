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
import { formatPercentage } from '@/lib/api';
import { getCurrentUser } from '@/lib/api';

interface MarketSelectorProps {
  selectedMarket: string;
  onMarketChange: (market: string) => void;
  tokens: any[];
}

export function MarketSelector({ selectedMarket, onMarketChange, tokens }: MarketSelectorProps) {
  // Dummy stats for now; replace with real data as needed
  const stats = {
    indexPrice: '109048.3',
    change24h: '1.304%',
    volume24h: '$20.57M',
    openInterest: '$3.28M',
    fundingRate: '0.0100%'
  };

  return (
    <div className="flex items-center justify-between px-8 py-0 bg-black border-b border-neutral-800 h-16">
      {/* Market Dropdown */}
      <div className="flex items-center gap-3 min-w-[220px]">
        <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg">₿</span>
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
        <span className="text-red-500 text-xl font-bold ml-2">$109,066.4</span>
      </div>
      {/* Stats Row */}
      <div className="flex items-center gap-8 text-white text-sm mx-auto">
        <div>Index Price <span className="text-neutral-400">${stats.indexPrice}</span></div>
        <div>24h Change <span className="text-green-400">{stats.change24h}</span></div>
        <div>24H Volume <span className="text-neutral-400">{stats.volume24h}</span></div>
        <div>Open Interest <span className="text-neutral-400">{stats.openInterest}</span></div>
        <div>Est Funding Rate <span className="text-neutral-400">{stats.fundingRate}</span></div>
      </div>
      <div className="w-32" /> {/* Spacer for right alignment */}
    </div>
  );
}
