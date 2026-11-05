'use client';

import React, { useState } from 'react';
import { Scissors, Sparkles, CheckCircle2, User, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DigitalLoyaltyCard } from '@/components/wallet/digital-card';
import confetti from 'canvas-confetti';

interface CustomerSelfRegisterProps {
  business: {
    id: string;
    name: string;
    primary_color?: string | null;
  };
  program: {
    stamps_required: number;
    reward_title: string;
    reward_description?: string | null;
  };
  businessSlug: string;
}

export function CustomerSelfRegister({
  business,
  program,
  businessSlug,
}: CustomerSelfRegisterProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdData, setCreatedData] = useState<{
    customer: any;
    loyaltyCard: any;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/join/${encodeURIComponent(businessSlug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create your loyalty pass.');
      }

      setCreatedData({
        customer: data.customer,
        loyaltyCard: data.loyaltyCard,
      });

      // Celebration confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
        });
      } catch (cErr) {}
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {!createdData ? (
        /* Step 1: Self-Registration Form */
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 sm:p-7 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Header */}
          <div className="text-center pb-5 border-b border-zinc-800">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-inner">
              <Scissors className="w-6 h-6 rotate-45 transform" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
              VIP Loyalty Program
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {business.name}
            </h1>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Collect <span className="text-amber-300 font-bold">{program.stamps_required} haircuts</span> and your next haircut is on us!
            </p>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Your Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. David Beckham"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Optional: helps your barber look you up if your phone is out of battery.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full h-13 mt-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-2xl text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Get My Loyalty Card</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant pass • No app installation needed</span>
            </div>
          </form>
        </div>
      ) : (
        /* Step 2: Confirmation & Digital Card Ready */
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-400" />
            <h2 className="text-base font-black text-white">
              Welcome, {createdData.customer.full_name}!
            </h2>
            <p className="text-[11px] text-zinc-300 mt-0.5">
              Your loyalty pass is active. Save it to your Apple or Google Wallet below:
            </p>
          </div>

          {/* Interactive Digital Card */}
          <DigitalLoyaltyCard
            businessName={business.name}
            customerName={createdData.customer.full_name}
            currentStamps={0}
            stampsRequired={program.stamps_required}
            rewardTitle={program.reward_title}
            qrToken={createdData.customer.qr_token}
            primaryColor={business.primary_color || '#18181b'}
          />

          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-[11px] text-zinc-400 leading-relaxed">
            💡 <strong>Next time you visit:</strong> Show the QR code on this pass to the barber after your cut to collect your stamp!
          </div>
        </div>
      )}
    </div>
  );
}
