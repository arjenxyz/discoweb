'use client';

import { useState, useEffect } from 'react';
import { LuMegaphone, LuCircleCheck, LuTriangleAlert, LuSend, LuWrench } from 'react-icons/lu';
import { BROADCAST_TEMPLATES, BroadcastTemplate } from '@/lib/broadcastTemplates';

export default function BroadcastPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<BroadcastTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [includeEveryone, setIncludeEveryone] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');

  // Değişkenleri bul
  const extractVariables = (text: string) => {
    const regex = /\{([^}]+)\}/g;
    const matches = Array.from(text.matchAll(regex));
    return [...new Set(matches.map(m => m[1]))];
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tpl = BROADCAST_TEMPLATES.find(t => t.id === e.target.value);
    setSelectedTemplate(tpl || null);
    if (tpl) {
      setCustomTitle(tpl.title);
      setCustomContent(tpl.content);
      // Reset variables
      const vars = extractVariables(tpl.content);
      const newVars: Record<string, string> = {};
      vars.forEach(v => {
        newVars[v] = '';
      });
      setVariables(newVars);
    } else {
      setCustomTitle('');
      setCustomContent('');
      setVariables({});
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  // Metni değişkenlerle doldur
  const getParsedContent = () => {
    let text = customContent;
    Object.entries(variables).forEach(([key, val]) => {
      if (val) {
        text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
      }
    });
    return text;
  };

  const handleSend = async () => {
    if (!customTitle || !customContent) {
      setStatus({ type: 'error', message: 'Başlık ve içerik boş olamaz.' });
      return;
    }

    // Check if variables are filled
    const parsedText = getParsedContent();
    if (parsedText.includes('{') && parsedText.includes('}')) {
      if (!window.confirm('Bazı değişkenleri doldurmadınız, metin içinde {değişken} şeklinde gözükecek. Yine de göndermek istiyor musunuz?')) {
        return;
      }
    }

    setIsLoading(true);
    setStatus(null);

    try {
      const finalContent = includeEveryone ? `@everyone\n\n${parsedText}` : parsedText;

      const response = await fetch('/api/developer/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle,
          content: finalContent,
          color: selectedTemplate?.color || '#5865F2'
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gönderim başarısız.');
      }

      setStatus({ type: 'success', message: `Başarılı! ${data.successCount} sunucuya iletildi, ${data.failCount} hata.` });
      // Clear after success
      setTimeout(() => setStatus(null), 5000);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const activeVariables = extractVariables(customContent);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
          <LuMegaphone className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Toplu Yayın (Broadcast)</h1>
          <p className="text-sm text-[#99AAB5] mt-1">Tüm sunuculardaki developer-duyuru kanallarına anında mesaj gönderin.</p>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {status.type === 'success' ? <LuCircleCheck className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <LuTriangleAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol Kolon: Kontroller */}
        <div className="space-y-6">
          <div className="bg-[#18191c]/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Şablon Seçimi</h2>
            <select
              className="w-full bg-[#2b2d31] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              onChange={handleTemplateSelect}
              value={selectedTemplate?.id || ''}
            >
              <option value="">-- Şablon Seçin veya Özel Yazın --</option>
              {BROADCAST_TEMPLATES.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  [{tpl.category}] {tpl.title}
                </option>
              ))}
            </select>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase mb-2">Başlık</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="Mesaj başlığı..."
                  className="w-full bg-[#2b2d31] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase mb-2">İçerik</label>
                <textarea
                  value={customContent}
                  onChange={e => setCustomContent(e.target.value)}
                  placeholder="Mesaj içeriği..."
                  rows={6}
                  className="w-full bg-[#2b2d31] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#2b2d31]/50 rounded-xl border border-white/5">
                <input
                  type="checkbox"
                  id="includeEveryone"
                  checked={includeEveryone}
                  onChange={e => setIncludeEveryone(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-[#1e1f22] text-indigo-500 focus:ring-indigo-500 focus:ring-offset-[#2b2d31]"
                />
                <label htmlFor="includeEveryone" className="text-sm text-white/80 cursor-pointer select-none">
                  Otomatik olarak <strong>@everyone</strong> etiketi ekle
                </label>
              </div>
            </div>
          </div>

          {/* Dinamik Değişken Kutuları */}
          {activeVariables.length > 0 && (
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <LuWrench className="w-4 h-4" /> Değişkenleri Doldurun
              </h2>
              <div className="space-y-4">
                {activeVariables.map(v => (
                  <div key={v}>
                    <label className="block text-xs font-semibold text-white/60 mb-1.5 capitalize">{v.replace(/_/g, ' ')}</label>
                    <input
                      type="text"
                      value={variables[v] || ''}
                      onChange={e => handleVariableChange(v, e.target.value)}
                      placeholder={`${v} girin...`}
                      className="w-full bg-[#18191c]/50 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sağ Kolon: Önizleme */}
        <div className="space-y-6">
          <div className="bg-[#18191c]/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-4">Discord Önizlemesi</h2>
            
            <div className="bg-[#313338] rounded-md p-4 max-w-sm">
              {includeEveryone && (
                <div className="text-[#00a8fc] bg-[#00a8fc]/10 px-1 py-0.5 rounded text-sm w-fit mb-2">
                  @everyone
                </div>
              )}
              
              <div className="border-l-4 rounded-r-md bg-[#2b2d31] p-4 mt-2" style={{ borderLeftColor: selectedTemplate?.color || '#5865F2' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold">Bot</div>
                  <span className="text-sm font-semibold text-white">DiscoWeb Developer</span>
                </div>
                
                {customTitle && (
                  <h3 className="text-white font-bold mb-2">{customTitle}</h3>
                )}
                
                <div className="text-sm text-[#dbdee1] whitespace-pre-wrap">
                  {getParsedContent() || 'Mesaj içeriği burada görünecek...'}
                </div>
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={isLoading || !customTitle || !customContent}
              className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LuSend className="w-5 h-5" />
                  Tüm Sunuculara Gönder
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
