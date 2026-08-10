'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuLoader } from 'react-icons/lu';
import { useTranslation } from '@/lib/i18nContext';

function DiscordAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [status, setStatus] = useState(() => t('auth.callback.verifying'));

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      const params = new URLSearchParams();
      params.set('error', error);
      if (errorDescription) {
        params.set('error_description', errorDescription);
      }
      router.replace(`/auth/error?${params.toString()}`);
      return;
    }

    const code = searchParams.get('code');
    if (!code) {
      router.replace('/auth/error');
      return;
    }

    const exchange = async () => {
      try {
        setStatus(t('auth.callback.verifying_discord'));
        const response = await fetch('/api/discord/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
          credentials: 'include',
        });

        if (!response.ok) {
          let body: any = null;
          let text: string | null = null;
          try {
            body = await response.json();
          } catch {
            try {
              text = await response.text();
            } catch {
              text = null;
            }
          }

          console.error('Discord exchange failed - status:', response.status,
            'statusText:', response.statusText,
            'body:', body,
            'text:', text,
            'raw response object:', response);

          try {
            localStorage.setItem(
              'oauth_debug',
              JSON.stringify({ time: new Date().toISOString(), status: response.status, body, text }),
            );
          } catch {}

          const reason = body?.reason || (text ? text : 'unknown');
          router.replace(`/auth/error?reason=${encodeURIComponent(reason)}`);
          return;
        }

        const payload = (await response.json()) as {
          status: 'ok' | 'no_guilds' | 'error';
          isAdmin?: boolean;
          adminGuilds?: Array<{ id: string; name: string; isAdmin: boolean; isSetup: boolean; verifyRoleId: string | null; isOwner?: boolean }>;
          user?: { id: string; username: string; avatar: string | null; discriminator: string };
        };

        if (payload.status === 'no_guilds') {
          setStatus(t('auth.callback.no_guilds'));
          if (payload.user) {
            localStorage.setItem('discordUser', JSON.stringify(payload.user));
          }
          localStorage.setItem('adminGuilds', JSON.stringify(payload.adminGuilds ?? []));
          localStorage.setItem('adminGuildsUpdatedAt', new Date().toISOString());
          setTimeout(() => router.replace('/auth/select-server'), 1200);
          return;
        }

        if (payload.status === 'ok') {
          setStatus(t('auth.callback.success'));

          console.log('OAuth payload:', payload);

          if (payload.user) {
            localStorage.setItem('discordUser', JSON.stringify(payload.user));
          }

          const totalGuilds = payload.adminGuilds?.length || 0;

          if (totalGuilds > 0) {
            localStorage.setItem('adminGuilds', JSON.stringify(payload.adminGuilds));
            localStorage.setItem('adminGuildsUpdatedAt', new Date().toISOString());
            setTimeout(() => router.replace('/auth/select-server'), 1200);
            return;
          }

          localStorage.setItem('adminGuilds', JSON.stringify([]));
          localStorage.setItem('adminGuildsUpdatedAt', new Date().toISOString());
          setTimeout(() => router.replace('/auth/select-server'), 1200);
          return;
        }

        router.replace('/auth/error');
      } catch (err) {
        console.error('Discord exchange encountered exception', err);
        router.replace('/auth/error');
      }
    };

    exchange();
  }, [router, searchParams, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0d12] text-white">
      <div className="text-center">
        <LuLoader className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-white/70">{status}</p>
      </div>
    </div>
  );
}

function CallbackFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0d12] text-white">
      <div className="text-center">
        <LuLoader className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-white/70">{t('auth.callback.loading')}</p>
      </div>
    </div>
  );
}

export default function DiscordAuthCallbackPage() {
  return (
    <div className="bg-[#0b0d12]">
      <Suspense fallback={<CallbackFallback />}>
        <DiscordAuthCallbackContent />
      </Suspense>
    </div>
  );
}
