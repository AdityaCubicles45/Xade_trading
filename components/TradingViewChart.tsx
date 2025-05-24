'use client';

import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
  interval?: string;
  showDrawingTools?: boolean;
  showIndicators?: boolean;
  showVolume?: boolean;
  showTimeScale?: boolean;
  showToolbar?: boolean;
  studies?: string[];
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
  interval = 'D',
  showDrawingTools = true,
  showIndicators = true,
  showVolume = true,
  showTimeScale = true,
  showToolbar = true,
  studies = [
    'RSI@tv-basicstudies',
    'MASimple@tv-basicstudies',
    'MACD@tv-basicstudies',
    'Volume@tv-basicstudies',
    'BB@tv-basicstudies',
    'StochasticRSI@tv-basicstudies',
    'EMA@tv-basicstudies',
    'IchimokuCloud@tv-basicstudies',
  ],
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
          interval: interval,
          theme: theme,
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          save_image: false,
          height: height,
          width: width,
          studies: studies,
          show_popup_button: true,
          popup_width: '1000',
          popup_height: '650',
          withdateranges: true,
          hide_side_toolbar: !showDrawingTools,
          hide_top_toolbar: !showToolbar,
          studies_overrides: {},
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [symbol, theme, width, height, interval, showDrawingTools, showToolbar, studies]);

  return (
    <div
      id="tradingview_widget"
      ref={container}
      className="w-full"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}