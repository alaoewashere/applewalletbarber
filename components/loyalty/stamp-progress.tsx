'use client';

import React from 'react';
import { Scissors, Gift, Sparkles, Check } from 'lucide-react';

interface StampProgressProps {
  currentStamps: number;
  stampsRequired: number;
  rewardTitle?: string;
  isUnlocked?: boolean;
}

export function StampProgress({
  currentStamps,
  stampsRequired = 5,
  rewardTitle = 'Free Haircut',
  isUnlocked = false,
}: StampProgressProps) {
  const percentage = Math.min(Math.round((currentStamps / stampsRequired) * 100), 100);
  const slots = Array.from({ length: stampsRequired });

  return (
    <div className="w-full">
      {/* Header status */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">
            Loyalty Progress
          </span>
          <div className="text-3xl font-black text-zinc-900 tracking-tight mt-0.5">
            {currentStamps} <span className="text-zinc-400 text-2xl font-normal">/ {stampsRequired} Haircuts</span>
          </div>
        </div>

        {isUnlocked ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 text-amber-700 border border-amber-300 rounded-full font-bold text-xs uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Reward Ready!
          </div>
        ) : (
          <div className="text-right">
            <span className="text-xs text-zinc-500 font-medium">Next Reward</span>
            <div className="text-sm font-semibold text-zinc-800">{rewardTitle}</div>
          </div>
        )}
      </div>

      {/* Stamp Slots Grid */}
      <div className="grid grid-cols-5 gap-3 py-3">
        {slots.map((_, index) => {
          const isStamped = index < currentStamps;
          const isRewardSlot = index === stampsRequired - 1;

          return (
            <div
              key={index}
              className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 transition-all duration-300 ${
                isStamped
                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-900/10 scale-105'
                  : 'bg-zinc-50 border-dashed border-zinc-300 text-zinc-400 hover:border-zinc-400'
              }`}
            >
              {isStamped ? (
                isRewardSlot ? (
                  <Gift className="w-7 h-7 text-amber-400 animate-bounce" />
                ) : (
                  <Scissors className="w-6 h-6 text-amber-300 rotate-45 transform" />
                )
              ) : isRewardSlot ? (
                <Gift className="w-6 h-6 text-zinc-400 opacity-60" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300"></div>
              )}

              <span
                className={`text-[10px] font-bold mt-1.5 ${
                  isStamped ? 'text-zinc-300' : 'text-zinc-400'
                }`}
              >
                #{index + 1}
              </span>

              {isStamped && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-zinc-900 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2 text-center">
          {isUnlocked
            ? '🎉 Congratulations! Your free haircut reward is unlocked.'
            : `${stampsRequired - currentStamps} more ${
                stampsRequired - currentStamps === 1 ? 'haircut' : 'haircuts'
              } until your ${rewardTitle.toLowerCase()}!`}
        </p>
      </div>
    </div>
  );
}
