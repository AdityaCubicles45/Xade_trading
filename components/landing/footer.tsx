import Link from 'next/link';
import { ExternalLink, Github, Twitter } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="font-bold text-xl">AlphaTrade</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Advanced cryptocurrency trading platform with Web3 authentication and real-time market data.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-foreground text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-muted-foreground hover:text-foreground text-sm">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground text-sm">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-foreground text-sm">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} AlphaTrade. All rights reserved.
          </p>
          
          <div className="flex space-x-4">
            <Link href="https://twitter.com" className="text-muted-foreground hover:text-foreground" target="_blank" rel="noopener noreferrer">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="https://github.com" className="text-muted-foreground hover:text-foreground" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
            </Link>
            <Link href="https://binance.com" className="text-muted-foreground hover:text-foreground" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}