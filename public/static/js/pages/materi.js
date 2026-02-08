
import { api } from '../api.js';
import { state } from '../state.js';
import { escapeHtml, showToast } from '../utils.js';

function renderMateriCard(m) {
    const icons = { 'RPP': 'fa-file-alt text-blue-500', 'Modul': 'fa-book text-green-500', 'Silabus': 'fa-file-contract text-purple-500', 'Media Ajar': 'fa-photo-video text-pink-500', 'Soal': 'fa-question-circle text-red-500' };
    const icon = icons[m.jenis] || 'fa-file text-gray-500';
    return `
    <div class="bg-white rounded-xl p-5 border hover:border-orange-200 transition shadow-sm">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <i class="fas ${icon} text-xl"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-gray-800 truncate">${escapeHtml(m.judul)}</h3>
          <p class="text-sm text-gray-500 mt-1 line-clamp-2">${escapeHtml(m.deskripsi || 'Tidak ada deskripsi')}</p>
          <div class="flex flex-wrap gap-2 mt-2">
            ${m.jenis ? `<span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">${escapeHtml(m.jenis)}</span>` : ''}
            ${m.jenjang ? `<span class="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">${escapeHtml(m.jenjang)}</span>` : ''}
            ${m.kategori ? `<span class="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full">${escapeHtml(m.kategori)}</span>` : ''}
          </div>
          <div class="flex items-center justify-between mt-3 text-xs text-gray-400">
            <span><i class="fas fa-user mr-1"></i>${escapeHtml(m.uploader_name || '-')}</span>
            <span><i class="fas fa-download mr-1"></i>${m.download_count || 0} unduhan</span>
          </div>
        </div>
      </div>
    </div>`;
}

export async function renderMateri() {
    let materiList = [];
    try { const res = await api('/materi'); materiList = res.data || []; } catch (e) { }

    return `
  <div class="fade-in max-w-5xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-book text-orange-500 mr-2"></i>Repository Materi</h1>
        <p class="text-gray-500 text-sm mt-1">Kumpulan materi pembelajaran dan RPP</p>
      </div>
      ${state.user ? `<button onclick="showUploadMateri()" class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"><i class="fas fa-upload mr-1"></i>Upload Materi</button>` : ''}
    </div>

    <div id="upload-materi-modal" class="hidden mb-6"></div>

    <!-- Filter -->
    <div class="bg-white rounded-xl p-4 border mb-6 flex flex-wrap gap-3">
      <select id="filter-jenis" onchange="filterMateri()" class="px-3 py-2 border rounded-lg text-sm">
        <option value="">Semua Jenis</option>
        <option value="RPP">RPP</option><option value="Modul">Modul</option><option value="Silabus">Silabus</option>
        <option value="Media Ajar">Media Ajar</option><option value="Soal">Soal</option><option value="Lainnya">Lainnya</option>
      </select>
      <select id="filter-jenjang" onchange="filterMateri()" class="px-3 py-2 border rounded-lg text-sm">
        <option value="">Semua Jenjang</option>
        <option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
      </select>
      <input type="text" id="filter-search" onkeyup="filterMateri()" placeholder="Cari materi..." class="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm">
    </div>

    <div id="materi-list" class="grid md:grid-cols-2 gap-4">
      ${materiList.length > 0 ? materiList.map(m => renderMateriCard(m)).join('') : '<div class="md:col-span-2 text-center py-12 text-gray-400"><i class="fas fa-folder-open text-4xl mb-4 block"></i>Belum ada materi yang diupload.</div>'}
    </div>
  </div>`;
}

// Global functions
window.showUploadMateri = function () {
    const container = document.getElementById('upload-materi-modal');
    container.classList.remove('hidden');
    container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-orange-200">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-upload text-orange-500 mr-2"></i>Upload Materi Baru</h3>
      <form onsubmit="uploadMateri(event)" class="grid md:grid-cols-2 gap-4">
        <div class="md:col-span-2"><input type="text" name="judul" required placeholder="Judul Materi" class="w-full px-4 py-3 border rounded-xl"></div>
        <div class="md:col-span-2"><textarea name="deskripsi" placeholder="Deskripsi materi..." rows="2" class="w-full px-4 py-3 border rounded-xl"></textarea></div>
        <select name="jenis" class="px-4 py-3 border rounded-xl">
          <option value="">Jenis Materi</option><option value="RPP">RPP</option><option value="Modul">Modul</option>
          <option value="Silabus">Silabus</option><option value="Media Ajar">Media Ajar</option><option value="Soal">Soal</option><option value="Lainnya">Lainnya</option>
        </select>
        <select name="jenjang" class="px-4 py-3 border rounded-xl">
          <option value="">Jenjang</option><option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
        </select>
        <input type="text" name="kategori" placeholder="Kategori/Mapel (contoh: Matematika)" class="px-4 py-3 border rounded-xl">
        <input type="url" name="file_url" placeholder="URL File (Google Drive, dll)" class="px-4 py-3 border rounded-xl">
        <div class="md:col-span-2 flex gap-2">
          <button type="submit" class="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600">Upload</button>
          <button type="button" onclick="document.getElementById('upload-materi-modal').classList.add('hidden')" class="px-6 py-2 bg-gray-200 rounded-lg font-medium">Batal</button>
        </div>
      </form>
    </div>`;
}

window.uploadMateri = async function (e) {
    e.preventDefault();
    const form = e.target;
    try {
        await api('/materi', {
            method: 'POST', body: {
                judul: form.judul.value, deskripsi: form.deskripsi.value, jenis: form.jenis.value,
                jenjang: form.jenjang.value, kategori: form.kategori.value, file_url: form.file_url.value,
            }
        });
        showToast('Materi berhasil diupload!');
        window.location.reload();
    } catch (e) { showToast(e.message, 'error'); }
}

window.filterMateri = async function () {
    const jenis = document.getElementById('filter-jenis')?.value || '';
    const jenjang = document.getElementById('filter-jenjang')?.value || '';
    const search = document.getElementById('filter-search')?.value || '';
    try {
        const res = await api(`/materi?jenis=${jenis}&jenjang=${jenjang}&search=${encodeURIComponent(search)}`);
        const container = document.getElementById('materi-list');
        const list = res.data || [];
        container.innerHTML = list.length > 0 ? list.map(m => renderMateriCard(m)).join('') : '<div class="md:col-span-2 text-center py-12 text-gray-400">Tidak ada materi yang cocok.</div>';
    } catch (e) { console.error(e); }
}
