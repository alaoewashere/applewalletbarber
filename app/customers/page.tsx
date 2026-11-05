import React from 'react';
import Link from 'next/link';
import { getCurrentUserProfile } from '@/lib/services/business';
import { searchCustomers } from '@/lib/services/customer';
import { UserPlus, Search, Scissors, Gift, Phone, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { business } = await getCurrentUserProfile();

  if (!business) {
    return <div>Loading...</div>;
  }

  const { q } = await searchParams;
  const query = q || '';
  const customers = await searchCustomers({
    businessId: business.id,
    query,
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Clients & Passes
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Search clients, view haircut counts, and issue stamps.
          </p>
        </div>

        <Link href="/customers/new" className="w-full sm:w-auto">
          <Button variant="primary" className="w-full sm:w-auto bg-zinc-900 text-white hover:bg-zinc-800 font-bold active:scale-95">
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Client
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <form method="GET" className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by name or phone number..."
            className="w-full pl-10 pr-20 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
          <button
            type="submit"
            className="absolute right-2 px-3 py-1 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 active:scale-95"
          >
            Search
          </button>
        </form>
      </div>

      {/* MOBILE VIEW (< md): Touch-Friendly Native Cards */}
      <div className="md:hidden space-y-2.5">
        {customers && customers.length > 0 ? (
          customers.map((c) => {
            const card = c.card;
            const currentStamps = card?.current_stamps || 0;
            const isUnlocked = card?.status === 'reward_available' || currentStamps >= 5;

            return (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="block p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      {c.full_name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {c.full_name}
                      </div>

                      {c.phone ? (
                        <div className="text-xs text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>{c.phone}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-zinc-400">No phone listed</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center justify-end gap-1">
                        <Scissors className="w-3 h-3 text-amber-500" />
                        <span>{currentStamps} / 5</span>
                      </div>
                      {isUnlocked ? (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-wider animate-pulse">
                          Free Cut!
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">
                          {5 - currentStamps} left
                        </span>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <User className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              {query ? `No clients matching "${query}"` : 'No clients registered yet'}
            </h3>
            <Link href="/customers/new" className="inline-block mt-3">
              <Button size="sm" variant="primary">
                Add Client
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* DESKTOP VIEW (>= md): Full Clean Table */}
      <div className="hidden md:block rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {customers && customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-4 px-6">Client</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Current Stamps</th>
                  <th className="py-4 px-6">Reward Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {customers.map((c) => {
                  const card = c.card;
                  const currentStamps = card?.current_stamps || 0;
                  const isUnlocked = card?.status === 'reward_available' || currentStamps >= 5;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <Link
                          href={`/customers/${c.id}`}
                          className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-amber-600 flex items-center gap-2.5"
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
                            {c.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{c.full_name}</div>
                            {c.email && (
                              <div className="text-xs text-zinc-400 font-normal">{c.email}</div>
                            )}
                          </div>
                        </Link>
                      </td>

                      <td className="py-4 px-6 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                        {c.phone || '—'}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                            {currentStamps} / 5
                          </span>
                          <span className="text-xs text-zinc-400">haircuts</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {isUnlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider animate-pulse">
                            <Gift className="w-3.5 h-3.5" />
                            Free Haircut Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold">
                            {5 - currentStamps} cuts remaining
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <Link href={`/customers/${c.id}`}>
                          <Button size="sm" variant="outline" className="font-semibold text-xs">
                            Open Profile
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <User className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
              {query ? `No clients found for "${query}"` : 'No clients registered yet'}
            </h3>
            <div className="mt-4">
              <Link href="/customers/new">
                <Button variant="primary">Add First Client</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
