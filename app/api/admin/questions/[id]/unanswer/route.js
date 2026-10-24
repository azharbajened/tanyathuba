import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const decoded = verifyToken(authHeader);
    if (!decoded) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 401 });
    }

    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
    }

    const question = await db.getQuestionById(numId);
    if (!question) {
      return NextResponse.json({ error: 'Pertanyaan tidak ditemukan.' }, { status: 404 });
    }

    await db.markPending(numId);
    return NextResponse.json({ message: 'Status pertanyaan dikembalikan ke belum dijawab.' });
  } catch (err) {
    console.error('[API] PUT /api/admin/questions/[id]/unanswer error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan.' }, { status: 500 });
  }
}
