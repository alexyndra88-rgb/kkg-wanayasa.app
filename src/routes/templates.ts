import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import { createAuditLog } from '../lib/audit';

type Bindings = { DB: D1Database };

const templates = new Hono<{ Bindings: Bindings }>();

// Get all templates (with optional filter)
templates.get('/', async (c) => {
    try {
        const jenis = c.req.query('jenis') || '';
        const activeOnly = c.req.query('active') !== 'false';

        let query = `
      SELECT t.*, u.nama as creator_name
      FROM surat_templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (jenis) {
            query += ` AND t.jenis = ?`;
            params.push(jenis);
        }

        if (activeOnly) {
            query += ` AND t.is_active = 1`;
        }

        query += ` ORDER BY t.jenis, t.nama`;

        const stmt = c.env.DB.prepare(query);
        const results = params.length > 0
            ? await stmt.bind(...params).all()
            : await stmt.all();

        // Parse variables JSON for each template
        const templatesWithVars = results.results?.map((t: any) => ({
            ...t,
            variables: t.variables ? JSON.parse(t.variables) : []
        }));

        return successResponse(c, templatesWithVars);
    } catch (e: any) {
        console.error('Get templates error:', e);
        return Errors.internal(c);
    }
});

// Get single template
templates.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');

        if (!id || isNaN(Number(id))) {
            return Errors.validation(c, 'ID template tidak valid');
        }

        const template: any = await c.env.DB.prepare(`
      SELECT t.*, u.nama as creator_name
      FROM surat_templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `).bind(id).first();

        if (!template) {
            return Errors.notFound(c, 'Template');
        }

        // Parse variables
        template.variables = template.variables ? JSON.parse(template.variables) : [];

        return successResponse(c, template);
    } catch (e: any) {
        console.error('Get template error:', e);
        return Errors.internal(c);
    }
});

// Create template (admin only)
templates.post('/', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    if (user.role !== 'admin') {
        return Errors.forbidden(c, 'Hanya admin yang dapat membuat template');
    }

    try {
        const body = await c.req.json();

        const validation = validateRequired(body, ['nama', 'jenis', 'konten']);
        if (!validation.valid) {
            return Errors.validation(c, `Field ${validation.missing.join(', ')} harus diisi`);
        }

        const { nama, jenis, deskripsi, konten, variables, is_active } = body;

        // Validate jenis
        const validJenis = ['undangan', 'tugas', 'keterangan', 'edaran', 'permohonan', 'lainnya'];
        if (!validJenis.includes(jenis)) {
            return Errors.validation(c, `Jenis tidak valid. Gunakan: ${validJenis.join(', ')}`);
        }

        // Auto-extract variables from content if not provided
        let varsJson = '[]';
        if (variables && Array.isArray(variables)) {
            varsJson = JSON.stringify(variables);
        } else {
            // Extract {{variable}} patterns from content
            const matches = konten.match(/\{\{(\w+)\}\}/g);
            if (matches) {
                const extracted = [...new Set(matches.map((m: string) => m.replace(/[{}]/g, '')))];
                varsJson = JSON.stringify(extracted);
            }
        }

        const result = await c.env.DB.prepare(`
      INSERT INTO surat_templates (nama, jenis, deskripsi, konten, variables, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
            nama.trim(),
            jenis,
            deskripsi?.trim() || null,
            konten,
            varsJson,
            is_active !== false ? 1 : 0,
            user.id
        ).run();

        // Audit log
        await createAuditLog(c.env.DB, {
            user_id: user.id,
            action: 'TEMPLATE_CREATE',
            entity_type: 'surat_templates',
            entity_id: result.meta.last_row_id,
            details: { nama, jenis },
            ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
            user_agent: c.req.header('User-Agent')
        });

        return successResponse(c, {
            id: result.meta.last_row_id,
            nama,
            jenis
        }, 'Template berhasil dibuat', 201);
    } catch (e: any) {
        console.error('Create template error:', e);
        return Errors.internal(c);
    }
});

// Update template (admin only)
templates.put('/:id', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    if (user.role !== 'admin') {
        return Errors.forbidden(c, 'Hanya admin yang dapat mengubah template');
    }

    try {
        const id = c.req.param('id');
        const body = await c.req.json();

        if (!id || isNaN(Number(id))) {
            return Errors.validation(c, 'ID template tidak valid');
        }

        // Check if template exists
        const existing = await c.env.DB.prepare(
            'SELECT id FROM surat_templates WHERE id = ?'
        ).bind(id).first();

        if (!existing) {
            return Errors.notFound(c, 'Template');
        }

        const { nama, jenis, deskripsi, konten, variables, is_active } = body;

        // Build update query dynamically
        const updates: string[] = [];
        const params: any[] = [];

        if (nama !== undefined) {
            updates.push('nama = ?');
            params.push(nama.trim());
        }
        if (jenis !== undefined) {
            const validJenis = ['undangan', 'tugas', 'keterangan', 'edaran', 'permohonan', 'lainnya'];
            if (!validJenis.includes(jenis)) {
                return Errors.validation(c, `Jenis tidak valid`);
            }
            updates.push('jenis = ?');
            params.push(jenis);
        }
        if (deskripsi !== undefined) {
            updates.push('deskripsi = ?');
            params.push(deskripsi?.trim() || null);
        }
        if (konten !== undefined) {
            updates.push('konten = ?');
            params.push(konten);

            // Auto-extract variables if konten is updated
            if (!variables) {
                const matches = konten.match(/\{\{(\w+)\}\}/g);
                if (matches) {
                    const extracted = [...new Set(matches.map((m: string) => m.replace(/[{}]/g, '')))];
                    updates.push('variables = ?');
                    params.push(JSON.stringify(extracted));
                }
            }
        }
        if (variables !== undefined) {
            updates.push('variables = ?');
            params.push(JSON.stringify(variables));
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            params.push(is_active ? 1 : 0);
        }

        if (updates.length === 0) {
            return Errors.validation(c, 'Tidak ada field yang diupdate');
        }

        updates.push("updated_at = datetime('now')");
        params.push(id);

        await c.env.DB.prepare(`
      UPDATE surat_templates SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

        // Audit log
        await createAuditLog(c.env.DB, {
            user_id: user.id,
            action: 'TEMPLATE_UPDATE',
            entity_type: 'surat_templates',
            entity_id: Number(id),
            details: { updated_fields: updates.filter(u => !u.includes('updated_at')).map(u => u.split('=')[0].trim()) },
            ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
            user_agent: c.req.header('User-Agent')
        });

        return successResponse(c, { updated: true }, 'Template berhasil diperbarui');
    } catch (e: any) {
        console.error('Update template error:', e);
        return Errors.internal(c);
    }
});

// Delete template (admin only)
templates.delete('/:id', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    if (user.role !== 'admin') {
        return Errors.forbidden(c, 'Hanya admin yang dapat menghapus template');
    }

    try {
        const id = c.req.param('id');

        if (!id || isNaN(Number(id))) {
            return Errors.validation(c, 'ID template tidak valid');
        }

        // Check if template exists
        const existing: any = await c.env.DB.prepare(
            'SELECT id, nama FROM surat_templates WHERE id = ?'
        ).bind(id).first();

        if (!existing) {
            return Errors.notFound(c, 'Template');
        }

        await c.env.DB.prepare('DELETE FROM surat_templates WHERE id = ?').bind(id).run();

        // Audit log
        await createAuditLog(c.env.DB, {
            user_id: user.id,
            action: 'TEMPLATE_DELETE',
            entity_type: 'surat_templates',
            entity_id: Number(id),
            details: { deleted_template: existing.nama },
            ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
            user_agent: c.req.header('User-Agent')
        });

        return successResponse(c, null, 'Template berhasil dihapus');
    } catch (e: any) {
        console.error('Delete template error:', e);
        return Errors.internal(c);
    }
});

// Toggle template active status
templates.post('/:id/toggle', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user || user.role !== 'admin') {
        return Errors.forbidden(c);
    }

    try {
        const id = c.req.param('id');

        const template: any = await c.env.DB.prepare(
            'SELECT id, is_active FROM surat_templates WHERE id = ?'
        ).bind(id).first();

        if (!template) {
            return Errors.notFound(c, 'Template');
        }

        const newStatus = template.is_active ? 0 : 1;
        await c.env.DB.prepare(
            "UPDATE surat_templates SET is_active = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(newStatus, id).run();

        return successResponse(c, {
            is_active: newStatus === 1
        }, `Template ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (e: any) {
        console.error('Toggle template error:', e);
        return Errors.internal(c);
    }
});

// Get template preview with sample data
templates.post('/:id/preview', async (c) => {
    try {
        const id = c.req.param('id');
        const { data } = await c.req.json();

        const template: any = await c.env.DB.prepare(
            'SELECT konten, variables FROM surat_templates WHERE id = ?'
        ).bind(id).first();

        if (!template) {
            return Errors.notFound(c, 'Template');
        }

        let preview = template.konten;
        const variables = template.variables ? JSON.parse(template.variables) : [];

        // Replace variables with provided data or placeholders
        for (const varName of variables) {
            const value = data?.[varName] || `[${varName}]`;
            preview = preview.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value);
        }

        return successResponse(c, {
            preview,
            variables,
            filled: Object.keys(data || {}).filter(k => variables.includes(k))
        });
    } catch (e: any) {
        console.error('Preview template error:', e);
        return Errors.internal(c);
    }
});

// Duplicate template
templates.post('/:id/duplicate', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user || user.role !== 'admin') {
        return Errors.forbidden(c);
    }

    try {
        const id = c.req.param('id');

        const template: any = await c.env.DB.prepare(
            'SELECT nama, jenis, deskripsi, konten, variables FROM surat_templates WHERE id = ?'
        ).bind(id).first();

        if (!template) {
            return Errors.notFound(c, 'Template');
        }

        const result = await c.env.DB.prepare(`
      INSERT INTO surat_templates (nama, jenis, deskripsi, konten, variables, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).bind(
            `${template.nama} (Copy)`,
            template.jenis,
            template.deskripsi,
            template.konten,
            template.variables,
            user.id
        ).run();

        return successResponse(c, {
            id: result.meta.last_row_id,
            nama: `${template.nama} (Copy)`
        }, 'Template berhasil diduplikasi', 201);
    } catch (e: any) {
        console.error('Duplicate template error:', e);
        return Errors.internal(c);
    }
});

export default templates;
