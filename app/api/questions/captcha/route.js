import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateCaptcha, checkRateLimit, getOrCreateSessionHash } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionHash = getOrCreateSessionHash(cookieStore, { setCookie: false });

    // Rate Limiting per session: generous limit (300 per 5 min) so rapid refreshes / tests are not blocked
    const isDev = process.env.NODE_ENV !== 'production';
    const limit = isDev ? 2000 : 300;
    if (!checkRateLimit(`captcha_${sessionHash}`, limit, 5 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan captcha. Tunggu sebentar.' },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
    }

    const captcha = generateCaptcha();
    return NextResponse.json(captcha, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error('[API] GET /api/questions/captcha error:', err);
    return NextResponse.json({ error: 'Gagal memuat captcha' }, { status: 500 });
  }
}

