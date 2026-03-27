// ============================================
// EKONOMİ BİLDİRİM TEMPLATE'LERİ
// Dark theme uyumlu — mail modal UI ile uyumlu
// ============================================

export type ChangeItem = {
  type: 'narrative' | 'tech' | 'toggle';
  text: string;
  dir?: 'up' | 'down' | 'same';
  enabled?: boolean; // toggle tipi için
};

// ============================================
// PLAIN TEXT
// ============================================

export function renderEarnNotificationPlainText(
  changeGroups: Record<string, ChangeItem[]>,
  reason?: string
): string {
  const safeRepeat = (value: string, count: number) => {
    if (!Number.isFinite(count) || count <= 0) return '';
    return value.repeat(count);
  };
  const CATEGORY_META = [
    { key: 'general', label: 'GENEL EKONOMİ PARAMETRELERİ' },
    { key: 'tag', label: 'ETİKET (TAG) ÇARPANLARI' },
    { key: 'boost', label: 'TAKVİYE (BOOST) AVANTAJLARI' },
  ];

  const lines: string[] = [];
  lines.push('EKONOMİ GÜNCELLEME RAPORU');
  lines.push(safeRepeat('═', 50));
  lines.push(`Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`);
  lines.push('');

  for (const cat of CATEGORY_META) {
    const items = changeGroups[cat.key] ?? [];
    if (!items.length) continue;

    lines.push(`[ ${cat.label} ]`);
    lines.push(safeRepeat('─', cat.label.length + 4));

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const next = items[i + 1];

      if (it.type === 'toggle') {
        lines.push(`  ${it.enabled ? '✅ AKTİF' : '❌ DEVRE DIŞI'} — ${it.text}`);
      } else if (it.type === 'narrative' && next?.type === 'tech') {
        const arrow = next.dir === 'up' ? '▲ Artış' : next.dir === 'down' ? '▼ Azalış' : '● Sabit';
        lines.push(`  ${it.text}`);
        lines.push(`    └─ ${next.text} (${arrow})`);
        i++;
      } else if (it.type === 'narrative') {
        lines.push(`  ${it.text}`);
      } else {
        const arrow = it.dir === 'up' ? '▲' : it.dir === 'down' ? '▼' : '●';
        lines.push(`    ${arrow} ${it.text}`);
      }
    }
    lines.push('');
  }

  lines.push(safeRepeat('═', 50));
  if (reason) lines.push(reason);
  return lines.join('\n');
}


// ============================================
// HTML (Dark theme)
// ============================================

export function renderEarnNotificationHTML(
  changeGroups: Record<string, ChangeItem[]>,
  reason?: string
): string {
  const CATEGORY_META: { key: string; label: string; accent: string; icon: string; bg: string }[] = [
    { key: 'general', label: 'Genel Ekonomi', accent: '#818cf8', icon: '📊', bg: 'rgba(129,140,248,0.08)' },
    { key: 'tag', label: 'Tag Bonusları', accent: '#34d399', icon: '🏷️', bg: 'rgba(52,211,153,0.08)' },
    { key: 'boost', label: 'Boost Avantajları', accent: '#a78bfa', icon: '🚀', bg: 'rgba(167,139,250,0.08)' },
  ];

  const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const p: string[] = [];

  p.push('<div style="font-family: inherit; line-height: 1.6;">');

  // Başlık açıklaması
  p.push('<p style="margin: 0 0 20px; font-size: 13px; color: rgba(255,255,255,0.5);">Sunucu ekonomi ayarları güncellendi. Değişiklik detayları aşağıda.</p>');

  for (const cat of CATEGORY_META) {
    const items = changeGroups[cat.key] ?? [];
    if (!items.length) continue;

    // Kategori kartı
    p.push(`<div style="margin-bottom: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); overflow: hidden;">`);

    // Kategori başlığı
    p.push(`<div style="display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: ${cat.bg}; border-bottom: 1px solid rgba(255,255,255,0.04);">`);
    p.push(`<span style="font-size: 18px; line-height: 1;">${cat.icon}</span>`);
    p.push(`<span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${cat.accent};">${esc(cat.label)}</span>`);
    p.push(`</div>`);

    // İçerik
    p.push(`<div style="padding: 12px 16px;">`);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const next = items[i + 1];

      // Toggle (açma/kapama)
      if (it.type === 'toggle') {
        const statusColor = it.enabled ? '#34d399' : '#f87171';
        const statusBg = it.enabled ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)';
        const statusBorder = it.enabled ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)';
        const statusText = it.enabled ? 'AKTİF' : 'DEVRE DIŞI';
        const statusIcon = it.enabled ? '✅' : '❌';

        p.push(`<div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; margin-bottom: 8px; border-radius: 10px; background: ${statusBg}; border: 1px solid ${statusBorder};">`);
        p.push(`<span style="font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8);">${statusIcon} ${esc(it.text)}</span>`);
        p.push(`<span style="font-size: 10px; font-weight: 800; letter-spacing: 0.1em; color: ${statusColor}; padding: 3px 10px; border-radius: 6px; background: ${statusBg};">${statusText}</span>`);
        p.push(`</div>`);
        continue;
      }

      // Değer değişikliği (narrative + tech çifti)
      if (it.type === 'narrative' && next?.type === 'tech') {
        const dirColor = next.dir === 'up' ? '#34d399' : next.dir === 'down' ? '#f87171' : '#6b7280';
        const dirBg = next.dir === 'up' ? 'rgba(52,211,153,0.06)' : next.dir === 'down' ? 'rgba(248,113,113,0.06)' : 'rgba(107,114,128,0.06)';
        const dirBorder = next.dir === 'up' ? 'rgba(52,211,153,0.12)' : next.dir === 'down' ? 'rgba(248,113,113,0.12)' : 'rgba(107,114,128,0.12)';
        const dirIcon = next.dir === 'up' ? '↑' : next.dir === 'down' ? '↓' : '→';

        // Değer bilgisini parse et: "Mesaj Kazancı: 1.00 -> 0.20 Papel"
        const techText = next.text;
        const parts = techText.match(/^(.+?):\s*([\d.]+)\s*->\s*([\d.]+)\s*(.+)$/);

        p.push(`<div style="margin-bottom: 8px; border-radius: 10px; border: 1px solid ${dirBorder}; overflow: hidden;">`);

        // Üst: Label + değişim yönü
        p.push(`<div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: ${dirBg};">`);
        p.push(`<span style="font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85);">${parts ? esc(parts[1]) : esc(it.text)}</span>`);
        p.push(`<span style="font-size: 11px; font-weight: 700; color: ${dirColor};">${dirIcon} ${next.dir === 'up' ? 'Artış' : next.dir === 'down' ? 'Azalış' : 'Sabit'}</span>`);
        p.push(`</div>`);

        // Alt: Eski → Yeni değer
        if (parts) {
          p.push(`<div style="display: flex; align-items: center; gap: 8px; padding: 10px 14px;">`);
          p.push(`<span style="font-family: ui-monospace, monospace; font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.35); text-decoration: line-through;">${esc(parts[2])}</span>`);
          p.push(`<span style="font-size: 14px; color: rgba(255,255,255,0.2);">→</span>`);
          p.push(`<span style="font-family: ui-monospace, monospace; font-size: 15px; font-weight: 800; color: ${dirColor};">${esc(parts[3])}</span>`);
          p.push(`<span style="font-size: 11px; color: rgba(255,255,255,0.3); margin-left: 2px;">${esc(parts[4])}</span>`);
          p.push(`</div>`);
        } else {
          p.push(`<div style="padding: 10px 14px; font-family: ui-monospace, monospace; font-size: 12px; color: ${dirColor};">${esc(techText).replace(/->/g, '→')}</div>`);
        }

        p.push(`</div>`);
        i++; // next'i atla
        continue;
      }

      // Tek başına narrative
      if (it.type === 'narrative') {
        p.push(`<div style="padding: 6px 0; font-size: 13px; color: rgba(255,255,255,0.6);">• ${esc(it.text)}</div>`);
      }
    }

    p.push(`</div>`); // padding div
    p.push(`</div>`); // kategori kartı
  }

  // Footer
  if (reason) {
    p.push(`<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.04); font-size: 11px; color: rgba(255,255,255,0.25);">`);
    p.push(esc(reason));
    p.push(`</div>`);
  }

  p.push('</div>');
  return p.join('\n');
}

// Default export
export function renderEarnNotification(changeGroups: Record<string, ChangeItem[]>, reason?: string) {
  return renderEarnNotificationHTML(changeGroups, reason);
}
