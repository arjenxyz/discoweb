'use client';

import { useState, useRef } from 'react';
import {
  LuPlay,
  LuClock,
  LuTrash2,
  LuCopy,
  LuCheck,
  LuChevronDown,
  LuLoader,
  LuPlus,
  LuX,
  LuFlaskConical,
} from 'react-icons/lu';

type HistoryItem = {
  id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: number;
};

type HeaderRow = { key: string; value: string };

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400',
  POST: 'bg-[#5865F2]/20 text-[#5865F2]',
  PUT: 'bg-amber-500/20 text-amber-400',
  PATCH: 'bg-orange-500/20 text-orange-400',
  DELETE: 'bg-rose-500/20 text-rose-400',
};

const ENDPOINT_GROUPS: { label: string; endpoints: { method: string; path: string }[] }[] = [
  {
    label: 'Developer',
    endpoints: [
      { method: 'GET', path: '/api/developer/check-access' },
      { method: 'GET', path: '/api/developer/users' },
      { method: 'GET', path: '/api/developer/servers' },
      { method: 'GET', path: '/api/developer/user-lookup?q=' },
      { method: 'GET', path: '/api/developer/system-stats' },
      { method: 'GET', path: '/api/developer/cache/stats' },
      { method: 'GET', path: '/api/developer/cache/entries' },
      { method: 'POST', path: '/api/developer/cache/clear' },
      { method: 'GET', path: '/api/developer/config-view' },
      { method: 'POST', path: '/api/developer/clear-data' },
      { method: 'POST', path: '/api/developer/sync-members' },
      { method: 'GET', path: '/api/developer/system-mails' },
    ],
  },
  {
    label: 'Admin',
    endpoints: [
      { method: 'GET', path: '/api/admin/settings' },
      { method: 'GET', path: '/api/admin/store' },
      { method: 'GET', path: '/api/admin/wallet' },
      { method: 'GET', path: '/api/admin/earn-settings' },
      { method: 'GET', path: '/api/notifications' },
    ],
  },
  {
    label: 'Auth',
    endpoints: [
      { method: 'GET', path: '/api/auth/me' },
      { method: 'POST', path: '/api/auth/logout' },
    ],
  },
  {
    label: 'Discord',
    endpoints: [
      { method: 'GET', path: '/api/discord/guilds' },
      { method: 'GET', path: '/api/server' },
    ],
  },
];

export default function ApiTestPage() {
  const [method, setMethod] = useState<string>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<HeaderRow[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ status: number; data: unknown; duration: number } | null>(null);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [endpointGroupOpen, setEndpointGroupOpen] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const sendRequest = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResponse(null);
    setResponseError(null);

    const fullUrl = url.startsWith('/') ? url : `/${url}`;
    const headersObj: Record<string, string> = { 'Content-Type': 'application/json' };
    headers.forEach(h => { if (h.key.trim()) headersObj[h.key.trim()] = h.value; });

    const start = performance.now();
    try {
      const options: RequestInit = {
        method,
        headers: headersObj,
        credentials: 'include',
      };
      if (method !== 'GET' && method !== 'DELETE' && body.trim()) {
        options.body = body;
      }

      const res = await fetch(fullUrl, options);
      const duration = Math.round(performance.now() - start);

      let data: unknown;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setResponse({ status: res.status, data, duration });
      setHistory(prev => [
        { id: crypto.randomUUID(), method, url: fullUrl, status: res.status, duration, timestamp: Date.now() },
        ...prev.slice(0, 29),
      ]);
    } catch (err: unknown) {
      const duration = Math.round(performance.now() - start);
      setResponseError(err instanceof Error ? err.message : 'Bağlantı hatası');
      setResponse({ status: 0, data: null, duration });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const selectEndpoint = (ep: { method: string; path: string }) => {
    setMethod(ep.method);
    setUrl(ep.path);
    setEndpointGroupOpen(null);
  };

  const statusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-400';
    if (status >= 400 && status < 500) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">API Test</h1>
        <p className="text-sm text-[#99AAB5] mt-1">API endpointlerini test edin ve yanıtları görüntüleyin.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          {/* Request Builder */}
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <LuFlaskConical className="w-4 h-4 text-pink-400" />
              <h2 className="text-sm font-semibold text-white">İstek Oluştur</h2>
            </div>

            {/* Method + URL */}
            <div className="flex gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMethodOpen(!methodOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold ${METHOD_COLORS[method]} border border-white/5 min-w-[90px] justify-between`}
                >
                  {method}
                  <LuChevronDown className="w-3 h-3" />
                </button>
                {methodOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl bg-[#18181b] border border-white/10 shadow-xl overflow-hidden">
                    {METHODS.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setMethod(m); setMethodOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-xs font-bold hover:bg-white/5 ${METHOD_COLORS[m]}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendRequest(); }}
                placeholder="/api/developer/check-access"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 focus:border-[#5865F2]/50 focus:outline-none transition-all"
              />

              <button
                type="button"
                onClick={sendRequest}
                disabled={loading || !url.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-white/10 disabled:text-white/30 text-white font-semibold text-sm transition-all"
              >
                {loading ? <LuLoader className="w-4 h-4 animate-spin" /> : <LuPlay className="w-4 h-4" />}
                Gönder
              </button>
            </div>

            {/* Headers */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-white/50">Başlıklar (Headers)</p>
                <button
                  type="button"
                  onClick={() => setHeaders([...headers, { key: '', value: '' }])}
                  className="flex items-center gap-1 text-[11px] text-[#5865F2] hover:text-[#7289DA] transition"
                >
                  <LuPlus className="w-3 h-3" /> Ekle
                </button>
              </div>
              {headers.length === 0 && (
                <p className="text-[11px] text-white/20 italic">Ek başlık yok (Content-Type: application/json otomatik eklenir)</p>
              )}
              {headers.map((h, i) => (
                <div key={i} className="flex gap-2 mb-1.5">
                  <input
                    type="text"
                    value={h.key}
                    onChange={e => {
                      const n = [...headers];
                      n[i].key = e.target.value;
                      setHeaders(n);
                    }}
                    placeholder="Key"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-xs text-white placeholder-white/20 focus:border-white/20 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={e => {
                      const n = [...headers];
                      n[i].value = e.target.value;
                      setHeaders(n);
                    }}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-xs text-white placeholder-white/20 focus:border-white/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setHeaders(headers.filter((_, idx) => idx !== i))}
                    className="px-2 text-white/30 hover:text-rose-400 transition"
                  >
                    <LuX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Body */}
            {method !== 'GET' && (
              <div className="mt-4">
                <p className="text-xs font-medium text-white/50 mb-2">Gövde (Body - JSON)</p>
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={4}
                  placeholder='{ "key": "value" }'
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-xs text-white font-mono placeholder-white/20 focus:border-white/20 focus:outline-none resize-y"
                />
              </div>
            )}
          </div>

          {/* Response */}
          {(response || responseError) && (
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-white">Yanıt</h2>
                  {response && (
                    <>
                      <span className={`text-xs font-bold ${statusColor(response.status)}`}>
                        {response.status || 'ERR'}
                      </span>
                      <span className="text-[11px] text-white/30 flex items-center gap-1">
                        <LuClock className="w-3 h-3" /> {response.duration}ms
                      </span>
                    </>
                  )}
                </div>
                {response?.data != null && (
                  <button
                    type="button"
                    onClick={copyResponse}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-white/50 transition"
                  >
                    {copied ? <LuCheck className="w-3 h-3 text-emerald-400" /> : <LuCopy className="w-3 h-3" />}
                    {copied ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                )}
              </div>

              {responseError && response?.data == null && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-sm text-rose-300">{responseError}</p>
                </div>
              )}

              {response?.data != null && (
                <pre className="p-4 rounded-2xl bg-black/30 border border-white/5 text-xs text-white/80 font-mono overflow-auto max-h-[500px] whitespace-pre-wrap break-words">
                  {typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Endpoints + History */}
        <div className="space-y-6">
          {/* Quick Endpoints */}
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5">
            <h3 className="text-xs font-semibold text-white/60 mb-3">Hızlı Endpointler</h3>
            <div className="space-y-1.5">
              {ENDPOINT_GROUPS.map(group => (
                <div key={group.label}>
                  <button
                    type="button"
                    onClick={() => setEndpointGroupOpen(endpointGroupOpen === group.label ? null : group.label)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-white/60 transition"
                  >
                    <span className="font-medium">{group.label}</span>
                    <LuChevronDown className={`w-3 h-3 transition-transform ${endpointGroupOpen === group.label ? 'rotate-180' : ''}`} />
                  </button>
                  {endpointGroupOpen === group.label && (
                    <div className="ml-2 mb-1 space-y-0.5">
                      {group.endpoints.map(ep => (
                        <button
                          key={`${ep.method}-${ep.path}`}
                          type="button"
                          onClick={() => selectEndpoint(ep)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-left transition"
                        >
                          <span className={`text-[10px] font-bold min-w-[32px] ${METHOD_COLORS[ep.method]?.split(' ')[1] || 'text-white/40'}`}>
                            {ep.method}
                          </span>
                          <span className="text-[11px] text-white/40 truncate">{ep.path.replace('/api/', '')}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-white/60">Geçmiş</h3>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-white/30 hover:text-rose-400 transition"
                >
                  <LuTrash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-[11px] text-white/20 italic">Henüz istek yok</p>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {history.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setMethod(item.method); setUrl(item.url); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/5 text-left transition group"
                  >
                    <span className={`text-[10px] font-bold min-w-[32px] ${METHOD_COLORS[item.method]?.split(' ')[1] || 'text-white/40'}`}>
                      {item.method}
                    </span>
                    <span className="flex-1 text-[11px] text-white/40 truncate">{item.url.replace('/api/', '')}</span>
                    <span className={`text-[10px] font-bold ${statusColor(item.status)}`}>{item.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
