'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18nContext';

interface PreviewData {
  discord: {
    channels: Array<{ type: string; name: string; id: string }>;
    webhooks: Array<{ type: string; url: string }>;
  };
  database: {
    [key: string]: number;
  };
}

export default function RemoveSetupButton() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setError(null);
    setSuccess(false);
    setConfirmationText('');
    setShowPreview(false);
    setPreview(null);

    // Get preview
    setIsLoadingPreview(true);
    try {
      const response = await fetch('/api/admin/setup/remove', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data.preview);
        setShowPreview(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t('admin.remove_setup.preview_failed'));
      }
    } catch (error) {
      setError(
        t('admin.remove_setup.preview_connection', { message: (error as Error).message })
      );
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
    setSuccess(false);
    setConfirmationText('');
    setShowPreview(false);
    setPreview(null);
  };

  const handleRemoveSetup = async () => {
    if (confirmationText !== 'DELETE') {
      setError(t('admin.remove_setup.confirm_required'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/setup/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(true);
        console.log('Setup removal result:', result);
        setTimeout(() => {
          router.replace('/auth/select-server');
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t('admin.remove_setup.unknown_error'));
      }
    } catch (error) {
      setError(t('admin.remove_setup.connection_error', { message: (error as Error).message }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
      >
        {t('admin.remove_setup.button')}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 shadow-2xl">
            <div className="flex max-h-[85vh] flex-col">
              <div className="border-b border-white/10 px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/30">
                      <span className="text-base">⚠️</span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {t('admin.remove_setup.title')}
                      </h3>
                      <p className="text-xs text-red-300">{t('admin.remove_setup.irreversible')}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-300">
                    {t('admin.remove_setup.critical')}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!success ? (
                  <>
                    <div className="mb-4 space-y-3 text-sm text-gray-300">
                      <p className="font-medium text-white">{t('admin.remove_setup.will_delete')}</p>

                      {isLoadingPreview ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="flex items-center gap-3 text-gray-400">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-white"></div>
                            {t('admin.remove_setup.preview_loading')}
                          </div>
                        </div>
                      ) : showPreview && preview ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {/* Discord Channels */}
                          <div className="rounded-xl border border-white/5 bg-gray-900/60 p-3 shadow-sm">
                            <div className="mb-2 flex items-center justify-between">
                              <h4 className="flex items-center gap-2 text-sm font-semibold text-red-300">
                                <span className="text-base">📺</span>{' '}
                                {t('admin.remove_setup.discord_channels')}
                              </h4>
                              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                                {preview.discord.channels.length}
                              </span>
                            </div>
                            {preview.discord.channels.length > 0 ? (
                              <ul className="max-h-40 space-y-1 overflow-auto text-xs">
                                {preview.discord.channels.map((channel, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center justify-between gap-2 text-gray-300"
                                  >
                                    <span className="truncate font-medium">{channel.name}</span>
                                    <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                                      {channel.type}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-gray-500">
                                {t('admin.remove_setup.no_channels')}
                              </p>
                            )}
                          </div>

                          {/* Discord Webhooks */}
                          <div className="rounded-xl border border-white/5 bg-gray-900/60 p-3 shadow-sm">
                            <div className="mb-2 flex items-center justify-between">
                              <h4 className="flex items-center gap-2 text-sm font-semibold text-orange-300">
                                <span className="text-base">🔗</span>{' '}
                                {t('admin.remove_setup.discord_webhooks')}
                              </h4>
                              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs text-orange-300">
                                {preview.discord.webhooks.length}
                              </span>
                            </div>
                            {preview.discord.webhooks.length > 0 ? (
                              <ul className="max-h-40 space-y-1 overflow-auto text-xs">
                                {preview.discord.webhooks.map((webhook, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center justify-between gap-2 text-gray-300"
                                  >
                                    <span className="truncate font-medium">
                                      {t('admin.remove_setup.webhook_of', { type: webhook.type })}
                                    </span>
                                    <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                                      {t('admin.remove_setup.webhook_badge')}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-gray-500">
                                {t('admin.remove_setup.no_webhooks')}
                              </p>
                            )}
                          </div>

                          {/* Database Tables */}
                          <div className="md:col-span-2 rounded-xl border border-white/5 bg-gray-900/60 p-3 shadow-sm">
                            <div className="mb-2 flex items-center justify-between">
                              <h4 className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                                <span className="text-sm">🗄️</span>{' '}
                                {t('admin.remove_setup.db_records')}
                              </h4>
                              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300">
                                {t('admin.remove_setup.total', { count: preview.database.total })}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2 md:grid-cols-3">
                              {Object.entries(preview.database)
                                .filter(([key]) => key !== 'total')
                                .map(([table, count]) => (
                                  <div
                                    key={table}
                                    className="flex items-center justify-between rounded-md bg-gray-800/60 px-2.5 py-1.5"
                                  >
                                    <span className="text-gray-300 capitalize">
                                      {table.replace('_', ' ')}
                                    </span>
                                    <span className="font-semibold text-blue-300">{count}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mb-3">
                      <label className="mb-2 block text-sm font-medium text-white">
                        {t('admin.remove_setup.confirm_label', { code: 'DELETE' })
                          .split('DELETE')
                          .map((part, i, arr) =>
                            i < arr.length - 1 ? (
                              <span key={i}>
                                {part}
                                <code className="rounded bg-gray-800 px-2 py-1 text-red-300">
                                  DELETE
                                </code>
                              </span>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                      </label>
                      <input
                        type="text"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-white placeholder-gray-500 shadow-inner focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                        placeholder="DELETE"
                        disabled={isLoading || isLoadingPreview || !showPreview}
                      />
                    </div>

                    {error && (
                      <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5">
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={handleCloseModal}
                        disabled={isLoading || isLoadingPreview}
                        className="flex-1 rounded-lg border border-white/10 bg-gray-900/60 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white/10 disabled:opacity-50 transition-colors"
                      >
                        {t('admin.remove_setup.cancel')}
                      </button>
                      <button
                        onClick={handleRemoveSetup}
                        disabled={
                          isLoading ||
                          isLoadingPreview ||
                          !showPreview ||
                          confirmationText !== 'DELETE'
                        }
                        className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20 hover:from-red-500 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            {t('admin.remove_setup.removing')}
                          </div>
                        ) : (
                          t('admin.remove_setup.remove')
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/30">
                        <span className="text-2xl">✅</span>
                      </div>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      {t('admin.remove_setup.success_title')}
                    </h3>
                    <p className="mb-4 text-sm text-gray-300">
                      {t('admin.remove_setup.success_body')}
                    </p>
                    <button
                      onClick={() => router.replace('/auth/select-server')}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                    >
                      {t('admin.remove_setup.go_select_server')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
