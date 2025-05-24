'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Token } from '@/lib/types';
import { fetchTopTokens, getPriceWebSocketUrl, formatPrice } from '@/lib/api';

export interface TokenSelectProps {
  tokens: Token[];
  onSelect: (token: Token) => void;
  selectedToken?: Token;
}

export default function TokenSelect({ tokens, onSelect, selectedToken }: TokenSelectProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection for all tokens
  const initializeWebSocket = useCallback((tokenList: Token[]) => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Create streams string for all tokens
    const streams = tokenList.map(token => `${token.id.toLowerCase()}@ticker`).join('/');
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.data) {
        setLivePrices(prev => ({
          ...prev,
          [data.data.s]: parseFloat(data.data.c) // 'c' is the last price
        }));
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    wsRef.current = ws;
    return ws;
  }, []);

  // Initialize live prices
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Initialize live prices
    const initialPrices: Record<string, number> = {};
    tokens.forEach(token => {
      initialPrices[token.id] = token.current_price;
    });
    setLivePrices(initialPrices);

    // Initialize WebSocket connection
    initializeWebSocket(tokens);
    setLoading(false);

    // Cleanup WebSocket connection
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [tokens, initializeWebSocket]);

  // Filter tokens based on search query
  const filteredTokens = tokens?.filter(token => 
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedToken ? (
            <div className="flex items-center gap-2">
              <img 
                src={selectedToken.image} 
                alt={selectedToken.name} 
                className="w-6 h-6 rounded-full"
              />
              <span>{selectedToken.symbol}</span>
              <span className="text-muted-foreground">
                ${formatPrice(livePrices[selectedToken.id] || selectedToken.current_price)}
              </span>
            </div>
          ) : (
            "Select token..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search token..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No token found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading tokens...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">{error}</div>
            ) : filteredTokens?.length ? (
              filteredTokens.map((token) => (
                <CommandItem
                  key={token.id}
                  value={token.id}
                  onSelect={() => {
                    onSelect(token);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <img 
                        src={token.image} 
                        alt={token.name} 
                        className="w-6 h-6 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-sm text-muted-foreground">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ${formatPrice(livePrices[token.id] || token.current_price)}
                      </div>
                      <div className={cn(
                        "text-sm",
                        token.price_change_percentage_24h >= 0 
                          ? "text-green-500" 
                          : "text-red-500"
                      )}>
                        {token.price_change_percentage_24h >= 0 ? '+' : ''}
                        {token.price_change_percentage_24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedToken?.id === token.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">No tokens found</div>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
