import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { sanitizeText, getOrCreateSessionHash, generateCaptcha, verifyCaptcha, checkRateLimit } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionHash = getOrCreateSessionHash(cookieStore);

    // 1. Anti-flood protection (per browser session: max 30 requests per minute)
    if (!checkRateLimit(`flood_${sessionHash}`, 30, 60 * 1000)) {
      return NextResponse.json(
        { errors: ['Terlalu banyak permintaan dalam waktu singkat. Mohon tunggu 1 menit.'] },
        { status: 429 }
      );
    }

    // 2. Cek status sesi kajian
    const sessionStatus = await db.getSessionStatus();
    if (sessionStatus !== 'active') {
      const msg =
        sessionStatus === 'waiting'
          ? 'Sesi kajian belum dimulai. Mohon tunggu ustadz membuka sesi tanya jawab.'
          : 'Sesi tanya jawab telah berakhir. Terima kasih atas partisipasi Anda.';
      return NextResponse.json({ errors: [msg] }, { status: 403 });
    }

    // 3. Rate Limit 2-Tier berbasis Session (aman untuk NAT / Wi-Fi bersama)
    const rateCheck = await db.checkQuestionRateLimit(sessionHash);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          errors: [rateCheck.message],
          rateLimit: rateCheck,
        },
        { status: 429 }
      );
    }

    // 4. Parse request body
    const body = await request.json().catch(() => ({}));
    const { question, captchaAnswer, captchaToken, name } = body || {};

    // 5. Validasi Pertanyaan
    if (!question || typeof question !== 'string' || question.trim().length < 10 || question.trim().length > 500) {
      return NextResponse.json(
        { errors: ['Pertanyaan harus antara 10 sampai 500 karakter.'] },
        { status: 400 }
      );
    }

    // 6. Validasi & Verifikasi Captcha
    if (captchaAnswer === undefined || captchaAnswer === null || String(captchaAnswer).trim() === '') {
      return NextResponse.json(
        { errors: ['Jawaban verifikasi captcha diperlukan.'] },
        { status: 400 }
      );
    }

    if (!captchaToken) {
      const newCaptcha = generateCaptcha();
      return NextResponse.json(
        {
          errors: ['Token captcha tidak ditemukan. Silakan jawab soal verifikasi baru berikut.'],
          captcha: newCaptcha,
        },
        { status: 400 }
      );
    }

    const isCaptchaValid = verifyCaptcha(captchaAnswer, captchaToken);
    if (!isCaptchaValid) {
      // Regenerate token & pertanyaan baru secara bersamaan agar selalu sinkron
      const newCaptcha = generateCaptcha();
      return NextResponse.json(
        {
          errors: ['Jawaban verifikasi captcha salah. Silakan jawab pertanyaan baru berikut.'],
          captcha: newCaptcha,
        },
        { status: 400 }
      );
    }

    // 7. Simpan pertanyaan yang valid ke database (Hamba Allah by default — zero personal data)
    const rawName = (name && typeof name === 'string' && name.trim()) ? name.trim() : 'Hamba Allah';
    const cleanName = sanitizeText(rawName);
    const cleanQuestion = sanitizeText(question);

    const result = await db.insertQuestion(cleanName, cleanQuestion, sessionHash);
    const currentStats = await db.getStats();

    // Dapatkan status limit terbaru setelah submit berhasil
    const updatedRateLimit = await db.checkQuestionRateLimit(sessionHash);

    // Siapkan captcha baru yang sinkron untuk pertanyaan berikutnya
    const nextCaptcha = generateCaptcha();

    return NextResponse.json(
      {
        message: 'Pertanyaan berhasil dikirim! Jazakallahu khairan. 🤲',
        id: result.lastInsertRowid,
        stats: {
          total: currentStats.total,
          pending: currentStats.pending,
        },
        captcha: nextCaptcha,
        rateLimit: updatedRateLimit,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API] POST /api/questions error:', err);
    return NextResponse.json(
      { errors: ['Terjadi kesalahan pada server. Silakan coba kembali.'] },
      { status: 500 }
    );
  }
}
