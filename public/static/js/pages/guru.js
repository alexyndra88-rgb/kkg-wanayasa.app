
import { api } from '../api.js';
import { state } from '../state.js';
import { escapeHtml } from '../utils.js';

export async function renderGuru() {
  let guruList = [];
  try {
    const res = await api('/guru');
    guruList = res.data || [];
  } catch (e) {
    console.error(e);
  }

  return `
  <div class="fade-in max-w-7xl mx-auto py-8 px-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-display font-bold text-[var(--color-text-primary)]">
          <i class="fas fa-users text-primary-500 mr-3"></i>Direktori Guru
        </h1>
        <p class="text-[var(--color-text-secondary)] mt-2">Daftar lengkap anggota KKG Gugus 3 Wanayasa</p>
      </div>
    </div>

    ${!state.user ? `
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 mb-8 flex items-start gap-4 fade-in">
      <div class="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-xl text-blue-600 dark:text-blue-300">
        <i class="fas fa-info-circle text-xl"></i>
      </div>
      <div>
        <h3 class="text-blue-800 dark:text-blue-200 font-bold text-lg mb-1">Akses Terbatas</h3>
        <p class="text-blue-600 dark:text-blue-300">
          Demi privasi dan keamanan data, informasi detail seperti NIP dan Nomor Kontak hanya ditampilkan untuk anggota KKG yang telah terverifikasi.
          <a href="#" onclick="navigate('login'); return false;" class="font-bold underline hover:text-blue-800 dark:hover:text-blue-100 ml-1">Silakan Login</a> untuk akses penuh.
        </p>
      </div>
    </div>` : ''}

    <div class="relative max-w-2xl mx-auto mb-10 group">
      <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <i class="fas fa-search text-[var(--color-text-tertiary)] group-focus-within:text-primary-500 transition-colors"></i>
      </div>
      <input 
        type="text" 
        id="guru-search" 
        onkeyup="searchGuru()" 
        placeholder="Cari nama, NIP, atau sekolah..." 
        class="w-full pl-11 pr-4 py-3.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-[var(--color-text-primary)] shadow-sm placeholder-[var(--color-text-tertiary)]"
      >
      <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
        <span class="text-xs text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)] px-2 py-0.5 rounded-md">Ctrl + K</span>
      </div>
    </div>

    <div id="guru-list" class="space-y-10">
      ${guruList.length > 0 ? renderGuruGroups(guruList) : '<div class="text-center py-12 text-[var(--color-text-tertiary)]">Belum ada data guru.</div>'}
    </div>
  </div>`;
}

function renderGuruGroups(list) {
  if (!list || list.length === 0) return '';

  const groups = {
    'Kepala Sekolah': [],
    'Guru Kelas 1': [],
    'Guru Kelas 2': [],
    'Guru Kelas 3': [],
    'Guru Kelas 4': [],
    'Guru Kelas 5': [],
    'Guru Kelas 6': [],
    'Guru PAI': [],
    'Guru PJOK': [],
    'Guru Mata Pelajaran Lain': [],
    'Anggota': []
  };

  // Improved grouping logic
  list.forEach(g => {
    const mapel = (g.mata_pelajaran || '').toLowerCase();
    const jabatan = (g.jabatan || '').toLowerCase();

    if (jabatan.includes('kepala') || mapel.includes('kepala')) groups['Kepala Sekolah'].push(g);
    else if (mapel.includes('kelas 1')) groups['Guru Kelas 1'].push(g);
    else if (mapel.includes('kelas 2')) groups['Guru Kelas 2'].push(g);
    else if (mapel.includes('kelas 3')) groups['Guru Kelas 3'].push(g);
    else if (mapel.includes('kelas 4')) groups['Guru Kelas 4'].push(g);
    else if (mapel.includes('kelas 5')) groups['Guru Kelas 5'].push(g);
    else if (mapel.includes('kelas 6')) groups['Guru Kelas 6'].push(g);
    else if (mapel.includes('pai') || mapel.includes('agama')) groups['Guru PAI'].push(g);
    else if (mapel.includes('pjok') || mapel.includes('olahraga')) groups['Guru PJOK'].push(g);
    else if (mapel && mapel !== '-' && mapel.length > 2) groups['Guru Mata Pelajaran Lain'].push(g);
    else groups['Anggota'].push(g);
  });

  return Object.entries(groups)
    .filter(([_, teachers]) => teachers.length > 0)
    .map(([groupName, teachers]) => `
      <div class="guru-group animate-slide-up">
        <div class="flex items-center gap-4 mb-6">
          <h2 class="text-xl font-bold text-[var(--color-text-primary)] whitespace-nowrap">
            ${groupName}
          </h2>
          <div class="h-px bg-[var(--color-border-subtle)] w-full"></div>
          <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] whitespace-nowrap">
            ${teachers.length} Guru
          </span>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${teachers.map(g => renderGuruCard(g)).join('')}
        </div>
      </div>
    `).join('');
}

function renderGuruCard(g) {
  // Generate initials for avatar fallback
  const initials = (g.nama || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return `
    <div class="bg-[var(--color-bg-elevated)] rounded-2xl p-5 border border-[var(--color-border-subtle)] hover:border-primary-300 transition-all duration-300 shadow-sm hover:shadow-lg group relative overflow-hidden">
      <div class="flex items-start gap-4 relative z-10">
        <div class="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-md ring-2 ring-[var(--color-bg-tertiary)] group-hover:ring-primary-400 transition-all">
          ${g.foto_url
      ? `<img src="${escapeHtml(g.foto_url)}" alt="${escapeHtml(g.nama)}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500">`
      : `<div class="w-full h-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">${initials}</div>`
    }
        </div>
        
        <div class="flex-1 min-w-0 pt-0.5">
          <h3 class="font-bold text-[var(--color-text-primary)] truncate text-lg group-hover:text-primary-600 transition-colors mb-1">${escapeHtml(g.nama)}</h3>
          <p class="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-0.5">${escapeHtml(g.mata_pelajaran || 'Anggota KKG')}</p>
          <p class="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5 truncate">
            <i class="fas fa-school"></i>
            ${escapeHtml(g.sekolah || '-')}
          </p>
        </div>
      </div>

      <div class="mt-5 pt-4 border-t border-[var(--color-border-subtle)] space-y-2.5">
        ${g.nip ? `
          <div class="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] group/item hover:text-primary-600 transition-colors">
            <div class="w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-tertiary)] group-hover/item:text-primary-600 group-hover/item:bg-primary-50 dark:group-hover/item:bg-primary-900/20 transition-colors">
              <i class="fas fa-id-card"></i>
            </div>
            <span class="font-mono text-xs tracking-wide">${escapeHtml(g.nip)}</span>
          </div>
        ` : ''}
        
        ${g.email ? `
          <div class="flex items-center gap-3 text-sm text-[var(--color-text-secondary)] group/item hover:text-primary-600 transition-colors">
             <div class="w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-tertiary)] group-hover/item:text-primary-600 group-hover/item:bg-primary-50 dark:group-hover/item:bg-primary-900/20 transition-colors">
              <i class="fas fa-envelope"></i>
            </div>
            <span class="truncate">${escapeHtml(g.email)}</span>
          </div>
        ` : ''}
      </div>
      
      <!-- Decorative background blur -->
      <div class="absolute -top-10 -right-10 w-32 h-64 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors duration-500"></div>
    </div>
  `;
}

// Global functions
window.searchGuru = async function () {
  const searchInput = document.getElementById('guru-search');
  const search = searchInput?.value || '';
  const container = document.getElementById('guru-list');

  if (!container) return; // Guard clause

  try {
    const res = await api(`/guru?search=${encodeURIComponent(search)}`);
    const list = res.data || [];

    if (list.length > 0) {
      container.innerHTML = renderGuruGroups(list);
    } else {
      container.innerHTML = `
        <div class="col-span-full text-center py-16">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-bg-tertiary)] mb-4 text-[var(--color-text-tertiary)]">
            <i class="fas fa-search text-2xl"></i>
          </div>
          <h3 class="text-lg font-medium text-[var(--color-text-primary)]">Tidak ditemukan</h3>
          <p class="text-[var(--color-text-secondary)]">Coba kata kunci lain atau periksa ejaan Anda.</p>
        </div>
      `;
    }
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Terjadi kesalahan saat memuat data.</div>';
  }
}
