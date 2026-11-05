import React from 'react';
import { notFound } from 'next/navigation';
import { getCustomerByQrToken } from '@/lib/services/customer';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DigitalLoyaltyCard } from '@/components/wallet/digital-card';
import { Scissors, Sparkles, CheckCircle2 } from 'lucide-react';


export default async function PublicCustomerPassPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const customer = await getCustomerByQrToken(token);

  if (!customer) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', customer.business_id)
    .single();

  const card = customer.card;
  const currentStamps = card?.current_stamps || 0;
  const stampsRequired = customer.program?.stamps_required || 5;
  const rewardTitle = customer.program?.reward_title || 'Free Haircut';
  const isRewardUnlocked = card?.status === 'reward_available' || currentStamps >= stampsRequired;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-10 w-80 h-80 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Bar */}
      <header className="relative z-10 max-w-sm mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-amber-400 rotate-45 transform" />
          </div>
          <span className="text-xs font-black tracking-wider uppercase text-zinc-300">
            {business?.name || 'Barbershop'}
          </span>
        </div>

        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Verified Pass
        </span>
      </header>

      {/* Main Card View */}
      <main className="relative z-10 py-6 max-w-sm mx-auto w-full">
        {isRewardUnlocked && (
          <div className="mb-4 p-3.5 bg-amber-400 text-zinc-950 rounded-2xl font-black text-xs text-center shadow-xl animate-bounce">
            🎉 You have unlocked a Free Haircut! Show this card to your barber.
          </div>
        )}

        <DigitalLoyaltyCard
          businessName={business?.name || 'Fade Room'}
          customerName={customer.full_name}
          currentStamps={currentStamps}
          stampsRequired={stampsRequired}
          rewardTitle={rewardTitle}
          qrToken={customer.qr_token}
          primaryColor={business?.primary_color || '#18181b'}
        />
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 text-center py-4 max-w-sm mx-auto w-full">
        <p className="text-[11px] text-zinc-500">
          No app download required. Keep this tab open or save to your mobile wallet.
        </p>
      </footer>
    </div>
  );
}
