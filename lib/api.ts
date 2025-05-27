import { Token, OrderBook, Market } from './types';
import { getCurrentUser as getAuthUser } from './auth';
import { getUserPositions, closePosition as closePositionBackend } from './trading';

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  quoteVolume: string;
  priceChangePercent: string;
  volume: string;
}

interface BinancePair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
}

interface PairWithVolume {
  pair: BinancePair;
  volume: number;
}

// List of major cryptocurrencies to prioritize
const MAJOR_TOKENS = [
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC', 'SOL', 'DOT', 'LTC',
  'AVAX', 'LINK', 'UNI', 'ATOM', 'ETC', 'XLM', 'BCH', 'FIL', 'ALGO', 'ICP',
  'VET', 'MANA', 'SAND', 'AXS', 'THETA', 'XTZ', 'EOS', 'AAVE', 'CAKE', 'MKR',
  'SNX', 'COMP', 'YFI', 'SUSHI', '1INCH', 'ENJ', 'BAT', 'ZIL', 'IOTA', 'NEO',
  'WAVES', 'DASH', 'ZEC', 'XMR', 'QTUM', 'ONT', 'IOST', 'OMG', 'ZRX', 'KNC'
];

// Add token ID mapping for images
const TOKEN_IMAGE_IDS: { [key: string]: string } = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'MATIC': 'matic-network',
  'SOL': 'solana',
  'DOT': 'polkadot',
  'LTC': 'litecoin',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'ETC': 'ethereum-classic',
  'XLM': 'stellar',
  'BCH': 'bitcoin-cash',
  'FIL': 'filecoin',
  'ALGO': 'algorand',
  'ICP': 'internet-computer',
  'VET': 'vechain',
  'MANA': 'decentraland',
  'SAND': 'the-sandbox',
  'AXS': 'axie-infinity',
  'THETA': 'theta-token',
  'XTZ': 'tezos',
  'EOS': 'eos',
  'AAVE': 'aave',
  'CAKE': 'pancakeswap-token',
  'MKR': 'maker',
  'SNX': 'synthetix-network-token',
  'COMP': 'compound-governance-token',
  'YFI': 'yearn-finance',
  'SUSHI': 'sushi',
  '1INCH': '1inch',
  'ENJ': 'enjincoin',
  'BAT': 'basic-attention-token',
  'ZIL': 'zilliqa',
  'IOTA': 'iota',
  'NEO': 'neo',
  'WAVES': 'waves',
  'DASH': 'dash',
  'ZEC': 'zcash',
  'XMR': 'monero',
  'QTUM': 'qtum',
  'ONT': 'ontology',
  'IOST': 'iostoken',
  'OMG': 'omisego',
  'ZRX': '0x',
  'KNC': 'kyber-network-crystal'
};

// Add user-related interfaces
interface User {
  id: string;
  walletAddress: string;
  balance: number;
  tier: string;
  createdAt: string;
}

// Add position-related interfaces
interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  size: number;
  leverage: number;
  pnl: number;
  pnlPercentage: number;
  liquidationPrice: number;
  createdAt: string;
}

// Add getCurrentUser function
export const getCurrentUser = async (walletAddress: string): Promise<User | null> => {
  try {
    const user = await getAuthUser(walletAddress);
    if (!user) return null;
    
    return {
      id: user.id,
      walletAddress: user.wallet_address,
      balance: user.current_balance,
      tier: user.tier
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

// Binance API Functions
export const fetchTopTokens = async (limit: number = 300): Promise<Token[]> => {
  try {
    console.log('Fetching USDT pairs from Binance...');
    const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange info from Binance');
    }
    
    const data = await response.json();
    // Filter USDT pairs
    const usdtPairs = data.symbols
      .filter((symbol: BinancePair) => 
        symbol.quoteAsset === 'USDT' && 
        symbol.status === 'TRADING' &&
        !symbol.symbol.includes('DOWN') &&
        !symbol.symbol.includes('UP')
      );

    // Fetch 24h ticker data for all pairs
    const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!tickerResponse.ok) {
      throw new Error('Failed to fetch ticker data from Binance');
    }
    
    const tickerData = await tickerResponse.json();
    const tickerMap = new Map(tickerData.map((t: BinanceTicker) => [t.symbol, t]));
    
    // Sort pairs by priority and volume
    const sortedPairs = usdtPairs
      .map((pair: BinancePair) => {
        const ticker = tickerMap.get(pair.symbol) as BinanceTicker | undefined;
        const volume = parseFloat(ticker?.volume || '0');
        // Give priority to major tokens
        const priority = MAJOR_TOKENS.includes(pair.baseAsset) ? 1 : 0;
        return {
          pair,
          volume,
          priority
        };
      })
      .sort((a: PairWithVolume & { priority: number }, b: PairWithVolume & { priority: number }) => {
        // First sort by priority (major tokens first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        // Then sort by volume
        return b.volume - a.volume;
      })
      .slice(0, limit);

    console.log('Received USDT pairs from Binance:', sortedPairs.length, 'pairs');
    
    return sortedPairs.map(({ pair }: { pair: BinancePair }) => {
      const ticker = tickerMap.get(pair.symbol) as BinanceTicker | undefined;
      const baseAsset = pair.baseAsset;
      const tokenId = TOKEN_IMAGE_IDS[baseAsset] || baseAsset.toLowerCase();
      return {
        id: pair.symbol,
        symbol: baseAsset,
        name: baseAsset,
        image: `https://assets.coingecko.com/coins/images/1/large/${tokenId}.png`,
        current_price: parseFloat(ticker?.lastPrice || '0'),
        market_cap: parseFloat(ticker?.quoteVolume || '0'),
        market_cap_rank: 0,
        price_change_percentage_24h: parseFloat(ticker?.priceChangePercent || '0'),
        volume_24h: parseFloat(ticker?.volume || '0'),
        quoteAsset: pair.quoteAsset,
        baseAsset: pair.baseAsset
      };
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return [];
  }
};

// Get real-time price for a specific token
export const fetchTokenPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch token price from Binance');
    }
    
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('Error fetching token price:', error);
    return null;
  }
};

// Get market data for a specific token
let ws: WebSocket | null = null;

export const initializeWebSocket = (symbols: string[]) => {
  // Close existing connection if any
  if (ws) {
    ws.close();
  }

  // Create streams string for all symbols
  const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/');
  ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

  // Handle WebSocket messages
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.data) {
      // Update the parent component with the new price
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('priceUpdate', {
          detail: {
            symbol: data.data.s,
            price: parseFloat(data.data.c)
          }
        });
        window.dispatchEvent(event);
      }
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };

  return ws;
};

export const closeWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};

export const fetchMarketData = async (symbol: string): Promise<Market | null> => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch market data from Binance');
    }
    
    const data = await response.json();
    return {
      id: symbol,
      symbol: symbol.replace('USDT', ''),
      name: symbol.replace('USDT', ''),
      current_price: parseFloat(data.lastPrice),
      market_cap: parseFloat(data.quoteVolume),
      volume_24h: parseFloat(data.volume),
      price_change_24h: parseFloat(data.priceChangePercent),
      high_24h: parseFloat(data.highPrice),
      low_24h: parseFloat(data.lowPrice),
      circulating_supply: 0,
      total_supply: 0
    };
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
};

// Get orderbook data
export const fetchOrderBook = async (symbol: string): Promise<OrderBook> => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=20`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch orderbook from Binance');
    }
    
    const data = await response.json();
    return {
      bids: data.bids.map((bid: string[]) => ({
        price: parseFloat(bid[0]),
        quantity: parseFloat(bid[1])
      })),
      asks: data.asks.map((ask: string[]) => ({
        price: parseFloat(ask[0]),
        quantity: parseFloat(ask[1])
      }))
    };
  } catch (error) {
    console.error('Error fetching orderbook:', error);
    return { bids: [], asks: [] };
  }
};

// WebSocket functions for real-time data
export const getBinanceWebSocketUrl = (symbol: string): string => {
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20@100ms`;
};

export const getPriceWebSocketUrl = (symbol: string): string => {
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`;
};

// Helper function to format price
export const formatPrice = (price: number): string => {
  if (price >= 1) {
    return price.toFixed(2);
  } else if (price >= 0.01) {
    return price.toFixed(4);
  } else {
    return price.toFixed(8);
  }
};

export const formatPercentage = (percentage: number): string => {
  return percentage > 0 
    ? `+${percentage.toFixed(2)}%` 
    : `${percentage.toFixed(2)}%`;
};

export const formatVolume = (volume: number): string => {
  if (volume >= 1_000_000_000) {
    return `$${(volume / 1_000_000_000).toFixed(2)}B`;
  } else if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(2)}M`;
  } else if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(2)}K`;
  } else {
    return `$${volume.toFixed(2)}`;
  }
};

export const fetchCurrentPrice = async (symbol: string): Promise<number> => {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    if (!response.ok) throw new Error('Failed to fetch price');
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('Error fetching current price:', error);
    return 0;
  }
};

// Add fetchPositions function
export const fetchPositions = async (walletAddress: string): Promise<Position[]> => {
  try {
    // Use the real backend call
    const positions = await getUserPositions(walletAddress);
    // Map backend Position to frontend Position shape if needed
    return positions.map((p: any) => ({
      id: p.id,
      symbol: p.market || p.symbol,
      side: p.position_type || 'LONG', // fallback if not present
      entryPrice: p.entry_price,
      currentPrice: p.current_price,
      size: p.amount,
      leverage: 1,
      pnl: p.pnl,
      pnlPercentage: p.entry_price ? ((p.current_price - p.entry_price) / p.entry_price) * 100 : 0,
      liquidationPrice: 0,
      createdAt: p.created_at || ''
    }));
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
};

// Add closePosition function
export const closePosition = async (positionId: string, closePrice?: number): Promise<boolean> => {
  try {
    // Use the real backend call
    return await closePositionBackend(positionId, closePrice || 0);
  } catch (error) {
    console.error('Error closing position:', error);
    return false;
  }
};