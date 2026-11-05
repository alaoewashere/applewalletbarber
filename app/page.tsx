import React from 'react';
import Link from 'next/link';
import { Scissors, Smartphone, QrCode, Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-amber-400 selection:text-zinc-950 relative overflow-hidden flex flex-col justify-between">
      {/* Glow decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none"></div>

      {/* Navigation */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg">
            <Scissors className="w-5 h-5 text-amber-400 rotate-45 transform" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white">BarberWallet</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
              SaaS MVP
            </span>
          </div>
        </div>

        <Link href="/login">
          <Button
            variant="outline"
            className="border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold px-4 py-2"
          >
            Barber Station Sign In
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 sm:py-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Replace Paper Stamp Cards with Digital Wallet Passes</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
          Digital Loyalty & Rewards for <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">Barbershops</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
          Customers collect 1 stamp each haircut. At 5 stamps, unlock a free haircut.
          Saved directly to <strong>Apple Wallet</strong> on iPhone and <strong>Google Wallet</strong> on Android — no app download required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/login">
            <Button
              size="lg"
              className="bg-amber-400 text-zinc-950 hover:bg-amber-300 font-extrabold px-8 py-4 text-base shadow-xl shadow-amber-400/10"
            >
              <span>Open Barber Dashboard</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button
              variant="outline"
              size="lg"
              className="border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-800 px-6 py-4 text-base"
            >
              Live Station Demo
            </Button>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-4">
              <Scissors className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">1 Haircut = 1 Stamp</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Add stamps in one second from your phone or tablet. 5 stamps = 1 free haircut.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Apple & Google Wallet</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Customers save passes directly to their phones. Always accessible at checkout.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Multi-Tenant PostgreSQL</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Supabase RLS, atomic RPC transactions, and complete audit trail isolation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        © 2026 Barber Digital Loyalty & Wallet Platform. Production-ready MVP.
      </footer>
    </div>
  );
}
