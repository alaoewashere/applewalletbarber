import React from 'react';
import { notFound } from 'next/navigation';
import { getBusinessBySlug } from '@/lib/services/business';
import { CustomerSelfRegister } from '@/components/join/customer-self-register';
import { Scissors } from 'lucide-react';

export default async function CustomerJoinPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const { business, program } = await getBusinessBySlug(businessSlug);

  if (!business || !program) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-4 sm:p-6 pb-safe pt-safe relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-10 w-80 h-80 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <header className="relative z-10 max-w-sm mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-amber-400 rotate-45 transform" />
          </div>
          <span className="text-xs font-black tracking-wider uppercase text-zinc-300">
            {business.name}
          </span>
        </div>

        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
          Official Rewards
        </span>
      </header>

      {/* Main Self-Registration Component */}
      <main className="relative z-10 py-6 max-w-sm mx-auto w-full">
        <CustomerSelfRegister
          business={business}
          program={program}
          businessSlug={businessSlug}
        />
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 max-w-sm mx-auto w-full">
        <p className="text-[11px] text-zinc-500">
          Powered by BarberWallet • Digital Apple & Google Wallet loyalty
        </p>
      </footer>
    </div>
  );
}
