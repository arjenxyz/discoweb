import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';
import { isDeveloper } from '@/lib/developerAuth';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

type WatchEarnBody = {
  id?: string;
  title?: string;
  logo_text?: string;
  sponsor?: string;
  reward_papel?: number;
  multiplier_label?: string | null;
  banner_url?: string;
  video_url?: string;
  starts_at?: string;
  ends_at?: string;
  active?: boolean;
  sort_order?: number;
};

const SUPABASE_PUBLIC_STORAGE_RE =
  /^https?:\/\/(?:[a-z0-9-]+\.)?supabase\.co\/storage\/v1\/object\/public\/(.+)$/i;

const toCdnMediaUrl = (url: string) => {
  const raw = url.trim();
  const match = raw.match(SUPABASE_PUBLIC_STORAGE_RE);
  if (match?.[1]) return `/cdn/${match[1].replace(/^\/+/, '')}`;
  return raw;
};

const parseDate = (value: string | undefined, label: string) => {
  if (!value) return { error: `${label} zorunlu` as const };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { error: `${label} geçersiz` as const };
  return { iso: d.toISOString() };
};

export async function GET(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const { data, error } = await supabase
    .from('watch_earn_tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = (await request.json()) as WatchEarnBody;
  const title = body.title?.trim();
  const logoText = body.logo_text?.trim();
  const sponsor = body.sponsor?.trim();
  const bannerUrl = body.banner_url ? toCdnMediaUrl(body.banner_url) : '';
  const videoUrl = body.video_url ? toCdnMediaUrl(body.video_url) : '';
  const reward = Number(body.reward_papel);

  if (!title || !logoText || !sponsor || !bannerUrl || !videoUrl) {
    return NextResponse.json({ error: 'title, logo_text, sponsor, banner_url, video_url zorunlu' }, { status: 400 });
  }
  if (!Number.isFinite(reward) || reward < 0) {
    return NextResponse.json({ error: 'reward_papel geçersiz' }, { status: 400 });
  }

  const starts = parseDate(body.starts_at, 'starts_at');
  if ('error' in starts && starts.error) return NextResponse.json({ error: starts.error }, { status: 400 });
  const ends = parseDate(body.ends_at, 'ends_at');
  if ('error' in ends && ends.error) return NextResponse.json({ error: ends.error }, { status: 400 });
  if (new Date(ends.iso!) <= new Date(starts.iso!)) {
    return NextResponse.json({ error: 'ends_at starts_at sonrası olmalı' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const { data: topRow } = await supabase
    .from('watch_earn_tasks')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort =
    typeof body.sort_order === 'number'
      ? body.sort_order
      : Number((topRow as { sort_order?: number } | null)?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('watch_earn_tasks')
    .insert({
      title,
      logo_text: logoText,
      sponsor,
      reward_papel: reward,
      multiplier_label: body.multiplier_label?.trim() || null,
      banner_url: bannerUrl,
      video_url: videoUrl,
      starts_at: starts.iso,
      ends_at: ends.iso,
      active: body.active ?? true,
      sort_order: nextSort,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = (await request.json()) as WatchEarnBody;
  if (!body.id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === 'string') patch.title = body.title.trim();
  if (typeof body.logo_text === 'string') patch.logo_text = body.logo_text.trim();
  if (typeof body.sponsor === 'string') patch.sponsor = body.sponsor.trim();
  if (typeof body.banner_url === 'string') patch.banner_url = toCdnMediaUrl(body.banner_url);
  if (typeof body.video_url === 'string') patch.video_url = toCdnMediaUrl(body.video_url);
  if (typeof body.multiplier_label === 'string') patch.multiplier_label = body.multiplier_label.trim() || null;
  if (body.multiplier_label === null) patch.multiplier_label = null;
  if (typeof body.active === 'boolean') patch.active = body.active;
  if (typeof body.sort_order === 'number') patch.sort_order = body.sort_order;
  if (typeof body.reward_papel === 'number') {
    if (!Number.isFinite(body.reward_papel) || body.reward_papel < 0) {
      return NextResponse.json({ error: 'reward_papel geçersiz' }, { status: 400 });
    }
    patch.reward_papel = body.reward_papel;
  }
  if (typeof body.starts_at === 'string') {
    const starts = parseDate(body.starts_at, 'starts_at');
    if ('error' in starts && starts.error) return NextResponse.json({ error: starts.error }, { status: 400 });
    patch.starts_at = starts.iso;
  }
  if (typeof body.ends_at === 'string') {
    const ends = parseDate(body.ends_at, 'ends_at');
    if ('error' in ends && ends.error) return NextResponse.json({ error: ends.error }, { status: 400 });
    patch.ends_at = ends.iso;
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const { data, error } = await supabase
    .from('watch_earn_tasks')
    .update(patch)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function DELETE(request: NextRequest) {
  const session = await requireSessionUser(request);
  if (!session.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await isDeveloper(session.userId))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

  await supabase.from('watch_earn_tasks').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
