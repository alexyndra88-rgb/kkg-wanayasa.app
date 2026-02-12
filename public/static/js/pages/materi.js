
import { api, getCsrfToken, refreshCsrfToken } from '../api.js';
import { state } from '../state.js';
import { escapeHtml, showToast, skeletonCards, emptyState, formatFileSize, nl2br } from '../utils.js';

function renderMateriCard(m) {
  const icons = {
    'RPP': 'fa-file-alt text-blue-500',
    'Modul': 'fa-book text-green-500',
    'Silabus': 'fa-file-contract text-purple-500',
    'Media Ajar': 'fa-photo-video text-pink-500',
    'Soal': 'fa-question-circle text-red-500'
  };
  const icon = icons[m.jenis] || 'fa-file text-[var(--color-text-secondary)]';
  const avgRating = m.avg_rating || 0;
  const totalReviews = m.total_reviews || 0;

  // Generate star display
  const stars = Array(5).fill(0).map((_, i) => {
    if (i + 1 <= Math.floor(avgRating)) return '<i class="fas fa-star text-yellow-400"></i>';
    if (i < avgRating) return '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    return '<i class="far fa-star text-[var(--color-text-tertiary)]"></i>';
  }).join('');

  return `
    <div class="bg-[var(--color-bg-elevated)] rounded-2xl p-5 border border-[var(--color-border-subtle)] hover:border-primary-300 transition-all duration-300 shadow-sm hover:shadow-lg group relative overflow-hidden flex flex-col h-full">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 bg-[var(--color-bg-tertiary)] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
          <i class="fas ${icon} text-xl"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-[var(--color-text-primary)] truncate text-lg group-hover:text-primary-600 transition-colors" title="${escapeHtml(m.judul)}">${escapeHtml(m.judul)}</h3>
          <p class="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2 leading-relaxed">${escapeHtml(m.deskripsi || 'Tidak ada deskripsi')}</p>
          
          <div class="flex flex-wrap gap-2 mt-3">
            ${m.jenis ? `<span class="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full border border-blue-100 dark:border-blue-800">${escapeHtml(m.jenis)}</span>` : ''}
            ${m.jenjang ? `<span class="px-2.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-full border border-green-100 dark:border-green-800">${escapeHtml(m.jenjang)}</span>` : ''}
            ${m.kategori ? `<span class="px-2.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-full border border-purple-100 dark:border-purple-800">${escapeHtml(m.kategori)}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="mt-auto pt-4 flex items-center justify-between text-xs text-[var(--color-text-secondary)] border-t border-[var(--color-border-subtle)]">
        <div class="flex items-center gap-3">
           <div class="flex items-center gap-1.5" title="Rating: ${avgRating.toFixed(1)}">
             <div class="flex text-[10px]">${stars}</div>
             <span class="font-medium text-[var(--color-text-primary)]">${avgRating.toFixed(1)}</span>
             <span class="text-[var(--color-text-tertiary)]">(${totalReviews})</span>
           </div>
           
           <button onclick="showReviewModal(${m.id}, '${escapeHtml(m.judul).replace(/'/g, "\\'")}', ${avgRating})" 
              class="text-xs text-[var(--color-text-secondary)] hover:text-primary-600 transition-colors tooltip" title="Lihat Review">
             <i class="far fa-comment-dots text-sm"></i>
           </button>
        </div>
        
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1 text-[var(--color-text-tertiary)]" title="Diunduh ${m.download_count} kali">
             <i class="fas fa-download text-[10px]"></i> ${m.download_count || 0}
          </span>
          ${m.file_size ? `<span class="flex items-center gap-1 text-[var(--color-text-tertiary)]"><i class="fas fa-hdd text-[10px]"></i> ${formatFileSize(m.file_size)}</span>` : ''}
        </div>
      </div>
      
      ${m.file_url || m.file_key ? `
      <div class="mt-4">
        <a href="${m.file_key ? `/api/files/${escapeHtml(m.file_key)}` : escapeHtml(m.file_url)}" target="_blank" class="w-full btn btn-sm btn-primary justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40">
          <i class="fas fa-download mr-1.5"></i>Download Materi
        </a>
      </div>` : ''}
    </div>`;
}


export async function renderMateri() {
  // Trigger fetch asynchronously
  setTimeout(loadMateriList, 0);

  return `
  <div class="fade-in max-w-7xl mx-auto py-8 px-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-display font-bold text-[var(--color-text-primary)]">
          <i class="fas fa-book-reader text-orange-500 mr-3"></i>Repository Materi
        </h1>
        <p class="text-[var(--color-text-secondary)] mt-2">Pusat sumber belajar, modul ajar, dan referensi pendidikan.</p>
      </div>
      ${state.user ? `
        <button onclick="showUploadMateri()" class="btn btn-primary shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-none">
          <i class="fas fa-cloud-upload-alt mr-2"></i>Upload Materi
        </button>` : ''}
    </div>

    <div id="upload-materi-modal" class="hidden fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Modal content injected here -->
    </div>

    <!-- Filter -->
    <div class="bg-[var(--color-bg-elevated)] rounded-2xl p-2 border border-[var(--color-border-subtle)] mb-8 flex flex-col md:flex-row gap-2 shadow-sm">
      <div class="relative min-w-[160px]">
        <select id="filter-jenis" onchange="filterMateri()" class="w-full pl-4 pr-10 py-2.5 bg-transparent border-none focus:ring-0 text-[var(--color-text-primary)] text-sm font-medium cursor-pointer appearance-none">
          <option value="">Semua Jenis</option>
          <option value="RPP">RPP</option><option value="Modul">Modul</option><option value="Silabus">Silabus</option>
          <option value="Media Ajar">Media Ajar</option><option value="Soal">Soal</option><option value="Lainnya">Lainnya</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-tertiary)]">
          <i class="fas fa-chevron-down text-xs"></i>
        </div>
      </div>
      
      <div class="w-px bg-[var(--color-border-subtle)] hidden md:block"></div>
      
      <div class="relative min-w-[160px]">
        <select id="filter-jenjang" onchange="filterMateri()" class="w-full pl-4 pr-10 py-2.5 bg-transparent border-none focus:ring-0 text-[var(--color-text-primary)] text-sm font-medium cursor-pointer appearance-none">
          <option value="">Semua Jenjang</option>
          <option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-tertiary)]">
          <i class="fas fa-chevron-down text-xs"></i>
        </div>
      </div>

      <div class="w-px bg-[var(--color-border-subtle)] hidden md:block"></div>

      <div class="flex-1 relative">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <i class="fas fa-search text-[var(--color-text-tertiary)]"></i>
        </div>
        <input type="text" id="filter-search" onkeyup="filterMateri()" placeholder="Cari materi..." class="w-full pl-10 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-[var(--color-text-primary)] text-sm placeholder-[var(--color-text-tertiary)]">
      </div>
    </div>

    <div id="materi-list" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${skeletonCards(6)}
    </div>
  </div>`;
}

async function loadMateriList() {
  try {
    const res = await api('/materi');
    const list = res.data || [];
    const container = document.getElementById('materi-list');
    if (container) {
      container.innerHTML = list.length > 0
        ? list.map(m => renderMateriCard(m)).join('')
        : emptyState('fa-folder-open', 'Belum ada materi yang diupload');
    }
  } catch (e) {
    console.error('Load materi error:', e);
    const container = document.getElementById('materi-list');
    if (container) {
      container.innerHTML = `<div class="col-span-full text-center py-12 text-red-500">Gagal memuat materi: ${escapeHtml(e.message)}</div>`;
    }
  }
}

// Store uploaded file data
let currentUploadedFile = null;

// Global functions
window.showUploadMateri = function () {
  currentUploadedFile = null;
  const container = document.getElementById('upload-materi-modal');
  container.classList.remove('hidden');

  // Use a backdrop container for centering
  container.innerHTML = `
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onclick="document.getElementById('upload-materi-modal').classList.add('hidden')"></div>
      
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      
      <div class="inline-block align-bottom bg-[var(--color-bg-elevated)] rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-[var(--color-border-subtle)]">
        <div class="bg-[var(--color-bg-tertiary)] px-6 py-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
          <h3 class="font-bold text-[var(--color-text-primary)] text-lg"><i class="fas fa-cloud-upload-alt text-orange-500 mr-2"></i>Upload Materi Baru</h3>
          <button onclick="document.getElementById('upload-materi-modal').classList.add('hidden')" class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="p-6">
          <form onsubmit="uploadMateri(event)" class="space-y-6">
            <div class="grid md:grid-cols-2 gap-6">
              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Judul Materi</label>
                <input type="text" name="judul" required placeholder="Contoh: RPP Matematika Kelas 5 Semester 1" class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 transition text-[var(--color-text-primary)]">
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Deskripsi</label>
                <textarea name="deskripsi" placeholder="Deskripsi singkat tentang materi ini..." rows="2" class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 transition text-[var(--color-text-primary)] resize-none"></textarea>
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Jenis Materi</label>
                <div class="relative">
                  <select name="jenis" class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 transition text-[var(--color-text-primary)] appearance-none">
                    <option value="">Pilih Jenis</option><option value="RPP">RPP</option><option value="Modul">Modul</option>
                    <option value="Silabus">Silabus</option><option value="Media Ajar">Media Ajar</option><option value="Soal">Soal</option><option value="Lainnya">Lainnya</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-tertiary)]"><i class="fas fa-chevron-down text-xs"></i></div>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Jenjang</label>
                <div class="relative">
                  <select name="jenjang" class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 transition text-[var(--color-text-primary)] appearance-none">
                    <option value="">Pilih Jenjang</option><option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-text-tertiary)]"><i class="fas fa-chevron-down text-xs"></i></div>
                </div>
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Kategori / Mata Pelajaran</label>
                <input type="text" name="kategori" placeholder="Contoh: Matematika, Bahasa Indonesia" class="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 transition text-[var(--color-text-primary)]">
              </div>
            </div>
            
            <!-- File Upload Area -->
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">Upload File (opsional)</label>
              <div 
                id="file-drop-zone"
                ondragover="handleDragOver(event)"
                ondragleave="handleDragLeave(event)"
                ondrop="handleFileDrop(event)"
                onclick="document.getElementById('file-input').click()"
                class="border-2 border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)]/50 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all group"
              >
                <div id="file-upload-content">
                  <div class="w-16 h-16 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <i class="fas fa-cloud-upload-alt text-3xl text-[var(--color-text-tertiary)] group-hover:text-orange-500 transition-colors"></i>
                  </div>
                  <p class="text-[var(--color-text-primary)] font-medium">Drag & drop file di sini atau <span class="text-orange-500">klik untuk pilih file</span></p>
                  <p class="text-xs text-[var(--color-text-tertiary)] mt-2">PDF, DOC, XLS, PPT, Gambar, ZIP (max 10MB)</p>
                </div>
              </div>
              <input type="file" id="file-input" class="hidden" onchange="handleFileSelect(event)" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar">
              <input type="hidden" name="file_key" id="file-key-input">
              
              <!-- Progress bar -->
              <div id="upload-progress" class="hidden mt-4">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-xs font-medium text-[var(--color-text-secondary)]">Uploading...</span>
                  <span id="progress-text" class="text-xs font-bold text-orange-500 ml-auto">0%</span>
                </div>
                <div class="flex-1 bg-[var(--color-bg-tertiary)] rounded-full h-2 overflow-hidden">
                  <div id="progress-bar" class="bg-orange-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
              </div>
            </div>

            <!-- OR External URL -->
            <div class="md:col-span-2 relative">
              <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="w-full border-t border-[var(--color-border-subtle)]"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="px-2 bg-[var(--color-bg-elevated)] text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">Atau tautan luar</span>
              </div>
            </div>
            
            <div class="relative">
               <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i class="fas fa-link text-[var(--color-text-tertiary)]"></i>
               </div>
               <input type="url" name="file_url" placeholder="Paste URL Google Drive / Dropbox / OneDrive" class="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-xl focus:ring-2 focus:ring-primary-500 transition text-[var(--color-text-primary)]">
            </div>

            <div class="pt-4 border-t border-[var(--color-border-subtle)] flex gap-3 justify-end">
              <button type="button" onclick="document.getElementById('upload-materi-modal').classList.add('hidden')" class="px-6 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-xl font-medium hover:bg-[var(--color-bg-tertiary)] transition-colors">Batal</button>
              <button type="submit" id="submit-materi-btn" class="btn btn-primary shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 border-none px-8">
                <i class="fas fa-check mr-2"></i>Simpan Materi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
}

window.handleDragOver = function (e) {
  e.preventDefault();
  e.stopPropagation();
  const dz = document.getElementById('file-drop-zone');
  dz.classList.add('border-orange-400', 'bg-orange-50', 'dark:bg-orange-900/20');
  dz.classList.remove('border-[var(--color-border-default)]');
}

window.handleDragLeave = function (e) {
  e.preventDefault();
  e.stopPropagation();
  const dz = document.getElementById('file-drop-zone');
  dz.classList.remove('border-orange-400', 'bg-orange-50', 'dark:bg-orange-900/20');
  dz.classList.add('border-[var(--color-border-default)]');
}

window.handleFileDrop = async function (e) {
  e.preventDefault();
  e.stopPropagation();
  window.handleDragLeave(e);

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    await uploadFile(files[0]);
  }
}

window.handleFileSelect = async function (e) {
  const files = e.target.files;
  if (files.length > 0) {
    await uploadFile(files[0]);
  }
}

async function uploadFile(file) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    showToast('Ukuran file maksimal 10MB', 'error');
    return;
  }

  const content = document.getElementById('file-upload-content');
  const progress = document.getElementById('upload-progress');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');

  // Show progress
  progress.classList.remove('hidden');
  content.innerHTML = `
        <i class="fas fa-file-alt text-4xl text-orange-500 mb-3 animate-pulse"></i>
        <p class="text-[var(--color-text-primary)] font-medium">${escapeHtml(file.name)}</p>
        <p class="text-xs text-[var(--color-text-tertiary)] mt-1">${formatFileSize(file.size)}</p>
    `;

  try {
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Get CSRF token
    let csrfToken = getCsrfToken();
    if (!csrfToken) {
      csrfToken = await refreshCsrfToken();
    }

    // Upload using fetch for progress (simulated)
    // Note: XMLHttpRequest is better for real progress, but fetch is modern. 
    // We'll proceed with fetch + interval simulation like before.

    let prog = 0;
    const progressInterval = setInterval(() => {
      prog = Math.min(prog + Math.random() * 10, 90);
      progressBar.style.width = prog + '%';
      progressText.textContent = Math.round(prog) + '%';
    }, 200);

    let response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: { 'X-CSRF-Token': csrfToken || '' }
    });

    // CSRF retry logic skipped for brevity, assumed handled by api wrapper usually but here we use raw fetch
    // Adding retry quickly:
    if (response.status === 403) {
      csrfToken = await refreshCsrfToken();
      if (csrfToken) {
        response = await fetch('/api/files/upload', {
          method: 'POST', body: formData, credentials: 'include', headers: { 'X-CSRF-Token': csrfToken }
        });
      }
    }

    clearInterval(progressInterval);
    const result = await response.json();

    if (result.success) {
      progressBar.style.width = '100%';
      progressText.textContent = '100%';

      currentUploadedFile = result.data;
      document.getElementById('file-key-input').value = result.data.key;

      content.innerHTML = `
                <div class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                   <i class="fas fa-check text-2xl text-green-500"></i>
                </div>
                <p class="text-[var(--color-text-primary)] font-medium truncate max-w-[200px] mx-auto">${escapeHtml(file.name)}</p>
                <div class="flex gap-2 justify-center mt-3">
                   <button type="button" onclick="removeUploadedFile()" class="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors">
                       Hapus
                   </button>
                   <span class="text-xs text-green-600 dark:text-green-400 font-medium px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
                       Sukses
                   </span>
                </div>
            `;

      showToast('File berhasil diupload', 'success');
    } else {
      throw new Error(result.error?.message || 'Gagal mengupload file');
    }
  } catch (e) {
    content.innerHTML = `
            <i class="fas fa-exclamation-circle text-4xl text-red-500 mb-3"></i>
            <p class="text-[var(--color-text-primary)]">${escapeHtml(e.message || 'Gagal mengupload file')}</p>
            <button type="button" onclick="document.getElementById('file-input').click()" class="text-xs text-orange-500 hover:text-orange-600 mt-2 font-medium">Coba lagi</button>
        `;
    progress.classList.add('hidden');
    showToast(e.message || 'Gagal mengupload file', 'error');
  }
}

window.removeUploadedFile = function () {
  currentUploadedFile = null;
  document.getElementById('file-key-input').value = '';
  document.getElementById('upload-progress').classList.add('hidden');
  document.getElementById('file-upload-content').innerHTML = `
        <div class="w-16 h-16 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <i class="fas fa-cloud-upload-alt text-3xl text-[var(--color-text-tertiary)] group-hover:text-orange-500 transition-colors"></i>
        </div>
        <p class="text-[var(--color-text-primary)] font-medium">Drag & drop file di sini atau <span class="text-orange-500">klik untuk pilih file</span></p>
        <p class="text-xs text-[var(--color-text-tertiary)] mt-2">PDF, DOC, XLS, PPT, Gambar, ZIP (max 10MB)</p>
    `;
}

window.uploadMateri = async function (e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('submit-materi-btn');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Menyimpan...';

  try {
    const payload = {
      judul: form.judul.value,
      deskripsi: form.deskripsi.value,
      jenis: form.jenis.value,
      jenjang: form.jenjang.value,
      kategori: form.kategori.value,
      file_url: form.file_url.value
    };

    if (currentUploadedFile) {
      payload.file_key = currentUploadedFile.key;
      payload.file_name = currentUploadedFile.filename;
      payload.file_size = currentUploadedFile.size;
      payload.content_type = currentUploadedFile.contentType;
    }

    await api('/materi', {
      method: 'POST',
      body: payload
    });
    showToast('Materi berhasil disimpan!', 'success');
    window.location.reload();
  } catch (e) {
    showToast(e.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check mr-2"></i>Simpan Materi';
  }
}

window.filterMateri = async function () {
  const jenis = document.getElementById('filter-jenis')?.value || '';
  const jenjang = document.getElementById('filter-jenjang')?.value || '';
  const search = document.getElementById('filter-search')?.value || '';
  try {
    const res = await api(`/materi?jenis=${jenis}&jenjang=${jenjang}&search=${encodeURIComponent(search)}`);
    const container = document.getElementById('materi-list');
    const list = res.data || [];
    container.innerHTML = list.length > 0 ? list.map(m => renderMateriCard(m)).join('') : '<div class="col-span-full text-center py-16 text-[var(--color-text-tertiary)]">Tidak ada materi yang cocok.</div>';
  } catch (e) { console.error(e); }
}

// ============================================
// Review Modal Functions
// ============================================

let currentReviewMateriId = null;
let currentUserRating = 0;

// Show review modal
window.showReviewModal = async function (materiId, title, avgRating) {
  currentReviewMateriId = materiId;
  currentUserRating = 0;

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'review-modal';
  modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in';
  modal.innerHTML = `
    <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[var(--color-border-subtle)] animate-slide-up">
      <div class="px-6 py-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center bg-[var(--color-bg-tertiary)]">
        <h3 class="font-bold text-[var(--color-text-primary)] flex items-center gap-2">
           <i class="fas fa-star text-yellow-400"></i> Review
        </h3>
        <button onclick="closeReviewModal()" class="text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors">
           <i class="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <div class="p-6">
        <h4 class="font-display font-bold text-lg text-[var(--color-text-primary)] mb-6 text-center leading-tight">"${title}"</h4>
        
        <!-- Loading indicator -->
        <div id="review-loading" class="text-center py-8">
          <div class="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
        
        <!-- Review Stats -->
        <div id="review-stats" class="hidden mb-8 p-6 bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border-subtle)]">
          <div class="flex items-center gap-6">
            <div class="text-center min-w-[100px]">
              <div id="stats-avg" class="text-4xl font-black text-[var(--color-text-primary)]">${avgRating.toFixed(1)}</div>
              <div id="stats-stars" class="flex text-[10px] justify-center my-2 space-x-0.5"></div>
              <div id="stats-count" class="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide"></div>
            </div>
            <div class="w-px h-16 bg-[var(--color-border-subtle)]"></div>
            <div id="stats-distribution" class="flex-1 space-y-1.5"></div>
          </div>
        </div>
        
        <!-- Add Review Form (if logged in) -->
        <div id="add-review-form" class="hidden mb-8 p-5 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
          <h4 class="font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
             <i class="fas fa-pen-nib text-orange-500"></i> Tulis Review Anda
          </h4>
          <div class="flex justify-center gap-2 mb-4" id="rating-stars">
            ${[1, 2, 3, 4, 5].map(i => `
              <button onclick="setUserRating(${i})" class="text-3xl hover:scale-110 transition rating-star p-1 focus:outline-none" data-star="${i}" type="button">
                <i class="far fa-star text-[var(--color-text-tertiary)]"></i>
              </button>
            `).join('')}
          </div>
          <div class="text-center text-sm font-medium text-orange-600 dark:text-orange-400 h-5 mb-3" id="rating-text"></div>
          
          <textarea id="review-comment" rows="3" placeholder="Bagikan pengalaman Anda tentang materi ini..." 
            class="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-sm mb-4 focus:ring-2 focus:ring-orange-500 transition resize-none"></textarea>
          
          <button onclick="submitReview()" id="submit-review-btn" class="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 transition-all transform active:scale-95">
            <i class="fas fa-paper-plane mr-2"></i>Kirim Review
          </button>
        </div>
        
        <!-- Review List -->
        <h5 class="font-bold text-[var(--color-text-secondary)] mb-4 text-sm uppercase tracking-wider">Ulasan Pengguna</h5>
        <div id="review-list" class="hidden space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Load reviews
  await loadReviews(materiId);
}

// Load reviews data
async function loadReviews(materiId) {
  try {
    const res = await api(`/materi/${materiId}/reviews`);
    const data = res.data;

    document.getElementById('review-loading').classList.add('hidden');
    document.getElementById('review-stats').classList.remove('hidden');
    document.getElementById('review-list').classList.remove('hidden');

    // Update stats
    const stats = data.stats;
    document.getElementById('stats-avg').textContent = stats.avgRating.toFixed(1);
    document.getElementById('stats-count').textContent = `${stats.totalReviews} REVIEWS`;

    // Stars
    const starsHtml = Array(5).fill(0).map((_, i) => {
      if (i + 1 <= Math.floor(stats.avgRating)) return '<i class="fas fa-star text-yellow-400"></i>';
      if (i < stats.avgRating) return '<i class="fas fa-star-half-alt text-yellow-400"></i>';
      return '<i class="far fa-star text-[var(--color-text-tertiary)]"></i>';
    }).join('');
    document.getElementById('stats-stars').innerHTML = starsHtml;

    // Distribution
    const total = stats.totalReviews || 1; // avoid div by zero
    const dist = Object.entries(stats.distribution).reverse().map(([star, count]) => `
      <div class="flex items-center gap-3 text-xs">
        <span class="w-3 font-medium text-[var(--color-text-secondary)]">${star}</span>
        <div class="flex-1 bg-[var(--color-bg-tertiary)] rounded-full h-1.5 overflow-hidden">
          <div class="bg-yellow-400 rounded-full h-1.5" style="width: ${(count / total * 100)}%"></div>
        </div>
        <span class="w-6 text-right text-[var(--color-text-tertiary)]">${count}</span>
      </div>
    `).join('');
    document.getElementById('stats-distribution').innerHTML = dist;

    // Show add review form if logged in
    if (window.state?.user) {
      document.getElementById('add-review-form').classList.remove('hidden');

      // Check if user already reviewed
      try {
        const myReview = await api(`/materi/${materiId}/my-review`);
        if (myReview.data) {
          currentUserRating = myReview.data.rating;
          updateRatingStars(currentUserRating);
          document.getElementById('review-comment').value = myReview.data.komentar || '';
          document.getElementById('submit-review-btn').innerHTML = '<i class="fas fa-edit mr-2"></i>Update Review';
          // Scroll to form
          setTimeout(() => document.getElementById('add-review-form').scrollIntoView({ behavior: 'smooth' }), 100);
        }
      } catch (e) { }
    }

    // Render reviews
    const reviewsHtml = data.reviews.length > 0
      ? data.reviews.map(r => `
        <div class="p-4 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-subtle)]">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
               <div class="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                 ${r.user_name.charAt(0).toUpperCase()}
               </div>
               <span class="font-bold text-sm text-[var(--color-text-primary)]">${escapeHtml(r.user_name)}</span>
            </div>
            <span class="text-[10px] class="text-[var(--color-text-tertiary)]">${new Date(r.created_at).toLocaleDateString('id-ID')}</span>
          </div>
          <div class="flex text-[10px] mb-2 space-x-0.5">
              ${Array(5).fill(0).map((_, i) =>
        i < r.rating ? '<i class="fas fa-star text-yellow-400"></i>' : '<i class="far fa-star text-[var(--color-text-tertiary)]"></i>'
      ).join('')}
          </div>
          ${r.komentar ? `<p class="text-sm text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-bg-tertiary)] p-3 rounded-lg italic relative">
             <i class="fas fa-quote-left absolute -top-1 -left-1 text-[var(--color-text-tertiary)] opacity-30 text-xs"></i>
             ${escapeHtml(r.komentar)}
          </p>` : ''}
        </div>
      `).join('')
      : '<div class="text-center text-[var(--color-text-tertiary)] py-8 border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl">Belum ada review. Jadilah yang pertama!</div>';

    document.getElementById('review-list').innerHTML = reviewsHtml;
  } catch (e) {
    console.error('Load reviews error:', e);
    document.getElementById('review-loading').innerHTML = '<p class="text-red-500">Gagal memuat review</p>';
  }
}

// Set user rating
window.setUserRating = function (rating) {
  currentUserRating = rating;
  updateRatingStars(rating);
}

function updateRatingStars(rating) {
  const ratingTexts = ['', 'Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik'];
  document.querySelectorAll('.rating-star').forEach((btn, i) => {
    const icon = btn.querySelector('i');
    if (i + 1 <= rating) {
      icon.className = 'fas fa-star text-yellow-400 drop-shadow-sm';
      btn.classList.add('scale-110');
    } else {
      icon.className = 'far fa-star text-[var(--color-text-tertiary)]';
      btn.classList.remove('scale-110');
    }
  });
  document.getElementById('rating-text').textContent = ratingTexts[rating] || '';
}

// Submit review
window.submitReview = async function () {
  if (currentUserRating === 0) {
    showToast('Silakan pilih bintang rating terlebih dahulu', 'error');
    return;
  }

  const btn = document.getElementById('submit-review-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Mengirim...';

  try {
    await api(`/materi/${currentReviewMateriId}/reviews`, {
      method: 'POST',
      body: {
        rating: currentUserRating,
        komentar: document.getElementById('review-comment').value
      }
    });
    showToast('Review berhasil disimpan!', 'success');
    closeReviewModal();
    // Refresh page to update ratings
    setTimeout(() => window.location.reload(), 500);
  } catch (e) {
    showToast(e.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Kirim Review';
  }
}

// Close review modal
window.closeReviewModal = function () {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.classList.add('animate-fade-out');
    setTimeout(() => modal.remove(), 200);
  }
  currentReviewMateriId = null;
  currentUserRating = 0;
}
