import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logWebEvent } from '@/lib/serverLogger';
import { getSessionUserId } from '@/lib/auth';
import { isAdminOrDeveloper } from '@/lib/adminAuth';
import { isLocalDevBypass } from '@/lib/localDevBypass';
import { parsePapelAmount } from '@/lib/parsePapelAmount';

const GUILD_ID = process.env.DISCORD_GUILD_ID ?? '1465698764453838882';

const getSelectedGuildId = async (): Promise<string> => {
  const cookieStore = await cookies();
  const selectedGuildId = cookieStore.get('selected_guild_id')?.value;
  return selectedGuildId || GUILD_ID; // Fallback to default
};

const getSupabase = (): SupabaseClient | null => {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
};

const isAdminUser = isAdminOrDeveloper;

const getApprovedMemberIds = async () => {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return [] as string[];
  }

  const supabase = getSupabase();
  if (!supabase) {
    return [] as string[];
  }

  const selectedGuildId = await getSelectedGuildId();
  const { data: server } = await supabase
    .from('servers')
    .select('verify_role_id')
    .eq('discord_id', selectedGuildId)
    .maybeSingle();

  const verifyRoleId = server?.verify_role_id ?? null;
  if (!verifyRoleId) {
    return [] as string[];
  }

  const approved: string[] = [];
  let after: string | undefined;

  while (true) {
    const url = new URL(`https://discord.com/api/guilds/${selectedGuildId}/members`);
    url.searchParams.set('limit', '1000');
    if (after) {
      url.searchParams.set('after', after);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bot ${botToken}` },
    });

    if (!response.ok) {
      break;
    }

    const members = (await response.json()) as Array<{ user: { id: string; bot?: boolean }; roles: string[] }>;
    if (!members.length) {
      break;
    }

    for (const member of members) {
      if (member.user?.bot) {
        continue;
      }
      if (member.roles?.includes(verifyRoleId)) {
        approved.push(member.user.id);
      }
    }

    after = members[members.length - 1]?.user?.id;
    if (!after) {
      break;
    }
  }

  return approved;
};

const getAdminId = async () => {
  return getSessionUserId();
};

const getAdminProfile = async (userId: string) => {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return { name: 'Yetkili', avatarUrl: null };
  }

  const selectedGuildId = await getSelectedGuildId();

  const response = await fetch(`https://discord.com/api/guilds/${selectedGuildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!response.ok) {
    return { name: 'Yetkili', avatarUrl: null };
  }

  const member = (await response.json()) as {
    nick?: string;
    user: { id: string; username: string; avatar: string | null };
  };

  const avatarHash = member.user.avatar;
  const avatarUrl = avatarHash
    ? `https://cdn.discordapp.com/avatars/${member.user.id}/${avatarHash}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${Number(member.user.id) % 5}.png`;

  return { name: member.nick ?? member.user.username ?? 'Yetkili', avatarUrl };
};

const upsertWallet = async (supabase: SupabaseClient, userId: string, nextBalance: number, guildId: string) => {
  await (supabase.from('member_wallets') as unknown as {
    upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => Promise<unknown>;
  }).upsert(
    {
      guild_id: guildId,
      user_id: userId,
      balance: nextBalance,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'guild_id,user_id' },
  );
};

const insertLedger = async (supabase: SupabaseClient, userId: string, amount: number, balanceAfter: number, guildId: string, metadata: Record<string, unknown>) => {
  await (supabase.from('wallet_ledger') as unknown as {
    insert: (values: Record<string, unknown>) => Promise<unknown>;
  }).insert({
    guild_id: guildId,
    user_id: userId,
    amount,
    type: 'admin_adjust',
    balance_after: balanceAfter,
    metadata,
  });
};



export async function GET() {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  if (await isLocalDevBypass()) {
    const { LOCAL_DEV_MOCK_WALLETS } = await import('@/lib/localDevMocks');
    return NextResponse.json(LOCAL_DEV_MOCK_WALLETS);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const selectedGuildId = await getSelectedGuildId();

  // Fetch all wallets for this guild with basic stats
  const { data: wallets, error } = await supabase
    .from('member_wallets')
    .select('user_id,balance,updated_at')
    .eq('guild_id', selectedGuildId)
    .order('balance', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }

  const items = wallets ?? [];
  const totalCirculation = items.reduce((sum, w) => sum + Number(w.balance || 0), 0);

  return NextResponse.json({
    wallets: items,
    totalCount: items.length,
    totalCirculation: Number(totalCirculation.toFixed(2)),
  });
}

export async function POST(request: Request) {
  if (!(await isAdminUser())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'missing_service_role' }, { status: 500 });
  }

  const adminId = await getAdminId();

  const payload = (await request.json()) as {
    mode?: 'add' | 'remove' | 'wipe';
    scope?: 'user' | 'all';
    amount?: number | string;
    userId?: string;
    message?: string;
    imageUrl?: string;
  };

  const mode = payload.mode;
  const scope = payload.scope;
  if (!mode || !scope || !['add', 'remove', 'wipe'].includes(mode) || !['user', 'all'].includes(scope)) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const isWipe = mode === 'wipe';
  const parsedAmount = isWipe ? 0 : parsePapelAmount(payload.amount);
  if (!isWipe && parsedAmount == null) {
    return NextResponse.json({ error: 'invalid_amount' }, { status: 400 });
  }

  const amount = parsedAmount ?? 0;
  const message = payload.message?.trim() ?? '';
  const imageUrl = payload.imageUrl?.trim() || null;
  const userId = payload.userId?.trim();

  if (scope === 'user' && !userId) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  if (mode === 'add' && !message) {
    return NextResponse.json({ error: 'message_required' }, { status: 400 });
  }

  const adminProfile = adminId ? await getAdminProfile(adminId) : { name: 'Yetkili', avatarUrl: null };
  const formatMessage = (text: string, appliedAmount: number) => {
    const display = appliedAmount.toFixed(2);
    if (!text) return `${display} papel`;
    return text.includes('{amount}') ? text.replaceAll('{amount}', display) : `${text} (${display} papel)`;
  };

  if (scope === 'user') {
    const targetUserId = userId as string;

    // Check if recipient is a member of the selected server
    const selectedGuildId = await getSelectedGuildId();
    const { data: verifyServer } = await supabase
      .from('servers')
      .select('verify_role_id')
      .eq('discord_id', selectedGuildId)
      .maybeSingle();

    const verifyRoleId = verifyServer?.verify_role_id ?? null;
    if (!verifyRoleId) {
      return NextResponse.json({ error: 'verify_role_missing' }, { status: 400 });
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (botToken) {
      const memberResponse = await fetch(`https://discord.com/api/guilds/${selectedGuildId}/members/${targetUserId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      if (!memberResponse.ok) {
        return NextResponse.json({ error: 'user_not_in_server' }, { status: 400 });
      }

      const member = (await memberResponse.json()) as { roles: string[]; user?: { bot?: boolean } };
      if (member.user?.bot) {
        return NextResponse.json({ error: 'target_is_bot' }, { status: 400 });
      }
      if (!member.roles?.includes(verifyRoleId)) {
        return NextResponse.json({ error: 'target_not_verified' }, { status: 400 });
      }
    }

    const { data } = (await supabase
      .from('member_wallets')
      .select('balance')
      .eq('guild_id', selectedGuildId)
      .eq('user_id', targetUserId)
      .maybeSingle()) as unknown as { data: { balance?: number } | null };

    const current = Number(data?.balance ?? 0);
    const next =
      mode === 'add'
        ? Number((current + amount).toFixed(2))
        : mode === 'wipe'
          ? 0
          : Math.max(0, Number((current - amount).toFixed(2)));
    const deducted = Number(Math.max(0, current - next).toFixed(2));
    const appliedAmount = mode === 'add' ? amount : deducted;

    // Get server ID for consistent data
    const { data: server } = await supabase
      .from('servers')
      .select('id')
      .eq('discord_id', selectedGuildId)
      .maybeSingle();

    if (!server) {
      return NextResponse.json({ error: 'server_not_found' }, { status: 404 });
    }

    if (mode === 'add') {
      // Papel ekleme: direkt hesaba yatırma, reward mail gönder
      // Kullanıcı "Hepsini Al" tıklayınca bakiye yatırılacak
      const mailTitle = `${amount.toFixed(2)} Papel Ödülü`;
      const mailBody = formatMessage(message, amount);

      await supabase.from('system_mails').insert({
        guild_id: selectedGuildId,
        user_id: targetUserId,
        title: mailTitle,
        body: mailBody,
        category: 'reward',
        status: 'published',
        author_name: adminProfile.name,
        author_avatar_url: adminProfile.avatarUrl,
        image_url: imageUrl,
        details_url: null,
        metadata: { reward_amount: amount },
      });
    } else if (deducted > 0) {
      await upsertWallet(supabase, targetUserId, next, selectedGuildId);
      await insertLedger(supabase, targetUserId, -deducted, next, selectedGuildId, {
        mode,
        scope,
        adminId,
        wipe: mode === 'wipe',
      });
    }

    await logWebEvent(request, {
      event: 'admin_wallet_adjust',
      status: 'success',
      userId: adminId ?? undefined,
      guildId: selectedGuildId,
      metadata: {
        scope: 'user',
        targetUserId: userId,
        mode,
        amount: appliedAmount,
        message: message || null,
        actorName: adminProfile.name,
        actorAvatarUrl: adminProfile.avatarUrl,
      },
    });

    return NextResponse.json({ status: 'ok', mode, deducted, balanceAfter: next });
  }

  const approvedIds = await getApprovedMemberIds();
  if (!approvedIds.length) {
    return NextResponse.json({ error: 'no_approved_users' }, { status: 400 });
  }

  const selectedGuildId = await getSelectedGuildId();
  const { data: server } = await supabase
    .from('servers')
    .select('id')
    .eq('discord_id', selectedGuildId)
    .maybeSingle();

  if (!server) {
    return NextResponse.json({ error: 'server_not_found' }, { status: 404 });
  }

  const { data: wallets } = (await supabase
    .from('member_wallets')
    .select('user_id,balance')
    .eq('guild_id', selectedGuildId)
    .in('user_id', approvedIds)) as unknown as { data: Array<{ user_id: string; balance: number }> | null };

  const targets = wallets ?? [];

  if (mode === 'add') {
    // Toplu papel ekleme: herkese reward mail gönder
    const mailTitle = `${amount.toFixed(2)} Papel Ödülü`;
    const mailBody = formatMessage(message, amount);

    // Broadcast reward mail (user_id = null, herkese)
    await supabase.from('system_mails').insert({
      guild_id: selectedGuildId,
      user_id: null,
      title: mailTitle,
      body: mailBody,
      category: 'reward',
      status: 'published',
      author_name: adminProfile.name,
      author_avatar_url: adminProfile.avatarUrl,
      image_url: imageUrl,
      details_url: null,
      metadata: { reward_amount: amount },
    });
  } else {
    for (const memberId of approvedIds) {
      const wallet = targets.find((entry) => entry.user_id === memberId);
      const current = Number(wallet?.balance ?? 0);
      const next = mode === 'wipe' ? 0 : Math.max(0, Number((current - amount).toFixed(2)));
      const deducted = Number(Math.max(0, current - next).toFixed(2));
      if (deducted <= 0) continue;

      await upsertWallet(supabase, memberId, next, selectedGuildId);
      await insertLedger(supabase, memberId, -deducted, next, selectedGuildId, {
        mode,
        scope,
        adminId,
        wipe: mode === 'wipe',
      });
    }
  }

  await logWebEvent(request, {
    event: 'admin_wallet_adjust',
    status: 'success',
    userId: adminId ?? undefined,
    guildId: selectedGuildId,
    metadata: {
      scope: 'all',
      mode,
      amount: isWipe ? null : amount,
      updatedCount: approvedIds.length,
      message: message || null,
      actorName: adminProfile.name,
      actorAvatarUrl: adminProfile.avatarUrl,
    },
  });

  return NextResponse.json({ status: 'ok', updated: approvedIds.length, mode });
}
