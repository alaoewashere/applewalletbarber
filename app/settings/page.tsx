'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Scissors, Sparkles, Check, AlertCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#18181b');
  const [stampsRequired, setStampsRequired] = useState(5);
  const [rewardTitle, setRewardTitle] = useState('Free Haircut');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.business) {
        setBusinessName(data.business.name || '');
        setPrimaryColor(data.business.primary_color || '#18181b');
      }
      if (data.program) {
        setStampsRequired(data.program.stamps_required || 5);
        setRewardTitle(data.program.reward_title || 'Free Haircut');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          primaryColor,
          stampsRequired: Number(stampsRequired),
          rewardTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccessMsg('Settings saved successfully!');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-zinc-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center dark:bg-zinc-100 dark:text-zinc-900">
          <Settings className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Business & Loyalty Settings
          </h1>
          <p className="text-xs text-zinc-500">
            Configure your shop branding and loyalty reward rules.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        {/* Business Information Card */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400">
            Barbershop Profile
          </h2>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Barbershop Name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Brand Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-2xl cursor-pointer border-0 bg-transparent"
              />
              <span className="font-mono text-sm text-zinc-500">{primaryColor}</span>
            </div>
          </div>
        </div>

        {/* Loyalty Program Rules */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400">
              Loyalty Program Rules
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Haircuts Required for Reward
            </label>
            <input
              type="number"
              min={2}
              max={20}
              required
              value={stampsRequired}
              onChange={(e) => setStampsRequired(Number(e.target.value))}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Standard is 5 haircuts = 1 free haircut.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Reward Title
            </label>
            <input
              type="text"
              required
              value={rewardTitle}
              onChange={(e) => setRewardTitle(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Displayed on client passes (e.g. &quot;Free Haircut&quot; or &quot;Free Beard Trim&quot;).
            </p>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          isLoading={isSaving}
          className="w-full h-14 bg-zinc-900 text-white hover:bg-zinc-800 font-black rounded-2xl active:scale-95 text-base"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Station Settings
        </Button>
      </form>
    </div>
  );
}
