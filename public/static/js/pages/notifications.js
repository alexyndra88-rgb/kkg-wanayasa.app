import { api } from '../api.js';
import { state } from '../state.js';
import { showToast, escapeHtml } from '../utils.js';
import { fetchUnreadCount } from '../notifications.js';

export async function renderNotifications() {
    // Mark all as read when visiting the page? Or better let user do it / click individual?
    // Usually visiting the "All Notifications" page doesn't auto-mark all as read, 
    // but let's provide a "Mark All as Read" button.

    return `
    <div class="max-w-4xl mx-auto py-8 px-4 fade-in">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <i class="fas fa-bell text-yellow-500"></i> Notifikasi
            </h1>
            <button onclick="markAllReadAndRefresh()" class="btn btn-sm btn-secondary">
                <i class="fas fa-check-double mr-2"></i>Tandai Semua Dibaca
            </button>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
            <div id="notifications-page-list" class="divide-y divide-gray-100">
                <div class="p-8 text-center text-gray-500">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>Memuat notifikasi...</p>
                </div>
            </div>
            
            <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-center">
                 <button onclick="loadMoreNotifications()" id="btn-load-more" class="text-sm text-blue-600 font-medium hover:text-blue-800 disabled:opacity-50">
                    Muat Lebih Banyak
                 </button>
            </div>
        </div>
    </div>
  `;
}

// Global functions need to be exposed because render returns HTML string with onclicks
window.loadPageNotifications = async function (offset = 0, append = false) {
    const list = document.getElementById('notifications-page-list');
    const loadMoreBtn = document.getElementById('btn-load-more');

    if (!list) return;

    try {
        const res = await api(`/notifications?limit=20&offset=${offset}`);
        const notifications = res.data.notifications || [];

        if (notifications.length === 0 && !append) {
            list.innerHTML = `
                <div class="flex flex-col items-center justify-center py-16 text-center">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <i class="far fa-bell-slash text-2xl text-gray-400"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">Tidak ada notifikasi</h3>
                    <p class="text-gray-500 max-w-sm mt-1">Anda belum memiliki notifikasi apapun saat ini.</p>
                </div>
            `;
            loadMoreBtn.classList.add('hidden');
            return;
        }

        if (notifications.length < 20) {
            loadMoreBtn.classList.add('hidden');
        } else {
            loadMoreBtn.classList.remove('hidden');
            loadMoreBtn.onclick = () => window.loadPageNotifications(offset + 20, true);
        }

        const html = notifications.map(n => {
            const iconMap = {
                info: 'text-blue-500 bg-blue-50 fa-info-circle',
                success: 'text-green-500 bg-green-50 fa-check-circle',
                warning: 'text-yellow-500 bg-yellow-50 fa-exclamation-triangle',
                error: 'text-red-500 bg-red-50 fa-exclamation-circle'
            };
            const iconClass = iconMap[n.type] || iconMap.info;

            return `
                <div class="p-4 hover:bg-gray-50 transition-colors ${n.is_read ? '' : 'bg-blue-50/40 relative'} group">
                    <div class="flex gap-4">
                        <div class="flex-shrink-0 mt-1">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center ${iconClass.split(' ').slice(1).join(' ')}">
                                <i class="fas ${iconClass.split(' ')[2]} text-lg ${iconClass.split(' ')[0]}"></i>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start">
                                <h4 class="text-sm font-bold text-gray-900 ${n.is_read ? '' : 'text-blue-800'}">${escapeHtml(n.title)}</h4>
                                <span class="text-xs text-gray-500 whitespace-nowrap ml-2">${formatTime(n.created_at)}</span>
                            </div>
                            <p class="text-sm text-gray-600 mt-1 whitespace-pre-wrap">${escapeHtml(n.message)}</p>
                            
                            <div class="mt-3 flex gap-3 items-center">
                                ${n.link ? `
                                    <a href="${n.link}" onclick="handlePageNotificationClick(${n.id}, '${n.link}'); return false;" class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                        Lihat Detail <i class="fas fa-arrow-right"></i>
                                    </a>
                                ` : ''}
                                ${!n.is_read ? `
                                    <button onclick="markAsRead(${n.id})" class="text-xs text-gray-500 hover:text-gray-700">Tandai dibaca</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (append) {
            list.insertAdjacentHTML('beforeend', html);
        } else {
            list.innerHTML = html;
        }

    } catch (e) {
        console.error(e);
        if (!append) list.innerHTML = `<div class="p-8 text-center text-red-500">Gagal memuat notifikasi</div>`;
    }
}

window.markAllReadAndRefresh = async function () {
    try {
        await api('/notifications/read-all', { method: 'PUT' });
        showToast('Semua notifikasi ditandai dibaca', 'success');
        fetchUnreadCount();
        window.loadPageNotifications();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

window.markAsRead = async function (id) {
    try {
        await api(`/notifications/${id}/read`, { method: 'PUT' });
        fetchUnreadCount();
        // Visual update (remove unread styling)
        // Ideally re-render or toggle class, but simpler to reload for now or just let user see it on next refresh?
        // Let's reload list to be clean.
        window.loadPageNotifications();
    } catch (e) {
        console.error(e);
    }
}

window.handlePageNotificationClick = async function (id, link) {
    await window.markAsRead(id);
    if (link) {
        if (link.startsWith('/')) {
            window.navigate(link.substring(1)); // Assuming navigate takes 'page' ID? No, navigate usually takes page ID.
            // Wait, navigate in main.js takes 'page' name like 'home', 'surat'. 
            // If link is real URL like '/surat/123', navigate might not work directly/
            // Our system uses path-based routing in init, but navigate() just updates state?
            // Actually `navigate` in `router.js` pushes state.

            // If link is a route path, we should use pushState.
            window.history.pushState({}, '', link);
            // Then trigger router?
            // `navigate` function in router.js usually takes a page ID for internal logic.
            // If link is like '/surat', it matches a page.

            const path = link.startsWith('/') ? link.substring(1) : link;
            // Check if it's a known page
            // Simple fallback:
            window.location.href = link;
        } else {
            window.open(link, '_blank');
        }
    }
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
}

// Trigger load immediately after rendering
setTimeout(() => {
    if (document.getElementById('notifications-page-list')) {
        window.loadPageNotifications();
    }
}, 100);
