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
    return <div>Loading business station...</div>;
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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-zinc-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-xl border border-zinc-800">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Active Program: {program?.name || 'Haircut Rewards'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {business.name} Station
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl">
              Give stamps in seconds, unlock customer rewards, and deliver passes straight to Apple & Google Wallets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/scanner">
              <Button
                variant="primary"
                size="lg"
                className="bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold shadow-lg"
              >
                <QrCode className="w-5 h-5 mr-1" />
                Scan Customer QR
              </Button>
            </Link>

            <Link href="/customers/new">
              <Button
                variant="outline"
                size="lg"
                className="border-zinc-700 bg-zinc-800/80 text-white hover:bg-zinc-800"
              >
                <UserPlus className="w-5 h-5 mr-1" />
                Add Customer
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Customers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Customers
            </span>
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-zinc-100">
            {metrics.totalCustomers}
          </div>
          <p className="text-xs text-zinc-400 mt-1">Total registered</p>
        </div>

        {/* Active Cards */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Active Passes
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-zinc-100">
            {metrics.activeCards}
          </div>
          <p className="text-xs text-zinc-400 mt-1">Collecting stamps</p>
        </div>

        {/* Stamps Today */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Stamps Today
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-zinc-100">
            {metrics.stampsToday}
          </div>
          <p className="text-xs text-zinc-400 mt-1">Haircuts recorded</p>
        </div>

        {/* Available Rewards */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Free Haircuts Ready
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-3 text-emerald-600 dark:text-emerald-400">
            {metrics.availableRewards}
          </div>
          <p className="text-xs text-zinc-400 mt-1">Ready for redemption</p>
        </div>

        {/* Total Redeemed */}
        <div className="col-span-2 sm:col-span-1 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Claimed Rewards
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-3 text-zinc-900 dark:text-zinc-100">
            {metrics.totalRedeemed}
          </div>
          <p className="text-xs text-zinc-400 mt-1">Free cuts rewarded</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Recent Loyalty Activity
              </h2>
              <p className="text-xs text-zinc-500">Audit trail of all customer stamps and rewards</p>
            </div>
            <Link
              href="/customers"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              All Customers <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentActivity && recentActivity.length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentActivity.map((tx: any) => {
                const customerName = tx.customers?.full_name || 'Customer';
                const timeString = new Date(tx.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const dateString = new Date(tx.created_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
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
                        <Link
                          href={`/customers/${tx.customer_id}`}
                          className="text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:underline"
                        >
                          {customerName}
                        </Link>
                        <div className="text-xs text-zinc-500">
                          {tx.action === 'stamp_added'
                            ? 'Received haircut stamp (+1)'
                            : tx.action === 'reward_unlocked'
                            ? '🎉 Reached 5 stamps – Free haircut unlocked'
                            : tx.action === 'reward_redeemed'
                            ? 'Redeemed free haircut'
                            : tx.action}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                        {timeString}
                      </div>
                      <div className="text-[10px] text-zinc-400">{dateString}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-400">
              <Clock className="w-10 h-10 mx-auto text-zinc-300 mb-2 opacity-50" />
              <p className="text-sm font-semibold">No activity recorded yet</p>
              <p className="text-xs text-zinc-400 mt-1">
                Add your first customer and scan their QR code to record stamps.
              </p>
              <Link href="/customers/new" className="inline-block mt-4">
                <Button size="sm" variant="secondary">
                  Add First Customer
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Launch & How it works */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-zinc-900 text-white border border-zinc-800 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2">Barber Quick Workflow</h3>
            <ol className="space-y-3 text-xs text-zinc-300">
              <li className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-zinc-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span>Customer arrives and displays their digital loyalty pass on iPhone or Android.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-zinc-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span>Open QR Scanner on your tablet/phone and scan their pass.</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-zinc-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span>Click <strong>Add Stamp</strong>. Card updates atomically, unlocking free haircut at 5 stamps!</span>
              </li>
            </ol>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-center">
            <Scissors className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Loyalty Rule: 5 Haircuts = 1 Free
            </h4>
            <p className="text-xs text-zinc-500 mt-1">
              Customizable in Settings. Customers never need to download an app.
            </p>
            <div className="mt-4">
              <Link href="/settings">
                <Button size="sm" variant="outline" className="w-full">
                  Configure Rule
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
