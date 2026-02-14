import { Hono } from 'hono';
import { AIService, AIProvider } from '../services/ai';
import { successResponse, Errors } from '../lib/response';

const rpp = new Hono<{ Bindings: any }>();

// Generate RPP
rpp.post('/generate', async (c) => {
  try {
    const body = await c.req.json();
    const {
      namaSekolah, namaKepalaSekolah, nipKepalaSekolah,
      namaGuru, nipGuru, mataPelajaran, topik, jenjangKelas,
      semester, alokasiWaktu, strategi, jumlahPertemuan,
      profilLulusan, capaianPembelajaran, lampirkanLKPD, aiProvider
    } = body;

    const ai = new AIService(c.env);

    // Inject Mistral key from admin settings (DB) with fallback
    const DEFAULT_MISTRAL_KEY = 'iPwqC0IHLnwajvYAP7bU8OX1PlDPIy7g';
    const mistralSetting: any = await c.env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'mistral_api_key'"
    ).first();
    const mistralKey = mistralSetting?.value || DEFAULT_MISTRAL_KEY;
    ai.addKey('mistral', mistralKey);

    // Time distribution logic
    const totalMinutes = (() => {
      const timeStr = alokasiWaktu || '';
      const match = timeStr.match(/(\d+)\s*[xX]\s*(\d+)/);
      if (match) return parseInt(match[1]) * parseInt(match[2]);
      return parseInt(timeStr.replace(/\D/g, '')) || 70;
    })();

    const breakdown = {
      pendahuluan: Math.round(totalMinutes * (5 / 70)),
      mindful: Math.round(totalMinutes * (15 / 70)),
      meaningful: Math.round(totalMinutes * (30 / 70)),
      joyful: Math.round(totalMinutes * (15 / 70)),
      penutup: Math.round(totalMinutes * (5 / 70))
    };
    const currentSum = Object.values(breakdown).reduce((a, b) => a + b, 0);
    breakdown.meaningful += (totalMinutes - currentSum);

    const timeDist = {
      pen: `${breakdown.pendahuluan} Menit`,
      min: `${breakdown.mindful} Menit`,
      mea: `${breakdown.meaningful} Menit`,
      joy: `${breakdown.joyful} Menit`,
      clo: `${breakdown.penutup} Menit`
    };

    const userCP = capaianPembelajaran
      ? `Gunakan Capaian Pembelajaran berikut sebagai acuan: ${capaianPembelajaran}`
      : "Cari CP yang relevan secara otomatis.";

    const profileDimensions = Array.isArray(profilLulusan) ? profilLulusan.join(', ') : (profilLulusan || '');

    const prompt = `
      Bertindaklah sebagai ahli kurikulum Deep Learning & Understanding by Design (UbD).
      Tugas Anda adalah menyusun RPP (Rencana Pelaksanaan Pembelajaran) yang SANGAT MENDALAM, NARATIF, dan REFLEKTIF.
      
      JANGAN PERNAH membuat ringkasan. Konten harus "siap ajar" dan sangat detail (scripted lesson plan).

      DATA SEKOLAH:
      Sekolah: ${namaSekolah}
      Kepala Sekolah: ${namaKepalaSekolah || '-'}
      NIP KS: ${nipKepalaSekolah || '-'}
      Guru: ${namaGuru}
      NIP Guru: ${nipGuru || '-'}
      Mapel: ${mataPelajaran}
      Topik: ${topik}
      Kelas: ${jenjangKelas}
      Semester: ${semester}
      Strategi: ${strategi}
      Alokasi: ${alokasiWaktu}
      Jumlah Pertemuan: ${jumlahPertemuan}

      BAGIAN 1: IDENTIFIKASI (WAJIB NARATIF PANJANG)
      - Analisis kesiapan belajar siswa: Tulis minimal 150 kata tentang level kognitif siswa, miskonsepsi, dan prasyarat pengetahuan.
      - Karakteristik gaya belajar: Tulis minimal 100 kata tentang sebaran gaya belajar (visual/auditori/kinestetik).
      - Kebutuhan khusus: Jelaskan kebutuhan emosional atau dukungan khusus yang relevan dengan topik ${topik}.

      BAGIAN 2: DESAIN PEMBELAJARAN
      - ${userCP}
      - Deskripsi Strategi: Jelaskan bagaimana ${strategi} akan diterapkan langkah demi langkah.
      - Profil Lulusan: ${profileDimensions}. Jelaskan bagaimana dimensi ini akan dilatih.
      - Diferensiasi: Visual (media spesifik), Auditori (diskusi), Kinestetik (aktivitas fisik).
      - Tujuan Pembelajaran (TP): Minimal 3 TP per pertemuan (1 LOTS, 2 HOTS) menggunakan KKO terukur.

      BAGIAN 3: SKENARIO PEMBELAJARAN (INTI)
      Untuk SETIAP PERTEMUAN, buat skenario naratif sangat detail:

      1. PENDAHULUAN (Minimal 100 kata): Sapaan, doa, absensi, ice breaking, apersepsi, penyampaian tujuan.
      2. MINDFUL (BERKESADARAN - Minimal 150 kata): Guru mengajak siswa hadir utuh (mindfulness), observasi, dialog spesifik.
      3. MEANINGFUL (BERMAKNA - Minimal 200 kata): Inti materi, konstruksi pemahaman, kolaborasi, "aha moment".
      4. JOYFUL (MENGGEMBIRAKAN - Minimal 150 kata): Perayaan pemahaman, game, kuis, refleksi menyenangkan.
      5. PENUTUP (Minimal 100 kata): Kesimpulan bersama, refleksi, tindak lanjut, doa.

      ATURAN KERAS:
      1. FORMAT STEP-BY-STEP: WAJIB memecah narasi menjadi poin-poin daftar kegiatan diawali "- ".
      2. KUALITAS PER POIN: Setiap poin strip minimal 2-3 kalimat per poin.
      3. KONSISTENSI: Semua pertemuan HARUS sama detailnya.
      4. ANTI-DUPLIKASI: JANGAN mengulang aktivitas atau pertanyaan yang sama di fase berbeda.
      5. ALOKASI WAKTU: Pendahuluan=${timeDist.pen}, Mindful=${timeDist.min}, Meaningful=${timeDist.mea}, Joyful=${timeDist.joy}, Penutup=${timeDist.clo}. Total = ${totalMinutes} Menit.

      ${lampirkanLKPD === 'Ya' ? 'WAJIB GENERATE LKPD LENGKAP untuk setiap pertemuan.' : ''}

      Struktur JSON Output (Wajib Valid JSON):
      {
        "identifikasi": {
          "kesiapan": "Analisis kesiapan...",
          "karakteristik": "Karakteristik gaya belajar...",
          "kebutuhan": "Kebutuhan utama siswa..."
        },
        "desain": {
          "capaian": "Capaian Pembelajaran...",
          "metode_relevan": "Daftar metode...",
          "metode_pembelajaran": "Detail metode...",
          "sarana_prasarana": { "sumber_belajar": "...", "media": "...", "alat_peraga": "..." },
          "diferensiasi": { "visual": "...", "auditori": "...", "kinestetik": "..." }
        },
        "pertemuan": [
          {
            "nomor": 1,
            "tujuan_pertemuan": ["TP 1 (LOTS)", "TP 2 (HOTS)", "TP 3 (HOTS)"],
            "kegiatan": {
              "pendahuluan": { "isi": "Narasi panjang pendahuluan...", "waktu": "${timeDist.pen}" },
              "mindful": { "isi": "Narasi panjang mindful...", "waktu": "${timeDist.min}" },
              "meaningful": { "isi": "Narasi panjang meaningful...", "waktu": "${timeDist.mea}" },
              "joyful": { "isi": "Narasi panjang joyful...", "waktu": "${timeDist.joy}" },
              "penutup": { "isi": "Narasi panjang penutup...", "waktu": "${timeDist.clo}" }
            }${lampirkanLKPD === 'Ya' ? `,
            "lkpd": {
              "identitas_petunjuk": "Langkah-langkah pengerjaan...",
              "tujuan_siswa": "Tujuan dengan bahasa sederhana...",
              "masalah": "Kasus/masalah untuk didiskusikan...",
              "aktivitas": "Instruksi kerja siswa...",
              "hasil_kerja": "Format pengisian jawaban...",
              "penilaian": "Minimal 5 soal latihan..."
            }` : ''}
          }
        ],
        "asesmen": { "formatif": "...", "sumatif": "..." }
      }
      Pastikan output adalah JSON yang valid saja tanpa teks lain.
    `;

    const result = await ai.generateJSON(prompt, aiProvider as AIProvider || 'mistral');

    // Remove LKPD if user selected 'Tidak'
    if (lampirkanLKPD !== 'Ya' && result?.pertemuan) {
      result.pertemuan.forEach((p: any) => delete p.lkpd);
    }

    return successResponse(c, result);
  } catch (e: any) {
    console.error('RPP Gen Error:', e);
    return Errors.internal(c, e.message);
  }
});

// Save RPP
rpp.post('/save', async (c) => {
  try {
    const body = await c.req.json();
    const user: any = c.get('user' as any);
    const {
      mataPelajaran, topik, jenjangKelas, semester, alokasiWaktu, strategi,
      content, inputData
    } = body;

    const result = await c.env.DB.prepare(`
      INSERT INTO rpp_history (
        user_id, mata_pelajaran, topik, jenjang_kelas, semester, alokasi_waktu, strategi,
        content_json, input_data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `).bind(
      user?.id || 1,
      mataPelajaran, topik, jenjangKelas, semester, alokasiWaktu, strategi,
      JSON.stringify(content), JSON.stringify(inputData)
    ).run();

    return successResponse(c, { id: result.results[0].id }, 'RPP saved successfully');
  } catch (e: any) {
    return Errors.internal(c, e.message);
  }
});

// Get History
rpp.get('/history', async (c) => {
  try {
    const user: any = c.get('user' as any);
    const result = await c.env.DB.prepare(`
      SELECT id, mata_pelajaran, topik, jenjang_kelas, created_at 
      FROM rpp_history 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).bind(user?.id || 1).all();
    return successResponse(c, result.results);
  } catch (e: any) {
    return Errors.internal(c, e.message);
  }
});

// Get Detail
rpp.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare(`SELECT * FROM rpp_history WHERE id = ?`).bind(id).first();
    if (!result) return Errors.notFound(c, 'RPP not found');
    result.content_json = JSON.parse(result.content_json as string);
    result.input_data_json = JSON.parse(result.input_data_json as string);
    return successResponse(c, result);
  } catch (e: any) {
    return Errors.internal(c, e.message);
  }
});

export default rpp;
