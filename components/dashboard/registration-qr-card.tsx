'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download, Copy, Check, Printer, ExternalLink, Scissors, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RegistrationQrCardProps {
  businessName: string;
  businessSlug: string;
  primaryColor?: string | null;
  stampsRequired?: number;
}

export function RegistrationQrCard({
  businessName,
  businessSlug,
  primaryColor = '#18181b',
  stampsRequired = 5,
}: RegistrationQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const printCardRef = useRef<HTMLDivElement | null>(null);

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${businessSlug}`
      : `/join/${businessSlug}`;

  useEffect(() => {
    if (joinUrl) {
      QRCode.toDataURL(joinUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#09090b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate registration QR:', err));
    }
  }, [joinUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;

    // Create high-res branded canvas for printing
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Golden accent border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    // Header Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(businessName.toUpperCase(), canvas.width / 2, 80);

    // Subtitle
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('VIP LOYALTY CLUB', canvas.width / 2, 115);

    // Instructions
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Collect ${stampsRequired} Haircuts = 1 Free Haircut!`, canvas.width / 2, 145);
    ctx.fillText('Scan with phone camera to add pass to Apple Wallet', canvas.width / 2, 175);

    // Draw QR image
    const img = new Image();
    img.src = qrDataUrl;
    img.onload = () => {
      // White container for QR
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(100, 210, 400, 400, 24);
      ctx.fill();

      ctx.drawImage(img, 120, 230, 360, 360);

      // Footer notice
      ctx.fillStyle = '#71717a';
      ctx.font = '14px sans-serif';
      ctx.fillText('No app download required • Instant pass', canvas.width / 2, 650);
      ctx.fillText('Present card at checkout to collect stamps', canvas.width / 2, 680);

      // Trigger download
      const link = document.createElement('a');
      link.download = `${businessSlug}-registration-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-7 shadow-sm space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-400/10 text-amber-500">
              <QrCode className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Customer Registration QR
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Permanent Shop Code
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Display this QR code at your shop. New clients scan it with their camera to create their loyalty pass in 10 seconds.
          </p>
        </div>

        <a
          href={joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors shrink-0"
        >
          <span>Preview Join Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main Grid: QR Visual Card on left, Actions and Instructions on right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Printable Card Preview */}
        <div
          ref={printCardRef}
          className="p-6 rounded-3xl bg-zinc-950 text-white border border-amber-400/40 shadow-xl flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-zinc-900 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Scissors className="w-3.5 h-3.5 rotate-45 transform" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              {businessName}
            </span>
          </div>

          <h3 className="text-sm font-black tracking-tight text-white mb-1">
            Scan to Join VIP Loyalty Club
          </h3>
          <p className="text-[11px] text-zinc-400 mb-4">
            Collect {stampsRequired} haircuts and get 1 free!
          </p>

          {/* QR Code Container */}
          <div className="p-3 bg-white rounded-2xl shadow-2xl border border-zinc-200">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`${businessName} Customer Registration QR Code`}
                className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-xs text-zinc-400 animate-pulse">
                Generating QR...
              </div>
            )}
          </div>

          <span className="text-[10px] text-zinc-400 font-mono mt-3">
            Instant Apple & Google Wallet Pass
          </span>
        </div>

        {/* Buttons & Explanations */}
        <div className="space-y-4">
          <div className="space-y-2.5">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleDownload}
              className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-2xl shadow-md active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Printable QR Code (PNG)</span>
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleCopy}
                className="w-full font-bold active:scale-95 flex items-center justify-center gap-2 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handlePrint}
                className="w-full font-bold active:scale-95 flex items-center justify-center gap-2 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Counter Sign</span>
              </Button>
            </div>
          </div>

          {/* Architectural Distinction Guide */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 text-left">
            <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Two Separate QR Code Roles:</span>
            </div>
            <ul className="text-[11px] text-zinc-500 space-y-1.5 leading-relaxed pl-4 list-disc">
              <li>
                <strong className="text-zinc-700 dark:text-zinc-300">Shop Registration QR (Above):</strong> Permanent and shared by all new customers. Scanned by clients to join. Cannot award stamps.
              </li>
              <li>
                <strong className="text-zinc-700 dark:text-zinc-300">Customer Personal QR:</strong> Unique to each client inside their Apple/Google Wallet. Scanned only by you via <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded text-[10px]">Station Scanner</code> to award stamps.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
