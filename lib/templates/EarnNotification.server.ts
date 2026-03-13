// ============================================
// SYSTEM NOTIFICATION TEMPLATES
// Dark theme compatible — matches mail modal UI
// ============================================

export type ChangeItem = {
  type: 'narrative' | 'tech';
  text: string;
  dir?: 'up' | 'down' | 'same'
};

const escText = (s: string) => String(s).replace(/\r/g, '').replace(/\n/g, '\n');

// ============================================
// PLAIN TEXT (For Logs & Simple Clients)
// ============================================

export function renderEarnNotificationPlainText(
  changeGroups: Record<string, ChangeItem[]>,
  reason?: string
): string {
  const CATEGORY_META = [
    { key: 'general', label: 'GENEL EKONOMİ PARAMETRELERİ' },
    { key: 'tag', label: 'ETİKET (TAG) ÇARPANLARI' },
    { key: 'boost', label: 'TAKVİYE (BOOST) AVANTAJLARI' },
  ];

  const lines: string[] = [];

  lines.push('EKONOMİ GÜNCELLEME RAPORU');
  lines.push('==================================================');
  lines.push(`Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`);
  lines.push('Durum: Tamamlandı');
  lines.push('');

  for (const cat of CATEGORY_META) {
    const items = changeGroups[cat.key] ?? [];
    if (!items || items.length === 0) continue;

    lines.push(`[ ${cat.label} ]`);
    lines.push('-'.repeat(cat.label.length + 4));

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const next = items[i + 1];

      if (it.type === 'narrative' && next && next.type === 'tech') {
        const arrow = next.dir === 'up' ? '(+ Artış)' : next.dir === 'down' ? '(- Azalış)' : '(~ Değişim)';
        lines.push(`* ${escText(it.text)}`);
        lines.push(`  └─ ${escText(next.text)} ${arrow}`);
        i++;
      } else if (it.type === 'narrative') {
        lines.push(`* ${escText(it.text)}`);
      } else {
        const arrow = it.dir === 'up' ? '▲' : it.dir === 'down' ? '▼' : '●';
        lines.push(`  ${arrow} ${escText(it.text)}`);
      }
    }
    lines.push('');
  }

  lines.push('==================================================');
  lines.push(reason || 'Sistem tarafından otomatik olarak oluşturuldu.');

  return lines.join('\n');
}


// ============================================
// HTML (Dark theme — matches mail modal)
// ============================================

export function renderEarnNotificationHTML(
  changeGroups: Record<string, ChangeItem[]>,
  reason?: string
): string {
  const CATEGORY_META: { key: string; label: string; color: string; icon: string }[] = [
    { key: 'general', label: 'Genel Ekonomi', color: '#818cf8', icon: '📊' },
    { key: 'tag', label: 'Tag Bonusları', color: '#34d399', icon: '🏷️' },
    { key: 'boost', label: 'Boost Avantajları', color: '#a78bfa', icon: '🚀' },
  ];

  const esc = (s: string) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const parts: string[] = [];

  // Container — no background/color, inherits from modal
  parts.push('<div class="earn-notif">');

  // Intro text
  parts.push('<p style="margin: 0 0 20px 0; font-size: 14px; opacity: 0.7;">Sunucu ekonomi ayarları güncellendi. Değişiklik detayları aşağıda listelenmiştir.</p>');

  // Categories
  for (const cat of CATEGORY_META) {
    const items = changeGroups[cat.key] ?? [];
    if (!items || items.length === 0) continue;

    // Category header
    parts.push(`<div style="margin-bottom: 20px;">`);
    parts.push(`<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">`);
    parts.push(`<span style="font-size: 14px;">${cat.icon}</span>`);
    parts.push(`<span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.5;">${esc(cat.label)}</span>`);
    parts.push(`</div>`);

    // Items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const next = items[i + 1];

      if (it.type === 'narrative' && next && next.type === 'tech') {
        const dirColor = next.dir === 'up' ? '#34d399' : next.dir === 'down' ? '#f87171' : '#9ca3af';
        const dirIcon = next.dir === 'up' ? '▲' : next.dir === 'down' ? '▼' : '●';

        parts.push(`<div style="margin-bottom: 12px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);">`);
        parts.push(`<div style="font-size: 13px; font-weight: 500; margin-bottom: 6px;">${esc(it.text)}</div>`);
        parts.push(`<div style="font-family: monospace; font-size: 12px; color: ${dirColor};">`);
        parts.push(`<span style="margin-right: 6px;">${dirIcon}</span>${esc(next.text).replace(/->/g, '→')}`);
        parts.push(`</div>`);
        parts.push(`</div>`);
        i++;
      } else if (it.type === 'narrative') {
        parts.push(`<div style="margin-bottom: 8px; font-size: 13px; padding-left: 4px;">• ${esc(it.text)}</div>`);
      } else {
        const dirColor = it.dir === 'up' ? '#34d399' : it.dir === 'down' ? '#f87171' : '#9ca3af';
        const dirIcon = it.dir === 'up' ? '▲' : it.dir === 'down' ? '▼' : '●';
        parts.push(`<div style="margin-bottom: 8px; font-family: monospace; font-size: 12px; color: ${dirColor}; padding-left: 4px;">`);
        parts.push(`<span style="margin-right: 6px;">${dirIcon}</span>${esc(it.text).replace(/->/g, '→')}`);
        parts.push(`</div>`);
      }
    }
    parts.push(`</div>`);
  }

  // Footer note
  if (reason) {
    parts.push(`<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px; opacity: 0.4;">`);
    parts.push(`${esc(reason)}`);
    parts.push(`</div>`);
  }

  parts.push('</div>');

  return parts.join('\n');
}

// Backwards-compatible default export
export function renderEarnNotification(changeGroups: Record<string, ChangeItem[]>, reason?: string) {
  return renderEarnNotificationHTML(changeGroups, reason);
}
