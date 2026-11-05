'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Scissors,
  Users,
  QrCode,
  Settings,
  LogOut,
  LayoutDashboard,
  UserPlus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DashboardNavProps {
  businessName?: string;
  userName?: string;
  role?: string;
}

export function DashboardNav({
  businessName = 'Barbershop Rewards',
  userName = 'Barber Admin',
  role = 'owner',
}: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/customers', label: 'Clients', icon: Users },
    { href: '/scanner', label: 'Scan Pass', icon: QrCode, isPrimary: true },
    { href: '/customers/new', label: 'New Client', icon: UserPlus },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Top App Header (Both Mobile & Desktop) */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:bg-zinc-950/90 dark:border-zinc-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand / Logo */}
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2.5 active:scale-95 transition-transform">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md dark:bg-zinc-100 dark:text-zinc-900">
                  <Scissors className="w-5 h-5 text-amber-400 rotate-45 transform" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate max-w-[170px] sm:max-w-none">
                    <span className="truncate">{businessName}</span>
                    <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                      {role}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-medium">Barber Station</div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
                        : item.isPrimary
                        ? 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400 font-bold'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden lg:block text-right">
                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]">
                  {userName}
                </div>
                <div className="text-[11px] text-zinc-400">Owner</div>
              </div>

              <Link href="/scanner" className="md:hidden">
                <div className="p-2.5 rounded-xl bg-amber-400 text-zinc-950 font-bold active:scale-95 transition-transform flex items-center gap-1 text-xs shadow-sm">
                  <QrCode className="w-4 h-4" />
                  <span>Scan</span>
                </div>
              </Link>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-2.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-90 dark:border-zinc-800 dark:hover:bg-rose-950/20"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Native-Style Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-zinc-200 dark:bg-zinc-950/95 dark:border-zinc-800 px-2 pt-1 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.isPrimary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center -mt-5 active:scale-90 transition-transform focus:outline-none"
                >
                  <div className="w-13 h-13 rounded-2xl bg-amber-400 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-400/30 border-2 border-white dark:border-zinc-900">
                    <QrCode className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-black text-amber-500 dark:text-amber-400 mt-1">
                    Scan
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 active:scale-95 transition-all focus:outline-none ${
                  isActive
                    ? 'text-zinc-950 font-bold dark:text-white'
                    : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-colors ${
                    isActive ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
