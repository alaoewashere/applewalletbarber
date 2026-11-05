import React from 'react';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/lib/services/business';
import { getDashboardMetrics } from '@/lib/services/customer';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  Users,
  Scissors,
  Gift,
  QrCode,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const { business, program } = await getCurrentUserProfile();

  if (!business) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500">
        Loading station...
      </div>
    );
  }

  const metrics = await getDashboardMetrics(business.id);
  const supabase = await createServerSupabaseClient();

  // Fetch recent activity
  const { data: recentActivity } = await supabase
    .from('loyalty_transactions')
    .select('*, customers(full_name)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(8);

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Welcome Station Banner */}
      <div className="rounded-3xl bg-zinc-900 text-white p-5 sm:p-8 relative overflow-hidden shadow-xl border border-zinc-800">
        <div className="absolute -top-12 -right-12 w-48 sm:w-64 h-48 sm:h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              {program?.stamps_required || 5} Haircuts = 1 Free
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {business.name}
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-xl">
              Add stamps in one tap and send passes straight to Apple & Google Wallets.
            </p>
          </div>

          {/* Quick Actions (Full width on phones, side-by-side) */}
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3 pt-1 sm:pt-0">
            <Link href="/scanner" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto bg-amber-400 text-zinc-950 hover:bg-amber-300 font-extrabold shadow-lg active:scale-95 py-3 text-xs sm:text-sm"
              >
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
                <span>Scan QR Pass</span>
              </Button>
            </Link>

            <Link href="/customers/new" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                className="w-full sm:w-auto border-zinc-700 bg-zinc-800/90 text-white hover:bg-zinc-800 font-bold active:scale-95 py-3 text-xs sm:text-sm"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
                <span>Add Client</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row (Optimized 2-col on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Customers */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500">
              Clients
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black mt-2 sm:mt-3 text-zinc-900 dark:text-zinc-100">
            {metrics.totalCustomers}
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">Total members</p>
        </div>

        {/* Active Cards */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500">
              Active Passes
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black mt-2 sm:mt-3 text-zinc-900 dark:text-zinc-100">
            {metrics.activeCards}
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">In progress</p>
        </div>

        {/* Stamps Today */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500">
              Stamps Today
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black mt-2 sm:mt-3 text-zinc-900 dark:text-zinc-100">
            {metrics.stampsToday}
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">Cuts stamped</p>
        </div>

        {/* Available Rewards */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500">
              Rewards Ready
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black mt-2 sm:mt-3 text-emerald-600 dark:text-emerald-400">
            {metrics.availableRewards}
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">Free cuts ready</p>
        </div>

        {/* Total Redeemed */}
        <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500">
              Claimed Rewards
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black mt-2 sm:mt-3 text-zinc-900 dark:text-zinc-100">
            {metrics.totalRedeemed}
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5">Lifetime redeemed</p>
        </div>
      </div>

      {/* Main Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Recent Stamp Activity
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-500">Live audit log of all haircut stamps</p>
            </div>
            <Link
              href="/customers"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 active:scale-95"
            >
              All Clients <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentActivity && recentActivity.length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentActivity.map((tx: any) => {
                const customerName = tx.customers?.full_name || 'Client';
                const timeString = new Date(tx.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const dateString = new Date(tx.created_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <Link
                    key={tx.id}
                    href={`/customers/${tx.customer_id}`}
                    className="py-3 flex items-center justify-between gap-3 active:bg-zinc-50 dark:active:bg-zinc-800/40 rounded-xl px-1 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
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

                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {customerName}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {tx.action === 'stamp_added'
                            ? '✂️ Haircut stamp (+1)'
                            : tx.action === 'reward_unlocked'
                            ? '🎉 Free haircut unlocked!'
                            : tx.action === 'reward_redeemed'
                            ? 'Claimed free haircut'
                            : tx.action}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                        {timeString}
                      </div>
                      <div className="text-[10px] text-zinc-400">{dateString}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-400">
              <Clock className="w-8 h-8 mx-auto text-zinc-300 mb-2 opacity-50" />
              <p className="text-xs sm:text-sm font-semibold">No stamps recorded yet</p>
              <Link href="/customers/new" className="inline-block mt-3">
                <Button size="sm" variant="secondary" className="text-xs">
                  Add First Customer
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Barber Mobile Quick Guide */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-zinc-900 text-white border border-zinc-800 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-amber-400" />
              Barber 10-Second Workflow
            </h3>
            <ol className="space-y-2.5 text-xs text-zinc-300">
              <li className="flex gap-2 items-start">
                <span className="w-4 h-4 rounded-full bg-amber-400 text-zinc-950 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>Client shows Apple/Google Wallet pass on phone.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="w-4 h-4 rounded-full bg-amber-400 text-zinc-950 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>Tap <strong>Scan</strong> at the bottom center.</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="w-4 h-4 rounded-full bg-amber-400 text-zinc-950 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span>Tap <strong>Add Stamp</strong>. Pass updates instantly!</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
