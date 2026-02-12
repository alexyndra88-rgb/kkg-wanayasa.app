
// Main Entry Point - KKG Portal Digital
import { state } from './state.js';
import { initRouter, navigate } from './router.js';
import { api } from './api.js';
import { showToast, showLoading, hideLoading, confirm, avatar, escapeHtml } from './utils.js';

// Components
import { renderNavbar, renderFooter, toggleMobileMenu } from './components.js';

// Theme & Accessibility
import { initTheme, toggleTheme, renderThemeToggle } from './theme.js';
import { initA11y, announce, renderSkipLinks } from './a11y.js';

// Pages
// Pages are now loaded dynamically

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
// Page registry with Dynamic Imports
const pages = {
  home: async () => (await import('./pages/home.js')).renderHome(),
  login: async () => (await import('./pages/auth.js')).renderLogin(),
  profile: async () => (await import('./pages/profile.js')).renderProfile(),
  surat: async () => (await import('./pages/surat.js')).renderSurat(),
  proker: async () => (await import('./pages/proker.js')).renderProker(),
  absensi: async () => (await import('./pages/absensi.js')).renderAbsensi(),
  materi: async () => (await import('./pages/materi.js')).renderMateri(),
  guru: async () => (await import('./pages/guru.js')).renderGuru(),
  forum: async () => (await import('./pages/forum.js')).renderForum(),
  pengumuman: async () => (await import('./pages/pengumuman.js')).renderPengumuman(),
  admin: async () => (await import('./pages/admin.js')).renderAdmin(),
  kalender: async () => (await import('./pages/kalender.js')).renderKalender(),
  'reset-password': async () => (await import('./pages/reset-password.js')).renderResetPassword(),
  laporan: async () => (await import('./pages/laporan.js')).renderLaporan(),
};

// Protected pages (require authentication)
const protectedPages = ['surat', 'proker', 'absensi', 'profile'];
const adminPages = ['admin'];

// Navigation Links Configuration
const navLinks = [
  { page: 'home', label: 'Beranda', icon: 'fa-home', public: true },
  { page: 'pengumuman', label: 'Pengumuman', icon: 'fa-bullhorn', public: true },
  { page: 'surat', label: 'Generator Surat', icon: 'fa-file-alt', admin: true },
  { page: 'proker', label: 'Program Kerja', icon: 'fa-tasks', admin: true },
  { page: 'laporan', label: 'Laporan KKG', icon: 'fa-file-contract', admin: true },
  { page: 'absensi', label: 'Absensi', icon: 'fa-clipboard-check', auth: true },
  { page: 'kalender', label: 'Kalender', icon: 'fa-calendar-alt', public: true },
  { page: 'materi', label: 'Materi', icon: 'fa-book-open', public: true },
  { page: 'guru', label: 'Direktori Guru', icon: 'fa-users', public: true },
  { page: 'forum', label: 'Forum', icon: 'fa-comments', public: true },
  { page: 'admin', label: 'Panel Admin', icon: 'fa-cog', admin: true },
];

function renderNavLinks(activePage) {
  const isLoggedIn = !!state.user;
  const isAdmin = state.user?.role === 'admin';

  return navLinks.filter(link => {
    if (link.public) return true;
    if (link.auth && isLoggedIn) return true;
    if (link.admin && isAdmin) return true;
    return false;
  }).map(link => {
    const isActive = activePage === link.page;
    return `
      <button 
        onclick="navigate('${link.page}'); if(window.innerWidth < 768) toggleMobileMenu();"
        class="w-full text-left px-4 py-3 rounded-xl mb-1 flex items-center transition-all duration-300 group relative overflow-hidden ${isActive
        ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25 ring-1 ring-white/10'
        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-primary-600 dark:hover:text-primary-400'
      }"
      >
        <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <span class="w-8 h-8 flex items-center justify-center rounded-lg mr-3 transition-colors duration-300 relative z-10 ${isActive
        ? 'bg-white/20 text-white'
        : 'bg-[var(--color-bg-tertiary)] group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 text-[var(--color-text-tertiary)] group-hover:text-primary-600 dark:group-hover:text-primary-400'
      }">
            <i class="fas ${link.icon}"></i>
        </span>
        <span class="font-medium relative z-10 tracking-wide">${link.label}</span>
        ${isActive ? '<i class="fas fa-chevron-right ml-auto text-xs opacity-80 relative z-10"></i>' : ''}
      </button>
    `;
  }).join('');
}

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
      const { initResetPassword } = await import('./pages/reset-password.js');
      setTimeout(() => initResetPassword(), 100);
    }
    if (page === 'kalender') {
      const { initKalender } = await import('./pages/kalender.js');
      if (initKalender) setTimeout(() => initKalender(), 100);
    }

  } catch (e) {
    console.error('Render error:', e);
    content = `
      <div class="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-primary)] p-4 text-center animate-fade-in">
        <div class="relative mb-8">
          <div class="w-32 h-32 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center z-10 relative">
             <i class="fas fa-exclamation-triangle text-5xl text-red-500"></i>
          </div>
          <div class="absolute top-0 left-0 w-full h-full bg-red-500/10 rounded-full blur-xl animate-pulse"></div>
        </div>
        
        <h2 class="text-3xl font-display font-bold text-[var(--color-text-primary)] mb-3">Terjadi Kesalahan</h2>
        <p class="text-[var(--color-text-secondary)] mb-8 max-w-md leading-relaxed">
          Maaf, kami tidak dapat memuat halaman yang Anda minta. <br>
          <span class="text-xs font-mono bg-[var(--color-bg-tertiary)] px-2 py-1 rounded mt-2 inline-block shadow-sm">${e.message || 'Unknown Error'}</span>
        </p>
        
        <div class="flex gap-4">
          <button onclick="window.location.reload()" class="btn bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-[var(--color-text-primary)] hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm">
            <i class="fas fa-sync-alt mr-2"></i>Muat Ulang
          </button>
          <button onclick="navigate('home')" class="btn btn-primary">
            <i class="fas fa-home mr-2"></i>Ke Beranda
          </button>
        </div>
      </div>
    `;
  }

  // Build final HTML
  const isAuthPage = page === 'login' || page === 'reset-password';


  if (isAuthPage) {
    // Auth pages have their own layout (can be styled separately)
    app.innerHTML = `
      ${content}
    `;
  } else {
    // Main layout
    app.innerHTML = `
      <div class="flex h-screen bg-[var(--color-bg-secondary)] transition-colors duration-500">
        <!-- Sidebar (Desktop) -->
        <aside class="hidden md:flex flex-col w-72 bg-[var(--color-bg-elevated)] border-r border-[var(--color-border-subtle)] shadow-xl shadow-slate-200/50 dark:shadow-none z-30">
          <div class="p-6 flex items-center gap-3">
             <div class="relative">
                <div class="absolute inset-0 bg-primary-500 blur-lg opacity-20 rounded-full"></div>
                ${state.settings?.logo_url
        ? `<img src="${state.settings.logo_url}" class="h-10 w-10 object-contain relative z-10 transition-transform hover:scale-110">`
        : '<i class="fas fa-shapes text-3xl text-primary-600 relative z-10"></i>'
      }
             </div>
             <div>
                <span class="block text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-500">KKG Portal</span>
                <span class="block text-xs font-medium text-[var(--color-text-tertiary)] tracking-wider uppercase">Gugus 3 Wanayasa</span>
             </div>
          </div>

          <nav class="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar py-4">
            ${renderNavLinks(page)}
          </nav>

          <div class="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)]/30 backdrop-blur-sm">
            ${state.user ? `
              <div class="group relative bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-2xl p-3 mb-3 cursor-pointer hover:border-primary-300 transition-colors shadow-sm card-hover">
                  <div class="flex items-center gap-3">
                    ${avatar(state.user.nama, 'sm')}
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-[var(--color-text-primary)] truncate group-hover:text-primary-600 transition-colors">${escapeHtml(state.user.nama)}</p>
                        <p class="text-xs text-[var(--color-text-secondary)] truncate">${escapeHtml(state.user.role)}</p>
                    </div>
                  </div>
              </div>
              <button onclick="logout()" class="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group">
                <i class="fas fa-sign-out-alt w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"></i>
                <span>Keluar Aplikasi</span>
              </button>
            ` : `
              <button onclick="navigate('login')" class="btn btn-primary w-full shadow-lg shadow-primary-500/30">
                <i class="fas fa-sign-in-alt mr-2"></i>
                <span>Masuk Akun</span>
              </button>
            `}
          </div>
        </aside>

        <!-- Mobile Header & Main Content -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <!-- Mobile Header -->
          <header class="md:hidden glass sticky top-0 z-40 border-b border-[var(--color-border-subtle)] px-4 py-3 flex items-center justify-between">
             <div class="flex items-center gap-3">
                ${state.settings?.logo_url ? `<img src="${state.settings.logo_url}" class="h-8 w-8 object-contain">` : '<i class="fas fa-shapes text-2xl text-primary-600"></i>'}
                <span class="font-display font-bold text-lg text-[var(--color-text-primary)]">KKG Portal</span>
             </div>
            <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors">
              <i class="fas fa-bars text-xl"></i>
            </button>
          </header>

          <!-- Main Content Area -->
          <main class="flex-1 overflow-y-auto scroll-smooth flex flex-col relative" id="main-content">
            <!-- Background Decoration -->
            <div class="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/10 pointer-events-none z-0"></div>
            
            <div class="max-w-7xl mx-auto w-full p-4 md:p-8 animate-fade-in flex-1 z-10 relative">
              ${content}
            </div>
            <!-- Footer (Home Only) -->
            ${page === 'home' ? renderFooter() : ''}
          </main>
        </div>

        <!-- Mobile Menu Overlay -->
        <div id="mobile-menu" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in" onclick="this.classList.add('hidden')">
          <div class="bg-[var(--color-bg-elevated)] w-72 h-full shadow-2xl p-6 flex flex-col transform transition-transform animate-slide-in-left" onclick="event.stopPropagation()">
            <div class="flex justify-between items-center mb-8">
              <div>
                 <span class="text-xl font-display font-bold text-[var(--color-text-primary)]">Navigasi</span>
                 <p class="text-xs text-[var(--color-text-tertiary)]">Portal KKG Gugus 3</p>
              </div>
              <button onclick="document.getElementById('mobile-menu').classList.add('hidden')" class="p-2 bg-[var(--color-bg-tertiary)] rounded-full text-[var(--color-text-secondary)]"><i class="fas fa-times"></i></button>
            </div>
            <nav class="space-y-1 flex-1 overflow-y-auto">
              ${renderNavLinks(page)}
            </nav>
            <div class="pt-6 border-t border-[var(--color-border-subtle)]">
                ${state.user ? `
                  <div class="flex items-center gap-3 mb-4 p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                      ${avatar(state.user.nama, 'sm')}
                      <div class="min-w-0">
                          <p class="text-sm font-bold text-[var(--color-text-primary)] truncate">${escapeHtml(state.user.nama)}</p>
                      </div>
                  </div>
                ` : ''}
                <button onclick="logout()" class="btn w-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                  <i class="fas fa-sign-out-alt w-5 mr-2"></i> Keluar
                </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }


  // Scroll to top on page change
  window.scrollTo(0, 0);

  // Initialize Auth page
  if (page === 'login') {
    // Use timeout to ensure DOM is ready
    setTimeout(async () => {
      const { initAuth } = await import('./pages/auth.js');
      initAuth();
    }, 50);
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
  const updateStatus = (msg) => {
    const el = document.getElementById('loading-status');
    if (el) el.textContent = msg;
    console.log(msg);
  };

  updateStatus('🚀 Initializing KKG Portal...');

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

  updateStatus('Checking CSRF Token...');

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

  updateStatus('Loading Page Content...');

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
init().catch(e => {
  console.error(e);
  const el = document.getElementById('loading-status');
  if (el) {
    el.textContent = 'Error: ' + e.message;
    el.classList.add('text-red-500');
  }
});

