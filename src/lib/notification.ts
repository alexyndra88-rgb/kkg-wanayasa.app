import type { Notification } from '../types';

/**
 * Notification Library
 * Handles creating and managing in-app notifications
 */

/**
 * Create a new notification for a user
 */
export async function createNotification(
    db: D1Database,
    userId: number,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    link?: string
): Promise<void> {
    try {
        await db.prepare(`
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (?, ?, ?, ?, ?)
        `).bind(userId, title, message, type, link || null).run();
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
}

/**
 * Create a notification for multiple users (e.g. all admins)
 */
export async function createBulkNotifications(
    db: D1Database,
    userIds: number[],
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    link?: string
): Promise<void> {
    if (userIds.length === 0) return;

    try {
        const stmt = db.prepare(`
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (?, ?, ?, ?, ?)
        `);

        const batch = userIds.map(id => stmt.bind(id, title, message, type, link || null));
        await db.batch(batch);
    } catch (error) {
        console.error('Failed to create bulk notifications:', error);
    }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
    db: D1Database,
    userId: number,
    limit: number = 20,
    offset: number = 0,
    unreadOnly: boolean = false
): Promise<{ notifications: Notification[], unreadCount: number }> {
    let query = `
        SELECT * FROM notifications 
        WHERE user_id = ? 
    `;

    const params: any[] = [userId];

    if (unreadOnly) {
        query += ` AND is_read = 0`;
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const { results } = await db.prepare(query).bind(...params).all();

    // Get total unread count
    const unreadCount: any = await db.prepare(`
        SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
    `).bind(userId).first();

    return {
        notifications: (results as unknown as Notification[]) || [],
        unreadCount: unreadCount?.count || 0
    };
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
    db: D1Database,
    notificationId: number,
    userId: number
): Promise<boolean> {
    const result = await db.prepare(`
        UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?
    `).bind(notificationId, userId).run();

    return result.meta.changes > 0;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
    db: D1Database,
    userId: number
): Promise<void> {
    await db.prepare(`
        UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0
    `).bind(userId).run();
}

/**
 * Delete a notification
 */
export async function deleteNotification(
    db: D1Database,
    notificationId: number,
    userId: number
): Promise<boolean> {
    const result = await db.prepare(`
        DELETE FROM notifications WHERE id = ? AND user_id = ?
    `).bind(notificationId, userId).run();

    return result.meta.changes > 0;
}
