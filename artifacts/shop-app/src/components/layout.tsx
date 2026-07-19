import React from 'react';
import { Link, useLocation } from 'wouter';
import { useStore } from '../lib/store';
import { Store, ShoppingCart, Package, Fish } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { coins, isLoaded } = useStore();

  if (!isLoaded) return null;

  const tabs = [
    { name: 'Home', path: '/', icon: Store },
    { name: 'Shop', path: '/shop', icon: ShoppingCart },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Fishing (WIP)', path: '/fishing', icon: Fish, wip: true },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground">
              N
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block text-foreground">NibbleStore</span>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location === tab.path || (tab.path !== '/' && location.startsWith(tab.path));
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-out ${
                    isActive
                      ? 'bg-secondary text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.wip && isActive ? 'text-blue-400' : ''}`} />
                  <span className="hidden sm:inline-block">{tab.name}</span>
                  {tab.wip && (
                    <span className="hidden sm:inline-flex text-[9px] font-bold px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wide leading-none">
                      WIP
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center">
            <div className="flex items-center gap-2 bg-secondary/80 border border-border px-3 py-1.5 rounded-full shadow-inner">
              <span className="text-xl">🪙</span>
              <span className="font-mono font-bold text-primary drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                {coins.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
