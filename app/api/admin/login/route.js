import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { signAdminToken } from '@/lib/auth';
import { hashIpAddress, getLoginPenaltyStatus, recordFailedLogin, clearFailedLogin } from '@/lib/security';

export const dynamic = 'force-dynamic';

function timingSafeMatch(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const ipHash = hashIpAddress(ip);

    // 1. Cek status penalti 15 menit jika sudah 5x percobaan gagal
    const penaltyStatus = getLoginPenaltyStatus(ipHash);
    if (penaltyStatus.isLocked) {
      return NextResponse.json(
        { error: penaltyStatus.message },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { username, password } = body || {};

    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const rawHash = process.env.ADMIN_PASSWORD_HASH || '$2a$12$nXxmJWdbP1VW6vC/hhjAJO.HFf0n.fSvgrUPLohfOq1hiBP4T5VEy';
    const hash = rawHash.replace(/^['"]|['"]$/g, '').trim();

    const isUserMatch = timingSafeMatch(username.trim(), expectedUsername.trim());
    const isPassMatch = isUserMatch ? await bcrypt.compare(password, hash) : false;

    if (!isUserMatch || !isPassMatch) {
      // Artificial delay to prevent timing analysis
      await new Promise((resolve) => setTimeout(resolve, 350));
      
      // Catat kegagalan login untuk IP ini
      const failureResult = recordFailedLogin(ipHash);
      if (failureResult.isLocked) {
        return NextResponse.json({ error: failureResult.message }, { status: 429 });
      }
      return NextResponse.json({ error: failureResult.message }, { status: 401 });
    }

    // Login Sukses: Bersihkan riwayat kegagalan untuk IP ini
    clearFailedLogin(ipHash);

    const token = signAdminToken('admin', username.trim());
    return NextResponse.json({
      message: `Login berhasil. Assalamu'alaikum, ${username.trim()}! 👋`,
      username: username.trim(),
      token,
    });
  } catch (err) {
    console.error('[API] POST /api/admin/login error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
