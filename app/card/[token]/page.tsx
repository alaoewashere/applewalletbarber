import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCustomerByQrToken } from '@/lib/services/customer';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DigitalLoyaltyCard } from '@/components/wallet/digital-card';
import { Scissors, Sparkles, CheckCircle2, UserCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const adminClient = createAdminClient();
  const { data: business } = await adminClient
    .from('businesses')
    .select('*')
    .eq('id', customer.business_id)
    .single();

  // Check if current visitor is a logged-in barber/staff member
  let isBarberLoggedIn = false;
  try {
    const serverSupabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();
    if (user) {
      isBarberLoggedIn = true;
    }
  } catch (err) {
    isBarberLoggedIn = false;
  }

  const card = customer.card;
  const currentStamps = card?.current_stamps || 0;
  const stampsRequired = customer.program?.stamps_required || 5;
  const rewardTitle = customer.program?.reward_title || 'Free Haircut';
  const isRewardUnlocked = card?.status === 'reward_available' || currentStamps >= stampsRequired;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-4 sm:p-6 pb-safe pt-safe relative overflow-hidden">
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
      <main className="relative z-10 py-4 max-w-sm mx-auto w-full space-y-4">
        {/* Barber Shortcut Banner (Visible if barber is logged in on this browser) */}
        {isBarberLoggedIn && (
          <div className="p-4 rounded-3xl bg-zinc-900 border border-amber-400/40 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Barber Session Detected
              </span>
              <span className="text-[11px] font-bold text-zinc-300 font-mono">
                {currentStamps} / {stampsRequired} Stamps
              </span>
            </div>
            <p className="text-xs text-zinc-300">
              Manage <span className="font-bold text-white">{customer.full_name}</span> in your barber station.
            </p>
            <Link href={`/customers/${customer.id}`} className="block">
              <Button
                variant="primary"
                size="md"
                className="w-full h-11 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <span>Open in Barber Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {isRewardUnlocked && (
          <div className="p-3.5 bg-amber-400 text-zinc-950 rounded-2xl font-black text-xs text-center shadow-xl animate-bounce">
            🎉 You have unlocked a Free Haircut! Show this card to your barber.
          </div>
        )}

        <DigitalLoyaltyCard
          businessName={business?.name || 'Yoused Barber'}
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
