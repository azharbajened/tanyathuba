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

    const sessionStatus = await db.getSessionStatus();
    return NextResponse.json({ sessionStatus });
  } catch (err) {
    console.error('[API] GET /api/admin/session error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    if (!decoded) {
      return NextResponse.json({ error: 'Akses ditolak. Silakan login kembali.' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body || {};

    if (!['waiting', 'active', 'ended'].includes(status)) {
      return NextResponse.json(
        { error: 'Status sesi tidak valid. Pilihan: waiting, active, ended.' },
        { status: 400 }
      );
    }

    const updatedStatus = await db.setSessionStatus(status);

    return NextResponse.json({
      sessionStatus: updatedStatus,
      message: 'Status sesi kajian berhasil diperbarui.',
    });
  } catch (err) {
    console.error('[API] POST /api/admin/session error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
