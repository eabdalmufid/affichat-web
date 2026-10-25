# 💬 AffiChat Web - Open-Source Zero-Database WhatsApp Web Client

[![Deploy to GitHub Pages](https://github.com/eabdalmufid/affichat-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/eabdalmufid/affichat-web/actions/workflows/deploy.yml)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**AffiChat Web** adalah klien antarmuka WhatsApp Web modern, ringan, dan **100% tanpa database server (zero-database)**. Dibuat dengan **React 19 + TypeScript + Vite**, dirancang khusus untuk berjalan di hosting statis gratis seperti **GitHub Pages, Cloudflare Pages, Vercel, atau Netlify** tanpa memerlukan server backend tambahan.

Aplikasi ini terhubung langsung ke **AffiChat Gateway** ([chat.affidev.com](https://chat.affidev.com)) untuk mengirim pesan via REST API dan menerima pesan masuk secara realtime via jembatan Server-Sent Events (SSE) **Smee.io**.

🌐 **Demo Publik:** [https://wa.affidev.com](https://wa.affidev.com)

---

## 🌟 Fitur Utama

- ⚡ **Zero Database / Serverless Murni**:
  Seluruh riwayat obrolan, kontak, dan konfigurasi tersimpan aman secara lokal di `localStorage` browser pengguna masing-masing. Tidak ada data yang tersimpan di server pihak ketiga.
- 💬 **Antarmuka WhatsApp Web Modern**:
  Tema gelap profesional (*WhatsApp Dark Mode* resmi), gelembung pesan hijau zamrud (`#005C4B`), status centang terkirim/terbaca (✓✓), dan tata letak responsif untuk desktop maupun smartphone.
- 🔔 **Suara Notifikasi Sintetis**:
  Efek suara pop notifikasi pesan masuk dibuat otomatis menggunakan *Web Audio API* bawaan browser (zero external media assets).
- 🚀 **Penerima Pesan Realtime Tanpa VPS**:
  Menggunakan jembatan open-source [Smee.io](https://smee.io) dari GitHub untuk menyalurkan event webhook pesan masuk dari gateway WhatsApp ke browser melalui *Server-Sent Events (SSE)*.
- 🔑 **Pengecekan Kuota & API Key Real-Time**:
  Tombol *Periksa Key* otomatis memanggil endpoint `/api/key/check` untuk menampilkan nama pemilik akun, paket langganan, dan sisa kuota pesan WhatsApp aktif.
- 💾 **Backup & Restore**:
  Ekspor seluruh riwayat chat ke format `.json` dan opsi hapus riwayat sekali klik untuk privasi penuh.

---

## 🚀 Panduan Penggunaan Cepat (Untuk Pengguna)

Jika Anda ingin langsung menggunakan klien ini:

1. Buka [**https://wa.affidev.com**](https://wa.affidev.com) di browser Anda.
2. Klik ikon **Pengaturan (⚙️)** di pojok kiri atas.
3. Masukkan autentikasi akun AffiChat:
   - **API Key**: Salin dari menu [API Key](https://chat.affidev.com/dashboard/apikeys) di dashboard AffiChat Anda.
   - **ID Sesi (Device)**: Salin kode sesi WhatsApp Anda dari menu [Perangkat](https://chat.affidev.com/dashboard/sessions) (misal: `affichat_xxxx`).
4. Pasang Webhook Penerima Pesan:
   - Di bagian *Link Penerima Pesan (Webhook)*, klik tombol **"Buat Link Baru"**.
   - Klik **"Salin Link Webhook"**.
   - Buka menu [Webhooks](https://chat.affidev.com/dashboard/webhooks) di dashboard AffiChat, tempelkan link tersebut ke kolom **Webhook URL**, centang event `messages.upsert`, lalu simpan.
5. Klik **"Simpan Pengaturan"** di AffiChat Web.
6. Selesai! Pesan masuk dan keluar akan langsung tersinkronisasi secara otomatis di layar Anda.

---

## 🛠️ Menjalankan Secara Lokal (Development)

Pastikan Node.js (versi 18+) sudah terpasang di komputer Anda:

```bash
# 1. Clone repository ini
git clone https://github.com/eabdalmufid/affichat-web.git
cd affichat-web

# 2. Install dependensi
npm install

# 3. Jalankan server lokal
npm run dev
```

Buka browser Anda di `http://localhost:5173`.

---

## 🌐 Cara Deploy ke GitHub Pages Sendiri (Untuk Forkers)

Jika Anda ingin men-deploy proyek ini ke akun GitHub Anda sendiri:

### 1. Fork Repository
Klik tombol **Fork** di pojok kanan atas repository ini ke akun GitHub Anda.

### 2. Aktifkan GitHub Actions di Pengaturan Repository
> [!IMPORTANT]
> Langkah ini wajib dilakukan sekali di GitHub agar proses deploy otomatis berjalan:

1. Buka repository fork Anda di GitHub.
2. Masuk ke menu **Settings** $\rightarrow$ **Pages** (di sidebar kiri).
3. Di bawah judul **Build and deployment** $\rightarrow$ **Source**:
   - Ganti pilihan dari *Deploy from a branch* menjadi **GitHub Actions**.

### 3. Pengaturan Custom Domain (Opsional)
- Jika Anda ingin memakai domain pribadi (contoh: `wa.domainanda.com`):
  - Edit file `public/CNAME` dan masukkan domain Anda.
  - Tambahkan DNS Record `CNAME` di provider domain Anda mengarah ke `<username>.github.io`.
- Jika Anda ingin memakai domain default GitHub Pages (`https://<username>.github.io/affichat-web`):
  - Cukup hapus file `public/CNAME`.

Setiap kali Anda melakukan `git push` ke branch `main`, GitHub Actions akan otomatis mengompilasi dan memublikasikan versi terbaru secara gratis!

---

## 🏗️ Struktur Direktori

```text
affichat-web/
├── .github/workflows/deploy.yml  # Otomasi build & deploy ke GitHub Pages
├── public/
│   ├── CNAME                     # Custom domain GitHub Pages
│   └── logo-nobg.png             # Logo transparan resmi
├── src/
│   ├── assets/                   # Aset grafis
│   ├── components/               # Komponen antarmuka WhatsApp Web
│   │   ├── ChatArea.tsx          # Gelembung chat & form kirim pesan
│   │   ├── ChatList.tsx          # Daftar percakapan & filter
│   │   ├── EmptyChat.tsx         # Layar sambutan & onboarding
│   │   ├── NewChatModal.tsx      # Modal mulai chat baru
│   │   ├── SettingsModal.tsx     # Modal pengaturan API Key & Webhook
│   │   └── SidebarHeader.tsx     # Header sidebar & status sesi
│   ├── services/
│   │   ├── gatewayApi.ts         # Klien REST API AffiChat (/api/send-text)
│   │   └── webhookReceiver.ts    # Klien EventSource SSE Smee.io
│   ├── utils/                    # Utilitas audio, phone number, & storage
│   ├── types.ts                  # Deklarasi tipe TypeScript
│   ├── App.tsx                   # State & layout controller utama
│   └── index.css                 # WhatsApp Dark Mode design system
├── package.json
└── vite.config.ts                # Konfigurasi subpath relative base './'
```

---

## 🔒 Privasi & Keamanan

- **Zero-Log Policy**: Aplikasi ini tidak memiliki server perantara. Seluruh komunikasi data terjadi langsung dari browser pengguna ke gateway AffiChat resmi (`https://chat.affidev.com`).
- **Kredensial Aman**: API Key WhatsApp hanya tersimpan di browser lokal Anda sendiri dan tidak pernah dikirim ke tempat lain selain endpoint resmi gateway.

---

## 📄 Lisensi

Didistribusikan di bawah lisensi **MIT**. Siapa pun bebas menggunakan, memodifikasi, dan mendistribusikan aplikasi ini untuk keperluan pribadi maupun komersial.

Dikembangkan dengan ❤️ untuk ekosistem [AffiChat](https://chat.affidev.com).
