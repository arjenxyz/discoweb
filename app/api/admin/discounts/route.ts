import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logWebEvent } from '@/lib/serverLogger';
import { getSessionUserId } from '@/lib/auth';
import { isAdminOrDeveloper } from '@/lib/adminAuth';
import { getSelectedGuildId, resolveServer } from '@/lib/serverResolve';

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const isAdminUser = isAdminOrDeveloper;

const getAdminId = async () => {
  return getSessionUserId();
};

export async function GET() {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const resolved = await resolveServer(supabase);
  if (!resolved) {
    return NextResponse.json({ error: 'server_not_found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('store_discounts')
    .select('id,code,percent,max_uses,used_count,per_user_limit,min_spend,status,expires_at,is_welcome,is_special,created_at')
    .eq('server_id', resolved.serverId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const resolved = await resolveServer(supabase);
  if (!resolved) {
    return NextResponse.json({ error: 'server_not_found' }, { status: 404 });
  }

  const adminId = await getAdminId();
  const selectedGuildId = await getSelectedGuildId();
  const payload = (await request.json()) as {
    code?: string;
    percent?: number;
    maxUses?: number | null;
    perUserLimit?: number | null;
    minSpend?: number | null;
    status?: 'active' | 'disabled' | 'expired';
    expiresAt?: string | null;
    is_welcome?: boolean;
    is_special?: boolean;
  };

  if (!payload.code || typeof payload.percent !== 'number') {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  if (payload.percent <= 0 || payload.percent > 100) {
    return NextResponse.json({ error: 'invalid_percent' }, { status: 400 });
  }

  const maxUses =
    typeof payload.maxUses === 'number' && payload.maxUses > 0
      ? Math.floor(payload.maxUses)
      : null;

  const perUserLimit =
    typeof payload.perUserLimit === 'number' && payload.perUserLimit > 0
      ? Math.floor(payload.perUserLimit)
      : 1;

  const minSpendValue = typeof payload.minSpend === 'number' && payload.minSpend > 0 ? Number(payload.minSpend) : 0;

  const codeNormalized = payload.code.trim().toUpperCase();

  // check for existing code in the same server (case-insensitive)
  const { data: existingRows, error: existingError } = await supabase
    .from('store_discounts')
    .select('id')
    .eq('server_id', resolved.serverId)
    .eq('code', codeNormalized)
    .limit(1);

  if (existingError) {
    return NextResponse.json({ error: 'check_existing_failed' }, { status: 500 });
  }

  if (existingRows && existingRows.length > 0) {
    return NextResponse.json({ error: 'code_exists' }, { status: 400 });
  }

  const { error } = await supabase.from('store_discounts').insert({
    server_id: resolved.serverId,
    code: codeNormalized,
    percent: payload.percent,
    max_uses: maxUses,
    per_user_limit: perUserLimit,
    min_spend: minSpendValue,
    status: payload.status ?? 'active',
    expires_at: payload.expiresAt ?? null,
    is_welcome: payload.is_welcome ?? false,
    is_special: payload.is_special ?? false,
  });

  if (error) {
    return NextResponse.json({ error: 'save_failed', details: error.message }, { status: 500 });
  }

  // Special (public) discount → same receipt-style mail as transfer/promo
  try {
    if (payload.is_special) {
      const mailTitle = 'Yeni indirim kodu';
      const expiresLabel = payload.expiresAt
        ? new Date(payload.expiresAt).toLocaleString('tr-TR')
        : 'Yok';
      const mailBody = [
        `${codeNormalized} indirim kodu yayında.`,
        `İndirim oranı: %${payload.percent}`,
        `Kod: ${codeNormalized}`,
        `Minimum sepet: ${minSpendValue} Papel`,
        `Kupon kullanım limiti: ${maxUses === null ? 'Sınırsız' : String(maxUses)}`,
        `Kişi başı limit: ${perUserLimit}`,
        `Bitiş tarihi: ${expiresLabel}`,
        '',
        'Not: Birkaç saniye gecikebilir; görünmezse yenileyin.',
      ].join('\n');

      await supabase.from('system_mails').insert({
        guild_id: selectedGuildId,
        user_id: null,
        title: mailTitle,
        body: mailBody,
        category: 'system',
        status: 'published',
        author_name: 'DiscoWeb',
        metadata: {
          kind: 'discount',
          i18nKey: 'discount',
          code: codeNormalized,
          percent: payload.percent,
          maxUses,
          max_uses: maxUses,
          perUserLimit,
          per_user_limit: perUserLimit,
          minSpend: minSpendValue,
          min_spend: minSpendValue,
          expiresAt: payload.expiresAt ?? null,
          expires_at: payload.expiresAt ?? null,
          is_welcome: payload.is_welcome ?? false,
          is_special: true,
          noteKey: 'mail_discount_note_cart_delay',
        },
        created_at: new Date().toISOString(),
      });
    }
  } catch (mailErr) {
    console.warn('admin/discounts: failed to insert system mail', mailErr);
  }

  await logWebEvent(request, {
    event: 'admin_discount_create',
    status: 'success',
    userId: adminId ?? undefined,
    guildId: selectedGuildId,
    metadata: {
      code: payload.code,
      percent: payload.percent,
      maxUses,
        perUserLimit,
        minSpend: minSpendValue,
      status: payload.status ?? 'active',
      expiresAt: payload.expiresAt ?? null,
      is_welcome: payload.is_welcome ?? false,
    },
  });

  return NextResponse.json({ status: 'ok' });
}

export async function DELETE(request: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const adminId = await getAdminId();
  const selectedGuildId = await getSelectedGuildId();
  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const { error } = await supabase.from('store_discounts').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }

  await logWebEvent(request, {
    event: 'admin_discount_delete',
    status: 'success',
    userId: adminId ?? undefined,
    guildId: selectedGuildId,
    metadata: { id },
  });

  return NextResponse.json({ status: 'ok' });
}
