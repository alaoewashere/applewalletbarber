'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Search, Camera, AlertCircle, ArrowRight, CheckCircle2, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ScannerPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualTokenOrQuery, setManualTokenOrQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        setErrorMsg('Camera access is not supported by this browser. Use manual search below.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasCameraPermission(true);
    } catch (err: unknown) {
      setHasCameraPermission(false);
      setErrorMsg('Camera permission was denied. Please allow camera access or use manual search.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenOrQuery.trim()) return;

    setIsSearching(true);
    setErrorMsg(null);

    try {
      // Check if input is a direct qr_token or search query
      const res = await fetch(`/api/scanner/lookup?q=${encodeURIComponent(manualTokenOrQuery.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.customerId) {
        throw new Error(data.error || 'Customer not found.');
      }

      router.push(`/customers/${data.customerId}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          Scan Customer Pass
        </h1>
        <p className="text-xs text-zinc-500">
          Scan the QR code from the customer&apos;s digital wallet or search manually.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-zinc-200 dark:bg-zinc-800 rounded-2xl max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'camera'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          Camera Scanner
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'manual'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Manual Search
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Camera Viewfinder */}
      {activeTab === 'camera' && (
        <div className="rounded-3xl bg-black overflow-hidden shadow-2xl border border-zinc-800 relative aspect-square max-w-sm mx-auto flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Scanner Overlay Box */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
            <div className="w-56 h-56 border-2 border-amber-400/80 rounded-3xl relative animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1 rounded-br-lg"></div>

              {/* Center scan line */}
              <div className="w-full h-0.5 bg-amber-400 absolute top-1/2 -translate-y-1/2 shadow-md animate-bounce"></div>
            </div>
            <p className="text-white/80 text-xs font-medium mt-4 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
              Point camera at pass QR code
            </p>
          </div>
        </div>
      )}

      {/* Manual Search Fallback */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Fast Lookup by Name, Phone, or QR Token
        </h2>
        <form onSubmit={handleManualLookup} className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={manualTokenOrQuery}
              onChange={(e) => setManualTokenOrQuery(e.target.value)}
              placeholder="Enter customer name, phone number, or token..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          <Button
            type="submit"
            isLoading={isSearching}
            className="w-full bg-zinc-900 text-white hover:bg-zinc-800 font-bold"
          >
            <span>Search Customer</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>
      </div>
    </div>
  );
}
