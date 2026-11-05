'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Scissors, Gift, Sparkles, Smartphone, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DigitalCardProps {
  businessName?: string;
  customerName?: string;
  currentStamps: number;
  stampsRequired: number;
  rewardTitle?: string;
  qrToken: string;
  primaryColor?: string;
}

export function DigitalLoyaltyCard({
  businessName = 'Yoused Barber',
  customerName = 'Valued Customer',
  currentStamps = 0,
  stampsRequired = 5,
  rewardTitle = 'Free Haircut',
  qrToken,
  primaryColor = '#18181b',
}: DigitalCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const isRewardUnlocked = currentStamps >= stampsRequired;

  useEffect(() => {
    if (qrToken) {
      QRCode.toDataURL(qrToken, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [qrToken]);

  const handleGoogleWalletClick = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const res = await fetch(`/api/wallet/google/${qrToken}`);
      const data = await res.json();

      if (data.success && data.saveUrl) {
        window.location.href = data.saveUrl;
      } else {
        setGoogleError(
          data.error ||
            'Google Wallet API credentials are not yet configured. Apple Wallet pass is ready and active below.'
        );
      }
    } catch (err: unknown) {
      setGoogleError('Failed to connect to Google Wallet service.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const applePassUrl = `/api/wallet/apple/${qrToken}/download`;

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Wallet Pass Container */}
      <div
        className="relative overflow-hidden rounded-3xl p-4 sm:p-6 text-white shadow-2xl transition-all duration-300 border border-white/10"
        style={{
          backgroundColor: primaryColor || '#18181b',
          backgroundImage:
            'radial-gradient(circle at top right, rgba(212,175,55,0.18), transparent 60%), radial-gradient(circle at bottom left, rgba(0,0,0,0.6), transparent 70%)',
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 rotate-45 transform" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs uppercase font-semibold tracking-wider text-amber-200/80">
                Barbershop Pass
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight truncate">
                {businessName}
              </h2>
            </div>
          </div>

          <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 sm:py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 uppercase tracking-widest text-amber-300 shrink-0">
            VIP
          </span>
        </div>

        {/* Member Name */}
        <div className="mt-3 sm:mt-4 flex justify-between items-baseline gap-2">
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              Customer
            </div>
            <div className="text-sm sm:text-base font-bold text-white truncate">{customerName}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              Reward
            </div>
            <div className="text-xs sm:text-sm font-semibold text-amber-300">{rewardTitle}</div>
          </div>
        </div>

        {/* Big Stamps Visualizer */}
        <div className="my-4 sm:my-6 p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
          <div className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-amber-300 mb-1.5 sm:mb-2">
            LOYALTY REWARD
          </div>

          {/* Stamp row: ✂️ ✂️ ✂️ ✂️ ○ */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 my-2">
            {Array.from({ length: stampsRequired }).map((_, idx) => {
              const filled = idx < currentStamps;
              const isGift = idx === stampsRequired - 1;
              return (
                <div
                  key={idx}
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold border transition-all ${
                    filled
                      ? 'bg-amber-400 border-amber-300 text-zinc-950 shadow-md scale-105'
                      : 'bg-white/5 border-white/20 text-white/40'
                  }`}
                >
                  {filled ? (
                    isGift ? (
                      <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950 animate-bounce" />
                    ) : (
                      <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-950 rotate-45 transform" />
                    )
                  ) : isGift ? (
                    <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40" />
                  ) : (
                    <span className="text-[10px] sm:text-xs">○</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-xl sm:text-2xl font-black mt-2 sm:mt-3 text-white tracking-tight">
            {currentStamps} / {stampsRequired} Haircuts
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-300 mt-0.5">
            Collect {stampsRequired} haircuts and get one free!
          </p>

          {isRewardUnlocked && (
            <div className="mt-2.5 sm:mt-3 py-1.5 px-3 bg-amber-400 text-zinc-950 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-1.5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
              <span>🎉 Next haircut is free!</span>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center pt-1 pb-1">
          <div className="p-2.5 sm:p-3 bg-white rounded-2xl shadow-xl border border-zinc-200">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="Loyalty QR Code"
                className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
              />
            ) : (
              <div className="w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center text-xs text-zinc-400 animate-pulse">
                Generating QR...
              </div>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] text-zinc-400 mt-2 font-mono tracking-wider">
            Scan at station checkout
          </span>
        </div>
      </div>

      {/* Official Wallet Action Buttons */}
      <div className="mt-4 sm:mt-5 space-y-2.5">
        {/* Real Apple Wallet Button */}
        <a
          href={applePassUrl}
          className="w-full h-12 sm:h-14 px-4 rounded-2xl bg-black hover:bg-zinc-900 text-white font-semibold flex items-center justify-center gap-2.5 shadow-md border border-zinc-800 transition-all active:scale-[0.98] text-xs sm:text-sm group"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current group-hover:scale-105 transition-transform" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.41-9.78-11.48-20.76-15.22-32.94-3.74-12.18-5.61-23.7-5.61-34.56 0-14.35 3.69-26.14 11.07-35.37 7.38-9.23 16.49-13.96 27.33-14.2 4.35 0 9.27 1.13 14.77 3.39 5.49 2.26 9.4 3.44 11.73 3.55 2.12-.11 6.13-1.32 12.02-3.62 5.89-2.3 10.63-3.37 14.22-3.21 13.04.64 23.36 5.34 30.96 14.1-11.52 6.96-17.18 16.41-16.98 28.35.2 9.57 3.96 17.65 11.28 24.24 7.32 6.59 15.93 10.27 25.83 11.04-2.39 7.62-5.49 15.42-9.3 23.41zM119.22 31.84c0-7.39 2.66-14.42 7.98-21.09 5.32-6.67 11.89-10.75 19.71-12.25.33 1.2.49 2.39.49 3.59 0 7.39-2.77 14.65-8.31 21.78-5.54 7.13-12.22 11.22-20.04 12.27-.43-1.42-.65-2.82-.65-4.3z" />
          </svg>
          <span className="tracking-tight">Add to Apple Wallet</span>
          <Download className="w-3.5 h-3.5 text-zinc-400 ml-auto group-hover:translate-y-0.5 transition-transform" />
        </a>

        {/* Google Wallet Button */}
        <button
          type="button"
          onClick={handleGoogleWalletClick}
          disabled={googleLoading}
          className="w-full h-12 sm:h-14 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2.5 shadow-md border border-zinc-700 transition-all active:scale-[0.98] text-xs sm:text-sm"
        >
          <Smartphone className="w-5 h-5 text-emerald-400" />
          <span>{googleLoading ? 'Generating Save Link...' : 'Save to Google Wallet'}</span>
        </button>

        {/* Informative Google notice if clicked before Issuer configured */}
        {googleError && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-zinc-300 leading-relaxed">
              <span className="font-semibold text-amber-300 block mb-0.5">Google Wallet Status</span>
              {googleError}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
