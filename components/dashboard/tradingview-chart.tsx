'use client';

import { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol: string;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
  interval?: '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M';
  timezone?: string;
  studies?: string[];
  showDrawingTools?: boolean;
  showIndicators?: boolean;
  showVolume?: boolean;
  showTimeScale?: boolean;
  showToolbar?: boolean;
}

export function TradingViewChart({
  symbol,
  theme = 'dark',
  width = '100%',
  height = 500,
  interval = 'D',
  timezone = 'Etc/UTC',
  studies = [
    'RSI@tv-basicstudies',
    'MASimple@tv-basicstudies',
    'MACD@tv-basicstudies',
    'Volume@tv-basicstudies',
    'BB@tv-basicstudies'
  ],
  showDrawingTools = true,
  showIndicators = true,
  showVolume = true,
  showTimeScale = true,
  showToolbar = true
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widget, setWidget] = useState<any>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Only load the script once
    if (!scriptLoadedRef.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        initializeWidget();
      };
      document.head.appendChild(script);
    } else if (scriptLoadedRef.current) {
      initializeWidget();
    }

    return () => {
      if (widget) {
        widget.remove();
        setWidget(null);
      }
    };
  }, [symbol]); // Only reinitialize when symbol changes

  const initializeWidget = () => {
    if (typeof window.TradingView !== 'undefined' && containerRef.current) {
      const newWidget = new window.TradingView.widget({
        // Basic configuration
        container_id: containerRef.current.id,
        symbol: symbol,
        interval: interval,
        timezone: timezone,
        theme: theme,
        style: '1',
        locale: 'en',
        
        // Size and layout
        width: width,
        height: height,
        fullscreen: false,
        autosize: true,
        
        // Features
        studies: showIndicators ? studies : [],
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
        save_image: true,
        hide_side_toolbar: !showToolbar,
        allow_symbol_change: true,
        enable_publishing: false,
        hide_volume: !showVolume,
        hide_drawing_toolbar: !showDrawingTools,
        hide_time_scale: !showTimeScale,
        
        // Toolbar configuration
        toolbar_bg: theme === 'dark' ? '#1e222d' : '#f1f3f6',
        overrides: {
          "mainSeriesProperties.candleStyle.upColor": "#26a69a",
          "mainSeriesProperties.candleStyle.downColor": "#ef5350",
          "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
          "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
          "paneProperties.background": theme === 'dark' ? "#131722" : "#ffffff",
          "paneProperties.vertGridProperties.color": theme === 'dark' ? "#2a2e39" : "#e0e3eb",
          "paneProperties.horzGridProperties.color": theme === 'dark' ? "#2a2e39" : "#e0e3eb",
          "scalesProperties.textColor": theme === 'dark' ? "#AAA" : "#333",
        },
        
        // Loading indicator
        loading_screen: { backgroundColor: theme === 'dark' ? "#131722" : "#ffffff" },
        
        // Custom CSS
        custom_css_url: 'https://s3.tradingview.com/tv.css'
      });

      setWidget(newWidget);
    }
  };

  return (
    <div 
      id={`tradingview_${symbol}`} 
      ref={containerRef}
      style={{ 
        width, 
        height,
        backgroundColor: theme === 'dark' ? '#131722' : '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
}

// Add TradingView types
declare global {
  interface Window {
    TradingView: any;
  }
} 