
import { api } from '../api.js';
import { state } from '../state.js';
import { formatDateTime, escapeHtml, nl2br, showToast } from '../utils.js';

export async function renderPengumuman() {
    let pengumumanList = [];
    try { const res = await api('/pengumuman'); pengumumanList = res.data || []; } catch (e) { }

    return `
  <div class="fade-in max-w-4xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-bullhorn text-yellow-500 mr-2"></i>Pengumuman</h1>
        <p class="text-gray-500 text-sm mt-1">Informasi dan jadwal kegiatan KKG</p>
      </div>
      ${state.user?.role === 'admin' ? `<button onclick="showAddPengumuman()" class="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"><i class="fas fa-plus mr-1"></i>Buat Pengumuman</button>` : ''}
    </div>

    <div id="add-pengumuman-modal" class="hidden mb-6"></div>

    <div class="space-y-4">
      ${pengumumanList.length > 0 ? pengumumanList.map(p => `
        <div class="bg-white rounded-xl p-6 border hover:border-yellow-200 transition shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            ${p.is_pinned ? '<span class="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium"><i class="fas fa-thumbtack mr-1"></i>Disematkan</span>' : ''}
            <span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">${escapeHtml(p.kategori || 'umum')}</span>
          </div>
          <h2 class="font-bold text-gray-800 text-xl mb-3">${escapeHtml(p.judul)}</h2>
          <div class="text-gray-600 leading-relaxed text-sm">${nl2br(p.isi)}</div>
          <div class="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
            <span><i class="fas fa-user mr-1"></i>${escapeHtml(p.author_name || '-')}</span>
            <span><i class="fas fa-clock mr-1"></i>${formatDateTime(p.created_at)}</span>
          </div>
        </div>
      `).join('') : '<div class="text-center py-12 text-gray-400"><i class="fas fa-bullhorn text-4xl mb-4 block"></i>Belum ada pengumuman.</div>'}
    </div>
  </div>`;
}

// Global functions
window.showAddPengumuman = function () {
    const container = document.getElementById('add-pengumuman-modal');
    container.classList.remove('hidden');
    container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-yellow-200">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-plus-circle text-yellow-500 mr-2"></i>Buat Pengumuman Baru</h3>
      <form onsubmit="addPengumuman(event)">
        <input type="text" name="judul" required placeholder="Judul Pengumuman" class="w-full px-4 py-3 border rounded-xl mb-3">
        <div class="grid grid-cols-2 gap-3 mb-3">
          <select name="kategori" class="px-4 py-3 border rounded-xl">
            <option value="umum">Umum</option><option value="jadwal">Jadwal</option><option value="kegiatan">Kegiatan</option><option value="penting">Penting</option>
          </select>
          <label class="flex items-center px-4 py-3 border rounded-xl"><input type="checkbox" name="is_pinned" class="mr-2"> Sematkan</label>
        </div>
        <textarea name="isi" required rows="5" placeholder="Isi pengumuman..." class="w-full px-4 py-3 border rounded-xl mb-3"></textarea>
        <div class="flex gap-2">
          <button type="submit" class="px-6 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600">Posting</button>
          <button type="button" onclick="document.getElementById('add-pengumuman-modal').classList.add('hidden')" class="px-6 py-2 bg-gray-200 rounded-lg font-medium">Batal</button>
        </div>
      </form>
    </div>`;
}

window.addPengumuman = async function (e) {
    e.preventDefault();
    const form = e.target;
    try {
        await api('/pengumuman', {
            method: 'POST', body: {
                judul: form.judul.value, isi: form.isi.value, kategori: form.kategori.value, is_pinned: form.is_pinned.checked,
            }
        });
        showToast('Pengumuman berhasil dibuat!');
        window.location.reload();
    } catch (e) { showToast(e.message, 'error'); }
}
