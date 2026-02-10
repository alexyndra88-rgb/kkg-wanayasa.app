// TypeScript Type Definitions for KKG Portal
// Centralized types for all entities

// ============== User & Auth ==============

export interface User {
    id: number;
    nama: string;
    email: string;
    role: 'admin' | 'user';
    nip?: string;
    nik?: string;
    mata_pelajaran?: string;
    sekolah?: string;
    no_hp?: string;
    alamat?: string;
    foto_url?: string;
    created_at: string;
    updated_at: string;
}

export interface UserPublic {
    id: number;
    nama: string;
    email: string;
    role: 'admin' | 'user';
    sekolah?: string;
    foto_url?: string;
}

export interface Session {
    id: string;
    user_id: number;
    expires_at: string;
    created_at: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    nama: string;
    email: string;
    password: string;
    nip?: string;
    sekolah?: string;
    mata_pelajaran?: string;
    no_hp?: string;
}

export interface AuthResponse {
    success: boolean;
    user: UserPublic;
}

// ============== Surat Undangan ==============

export interface SuratUndangan {
    id: number;
    user_id: number;
    nomor_surat?: string;
    jenis_kegiatan: string;
    tanggal_kegiatan: string;
    waktu_kegiatan: string;
    tempat_kegiatan: string;
    agenda: string;
    peserta?: string; // JSON array
    penutup?: string;
    penanggung_jawab?: string;
    isi_surat?: string;
    status: 'draft' | 'final';
    created_at: string;
    updated_at: string;
}

export interface GenerateSuratRequest {
    jenis_kegiatan: string;
    tanggal_kegiatan: string;
    waktu_kegiatan: string;
    tempat_kegiatan: string;
    agenda: string;
    peserta?: string[];
    penanggung_jawab?: string;
}

// ============== Program Kerja ==============

export interface ProgramKerja {
    id: number;
    user_id: number;
    tahun_ajaran: string;
    visi?: string;
    misi?: string;
    kegiatan?: string; // JSON array
    analisis_kebutuhan?: string;
    isi_dokumen?: string;
    status: 'draft' | 'final';
    created_at: string;
    updated_at: string;
}

export interface KegiatanProker {
    nama_kegiatan: string;
    waktu_pelaksanaan: string;
    penanggung_jawab: string;
    anggaran: string;
    indikator: string;
    sumber_dana?: string;
}

export interface GenerateProkerRequest {
    tahun_ajaran: string;
    visi: string;
    misi: string;
    kegiatan: KegiatanProker[];
    analisis_kebutuhan?: string;
}

// ============== Laporan Kegiatan (New) ==============

export interface LaporanData {
    id?: number;
    user_id: number;
    program_kerja_id?: number;
    judul_laporan: string;
    periode: string;

    // BAB I: Pendahuluan
    pendahuluan_latar_belakang: string;
    pendahuluan_tujuan: string;
    pendahuluan_manfaat: string;

    // BAB II: Pelaksanaan Kegiatan
    pelaksanaan_waktu_tempat: string;
    pelaksanaan_materi: string;
    pelaksanaan_peserta: string;

    // BAB III: Hasil Kegiatan
    hasil_uraian: string;
    hasil_tindak_lanjut: string;
    hasil_dampak: string;

    // BAB IV: Penutup
    penutup_simpulan: string;
    penutup_saran: string;

    // Lampiran
    lampiran_foto: string[]; // URLs
    lampiran_daftar_hadir?: string; // URL

    status: 'draft' | 'final';
    created_at?: string;
    updated_at?: string;
}

// ============== Kegiatan & Absensi ==============

export interface Kegiatan {
    id: number;
    nama_kegiatan: string;
    tanggal: string;
    waktu_mulai?: string;
    waktu_selesai?: string;
    tempat?: string;
    deskripsi?: string;
    created_by?: number;
    created_at: string;
}

export interface Absensi {
    id: number;
    kegiatan_id: number;
    user_id: number;
    waktu_checkin: string;
    keterangan?: string;
}

export interface AbsensiWithUser extends Absensi {
    nama: string;
    nip?: string;
    sekolah?: string;
}

export interface CreateKegiatanRequest {
    nama_kegiatan: string;
    tanggal: string;
    waktu_mulai?: string;
    waktu_selesai?: string;
    tempat?: string;
    deskripsi?: string;
}

// ============== Materi ==============

export interface Materi {
    id: number;
    judul: string;
    deskripsi?: string;
    kategori?: string;
    jenjang?: 'SD' | 'SMP' | 'SMA';
    jenis?: 'RPP' | 'Modul' | 'Silabus' | 'Media Ajar' | 'Soal' | 'Lainnya';
    file_url?: string;
    file_name?: string;
    file_size?: number;
    uploaded_by: number;
    download_count: number;
    created_at: string;
}

export interface MateriWithUploader extends Materi {
    uploader_name: string;
}

export interface CreateMateriRequest {
    judul: string;
    deskripsi?: string;
    kategori?: string;
    jenjang?: string;
    jenis?: string;
    file_url?: string;
}

// ============== Pengumuman ==============

export interface Pengumuman {
    id: number;
    judul: string;
    isi: string;
    kategori: 'umum' | 'jadwal' | 'kegiatan' | 'penting';
    is_pinned: boolean;
    created_by: number;
    created_at: string;
    updated_at: string;
}

export interface PengumumanWithAuthor extends Pengumuman {
    author_name: string;
}

export interface CreatePengumumanRequest {
    judul: string;
    isi: string;
    kategori?: string;
    is_pinned?: boolean;
}

// ============== Forum ==============

export interface ForumThread {
    id: number;
    judul: string;
    isi: string;
    kategori?: 'umum' | 'best-practice' | 'kurikulum' | 'teknologi' | 'tanya-jawab';
    user_id: number;
    is_pinned: boolean;
    reply_count: number;
    created_at: string;
    updated_at: string;
}

export interface ForumThreadWithAuthor extends ForumThread {
    author_name: string;
}

export interface ForumReply {
    id: number;
    thread_id: number;
    user_id: number;
    isi: string;
    created_at: string;
}

export interface ForumReplyWithAuthor extends ForumReply {
    author_name: string;
}

export interface CreateThreadRequest {
    judul: string;
    isi: string;
    kategori?: string;
}

export interface CreateReplyRequest {
    isi: string;
}

// ============== Settings ==============

export interface Settings {
    mistral_api_key?: string;
    nama_ketua?: string;
    tahun_ajaran?: string;
    alamat_sekretariat?: string;
}

// ============== Admin Dashboard ==============

export interface DashboardStats {
    total_guru: number;
    total_surat: number;
    total_proker: number;
    total_kegiatan: number;
    total_materi?: number;
    total_pengumuman?: number;
    total_threads?: number;
}

// ============== Pagination ==============

export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}
