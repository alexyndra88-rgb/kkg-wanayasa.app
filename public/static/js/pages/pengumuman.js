
import { api } from '../api.js';
import { state } from '../state.js';
import { formatDateTime, escapeHtml, nl2br, showToast } from '../utils.js';

let currentPengumumanList = [];

export async function renderPengumuman() {
  try {
    const res = await api('/pengumuman');
    currentPengumumanList = res.data || [];
  } catch (e) {
    console.error(e);
    currentPengumumanList = [];
  }

  // Assign to window for access in inline handlers if needed, though we use ID lookups
  window.currentPengumumanList = currentPengumumanList;

  return `
  <div class="fade-in max-w-4xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-bullhorn text-yellow-500 mr-2"></i>Pengumuman</h1>
        <p class="text-gray-500 text-sm mt-1">Informasi dan jadwal kegiatan KKG</p>
      </div>
      ${state.user?.role === 'admin' ? `<button onclick="showAddPengumuman()" class="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition shadow-sm hover:shadow-md"><i class="fas fa-plus mr-1"></i>Buat Pengumuman</button>` : ''}
    </div>

    <!-- Modal Container -->
    <div id="pengumuman-modal" class="hidden fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick="closePengumumanModal()"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-yellow-200">
            <div id="pengumuman-modal-content"></div>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      ${currentPengumumanList.length > 0 ? currentPengumumanList.map(p => `
        <div class="bg-white rounded-xl p-6 border border-gray-100 hover:border-yellow-200 transition shadow-sm hover:shadow-md group">
          <div class="flex items-start justify-between mb-3">
             <div class="flex items-center gap-2">
                ${p.is_pinned ? '<span class="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium flex items-center"><i class="fas fa-thumbtack mr-1.5"></i>Disematkan</span>' : ''}
                <span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium capitalize">${escapeHtml(p.kategori || 'umum')}</span>
             </div>
             ${state.user?.role === 'admin' ? `
             <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="editPengumuman(${p.id})" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit"><i class="fas fa-edit"></i></button>
                <button onclick="deletePengumuman(${p.id})" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus"><i class="fas fa-trash"></i></button>
             </div>` : ''}
          </div>
          
          <h2 class="font-bold text-gray-800 text-xl mb-3 leading-snug">${escapeHtml(p.judul)}</h2>
          <div class="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">${escapeHtml(p.isi)}</div>
          
          <div class="flex items-center gap-4 mt-5 pt-4 border-t border-gray-50 text-xs text-gray-400">
            <span class="flex items-center"><i class="fas fa-user-circle mr-1.5 text-gray-300 text-base"></i>${escapeHtml(p.author_name || 'Admin')}</span>
            <span class="flex items-center"><i class="far fa-clock mr-1.5"></i>${formatDateTime(p.created_at)}</span>
          </div>
        </div>
      `).join('') : `
        <div class="bg-white rounded-xl p-12 text-center border border-dashed border-gray-300">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                <i class="fas fa-bullhorn text-2xl text-gray-400"></i>
            </div>
            <h3 class="text-lg font-medium text-gray-900">Belum ada pengumuman</h3>
            <p class="text-gray-500 text-sm mt-1">Pengumuman terbaru akan muncul di sini.</p>
        </div>
      `}
    </div>
  </div>`;
}

// Modal Helpers
window.closePengumumanModal = function () {
  document.getElementById('pengumuman-modal').classList.add('hidden');
}

function renderModalContent(title, btnText, data = {}) {
  const isEdit = !!data.id;
  return `
    <div class="px-6 py-4 bg-yellow-50 border-b border-yellow-100">
        <h3 class="font-bold text-gray-800 flex items-center">
            <i class="fas ${isEdit ? 'fa-edit' : 'fa-plus-circle'} text-yellow-600 mr-2"></i>
            ${title}
        </h3>
    </div>
    <form onsubmit="handlePengumumanSubmit(event, ${isEdit ? data.id : null})" class="p-6">
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Judul Pengumuman</label>
                <input type="text" name="judul" required value="${isEdit ? escapeHtml(data.judul) : ''}" 
                       placeholder="Contoh: Rapat Bulanan Februari" 
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select name="kategori" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white">
                        <option value="umum" ${data.kategori === 'umum' ? 'selected' : ''}>Umum</option>
                        <option value="jadwal" ${data.kategori === 'jadwal' ? 'selected' : ''}>Jadwal</option>
                        <option value="kegiatan" ${data.kategori === 'kegiatan' ? 'selected' : ''}>Kegiatan</option>
                        <option value="penting" ${data.kategori === 'penting' ? 'selected' : ''}>Penting</option>
                    </select>
                </div>
                <div class="flex items-center pt-6">
                    <label class="inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="is_pinned" class="form-checkbox h-5 w-5 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500" ${data.is_pinned ? 'checked' : ''}>
                        <span class="ml-2 text-sm text-gray-700">Sematkan di atas</span>
                    </label>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Isi Pengumuman</label>
                <textarea name="isi" required rows="6" 
                          placeholder="Tulis detail pengumuman di sini..." 
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-y">${isEdit ? escapeHtml(data.isi) : ''}</textarea>
            </div>
        </div>

        <div class="mt-8 flex gap-3 justify-end">
            <button type="button" onclick="closePengumumanModal()" class="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors">
                Batal
            </button>
            <button type="submit" class="px-5 py-2.5 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all transform active:scale-95">
                ${btnText}
            </button>
        </div>
    </form>
    `;
}

// Global functions
window.showAddPengumuman = function () {
  const modal = document.getElementById('pengumuman-modal');
  const content = document.getElementById('pengumuman-modal-content');
  content.innerHTML = renderModalContent('Buat Pengumuman Baru', 'Posting Pengumuman');
  modal.classList.remove('hidden');
}

window.editPengumuman = function (id) {
  const data = window.currentPengumumanList.find(p => p.id === id);
  if (!data) return;

  const modal = document.getElementById('pengumuman-modal');
  const content = document.getElementById('pengumuman-modal-content');
  content.innerHTML = renderModalContent('Edit Pengumuman', 'Simpan Perubahan', data);
  modal.classList.remove('hidden');
}

window.handlePengumumanSubmit = async function (e, id) {
  e.preventDefault();
  const form = e.target;
  // Find the submit button and disable it to prevent double submission
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Memproses...';

  try {
    const payload = {
      judul: form.judul.value,
      isi: form.isi.value,
      kategori: form.kategori.value,
      is_pinned: form.is_pinned.checked,
    };

    let res;
    if (id) {
      // Edit mode
      res = await api(`/pengumuman/${id}`, {
        method: 'PUT',
        body: payload
      });
      showToast('Pengumuman berhasil diperbarui!', 'success');
    } else {
      // Create mode
      res = await api('/pengumuman', {
        method: 'POST',
        body: payload
      });
      showToast('Pengumuman berhasil dibuat!', 'success');
    }

    closePengumumanModal();
    // Reload parent content (re-render)
    const mainContent = document.querySelector('main') || document.body;
    // Ideally trigger a re-render of this page component specifically, 
    // but reloading window is a safe fallback for now or re-calling render logic if available.
    // Since this is an SPA, we might want to just re-render this view.
    // Assuming renderPengumuman is called by router, we can try to re-render using router or refresh.
    // For now, let's just reload to be safe and simple.
    window.location.reload();

  } catch (e) {
    showToast(e.message || 'Terjadi kesalahan', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

window.deletePengumuman = async function (id) {
  if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;

  try {
    await api(`/pengumuman/${id}`, { method: 'DELETE' });
    showToast('Pengumuman berhasil dihapus', 'success');
    window.location.reload();
  } catch (e) {
    showToast(e.message || 'Gagal menghapus pengumuman', 'error');
  }
}
