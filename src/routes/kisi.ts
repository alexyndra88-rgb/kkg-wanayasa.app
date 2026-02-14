import { Hono } from 'hono';
import { AIService, AIProvider } from '../services/ai';
import { successResponse, Errors } from '../lib/response';

const kisi = new Hono<{ Bindings: any }>();

// Generate Asesmen (Soal) via AI
kisi.post('/generate', async (c) => {
    try {
        const body = await c.req.json();
        const {
            namaSekolah, namaGuru, nipGuru, mataPelajaran, topik,
            jenjangKelas, semester, jenisUjian, capaianPembelajaran,
            jumlahPG, jumlahIsian, jumlahUraian,
            hotsRatio, isianType, aiProvider
        } = body;

        const ai = new AIService(c.env);

        // Inject Mistral key from admin settings (DB) with fallback
        const DEFAULT_MISTRAL_KEY = 'iPwqC0IHLnwajvYAP7bU8OX1PlDPIy7g';
        const mistralSetting: any = await c.env.DB.prepare(
            "SELECT value FROM settings WHERE key = 'mistral_api_key'"
        ).first();
        const mistralKey = mistralSetting?.value || DEFAULT_MISTRAL_KEY;
        ai.addKey('mistral', mistralKey);
        const totalPG = parseInt(jumlahPG) || 0;
        const totalIsian = parseInt(jumlahIsian) || 0;
        const totalUraian = parseInt(jumlahUraian) || 0;
        const finalData: any = { pg: [], isian: null, uraian: [] };

        const buildPrompt = (type: string, startNo: number, count: number, totalPrevPG = 0) => {
            const isPG = type === 'pg';
            const jsonStructure = isPG ?
                `"pg": [ { "no": ${startNo}, "soal": "Pertanyaan Pilihan Ganda", "opsi": { "A": "...", "B": "...", "C": "...", "D": "..." }, "kunci": "A/B/C/D", "level": "LOTS/MOTS/HOTS" } ]` :
                `"isian": {
                    "type": "${isianType || 'Standard'}",
                    "data": [ { "no": ${totalPrevPG + 1}, "soal": "...", "kunci": "..." } ]
                 },
                 "uraian": [ { "no": ${totalPrevPG + (totalIsian || 0) + 1}, "soal": "...", "kunci": "...", "rubrik_skor": {} } ]`;

            return `
                Bertindaklah sebagai Profesor dan Pakar Penilaian Pendidikan Kurikulum Merdeka.
                I. LANDASAN FILOSOFIS & ATURAN:
                1. CP: ${capaianPembelajaran || 'Generasi Otomatis sesuai topik'}
                2. LEVEL KOGNITIF (WAJIB PATUH RASIO):
                   - LOTS (Knowing/Applying): Soal pemahaman dasar & hapalan.
                   - MOTS (Reasoning/Connecting): Soal logika, menghubungkan konsep.
                   - HOTS (Analyzing/Creating): Soal analisis tinggi, evaluasi, dan kreasi.
                3. RASIO TARGET: ${hotsRatio || '30:40:30'} (LOTS : MOTS : HOTS).
                4. TUGAS ANDA: ${isPG
                    ? `Generate HANYA ${count} soal PG (No. ${startNo} s.d. ${startNo + count - 1}).`
                    : type === 'isian'
                        ? `Generate HANYA ${totalIsian} soal ISIAN (No. ${startNo} s.d. ${startNo + totalIsian - 1}).`
                        : `Generate HANYA ${totalUraian} soal URAIAN (No. ${startNo} s.d. ${startNo + totalUraian - 1}).`
                }.
                5. DISTRIBUSI KUNCI JAWABAN: Distribusikan kunci jawaban secara ACAK dan MERATA (A, B, C, D).
                6. LARANGAN: JANGAN MENULISKAN label "LOTS", "MOTS", atau "HOTS" di dalam teks soal.

                II. FORMAT OUTPUT JSON:
                {
                   ${jsonStructure}
                }
                IV. KONTEKS DATA:
                - Mapel: ${mataPelajaran}, Topik: ${topik}, Kelas: ${jenjangKelas}
                
                Berikan output JSON valid saja tanpa teks lain.
            `;
        };

        // Generate PG
        if (totalPG > 0) {
            const BATCH_SIZE = 20;
            for (let i = 0; i < totalPG; i += BATCH_SIZE) {
                const currentCount = Math.min(BATCH_SIZE, totalPG - i);
                const prompt = buildPrompt('pg', i + 1, currentCount);
                const result = await ai.generateJSON(prompt, (aiProvider as AIProvider) || 'mistral');
                if (result?.pg && Array.isArray(result.pg)) {
                    finalData.pg.push(...result.pg);
                }
            }
        }

        // Generate Isian + Uraian
        if (totalIsian > 0 || totalUraian > 0) {
            const startNoIsian = totalPG + 1;
            const prompt = buildPrompt('isian', startNoIsian, totalIsian, totalPG);
            const result = await ai.generateJSON(prompt, (aiProvider as AIProvider) || 'mistral');

            if (result?.isian) {
                finalData.isian = result.isian;
                finalData.isian.type = isianType || 'Standard';
            }
            if (result?.uraian) {
                finalData.uraian = result.uraian;
            }
        }

        return successResponse(c, finalData);

    } catch (e: any) {
        console.error('Asesmen Gen Error:', e);
        return Errors.internal(c, e.message);
    }
});

export default kisi;
