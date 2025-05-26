import { useRef, useEffect, useState } from 'react';

interface TradingViewChartProps {
  symbol: string;
  theme: string;
  height: number;
  interval: string;
  showDrawingTools: boolean;
  showIndicators: boolean;
  showVolume: boolean;
  showTimeScale: boolean;
  showToolbar: boolean;
  studies: string[];
  buyPoints?: Array<{ timestamp: number; price: number; id: string }>;
  sellPoints?: Array<{ timestamp: number; price: number; id: string }>;
}

export function TradingViewChart({
  symbol,
  theme,
  height,
  interval,
  showDrawingTools,
  showIndicators,
  showVolume,
  showTimeScale,
  showToolbar,
  studies,
  buyPoints = [],
  sellPoints = []
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<any>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (!chartContainerRef.current) return;
      const tvWidget = new window.TradingView.widget({
        width: '100%',
        height: height,
        symbol: symbol,
        interval: interval,
        timezone: 'Etc/UTC',
        theme: theme,
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: chartContainerRef.current.id,
        datafeed: window.TradingView.widgetDatafeed,
        library_path: '/charting_library/',
        disabled_features: [
          'use_localstorage_for_settings'
        ],
        enabled_features: [
          'study_templates'
        ],
        charts_storage_url: 'https://saveload.tradingview.com',
        charts_storage_api_version: '1.1',
        client_id: 'tradingview.com',
        user_id: 'public_user_id',
        fullscreen: false,
        autosize: false,
        studies_overrides: {},
        overrides: {},
        custom_css_url: '',
        loading_screen: {
          backgroundColor: '#131722',
          foregroundColor: '#131722'
        },
        drawings_access: {
          type: 'black',
          tools: [
            'RegressionChannelDrawingTool',
            'FibonacciRetracementDrawingTool',
            'FibonacciArcDrawingTool',
            'FibonacciFanDrawingTool',
            'FibonacciTimeZonesDrawingTool',
            'TextDrawingTool',
            'TrendLineDrawingTool',
            'VerticalRayDrawingTool',
            'HorizontalRayDrawingTool',
            'RayDrawingTool',
            'LineDrawingTool',
            'CircleDrawingTool',
            'EllipseDrawingTool',
            'TriangleDrawingTool',
            'RectangleDrawingTool',
            'HorizontalLineDrawingTool',
            'VerticalLineDrawingTool',
            'ArrowSegmentDrawingTool',
            'MeasurementsSegmentDrawingTool',
            'TrendChannelDrawingTool',
            'ParallelChannelDrawingTool',
            ' AndrewsPitchforkDrawingTool',
            'EquidistantChannelDrawingTool',
            'SpeedResistanceLinesDrawingTool',
            'PitchforkDrawingTool',
            'CycleDrawingTool',
            'FibonacciExtensionDrawingTool',
            'FibonacciTimeExtensionDrawingTool',
            'FibonacciZoneDrawingTool',
            'FibonacciProjectionDrawingTool',
            'GannFanDrawingTool',
            'GannLineDrawingTool',
            'GannSquareDrawingTool',
            'GannBoxDrawingTool',
            'GannAngleDrawingTool',
            'GannGridDrawingTool',
            'GannArcDrawingTool',
            'GannCircleDrawingTool',
            'GannEllipseDrawingTool',
            'GannSquareOf9DrawingTool',
            'GannSpiralDrawingTool',
            'GannWheelDrawingTool',
            'GannHiloDrawingTool'
          ]
        }
      });

      setChart(tvWidget);
    };

    return () => {
      if (chart) {
        chart.remove();
      }
      document.body.removeChild(script);
    };
  }, [symbol, theme, height, interval, buyPoints, sellPoints]);

  return <div id="tradingview_chart" ref={chartContainerRef} className="rounded-xl bg-[#23262F] shadow-md overflow-hidden" style={{height}}></div>;
}
