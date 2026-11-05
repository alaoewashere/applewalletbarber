import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCustomerById } from '@/lib/services/customer';
import { getCurrentUserProfile } from '@/lib/services/business';
import { ArrowLeft, User, Phone, Mail, Calendar, Clock, Scissors, Gift, Sparkles, ExternalLink } from 'lucide-react';
import { StampProgress } from '@/components/loyalty/stamp-progress';
import { CustomerActions } from '@/components/customers/customer-actions';
import { DigitalLoyaltyCard } from '@/components/wallet/digital-card';
import { Button } from '@/components/ui/button';


export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { business } = await getCurrentUserProfile();

  if (!business) {
    return <div>Loading...</div>;
  }

  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const card = customer.card;
  const currentStamps = card?.current_stamps || 0;
  const stampsRequired = customer.program?.stamps_required || 5;
  const rewardTitle = customer.program?.reward_title || 'Free Haircut';
  const isRewardUnlocked = card?.status === 'reward_available' || currentStamps >= stampsRequired;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Client List
        </Link>

        <Link href={`/card/${customer.qr_token}`} target="_blank" className="w-full sm:w-auto">
          <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs py-2 active:scale-95">
            <span>Customer Mobile Pass</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* Profile Overview Banner */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 text-amber-400 flex items-center justify-center font-black text-lg sm:text-2xl shadow-md dark:bg-zinc-100 dark:text-zinc-900 shrink-0">
              {customer.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                  {customer.full_name}
                </h1>
                {isRewardUnlocked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    Reward Ready
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">Pass #{customer.qr_token.slice(0, 8)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-zinc-500">
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 hover:bg-zinc-100 active:scale-95 transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-mono font-medium">{customer.phone}</span>
              </a>
            )}
            {customer.email && (
              <a
                href={`mailto:${customer.email}`}
                className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 hover:bg-zinc-100 active:scale-95 transition-all truncate max-w-[200px]"
              >
                <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{customer.email}</span>
              </a>
            )}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Joined {new Date(customer.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Big Loyalty Progress Indicator */}
        <div className="pt-6">
          <StampProgress
            currentStamps={currentStamps}
            stampsRequired={stampsRequired}
            rewardTitle={rewardTitle}
            isUnlocked={isRewardUnlocked}
          />
        </div>

        {/* Action Buttons: Add Stamp & Redeem Reward */}
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <CustomerActions
            customerId={customer.id}
            currentStamps={currentStamps}
            stampsRequired={stampsRequired}
            rewardTitle={rewardTitle}
            isRewardUnlocked={isRewardUnlocked}
            availableRewardId={customer.available_reward?.id}
          />
        </div>
      </div>

      {/* Two-Column Grid: Transaction History & Wallet Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History (Audit Trail) */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Loyalty Transaction History
              </h2>
              <p className="text-xs text-zinc-500">
                Immutable audit trail of all stamps and rewards
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {customer.recent_transactions?.length || 0} events
            </span>
          </div>

          {customer.recent_transactions && customer.recent_transactions.length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {customer.recent_transactions.map((tx) => (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        tx.action === 'stamp_added'
                          ? 'bg-amber-500/10 text-amber-600'
                          : tx.action === 'reward_unlocked'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : tx.action === 'reward_redeemed'
                          ? 'bg-purple-500/10 text-purple-600'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {tx.action === 'stamp_added' ? (
                        <Scissors className="w-4 h-4" />
                      ) : tx.action === 'reward_unlocked' ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <Gift className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {tx.action === 'stamp_added'
                          ? 'Haircut Stamp Added (+1)'
                          : tx.action === 'reward_unlocked'
                          ? '🎉 Free Haircut Reward Unlocked'
                          : tx.action === 'reward_redeemed'
                          ? 'Free Haircut Redeemed (Cycle Reset to 0)'
                          : tx.action}
                      </div>
                      {tx.notes && <div className="text-[11px] text-zinc-400">{tx.notes}</div>}
                    </div>
                  </div>

                  <div className="text-right text-xs text-zinc-400 font-mono">
                    {new Date(tx.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-400 text-xs">
              No transactions recorded yet. Click &quot;Add 1 Stamp&quot; above to begin!
            </div>
          )}
        </div>

        {/* Digital Wallet Card Live Preview */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 text-center">
              Active Digital Card
            </h3>
            <DigitalLoyaltyCard
              businessName={business.name}
              customerName={customer.full_name}
              currentStamps={currentStamps}
              stampsRequired={stampsRequired}
              rewardTitle={rewardTitle}
              qrToken={customer.qr_token}
              primaryColor={business.primary_color || '#18181b'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
