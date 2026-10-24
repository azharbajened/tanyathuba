Disclaimer
----------
Silahkan copy paste konsep dan sebarluaskan aplikasi ini untuk SIAPAPUN YANG MEMBUTUHKANNYA. 
Barakallahufikum.

- Thuba Kemitraan


# 🕌 Tanya Jawab Kajian (Next.js App Router)

Aplikasi Web Tanya Jawab Kajian berbasis **Next.js 16 (App Router + Turbopack) & React 19** yang dirancang khusus untuk mempermudah proses interaksi tanya jawab antara jamaah dan ustadz saat kajian atau dauroh ilmiah berlangsung. Dilengkapi dengan **Portal Admin (`/portaladmin`)** yang intuitif, aman, dan responsif diakses melalui smartphone, tablet, maupun laptop.

---

## 📜 Latar Belakang & Filosofi Aplikasi

### 1. Mempermudah Sesi Tanya Jawab Saat Kajian & Dauroh
Pada format konvensional, jamaah sering diminta mengirimkan pertanyaan melalui pesan WhatsApp atau secarik kertas:
- **Sulit Diingat**: Nomor handphone panitia seringkali panjang, sulit diingat oleh jamaah di majelis, atau rawan salah catat angka.
- **Pesan Tenggelam**: Pertanyaan yang masuk melalui WhatsApp panitia rentan bertumpuk dengan pesan pribadi, grup kajian lain, atau chat koordinasi logistik.
- **Tanya Jawab Terindeks & Rapi**: Dengan aplikasi ini, seluruh pertanyaan jamaah secara otomatis mendapatkan **Nomor Urut Antrian (`#1`, `#2`, ...)**, terindeks rapi, dan ustadz/panitia dapat menyaring status *Belum Dijawab* atau *Sudah Dijawab* langsung dari satu layar tanpa terdistraksi notifikasi chat.

### 2. Amanah Data Pribadi & Pertanggungjawaban Akhirat (*Zero Personal Data*)
> *"Sesungguhnya Kami telah menawarkan amanah kepada langit, bumi, dan gunung-gunung; semuanya enggan memikulnya dan khawatir akan mengkhianatinya, lalu dipikullah amanah itu oleh manusia..."* (QS. Al-Ahzab: 72)

Menampung dan menyimpan data pribadi jamaah—seperti nama lengkap, nomor handphone/WhatsApp, dan alamat email—merupakan **amanah yang sangat besar dan berat pertanggungjawabannya di dunia maupun di hadapan Allah ﷻ di akhirat kelak**. Jika terjadi kebocoran basis data, penyelenggara kajian memikul beban moral dan syar'i atas privasi umat.

Oleh karena itu, aplikasi ini menerapkan prinsip **Data Privacy by Design & Zero Personal Data**:
- **Hanya Menampung Pertanyaan**: Sistem murni hanya menerima esensi pertanyaan keagamaan yang ditujukan kepada ustadz.
- **Tanpa Pengumpulan Identitas Sensitif**: Tidak ada form isian nomor handphone, email, akun media sosial, maupun dokumen pribadi.
- **Anonimitas Jamaah Terlindungi**: Setiap pertanyaan secara default diatribusikan sebagai *Hamba Allah*, menjaga keikhlasan penanya dan melindungi privasi jamaah seutuhnya.

---

## 🌟 Fitur Unggulan

### 📱 1. Halaman Jamaah (`/`)
- **Tanpa No. HP & Tanpa Registrasi**: Jamaah cukup membuka URL dan langsung menuliskan pertanyaan.
- **2-Tier Rate Limiting Anti-Spam**:
  - **Jeda 5 Menit**: Mencegah pengiriman beruntun tanpa jeda berpikir.
  - **Maksimal 2 Pertanyaan**: Membatasi antrian agar kesempatan bertanya terbagi adil bagi seluruh jamaah.
  - **Hold 1 Jam**: Jika telah mengirim 2 pertanyaan, sistem menahan pengiriman selama 1 jam.
  - **Live Countdown Timer**: Indikator hitung mundur sisa waktu jeda secara real-time pada formulir.
- **Nomor Antrian Digital**: Jamaah menerima nomor antrian langsung setelah submit.
- **Statistik Sesi Live**: Jamaah mengetahui apakah sesi tanya jawab sedang *Menunggu*, *Dibuka*, atau *Selesai*.
- **Math Captcha Stateless**: Perlindungan bot otomatis tanpa menyulitkan jamaah dengan teka-teki gambar rumit.
- **Mobile-Friendly UI**: Tampilan nyaman dibuka melalui smartphone Android, iPhone (termasuk penyesuaian notch & home bar iOS), maupun tablet.

### 🛡️ 2. Portal Admin (`/portaladmin`)
- **Autentikasi Ganda (Username & Password)**: Dilengkapi proteksi anti brute-force:
  - **Penalti 15 Menit**: Jika terjadi **5x percobaan login gagal berturut-turut**, akses IP dikunci sementara selama 15 menit.
- **Kontrol Status Sesi 1-Klik**: Ustadz/panitia dapat mengatur status:
  - ⏳ *Menunggu Sesi*
  - ▶️ *Mulai Sesi* (formulir jamaah dibuka)
  - ⏹️ *Hentikan Sesi* (formulir jamaah ditutup)
- **Tampilan Kartu (Card-Based UI)**: Nyaman dibaca ustadz saat memegang tablet/HP di mimbar.
- **Pencarian Cepat & Filter Tab**: Filter *Semua*, *⏳ Belum Dijawab*, atau *✅ Sudah Dijawab*, serta pencarian instan berdasar ID atau kata kunci.
- **Aksi Massal (Bulk Action)**: Menandai atau menghapus banyak pertanyaan sekaligus dengan bar melayang (*floating action bar*).
- **Mode Cetak (Print View)**: Fitur cetak rapi ke kertas/PDF untuk ustadz yang lebih nyaman membaca lembaran fisik.

---

## 🛡️ Insyallah Ikhtiar Keamanan sudah mencakup OWASP Top 10

| # | Ancaman OWASP | Strategi Proteksi / Mitigasi |
|---|---|---|
| **A01** | **Broken Access Control** | Token JWT `HS256` wajib untuk seluruh REST API Admin (`/api/admin/*`). |
| **A02** | **Cryptographic Failures** | Password admin di-hash dengan `bcrypt` (cost 12), token captcha di-sign dengan HMAC SHA256, IP di-hash dengan pepper (`sha256`). |
| **A03** | **Injection (SQLi, Command, XSS)** | Parameterized queries via SQLite (`node:sqlite` / `sql.js`), XSS Sanitization (`xss`), dan aman dari DOM XSS. |
| **A04** | **Insecure Design** | Rate-limiting bertingkat (Jeda 5 mnt, limit 2 pertanyaan/jam, penalti login 5x salah = 15 mnt lock). |
| **A05** | **Security Misconfiguration** | Strict Security Headers (`X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`), `.env` diabaikan oleh `.gitignore`. |
| **A06** | **Vulnerable Components** | Dependensi bersih dan diaudit berkala. |
| **A07** | **Auth Failures** | Constant-time string matching (`crypto.timingSafeEqual`), delay anti-timing analysis, token JWT expiration 2 jam. |
| **A08** | **Software Integrity** | Pinned dependencies & environment variable strict check. |
| **A09** | **Logging Failures** | Log percobaan login ilegal beserta timestamp. |
| **A10** | **SSRF** | N/A (Tidak ada outbound HTTP request). |

---

## 🛠️ Cara Setup & Menjalankan

### 1. Prasyarat
- **Node.js** >= 22.0.0
- **npm** atau **yarn**

### 2. Instalasi Dependensi
```bash
# Clone repositori
git clone https://github.com/USERNAME/tanyathuba.git
cd tanyathuba

# Install paket dependensi
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Sesuaikan variabel di `.env`:
```env
PORT=3000
NODE_ENV=production

JWT_SECRET=rahasia_jwt_super_aman_anda
CAPTCHA_SECRET=rahasia_hmac_captcha_anda
IP_SALT=rahasia_salt_ip_anda

# Kredensial Admin Portal
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2a$10$QREkTobfruRMZrbCM1FXXeq7d420v1mGfLgpsv.gJWFgFNqWVFnF.

ALLOWED_ORIGIN=http://localhost:3000
```

> [!TIP]
> Untuk membuat username dan hash password admin baru dengan mudah, jalankan wizard interaktif:
> ```bash
> npm run setup
> ```
> Wizard akan meminta Anda memasukkan username dan password baru, lalu otomatis menghasilkan hash bcrypt cost 12 yang aman untuk file `.env`.

### 4. Menjalankan Server
```bash
# Mode Development
npm run dev

# Mode Production (Build & Start)
npm run build
npm run start
```
---

## 📄 Lisensi
Projek ini dibuat untuk kemaslahatan dakwah dan umat. Didedikasikan untuk mempermudah majelis-majelis ilmu.
Semoga menjadi amal jariyah bagi para pengembang dan seluruh pihak yang menggunakannya.
