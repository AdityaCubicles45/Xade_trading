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
        console.log('Initial orderbook data:', data);
        
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

        // Use the correct WebSocket URL format for Binance
        const wsUrl = `wss://stream.binance.com:9443/ws/${market.toLowerCase()}@depth20@100ms`;
        console.log('Connecting to WebSocket:', wsUrl);
        const ws = new WebSocket(wsUrl);
        
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        
        ws.onopen = () => {
          console.log('OrderBook WebSocket connected successfully');
          setError(null); // Clear any previous errors
          reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', data);
            
            // Handle snapshot and update events
            if (data.e === 'depthUpdate') {
              console.log('Processing depth update:', {
                bids: data.b,
                asks: data.a
              });
              
              // Update bids
              if (data.b) {
                setBids(prevBids => {
                  const newBids = [...prevBids];
                  data.b.forEach((bid: string[]) => {
                    const price = parseFloat(bid[0]);
                    const quantity = parseFloat(bid[1]);
                    const index = newBids.findIndex(b => b.price === price);
                    
                    if (quantity === 0) {
                      // Remove the price level if quantity is 0
                      if (index !== -1) {
                        newBids.splice(index, 1);
                      }
                    } else {
                      // Update or add the price level
                      if (index !== -1) {
                        newBids[index] = { price, quantity };
                      } else {
                        newBids.push({ price, quantity });
                      }
                    }
                  });
                  // Sort bids in descending order
                  const sortedBids = newBids.sort((a, b) => b.price - a.price).slice(0, 20);
                  console.log('Updated bids:', sortedBids);
                  return sortedBids;
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
                      // Remove the price level if quantity is 0
                      if (index !== -1) {
                        newAsks.splice(index, 1);
                      }
                    } else {
                      // Update or add the price level
                      if (index !== -1) {
                        newAsks[index] = { price, quantity };
                      } else {
                        newAsks.push({ price, quantity });
                      }
                    }
                  });
                  // Sort asks in ascending order
                  const sortedAsks = newAsks.sort((a, b) => a.price - b.price).slice(0, 20);
                  console.log('Updated asks:', sortedAsks);
                  return sortedAsks;
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
          
          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
            
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
    <Card className="bg-[#23262F] border-none rounded-xl shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>Order Book</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="h-[400px] flex items-center justify-center text-red-500">
            {error}
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Asks (Sell Orders) */}
            <div className="mb-2">
              <div className="text-sm font-medium text-red-500 mb-2">Asks</div>
              <div className="space-y-1">
                {asksWithTotal.slice(0, 10).map((ask, index) => (
                  <div key={index} className="relative">
                    <div 
                      className="absolute inset-0 bg-red-500/10"
                      style={{ 
                        width: `${(ask.total / maxTotal) * 100}%`,
                        right: 0
                      }}
                    />
                    <div className="relative flex justify-between text-sm">
                      <span className="text-red-500">{formatPrice(ask.price)}</span>
                      <span>{formatVolume(ask.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mid Price */}
            {midPrice && (
              <div className="py-3 px-4 bg-muted/50 border-y flex justify-between items-center my-2">
                <span className="text-sm font-medium">Mid Price</span>
                <span className="font-mono font-medium text-lg">${formatPrice(midPrice)}</span>
              </div>
            )}

            {/* Bids (Buy Orders) */}
            <div className="mt-2">
              <div className="text-sm font-medium text-green-500 mb-2">Bids</div>
              <div className="space-y-1">
                {bidsWithTotal.slice(0, 10).map((bid, index) => (
                  <div key={index} className="relative">
                    <div 
                      className="absolute inset-0 bg-green-500/10"
                      style={{ 
                        width: `${(bid.total / maxTotal) * 100}%`,
                        left: 0
                      }}
                    />
                    <div className="relative flex justify-between text-sm">
                      <span className="text-green-500">{formatPrice(bid.price)}</span>
                      <span>{formatVolume(bid.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}