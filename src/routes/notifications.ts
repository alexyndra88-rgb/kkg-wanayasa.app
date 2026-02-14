import { Hono } from 'hono';
import { getCookie, getCurrentUser } from '../lib/auth';
import { successResponse, Errors } from '../lib/response';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from '../lib/notification';

type Bindings = { DB: D1Database };
type Variables = { user: any };

const notifications = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Middleware to ensure user is logged in
notifications.use('*', async (c, next) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    c.set('user', user);
    await next();
});

// Get notifications
notifications.get('/', async (c) => {
    const user = c.get('user');
    const limit = Number(c.req.query('limit')) || 20;
    const offset = Number(c.req.query('offset')) || 0;
    const unreadOnly = c.req.query('unread') === 'true';

    try {
        const result = await getUserNotifications(c.env.DB, user.id, limit, offset, unreadOnly);
        return successResponse(c, result);
    } catch (e: any) {
        return Errors.internal(c);
    }
});

// Get unread count specifically (lighter query)
notifications.get('/unread-count', async (c) => {
    const user = c.get('user');

    try {
        const result: any = await c.env.DB.prepare(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
        ).bind(user.id).first();

        return successResponse(c, { count: result?.count || 0 });
    } catch (e: any) {
        return Errors.internal(c);
    }
});

// Mark as read
notifications.put('/:id/read', async (c) => {
    const user = c.get('user');
    const id = Number(c.req.param('id'));

    try {
        const success = await markNotificationAsRead(c.env.DB, id, user.id);

        if (!success) {
            return Errors.notFound(c, 'Notification');
        }

        return successResponse(c, null, 'Notification marked as read');
    } catch (e: any) {
        return Errors.internal(c);
    }
});

// Mark all as read
notifications.put('/read-all', async (c) => {
    const user = c.get('user');

    try {
        await markAllNotificationsAsRead(c.env.DB, user.id);
        return successResponse(c, null, 'All notifications marked as read');
    } catch (e: any) {
        console.error(e);
        return Errors.internal(c);
    }
});

// Delete notification
notifications.delete('/:id', async (c) => {
    const user = c.get('user');
    const id = Number(c.req.param('id'));

    try {
        const success = await deleteNotification(c.env.DB, id, user.id);
        if (!success) {
            return Errors.notFound(c, 'Notification');
        }
        return successResponse(c, null, 'Notification deleted');
    } catch (e: any) {
        return Errors.internal(c);
    }
});

export default notifications;
