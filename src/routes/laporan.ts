
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
        const { judul_laporan, periode, program_kerja_judul, tema, narasumber, tempat } = body;

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
            tema,
            narasumber,
            tempat, // Passed to prompt builder for context (e.g. in Waktu dan Tempat)
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

        // Helper to extract text using Regex for flexibility
        const extractRegex = (startPattern: RegExp, endPattern: RegExp | null = null): string => {
            try {
                const matchStart = generatedText.match(startPattern);
                if (!matchStart) {
                    console.log(`Marker not found for pattern: ${startPattern}`);
                    return '';
                }

                const startIndex = matchStart.index! + matchStart[0].length;
                let endIndex = generatedText.length;

                if (endPattern) {
                    // Search for end marker after the start marker
                    const restOfText = generatedText.slice(startIndex);
                    const matchEnd = restOfText.match(endPattern);

                    if (matchEnd) {
                        endIndex = startIndex + matchEnd.index!;
                    } else {
                        // Fallback: Try to find the next Chapter header if section end not found
                        const nextChapter = restOfText.match(/\nBAB\s+[IVX]+/i);
                        if (nextChapter) {
                            endIndex = startIndex + nextChapter.index!;
                        }
                    }
                }

                let content = generatedText.substring(startIndex, endIndex).trim();

                // Clean up common AI artifacts from the start of the content
                content = content.replace(/^[:\-\s]+/, '').trim();

                return content;
            } catch (e) {
                console.error(`Error extracting content:`, e);
                return '';
            }
        };

        // Define Regex patterns for sections (Flexible: case insensitive, optional bold **, optional spacing)
        // Matches "A. Title", "**A. Title**", "A.  Title", etc.
        const p = (str: string) => new RegExp(`(?:^|\\n)\\s*(?:\\*\\*)?\\s*${str}\\s*(?:\\*\\*)?\\s*(?:$|\\n|:)`, 'i');
        const bab = (num: string, title: string) => new RegExp(`(?:^|\\n)\\s*(?:\\*\\*)?\\s*BAB\\s+${num}[:\\s]+${title}\\s*(?:\\*\\*)?\\s*(?:$|\\n)`, 'i');

        // Parse sections robustly
        const pendahuluan_latar_belakang = extractRegex(p('A\\.\\s*Latar\\s*Belakang'), p('B\\.\\s*Tujuan'));
        const pendahuluan_tujuan = extractRegex(p('B\\.\\s*Tujuan'), p('C\\.\\s*Manfaat'));
        const pendahuluan_manfaat = extractRegex(p('C\\.\\s*Manfaat'), bab('II', 'PELAKSANAAN')); // Fallback to BAB II if end marker missing

        const pelaksanaan_waktu_tempat = extractRegex(p('A\\.\\s*Waktu\\s*dan\\s*Tempat'), p('B\\.\\s*Materi'));
        const pelaksanaan_materi = extractRegex(p('B\\.\\s*Materi\\s*Kegiatan'), p('C\\.\\s*Narasumber'));
        const pelaksanaan_peserta = extractRegex(p('C\\.\\s*Narasumber\\s*dan\\s*Peserta'), bab('III', 'HASIL'));

        const hasil_uraian = extractRegex(p('A\\.\\s*Uraian\\s*Jalannya\\s*Kegiatan'), p('B\\.\\s*Tindak\\s*Lanjut'));
        const hasil_tindak_lanjut = extractRegex(p('B\\.\\s*Tindak\\s*Lanjut'), p('C\\.\\s*Dampak'));
        const hasil_dampak = extractRegex(p('C\\.\\s*Dampak'), bab('IV', 'PENUTUP'));

        const penutup_simpulan = extractRegex(p('A\\.\\s*Simpulan'), p('B\\.\\s*Saran'));
        const penutup_saran = extractRegex(p('B\\.\\s*Saran'), null); // Until end of text

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
