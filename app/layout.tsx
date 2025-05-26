import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: 'AlphaTrade | Proprietary Trading Platform',
  description: 'Advanced cryptocurrency trading platform with Web3 authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="h-full">
      <body className="h-full overflow-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}