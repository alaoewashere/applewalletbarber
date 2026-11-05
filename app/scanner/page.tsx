'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Camera, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsQR from 'jsqr';

function ScannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualTokenOrQuery, setManualTokenOrQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanSuccessText, setScanSuccessText] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  const handleLookup = useCallback(async (tokenOrQuery: string) => {
    if (!tokenOrQuery || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsSearching(true);
    setErrorMsg(null);

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }

      const res = await fetch(`/api/scanner/lookup?q=${encodeURIComponent(tokenOrQuery.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.customerId) {
        throw new Error(data.error || 'Customer not found.');
      }

      setScanSuccessText('Customer verified! Loading profile...');
      setTimeout(() => {
        router.push(`/customers/${data.customerId}`);
      }, 400);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lookup failed');
      isProcessingRef.current = false;
    } finally {
      setIsSearching(false);
    }
  }, [router]);

  useEffect(() => {
    const initialToken = searchParams.get('token') || searchParams.get('q');
    if (initialToken) {
      handleLookup(initialToken);
    }
  }, [searchParams, handleLookup]);

  const tick = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvasRef.current = canvas;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && !isProcessingRef.current) {
          handleLookup(code.data);
          return;
        }
      }
    }

    if (!isProcessingRef.current) {
      animationFrameRef.current = requestAnimationFrame(tick);
    }
  }, [handleLookup]);

  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    setScanSuccessText(null);
    isProcessingRef.current = false;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        setErrorMsg('Camera access is not supported by this browser. Use manual search below.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((playErr) => {
          console.debug('Video play interrupted:', playErr);
        });
      }
      setHasCameraPermission(true);
      animationFrameRef.current = requestAnimationFrame(tick);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setHasCameraPermission(false);
      setErrorMsg('Camera permission was not granted. Please allow camera access in browser settings.');
    }
  }, [tick]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTokenOrQuery.trim()) {
      handleLookup(manualTokenOrQuery.trim());
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          Station QR Scanner
        </h1>
        <p className="text-xs text-zinc-500">
          Point at client&apos;s Apple Wallet, Google Wallet, or mobile pass to instantly open their card.
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

      {scanSuccessText && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{scanSuccessText}</span>
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
            <div className="w-56 h-56 border-2 border-amber-400/80 rounded-3xl relative animate-pulse shadow-[0_0_25px_rgba(251,191,36,0.4)]">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1 rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1 rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1 rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1 rounded-br-xl"></div>

              {/* Center animated scan line */}
              <div className="w-full h-0.5 bg-amber-400 absolute top-1/2 -translate-y-1/2 shadow-lg animate-bounce"></div>
            </div>
            <p className="text-white/90 text-[11px] font-bold mt-4 bg-black/70 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              Hold camera over customer pass QR code
            </p>
          </div>
        </div>
      )}

      {/* Manual Search Fallback */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
          Fast Lookup by Name, Phone, or QR Token
        </h2>
        <form onSubmit={handleManualSubmit} className="space-y-3">
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
            className="w-full h-11 bg-zinc-900 text-white hover:bg-zinc-800 font-bold rounded-xl"
          >
            <span>Search Customer</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ScannerPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-xs text-zinc-400">Loading scanner...</div>}>
      <ScannerContent />
    </Suspense>
  );
}
