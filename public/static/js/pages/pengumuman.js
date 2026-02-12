
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

  // Assign to window for access in inline handlers if needed
  window.currentPengumumanList = currentPengumumanList;

  return `
  <div class="fade-in max-w-5xl mx-auto py-8 px-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-display font-bold text-[var(--color-text-primary)]">
          <i class="fas fa-bullhorn text-yellow-500 mr-3"></i>Pengumuman
        </h1>
        <p class="text-[var(--color-text-secondary)] mt-2">Informasi terkini, agenda, dan berita seputar KKG Gugus 3.</p>
      </div>
      ${state.user?.role === 'admin' ? `
        <button onclick="showAddPengumuman()" class="btn btn-primary shadow-lg shadow-indigo-500/20">
          <i class="fas fa-plus mr-2"></i>Buat Pengumuman
        </button>` : ''}
    </div>

    <!-- Modal Container -->
    <div id="pengumuman-modal" class="hidden fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onclick="closePengumumanModal()"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-[var(--color-bg-elevated)] rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-[var(--color-border-subtle)]">
            <div id="pengumuman-modal-content"></div>
        </div>
      </div>
    </div>

    <div class="space-y-6">
      ${currentPengumumanList.length > 0 ? currentPengumumanList.map(p => `
        <div class="bg-[var(--color-bg-elevated)] rounded-2xl p-6 md:p-8 border border-[var(--color-border-subtle)] hover:border-primary-300 transition-all duration-300 shadow-sm hover:shadow-lg group relative overflow-hidden">
          <!-- Decoration -->
          <div class="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <i class="fas fa-bullhorn text-8xl"></i>
          </div>

          <div class="relative z-10">
            <div class="flex items-start justify-between mb-4">
               <div class="flex items-center gap-3">
                  ${p.is_pinned ? `<span class="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full font-bold uppercase tracking-wider shadow-sm"><i class="fas fa-thumbtack mr-1.5"></i>Penting</span>` : ''}
                  <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full font-bold uppercase tracking-wider shadow-sm">${escapeHtml(p.kategori || 'umum')}</span>
               </div>
               ${state.user?.role === 'admin' ? `
               <div class="flex gap-2">
                  <button onclick="editPengumuman(${p.id})" class="p-2 text-[var(--color-text-secondary)] hover:text-primary-600 hover:bg-[var(--color-bg-tertiary)] rounded-xl transition-all" title="Edit"><i class="fas fa-edit"></i></button>
                  <button onclick="deletePengumuman(${p.id})" class="p-2 text-[var(--color-text-secondary)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Hapus"><i class="fas fa-trash"></i></button>
               </div>` : ''}
            </div>
            
            <h2 class="font-display font-bold text-[var(--color-text-primary)] text-2xl mb-4 leading-tight group-hover:text-primary-600 transition-colors">${escapeHtml(p.judul)}</h2>
            <div class="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap mb-6 text-base">${nl2br(escapeHtml(p.isi))}</div>
            
            <div class="flex items-center gap-6 pt-6 border-t border-[var(--color-border-subtle)] text-sm text-[var(--color-text-tertiary)]">
              <span class="flex items-center font-medium"><i class="fas fa-user-circle mr-2 text-primary-400 text-lg"></i>${escapeHtml(p.author_name || 'Admin')}</span>
              <span class="flex items-center"><i class="far fa-clock mr-2"></i>${formatDateTime(p.created_at)}</span>
            </div>
          </div>
        </div>
      `).join('') : `
        <div class="text-center py-16 rounded-3xl border-2 border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)]/30">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-bg-elevated)] mb-6 shadow-sm text-[var(--color-text-tertiary)]">
                <i class="fas fa-bullhorn text-3xl"></i>
            </div>
            <h3 class="text-xl font-bold text-[var(--color-text-primary)] mb-2">Belum ada pengumuman</h3>
            <p class="text-[var(--color-text-secondary)]">Pengumuman terbaru akan muncul di sini.</p>
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
    <div class="px-6 py-5 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-subtle)]">
        <h3 class="font-display font-bold text-lg text-[var(--color-text-primary)] flex items-center">
            <i class="fas ${isEdit ? 'fa-edit' : 'fa-plus-circle'} text-primary-600 mr-3"></i>
            ${title}
        </h3>
    </div>
    <form onsubmit="handlePengumumanSubmit(event, ${isEdit ? data.id : null})" class="p-6">
        <div class="space-y-5">
            <div>
                <label class="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Judul Pengumuman</label>
                <input type="text" name="judul" required value="${isEdit ? escapeHtml(data.judul) : ''}" 
                       placeholder="Contoh: Rapat Bulanan Februari" 
                       class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-[var(--color-text-primary)]">
            </div>
            
            <div class="grid grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Kategori</label>
                    <div class="relative">
                      <select name="kategori" class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-[var(--color-text-primary)] appearance-none">
                          <option value="umum" ${data.kategori === 'umum' ? 'selected' : ''}>Umum</option>
                          <option value="jadwal" ${data.kategori === 'jadwal' ? 'selected' : ''}>Jadwal</option>
                          <option value="kegiatan" ${data.kategori === 'kegiatan' ? 'selected' : ''}>Kegiatan</option>
                          <option value="penting" ${data.kategori === 'penting' ? 'selected' : ''}>Penting</option>
                      </select>
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-secondary)]">
                        <i class="fas fa-chevron-down text-xs"></i>
                      </div>
                    </div>
                </div>
                <div class="flex items-center pt-8">
                    <label class="inline-flex items-center cursor-pointer group">
                        <input type="checkbox" name="is_pinned" class="form-checkbox h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 transition duration-150 ease-in-out" ${data.is_pinned ? 'checked' : ''}>
                        <span class="ml-3 text-sm font-medium text-[var(--color-text-primary)] group-hover:text-primary-600 transition-colors">Sematkan di atas</span>
                    </label>
                </div>
            </div>

            <div>
                <label class="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Isi Pengumuman</label>
                <textarea name="isi" required rows="6" 
                          placeholder="Tulis detail pengumuman di sini..." 
                          class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-[var(--color-text-primary)] resize-y">${isEdit ? escapeHtml(data.isi) : ''}</textarea>
            </div>
        </div>

        <div class="mt-8 flex gap-3 justify-end pt-5 border-t border-[var(--color-border-subtle)]">
            <button type="button" onclick="closePengumumanModal()" class="px-6 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-xl font-medium hover:bg-[var(--color-bg-tertiary)] transition-colors">
                Batal
            </button>
            <button type="submit" class="btn btn-primary px-6 py-2.5">
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
