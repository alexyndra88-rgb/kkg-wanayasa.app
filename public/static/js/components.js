// Reusable UI Components
import { state } from './state.js';
import { escapeHtml, avatar, badge } from './utils.js';

/**
 * Render navigation bar
 */
export function renderNavbar() {
  // Navbar is mostly replaced by Sidebar in main.js layouts, 
  // but kept here for fallback or specific layouts if needed.
  // We'll update it to match the new design system just in case.
  const isLoggedIn = !!state.user;
  const isAdmin = state.user?.role === 'admin';

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
    { page: 'admin', label: 'Admin', icon: 'fa-cog', admin: true },
  ];

  const filteredLinks = navLinks.filter(link => {
    if (link.public) return true;
    if (link.auth && isLoggedIn) return true;
    if (link.admin && isAdmin) return true;
    return false;
  });

  return `
    <nav class="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)] sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a href="#" onclick="navigate('home'); return false;" class="flex items-center space-x-3 group">
            <div class="w-8 h-8 flex items-center justify-center bg-primary-50 dark:bg-primary-900/30 rounded-lg text-primary-600">
              <i class="fas fa-shapes"></i>
            </div>
            <div class="hidden sm:block">
              <div class="font-display font-bold text-[var(--color-text-primary)]">Portal KKG</div>
              <div class="text-[var(--color-text-tertiary)] text-xs">Gugus 3 Wanayasa</div>
            </div>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden lg:flex items-center space-x-1">
            ${filteredLinks.map(link => `
              <button 
                onclick="navigate('${link.page}')"
                class="px-3 py-2 rounded-lg text-sm font-medium transition-all ${state.currentPage === link.page
      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
    }"
              >
                <i class="fas ${link.icon} mr-1.5 text-xs"></i>
                ${link.label}
              </button>
            `).join('')}
          </div>

          <!-- User Menu -->
          <div class="flex items-center space-x-3">
            ${isLoggedIn ? `
              <div class="relative group">
                <button class="flex items-center space-x-2 p-1 pr-3 rounded-full hover:bg-[var(--color-bg-tertiary)] transition-colors border border-transparent hover:border-[var(--color-border-subtle)]">
                  ${avatar(state.user.nama, 'sm', state.user.foto_url)}
                  <span class="hidden sm:block text-[var(--color-text-primary)] text-sm font-medium max-w-[120px] truncate">
                    ${escapeHtml(state.user.nama)}
                  </span>
                  <i class="fas fa-chevron-down text-[var(--color-text-tertiary)] text-xs"></i>
                </button>
                <div class="absolute right-0 top-full mt-2 w-56 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 z-50">
                  <div class="px-4 py-3 border-b border-[var(--color-border-subtle)]">
                    <p class="text-sm font-bold text-[var(--color-text-primary)] truncate">${escapeHtml(state.user.nama)}</p>
                    <p class="text-xs text-[var(--color-text-secondary)] truncate">${escapeHtml(state.user.email)}</p>
                    ${isAdmin ? `<span class="inline-block mt-1.5 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-bold uppercase tracking-wider rounded-full">Administrator</span>` : ''}
                  </div>
                  <button onclick="navigate('profile')" class="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-primary-600 flex items-center gap-2">
                    <i class="fas fa-user w-4"></i>Profil Saya
                  </button>
                  <button onclick="logout()" class="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2">
                    <i class="fas fa-sign-out-alt w-4"></i>Keluar
                  </button>
                </div>
              </div>
            ` : `
              <button onclick="navigate('login')" class="btn btn-primary text-sm px-4 py-2 shadow-lg shadow-primary-500/20">
                <i class="fas fa-sign-in-alt mr-2"></i>Masuk
              </button>
            `}
            
            <button onclick="toggleTheme()" class="theme-toggle" aria-label="Toggle dark mode">
              <i class="fas fa-moon text-[var(--color-text-secondary)] dark:hidden"></i>
              <i class="fas fa-sun text-yellow-400 hidden dark:inline"></i>
            </button>
            
            <button onclick="toggleMobileMenu()" class="lg:hidden p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
              <i class="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>

        <!-- Mobile Navigation -->
        <div id="mobile-menu" class="lg:hidden hidden pb-4 border-t border-[var(--color-border-subtle)] mt-2 pt-2 animate-fade-in">
          <div class="space-y-1">
            ${filteredLinks.map(link => `
              <button 
                onclick="navigate('${link.page}'); toggleMobileMenu();"
                class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${state.currentPage === link.page
        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
      }"
              >
                <i class="fas ${link.icon} mr-3 w-5 text-center"></i>
                ${link.label}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </nav>
  `;
}

/**
 * Toggle mobile menu visibility
 */
export function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

/**
 * Render footer
 */
export function renderFooter() {
  return `
    <footer class="bg-[var(--color-bg-elevated)] border-t border-[var(--color-border-subtle)] mt-auto text-[var(--color-text-secondary)]">
      <div class="max-w-7xl mx-auto px-4 py-12">
        <div class="grid md:grid-cols-4 gap-8">
          <!-- About -->
          <div class="md:col-span-2">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600">
                <i class="fas fa-shapes text-xl"></i>
              </div>
              <div>
                <div class="font-display font-bold text-[var(--color-text-primary)] text-lg">Portal KKG</div>
                <div class="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">Gugus 3 Kecamatan Wanayasa</div>
              </div>
            </div>
            <p class="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-md">
              Platform kolaborasi digital untuk memfasilitasi koordinasi, pengembangan kompetensi, dan sinergi antar guru untuk kemajuan pendidikan Indonesia.
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h4 class="font-bold text-[var(--color-text-primary)] mb-4">Tautan Cepat</h4>
            <ul class="space-y-2.5 text-sm">
              <li><button onclick="navigate('pengumuman')" class="hover:text-primary-600 transition-colors flex items-center gap-2"><i class="fas fa-angle-right text-xs opacity-50"></i> Pengumuman</button></li>
              <li><button onclick="navigate('materi')" class="hover:text-primary-600 transition-colors flex items-center gap-2"><i class="fas fa-angle-right text-xs opacity-50"></i> Repository Materi</button></li>
              <li><button onclick="navigate('guru')" class="hover:text-primary-600 transition-colors flex items-center gap-2"><i class="fas fa-angle-right text-xs opacity-50"></i> Direktori Guru</button></li>
              <li><button onclick="navigate('forum')" class="hover:text-primary-600 transition-colors flex items-center gap-2"><i class="fas fa-angle-right text-xs opacity-50"></i> Forum Diskusi</button></li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="font-bold text-[var(--color-text-primary)] mb-4">Hubungi Kami</h4>
            <ul class="space-y-3 text-sm">
              <li class="flex items-start gap-3">
                <i class="fas fa-map-marker-alt mt-1 text-primary-500"></i>
                <span>${escapeHtml(state.settings?.alamat_sekretariat || 'SDN 1 Wanayasa, Jl. Raya Wanayasa No. 12, Purwakarta')}</span>
              </li>
              <li class="flex items-center gap-3">
                <i class="fas fa-envelope text-primary-500"></i>
                <span>${escapeHtml(state.settings?.email || 'sekretariat@kkg-wanayasa.id')}</span>
              </li>
              <li class="flex items-center gap-3">
                <i class="fab fa-whatsapp text-primary-500"></i>
                <span>+62 812-3456-7890</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Copyright -->
        <div class="border-t border-[var(--color-border-subtle)] mt-10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-[var(--color-text-tertiary)]">
          <p>&copy; ${new Date().getFullYear()} KKG Gugus 3 Wanayasa. All rights reserved.</p>
          <div class="flex items-center gap-1 mt-2 md:mt-0">
             <span>Made with</span>
             <i class="fas fa-heart text-red-500 animate-pulse"></i>
             <span>for Education</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}

/**
 * Page header component
 */
export function pageHeader(title, subtitle = '', actions = '') {
  return `
    <div class="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white py-12 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-3xl font-bold mb-2">${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="text-blue-200">${escapeHtml(subtitle)}</p>` : ''}
          </div>
          ${actions ? `<div class="mt-4 md:mt-0">${actions}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Card component
 */
export function card(content, options = {}) {
  const { className = '', header = '', footer = '', hover = false } = options;
  return `
    <div class="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-2xl shadow-sm overflow-hidden ${hover ? 'hover:shadow-lg hover:border-primary-300 transition-all duration-300' : ''} ${className}">
      ${header ? `<div class="px-6 py-4 border-b border-[var(--color-border-subtle)] font-bold text-[var(--color-text-primary)]">${header}</div>` : ''}
      <div class="p-6 text-[var(--color-text-primary)]">${content}</div>
      ${footer ? `<div class="px-6 py-4 bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border-subtle)]">${footer}</div>` : ''}
    </div>
  `;
}

/**
 * Stat card component
 */
export function statCard(icon, label, value, color = 'blue') {
  const colors = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    purple: 'from-purple-500 to-pink-600',
    orange: 'from-orange-500 to-red-500',
    teal: 'from-teal-500 to-cyan-600'
  };

  return `
    <div class="bg-gradient-to-br ${colors[color] || colors.blue} rounded-2xl p-6 text-white shadow-lg">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-white/80 text-sm font-medium">${escapeHtml(label)}</p>
          <p class="text-3xl font-bold mt-1">${escapeHtml(String(value))}</p>
        </div>
        <div class="bg-white/20 p-3 rounded-xl">
          <i class="fas ${icon} text-2xl"></i>
        </div>
      </div>
    </div>
  `;
}

/**
 * Tab component
 */
export function tabs(items, activeTab, onTabClick = 'setActiveTab') {
  return `
    <div class="flex space-x-1 bg-gray-100 rounded-xl p-1">
      ${items.map(item => `
        <button 
          onclick="${onTabClick}('${item.id}')"
          class="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all text-sm ${activeTab === item.id
      ? 'bg-white text-gray-800 shadow-sm'
      : 'text-gray-500 hover:text-gray-700'
    }"
        >
          ${item.icon ? `<i class="fas ${item.icon} mr-2"></i>` : ''}
          ${escapeHtml(item.label)}
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Search input component
 */
export function searchInput(placeholder = 'Cari...', onInput = 'handleSearch', value = '') {
  return `
    <div class="relative">
      <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
        <i class="fas fa-search"></i>
      </span>
      <input 
        type="text" 
        placeholder="${escapeHtml(placeholder)}"
        value="${escapeHtml(value)}"
        oninput="${onInput}(this.value)"
        class="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
      />
    </div>
  `;
}

/**
 * Button component
 */
export function button(label, options = {}) {
  const {
    type = 'primary',
    icon = '',
    size = 'md',
    onclick = '',
    disabled = false,
    loading = false,
    className = ''
  } = options;

  const typeClasses = {
    primary: 'btn-primary',
    secondary: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-strong)]',
    success: 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-500/20',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20',
    warning: 'bg-amber-400 text-black hover:bg-amber-500 shadow-md shadow-amber-400/20',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-primary-600'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base'
  };

  return `
    <button 
      ${onclick ? `onclick="${onclick}"` : ''}
      ${disabled || loading ? 'disabled' : ''}
      class="btn ${sizeClasses[size]} ${typeClasses[type]} ${className} disabled:opacity-50 disabled:cursor-not-allowed"
    >
      ${loading ? '<i class="fas fa-spinner fa-spin mr-2"></i>' : (icon ? `<i class="fas ${icon} mr-2"></i>` : '')}
      ${escapeHtml(label)}
    </button>
  `;
}

/**
 * Alert component
 */
export function alert(message, type = 'info', dismissible = false) {
  const types = {
    info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: 'fa-info-circle text-blue-500' },
    success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', icon: 'fa-check-circle text-green-500' },
    warning: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', icon: 'fa-exclamation-triangle text-yellow-500' },
    error: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: 'fa-exclamation-circle text-red-500' }
  };

  const style = types[type] || types.info;

  return `
    <div class="${style.bg} border ${style.text} rounded-xl p-4 flex items-start space-x-3">
      <i class="fas ${style.icon} mt-0.5"></i>
      <div class="flex-1">${escapeHtml(message)}</div>
      ${dismissible ? `<button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>` : ''}
    </div>
  `;
}
