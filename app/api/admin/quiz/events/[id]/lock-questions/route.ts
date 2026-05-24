import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminOrDeveloper, getSelectedGuildId } from '@/lib/adminAuth';
import { lockEventQuestions } from '@/lib/quiz/lockQuestions';

export const dynamic = 'force-dynamic';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdminOrDeveloper())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  const params = await ctx.params;
  const eventId = params.id;
  if (!eventId) return NextResponse.json({ error: 'id_required' }, { status: 400 });

  // Sahiplik kontrolü: guild event ise selected_guild ile eşleşmeli
  const { data: event } = await supabase
    .from('quiz_events')
    .select('id, scope, guild_id')
    .eq('id', eventId)
    .single();
  if (!event) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (event.scope === 'guild') {
    const guildId = await getSelectedGuildId();
    if (event.guild_id !== guildId) {
      return NextResponse.json({ error: 'wrong_guild' }, { status: 403 });
    }
  }

  const result = await lockEventQuestions(supabase, eventId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
