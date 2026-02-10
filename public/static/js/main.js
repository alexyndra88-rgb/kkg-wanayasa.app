
// Main Entry Point - KKG Portal Digital
import { state } from './state.js';
import { initRouter, navigate } from './router.js';
import { api } from './api.js';
import { showToast, showLoading, hideLoading, confirm } from './utils.js';

// Components
import { renderNavbar, renderFooter, toggleMobileMenu } from './components.js';

// Theme & Accessibility
import { initTheme, toggleTheme, renderThemeToggle } from './theme.js';
import { initA11y, announce, renderSkipLinks } from './a11y.js';

// Pages
import { renderHome } from './pages/home.js';
import { renderLogin, initAuth } from './pages/auth.js';
import { renderProfile } from './pages/profile.js';
import { renderSurat } from './pages/surat.js';
import { renderProker } from './pages/proker.js';
import { renderAbsensi } from './pages/absensi.js';
import { renderMateri } from './pages/materi.js';
import { renderGuru } from './pages/guru.js';
import { renderForum } from './pages/forum.js';
import { renderPengumuman } from './pages/pengumuman.js';
import { renderAdmin } from './pages/admin.js';
import { renderResetPassword, initResetPassword } from './pages/reset-password.js';
import { renderKalender, initKalender } from './pages/kalender.js';
import { renderLaporan } from './pages/laporan.js';

// Global exports for inline HTML onclick handlers
window.navigate = navigate;
window.toggleMobileMenu = toggleMobileMenu;
window.showToast = showToast;
window.confirm = confirm;
window.toggleTheme = toggleTheme;

// Initialize database (first-time setup)
window.initDb = async function () {
    if (!await confirm('Ini akan menginisialisasi database. Lanjutkan?')) return;

    showLoading('Menginisialisasi database...');
    try {
        const res = await api('/init-db');
        showToast(res.message || 'Database berhasil diinisialisasi!', 'success');
        // Refresh the page to reload user data
        window.location.reload();
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        hideLoading();
    }
};

// Page registry
const pages = {
    home: renderHome,
    login: renderLogin,
    profile: renderProfile,
    surat: renderSurat,
    proker: renderProker,
    absensi: renderAbsensi,
    materi: renderMateri,
    guru: renderGuru,
    forum: renderForum,
    pengumuman: renderPengumuman,
    admin: renderAdmin,
    kalender: renderKalender,
    'reset-password': renderResetPassword,
    laporan: renderLaporan,
};

// Protected pages (require authentication)
const protectedPages = ['surat', 'proker', 'absensi', 'profile'];
const adminPages = ['admin'];

// Main Render Function
async function render() {
    const app = document.getElementById('app');
    if (!app) return;

    let content = '';
    const page = state.currentPage;

    try {
        // Check authentication for protected pages
        if (protectedPages.includes(page) && !state.user) {
            showToast('Silakan login terlebih dahulu', 'warning');
            // announce disabled
            navigate('login');
            return;
        }

        // Check admin role for admin pages
        if (adminPages.includes(page) && state.user?.role !== 'admin') {
            showToast('Halaman ini hanya untuk admin', 'error');
            // announce disabled
            navigate('home');
            return;
        }

        // Get page renderer
        const pageRenderer = pages[page] || pages.home;

        // Render page (may be async)
        content = await pageRenderer();

        // Announce page change to screen readers
        const pageTitles = {
            home: 'Beranda',
            login: 'Halaman Login',
            profile: 'Profil Saya',
            surat: 'Generator Surat',
            proker: 'Program Kerja',
            absensi: 'Absensi',
            materi: 'Materi Pembelajaran',
            guru: 'Direktori Guru',
            forum: 'Forum Diskusi',
            pengumuman: 'Pengumuman',
            admin: 'Panel Admin',
            'reset-password': 'Reset Password',
            laporan: 'Laporan Kegiatan'
        };
        // announce disabled

        // Initialize page-specific logic
        if (page === 'reset-password') {
            setTimeout(() => initResetPassword(), 100);
        }

    } catch (e) {
        console.error('Render error:', e);
        content = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
            <i class="fas fa-exclamation-triangle text-4xl text-red-500" aria-hidden="true"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Terjadi Kesalahan</h2>
          <p class="text-gray-600 dark:text-gray-300 mb-6">${e.message || 'Gagal memuat halaman'}</p>
          <button onclick="navigate('home')" class="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
            <i class="fas fa-home mr-2" aria-hidden="true"></i>Kembali ke Beranda
          </button>
        </div>
      </div>
    `;
    }

    // Build final HTML
    const isAuthPage = page === 'login' || page === 'reset-password';


    if (isAuthPage) {
        // Auth pages have their own layout
        app.innerHTML = `
      ${content}
    `;
    } else {
        // Normal pages with navbar and footer
        app.innerHTML = `
      ${renderNavbar()}
      <main id="main-content" class="min-h-screen bg-gray-50" tabindex="-1">${content}</main>
      ${renderFooter()}
    `;
    }

    // Scroll to top on page change
    window.scrollTo(0, 0);

    // Initialize Auth page
    if (page === 'login') {
        // Use timeout to ensure DOM is ready
        setTimeout(() => initAuth(), 50);
    }
}

// Initialize Router with Render function
initRouter(render);

// Register Service Worker for PWA
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            // Force update check on every page load
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none' // Never use browser cache for SW file itself
            });
            console.log('✅ Service Worker registered:', registration.scope);

            // Check for updates immediately
            registration.update().catch(() => { });

            // Listen for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available - tell it to activate immediately
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                        console.log('🔄 New Service Worker version installed, activating...');
                    }
                });
            });

            // Listen for controller change (new SW took over)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('🔄 New Service Worker active, refreshing...');
                // Auto-reload to use new cached resources
                if (!window._swReloaded) {
                    window._swReloaded = true;
                    window.location.reload();
                }
            });

            // Listen for messages from SW
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'SW_UPDATED') {
                    console.log(`✅ Service Worker updated to ${event.data.version}`);
                }
            });

        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

// Utility: Clear all caches (accessible from console: clearAllCaches())
window.clearAllCaches = async function () {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({ type: 'CLEAR_CACHE' });
    }
    // Also clear browser Cache Storage directly
    if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
    }
    console.log('🗑️ All caches cleared. Reloading...');
    showToast('Cache dibersihkan! Halaman akan dimuat ulang...', 'success');
    setTimeout(() => window.location.reload(), 1000);
};

// App Initialization
async function init() {
    console.log('🚀 Initializing KKG Portal...');

    // Initialize Theme, Accessibility, and PWA
    initTheme();
    initA11y();
    registerServiceWorker();

    // Check existing session
    try {
        const res = await api('/auth/me');
        if (res.success && res.data?.user) {
            state.user = res.data.user;
            console.log('✅ User session restored:', state.user.nama);
        }
    } catch (e) {
        // Not logged in or session expired, that's fine
        console.log('ℹ️ No active session');
    }

    // Initialize CSRF token if not present
    const csrfCookie = document.cookie.split(';').find(c => c.trim().startsWith('csrf_token='));
    if (!csrfCookie) {
        try {
            await fetch('/api/auth/csrf-token', { credentials: 'include' });
            console.log('✅ CSRF token initialized');
        } catch (e) {
            console.warn('⚠️ Failed to initialize CSRF token');
        }
    }

    // Load Public Settings
    try {
        const resSettings = await api('/settings/public');
        if (resSettings.success && resSettings.data) {
            state.settings = { ...state.settings, ...resSettings.data };
            console.log('✅ Settings loaded');
        }
    } catch (e) {
        console.warn('⚠️ Failed to load settings:', e);
    }

    // Parse initial URL
    const path = window.location.pathname.slice(1);
    const validPages = Object.keys(pages);

    if (path && validPages.includes(path)) {
        state.currentPage = path;
    } else {
        state.currentPage = 'home';
    }

    // Initial render
    await render();

    console.log('✅ KKG Portal initialized');
}

// Start the app
init().catch(console.error);

