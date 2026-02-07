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
          content: `Anda adalah asisten ahli administrasi pendidikan Indonesia yang sangat berpengalaman dalam menyusun dokumen resmi untuk Kelompok Kerja Guru (KKG). Anda memahami format surat dinas pendidikan Indonesia, tata bahasa Indonesia yang baik dan benar, serta pedoman-pedoman dari Kementerian Pendidikan dan Kebudayaan. Selalu gunakan bahasa Indonesia yang formal, sopan, dan profesional.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4096,
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
1. Gunakan format surat dinas pendidikan Indonesia yang benar dan lengkap
2. Sertakan kop surat KKG Gugus 3 Kecamatan Wanayasa Kabupaten Purwakarta
3. Gunakan bahasa Indonesia formal, sopan, dan profesional
4. Sertakan:
   - Kop surat (PEMERINTAH KABUPATEN PURWAKARTA, DINAS PENDIDIKAN, KKG GUGUS 3 KECAMATAN WANAYASA)
   - Nomor surat
   - Lampiran (jika ada)
   - Perihal
   - Tanggal surat (hari ini atau sesuai konteks)
   - Alamat tujuan
   - Salam pembuka
   - Isi surat yang jelas dan lengkap
   - Salam penutup
   - Tanda tangan (Ketua KKG Gugus 3 Wanayasa)
5. Format output dalam teks biasa yang rapi (bukan HTML/markdown)`;
}

export function buildProkerPrompt(input: {
  tahun_ajaran: string;
  visi: string;
  misi: string;
  kegiatan: string;
  analisis_kebutuhan?: string;
}): string {
  return `Susun Program Kerja Tahunan KKG Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta untuk Tahun Ajaran ${input.tahun_ajaran} dengan detail berikut:

VISI:
${input.visi}

MISI:
${input.misi}

DAFTAR KEGIATAN/PROGRAM:
${input.kegiatan}

${input.analisis_kebutuhan ? `ANALISIS KEBUTUHAN:\n${input.analisis_kebutuhan}` : ''}

INSTRUKSI PENTING:
1. Gunakan bahasa Indonesia formal sesuai pedoman Kementerian Pendidikan dan Kebudayaan
2. Susun dokumen dengan struktur lengkap:
   - HALAMAN JUDUL (Program Kerja KKG Gugus 3 Kecamatan Wanayasa)
   - BAB I: PENDAHULUAN (Latar Belakang, Dasar Hukum, Tujuan, Sasaran)
   - BAB II: ANALISIS SITUASI (Kondisi Saat Ini, Analisis SWOT singkat)
   - BAB III: PROGRAM KEGIATAN (Tabel program kerja lengkap dengan waktu, PJ, anggaran, indikator)
   - BAB IV: PENUTUP (Kesimpulan, Harapan)
   - LAMPIRAN (jika diperlukan)
3. Setiap kegiatan harus memiliki indikator keberhasilan yang terukur
4. Sertakan timeline/jadwal pelaksanaan
5. Format output dalam teks biasa yang rapi dan terstruktur
6. Pastikan dokumen profesional dan siap digunakan`;
}
