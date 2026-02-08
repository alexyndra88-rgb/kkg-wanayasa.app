
import { api } from '../api.js';
import { escapeHtml } from '../utils.js';

export async function renderGuru() {
    let guruList = [];
    try { const res = await api('/guru'); guruList = res.data || []; } catch (e) { }

    return `
  <div class="fade-in max-w-5xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-users text-teal-500 mr-2"></i>Direktori Guru</h1>
        <p class="text-gray-500 text-sm mt-1">Daftar anggota KKG Gugus 3 Wanayasa</p>
      </div>
    </div>

    <div class="bg-white rounded-xl p-4 border mb-6">
      <input type="text" id="guru-search" onkeyup="searchGuru()" placeholder="Cari berdasarkan nama, NIP, atau mata pelajaran..." class="w-full px-4 py-3 border rounded-xl">
    </div>

    <div id="guru-list" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${guruList.map(g => `
        <div class="bg-white rounded-xl p-5 border hover:border-teal-200 transition shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              ${escapeHtml((g.nama || '?')[0].toUpperCase())}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-gray-800 truncate">${escapeHtml(g.nama)}</h3>
              <p class="text-sm text-gray-500">${escapeHtml(g.mata_pelajaran || '-')}</p>
              <p class="text-xs text-gray-400">${escapeHtml(g.sekolah || '-')}</p>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500 space-y-1">
            ${g.nip ? `<div><i class="fas fa-id-card w-5 text-gray-400"></i>${escapeHtml(g.nip)}</div>` : ''}
            ${g.no_hp ? `<div><i class="fas fa-phone w-5 text-gray-400"></i>${escapeHtml(g.no_hp)}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    ${guruList.length === 0 ? '<div class="text-center py-12 text-gray-400">Belum ada data guru.</div>' : ''}
  </div>`;
}

// Global functions
window.searchGuru = async function () {
    const search = document.getElementById('guru-search')?.value || '';
    try {
        const res = await api(`/guru?search=${encodeURIComponent(search)}`);
        const container = document.getElementById('guru-list');
        const list = res.data || [];
        container.innerHTML = list.map(g => `
      <div class="bg-white rounded-xl p-5 border hover:border-teal-200 transition shadow-sm">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">${escapeHtml((g.nama || '?')[0].toUpperCase())}</div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-gray-800 truncate">${escapeHtml(g.nama)}</h3>
            <p class="text-sm text-gray-500">${escapeHtml(g.mata_pelajaran || '-')}</p>
            <p class="text-xs text-gray-400">${escapeHtml(g.sekolah || '-')}</p>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500 space-y-1">
          ${g.nip ? `<div><i class="fas fa-id-card w-5 text-gray-400"></i>${escapeHtml(g.nip)}</div>` : ''}
          ${g.no_hp ? `<div><i class="fas fa-phone w-5 text-gray-400"></i>${escapeHtml(g.no_hp)}</div>` : ''}
        </div>
      </div>
    `).join('') || '<div class="md:col-span-3 text-center py-12 text-gray-400">Tidak ditemukan.</div>';
    } catch (e) { console.error(e); }
}
