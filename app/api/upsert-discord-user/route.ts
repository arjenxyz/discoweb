import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await requireSessionUser(req);
    if (!auth.ok) {
      return auth.response;
    }
    const body = await req.json();
    console.debug('[upsert-discord-user] request body:', body);
    if (!body?.id || body.id !== auth.userId) {
      return NextResponse.json({ error: { message: 'forbidden' } }, { status: 403 });
    }
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

    if (!serviceKey || !supabaseUrl) {
      console.error('[upsert-discord-user] Missing Supabase config: service role key or URL');
      return NextResponse.json({ error: { message: 'Missing Supabase configuration' } }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert(
          { discord_id: body.id, username: body.username, avatar: body.avatar },
          { onConflict: 'discord_id' }
        );

      if (error) {
        // Return only plain, serializable fields to the client
        const errPayload = {
          message: error.message || null,
          code: (error as any).code || null,
          details: (error as any).details || null,
          hint: (error as any).hint || null,
        };
        // Log full error for debugging (avoid logging secrets)
        console.error('[upsert-discord-user] Supabase upsert error', errPayload, { raw: error });
        return NextResponse.json({ error: errPayload }, { status: 500 });
      }

      return NextResponse.json({ data });
    } catch (dbErr) {
      console.error('[upsert-discord-user] Unexpected error during upsert', dbErr, (dbErr as any)?.stack);
      return NextResponse.json({ error: { message: String(dbErr) } }, { status: 500 });
    }
  } catch (e) {
    console.error('Unexpected server error in upsert-discord-user', e);
    return NextResponse.json({ error: { message: String(e) } }, { status: 500 });
  }
}

