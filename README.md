# Portal Digital KKG Gugus 3 Wanayasa

Portal Digital untuk Kelompok Kerja Guru (KKG) Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta.

## Fitur Utama

### 1. Generator Surat Undangan KKG
- Form input lengkap: jenis kegiatan, tanggal, waktu, tempat, agenda, peserta
- Generate otomatis menggunakan **Mistral Large 3 AI**
- Preview surat + download PDF
- Riwayat surat yang pernah dibuat

### 2. Generator Program Kerja KKG
- Input visi, misi, daftar kegiatan (dinamis)
- Generate dokumen program kerja lengkap dengan AI
- Format sesuai pedoman Kemendikbud
- Preview + download PDF

### 3. Absensi Digital
- Daftar kegiatan dengan check-in kehadiran
- Rekap kehadiran per guru
- Admin bisa menambahkan kegiatan baru

### 4. Repository Materi
- Upload & download materi pembelajaran
- Kategori: RPP, Modul, Silabus, Media Ajar, Soal
- Filter berdasarkan jenjang dan jenis

### 5. Direktori Guru
- Data anggota KKG (nama, NIP, sekolah, mata pelajaran, kontak)
- Pencarian guru

### 6. Forum Diskusi
- Thread diskusi per topik
- Balasan/reply
- Kategori: Best Practice, Kurikulum, Teknologi, dll.

### 7. Pengumuman & Jadwal
- Admin bisa memposting pengumuman
- Fitur sematkan (pin) pengumuman penting

### 8. Panel Admin
- Dashboard statistik
- Kelola pengguna (role, reset password)
- Pengaturan API Key Mistral
- Konfigurasi data KKG

## Tech Stack
- **Backend**: Hono (TypeScript) pada Cloudflare Workers
- **Frontend**: Vanilla JS SPA + Tailwind CSS + Font Awesome
- **Database**: Cloudflare D1 (SQLite)
- **AI**: Mistral Large 3 API
- **Deployment**: Cloudflare Pages

## Akun Demo
| Email | Password | Role |
|-------|----------|------|
| admin@kkg-wanayasa.id | admin123 | Admin |
| siti@kkg-wanayasa.id | admin123 | User |
| budi@kkg-wanayasa.id | admin123 | User |
| dewi@kkg-wanayasa.id | admin123 | User |
| ahmad@kkg-wanayasa.id | admin123 | User |

## Struktur Proyek
```
webapp/
├── src/
│   ├── index.tsx            # Main Hono app + routes
│   ├── lib/
│   │   ├── auth.ts          # Authentication utilities
│   │   └── mistral.ts       # Mistral AI integration
│   ├── routes/
│   │   ├── auth.ts          # Login/Register/Logout
│   │   ├── surat.ts         # Generator Surat Undangan
│   │   ├── proker.ts        # Generator Program Kerja
│   │   ├── absensi.ts       # Absensi Digital
│   │   ├── guru.ts          # Direktori Guru
│   │   ├── pengumuman.ts    # Pengumuman
│   │   ├── forum.ts         # Forum Diskusi
│   │   ├── materi.ts        # Repository Materi
│   │   └── admin.ts         # Panel Admin
│   └── templates/
│       └── layout.ts        # HTML template
├── public/static/
│   └── app.js               # Frontend SPA
├── migrations/
│   └── 0001_initial_schema.sql
├── seed.sql                 # Data demo
├── wrangler.jsonc           # Cloudflare config
├── vite.config.ts           # Build config
├── ecosystem.config.cjs     # PM2 config
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Surat Undangan
- `POST /api/surat/generate` - Generate surat (requires login)
- `GET /api/surat/history` - Riwayat surat
- `GET /api/surat/:id` - Detail surat
- `DELETE /api/surat/:id` - Hapus surat

### Program Kerja
- `POST /api/proker/generate` - Generate proker (requires login)
- `GET /api/proker/history` - Riwayat proker
- `GET /api/proker/:id` - Detail proker
- `DELETE /api/proker/:id` - Hapus proker

### Absensi
- `GET /api/absensi/kegiatan` - List kegiatan
- `POST /api/absensi/kegiatan` - Tambah kegiatan (admin)
- `POST /api/absensi/checkin` - Check-in kehadiran
- `GET /api/absensi/kegiatan/:id/absensi` - Daftar hadir per kegiatan
- `GET /api/absensi/rekap` - Rekap kehadiran

### Guru
- `GET /api/guru` - Daftar guru (public)
- `GET /api/guru/sekolah` - Daftar sekolah
- `PUT /api/guru/:id` - Update profil
- `PUT /api/guru/:id/role` - Update role (admin)

### Forum
- `GET /api/forum/threads` - List thread
- `GET /api/forum/threads/:id` - Detail thread + replies
- `POST /api/forum/threads` - Buat thread baru
- `POST /api/forum/threads/:id/reply` - Balas thread

### Pengumuman
- `GET /api/pengumuman` - List pengumuman (public)
- `POST /api/pengumuman` - Buat pengumuman (admin)
- `PUT /api/pengumuman/:id` - Edit (admin)
- `DELETE /api/pengumuman/:id` - Hapus (admin)

### Materi
- `GET /api/materi` - List materi (public)
- `POST /api/materi` - Upload materi
- `POST /api/materi/:id/download` - Track download
- `DELETE /api/materi/:id` - Hapus materi

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings
- `GET /api/admin/users` - List users
- `POST /api/admin/users/:id/reset-password` - Reset password

### Database
- `GET /api/init-db` - Initialize database (first time only)

## Deployment ke Cloudflare Pages

### 1. Setup
```bash
npm install
```

### 2. Buat D1 Database
```bash
npx wrangler d1 create kkg-production
# Copy database_id ke wrangler.jsonc
```

### 3. Deploy
```bash
npm run build
npx wrangler pages project create kkg-gugus3-wanayasa --production-branch main
npx wrangler pages deploy dist --project-name kkg-gugus3-wanayasa
```

### 4. Set API Key Mistral
Setelah deploy, login sebagai admin dan masukkan API Key Mistral di halaman Admin > Pengaturan.

Dapatkan API Key dari: https://console.mistral.ai/

### 5. Inisialisasi Database
Buka URL: `https://kkg-gugus3-wanayasa.pages.dev/api/init-db`

## Catatan Penting
- Semua fitur **read-only** bisa diakses tanpa login
- Fitur generate surat/proker, upload, dan posting memerlukan login
- Admin bisa mengelola semua user, pengumuman, dan data master
- API Key Mistral harus dikonfigurasi admin untuk fitur AI
- Bahasa Indonesia digunakan di seluruh antarmuka

## Status: Aktif
Terakhir diperbarui: 7 Februari 2026
