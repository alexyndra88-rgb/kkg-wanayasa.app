// Utility functions for the KKG Portal

/**
 * Show toast notification
 */
export function showToast(message, type = 'info') {
  // Remove existing toasts
  document.querySelectorAll('.toast-notification').forEach(t => t.remove());

  const bgColors = {
    success: 'bg-gradient-to-r from-green-500 to-emerald-600',
    error: 'bg-gradient-to-r from-red-500 to-rose-600',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    info: 'bg-gradient-to-r from-blue-500 to-indigo-600'
  };

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  const toast = document.createElement('div');
  toast.className = `toast-notification fixed top-4 right-4 z-[9999] ${bgColors[type] || bgColors.info} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 transform translate-x-full opacity-0 transition-all duration-300 max-w-md`;
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info} text-xl flex-shrink-0"></i>
    <span class="text-sm font-medium">${escapeHtml(message)}</span>
    <button onclick="this.parentElement.remove()" class="ml-2 text-white/80 hover:text-white flex-shrink-0">
      <i class="fas fa-times"></i>
    </button>
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format date and time to Indonesian locale
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format relative time (e.g., "2 jam yang lalu")
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(str) {
  if (!str) return '';
  if (typeof str !== 'string') str = String(str);
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Convert newlines to br tags (with HTML escaping)
 */
export function nl2br(str) {
  return escapeHtml(str).replace(/\n/g, '<br>');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str, length = 100) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length).trim() + '...';
}

/**
 * Debounce function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Loading spinner component
 */
export function createSpinner(size = 'md') {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  return `
    <div class="flex justify-center items-center p-8">
      <div class="${sizes[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  `;
}

/**
 * Full page loading overlay
 */
export function showLoading(message = 'Memuat...') {
  // Remove existing overlay
  hideLoading();

  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center';
  overlay.innerHTML = `
    <div class="bg-white rounded-2xl p-8 shadow-2xl text-center">
      <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-gray-600 font-medium">${escapeHtml(message)}</p>
    </div>
  `;
  document.body.appendChild(overlay);
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.remove();
}

/**
 * Empty state component
 */
export function emptyState(icon = 'fa-inbox', title = 'Tidak ada data', subtitle = '') {
  return `
    <div class="text-center py-16">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
        <i class="fas ${icon} text-4xl text-gray-400"></i>
      </div>
      <h3 class="text-xl font-medium text-gray-600 mb-2">${escapeHtml(title)}</h3>
      ${subtitle ? `<p class="text-gray-400">${escapeHtml(subtitle)}</p>` : ''}
    </div>
  `;
}

/**
 * Skeleton loader for list items
 */
export function skeletonList(count = 3) {
  return Array(count).fill(`
    <div class="animate-pulse bg-white rounded-xl p-4 mb-3">
      <div class="flex space-x-4">
        <div class="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Skeleton loader for cards
 */
export function skeletonCards(count = 3) {
  return Array(count).fill(`
    <div class="animate-pulse bg-white rounded-xl p-6">
      <div class="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
      <div class="space-y-2">
        <div class="h-3 bg-gray-200 rounded"></div>
        <div class="h-3 bg-gray-200 rounded w-5/6"></div>
        <div class="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  `).join('');
}

/**
 * Confirmation dialog
 */
export function confirm(message, title = 'Konfirmasi') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full transform scale-95 opacity-0 transition-all duration-200">
        <h3 class="text-lg font-bold text-gray-800 mb-2">${escapeHtml(title)}</h3>
        <p class="text-gray-600 mb-6">${escapeHtml(message)}</p>
        <div class="flex space-x-3">
          <button id="confirm-cancel" class="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
            Batal
          </button>
          <button id="confirm-ok" class="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors">
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.querySelector('div').classList.remove('scale-95', 'opacity-0');
    });

    const cleanup = (result) => {
      overlay.querySelector('div').classList.add('scale-95', 'opacity-0');
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    };

    overlay.querySelector('#confirm-cancel').onclick = () => cleanup(false);
    overlay.querySelector('#confirm-ok').onclick = () => cleanup(true);
    overlay.onclick = (e) => {
      if (e.target === overlay) cleanup(false);
    };
  });
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Berhasil disalin ke clipboard', 'success');
    return true;
  } catch {
    showToast('Gagal menyalin ke clipboard', 'error');
    return false;
  }
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Generate avatar initials
 */
export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

/**
 * Generate avatar color from name
 */
export function getAvatarColor(name) {
  if (!name) return 'bg-gray-400';
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

/**
 * Avatar component
 */
export function avatar(name, size = 'md', imageUrl = null) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl'
  };

  if (imageUrl) {
    return `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" class="${sizes[size]} rounded-full object-cover" />`;
  }

  return `
    <div class="${sizes[size]} ${getAvatarColor(name)} rounded-full flex items-center justify-center text-white font-bold">
      ${getInitials(name)}
    </div>
  `;
}

/**
 * Badge component
 */
export function badge(text, type = 'default') {
  const styles = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-cyan-100 text-cyan-700'
  };

  return `<span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles[type] || styles.default}">${escapeHtml(text)}</span>`;
}

/**
 * Get query parameters from URL
 */
export function getQueryParams() {
  const params = {};
  const hash = window.location.hash;
  const queryStart = hash.indexOf('?');

  if (queryStart !== -1) {
    const queryString = hash.substring(queryStart + 1);
    const pairs = queryString.split('&');

    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    });
  }

  return params;
}

