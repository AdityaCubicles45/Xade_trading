'use client';

import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export function TradingViewChart({
  symbol = 'BTCUSDT',
  theme = 'dark',
  width = '100%',
  height = 500,
}: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined' && container.current) {
        new window.TradingView.widget({
          container_id: container.current.id,
          symbol: symbol,
          interval: 'D',
          theme: theme,
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          save_image: false,
          height: height,
          width: width,
          studies: [
            'RSI@tv-basicstudies',
            'MASimple@tv-basicstudies',
            'MACD@tv-basicstudies',
          ],
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [symbol, theme, width, height]);

  return (
    <div
      id="tradingview_widget"
      ref={container}
      className="w-full"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
} 