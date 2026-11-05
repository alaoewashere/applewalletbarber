import React from 'react';
import { getCurrentUserProfile, setupBusinessOnboarding } from '@/lib/services/business';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/layout/dashboard-nav';


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, business, user } = await getCurrentUserProfile();

  if (!user) {
    redirect('/login');
  }

  // If user signed up but profile/business record isn't linked yet, initialize default
  let activeBusiness = business;
  let activeProfile = profile;

  if (!business || !profile) {
    const res = await setupBusinessOnboarding({
      businessName: 'My Barbershop',
      fullName: user.email?.split('@')[0] || 'Master Barber',
      stampsRequired: 5,
      rewardTitle: 'Free Haircut',
    });

    if (res.success) {
      const refreshed = await getCurrentUserProfile();
      activeBusiness = refreshed.business;
      activeProfile = refreshed.profile;
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <DashboardNav
        businessName={activeBusiness?.name || 'Barbershop'}
        userName={activeProfile?.full_name || user.email || 'Barber'}
        role={activeProfile?.role || 'owner'}
      />
      <main className="flex-1 pb-32 md:pb-12 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {children}
      </main>
    </div>
  );
}
