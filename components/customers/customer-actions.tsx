'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, Gift, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';
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
          particleCount: 100,
          spread: 70,
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
      setSuccessMsg('🎉 Reward redeemed! A new loyalty cycle has started.');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error redeeming reward');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="space-y-4">
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

      {/* Prominent Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* ADD STAMP BUTTON */}
        <Button
          size="lg"
          variant="primary"
          onClick={() => setShowAddStampModal(true)}
          className="h-14 bg-zinc-900 text-white hover:bg-zinc-800 text-base font-extrabold shadow-md flex items-center justify-center gap-2"
        >
          <Scissors className="w-5 h-5 text-amber-400 rotate-45 transform" />
          <span>Add 1 Stamp</span>
        </Button>

        {/* REDEEM REWARD BUTTON */}
        {isRewardUnlocked ? (
          <Button
            size="lg"
            variant="success"
            onClick={() => setShowRedeemModal(true)}
            className="h-14 bg-emerald-600 text-white hover:bg-emerald-700 text-base font-extrabold shadow-md animate-pulse flex items-center justify-center gap-2"
          >
            <Gift className="w-5 h-5 text-amber-300" />
            <span>Redeem Free Haircut</span>
          </Button>
        ) : (
          <div className="h-14 px-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-xs text-zinc-400 font-medium select-none">
            {stampsRequired - currentStamps} more stamps to unlock reward
          </div>
        )}
      </div>

      {/* Confirmation Modal for Add Stamp */}
      {showAddStampModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <Scissors className="w-6 h-6 rotate-45 transform" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Confirm Haircut Stamp
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Add 1 stamp to this customer&apos;s loyalty card? Progress will update from{' '}
                <strong>
                  {currentStamps}/{stampsRequired}
                </strong>{' '}
                to{' '}
                <strong>
                  {currentStamps + 1}/{stampsRequired}
                </strong>
                .
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddStampModal(false)}
                disabled={isAddingStamp}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 font-bold"
                onClick={handleAddStampConfirm}
                isLoading={isAddingStamp}
              >
                Confirm Stamp
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Redeem Reward */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Redeem Free Haircut Reward?
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                This will mark the customer&apos;s free haircut as redeemed, log the transaction in the
                permanent audit history, and reset the loyalty card to 0/5 stamps to start a new cycle.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRedeemModal(false)}
                disabled={isRedeeming}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
                onClick={handleRedeemConfirm}
                isLoading={isRedeeming}
              >
                Confirm Redemption
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
