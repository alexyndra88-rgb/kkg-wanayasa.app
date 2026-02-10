
import { api } from '../api.js';
import { state } from '../state.js';
import { escapeHtml } from '../utils.js';

export async function renderGuru() {
  let guruList = [];
  try { const res = await api('/guru'); guruList = res.data || []; } catch (e) { }

  return `
  <div class="fade-in max-w-5xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-users text-teal-500 mr-2"></i>Direktori Guru</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Daftar anggota KKG Gugus 3 Wanayasa</p>
      </div>
    </div>

    ${!state.user ? `
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-start gap-3 fade-in">
      <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
      <div>
        <p class="text-sm text-blue-800 dark:text-blue-200 font-medium">Informasi Kontak Terbatas</p>
        <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
          Demi privasi, NIP dan Nomor HP hanya ditampilkan untuk anggota KKG yang sudah login.
          <a href="/login" onclick="navigate('login'); return false;" class="underline hover:text-blue-800 dark:hover:text-blue-100">Silakan Login di sini.</a>
        </p>
      </div>
    </div>` : ''}

    <div class="bg-white rounded-xl p-4 border mb-6">
      <input type="text" id="guru-search" onkeyup="searchGuru()" placeholder="Cari berdasarkan nama, NIP, atau mata pelajaran..." class="w-full px-4 py-3 border rounded-xl">
    </div>

    <div id="guru-list" class="space-y-8">
      ${renderGuruGroups(guruList)}
    </div>
    ${guruList.length === 0 ? '<div class="text-center py-12 text-gray-400">Belum ada data guru.</div>' : ''}
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
    'Lainnya': []
  };

  // Grouping logic
  list.forEach(g => {
    const mapel = (g.mata_pelajaran || '').toLowerCase();
    const jabatan = (g.jabatan || '').toLowerCase(); // If jabatan field exists, checking it too

    if (mapel.includes('kepala') || jabatan.includes('kepala')) groups['Kepala Sekolah'].push(g);
    else if (mapel.includes('kelas 1')) groups['Guru Kelas 1'].push(g);
    else if (mapel.includes('kelas 2')) groups['Guru Kelas 2'].push(g);
    else if (mapel.includes('kelas 3')) groups['Guru Kelas 3'].push(g);
    else if (mapel.includes('kelas 4')) groups['Guru Kelas 4'].push(g);
    else if (mapel.includes('kelas 5')) groups['Guru Kelas 5'].push(g);
    else if (mapel.includes('kelas 6')) groups['Guru Kelas 6'].push(g);
    else if (mapel.includes('pai') || mapel.includes('agama')) groups['Guru PAI'].push(g);
    else if (mapel.includes('pjok') || mapel.includes('olahraga')) groups['Guru PJOK'].push(g);
    else if (mapel && mapel !== '-') groups['Guru Mata Pelajaran Lain'].push(g);
    else groups['Lainnya'].push(g);
  });

  return Object.entries(groups)
    .filter(([_, teachers]) => teachers.length > 0)
    .map(([groupName, teachers]) => `
      <div class="guru-group">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 pl-2 border-l-4 border-teal-500">
          ${groupName} <span class="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">(${teachers.length})</span>
        </h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${teachers.map(g => renderGuruCard(g)).join('')}
        </div>
      </div>
    `).join('');
}

function renderGuruCard(g) {
  return `
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-500 transition shadow-sm group">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100 dark:border-gray-600">
          ${g.foto_url
      ? `<img src="${escapeHtml(g.foto_url)}" alt="${escapeHtml(g.nama)}" class="w-full h-full object-cover">`
      : `<div class="w-full h-full gradient-bg flex items-center justify-center text-white font-bold text-xl">${escapeHtml((g.nama || '?')[0].toUpperCase())}</div>`
    }
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-gray-800 dark:text-gray-100 truncate text-lg group-hover:text-teal-600 transition">${escapeHtml(g.nama)}</h3>
          <p class="text-sm font-medium text-teal-600 dark:text-teal-400 mb-0.5">${escapeHtml(g.mata_pelajaran || 'Anggota KKG')}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400"><i class="fas fa-school mr-1"></i>${escapeHtml(g.sekolah || '-')}</p>
        </div>
      </div>
      <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 space-y-2">
        ${g.nip ? `<div class="flex items-center gap-2"><div class="w-6 text-center"><i class="fas fa-id-card text-gray-400"></i></div><span>${escapeHtml(g.nip)}</span></div>` : ''}
        ${g.email ? `<div class="flex items-center gap-2"><div class="w-6 text-center"><i class="fas fa-envelope text-gray-400"></i></div><span class="truncate">${escapeHtml(g.email)}</span></div>` : ''}
      </div>
    </div>
  `;
}

// Global functions
window.searchGuru = async function () {
  const search = document.getElementById('guru-search')?.value || '';
  try {
    const res = await api(`/guru?search=${encodeURIComponent(search)}`);
    const container = document.getElementById('guru-list');
    const list = res.data || [];

    if (list.length > 0) {
      container.innerHTML = renderGuruGroups(list);
    } else {
      container.innerHTML = '<div class="md:col-span-3 text-center py-12 text-gray-400">Tidak ditemukan.</div>';
    }
  } catch (e) {
    console.error(e);
    const container = document.getElementById('guru-list');
    if (container) container.innerHTML = '<div class="text-center py-12 text-red-400">Terjadi kesalahan.</div>';
  }
}
