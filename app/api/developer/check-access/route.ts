import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/auth';
import { isDeveloper } from '@/lib/developerAuth';
import { isLocalDevBypassFromRequest } from '@/lib/localDevBypass';

export async function GET(request: NextRequest) {
  try {
    if (isLocalDevBypassFromRequest(request)) {
      return NextResponse.json({ hasAccess: true, localDevBypass: true }, { status: 200 });
    }

    const auth = await requireSessionUser(request);
    if (!auth.ok) {
      return auth.response;
    }

    if (!(await isDeveloper(auth.userId))) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    return NextResponse.json({ hasAccess: true }, { status: 200 });
  } catch (error) {
    console.error('Developer access check error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
