'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

type ActivityContextValue = {
  sessionToken: string;
  userId: string;
  username: string;
  avatar: string | null;
  guildId: string | null;
  channelId: string | null;
  /** Bearer token'lı fetch wrapper */
  activityFetch: (url: string, init?: RequestInit) => Promise<Response>;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function useActivity(): ActivityContextValue {
  const ctx = useContext(ActivityContext);
  if (!ctx) {
    throw new Error('useActivity hook sadece ActivityProvider içinde kullanılabilir');
  }
  return ctx;
}

type ActivityProviderProps = {
  sessionToken: string;
  userId: string;
  username: string;
  avatar: string | null;
  guildId: string | null;
  channelId: string | null;
  children: ReactNode;
};

export function ActivityProvider({
  sessionToken,
  userId,
  username,
  avatar,
  guildId,
  channelId,
  children,
}: ActivityProviderProps) {
  const value = useMemo<ActivityContextValue>(() => {
    const activityFetch = (url: string, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${sessionToken}`);
      // Guild bilgisini header olarak gönder (cookie yerine)
      if (guildId) {
        headers.set('X-Guild-Id', guildId);
      }
      return fetch(url, { ...init, headers });
    };

    return { sessionToken, userId, username, avatar, guildId, channelId, activityFetch };
  }, [sessionToken, userId, username, avatar, guildId, channelId]);

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}
