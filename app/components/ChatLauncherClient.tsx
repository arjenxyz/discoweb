"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// Load ChatLauncher as a client component. Keep ssr:false inside this client wrapper.
const ChatLauncher = dynamic(() => import('./ChatLauncher'), { ssr: false });

export default function ChatLauncherClient() {
  return <ChatLauncher />;
}
