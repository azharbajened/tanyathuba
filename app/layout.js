import './globals.css';

export const metadata = {
  title: 'Tanya Jawab Kajian',
  description: 'Sampaikan pertanyaan Anda kepada ustadz secara mudah dan cepat saat kajian berlangsung.',
};

export const viewport = {
  themeColor: '#0d0d1a',
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <div className="page-wrapper">{children}</div>
      </body>
    </html>
  );
}
