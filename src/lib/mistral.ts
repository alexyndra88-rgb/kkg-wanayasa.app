// Mistral AI integration for generating surat and program kerja

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

export async function callMistral(apiKey: string, prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error('API Key Mistral belum dikonfigurasi. Silakan hubungi admin untuk mengatur API Key di halaman Pengaturan.');
  }

  const response = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'system',
          content: `Anda adalah asisten ahli administrasi pendidikan Indonesia yang sangat berpengalaman dalam menyusun dokumen resmi untuk Kelompok Kerja Guru (KKG). Anda memahami format surat dinas pendidikan Indonesia, tata bahasa Indonesia yang baik dan benar, serta pedoman-pedoman dari Kementerian Pendidikan dan Kebudayaan. Selalu gunakan bahasa Indonesia yang formal, sopan, dan profesional. PENTING: Selalu selesaikan dokumen sampai bagian terakhir, jangan berhenti di tengah.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 16384, // Increased for complete Program Kerja documents
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gagal memanggil API Mistral: ${response.status} - ${error}`);
  }

  const data: any = await response.json();
  return data.choices[0]?.message?.content || 'Tidak ada respons dari AI.';
}

export function buildSuratPrompt(input: {
  jenis_kegiatan: string;
  tanggal_kegiatan: string;
  waktu_kegiatan: string;
  tempat_kegiatan: string;
  agenda: string;
  peserta: string;
  penanggung_jawab: string;
  nomor_surat?: string;
}): string {
  return `Tulis surat undangan resmi untuk kegiatan KKG Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta dengan detail berikut:

- Jenis Kegiatan: ${input.jenis_kegiatan}
- Hari/Tanggal: ${input.tanggal_kegiatan}
- Waktu: ${input.waktu_kegiatan} WIB
- Tempat: ${input.tempat_kegiatan}
- Agenda/Acara: ${input.agenda}
- Peserta yang Diundang: ${input.peserta}
- Penanggung Jawab: ${input.penanggung_jawab}
${input.nomor_surat ? `- Nomor Surat: ${input.nomor_surat}` : '- Nomor Surat: (buat format nomor surat yang sesuai)'}

INSTRUKSI PENTING:
1. FOKUS HANYA PADA ISI SURAT (BODY).
2. JANGAN TULIS KOP SURAT (sudah otomatis).
3. JANGAN TULIS NOMOR/LAMPIRAN/PERIHAL (sudah otomatis).
4. JANGAN TULIS TANGGAL & TANDA TANGAN (sudah otomatis).
5. Mulai langsung dengan "Kepada Yth. ..."
6. Gunakan bahasa Indonesia formal, sopan, dan profesional.
7. Isi Detail:
   - Kepada Yth. (Sebutkan peserta: ${input.peserta})
   - Salam pembuka (Dengan hormat,)
   - Paragraf pembuka
   - Detail Acara (Hari/Tanggal: ${input.tanggal_kegiatan}, Waktu: ${input.waktu_kegiatan}, Tempat: ${input.tempat_kegiatan}, Agenda: ${input.agenda})
   - Paragraf penutup (Contoh: Demikian undangan ini kami sampaikan...)
   - Salam penutup (Wassalamu'alaikum wr. wb.)
8. JANGAN gunakan markdown formatting (bold/italic) karena akan menjadi plain text. Gunakan huruf kapital untuk penekanan jika perlu.`;
}

export function buildProkerPrompt(input: {
  tahun_ajaran: string;
  visi: string;
  misi: string;
  kegiatan: string;
  analisis_kebutuhan?: string;
  sekolah_list?: string[];
  settings?: any;
}): string {
  const sekolahInfo = input.sekolah_list && input.sekolah_list.length > 0
    ? `\n\nDAFTAR SEKOLAH ANGGOTA KKG GUGUS 3 WANAYASA:\n${input.sekolah_list.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nPENTING: Gunakan HANYA nama-nama sekolah di atas. JANGAN gunakan nama sekolah lain yang tidak ada di daftar.`
    : '';



  const s = input.settings || {};

  return `Anda adalah ahli penyusunan dokumen administrasi pendidikan Indonesia. Susun PROGRAM KERJA TAHUNAN yang LENGKAP dan PROFESIONAL untuk KKG Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta, Tahun Ajaran ${input.tahun_ajaran}.

=== DATA INPUT ===

VISI KKG:
${input.visi}

MISI KKG:
${input.misi}

DAFTAR KEGIATAN YANG DIRENCANAKAN:
${input.kegiatan}
${sekolahInfo}

${input.analisis_kebutuhan ? `ANALISIS KEBUTUHAN TAMBAHAN:\n${input.analisis_kebutuhan}` : ''}

=== STRUKTUR DOKUMEN WAJIB ===

PENTING: Cover page (halaman judul) akan dibuat OTOMATIS oleh sistem.
JANGAN tulis judul "PROGRAM KERJA", "PROGRAM KERJA TAHUNAN", atau sejenisnya di awal.
MULAI LANGSUNG dari KATA PENGANTAR.

Susun dokumen dengan struktur berikut secara LENGKAP dan DETAIL:

---
KATA PENGANTAR
---
Tulis 2-3 paragraf yang berisi:
- Ucapan syukur
- Penjelasan singkat tentang program kerja
- Harapan dan manfaat dokumen
- Akhiri dengan tempat, tanggal, dan "Ketua KKG Gugus 3 Wanayasa"

---
DAFTAR ISI
---
Tuliskan daftar isi lengkap dengan format (gunakan titik-titik untuk pemisah):

KATA PENGANTAR .................................................. i
DAFTAR ISI ............................................................... ii
BAB I PENDAHULUAN ............................................. 1
    A. Latar Belakang ................................................. 1
    B. Dasar Hukum ................................................... 2
    C. Tujuan .............................................................. 3
    D. Sasaran ............................................................ 4
    E. Hasil yang Diharapkan ..................................... 4
BAB II PROFIL KKG GUGUS 3 WANAYASA ............... 5
    A. Identitas KKG ................................................... 5
    B. Struktur Organisasi .......................................... 5
    C. Daftar Sekolah Anggota ................................... 6
    D. Data Keanggotaan ........................................... 6
BAB III ANALISIS KONDISI DAN SWOT ................. 7
    A. Analisis Kondisi Saat Ini ................................. 7
    B. Analisis SWOT ................................................. 8
BAB IV PROGRAM KEGIATAN ................................. 9
    A. Program Rutin .................................................. 9
    B. Program Pengembangan .................................. 9
    C. Rincian Kegiatan .............................................. 10
    D. Jadwal/Timeline Pelaksanaan .......................... 11
BAB V ANGGARAN ................................................ 12
    A. Sumber Dana .................................................. 12
    B. Rencana Anggaran Biaya (RAB) ....................... 13
BAB VI PENUTUP ..................................................... 14
    A. Kesimpulan ..................................................... 14
    B. Harapan .......................................................... 14
    C. Penutup .......................................................... 14
LEMBAR PENGESAHAN .......................................... 15

---
BAB I PENDAHULUAN
---

A. Latar Belakang
Tulis 3-4 paragraf yang menjelaskan:
- Pentingnya pengembangan kompetensi guru SD
- Peran KKG dalam pembinaan profesional guru
- Urgensi penyusunan program kerja yang terencana
- Kondisi pendidikan di Kecamatan Wanayasa

B. Dasar Hukum
Tulis 1 paragraf pengantar yang menyatakan landasan hukum penyusunan program kerja, baru kemudian buat daftar nomor:
1. Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional
2. Undang-Undang Nomor 14 Tahun 2005 tentang Guru dan Dosen
3. Peraturan Pemerintah Nomor 19 Tahun 2005 tentang Standar Nasional Pendidikan
4. Peraturan Menteri Pendidikan Nasional Nomor 16 Tahun 2007 tentang Standar Kualifikasi Akademik dan Kompetensi Guru
5. Peraturan Menteri Pendidikan dan Kebudayaan Nomor 22 Tahun 2020 tentang Rencana Strategis Kemendikbud
6. Surat Edaran Dirjen GTK tentang Pembinaan Guru melalui KKG/MGMP
7. Peraturan Daerah Kabupaten Purwakarta tentang Penyelenggaraan Pendidikan

C. Tujuan
Tulis 1 paragraf narasi pengantar mengenai arah strategis KKG, baru kemudian rincian menggunakan format nomor (1, 2) dan huruf (a, b):

1. Tujuan Umum
   a. Meningkatkan kompetensi profesional guru SD di Gugus 3 Wanayasa
   b. (lanjutkan poin berikutnya)

2. Tujuan Khusus
   a. Meningkatkan kemampuan pedagogik guru
   b. Mengembangkan materi dan media pembelajaran inovatif
   c. Memfasilitasi pertukaran pengalaman dan best practices
   d. Meningkatkan kualitas proses pembelajaran di kelas
   e. Menyiapkan guru menghadapi perubahan kurikulum

D. Sasaran
Tulis 1 paragraf deskriptif mengenai siapa target audiens program ini secara kualitatif, baru kemudian poin kuantitatif jika ada (gunakan format 1, 2, 3).

E. Hasil yang Diharapkan
Tulis deskripsi naratif tentang dampak jangka panjang (outcome) yang diharapkan bagi pendidikan di Gugus 3.

---
BAB II PROFIL KKG GUGUS 3 WANAYASA
---

A. Identitas KKG
Tulis 1 paragraf narasi profil singkat KKG.
Setelah narasi, sajikan identitas dalam bentuk TABEL berikut:

| Uraian | Keterangan |
|--------|------------|
| Nama Organisasi | ${s.nama_kkg || 'KKG Gugus 3 Kecamatan Wanayasa'} |
| Alamat Sekretariat | ${s.alamat_sekretariat || '[sebutkan alamat]'} |
| Kecamatan | ${s.kecamatan || 'Wanayasa'} |
| Kabupaten | ${s.kabupaten || 'Purwakarta'} |
| Provinsi | ${s.provinsi || 'Jawa Barat'} |
| Email | ${s.email_kkg || '-'} |

B. Struktur Organisasi
Tulis 1 paragraf narasi pengantar mengenai struktur organisasi KKG.

1. Struktur Inti KKG Gugus 3 Wanayasa
   Sajikan dalam bentuk TABEL PRESISI:

| Jabatan | Nama Pejabat | Asal Sekolah |
|---------|--------------|--------------|
| Pembina | ${s.nama_pembina || 'Wahid, S.Pd, M.Pd'} | Pengawas Sekolah |
| Ketua Gugus 3 | ${s.nama_ketua_gugus || 'H. Ujang Ma\'mun, S.Pd.I'} | - |
| Ketua KKG Gugus | ${s.nama_ketua || 'Maman Rukman, S.Pd'} | ${s.sekolah_ketua || '-'} |
| Sekretaris | ${s.nama_sekretaris || 'Andris Hadiansyah, S.Pd'} | ${s.sekolah_sekretaris || 'SDN 1 Cibuntu'} |
| Bendahara | ${s.nama_bendahara || 'Reny Srimulyani A, S.Pd'} | ${s.sekolah_bendahara || '-'} |
| Sarana Prasarana | ${s.nama_sarpras || 'Ulfa Laiza Ul\'ul, S.Pd'} | ${s.sekolah_sarpras || '-'} |
| Humas | ${s.nama_humas || 'Harun, S.Pd'} | ${s.sekolah_humas || '-'} |

2. Struktur Guru Pendamping Kelas
   Sajikan dalam bentuk TABEL PRESISI:

| Kelas/Bidang | Nama Guru Pendamping | Asal Sekolah |
|--------------|----------------------|--------------|
| Kelas 1 | ${s.guru_kelas_1 || 'Lena Marlina, S.Pd'} | ${s.sekolah_kelas_1 || 'SDN Nagrog'} |
| Kelas 2 | ${s.guru_kelas_2 || 'Ade Setiawati, S.Pd'} | ${s.sekolah_kelas_2 || 'SDN 2 Nangerang'} |
| Kelas 3 | ${s.guru_kelas_3 || 'Tuti Sutiawati, S.Pd'} | ${s.sekolah_kelas_3 || 'SDIT Al-Qalam'} |
| Kelas 4 | ${s.guru_kelas_4 || 'Nur'} | ${s.sekolah_kelas_4 || 'SDN 2 Cibuntu'} |
| Kelas 5 | ${s.guru_kelas_5 || 'Ujang Aip, S.Pd'} | ${s.sekolah_kelas_5 || 'SDN Sakambang'} |
| Kelas 6 | ${s.guru_kelas_6 || 'Eti Sumiati, S.Pd'} | ${s.sekolah_kelas_6 || 'SDN 1 Cibuntu'} |
| PAI (KKGA) | ${s.guru_pai || 'Soleh Muslim'} | ${s.sekolah_pai || 'SDN 1 Cibuntu'} |
| PJOK (KKGO) | ${s.guru_pjok || 'Ahmad'} | ${s.sekolah_pjok || 'SDN 1 Nangerang'} |

C. Daftar Sekolah Anggota
Tulis 1 paragraf pengantar mengenai cakupan wilayah gugus.
Kemudian buat TABEL DATA SEKOLAH DAN GURU dengan format kolom lengkap:

| No | Nama Sekolah | Guru (L) | Guru (P) | ASN | Non ASN | Sertifikasi | Belum Sertifikasi | Total Guru |
|----|--------------|----------|----------|-----|---------|-------------|-------------------|------------|
(Isi kolom Nama Sekolah berdasarkan daftar sekolah di Data Input.
Biarkan kolom angka diisi dengan tanda "..." atau angka estimasi jika tidak ada data spesifik, agar bisa diedit manual)

D. Data Keanggotaan
Tulis narasi analisis singkat mengenai profil kompetensi guru secara umum.

---
BAB III ANALISIS KONDISI DAN SWOT
---

A. Analisis Kondisi Saat Ini
Tulis 2-3 paragraf naratif yang menganalisis secara objektif kondisi pendidikan guru, siswa, dan sarana prasarana di Gugus 3 saat ini. Gunakan data Visi dan Misi sebagai acuan standar ideal.

B. Analisis SWOT
Lakukan analisis SWOT mendalam berdasarkan Visi Misi dan kondisi umum pendidikan.
WAJIB gunakan format penomoran: 1. (Kategori) -> a. (Poin analisis). JANGAN gunakan bullet points.

1. Kekuatan (Strengths)
   a. (Sebutkan poin kekuatan internal KKG, misal: semangat kolaborasi)
   b. (Poin berikutnya...)

2. Kelemahan (Weaknesses)
   a. (Sebutkan kendala internal, misal: keterbatasan waktu)
   b. (Poin berikutnya...)

3. Peluang (Opportunities)
   a. (Sebutkan faktor eksternal positif, misal: kebijakan Kurikulum Merdeka)
   b. (Poin berikutnya...)

4. Tantangan (Threats)
   a. (Sebutkan faktor eksternal negatif, misal: perubahan regulasi)
   b. (Poin berikutnya...)

---
BAB IV PROGRAM KEGIATAN
---

A. Program Rutin
Tulis narasi penjelasan mengenai pentingnya konsistensi pertemuan.
(Daftar kegiatan rutin dengan penomoran 1, 2, 3...)

B. Program Pengembangan
Tulis narasi mengenai fokus pengembangan kompetensi tahun ini.
(Daftar program pengembangan dengan penomoran 1, 2, 3...)

C. Rincian Kegiatan
Tulis pengantar sebelum tabel: "Berikut adalah matriks rincian kegiatan yang direncanakan:"

[TABEL_KEGIATAN]
| No | Nama Kegiatan | Waktu Pelaksanaan | Penanggung Jawab | Anggaran | Indikator Keberhasilan | Sumber Dana |
|----|---------------|-------------------|------------------|----------|------------------------|-------------|
(isi sesuai data kegiatan yang diberikan, lengkapi dengan detail)

D. Jadwal/Timeline Pelaksanaan

Tulis 1-2 paragraf NARASI ANALISIS yang menjelaskan strategi penyusunan jadwal.

Setelah narasi, WAJIB buat TABEL JADWAL dengan format berikut:

JADWAL PELAKSANAAN KEGIATAN SEMESTER 1 (JULI - DESEMBER ${input.tahun_ajaran.split('/')[0]}):

| No | Bulan | Minggu | Kegiatan | Tempat | Keterangan |
|----|-------|--------|----------|--------|------------|
| 1 | Juli | Minggu 2 | Rapat Koordinasi Awal Tahun | SDN Wanayasa 1 | Pembahasan program kerja |
(lanjutkan)

JADWAL PELAKSANAAN KEGIATAN SEMESTER 2 (JANUARI - JUNI ${input.tahun_ajaran.split('/')[1]}):

| No | Bulan | Minggu | Kegiatan | Tempat | Keterangan |
|----|-------|--------|----------|--------|------------|
(isi)

---
BAB V ANGGARAN
---

A. Sumber Dana
(Gunakan penomoran 1, 2, 3)
1. Dana BOS
2. Iuran Anggota
3. Bantuan Pemerintah Daerah
4. Sumber lain yang tidak mengikat

B. Rencana Anggaran Biaya (RAB)
Buat tabel RAB:
[TABEL_RAB]
| No | Uraian Kegiatan | Volume | Satuan | Harga Satuan | Jumlah |
|----|-----------------|--------|--------|--------------|--------|
(isi berdasarkan kegiatan yang ada)

TOTAL ANGGARAN: Rp [jumlah]

---
BAB VI PENUTUP
---

A. Kesimpulan
Tulis 1-2 paragraf kesimpulan program kerja

B. Harapan
Tulis harapan pelaksanaan program kerja

C. Penutup
"Demikian Program Kerja KKG Gugus 3 Kecamatan Wanayasa Tahun Ajaran ${input.tahun_ajaran} ini disusun..."

---
LEMBAR PENGESAHAN
---
(Format tanda tangan sama seperti sebelumnya)

=== INSTRUKSI FORMAT ===
1. Gunakan bahasa Indonesia formal, sopan, dan profesional
2. Setiap BAB diawali dengan judul BAB yang jelas
3. **PENTING: Gunakan HIERARKI PENOMORAN berikut secara KONSISTEN:**
   - BAB: Angka Romawi (BAB I, BAB II, ...)
   - Sub-Bab: Huruf Kapital (A., B., C., ...)
   - Poin Utama: Angka (1., 2., 3., ...)
   - Sub-Poin: Huruf Kecil (a., b., c., ...)
4. **DILARANG KERAS menggunakan bullet points** (seperti -, *, •) untuk poin-poin formal. Selalu ganti dengan huruf (a, b, c).
5. Tabel WAJIB menggunakan format markdown dengan | sebagai pemisah kolom
6. Jaga pemisahan antar BAB agar tidak tercampur. Selesaikan satu BAB secara tuntas sebelum masuk ke BAB berikutnya.
7. JANGAN gunakan simbol markdown seperti ** untuk bold atau * untuk italic di dalam teks dokumen resmi.
8. Gunakan HURUF KAPITAL untuk penekanan Judul.
9. Teks paragraf harus rapi.

=== PERINGATAN PENTING ===
WAJIB menyelesaikan SELURUH dokumen dari BAB I sampai LEMBAR PENGESAHAN!
JANGAN berhenti di tengah jalan!


| No | Bulan | Minggu | Kegiatan | Tempat | Keterangan |
|----|-------|--------|----------|--------|------------|
| 1 | Juli | Minggu 2 | Rapat Koordinasi Awal Tahun | SDN Wanayasa 1 | Pembahasan program kerja |
| 2 | Agustus | Minggu 1 | Workshop Kurikulum Merdeka | SDN Wanayasa 2 | Narasumber dari UPT |
(dan seterusnya sampai bulan Desember)

JADWAL PELAKSANAAN KEGIATAN SEMESTER 2 (JANUARI - JUNI ${input.tahun_ajaran.split('/')[1]}):

| No | Bulan | Minggu | Kegiatan | Tempat | Keterangan |
|----|-------|--------|----------|--------|------------|
| 1 | Januari | Minggu 2 | Pertemuan Rutin | SDN Wanayasa 3 | Evaluasi semester 1 |
(dan seterusnya sampai bulan Juni)

---
BAB IV ANGGARAN
---

A. Sumber Dana
1. Dana BOS
2. Iuran Anggota
3. Bantuan Pemerintah Daerah
4. Sumber lain yang tidak mengikat

B. Rencana Anggaran Biaya (RAB)
Buat tabel RAB:
[TABEL_RAB]
| No | Uraian Kegiatan | Volume | Satuan | Harga Satuan | Jumlah |
|----|-----------------|--------|--------|--------------|--------|
(isi berdasarkan kegiatan yang ada)

TOTAL ANGGARAN: Rp [jumlah]

---
BAB V PENUTUP
---

A. Kesimpulan
Tulis 1-2 paragraf kesimpulan program kerja

B. Harapan
Tulis harapan pelaksanaan program kerja

C. Penutup
"Demikian Program Kerja KKG Gugus 3 Kecamatan Wanayasa Tahun Ajaran ${input.tahun_ajaran} ini disusun sebagai pedoman pelaksanaan kegiatan. Semoga dapat dilaksanakan dengan baik dan memberikan manfaat bagi peningkatan mutu pendidikan."

---
LEMBAR PENGESAHAN
---
Tulis format lembar pengesahan dengan 3 kolom tanda tangan:

                              Disahkan di: Wanayasa
                              Pada tanggal: [tanggal hari ini]

Mengetahui,
Kepala UPT Pendidikan          Pengawas Sekolah              Ketua KKG Gugus 3
Kec. Wanayasa



_____________________          _____________________          _____________________
NIP.                           NIP.                           NIP.

=== INSTRUKSI FORMAT ===
1. Gunakan bahasa Indonesia formal, sopan, dan profesional
2. Setiap BAB diawali dengan judul BAB yang jelas
3. Gunakan penomoran yang konsisten (A, B, C untuk sub-bab; 1, 2, 3 untuk poin)
4. Tabel WAJIB menggunakan format markdown dengan | sebagai pemisah kolom
5. Pastikan setiap kegiatan memiliki indikator keberhasilan yang SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
6. Nominal anggaran harus realistis untuk kegiatan KKG
7. Dokumen harus siap cetak dan profesional
8. JANGAN gunakan simbol markdown seperti ** untuk bold atau * untuk italic
9. JANGAN gunakan simbol # untuk heading
10. Tulis teks biasa tanpa formatting markdown kecuali untuk tabel
11. Untuk penekanan, gunakan HURUF KAPITAL bukan simbol

=== PERINGATAN PENTING ===
WAJIB menyelesaikan SELURUH dokumen dari awal sampai akhir!
Dokumen HARUS mencakup:
- BAB I PENDAHULUAN (lengkap dengan Latar Belakang, Dasar Hukum, Tujuan, Sasaran)
- BAB II PROFIL KKG (lengkap dengan Identitas, Struktur, Daftar Sekolah)
- BAB III PROGRAM KEGIATAN (lengkap dengan Tabel Kegiatan dan Timeline)
- BAB IV ANGGARAN (lengkap dengan Sumber Dana dan Tabel RAB)
- BAB V PENUTUP (lengkap dengan Kesimpulan, Harapan, dan Penutup)
- LEMBAR PENGESAHAN (dengan 3 kolom tanda tangan)

JANGAN berhenti sebelum BAB V dan LEMBAR PENGESAHAN selesai ditulis!`;
}

export function buildLaporanPrompt(input: {
  judul_laporan: string;
  periode: string;
  program_kerja_judul?: string;
  settings?: any;
}): string {
  const s = input.settings || {};

  return `Anda adalah sekretaris profesional KKG (Kelompok Kerja Guru). Buatlah draf LAPORAN KEGIATAN KKG yang LENGKAP dan FORMAL berdasarkan data berikut:

JUDUL KEGIATAN: ${input.judul_laporan}
PERIODE: ${input.periode}
${input.program_kerja_judul ? `DASAR PROGRAM: ${input.program_kerja_judul}` : ''}

Ketua KKG: ${s.nama_ketua || '...'}
NIP Ketua: ${s.nip_ketua || '...'}

=== INSTRUKSI STRUKTUR ===

Buat dokumen dengan 4 BAB utama secara berurutan. PAHAMI INI: Output Anda akan dipotong-potong oleh sistem berdasarkan judul sub-bab (contoh: "A. Latar Belakang").
JADI, ANDA WAJIB MENULIS JUDUL SUB-BAB PERSIS SEPERTI DI BAWAH INI (HURUF KAPITAL DI AWAL KATA):

BAB I: PENDAHULUAN
A. Latar Belakang
(Tulis 2-3 paragraf latar belakang yang relevan dengan judul kegiatan)
B. Tujuan
(Sebutkan minimal 3 tujuan)
C. Manfaat
(Jelaskan manfaat bagi peserta dan siswa)

BAB II: PELAKSANAAN KEGIATAN
A. Waktu dan Tempat
(Sebutkan waktu dan tempat pelaksanaan)
B. Materi Kegiatan
(Jelaskan inti materi yang disampaikan)
C. Narasumber dan Peserta
(Sebutkan siapa narasumber dan pesertanya)

BAB III: HASIL KEGIATAN
A. Uraian Jalannya Kegiatan
(Ceritakan alur kegiatan dari awal sampai akhir secara naratif)
B. Tindak Lanjut
(Rencana implementasi hasil kegiatan)
C. Dampak
(Dampak positif yang diharapkan)

BAB IV: PENUTUP
A. Simpulan
(Kesimpulan singkat)
B. Saran
(Masukan untuk kegiatan selanjutnya)

=== PENTING ===
1. JANGAN gunakan format Markdown (**bold**, *italic*, # heading). GUNAKAN TEKS BIASA.
2. Tulis JUDUL BAB dengan HURUF KAPITAL SEMUA.
3. Tulis JUDUL SUB-BAB persis seperti contoh (Huruf Kapital di Awal Kata). Sistem akan error jika Anda menulis "1. Latar Belakang" atau "a. Latar belakang". HARUS "A. Latar Belakang".
4. Selesaikan seluruh BAB. Jangan berhenti di tengah jalan.
`;
}
