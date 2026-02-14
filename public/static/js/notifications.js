import { api } from './api.js';
import { state } from './state.js';
import { showToast, escapeHtml } from './utils.js';

// Fetch unread notification count
export async function fetchUnreadCount() {
    if (!state.user) return;
    try {
        const res = await api('/notifications/unread-count');
        if (res.success) {
            state.unreadNotifications = res.data.count;
            updateNotificationBadge();
        }
    } catch (e) {
        console.error('Failed to fetch unread notifications:', e);
    }
}

// Update the badge in the UI
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    if (state.unreadNotifications > 0) {
        badge.textContent = state.unreadNotifications > 99 ? '99+' : state.unreadNotifications;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    // Notify other components (e.g. sidebar)
    document.dispatchEvent(new CustomEvent('notifications-updated'));
}

// Render the bell button HTML
export function renderNotificationBell() {
    if (!state.user) return '';

    return `
    <div class="relative group">
        <button onclick="toggleNotifications()" class="p-2 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-primary-600 transition-colors relative">
            <i class="fas fa-bell text-xl"></i>
            <span id="notification-badge" class="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-[var(--color-bg-elevated)] ${state.unreadNotifications > 0 ? '' : 'hidden'}">
                ${state.unreadNotifications > 99 ? '99+' : state.unreadNotifications}
            </span>
        </button>
        
        <!-- Dropdown Menu -->
        <div id="notification-dropdown" class="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl shadow-xl py-2 opacity-0 invisible transition-all transform origin-top-right scale-95 z-50">
            <div class="px-4 py-3 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
                <h3 class="font-bold text-[var(--color-text-primary)]">Notifikasi</h3>
                <button onclick="markAllNotificationsRead()" class="text-xs text-primary-600 hover:text-primary-700 font-medium">Tandai semua dibaca</button>
            </div>
            
            <div id="notification-list" class="max-h-96 overflow-y-auto divide-y divide-[var(--color-border-subtle)]">
                <div class="p-8 text-center text-[var(--color-text-tertiary)]">
                    <i class="fas fa-spinner fa-spin mb-2"></i>
                    <p class="text-xs">Memuat...</p>
                </div>
            </div>
            
            <div class="px-4 py-2 border-t border-[var(--color-border-subtle)] text-center">
                <button onclick="viewAllNotifications()" class="text-xs text-[var(--color-text-secondary)] hover:text-primary-600 font-medium">Lihat Semua</button>
            </div>
        </div>
    </div>
    `;
}

// Toggle notification dropdown
window.toggleNotifications = async function () {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;

    // Toggle visibility
    if (dropdown.classList.contains('invisible')) {
        // Show
        dropdown.classList.remove('invisible', 'opacity-0', 'scale-95');
        dropdown.classList.add('visible', 'opacity-100', 'scale-100');

        // Load notifications
        await loadNotifications();

        // Click outside to close
        setTimeout(() => {
            document.addEventListener('click', closeNotificationsOutside);
        }, 0);
    } else {
        // Hide
        closeNotifications();
    }
}

function closeNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
        dropdown.classList.add('invisible', 'opacity-0', 'scale-95');
        dropdown.classList.remove('visible', 'opacity-100', 'scale-100');
    }
    document.removeEventListener('click', closeNotificationsOutside);
}

function closeNotificationsOutside(e) {
    const dropdown = document.getElementById('notification-dropdown');
    const button = dropdown?.previousElementSibling; // The bell button

    if (dropdown && !dropdown.contains(e.target) && !button.contains(e.target)) {
        closeNotifications();
    }
}

// Load notifications list
async function loadNotifications() {
    const list = document.getElementById('notification-list');
    if (!list) return;

    try {
        const res = await api('/notifications?limit=10');
        const notifications = res.data.notifications || [];

        if (notifications.length === 0) {
            list.innerHTML = `
                <div class="p-8 text-center text-[var(--color-text-tertiary)]">
                    <i class="far fa-bell-slash text-2xl mb-2 opacity-50"></i>
                    <p class="text-sm">Tidak ada notifikasi baru</p>
                </div>
            `;
            return;
        }

        list.innerHTML = notifications.map(n => {
            const iconMap = {
                info: 'text-blue-500 fa-info-circle',
                success: 'text-green-500 fa-check-circle',
                warning: 'text-yellow-500 fa-exclamation-triangle',
                error: 'text-red-500 fa-exclamation-circle'
            };

            return `
                <div class="p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer ${n.is_read ? 'opacity-60' : 'bg-primary-50/30'}" onclick="handleNotificationClick(${n.id}, '${n.link || ''}')">
                    <div class="flex gap-3">
                        <div class="mt-1 flex-shrink-0">
                            <i class="fas ${iconMap[n.type] || iconMap.info}"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-[var(--color-text-primary)] ${n.is_read ? '' : 'font-bold'}">${escapeHtml(n.title)}</p>
                            <p class="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">${escapeHtml(n.message)}</p>
                            <p class="text-[10px] text-[var(--color-text-tertiary)] mt-1">${formatTimeAgo(n.created_at)}</p>
                        </div>
                        ${!n.is_read ? `<div class="w-2 h-2 rounded-full bg-primary-500 mt-2"></div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        list.innerHTML = `<div class="p-4 text-center text-red-500 text-sm">Gagal memuat notifikasi</div>`;
    }
}

// Handle notification click
window.handleNotificationClick = async function (id, link) {
    try {
        // Mark as read API call (background)
        api(`/notifications/${id}/read`, { method: 'PUT' }).then(() => {
            fetchUnreadCount();
        });

        closeNotifications();

        if (link) {
            // If internal link
            if (link.startsWith('/')) {
                // remove leading slash for navigate function if needed, depends on router implementation
                // navigate(link.substring(1)); 
                // Using window.location.hash for SPA router usually
                window.location.href = '#' + link;
            } else {
                window.open(link, '_blank');
            }
        }
    } catch (e) {
        console.error(e);
    }
}

// Mark all as read
window.markAllNotificationsRead = async function () {
    try {
        await api('/notifications/read-all', { method: 'PUT' });
        fetchUnreadCount();
        loadNotifications(); // Reload list to show read status
    } catch (e) {
        showToast('Gagal menandai dibaca', 'error');
    }
}

// View all (redirect to a full page if we had one, for now just show toast)
window.viewAllNotifications = function () {
    showToast('Halaman semua notifikasi akan segera hadir!', 'info');
    closeNotifications();
}

// Helper: Format time ago
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Baru saja';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit yang lalu`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam yang lalu`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari yang lalu`;

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
