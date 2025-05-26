'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PriceChartProps {
  market: string;
}

type Timeframe = {
  label: string;
  value: string;
  limit: number;
  visibleRange: number; // Number of candles to show by default
};

const TIMEFRAMES: Timeframe[] = [
  { label: '1 Minute', value: '1m', limit: 1000, visibleRange: 100 },
  { label: '5 Minutes', value: '5m', limit: 1000, visibleRange: 100 },
  { label: '15 Minutes', value: '15m', limit: 1000, visibleRange: 100 },
  { label: '30 Minutes', value: '30m', limit: 1000, visibleRange: 100 },
  { label: '1 Hour', value: '1h', limit: 1000, visibleRange: 100 },
  { label: '6 Hours', value: '6h', limit: 500, visibleRange: 50 },
  { label: '1 Day', value: '1d', limit: 500, visibleRange: 50 },
  { label: '1 Month', value: '1M', limit: 200, visibleRange: 30 },
  { label: '6 Months', value: '6M', limit: 200, visibleRange: 30 },
  { label: '1 Year', value: '1y', limit: 200, visibleRange: 30 },
];

export function PriceChart({ market }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [candlestickSeries, setCandlestickSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [currentCandle, setCurrentCandle] = useState<CandlestickData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(TIMEFRAMES[0]);

  // Initialize chart
  useEffect(() => {
    if (chartContainerRef.current) {
      const newChart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 500,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: 'rgba(197, 203, 206, 0.8)',
        },
      });

      const newCandlestickSeries = newChart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      setChart(newChart);
      setCandlestickSeries(newCandlestickSeries);

      const handleResize = () => {
        if (chartContainerRef.current) {
          newChart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        newChart.remove();
      };
    }
  }, []);

  // Update chart time scale when timeframe changes
  useEffect(() => {
    if (!chart || !candles.length) return;

    try {
      const visibleRange = selectedTimeframe.visibleRange;
      const lastCandle = candles[candles.length - 1];
      const firstVisibleCandle = candles[Math.max(0, candles.length - visibleRange)];

      // First fit the content to ensure proper scaling
      chart.timeScale().fitContent();

      // Then set the visible range
      if (firstVisibleCandle && lastCandle) {
        chart.timeScale().setVisibleRange({
          from: firstVisibleCandle.time,
          to: lastCandle.time,
        });
      }
    } catch (error) {
      console.error('Error updating chart time scale:', error);
    }
  }, [chart, candles, selectedTimeframe]);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        // Fetch initial klines data
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${market}&interval=${selectedTimeframe.value}&limit=${selectedTimeframe.limit}`
        );
        const data = await response.json();
        
        const initialCandles = data.map((candle: any[]) => ({
          time: Math.floor(candle[0] / 1000) as UTCTimestamp,
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
        }));

        setCandles(initialCandles);
        if (candlestickSeries) {
          candlestickSeries.setData(initialCandles);
        }

        // Initialize WebSocket for real-time updates
        if (wsRef.current) {
          wsRef.current.close();
        }

        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${market.toLowerCase()}@kline_${selectedTimeframe.value}`);
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const kline = data.k;
          
          const newCandle: CandlestickData = {
            time: Math.floor(kline.t / 1000) as UTCTimestamp,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
          };

          if (kline.x) {
            // Candle is closed
            setCandles(prev => {
              const updatedCandles = [...prev];
              // Find and update the existing candle or add a new one
              const index = updatedCandles.findIndex(c => c.time === newCandle.time);
              if (index !== -1) {
                updatedCandles[index] = newCandle;
              } else {
                updatedCandles.push(newCandle);
              }
              // Keep only the last N candles based on the limit
              return updatedCandles.slice(-selectedTimeframe.limit);
            });
            setCurrentCandle(null);
          } else {
            // Candle is still forming
            setCurrentCandle(newCandle);
          }

          // Update chart
          if (candlestickSeries) {
            if (kline.x) {
              // For closed candles, update the existing data
              candlestickSeries.update(newCandle);
            } else {
              // For forming candles, update the current candle
              const allCandles = [...candles];
              if (currentCandle) {
                const index = allCandles.findIndex(c => c.time === currentCandle.time);
                if (index !== -1) {
                  allCandles[index] = newCandle;
                } else {
                  allCandles.push(newCandle);
                }
              } else {
                allCandles.push(newCandle);
              }
              candlestickSeries.setData(allCandles);
            }
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          // Attempt to reconnect on error
          setTimeout(() => {
            if (wsRef.current === ws) {
              initializeWebSocket();
            }
          }, 5000);
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed');
          // Attempt to reconnect after a delay
          setTimeout(() => {
            if (wsRef.current === ws) {
              initializeWebSocket();
            }
          }, 5000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Error initializing chart:', error);
      }
    };

    initializeWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [market, candlestickSeries, selectedTimeframe]);

  const handleTimeframeChange = (value: string) => {
    const timeframe = TIMEFRAMES.find(t => t.value === value);
    if (timeframe) {
      setSelectedTimeframe(timeframe);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Price Chart - {market}</CardTitle>
          <Select
            value={selectedTimeframe.value}
            onValueChange={handleTimeframeChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((timeframe) => (
                <SelectItem key={timeframe.value} value={timeframe.value}>
                  {timeframe.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} className="w-full h-[500px]" />
      </CardContent>
    </Card>
  );
}