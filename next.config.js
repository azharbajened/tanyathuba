/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Izinkan akses dev server dari device lain (HP / LAN / IP lokal / tunneling)
  allowedDevOrigins: [
    '192.168.*.*',
    '10.*.*.*',
    '172.*.*.*',
    '*.local',
    '*.lan',
    '*.ngrok-free.app',
    '*.loca.lt',
    '*.trycloudflare.com',
    '*.nip.io',
    '*.sslip.io',
  ],
  // Tell Next.js not to bundle sql.js so Emscripten module runs natively in Node.js
  serverExternalPackages: ['sql.js'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
