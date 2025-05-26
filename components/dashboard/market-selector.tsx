'use client';

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
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Token } from '@/lib/types';
import { formatPercentage } from '@/lib/api';

interface MarketSelectorProps {
  tokens: Token[];
  selectedMarket: string;
  onMarketChange: (market: string) => void;
}

export function MarketSelector({ tokens, selectedMarket, onMarketChange }: MarketSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  useEffect(() => {
    // Find the selected token from the list
    const token = tokens.find(t => `${t.symbol}USDT` === selectedMarket);
    if (token) {
      setSelectedToken(token);
    }
  }, [selectedMarket, tokens]);

  const handleSelect = (token: Token) => {
    const market = `${token.symbol}USDT`;
    onMarketChange(market);
    setSelectedToken(token);
    setOpen(false);
  };

  return (
    <div className="flex items-center space-x-4 bg-[#23262F] rounded-xl border border-[#23262F] p-4 shadow-md">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-[220px] justify-between font-mono bg-[#181A20] text-white border border-[#23262F] rounded-lg shadow-sm hover:bg-[#23262F]"
          >
            {selectedToken ? (
              <div className="flex items-center">
                {selectedToken.image && (
                  <img
                    src={selectedToken.image}
                    alt={selectedToken.name}
                    className="w-5 h-5 mr-2 rounded-full"
                  />
                )}
                <span>{selectedToken.symbol}/USDT</span>
              </div>
            ) : (
              "Select market..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-[#23262F] border-none shadow-lg" align="start">
          <Command>
            <CommandInput 
              placeholder="Search markets..." 
              value={searchValue}
              onValueChange={setSearchValue}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>No markets found.</CommandEmpty>
              <CommandGroup heading="Markets">
                {tokens.slice(0, 50).map((token) => (
                  <CommandItem
                    key={token.id}
                    value={`${token.symbol}-${token.name}`}
                    onSelect={() => handleSelect(token)}
                    className="flex justify-between"
                  >
                    <div className="flex items-center">
                      {token.image && (
                        <img
                          src={token.image}
                          alt={token.name}
                          className="w-5 h-5 mr-2 rounded-full"
                        />
                      )}
                      <span>{token.symbol}/USDT</span>
                    </div>
                    <span 
                      className={cn(
                        "text-xs font-mono",
                        token.price_change_percentage_24h > 0 
                          ? "text-green-500" 
                          : token.price_change_percentage_24h < 0 
                            ? "text-red-500" 
                            : "text-muted-foreground"
                      )}
                    >
                      {formatPercentage(token.price_change_percentage_24h)}
                    </span>
                    {`${token.symbol}USDT` === selectedMarket && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedToken && (
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="font-mono text-2xl">${selectedToken.current_price.toLocaleString()}</span>
            <span 
              className={cn(
                "text-xs font-mono",
                selectedToken.price_change_percentage_24h > 0 
                  ? "text-green-500" 
                  : selectedToken.price_change_percentage_24h < 0 
                    ? "text-red-500" 
                    : "text-muted-foreground"
              )}
            >
              {formatPercentage(selectedToken.price_change_percentage_24h)}
            </span>
          </div>
          
          <div className="hidden md:flex flex-col">
            <span className="text-xs text-muted-foreground">24h High</span>
            <span className="font-mono">$52,410.80</span>
          </div>
          
          <div className="hidden md:flex flex-col">
            <span className="text-xs text-muted-foreground">24h Low</span>
            <span className="font-mono">$48,121.35</span>
          </div>
          
          <div className="hidden lg:flex flex-col">
            <span className="text-xs text-muted-foreground">24h Volume</span>
            <span className="font-mono">$32.4B</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          {/* Token selector and market info */}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Balance: $1000</span>
          <Button variant="outline" size="sm">Deposit</Button>
          <Button variant="outline" size="sm">Withdraw</Button>
        </div>
      </div>
    </div>
  );
}
