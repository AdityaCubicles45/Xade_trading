'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice, formatVolume } from '@/lib/api';
import { OrderBookEntry } from '@/lib/types';

interface OrderBookProps {
  market: string;
}

export function OrderBook({ market }: OrderBookProps) {
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [priceChange, setPriceChange] = useState<{ direction: 'up' | 'down' | null; price: number | null }>({
    direction: null,
    price: null
  });

  // Calculate mid price
  const midPrice = asks.length > 0 && bids.length > 0
    ? (asks[0].price + bids[0].price) / 2
    : null;

  useEffect(() => {
    const initializeOrderBook = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate market symbol
        if (!market || !market.match(/^[A-Z0-9]+USDT$/)) {
          setError('Invalid market symbol');
          setLoading(false);
          return;
        }

        // Fetch initial orderbook data
        const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=${market}&limit=20`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || 'Failed to fetch orderbook');
        }
        const data = await response.json();
        
        if (!data.bids || !data.asks) {
          throw new Error('Invalid orderbook data received');
        }
        
        setBids(data.bids.map((bid: string[]) => ({
          price: parseFloat(bid[0]),
          quantity: parseFloat(bid[1])
        })));
        
        setAsks(data.asks.map((ask: string[]) => ({
          price: parseFloat(ask[0]),
          quantity: parseFloat(ask[1])
        })));

        // Initialize WebSocket for real-time updates
        if (wsRef.current) {
          wsRef.current.close();
        }

        const wsUrl = `wss://stream.binance.com:9443/ws/${market.toLowerCase()}@depth20@100ms`;
        const ws = new WebSocket(wsUrl);
        
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        
        ws.onopen = () => {
          console.log('OrderBook WebSocket connected successfully');
          setError(null);
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.e === 'depthUpdate') {
              const newMidPrice = asks.length > 0 && bids.length > 0
                ? (asks[0].price + bids[0].price) / 2
                : null;

              if (newMidPrice && midPrice) {
                setPriceChange({
                  direction: newMidPrice > midPrice ? 'up' : 'down',
                  price: newMidPrice
                });

                // Reset the price change direction after a short delay
                setTimeout(() => {
                  setPriceChange(prev => ({
                    ...prev,
                    direction: null
                  }));
                }, 1000);
              }

              setLastUpdateTime(Date.now());
              
              // Update bids
              if (data.b) {
                setBids(prevBids => {
                  const newBids = [...prevBids];
                  data.b.forEach((bid: string[]) => {
                    const price = parseFloat(bid[0]);
                    const quantity = parseFloat(bid[1]);
                    const index = newBids.findIndex(b => b.price === price);
                    
                    if (quantity === 0) {
                      if (index !== -1) {
                        newBids.splice(index, 1);
                      }
                    } else {
                      if (index !== -1) {
                        newBids[index] = { price, quantity };
                      } else {
                        newBids.push({ price, quantity });
                      }
                    }
                  });
                  return newBids.sort((a, b) => b.price - a.price).slice(0, 20);
                });
              }

              // Update asks
              if (data.a) {
                setAsks(prevAsks => {
                  const newAsks = [...prevAsks];
                  data.a.forEach((ask: string[]) => {
                    const price = parseFloat(ask[0]);
                    const quantity = parseFloat(ask[1]);
                    const index = newAsks.findIndex(a => a.price === price);
                    
                    if (quantity === 0) {
                      if (index !== -1) {
                        newAsks.splice(index, 1);
                      }
                    } else {
                      if (index !== -1) {
                        newAsks[index] = { price, quantity };
                      } else {
                        newAsks.push({ price, quantity });
                      }
                    }
                  });
                  return newAsks.sort((a, b) => a.price - b.price).slice(0, 20);
                });
              }
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('OrderBook WebSocket error:', error);
          setError('Failed to connect to orderbook stream');
        };

        ws.onclose = (event) => {
          console.log('OrderBook WebSocket connection closed:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            setTimeout(() => {
              if (wsRef.current === ws) {
                reconnectAttempts++;
                initializeOrderBook();
              }
            }, delay);
          } else {
            setError('Failed to maintain connection to orderbook stream');
          }
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Error initializing orderbook:', error);
        setError(error instanceof Error ? error.message : 'Failed to load orderbook');
      } finally {
        setLoading(false);
      }
    };

    initializeOrderBook();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [market]);

  // Calculate total volume for each level
  const calculateTotalVolume = (entries: OrderBookEntry[]) => {
    let total = 0;
    return entries.map(entry => {
      total += entry.quantity;
      return { ...entry, total };
    });
  };

  const bidsWithTotal = calculateTotalVolume(bids);
  const asksWithTotal = calculateTotalVolume(asks);

  // Find max total volume for scaling
  const maxTotal = Math.max(
    ...bidsWithTotal.map(b => b.total),
    ...asksWithTotal.map(a => a.total)
  );

  return (
    <div className="h-full w-full bg-black px-0 py-0 flex flex-col justify-start">
      <div className="flex justify-end items-center px-4 py-2 border-b border-neutral-800">
        <span className="text-white text-base font-semibold">Order Book</span>
      </div>
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-4">
        {/* Asks (Sell Orders) */}
        {asksWithTotal.slice(0, 10).map((ask, index) => (
          <div key={index} className="flex items-center text-xs py-0.5">
            <span className="w-16 text-right text-neutral-400">{ask.quantity}</span>
            <span className="w-20 text-center text-red-500">{formatPrice(ask.price)}</span>
            <span className="w-12 text-right text-neutral-400">-</span>
          </div>
        ))}
        {/* Mid Price with animation */}
        {midPrice && (
          <div className={`flex items-center py-1 bg-neutral-900 rounded my-1 transition-all duration-300 ${
            priceChange.direction === 'up' ? 'bg-green-900/30' : 
            priceChange.direction === 'down' ? 'bg-red-900/30' : ''
          }`}>
            <span className="w-16 text-xs text-neutral-400"></span>
            <span className={`w-20 text-center font-semibold transition-all duration-300 ${
              priceChange.direction === 'up' ? 'text-green-400 scale-110' : 
              priceChange.direction === 'down' ? 'text-red-400 scale-110' : 
              'text-white'
            }`}>
              {formatPrice(midPrice)}
            </span>
            <span className="w-12 text-xs text-neutral-400"></span>
          </div>
        )}
        {/* Bids (Buy Orders) */}
        {bidsWithTotal.slice(0, 10).map((bid, index) => (
          <div key={index} className="flex items-center text-xs py-0.5">
            <span className="w-16 text-right text-neutral-400">{bid.quantity}</span>
            <span className="w-20 text-center text-green-400">{formatPrice(bid.price)}</span>
            <span className="w-12 text-right text-neutral-400">-</span>
          </div>
        ))}
      </div>
    </div>
  );
}