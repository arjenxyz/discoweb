import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { isDeveloper } from '@/lib/developerAuth';
import { isLocalDevBypassFromRequest } from '@/lib/localDevBypass';
import {
  previewUnsettledAnomalies,
  applyUnsettledRollback,
  previewClaimedAnomalies,
  applyClaimedRollback,
  listStoreTransferActivity,
  listAffectedUsers,
} from '@/lib/incident';

async function requireDeveloper(request: NextRequest) {
  if (isLocalDevBypassFromRequest(request)) {
    return { ok: true as const, userId: 'local-dev' };
  }
  const auth = await requireSessionUser(request);
  if (!auth.ok) return auth;
  if (!(await isDeveloper(auth.userId))) {
    return { ok: false as const, response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }
  return { ok: true as const, userId: auth.userId };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireDeveloper(request);
    if (!auth.ok) return auth.response;

    const incidentId = request.nextUrl.searchParams.get('incidentId');
    const kind = request.nextUrl.searchParams.get('kind') || 'affected';
    if (!incidentId) return NextResponse.json({ error: 'missing_incidentId' }, { status: 400 });

    if (kind === 'store_transfers') {
      const data = await listStoreTransferActivity(incidentId);
      return NextResponse.json(data);
    }

    const affected = await listAffectedUsers(incidentId);
    return NextResponse.json({ affected });
  } catch (error) {
    console.error('[incident/rollback] GET', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'server_error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDeveloper(request);
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as {
      incidentId?: string;
      action?:
        | 'preview_unsettled'
        | 'apply_unsettled'
        | 'preview_claimed'
        | 'apply_claimed';
      ids?: string[];
    };

    if (!body.incidentId || !body.action) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    switch (body.action) {
      case 'preview_unsettled':
        return NextResponse.json(
          await previewUnsettledAnomalies(body.incidentId, auth.userId),
        );
      case 'apply_unsettled':
        return NextResponse.json(
          await applyUnsettledRollback({
            incidentId: body.incidentId,
            actorId: auth.userId,
            ids: body.ids,
          }),
        );
      case 'preview_claimed':
        return NextResponse.json(await previewClaimedAnomalies(body.incidentId, auth.userId));
      case 'apply_claimed':
        return NextResponse.json(
          await applyClaimedRollback({
            incidentId: body.incidentId,
            actorId: auth.userId,
            ids: body.ids,
          }),
        );
      default:
        return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[incident/rollback] POST', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'server_error' },
      { status: 500 },
    );
  }
}
