# 📋 Implementation Plan - Portal KKG Enhancement

## Status Legend
- ⬜ Belum dimulai
- 🔄 Sedang dikerjakan
- ✅ Selesai
- ⏸️ Ditunda

---

## 🔴 PRIORITAS TINGGI

### 1. ✅ Download DOCX/PDF untuk Surat & Proker
- [x] Install library docx untuk generate DOCX
- [x] Buat endpoint `/api/surat/:id/download`
- [x] Buat endpoint `/api/proker/:id/download`
- [x] Update frontend dengan tombol download
- [x] Format dokumen sesuai standar surat dinas

### 2. ✅ Lupa Password via Email
- [x] Buat tabel password_reset_tokens
- [x] Endpoint POST `/api/auth/forgot-password`
- [x] Endpoint POST `/api/auth/reset-password`
- [x] Integrasi email service (Resend/SendGrid)
- [x] UI form lupa password
- [x] Email template reset password

### 3. ✅ Aktifkan Dark Mode & PWA
- [x] Re-enable theme.js imports
- [x] Re-enable a11y.js imports
- [x] Re-enable Service Worker registration
- [x] Test dark mode toggle
- [ ] Test offline capabilities

### 4. ✅ QR Code untuk Absensi
- [x] Generate QR code per kegiatan (qrcode library)
- [x] Endpoint `/api/absensi/kegiatan/:id/qr`
- [x] Scan QR code via manual input (html5-qrcode optional)
- [x] UI scan QR di halaman absensi
- [x] Validasi QR code saat check-in

### 5. ✅ File Storage (Cloudflare R2)
- [x] Setup R2 bucket di Cloudflare (wrangler.jsonc)
- [x] Update wrangler.jsonc dengan R2 binding
- [x] Buat upload endpoint multipart/form-data
- [x] Update materi routes untuk file upload (file_key)
- [x] UI upload file dengan drag & drop

### 6. ✅ Audit Log Admin
- [x] Buat tabel audit_logs
- [x] Middleware logging untuk semua admin actions
- [x] Endpoint GET `/api/admin/logs`
- [x] UI tampilan audit log (tab di Panel Admin)
- [x] Filter berdasarkan action/user/date

### 7. ✅ Modul Kalender/Jadwal
- [x] Buat tabel kalender (calendar_events)
- [x] CRUD endpoints untuk event
- [x] Frontend kalender view (month/week/list)
- [x] Integrasi dengan kegiatan absensi
- [x] Sync kegiatan ke kalender

### 8. ✅ Setting Profil KKG Lengkap
- [x] Tambah field di settings: logo, alamat lengkap, struktur organisasi
- [x] Upload logo KKG (dengan R2 atau fallback Base64)
- [x] UI pengaturan profil organisasi (tab Profil KKG)
- [x] Tampilkan di kop surat generated

### 9. ✅ CSRF Validation Konsisten
- [x] Middleware CSRF untuk semua POST/PUT/DELETE
- [x] Update semua form dengan CSRF token (auto via api.js)
- [x] Validasi token di setiap request
- [x] Auto-refresh token saat error CSRF

---

## 🟡 PRIORITAS SEDANG

### 10. ✅ Status Izin/Sakit Absensi
- [x] Update schema absensi dengan field status (hadir/izin/sakit/alpha)
- [x] Update check-in endpoint dengan status selection
- [x] UI pilihan status saat absen (modal dialog)
- [x] Rekap per status dengan breakdown

### 11. ✅ Rating & Review Materi
- [x] Buat tabel materi_reviews (migration 0005)
- [x] Endpoint CRUD review (/materi/:id/reviews)
- [x] UI rating bintang + komentar (modal interaktif)
- [x] Tampilkan average rating di card materi

### 12. ⬜ Edit Hasil Generate AI
- [ ] Tambahkan WYSIWYG editor
- [ ] Update endpoint PUT surat/proker
- [ ] Auto-save draft
- [ ] Version history

### 13. ✅ Export Rekap Absensi
- [x] Endpoint `/api/absensi/rekap/export`
- [x] Generate CSV dengan breakdown status
- [x] Endpoint `/api/absensi/export/detail` untuk data rinci
- [x] UI tombol export (admin only)

### 14. ⬜ Sistem Notifikasi
- [ ] Buat tabel notifications
- [ ] Web Push API setup
- [ ] Email notification service
- [ ] UI notification bell
- [ ] Mark as read functionality

### 15. ✅ Template Surat
- [x] Buat tabel surat_templates (migration 0006)
- [x] CRUD templates oleh admin (/api/templates)
- [x] UI Tab Template Surat di Admin Panel
- [x] Preview, duplikasi, toggle active/inactive
- [x] Integrasi template ke Generator Surat (dual mode: AI / Template)

### 16. ⬜ Preview Dokumen
- [ ] PDF viewer komponen
- [ ] Preview surat sebelum simpan
- [ ] Preview materi sebelum download

### 17. ⬜ Tags untuk Materi
- [ ] Update schema materi dengan tags
- [ ] Tag input autocomplete
- [ ] Filter berdasarkan tags
- [ ] Popular tags display

### 18. ⬜ Mention @user di Forum
- [ ] Autocomplete @username
- [ ] Highlight mention dalam post
- [ ] Notifikasi saat di-mention

### 19. ⬜ Solved Marking Forum
- [ ] Field is_solved di forum_threads
- [ ] Endpoint toggle solved
- [ ] Best answer marking
- [ ] Filter solved/unsolved

### 20. ⬜ Email Blast Pengumuman
- [ ] Tombol "Kirim ke semua anggota"
- [ ] Queue email dengan batched sending
- [ ] Track email sent status

### 21. ⬜ Attachment Pengumuman
- [ ] Update schema pengumuman
- [ ] Upload attachment files
- [ ] Display attachments

### 22. ⬜ Bulk Operations Admin
- [ ] Multi-select users
- [ ] Bulk delete, reset password
- [ ] Bulk export

### 23. ✅ User Approval System
- [x] Field is_approved di users (migration 0005)
- [x] Pending users list endpoint
- [x] Approve/reject/bulk-approve endpoints
- [x] Approval stats endpoint

### 24. ✅ Statistik Trend Admin
- [x] Chart library (Chart.js)
- [x] Weekly/monthly activity graphs (tren surat, absensi, materi)
- [x] Member distribution chart (doughnut by sekolah)
- [x] Dashboard summary cards (minggu ini, hari ini)

### 25. ⬜ Two-Factor Authentication (2FA)
- [ ] TOTP setup flow
- [ ] QR code untuk authenticator
- [ ] Backup codes
- [ ] 2FA verification on login

### 26. ⬜ Email Verification
- [ ] is_verified field
- [ ] Verification email on register
- [ ] Resend verification link
- [ ] Restricted access until verified

### 27. ✅ Skeleton Loading
- [x] Skeleton component library (list, cards, table, form, profile)
- [x] Reusable skeleton templates
- [x] Smooth fade-in transitions

### 28. ⬜ Error Boundary
- [ ] Global error handler
- [ ] Friendly error pages
- [ ] Error logging

### 29. ⬜ Response Caching
- [ ] Cloudflare Cache API
- [ ] Cache GET endpoints
- [ ] Cache invalidation strategy

### 30. ⬜ Request Logging
- [ ] Structured logging middleware
- [ ] Log to Cloudflare Logs
- [ ] Request ID tracking

### 31. ⬜ E2E Testing
- [ ] Setup Playwright
- [ ] Test critical flows
- [ ] CI integration

---

## 🟢 PRIORITAS RENDAH

### 32. ⬜ Gamifikasi
- [ ] Buat tabel user_badges, user_points
- [ ] Define badge types
- [ ] Point system rules
- [ ] Award badges on actions
- [ ] Leaderboard display
- [ ] Profile badge showcase

---

## Progress Tracker

| Phase | Items | Completed | Progress |
|-------|-------|-----------|----------|
| Tinggi | 9 | 9 | 100% ✅ |
| Sedang | 22 | 7 | 32% |
| Rendah | 1 | 0 | 0% |
| **Total** | **32** | **16** | **50%** |

---

Last Updated: 2026-02-08 18:15

**🎉 Fitur Prioritas Sedang yang selesai:**
1. ✅ Status Izin/Sakit Absensi
2. ✅ Export Rekap Absensi
3. ✅ Statistik Trend Admin (Chart.js)
4. ✅ Skeleton Loading
5. ✅ Rating & Review Materi
6. ✅ User Approval System
7. ✅ Template Surat (CRUD by Admin)







