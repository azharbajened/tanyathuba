import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    if (!decoded) {
      return NextResponse.json({ error: 'Akses ditolak. Silakan login kembali.' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal satu pertanyaan.' }, { status: 400 });
    }

    const cleanIds = ids
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id) && id > 0);

    if (cleanIds.length === 0) {
      return NextResponse.json({ error: 'Daftar ID tidak valid.' }, { status: 400 });
    }

    if (action === 'answer') {
      await db.bulkMarkAnswered(cleanIds);
      return NextResponse.json({
        success: true,
        message: `${cleanIds.length} pertanyaan ditandai sudah dijawab ✅`,
        count: cleanIds.length,
      });
    } else if (action === 'unanswer') {
      await db.bulkMarkPending(cleanIds);
      return NextResponse.json({
        success: true,
        message: `Status ${cleanIds.length} pertanyaan dikembalikan ke belum dijawab ↩️`,
        count: cleanIds.length,
      });
    } else if (action === 'delete') {
      await db.bulkDeleteQuestions(cleanIds);
      return NextResponse.json({
        success: true,
        message: `${cleanIds.length} pertanyaan berhasil dihapus 🗑️`,
        count: cleanIds.length,
      });
    } else {
      return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 });
    }
  } catch (err) {
    console.error('[API] POST /api/admin/questions/bulk error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
