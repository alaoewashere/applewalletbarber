'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, Gift, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface CustomerActionsProps {
  customerId: string;
  currentStamps: number;
  stampsRequired: number;
  rewardTitle: string;
  isRewardUnlocked: boolean;
  availableRewardId?: string | null;
}

export function CustomerActions({
  customerId,
  currentStamps,
  stampsRequired = 5,
  rewardTitle = 'Free Haircut',
  isRewardUnlocked,
  availableRewardId,
}: CustomerActionsProps) {
  const router = useRouter();

  const [isAddingStamp, setIsAddingStamp] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showAddStampModal, setShowAddStampModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddStampConfirm = async () => {
    setIsAddingStamp(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Haptic feedback for phone
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([40, 30, 40]);
    }

    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/loyalty/add-stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add stamp');
      }

      setShowAddStampModal(false);
      setSuccessMsg('✂️ Stamp added successfully!');

      // Check if reward unlocked
      if (currentStamps + 1 >= stampsRequired) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error adding stamp');
    } finally {
      setIsAddingStamp(false);
    }
  };

  const handleRedeemConfirm = async () => {
    setIsRedeeming(true);
    setErrorMsg(null);

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([80, 50, 80]);
    }

    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          rewardId: availableRewardId,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to redeem reward');
      }

      setShowRedeemModal(false);
      setSuccessMsg('🎉 Free haircut redeemed! Next cycle started at 0 stamps.');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error redeeming reward');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Touch-Friendly Action Buttons */}
      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
        {/* ADD STAMP BUTTON */}
        <Button
          size="lg"
          variant="primary"
          onClick={() => {
            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate?.(25);
            }
            setShowAddStampModal(true);
          }}
          className="h-14 sm:h-16 w-full bg-zinc-900 text-white hover:bg-zinc-800 text-base font-black shadow-lg active:scale-95 flex items-center justify-center gap-2.5 rounded-2xl"
        >
          <Scissors className="w-6 h-6 text-amber-400 rotate-45 transform" />
          <span>Add 1 Stamp</span>
        </Button>

        {/* REDEEM REWARD BUTTON */}
        {isRewardUnlocked ? (
          <Button
            size="lg"
            variant="success"
            onClick={() => setShowRedeemModal(true)}
            className="h-14 sm:h-16 w-full bg-emerald-600 text-white hover:bg-emerald-700 text-base font-black shadow-lg animate-pulse active:scale-95 flex items-center justify-center gap-2.5 rounded-2xl"
          >
            <Gift className="w-6 h-6 text-amber-300" />
            <span>Redeem Free Haircut</span>
          </Button>
        ) : (
          <div className="h-12 sm:h-16 px-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-xs text-zinc-400 font-medium select-none text-center">
            {stampsRequired - currentStamps} more stamps to unlock {rewardTitle}
          </div>
        )}
      </div>

      {/* Confirmation Bottom-Sheet / Modal for Add Stamp */}
      {showAddStampModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 pb-8 sm:pb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <Scissors className="w-6 h-6 rotate-45 transform" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Confirm Haircut Stamp
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Progress will update from{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {currentStamps}/{stampsRequired}
                </strong>{' '}
                to{' '}
                <strong className="text-amber-500 font-bold">
                  {currentStamps + 1}/{stampsRequired} Haircuts
                </strong>
                .
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl text-sm font-bold"
                onClick={() => setShowAddStampModal(false)}
                disabled={isAddingStamp}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 h-12 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-black text-sm"
                onClick={handleAddStampConfirm}
                isLoading={isAddingStamp}
              >
                Confirm (+1)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Bottom-Sheet / Modal for Redeem Reward */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 pb-8 sm:pb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Redeem Free Haircut Reward?
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                This marks the free haircut as claimed and resets the client&apos;s pass to 0/5 to begin their next reward cycle.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl text-sm font-bold"
                onClick={() => setShowRedeemModal(false)}
                disabled={isRedeeming}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                className="flex-1 h-12 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-black text-sm"
                onClick={handleRedeemConfirm}
                isLoading={isRedeeming}
              >
                Confirm Reward
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
