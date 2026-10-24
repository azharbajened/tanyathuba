import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    if (!decoded) {
      return NextResponse.json({ error: 'Akses ditolak. Silakan login kembali.' }, { status: 401 });
    }

    const stats = await db.getStats();
    const sessionStatus = await db.getSessionStatus();
    return NextResponse.json({
      ...stats,
      sessionStatus,
    });
  } catch (err) {
    console.error('[API] GET /api/admin/stats error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}
