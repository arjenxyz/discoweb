import { NextResponse } from 'next/server';
import { getActiveIncident, DEFAULT_INCIDENT_MESSAGE } from '@/lib/incident';

/** Public/lightweight poll for web + activity full-screen gates. */
export async function GET() {
  try {
    const incident = await getActiveIncident();
    if (!incident) {
      return NextResponse.json({ active: false });
    }
    return NextResponse.json({
      active: true,
      message: incident.public_message || DEFAULT_INCIDENT_MESSAGE,
      title: incident.title,
      started_at: incident.started_at,
      id: incident.id,
    });
  } catch (error) {
    console.error('[api/incident] GET', error);
    return NextResponse.json({ active: false });
  }
}
