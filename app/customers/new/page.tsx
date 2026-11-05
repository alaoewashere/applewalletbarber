'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, CheckCircle2, Copy, Check, ExternalLink, QrCode } from 'lucide-react';
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer List
        </Link>
      </div>

      {!createdCustomer ? (
        /* Create Form */
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center dark:bg-zinc-100 dark:text-zinc-900">
              <UserPlus className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Add New Customer
              </h1>
              <p className="text-xs text-zinc-500">
                Create a loyalty profile and digital pass for your customer.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Customer Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. David Beckham"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Phone Number (Recommended for easy search)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 555-0199"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
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
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="w-full bg-zinc-900 text-white hover:bg-zinc-800 font-bold"
              >
                Create Loyalty Pass
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* Success Screen with Pass Preview & Sharing */
        <div className="space-y-6">
          <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-6 sm:p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              Loyalty Pass Created Successfully!
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              {createdCustomer.full_name} is now enrolled. They can scan the QR code below or open the link on their iPhone/Android to save to their wallet.
            </p>

            {/* Quick Link Share Box */}
            <div className="mt-5 max-w-lg mx-auto flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-inner">
              <input
                type="text"
                readOnly
                value={passUrl}
                className="flex-1 px-3 py-1.5 bg-transparent text-xs text-zinc-600 dark:text-zinc-300 font-mono focus:outline-none truncate"
              />
              <Button size="sm" variant="secondary" onClick={handleCopyLink}>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </Button>
              <Link href={`/card/${createdCustomer.qr_token}`} target="_blank">
                <Button size="sm" variant="ghost">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Live Digital Card Preview */}
          <div className="p-6 rounded-3xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-widest text-center text-zinc-400 mb-4">
              Customer Digital Pass View
            </h3>
            <DigitalLoyaltyCard
              customerName={createdCustomer.full_name}
              currentStamps={0}
              stampsRequired={5}
              qrToken={createdCustomer.qr_token}
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreatedCustomer(null);
                setFullName('');
                setPhone('');
                setEmail('');
              }}
            >
              Add Another Customer
            </Button>

            <Link href={`/customers/${createdCustomer.id}`}>
              <Button variant="primary">Go to Customer Profile</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
