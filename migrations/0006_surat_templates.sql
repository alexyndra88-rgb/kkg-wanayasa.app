-- Migration: Add surat_templates table for letter templates
-- Templates can be managed by admin and used when generating letters

CREATE TABLE IF NOT EXISTS surat_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    jenis TEXT NOT NULL CHECK(jenis IN ('undangan', 'tugas', 'keterangan', 'edaran', 'permohonan', 'lainnya')),
    deskripsi TEXT,
    konten TEXT NOT NULL,
    -- Template variables like {{perihal}}, {{tanggal}}, {{tempat}}
    variables TEXT, -- JSON array of variable names
    is_active INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_templates_jenis ON surat_templates(jenis);
CREATE INDEX IF NOT EXISTS idx_templates_active ON surat_templates(is_active);

-- Insert default templates
INSERT INTO surat_templates (nama, jenis, deskripsi, konten, variables, is_active, created_by) VALUES
(
    'Undangan Rapat Rutin',
    'undangan',
    'Template undangan untuk rapat rutin bulanan KKG',
    'Dengan hormat,

Sehubungan dengan agenda kegiatan Kelompok Kerja Guru (KKG) Gugus 3 Kecamatan Wanayasa, kami mengundang Bapak/Ibu Guru untuk hadir pada:

Hari/Tanggal : {{tanggal}}
Waktu        : {{waktu}}
Tempat       : {{tempat}}
Acara        : {{acara}}

Mengingat pentingnya acara ini, kami mohon kehadiran Bapak/Ibu tepat pada waktunya.

Demikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.',
    '["tanggal", "waktu", "tempat", "acara"]',
    1,
    1
),
(
    'Surat Tugas Kegiatan',
    'tugas',
    'Template surat tugas untuk menugaskan guru dalam kegiatan',
    'Yang bertanda tangan di bawah ini, Ketua KKG Gugus 3 Kecamatan Wanayasa, dengan ini menugaskan kepada:

Nama          : {{nama_guru}}
NIP           : {{nip}}
Jabatan       : {{jabatan}}
Unit Kerja    : {{unit_kerja}}

Untuk melaksanakan tugas sebagai {{tugas}} dalam kegiatan {{nama_kegiatan}} yang akan dilaksanakan pada:

Hari/Tanggal : {{tanggal}}
Tempat       : {{tempat}}

Demikian surat tugas ini dibuat untuk dapat dipergunakan sebagaimana mestinya.',
    '["nama_guru", "nip", "jabatan", "unit_kerja", "tugas", "nama_kegiatan", "tanggal", "tempat"]',
    1,
    1
),
(
    'Surat Keterangan Aktif',
    'keterangan',
    'Template surat keterangan keaktifan anggota KKG',
    'Yang bertanda tangan di bawah ini, Ketua KKG Gugus 3 Kecamatan Wanayasa, menerangkan bahwa:

Nama          : {{nama_guru}}
NIP           : {{nip}}
Pangkat/Gol.  : {{pangkat}}
Jabatan       : {{jabatan}}
Unit Kerja    : {{unit_kerja}}

Adalah benar-benar anggota aktif Kelompok Kerja Guru (KKG) Gugus 3 Kecamatan Wanayasa dan telah mengikuti kegiatan-kegiatan yang diselenggarakan oleh KKG.

Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.',
    '["nama_guru", "nip", "pangkat", "jabatan", "unit_kerja"]',
    1,
    1
),
(
    'Surat Edaran',
    'edaran',
    'Template surat edaran untuk pemberitahuan umum',
    'Kepada Yth.
{{tujuan}}
di Tempat

Dengan hormat,

{{isi_edaran}}

Demikian surat edaran ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.',
    '["tujuan", "isi_edaran"]',
    1,
    1
),
(
    'Surat Permohonan Narasumber',
    'permohonan',
    'Template surat permohonan narasumber untuk kegiatan',
    'Kepada Yth.
{{nama_tujuan}}
{{jabatan_tujuan}}
di {{alamat_tujuan}}

Dengan hormat,

Sehubungan dengan akan dilaksanakannya kegiatan {{nama_kegiatan}} oleh KKG Gugus 3 Kecamatan Wanayasa, dengan ini kami mohon kesediaan Bapak/Ibu untuk menjadi narasumber dalam kegiatan tersebut dengan rincian sebagai berikut:

Hari/Tanggal : {{tanggal}}
Waktu        : {{waktu}}
Tempat       : {{tempat}}
Materi       : {{materi}}

Besar harapan kami atas kesediaan Bapak/Ibu untuk menjadi narasumber. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.',
    '["nama_tujuan", "jabatan_tujuan", "alamat_tujuan", "nama_kegiatan", "tanggal", "waktu", "tempat", "materi"]',
    1,
    1
);
