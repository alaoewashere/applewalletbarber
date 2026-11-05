'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, CheckCircle2, Copy, Check, ExternalLink, Share2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DigitalLoyaltyCard } from '@/components/wallet/digital-card';

export default function NewCustomerPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdCustomer, setCreatedCustomer] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email,
        }),
      });

      const res = await response.json();

      if (!response.ok || !res.success) {
        throw new Error(res.error || 'Failed to create customer');
      }

      setCreatedCustomer(res.customer);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creating customer');
    } finally {
      setIsLoading(false);
    }
  };

  const passUrl = createdCustomer
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/card/${createdCustomer.qr_token}`
    : '';

  const handleCopyLink = () => {
    if (passUrl) {
      navigator.clipboard.writeText(passUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (!createdCustomer || !passUrl) return;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Loyalty Pass for ${createdCustomer.full_name}`,
          text: `Hi ${createdCustomer.full_name}! Here is your digital barbershop loyalty pass. Save it to your Apple or Google Wallet:`,
          url: passUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
      </div>

      {!createdCustomer ? (
        /* Create Form */
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center dark:bg-zinc-100 dark:text-zinc-900">
              <UserPlus className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Add New Client
              </h1>
              <p className="text-xs text-zinc-500">
                Issue a digital loyalty pass in seconds.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Client Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. David Beckham"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Phone Number (Recommended)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 555-0199"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. david@example.com"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="w-full h-14 bg-zinc-900 text-white hover:bg-zinc-800 font-black rounded-2xl active:scale-95 text-base"
              >
                Create Loyalty Pass
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* Success Screen with Pass Preview & Sharing */
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-5 sm:p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
              Loyalty Pass Created!
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              {createdCustomer.full_name} is enrolled. Share their pass link below or have them scan the QR code.
            </p>

            {/* Quick Share Buttons for Phones */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
              <Button
                size="md"
                variant="primary"
                onClick={handleNativeShare}
                className="w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-700 font-bold active:scale-95 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Pass (WhatsApp / SMS)</span>
              </Button>

              <Button
                size="md"
                variant="outline"
                onClick={handleCopyLink}
                className="w-full sm:w-auto font-bold active:scale-95 flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </Button>
            </div>
          </div>

          {/* Live Digital Card Preview */}
          <div className="p-4 sm:p-6 rounded-3xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-widest text-center text-zinc-400 mb-3 sm:mb-4">
              Digital Wallet Pass Preview
            </h3>
            <DigitalLoyaltyCard
              customerName={createdCustomer.full_name}
              currentStamps={0}
              stampsRequired={5}
              qrToken={createdCustomer.qr_token}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setCreatedCustomer(null);
                setFullName('');
                setPhone('');
                setEmail('');
              }}
            >
              Add Another Client
            </Button>

            <Link href={`/customers/${createdCustomer.id}`} className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto font-bold">
                Go to Client Profile
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
