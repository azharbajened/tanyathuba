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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let validStatus;
    if (status === 'pending' || status === 'answered') {
      validStatus = status;
    }

    const questions = await db.getAllQuestions(validStatus);
    return NextResponse.json({ questions });
  } catch (err) {
    console.error('[API] GET /api/admin/questions error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    if (!decoded) {
      return NextResponse.json({ error: 'Akses ditolak. Silakan login kembali.' }, { status: 401 });
    }

    await db.clearAllQuestions();
    return NextResponse.json({
      message: 'Semua pertanyaan telah dikosongkan dan nomor urut berhasil di-reset kembali ke #1.',
    });
  } catch (err) {
    console.error('[API] DELETE /api/admin/questions error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

