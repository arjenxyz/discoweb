import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { isDeveloper } from '@/lib/developerAuth';
import { isLocalDevBypassFromRequest } from '@/lib/localDevBypass';
import {
  getActiveIncident,
  startIncident,
  resumeIncident,
  DEFAULT_INCIDENT_MESSAGE,
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
    const incident = await getActiveIncident({ bypassCache: true });
    return NextResponse.json({
      active: Boolean(incident),
      incident,
      defaultMessage: DEFAULT_INCIDENT_MESSAGE,
    });
  } catch (error) {
    console.error('[incident/active] GET', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireDeveloper(request);
    if (!auth.ok) return auth.response;

    const body = (await request.json().catch(() => ({}))) as {
      action?: 'stop' | 'resume';
      title?: string;
      publicMessage?: string;
      windowStartHours?: number;
    };

    if (body.action === 'resume') {
      const { incident } = await resumeIncident({ actorId: auth.userId });
      return NextResponse.json({ ok: true, incident });
    }

    if (body.action === 'stop') {
      const { incident } = await startIncident({
        actorId: auth.userId,
        title: body.title,
        publicMessage: body.publicMessage,
        windowStartHours: body.windowStartHours,
      });
      return NextResponse.json({ ok: true, incident });
    }

    return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'server_error';
    const status =
      message === 'incident_already_active' || message === 'no_active_incident' ? 409 : 500;
    console.error('[incident] POST', error);
    return NextResponse.json({ error: message }, { status });
  }
}
