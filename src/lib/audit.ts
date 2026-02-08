/**
 * Audit Log Library for KKG Portal
 * Tracks all admin and important user actions
 */

// Audit action types
export type AuditAction =
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'USER_REGISTER'
    | 'USER_PASSWORD_RESET'
    | 'USER_PROFILE_UPDATE'
    | 'USER_DELETE'
    | 'USER_ROLE_CHANGE'
    | 'SETTINGS_UPDATE'
    | 'KEGIATAN_CREATE'
    | 'KEGIATAN_UPDATE'
    | 'KEGIATAN_DELETE'
    | 'ABSENSI_CHECKIN'
    | 'ABSENSI_QR_GENERATE'
    | 'MATERI_UPLOAD'
    | 'MATERI_DELETE'
    | 'SURAT_CREATE'
    | 'SURAT_DELETE'
    | 'PROKER_CREATE'
    | 'PROKER_UPDATE'
    | 'PROKER_DELETE'
    | 'PENGUMUMAN_CREATE'
    | 'PENGUMUMAN_UPDATE'
    | 'PENGUMUMAN_DELETE'
    | 'FORUM_THREAD_CREATE'
    | 'FORUM_REPLY_CREATE'
    | 'FILE_UPLOAD'
    | 'FILE_DELETE'
    | 'ADMIN_ACTION';

export interface AuditLogEntry {
    id?: number;
    user_id: number | null;
    action: AuditAction | string;
    entity_type?: string;
    entity_id?: number;
    details?: string | object;
    ip_address?: string;
    user_agent?: string;
    created_at?: string;
}

export interface AuditLogWithUser extends AuditLogEntry {
    user_name?: string;
    user_email?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
    db: D1Database,
    entry: AuditLogEntry
): Promise<void> {
    try {
        const detailsJson = typeof entry.details === 'object'
            ? JSON.stringify(entry.details)
            : entry.details || null;

        await db.prepare(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            entry.user_id,
            entry.action,
            entry.entity_type || null,
            entry.entity_id || null,
            detailsJson,
            entry.ip_address || null,
            entry.user_agent || null
        ).run();
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging should not break the main flow
    }
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(
    db: D1Database,
    options: {
        userId?: number;
        action?: string;
        entityType?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
        search?: string;
    } = {}
): Promise<{ logs: AuditLogWithUser[]; total: number }> {
    const {
        userId,
        action,
        entityType,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
        search
    } = options;

    let whereClause = '1=1';
    const params: any[] = [];

    if (userId) {
        whereClause += ' AND a.user_id = ?';
        params.push(userId);
    }

    if (action) {
        whereClause += ' AND a.action = ?';
        params.push(action);
    }

    if (entityType) {
        whereClause += ' AND a.entity_type = ?';
        params.push(entityType);
    }

    if (startDate) {
        whereClause += ' AND a.created_at >= ?';
        params.push(startDate);
    }

    if (endDate) {
        whereClause += ' AND a.created_at <= ?';
        params.push(endDate + ' 23:59:59');
    }

    if (search) {
        whereClause += ' AND (a.details LIKE ? OR u.nama LIKE ? OR a.action LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE ${whereClause}
    `;

    const countStmt = db.prepare(countQuery);
    const countResult: any = params.length > 0
        ? await countStmt.bind(...params).first()
        : await countStmt.first();

    const total = countResult?.total || 0;

    // Get logs with user info
    const query = `
        SELECT 
            a.id,
            a.user_id,
            a.action,
            a.entity_type,
            a.entity_id,
            a.details,
            a.ip_address,
            a.user_agent,
            a.created_at,
            u.nama as user_name,
            u.email as user_email
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, limit, offset];
    const stmt = db.prepare(query);
    const result = await stmt.bind(...queryParams).all();

    const logs = (result.results || []).map((row: any) => ({
        ...row,
        details: row.details ? tryParseJSON(row.details) : null
    }));

    return { logs, total };
}

/**
 * Get unique action types for filtering
 */
export async function getAuditActionTypes(db: D1Database): Promise<string[]> {
    const result = await db.prepare(`
        SELECT DISTINCT action FROM audit_logs ORDER BY action
    `).all();

    return (result.results || []).map((row: any) => row.action);
}

/**
 * Get unique entity types for filtering
 */
export async function getAuditEntityTypes(db: D1Database): Promise<string[]> {
    const result = await db.prepare(`
        SELECT DISTINCT entity_type FROM audit_logs 
        WHERE entity_type IS NOT NULL 
        ORDER BY entity_type
    `).all();

    return (result.results || []).map((row: any) => row.entity_type);
}

/**
 * Get audit statistics
 */
export async function getAuditStats(db: D1Database): Promise<{
    total: number;
    today: number;
    thisWeek: number;
    topActions: { action: string; count: number }[];
}> {
    const [totalResult, todayResult, weekResult, topActionsResult] = await Promise.all([
        db.prepare('SELECT COUNT(*) as cnt FROM audit_logs').first(),
        db.prepare("SELECT COUNT(*) as cnt FROM audit_logs WHERE DATE(created_at) = DATE('now')").first(),
        db.prepare("SELECT COUNT(*) as cnt FROM audit_logs WHERE created_at >= datetime('now', '-7 days')").first(),
        db.prepare(`
            SELECT action, COUNT(*) as count 
            FROM audit_logs 
            GROUP BY action 
            ORDER BY count DESC 
            LIMIT 10
        `).all()
    ]) as any[];

    return {
        total: totalResult?.cnt || 0,
        today: todayResult?.cnt || 0,
        thisWeek: weekResult?.cnt || 0,
        topActions: (topActionsResult?.results || []).map((r: any) => ({
            action: r.action,
            count: r.count
        }))
    };
}

/**
 * Clean old audit logs (retention policy)
 */
export async function cleanOldAuditLogs(
    db: D1Database,
    daysToKeep: number = 90
): Promise<number> {
    const result = await db.prepare(`
        DELETE FROM audit_logs 
        WHERE created_at < datetime('now', '-' || ? || ' days')
    `).bind(daysToKeep).run();

    return result.meta.changes || 0;
}

// Helper function
function tryParseJSON(str: string): any {
    try {
        return JSON.parse(str);
    } catch {
        return str;
    }
}

/**
 * Format action for display
 */
export function formatAuditAction(action: string): string {
    const actionLabels: Record<string, string> = {
        'USER_LOGIN': 'Login',
        'USER_LOGOUT': 'Logout',
        'USER_REGISTER': 'Registrasi',
        'USER_PASSWORD_RESET': 'Reset Password',
        'USER_PROFILE_UPDATE': 'Update Profil',
        'USER_DELETE': 'Hapus User',
        'USER_ROLE_CHANGE': 'Ubah Role User',
        'SETTINGS_UPDATE': 'Update Pengaturan',
        'KEGIATAN_CREATE': 'Buat Kegiatan',
        'KEGIATAN_UPDATE': 'Update Kegiatan',
        'KEGIATAN_DELETE': 'Hapus Kegiatan',
        'ABSENSI_CHECKIN': 'Check-in Absensi',
        'ABSENSI_QR_GENERATE': 'Generate QR Absensi',
        'MATERI_UPLOAD': 'Upload Materi',
        'MATERI_DELETE': 'Hapus Materi',
        'SURAT_CREATE': 'Buat Surat',
        'SURAT_DELETE': 'Hapus Surat',
        'PROKER_CREATE': 'Buat Program Kerja',
        'PROKER_UPDATE': 'Update Program Kerja',
        'PROKER_DELETE': 'Hapus Program Kerja',
        'PENGUMUMAN_CREATE': 'Buat Pengumuman',
        'PENGUMUMAN_UPDATE': 'Update Pengumuman',
        'PENGUMUMAN_DELETE': 'Hapus Pengumuman',
        'FORUM_THREAD_CREATE': 'Buat Thread Forum',
        'FORUM_REPLY_CREATE': 'Balas Thread',
        'FILE_UPLOAD': 'Upload File',
        'FILE_DELETE': 'Hapus File',
        'ADMIN_ACTION': 'Aksi Admin'
    };

    return actionLabels[action] || action;
}
