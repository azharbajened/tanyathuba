import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { getOrCreateSessionHash } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionHash = getOrCreateSessionHash(cookieStore);

    const stats = await db.getStats();
    const sessionStatus = await db.getSessionStatus();
    const rateLimit = await db.checkQuestionRateLimit(sessionHash);

    return NextResponse.json({
      total: stats.total,
      pending: stats.pending,
      sessionStatus,
      rateLimit,
    });
  } catch (err) {
    console.error('[API] GET /api/questions/stats error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}
