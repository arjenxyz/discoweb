'use client';

import { useState } from 'react';
import Image from 'next/image';
import ActivityDashboard from './ActivityDashboard';

export default function ActivityPage() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0b0d12] text-white px-6">
        <div className="max-w-xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#5865F2]/20 mb-6">
            <Image src="/papel.gif" alt="papel" width={36} height={36} className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-bold mb-2">DiscoWeb Dashboard</h1>
          <p className="text-sm text-white/70 mb-6">
            Aktivite içinde panelini buradan yönet. Hemen başlayıp hesabını, cüzdanını ve bildirimlerini
            görebilirsin.
          </p>
          <button
            onClick={() => setStarted(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#5865F2] text-white font-semibold hover:bg-[#4752C4] transition"
          >
            <span>Başlayalım</span>
          </button>
        </div>
      </div>
    );
  }

  return <ActivityDashboard />;
}
