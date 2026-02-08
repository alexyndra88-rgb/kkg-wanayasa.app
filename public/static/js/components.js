// Reusable UI Components
import { state } from './state.js';
import { escapeHtml, avatar, badge } from './utils.js';

/**
 * Render navigation bar
 */
export function renderNavbar() {
  const isLoggedIn = !!state.user;
  const isAdmin = state.user?.role === 'admin';

  const navLinks = [
    { page: 'home', label: 'Beranda', icon: 'fa-home', public: true },
    { page: 'pengumuman', label: 'Pengumuman', icon: 'fa-bullhorn', public: true },
    { page: 'surat', label: 'Generator Surat', icon: 'fa-file-alt', auth: true },
    { page: 'proker', label: 'Program Kerja', icon: 'fa-tasks', auth: true },
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
    <nav class="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 shadow-xl sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a href="#" onclick="navigate('home'); return false;" class="flex items-center space-x-3 group">
            <div class="bg-white/10 p-2 rounded-xl group-hover:bg-white/20 transition-colors">
              <i class="fas fa-graduation-cap text-yellow-400 text-xl"></i>
            </div>
            <div class="hidden sm:block">
              <div class="text-white font-bold">Portal KKG</div>
              <div class="text-blue-200 text-xs">Gugus 3 Wanayasa</div>
            </div>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden lg:flex items-center space-x-1">
            ${filteredLinks.map(link => `
              <button 
                onclick="navigate('${link.page}')"
                class="nav-link px-3 py-2 rounded-lg text-sm font-medium transition-all ${state.currentPage === link.page
      ? 'bg-white/20 text-white'
      : 'text-blue-100 hover:bg-white/10 hover:text-white'
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
              <!-- User Avatar Dropdown -->
              <div class="relative group">
                <button class="flex items-center space-x-2 bg-white/10 rounded-xl px-3 py-2 hover:bg-white/20 transition-colors">
                  ${avatar(state.user.nama, 'sm', state.user.foto_url)}
                  <span class="hidden sm:block text-white text-sm font-medium max-w-[120px] truncate">
                    ${escapeHtml(state.user.nama)}
                  </span>
                  <i class="fas fa-chevron-down text-white/70 text-xs"></i>
                </button>
                <!-- Dropdown Menu -->
                <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100">
                  <div class="px-4 py-2 border-b border-gray-100">
                    <p class="text-sm font-medium text-gray-800 truncate">${escapeHtml(state.user.nama)}</p>
                    <p class="text-xs text-gray-500 truncate">${escapeHtml(state.user.email)}</p>
                    ${isAdmin ? `<span class="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Admin</span>` : ''}
                  </div>
                  <button onclick="navigate('profile')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <i class="fas fa-user mr-2 text-gray-400"></i>Profil Saya
                  </button>
                  <button onclick="logout()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <i class="fas fa-sign-out-alt mr-2"></i>Keluar
                  </button>
                </div>
              </div>
            ` : `
              <button 
                onclick="navigate('login')"
                class="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-4 py-2 rounded-xl font-medium hover:from-yellow-300 hover:to-orange-400 transition-all shadow-lg"
              >
                <i class="fas fa-sign-in-alt mr-2"></i>Masuk
              </button>
            `}
            
            <!-- Theme Toggle Button -->
            <button 
              onclick="toggleTheme()"
              class="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              <i class="fas fa-moon text-white dark:hidden"></i>
              <i class="fas fa-sun text-yellow-400 hidden dark:inline"></i>
            </button>
            
            <!-- Mobile Menu Button -->
            <button 
              onclick="toggleMobileMenu()"
              class="lg:hidden bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              <i class="fas fa-bars text-white"></i>
            </button>
          </div>
        </div>

        <!-- Mobile Navigation -->
        <div id="mobile-menu" class="lg:hidden hidden pb-4">
          <div class="bg-white/10 rounded-xl p-2 mt-2 space-y-1">
            ${filteredLinks.map(link => `
              <button 
                onclick="navigate('${link.page}'); toggleMobileMenu();"
                class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${state.currentPage === link.page
        ? 'bg-white/20 text-white'
        : 'text-blue-100 hover:bg-white/10 hover:text-white'
      }"
              >
                <i class="fas ${link.icon} mr-3 w-4"></i>
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
    <footer class="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white mt-auto">
      <div class="max-w-7xl mx-auto px-4 py-12">
        <div class="grid md:grid-cols-4 gap-8">
          <!-- About -->
          <div class="md:col-span-2">
            <div class="flex items-center space-x-3 mb-4">
              <div class="bg-white/10 p-2 rounded-xl">
                <i class="fas fa-graduation-cap text-yellow-400 text-xl"></i>
              </div>
              <div>
                <div class="font-bold">Portal Digital KKG</div>
                <div class="text-gray-400 text-sm">Gugus 3 Kecamatan Wanayasa</div>
              </div>
            </div>
            <p class="text-gray-400 text-sm leading-relaxed">
              Platform digital untuk memfasilitasi koordinasi, kolaborasi, dan pengembangan 
              profesional antar guru di lingkungan KKG Gugus 3 Kecamatan Wanayasa, 
              Kabupaten Purwakarta.
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h4 class="font-semibold mb-4">Tautan Cepat</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#" onclick="navigate('pengumuman'); return false;" class="text-gray-400 hover:text-white transition-colors">Pengumuman</a></li>
              <li><a href="#" onclick="navigate('materi'); return false;" class="text-gray-400 hover:text-white transition-colors">Repository Materi</a></li>
              <li><a href="#" onclick="navigate('guru'); return false;" class="text-gray-400 hover:text-white transition-colors">Direktori Guru</a></li>
              <li><a href="#" onclick="navigate('forum'); return false;" class="text-gray-400 hover:text-white transition-colors">Forum Diskusi</a></li>
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="font-semibold mb-4">Kontak</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li class="flex items-start space-x-2">
                <i class="fas fa-map-marker-alt mt-1 text-yellow-400"></i>
                <span>SDN 1 Wanayasa, Kec. Wanayasa, Kab. Purwakarta</span>
              </li>
              <li class="flex items-center space-x-2">
                <i class="fas fa-envelope text-yellow-400"></i>
                <span>admin@kkg-wanayasa.id</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Copyright -->
        <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; ${new Date().getFullYear()} Portal Digital KKG Gugus 3 Wanayasa. All rights reserved.</p>
          <p class="mt-1">Dibuat dengan <i class="fas fa-heart text-red-500"></i> untuk Pendidikan Indonesia</p>
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
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden ${hover ? 'hover:shadow-xl transition-shadow' : ''} ${className}">
      ${header ? `<div class="px-6 py-4 border-b border-gray-100">${header}</div>` : ''}
      <div class="p-6">${content}</div>
      ${footer ? `<div class="px-6 py-4 bg-gray-50 border-t border-gray-100">${footer}</div>` : ''}
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

  const types = {
    primary: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700',
    warning: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-500 hover:to-orange-600',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3 text-lg'
  };

  return `
    <button 
      ${onclick ? `onclick="${onclick}"` : ''}
      ${disabled || loading ? 'disabled' : ''}
      class="inline-flex items-center justify-center ${sizes[size]} ${types[type]} rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}"
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
