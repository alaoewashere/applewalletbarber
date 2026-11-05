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
  Sparkles,
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
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/customers/new', label: 'Add Customer', icon: UserPlus },
    { href: '/scanner', label: 'Scan QR Code', icon: QrCode, highlight: true },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:bg-zinc-950/80 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand / Logo */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform dark:bg-zinc-100 dark:text-zinc-900">
                <Scissors className="w-5 h-5 text-amber-400 rotate-45 transform" />
              </div>
              <div className="hidden sm:block">
                <div className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  {businessName}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                    {role}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 font-medium">Digital Loyalty & Wallet</div>
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
                      : item.highlight
                      ? 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User profile & Sign out */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:block text-right">
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{userName}</div>
              <div className="text-xs text-zinc-400">Barber Station</div>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all dark:border-zinc-800 dark:hover:bg-rose-950/20"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 px-3 py-2 flex items-center justify-around shadow-lg dark:bg-zinc-950 dark:border-zinc-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-xs font-semibold ${
                isActive
                  ? 'text-zinc-950 font-bold dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl ${
                  isActive ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
