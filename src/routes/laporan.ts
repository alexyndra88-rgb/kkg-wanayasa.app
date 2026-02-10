
import { Hono } from 'hono';
import { LaporanData } from '../types';

type Bindings = {
    DB: D1Database;
};

import { callMistral, buildLaporanPrompt } from '../lib/mistral';
import { generateLaporanBuffer } from '../lib/docx-generator';

const laporan = new Hono<{ Bindings: Bindings }>();

// POST /api/laporan/generate-content - Generate AI Content for Laporan
laporan.post('/generate-content', async (c) => {
    try {
        const body = await c.req.json();
        const { judul_laporan, periode, program_kerja_judul } = body;

        // Get API key from settings
        const { value: apiKey } = await c.env.DB.prepare(
            "SELECT value FROM settings WHERE key = 'mistral_api_key'"
        ).first() || { value: '' };

        if (!apiKey) {
            return c.json({ success: false, error: 'API Key Mistral belum dikonfigurasi.' }, 400);
        }

        // Get Settings (Chairman Name, NIP, etc.)
        const { results: settingsRows } = await c.env.DB.prepare(
            "SELECT key, value FROM settings"
        ).all();
        const settings = settingsRows.reduce((acc: any, row: any) => {
            acc[row.key] = row.value;
            return acc;
        }, {});

        const prompt = buildLaporanPrompt({
            judul_laporan,
            periode,
            program_kerja_judul,
            settings
        });

        const generatedText = await callMistral(apiKey as string, prompt);
        console.log('--- RAW AI RESPONSE START ---');
        console.log(generatedText);
        console.log('--- RAW AI RESPONSE END ---');

        // DEBUG: Save raw response to audit_logs
        await c.env.DB.prepare(
            "INSERT INTO audit_logs (user_id, action, details) VALUES (NULL, 'AI_DEBUG_SUCCESS', ?)"
        ).bind(JSON.stringify({ raw: generatedText.substring(0, 5000) })).run().catch((err: any) => console.error('Log error', err));

        // Helper to extract text between markers safely
        const extract = (startMarker: string, endMarker: string | null = null): string => {
            try {
                const s = generatedText.indexOf(startMarker);
                if (s === -1) {
                    console.log(`Marker not found: ${startMarker}`);
                    return '';
                }

                const contentStart = s + startMarker.length;
                let contentEnd = generatedText.length;

                if (endMarker) {
                    const e = generatedText.indexOf(endMarker, contentStart);
                    if (e !== -1) {
                        contentEnd = e;
                    } else {
                        console.log(`End marker not found for ${startMarker}: ${endMarker}`);
                    }
                }

                return generatedText.substring(contentStart, contentEnd).trim();
            } catch (e) {
                console.error(`Error extracting content for marker ${startMarker}:`, e);
                return '';
            }
        };

        // Parse sections robustly
        const pendahuluan_latar_belakang = extract('A. Latar Belakang', 'B. Tujuan');
        const pendahuluan_tujuan = extract('B. Tujuan', 'C. Manfaat');
        const pendahuluan_manfaat = extract('C. Manfaat', 'BAB II: PELAKSANAAN KEGIATAN');

        const pelaksanaan_waktu_tempat = extract('A. Waktu dan Tempat', 'B. Materi Kegiatan');
        const pelaksanaan_materi = extract('B. Materi Kegiatan', 'C. Narasumber dan Peserta');
        const pelaksanaan_peserta = extract('C. Narasumber dan Peserta', 'BAB III: HASIL KEGIATAN');

        const hasil_uraian = extract('A. Uraian Jalannya Kegiatan', 'B. Tindak Lanjut');
        const hasil_tindak_lanjut = extract('B. Tindak Lanjut', 'C. Dampak');
        const hasil_dampak = extract('C. Dampak', 'BAB IV: PENUTUP');

        const penutup_simpulan = extract('A. Simpulan', 'B. Saran');
        const penutup_saran = extract('B. Saran', null);

        const parsed = {
            pendahuluan_latar_belakang,
            pendahuluan_tujuan,
            pendahuluan_manfaat,
            pelaksanaan_waktu_tempat,
            pelaksanaan_materi,
            pelaksanaan_peserta,
            hasil_uraian,
            hasil_tindak_lanjut,
            hasil_dampak,
            penutup_simpulan,
            penutup_saran
        };

        return c.json({ success: true, data: parsed });

    } catch (e: any) {
        console.error('Error generating AI content:', e);

        // DEBUG: Save error to audit_logs
        try {
            await c.env.DB.prepare(
                "INSERT INTO audit_logs (user_id, action, details) VALUES (NULL, 'AI_DEBUG_ERROR', ?)"
            ).bind(JSON.stringify({ error: e.message || 'Unknown', stack: e.stack })).run();
        } catch (err) {
            console.error('Log error', err);
        }

        return c.json({ success: false, error: e.message || 'Terjadi kesalahan saat generate konten' }, 500);
    }
});

// GET /api/laporan - List all laporan
laporan.get('/', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            `SELECT l.*, u.nama as pembuat 
             FROM laporan_kegiatan l 
             LEFT JOIN users u ON l.user_id = u.id 
             ORDER BY l.created_at DESC`
        ).all();

        // Parse JSON fields
        const processedResults = results.map(row => ({
            ...row,
            lampiran_foto: row.lampiran_foto ? JSON.parse(row.lampiran_foto as string) : []
        }));

        return c.json({ success: true, data: processedResults });
    } catch (e) {
        console.error('Error fetching laporan:', e);
        return c.json({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// GET /api/laporan/:id - Get single laporan details
laporan.get('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await c.env.DB.prepare(
            `SELECT * FROM laporan_kegiatan WHERE id = ?`
        ).bind(id).first();

        if (!result) {
            return c.json({ success: false, error: 'Laporan not found' }, 404);
        }

        // Parse JSON fields
        const data = {
            ...result,
            lampiran_foto: result.lampiran_foto ? JSON.parse(result.lampiran_foto as string) : []
        };

        return c.json({ success: true, data });
    } catch (e) {
        console.error('Error fetching laporan detail:', e);
        return c.json({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// POST /api/laporan - Create new laporan
laporan.post('/', async (c) => {
    try {
        const body = await c.req.json<LaporanData>();
        const userId = 1; // TODO: Get from auth context

        const { success } = await c.env.DB.prepare(`
            INSERT INTO laporan_kegiatan (
                user_id, program_kerja_id, judul_laporan, periode,
                pendahuluan_latar_belakang, pendahuluan_tujuan, pendahuluan_manfaat,
                pelaksanaan_waktu_tempat, pelaksanaan_materi, pelaksanaan_peserta,
                hasil_uraian, hasil_tindak_lanjut, hasil_dampak,
                penutup_simpulan, penutup_saran,
                lampiran_foto, lampiran_daftar_hadir, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            userId, body.program_kerja_id || null, body.judul_laporan, body.periode,
            body.pendahuluan_latar_belakang, body.pendahuluan_tujuan, body.pendahuluan_manfaat,
            body.pelaksanaan_waktu_tempat, body.pelaksanaan_materi, body.pelaksanaan_peserta,
            body.hasil_uraian, body.hasil_tindak_lanjut, body.hasil_dampak,
            body.penutup_simpulan, body.penutup_saran,
            JSON.stringify(body.lampiran_foto || []), body.lampiran_daftar_hadir || null, body.status || 'draft'
        ).run();

        if (!success) {
            return c.json({ success: false, error: 'Failed to create laporan' }, 500);
        }

        return c.json({ success: true, message: 'Laporan created successfully' }, 201);
    } catch (e) {
        console.error('Error creating laporan:', e);
        return c.json({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// PUT /api/laporan/:id - Update laporan
laporan.put('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json<LaporanData>();

        const { success } = await c.env.DB.prepare(`
            UPDATE laporan_kegiatan SET
                program_kerja_id = ?, judul_laporan = ?, periode = ?,
                pendahuluan_latar_belakang = ?, pendahuluan_tujuan = ?, pendahuluan_manfaat = ?,
                pelaksanaan_waktu_tempat = ?, pelaksanaan_materi = ?, pelaksanaan_peserta = ?,
                hasil_uraian = ?, hasil_tindak_lanjut = ?, hasil_dampak = ?,
                penutup_simpulan = ?, penutup_saran = ?,
                lampiran_foto = ?, lampiran_daftar_hadir = ?, status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
            body.program_kerja_id || null, body.judul_laporan, body.periode,
            body.pendahuluan_latar_belakang, body.pendahuluan_tujuan, body.pendahuluan_manfaat,
            body.pelaksanaan_waktu_tempat, body.pelaksanaan_materi, body.pelaksanaan_peserta,
            body.hasil_uraian, body.hasil_tindak_lanjut, body.hasil_dampak,
            body.penutup_simpulan, body.penutup_saran,
            JSON.stringify(body.lampiran_foto || []), body.lampiran_daftar_hadir || null, body.status,
            id
        ).run();

        if (!success) {
            return c.json({ success: false, error: 'Failed to update laporan' }, 500);
        }

        return c.json({ success: true, message: 'Laporan updated successfully' });
    } catch (e) {
        console.error('Error updating laporan:', e);
        return c.json({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// DELETE /api/laporan/:id - Delete laporan
laporan.delete('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const { success } = await c.env.DB.prepare(
            `DELETE FROM laporan_kegiatan WHERE id = ?`
        ).bind(id).run();

        if (!success) {
            return c.json({ success: false, error: 'Failed to delete laporan' }, 500);
        }

        return c.json({ success: true, message: 'Laporan deleted successfully' });
    } catch (e) {
        console.error('Error deleting laporan:', e);
        return c.json({ success: false, error: 'Internal Server Error' }, 500);
    }
});

// GET /api/laporan/:id/docx - Generate DOCX
laporan.get('/:id/docx', async (c) => {
    const id = c.req.param('id');
    try {
        const result = await c.env.DB.prepare(
            `SELECT * FROM laporan_kegiatan WHERE id = ?`
        ).bind(id).first();

        if (!result) {
            return c.json({ success: false, error: 'Laporan not found' }, 404);
        }

        // Get Settings
        const { results: settingsRows } = await c.env.DB.prepare(
            "SELECT key, value FROM settings"
        ).all();
        const settings = settingsRows.reduce((acc: any, row: any) => {
            acc[row.key] = row.value;
            return acc;
        }, {});

        // Prepare Data
        const data = {
            ...result,
            lampiran_foto: result.lampiran_foto ? JSON.parse(result.lampiran_foto as string) : []
        } as unknown as LaporanData;

        // Generate Buffer
        const buffer = await generateLaporanBuffer(data, settings);

        // Serve File
        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="Laporan_KKG_${data.judul_laporan.replace(/\s+/g, '_')}.docx"`,
            },
        });

    } catch (e: any) {
        console.error('Error generating DOCX:', e);
        return c.json({ success: false, error: 'Failed to generate DOCX' }, 500);
    }
});

export default laporan;
