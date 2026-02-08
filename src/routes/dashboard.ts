/**
 * Dashboard Analytics Routes
 * Provides statistics and overview data for the dashboard
 */

import { Hono } from 'hono';
import { getCurrentUser } from '../lib/auth';
import { successResponse, Errors, ErrorCodes, errorResponse } from '../lib/response';
import { logger } from '../lib/logger';

// Types
interface DashboardEnv {
    DB: D1Database;
}

const dashboard = new Hono<{ Bindings: DashboardEnv }>();

// ============================================
// Quick Stats
// ============================================

interface QuickStats {
    totalAnggota: number;
    kegiatanBerjalan: number;
    materiTersedia: number;
    suratDibuat: number;
    forumAktif: number;
}

/**
 * GET /api/dashboard/stats
 * Get quick statistics for dashboard
 */
dashboard.get('/stats', async (c) => {
    const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
    const user = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    try {
        const db = c.env.DB;

        // Run all queries in parallel
        const [
            anggotaResult,
            kegiatanResult,
            materiResult,
            suratResult,
            forumResult,
        ] = await Promise.all([
            db.prepare('SELECT COUNT(*) as count FROM users').first(),
            db.prepare(`
        SELECT COUNT(*) as count FROM kegiatan 
        WHERE DATE(tanggal) >= DATE('now', '-7 days')
      `).first(),
            db.prepare('SELECT COUNT(*) as count FROM materi').first(),
            db.prepare('SELECT COUNT(*) as count FROM surat_undangan').first(),
            db.prepare(`
        SELECT COUNT(*) as count FROM forum_threads 
        WHERE DATE(created_at) >= DATE('now', '-30 days')
      `).first(),
        ]);

        const stats: QuickStats = {
            totalAnggota: (anggotaResult as any)?.count || 0,
            kegiatanBerjalan: (kegiatanResult as any)?.count || 0,
            materiTersedia: (materiResult as any)?.count || 0,
            suratDibuat: (suratResult as any)?.count || 0,
            forumAktif: (forumResult as any)?.count || 0,
        };

        logger.info('Dashboard stats fetched', { userId: user.id });
        return successResponse(c, stats);
    } catch (error: any) {
        logger.error('Failed to fetch dashboard stats', error);
        return Errors.internal(c);
    }
});

// ============================================
// Recent Activity
// ============================================

interface ActivityItem {
    id: number;
    type: 'kegiatan' | 'materi' | 'surat' | 'forum' | 'pengumuman';
    title: string;
    description?: string;
    timestamp: string;
    userId?: number;
    userName?: string;
}

/**
 * GET /api/dashboard/activity
 * Get recent activity feed
 */
dashboard.get('/activity', async (c) => {
    const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
    const user = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    const limit = parseInt(c.req.query('limit') || '10');
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    try {
        const db = c.env.DB;

        // Get recent items from multiple tables using UNION
        const results = await db.prepare(`
      SELECT * FROM (
        SELECT 
          id,
          'kegiatan' as type,
          nama_kegiatan as title,
          tempat as description,
          tanggal as timestamp,
          NULL as user_id,
          NULL as user_name
        FROM kegiatan
        ORDER BY created_at DESC
        LIMIT 5
      )
      UNION ALL
      SELECT * FROM (
        SELECT 
          id,
          'materi' as type,
          judul as title,
          kategori as description,
          created_at as timestamp,
          user_id,
          NULL as user_name
        FROM materi
        ORDER BY created_at DESC
        LIMIT 5
      )
      UNION ALL
      SELECT * FROM (
        SELECT 
          id,
          'surat' as type,
          jenis_kegiatan as title,
          tempat_kegiatan as description,
          created_at as timestamp,
          user_id,
          NULL as user_name
        FROM surat_undangan
        ORDER BY created_at DESC
        LIMIT 5
      )
      UNION ALL
      SELECT * FROM (
        SELECT 
          id,
          'forum' as type,
          judul as title,
          kategori as description,
          created_at as timestamp,
          user_id,
          NULL as user_name
        FROM forum_threads
        ORDER BY created_at DESC
        LIMIT 5
      )
      UNION ALL
      SELECT * FROM (
        SELECT 
          id,
          'pengumuman' as type,
          judul as title,
          kategori as description,
          created_at as timestamp,
          NULL as user_id,
          NULL as user_name
        FROM pengumuman
        ORDER BY created_at DESC
        LIMIT 5
      )
      ORDER BY timestamp DESC
      LIMIT ?
    `).bind(safeLimit).all();

        const activities: ActivityItem[] = (results.results || []).map((row: any) => ({
            id: row.id,
            type: row.type,
            title: row.title,
            description: row.description,
            timestamp: row.timestamp,
            userId: row.user_id,
            userName: row.user_name,
        }));

        logger.info('Dashboard activity fetched', { userId: user.id, count: activities.length });
        return successResponse(c, activities);
    } catch (error: any) {
        logger.error('Failed to fetch dashboard activity', error);
        return Errors.internal(c);
    }
});

// ============================================
// Upcoming Events
// ============================================

interface UpcomingEvent {
    id: number;
    nama: string;
    tanggal: string;
    waktu?: string;
    tempat?: string;
    daysUntil: number;
}

/**
 * GET /api/dashboard/upcoming
 * Get upcoming events/kegiatan
 */
dashboard.get('/upcoming', async (c) => {
    const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
    const user = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    try {
        const db = c.env.DB;

        const results = await db.prepare(`
      SELECT 
        id,
        nama_kegiatan as nama,
        tanggal,
        waktu_mulai as waktu,
        tempat,
        JULIANDAY(tanggal) - JULIANDAY('now') as days_until
      FROM kegiatan
      WHERE DATE(tanggal) >= DATE('now')
      ORDER BY tanggal ASC
      LIMIT 10
    `).all();

        const events: UpcomingEvent[] = (results.results || []).map((row: any) => ({
            id: row.id,
            nama: row.nama,
            tanggal: row.tanggal,
            waktu: row.waktu,
            tempat: row.tempat,
            daysUntil: Math.ceil(row.days_until || 0),
        }));

        logger.info('Dashboard upcoming events fetched', { userId: user.id, count: events.length });
        return successResponse(c, events);
    } catch (error: any) {
        logger.error('Failed to fetch upcoming events', error);
        return Errors.internal(c);
    }
});

// ============================================
// Member Statistics (Admin Only)
// ============================================

interface MemberStats {
    total: number;
    admins: number;
    activeThisMonth: number;
    newThisMonth: number;
    bySchool: { sekolah: string; count: number }[];
}

/**
 * GET /api/dashboard/members
 * Get member statistics (admin only)
 */
dashboard.get('/members', async (c) => {
    const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
    const user = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    if (user.role !== 'admin') {
        return Errors.forbidden(c);
    }

    try {
        const db = c.env.DB;

        const [totalResult, adminResult, newResult, bySchoolResult] = await Promise.all([
            db.prepare('SELECT COUNT(*) as count FROM users').first(),
            db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").first(),
            db.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE DATE(created_at) >= DATE('now', '-30 days')
      `).first(),
            db.prepare(`
        SELECT sekolah, COUNT(*) as count 
        FROM users 
        WHERE sekolah IS NOT NULL AND sekolah != ''
        GROUP BY sekolah 
        ORDER BY count DESC 
        LIMIT 10
      `).all(),
        ]);

        const stats: MemberStats = {
            total: (totalResult as any)?.count || 0,
            admins: (adminResult as any)?.count || 0,
            activeThisMonth: 0, // Would need session tracking for this
            newThisMonth: (newResult as any)?.count || 0,
            bySchool: (bySchoolResult.results || []).map((row: any) => ({
                sekolah: row.sekolah || 'Tidak diketahui',
                count: row.count,
            })),
        };

        logger.info('Dashboard member stats fetched', { userId: user.id });
        return successResponse(c, stats);
    } catch (error: any) {
        logger.error('Failed to fetch member stats', error);
        return Errors.internal(c);
    }
});

// ============================================
// AI Usage Statistics (Admin Only)
// ============================================

interface AIUsageStats {
    suratGenerated: number;
    prokerGenerated: number;
    totalGenerated: number;
    recentUsage: { date: string; count: number }[];
}

/**
 * GET /api/dashboard/ai-usage
 * Get AI usage statistics (admin only)
 */
dashboard.get('/ai-usage', async (c) => {
    const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
    const user = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    if (user.role !== 'admin') {
        return Errors.forbidden(c);
    }

    try {
        const db = c.env.DB;

        const [suratResult, prokerResult, recentUsageResult] = await Promise.all([
            db.prepare('SELECT COUNT(*) as count FROM surat_undangan').first(),
            db.prepare('SELECT COUNT(*) as count FROM program_kerja').first(),
            db.prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM surat_undangan
        WHERE DATE(created_at) >= DATE('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `).all(),
        ]);

        const suratCount = (suratResult as any)?.count || 0;
        const prokerCount = (prokerResult as any)?.count || 0;

        const stats: AIUsageStats = {
            suratGenerated: suratCount,
            prokerGenerated: prokerCount,
            totalGenerated: suratCount + prokerCount,
            recentUsage: (recentUsageResult.results || []).map((row: any) => ({
                date: row.date,
                count: row.count,
            })),
        };

        logger.info('Dashboard AI usage stats fetched', { userId: user.id });
        return successResponse(c, stats);
    } catch (error: any) {
        logger.error('Failed to fetch AI usage stats', error);
        return Errors.internal(c);
    }
});

// ============================================
// System Health (Admin Only)
// ============================================

/**
 * GET /api/dashboard/health
 * Get system health status (admin only)
 */
dashboard.get('/health', async (c) => {
    const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
    const user = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    if (user.role !== 'admin') {
        return Errors.forbidden(c);
    }

    try {
        const db = c.env.DB;

        // Test database connectivity
        const dbTest = await db.prepare('SELECT 1 as test').first();
        const dbHealthy = (dbTest as any)?.test === 1;

        // Check for API key
        const settings = await db.prepare(`
      SELECT * FROM settings WHERE key = 'mistral_api_key'
    `).first();
        const hasApiKey = !!(settings as any)?.value;

        const health = {
            status: dbHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                database: {
                    status: dbHealthy ? 'up' : 'down',
                    latency: null, // Would need timing
                },
                ai: {
                    status: hasApiKey ? 'configured' : 'not_configured',
                    hasApiKey,
                },
            },
            version: '1.0.0',
        };

        logger.info('Dashboard health check', { userId: user.id, status: health.status });
        return successResponse(c, health);
    } catch (error: any) {
        logger.error('Health check failed', error);
        return successResponse(c, {
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
        });
    }
});

export default dashboard;
