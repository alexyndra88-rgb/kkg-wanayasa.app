/**
 * Sekolah Routes - Manage schools in KKG Gugus 3 Wanayasa
 */

import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors } from '../lib/response';

type Bindings = { DB: D1Database };

const sekolah = new Hono<{ Bindings: Bindings }>();

// Get all schools (Public - for registration dropdown)
sekolah.get('/', async (c) => {
    try {
        const results = await c.env.DB.prepare(`
      SELECT * FROM sekolah 
      ORDER BY is_sekretariat DESC, tipe ASC, nama ASC
    `).all();

        return successResponse(c, results.results);
    } catch (e: any) {
        console.error('Get sekolah error:', e);
        return Errors.internal(c);
    }
});

// Get single school
sekolah.get('/:id', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    try {
        const id = c.req.param('id');
        const result = await c.env.DB.prepare(
            'SELECT * FROM sekolah WHERE id = ?'
        ).bind(id).first();

        if (!result) {
            return Errors.notFound(c, 'Sekolah');
        }

        return successResponse(c, result);
    } catch (e: any) {
        console.error('Get sekolah error:', e);
        return Errors.internal(c);
    }
});

// Add new school (admin only)
sekolah.post('/', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    if (user.role !== 'admin') {
        return Errors.forbidden(c);
    }

    try {
        const body = await c.req.json();
        const { nama, npsn, tipe, alamat, kepala_sekolah, jumlah_guru, is_sekretariat, is_sekolah_penggerak, keterangan } = body;

        if (!nama) {
            return Errors.validation(c, 'Nama sekolah harus diisi');
        }

        const result = await c.env.DB.prepare(`
      INSERT INTO sekolah (nama, npsn, tipe, alamat, kepala_sekolah, jumlah_guru, is_sekretariat, is_sekolah_penggerak, keterangan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
            nama,
            npsn || null,
            tipe || 'negeri',
            alamat || null,
            kepala_sekolah || null,
            jumlah_guru || null,
            is_sekretariat ? 1 : 0,
            is_sekolah_penggerak ? 1 : 0,
            keterangan || null
        ).run();

        return successResponse(c, { id: result.meta.last_row_id }, 'Sekolah berhasil ditambahkan', 201);
    } catch (e: any) {
        console.error('Add sekolah error:', e);
        if (e.message?.includes('UNIQUE')) {
            return Errors.validation(c, 'NPSN sudah terdaftar');
        }
        return Errors.internal(c);
    }
});

// Update school (admin only)
sekolah.put('/:id', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    if (user.role !== 'admin') {
        return Errors.forbidden(c);
    }

    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const { nama, npsn, tipe, alamat, kepala_sekolah, jumlah_guru, is_sekretariat, is_sekolah_penggerak, keterangan } = body;

        if (!nama) {
            return Errors.validation(c, 'Nama sekolah harus diisi');
        }

        // Check if exists
        const existing = await c.env.DB.prepare(
            'SELECT id FROM sekolah WHERE id = ?'
        ).bind(id).first();

        if (!existing) {
            return Errors.notFound(c, 'Sekolah');
        }

        await c.env.DB.prepare(`
      UPDATE sekolah SET 
        nama = ?, npsn = ?, tipe = ?, alamat = ?, kepala_sekolah = ?, 
        jumlah_guru = ?, is_sekretariat = ?, is_sekolah_penggerak = ?, keterangan = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
            nama,
            npsn || null,
            tipe || 'negeri',
            alamat || null,
            kepala_sekolah || null,
            jumlah_guru || null,
            is_sekretariat ? 1 : 0,
            is_sekolah_penggerak ? 1 : 0,
            keterangan || null,
            id
        ).run();

        return successResponse(c, null, 'Sekolah berhasil diperbarui');
    } catch (e: any) {
        console.error('Update sekolah error:', e);
        if (e.message?.includes('UNIQUE')) {
            return Errors.validation(c, 'NPSN sudah terdaftar');
        }
        return Errors.internal(c);
    }
});

// Delete school (admin only)
sekolah.delete('/:id', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    if (user.role !== 'admin') {
        return Errors.forbidden(c);
    }

    try {
        const id = c.req.param('id');

        const existing = await c.env.DB.prepare(
            'SELECT id FROM sekolah WHERE id = ?'
        ).bind(id).first();

        if (!existing) {
            return Errors.notFound(c, 'Sekolah');
        }

        await c.env.DB.prepare('DELETE FROM sekolah WHERE id = ?').bind(id).run();

        return successResponse(c, null, 'Sekolah berhasil dihapus');
    } catch (e: any) {
        console.error('Delete sekolah error:', e);
        return Errors.internal(c);
    }
});

export default sekolah;
