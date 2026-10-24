'use client';

import { useState, useEffect, useCallback } from 'react';

const SOCIAL_LINKS = [
  {
    name: 'WhatsApp',
    url: 'https://www.whatsapp.com/channel/0029VbCL4TJDp2QBHkz8pX0k',
    key: 'whatsapp',
    icon: (
      <svg className="social-svg-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com/thubaproject/',
    key: 'instagram',
    icon: (
      <svg className="social-svg-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    url: 'https://facebook.com/thubaproject',
    key: 'facebook',
    icon: (
      <svg className="social-svg-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    url: 'https://tiktok.com/@thuba.project',
    key: 'tiktok',
    icon: (
      <svg className="social-svg-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .586.046.86.13V9.42a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.28 8.28 0 0 0 3.77.94v-3z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@ThubaProject/streams',
    key: 'youtube',
    icon: (
      <svg className="social-svg-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: 'Telegram',
    url: 'https://t.me/thubaproject',
    key: 'telegram',
    icon: (
      <svg className="social-svg-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" />
      </svg>
    ),
  },
  {
    name: 'X',
    url: 'https://x.com/thubaproject',
    key: 'x',
    icon: (
      <svg className="social-svg-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

function SocialLinksList() {
  return (
    <div className="social-row-container-grid">
      {SOCIAL_LINKS.map((item) => (
        <a
          key={item.key}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`social-pill-btn social-${item.key}`}
          title={item.name}
        >
          {item.icon}
          <span>{item.name}</span>
        </a>
      ))}
    </div>
  );
}

export default function JamaahClientPage() {
  const [captcha, setCaptcha] = useState({ question: '', token: '' });
  const [captchaLoading, setCaptchaLoading] = useState(true);

  const [question, setQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedId, setSubmittedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('waiting');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);

  // Rate Limiting States
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  const handleCopyAccount = (accNum) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(accNum);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2500);
    }
  };

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaAnswer('');
    try {
      const res = await fetch(`/api/questions/captcha?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.question && data.token) {
          setCaptcha({ question: data.question, token: data.token });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setCaptcha({
          question: errData.error || 'Verifikasi (gagal dimuat — klik refresh)',
          token: '',
        });
      }
    } catch {
      setCaptcha({ question: 'Verifikasi (gagal dimuat — klik refresh)', token: '' });
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  const loadSessionStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/questions/stats?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.sessionStatus) {
          setSessionStatus((prev) => {
            if (prev !== 'active' && data.sessionStatus === 'active') {
              // Sesi baru dibuka: muat ulang captcha agar token dan pertanyaan fresh & sinkron
              loadCaptcha();
            }
            return data.sessionStatus;
          });
        }
        if (data.rateLimit) {
          setRateLimitInfo(data.rateLimit);
          if (data.rateLimit.cooldownRemainingSeconds > 0) {
            setCountdownSeconds(data.rateLimit.cooldownRemainingSeconds);
          } else if (data.rateLimit.holdRemainingSeconds > 0) {
            setCountdownSeconds(data.rateLimit.holdRemainingSeconds);
          } else {
            setCountdownSeconds(0);
          }
        }
      }
    } catch {
      // Background stat update failure silently ignored
    }
  }, [loadCaptcha]);

  useEffect(() => {
    loadCaptcha();
    loadSessionStatus();
    const interval = setInterval(loadSessionStatus, 5000);
    return () => clearInterval(interval);
  }, [loadCaptcha, loadSessionStatus]);

  // Live countdown timer ticker
  useEffect(() => {
    if (countdownSeconds <= 0) return;
    const ticker = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          loadSessionStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [countdownSeconds, loadSessionStatus]);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (question.trim().length < 10 || question.trim().length > 500) {
      setErrorMsg('Pertanyaan harus antara 10 sampai 500 karakter.');
      return;
    }
    if (!captchaAnswer.trim()) {
      setErrorMsg('Silakan jawab soal verifikasi terlebih dahulu.');
      return;
    }
    if (!captcha.token) {
      setErrorMsg('Token captcha tidak ditemukan. Silakan klik ikon ganti soal.');
      return;
    }
    if (captchaLoading) {
      setErrorMsg('Sedang memuat soal verifikasi. Mohon tunggu...');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          captchaAnswer: captchaAnswer.trim(),
          captchaToken: captcha.token,
        }),
      });

      const data = await res.json().catch(() => ({}));

      // Update rate limit state from server response
      if (data.rateLimit) {
        setRateLimitInfo(data.rateLimit);
        if (data.rateLimit.cooldownRemainingSeconds > 0) {
          setCountdownSeconds(data.rateLimit.cooldownRemainingSeconds);
        } else if (data.rateLimit.holdRemainingSeconds > 0) {
          setCountdownSeconds(data.rateLimit.holdRemainingSeconds);
        }
      }

      // Jika server mengembalikan captcha baru (regenerate token & pertanyaan sinkron)
      if (data.captcha?.question && data.captcha?.token) {
        setCaptcha({
          question: data.captcha.question,
          token: data.captcha.token,
        });
        setCaptchaAnswer('');
      }

      if (!res.ok) {
        const errs = data.errors || [data.error || 'Terjadi kesalahan. Coba lagi.'];
        setErrorMsg(Array.isArray(errs) ? errs.join(' ') : errs);
        if (!data.captcha) {
          loadCaptcha();
        }
        return;
      }

      setQuestion('');
      setCaptchaAnswer('');
      if (!data.captcha) {
        loadCaptcha();
      }
      setSubmittedId(data.id || null);
      setShowModal(true);
    } catch {
      setErrorMsg('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '36px', marginBottom: '40px' }}>
      {/* ===== POP-UP MODAL KONFIRMASI & AJAKAN SOSIAL MEDIA ===== */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
              title="Tutup"
              aria-label="Tutup"
            >
              <svg
                style={{ width: '20px', height: '20px' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="thuba-logo-wrap" style={{ width: '68px', height: '68px' }}>
              <img
                className="thuba-logo-img"
                src="/thubaproject-logo.png"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://customer-assets.emergentagent.com/job_clean-menu-design/artifacts/iazr7n03_cropped-Green-removebg-preview.png';
                }}
                alt="Thuba Project"
              />
            </div>

            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.6rem',
                color: 'var(--gold)',
                marginBottom: '6px',
              }}
            >
              Barakallahufikum..
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Pertanyaan Anda sudah berhasil diterima.
              <br />
              Insyallah ustadz akan membacanya. Mohon berkenan menunggu.
            </p>

            {submittedId && (
              <div className="queue-display" style={{ padding: '12px 16px', margin: '0 0 20px' }}>
                <div className="queue-label">Nomor Pertanyaan Anda</div>
                <div className="queue-num" style={{ fontSize: '2.2rem' }}>
                  #{submittedId}
                </div>
              </div>
            )}

            <div
              style={{
                background: 'rgba(212, 175, 55, 0.06)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  color: 'var(--gold-light)',
                  marginBottom: '6px',
                }}
              >
                Gabung Bersama Thuba Project
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Dapatkan info jadwal kajian terbaru, ringkasan materi, serta faidah ilmu harian langsung di ponsel Anda.
              </p>
            </div>

            {/* Social Action Buttons */}
            <div style={{ marginBottom: '16px' }}>
              <SocialLinksList />
            </div>

            <button
              type="button"
              className="btn btn-outline"
              style={{ marginTop: '12px' }}
              onClick={() => setShowModal(false)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ===== POP-UP MODAL DONASI ===== */}
      {showDonationModal && (
        <div className="modal-backdrop" onClick={() => setShowDonationModal(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '440px', padding: '28px 20px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowDonationModal(false)}
              title="Tutup"
              aria-label="Tutup"
            >
              <svg
                style={{ width: '20px', height: '20px' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {/* QRIS Donasi */}
              <div className="donation-qris-wrap" style={{ width: '100%', textAlign: 'center', marginBottom: '14px' }}>
                <div className="donation-qr-img-wrap" style={{ margin: '0 auto' }}>
                  <img
                    src="/qris-donasi.png"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://customer-assets.emergentagent.com/job_clean-menu-design/artifacts/wik7abko_image.png';
                    }}
                    alt="QRIS Donasi Yayasan Thuba Minal Jannah"
                    className="donation-qr-img"
                  />
                </div>
              </div>

              {/* Transfer Manual */}
              <div className="donation-manual-wrap" style={{ width: '100%', maxWidth: '320px', margin: '0 auto', textAlign: 'center' }}>
                <div className="donation-manual-header">Transfer Manual</div>
                <div className="donation-bank-name">Bank Syariah Indonesia (BSI)</div>
                <div className="donation-account-row" style={{ justifyContent: 'center' }}>
                  <span className="donation-account-num">7741114474</span>
                  <button
                    type="button"
                    className="btn-copy-acc"
                    onClick={() => handleCopyAccount('7741114474')}
                    title="Salin Nomor Rekening"
                  >
                    {copiedAccount ? (
                      <>
                        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px' }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px' }}>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="donation-account-name">an. Yayasan Thuba Minal Jannah</div>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                style={{ marginTop: '16px', minWidth: '130px', padding: '8px 20px', fontSize: '0.88rem' }}
                onClick={() => setShowDonationModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="main-card animate-in" style={{ maxWidth: '680px' }}>
        <div className="main-card-single">
          {/* Status Indikator Sesi Aktif */}
          {sessionStatus === 'active' && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <span className="session-status-pill active">
                <span className="pulse-dot green"></span> Sesi Tanya Jawab Sedang Dibuka
              </span>
            </div>
          )}

          {/* Direct Form */}
          <div>
            {sessionStatus === 'waiting' ? (
              <div className="session-state-card animate-in">
                {/* Logo Thuba */}
                <div className="thuba-logo-wrap">
                  <img
                    className="thuba-logo-img"
                    src="/thubaproject-logo.png"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://customer-assets.emergentagent.com/job_clean-menu-design/artifacts/iazr7n03_cropped-Green-removebg-preview.png';
                    }}
                    alt="Thuba Project"
                  />
                </div>

                {/* Header Sesi */}
                <h3 style={{ marginBottom: '14px' }}>Sesi tanya jawab sebentar lagi akan dibuka..</h3>

                {/* Status Menunggu di Bawah Logo Thuba */}
                <div className="live-waiting-indicator" style={{ margin: '0 auto 18px' }}>
                  <span className="pulse-dot amber"></span>
                  <span>Menunggu ustadz membuka sesi tanya jawab...</span>
                </div>

                {/* Tombol Donasi (Membuka Dialog Pop-up) */}
                <div style={{ margin: '8px 0 24px', display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-donation-trigger"
                    style={{ width: 'auto' }}
                    onClick={() => setShowDonationModal(true)}
                  >
                    <svg
                      className="icon-svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ marginRight: '8px', width: '18px', height: '18px' }}
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>Donasi</span>
                  </button>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--gold-light)', fontWeight: 600, marginBottom: '12px' }}>
                    Gabung ke Channel Whatsapp dan Sosial Media kami :
                  </p>
                  <SocialLinksList />
                </div>
              </div>
            ) : sessionStatus === 'ended' ? (
              <div className="session-state-card animate-in">
                <div className="thuba-logo-wrap">
                  <img
                    className="thuba-logo-img"
                    src="/thubaproject-logo.png"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://customer-assets.emergentagent.com/job_clean-menu-design/artifacts/iazr7n03_cropped-Green-removebg-preview.png';
                    }}
                    alt="Thuba Project"
                  />
                </div>

                <h3>Sesi Tanya Jawab Telah Berakhir</h3>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '6px auto 16px' }}>
                  <span className="session-status-pill ended">
                    <span className="pulse-dot red"></span> Sesi Telah Ditutup
                  </span>
                </div>

                {/* Doa Kafaratul Majelis (Versi Komplit Bahasa Arab di Atas - Ukuran Responsif Mobile/Tablet) */}
                <div
                  style={{
                    margin: '12px auto 18px',
                    padding: '12px 14px',
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.28)',
                    borderRadius: 'var(--radius)',
                    maxWidth: '520px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Amiri', 'Traditional Arabic', 'Scheherazade New', serif",
                      fontSize: 'clamp(1.02rem, 3.2vw, 1.22rem)',
                      lineHeight: '1.8',
                      color: 'var(--gold-light)',
                      direction: 'rtl',
                      textAlign: 'center',
                      fontWeight: 700,
                    }}
                  >
                    سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(0.74rem, 2.3vw, 0.8rem)',
                      color: 'var(--text-muted)',
                      marginTop: '6px',
                      fontStyle: 'italic',
                      lineHeight: '1.4',
                    }}
                  >
                    &ldquo;Maha Suci Engkau ya Allah dan dengan memuji-Mu, aku bersaksi bahwa tidak ada sesembahan yang berhak disembah selain Engkau, aku memohon ampunan-Mu dan bertaubat kepada-Mu.&rdquo;
                  </div>
                </div>

                <p style={{ marginBottom: '18px' }}>
                  Semoga Allah terima amal ibadah kita semua dan membuat kita semakin istiqomah dalam menuntut ilmu. Sampai jumpa di kajian berikutnya.
                </p>

                {/* Jazakumullah khairan & Barakallahufikum (Bahasa Arab di Atas Ajakan Sosial Media) */}
                <div style={{ margin: '18px 0 16px' }}>
                  <div
                    style={{
                      fontFamily: "'Amiri', 'Traditional Arabic', 'Scheherazade New', serif",
                      color: 'var(--gold)',
                      fontSize: 'clamp(1.18rem, 3.8vw, 1.45rem)',
                      lineHeight: '1.7',
                      direction: 'rtl',
                      textAlign: 'center',
                      fontWeight: 700,
                    }}
                  >
                    جَزَاكُمُ اللهُ خَيْرًا وَبَارَكَ اللهُ فِيكُمْ
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <p style={{ color: 'var(--gold-light)', fontSize: '0.92rem', fontWeight: 600, marginBottom: '14px' }}>
                    Gabung ke Channel Whatsapp dan Sosial Media kami :
                  </p>

                  <SocialLinksList />

                  {/* Tombol Donasi di Footer Sesi Akhir */}
                  <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-donation-trigger"
                      style={{ width: 'auto' }}
                      onClick={() => setShowDonationModal(true)}
                    >
                      <svg
                        className="icon-svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginRight: '8px', width: '18px', height: '18px' }}
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span>Donasi</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {errorMsg && (
                  <div className="alert alert-error" role="alert">
                    <svg
                      className="icon-svg"
                      style={{ flexShrink: 0, marginTop: '2px', width: '1.2em', height: '1.2em' }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Rate Limit Status Card */}
                <div style={{ marginBottom: '18px' }}>
                  {countdownSeconds > 0 ? (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius)',
                        background: rateLimitInfo?.reason === 'HOLD_1_HOUR' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212, 175, 55, 0.12)',
                        border: `1px solid ${rateLimitInfo?.reason === 'HOLD_1_HOUR' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(212, 175, 55, 0.4)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.86rem',
                        color: rateLimitInfo?.reason === 'HOLD_1_HOUR' ? '#fca5a5' : 'var(--gold-light)',
                      }}
                    >
                      <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                        {rateLimitInfo?.reason === 'HOLD_1_HOUR' ? '⛔' : '⏳'}
                      </span>
                      <div>
                        <strong>
                          {rateLimitInfo?.reason === 'HOLD_1_HOUR'
                            ? 'Batas 2 Pertanyaan Tercapai (Hold 1 Jam)'
                            : 'Jeda 5 Menit Antar Pertanyaan Aktif'}
                        </strong>
                        <div style={{ marginTop: '2px', fontSize: '0.82rem' }}>
                          Sisa waktu tunggu:{' '}
                          <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.96rem', color: '#fff' }}>
                            {formatCountdown(countdownSeconds)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(10, 46, 46, 0.35)',
                        border: '1px solid rgba(212, 175, 55, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--gold)' }}>🔒</span>
                        <span>
                          {rateLimitInfo?.currentCount === 1
                            ? 'Pertanyaan ke-2 dari batas 2 pertanyaan'
                            : 'Batas: Maksimal 2 pertanyaan (jeda 5 menit)'}
                        </span>
                      </div>
                      <span style={{ color: 'var(--gold-light)', fontWeight: 600 }}>
                        {rateLimitInfo?.currentCount === 1 ? 'Sisa kuota: 1 pertanyaan' : 'Sisa kuota: 2 pertanyaan'}
                      </span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {/* Pertanyaan Textarea */}
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="input-question" style={{ marginBottom: '6px' }}>Pertanyaan untuk Ustadz</label>
                    <textarea
                      id="input-question"
                      placeholder="Tulis pertanyaan Anda dengan jelas dan lengkap..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      required
                      maxLength={500}
                      rows={4}
                    />
                    <div
                      className={`char-counter ${
                        question.length > 480
                          ? 'error'
                          : question.length > 400
                          ? 'warn'
                          : ''
                      }`}
                    >
                      {question.length} / 500 karakter
                    </div>
                  </div>

                  {/* Horizontal Inline Captcha */}
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <div className="captcha-inline-row">
                      <label htmlFor="input-captcha" className="captcha-label">
                        {captcha.question ? captcha.question : 'Memuat verifikasi...'}
                      </label>
                      <div className="captcha-input-wrap">
                        <input
                          type="number"
                          id="input-captcha"
                          placeholder={captchaLoading && !captcha.question ? '...' : 'Jawaban...'}
                          value={captchaAnswer}
                          onChange={(e) => setCaptchaAnswer(e.target.value)}
                          required
                          disabled={captchaLoading}
                        />
                        <button
                          type="button"
                          className="captcha-refresh"
                          onClick={loadCaptcha}
                          title="Ganti soal"
                          disabled={captchaLoading}
                        >
                          <svg
                            className="icon-svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || (captchaLoading && !captcha.token) || countdownSeconds > 0}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      opacity: countdownSeconds > 0 ? 0.7 : 1,
                      cursor: countdownSeconds > 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner" /> Mengirim...
                      </>
                    ) : countdownSeconds > 0 ? (
                      <>
                        <svg className="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Tunggu Jeda ({formatCountdown(countdownSeconds)})
                      </>
                    ) : (
                      <>
                        <svg
                          className="icon-svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        {rateLimitInfo?.currentCount === 1 ? 'Kirim Pertanyaan Ke-2' : 'Kirim Pertanyaan'}
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="page-footer border-t border-white/10 w-full pt-8 flex flex-col items-center gap-2 text-sm text-muted-foreground/60">
        <p>© 2026 Thuba Project. Dedicated to building the Ummah.</p>
        <p className="font-serif italic text-xs tracking-wider">Faith. Focus. Create.</p>
      </footer>
    </div>
  );
}
