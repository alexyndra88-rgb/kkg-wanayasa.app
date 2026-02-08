
import { api } from '../api.js';
import { state } from '../state.js';
import { escapeHtml, showToast } from '../utils.js';

function renderMateriCard(m) {
  const icons = { 'RPP': 'fa-file-alt text-blue-500', 'Modul': 'fa-book text-green-500', 'Silabus': 'fa-file-contract text-purple-500', 'Media Ajar': 'fa-photo-video text-pink-500', 'Soal': 'fa-question-circle text-red-500' };
  const icon = icons[m.jenis] || 'fa-file text-gray-500';
  const avgRating = m.avg_rating || 0;
  const totalReviews = m.total_reviews || 0;

  // Generate star display
  const stars = Array(5).fill(0).map((_, i) => {
    if (i + 1 <= Math.floor(avgRating)) return '<i class="fas fa-star text-yellow-400"></i>';
    if (i < avgRating) return '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    return '<i class="far fa-star text-gray-300 dark:text-gray-600"></i>';
  }).join('');

  return `
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-500 transition shadow-sm">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <i class="fas ${icon} text-xl"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-gray-800 dark:text-gray-100 truncate">${escapeHtml(m.judul)}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">${escapeHtml(m.deskripsi || 'Tidak ada deskripsi')}</p>
          
          <!-- Rating Display -->
          <div class="flex items-center gap-2 mt-2">
            <div class="flex text-sm">${stars}</div>
            <span class="text-sm font-medium text-gray-600 dark:text-gray-300">${avgRating.toFixed(1)}</span>
            <span class="text-xs text-gray-400">(${totalReviews} review)</span>
            <button onclick="showReviewModal(${m.id}, '${escapeHtml(m.judul).replace(/'/g, "\\'")}', ${avgRating})" 
              class="ml-auto text-xs text-orange-500 hover:text-orange-600 font-medium">
              <i class="fas fa-comment mr-1"></i>Review
            </button>
          </div>
          
          <div class="flex flex-wrap gap-2 mt-2">
            ${m.jenis ? `<span class="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">${escapeHtml(m.jenis)}</span>` : ''}
            ${m.jenjang ? `<span class="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">${escapeHtml(m.jenjang)}</span>` : ''}
            ${m.kategori ? `<span class="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">${escapeHtml(m.kategori)}</span>` : ''}
          </div>
          <div class="flex items-center justify-between mt-3 text-xs text-gray-400 dark:text-gray-500">
            <span><i class="fas fa-user mr-1"></i>${escapeHtml(m.uploader_name || '-')}</span>
            <span><i class="fas fa-download mr-1"></i>${m.download_count || 0} unduhan</span>
          </div>
          ${m.file_url || m.file_key ? `
          <div class="mt-3">
            <a href="${m.file_key ? `/api/files/${m.file_key}` : m.file_url}" target="_blank" class="inline-flex items-center px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-lg transition">
              <i class="fas fa-download mr-1"></i>Download
            </a>
          </div>` : ''}
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
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-book text-orange-500 mr-2"></i>Repository Materi</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Kumpulan materi pembelajaran dan RPP</p>
      </div>
      ${state.user ? `<button onclick="showUploadMateri()" class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"><i class="fas fa-upload mr-1"></i>Upload Materi</button>` : ''}
    </div>

    <div id="upload-materi-modal" class="hidden mb-6"></div>

    <!-- Filter -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 mb-6 flex flex-wrap gap-3">
      <select id="filter-jenis" onchange="filterMateri()" class="px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm">
        <option value="">Semua Jenis</option>
        <option value="RPP">RPP</option><option value="Modul">Modul</option><option value="Silabus">Silabus</option>
        <option value="Media Ajar">Media Ajar</option><option value="Soal">Soal</option><option value="Lainnya">Lainnya</option>
      </select>
      <select id="filter-jenjang" onchange="filterMateri()" class="px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm">
        <option value="">Semua Jenjang</option>
        <option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
      </select>
      <input type="text" id="filter-search" onkeyup="filterMateri()" placeholder="Cari materi..." class="flex-1 min-w-[200px] px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm">
    </div>

    <div id="materi-list" class="grid md:grid-cols-2 gap-4">
      ${materiList.length > 0 ? materiList.map(m => renderMateriCard(m)).join('') : '<div class="md:col-span-2 text-center py-12 text-gray-400 dark:text-gray-500"><i class="fas fa-folder-open text-4xl mb-4 block"></i>Belum ada materi yang diupload.</div>'}
    </div>
  </div>`;
}

// Store uploaded file data
let currentUploadedFile = null;

// Global functions
window.showUploadMateri = function () {
  currentUploadedFile = null;
  const container = document.getElementById('upload-materi-modal');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-orange-200 dark:border-orange-500">
      <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4"><i class="fas fa-upload text-orange-500 mr-2"></i>Upload Materi Baru</h3>
      <form onsubmit="uploadMateri(event)" class="space-y-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div class="md:col-span-2"><input type="text" name="judul" required placeholder="Judul Materi" class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl"></div>
          <div class="md:col-span-2"><textarea name="deskripsi" placeholder="Deskripsi materi..." rows="2" class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl"></textarea></div>
          <select name="jenis" class="px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            <option value="">Jenis Materi</option><option value="RPP">RPP</option><option value="Modul">Modul</option>
            <option value="Silabus">Silabus</option><option value="Media Ajar">Media Ajar</option><option value="Soal">Soal</option><option value="Lainnya">Lainnya</option>
          </select>
          <select name="jenjang" class="px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            <option value="">Jenjang</option><option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
          </select>
          <input type="text" name="kategori" placeholder="Kategori/Mapel (contoh: Matematika)" class="px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl md:col-span-2">
        </div>
        
        <!-- File Upload Area -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload File (opsional)</label>
          <div 
            id="file-drop-zone"
            ondragover="handleDragOver(event)"
            ondragleave="handleDragLeave(event)"
            ondrop="handleFileDrop(event)"
            onclick="document.getElementById('file-input').click()"
            class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 dark:hover:border-orange-500 transition"
          >
            <div id="file-upload-content">
              <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
              <p class="text-gray-600 dark:text-gray-400">Drag & drop file di sini atau <span class="text-orange-500 font-medium">klik untuk pilih file</span></p>
              <p class="text-xs text-gray-400 mt-2">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, ZIP (max 10MB)</p>
            </div>
          </div>
          <input type="file" id="file-input" class="hidden" onchange="handleFileSelect(event)" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar">
          <input type="hidden" name="file_key" id="file-key-input">
          
          <!-- Progress bar -->
          <div id="upload-progress" class="hidden mt-3">
            <div class="flex items-center gap-3">
              <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div id="progress-bar" class="bg-orange-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
              </div>
              <span id="progress-text" class="text-sm text-gray-500 dark:text-gray-400">0%</span>
            </div>
          </div>
        </div>

        <!-- OR External URL -->
        <div class="md:col-span-2">
          <p class="text-sm text-gray-500 dark:text-gray-400 text-center my-2">atau</p>
          <input type="url" name="file_url" placeholder="URL File Eksternal (Google Drive, dll)" class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
        </div>

        <div class="flex gap-2">
          <button type="submit" id="submit-materi-btn" class="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600">
            <i class="fas fa-check mr-1"></i>Simpan Materi
          </button>
          <button type="button" onclick="document.getElementById('upload-materi-modal').classList.add('hidden')" class="px-6 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg font-medium">Batal</button>
        </div>
      </form>
    </div>`;
}

window.handleDragOver = function (e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('file-drop-zone').classList.add('border-orange-400', 'bg-orange-50', 'dark:bg-orange-900/20');
}

window.handleDragLeave = function (e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('file-drop-zone').classList.remove('border-orange-400', 'bg-orange-50', 'dark:bg-orange-900/20');
}

window.handleFileDrop = async function (e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('file-drop-zone').classList.remove('border-orange-400', 'bg-orange-50', 'dark:bg-orange-900/20');

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

  const dropZone = document.getElementById('file-drop-zone');
  const content = document.getElementById('file-upload-content');
  const progress = document.getElementById('upload-progress');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');

  // Show progress
  progress.classList.remove('hidden');
  content.innerHTML = `
        <i class="fas fa-file text-3xl text-orange-500 mb-2"></i>
        <p class="text-gray-700 dark:text-gray-300 font-medium">${escapeHtml(file.name)}</p>
        <p class="text-xs text-gray-400">${formatFileSize(file.size)} - Mengupload...</p>
    `;

  try {
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    // Upload using fetch for progress
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    // Simulate progress (since fetch doesn't natively support upload progress)
    let prog = 0;
    const progressInterval = setInterval(() => {
      prog += 10;
      if (prog <= 90) {
        progressBar.style.width = prog + '%';
        progressText.textContent = prog + '%';
      }
    }, 100);

    const result = await response.json();
    clearInterval(progressInterval);

    if (result.success) {
      progressBar.style.width = '100%';
      progressText.textContent = '100%';

      currentUploadedFile = result.data;
      document.getElementById('file-key-input').value = result.data.key;

      content.innerHTML = `
                <i class="fas fa-check-circle text-3xl text-green-500 mb-2"></i>
                <p class="text-gray-700 dark:text-gray-300 font-medium">${escapeHtml(file.name)}</p>
                <p class="text-xs text-green-600 dark:text-green-400">File berhasil diupload!</p>
                <button type="button" onclick="removeUploadedFile()" class="mt-2 text-xs text-red-500 hover:underline">
                    <i class="fas fa-times mr-1"></i>Hapus
                </button>
            `;

      showToast('File berhasil diupload', 'success');
    } else {
      throw new Error(result.error?.message || 'Gagal mengupload file');
    }
  } catch (e) {
    content.innerHTML = `
            <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-2"></i>
            <p class="text-gray-700 dark:text-gray-300">${escapeHtml(e.message || 'Gagal mengupload file')}</p>
            <p class="text-xs text-gray-400 mt-2">Klik untuk coba lagi</p>
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
        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
        <p class="text-gray-600 dark:text-gray-400">Drag & drop file di sini atau <span class="text-orange-500 font-medium">klik untuk pilih file</span></p>
        <p class="text-xs text-gray-400 mt-2">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, ZIP (max 10MB)</p>
    `;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

window.uploadMateri = async function (e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('submit-materi-btn');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Menyimpan...';

  try {
    await api('/materi', {
      method: 'POST', body: {
        judul: form.judul.value,
        deskripsi: form.deskripsi.value,
        jenis: form.jenis.value,
        jenjang: form.jenjang.value,
        kategori: form.kategori.value,
        file_url: form.file_url.value,
        file_key: form.file_key.value, // Include uploaded file key
      }
    });
    showToast('Materi berhasil disimpan!', 'success');
    window.location.reload();
  } catch (e) {
    showToast(e.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check mr-1"></i>Simpan Materi';
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
    container.innerHTML = list.length > 0 ? list.map(m => renderMateriCard(m)).join('') : '<div class="md:col-span-2 text-center py-12 text-gray-400 dark:text-gray-500">Tidak ada materi yang cocok.</div>';
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
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-star text-yellow-400 mr-2"></i>Review: ${title}</h3>
        <button onclick="closeReviewModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      
      <!-- Loading indicator -->
      <div id="review-loading" class="text-center py-8">
        <div class="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
      
      <!-- Review Stats -->
      <div id="review-stats" class="hidden mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <div class="flex items-center gap-4">
          <div class="text-center">
            <div id="stats-avg" class="text-3xl font-bold text-gray-800 dark:text-gray-100">${avgRating.toFixed(1)}</div>
            <div id="stats-stars" class="flex text-sm justify-center my-1"></div>
            <div id="stats-count" class="text-xs text-gray-500"></div>
          </div>
          <div id="stats-distribution" class="flex-1"></div>
        </div>
      </div>
      
      <!-- Add Review Form (if logged in) -->
      <div id="add-review-form" class="hidden mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
        <h4 class="font-bold text-gray-800 dark:text-gray-200 mb-3">Berikan Rating Anda</h4>
        <div class="flex items-center gap-1 mb-3" id="rating-stars">
          ${[1, 2, 3, 4, 5].map(i => `
            <button onclick="setUserRating(${i})" class="text-2xl hover:scale-110 transition rating-star" data-star="${i}">
              <i class="far fa-star text-gray-300"></i>
            </button>
          `).join('')}
          <span id="rating-text" class="ml-2 text-sm text-gray-500"></span>
        </div>
        <textarea id="review-comment" rows="2" placeholder="Tulis komentar (opsional)..." 
          class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm mb-3"></textarea>
        <button onclick="submitReview()" id="submit-review-btn" class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium">
          <i class="fas fa-paper-plane mr-1"></i>Kirim Review
        </button>
      </div>
      
      <!-- Review List -->
      <div id="review-list" class="hidden space-y-4"></div>
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
    document.getElementById('stats-count').textContent = `${stats.totalReviews} review`;

    // Stars
    const starsHtml = Array(5).fill(0).map((_, i) => {
      if (i + 1 <= Math.floor(stats.avgRating)) return '<i class="fas fa-star text-yellow-400"></i>';
      if (i < stats.avgRating) return '<i class="fas fa-star-half-alt text-yellow-400"></i>';
      return '<i class="far fa-star text-gray-300"></i>';
    }).join('');
    document.getElementById('stats-stars').innerHTML = starsHtml;

    // Distribution
    const total = stats.totalReviews || 1;
    const dist = Object.entries(stats.distribution).reverse().map(([star, count]) => `
      <div class="flex items-center gap-2 text-xs">
        <span class="w-3">${star}</span>
        <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div class="bg-yellow-400 rounded-full h-2" style="width: ${(count / total * 100)}%"></div>
        </div>
        <span class="w-6 text-gray-500">${count}</span>
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
          document.getElementById('submit-review-btn').innerHTML = '<i class="fas fa-edit mr-1"></i>Update Review';
        }
      } catch (e) { }
    }

    // Render reviews
    const reviewsHtml = data.reviews.length > 0
      ? data.reviews.map(r => `
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-gray-800 dark:text-gray-200">${escapeHtml(r.user_name)}</span>
            <div class="flex text-xs">
              ${Array(5).fill(0).map((_, i) =>
        i < r.rating ? '<i class="fas fa-star text-yellow-400"></i>' : '<i class="far fa-star text-gray-300"></i>'
      ).join('')}
            </div>
          </div>
          ${r.komentar ? `<p class="text-sm text-gray-600 dark:text-gray-300">${escapeHtml(r.komentar)}</p>` : ''}
          <div class="text-xs text-gray-400 mt-2">${new Date(r.created_at).toLocaleDateString('id-ID')}</div>
        </div>
      `).join('')
      : '<p class="text-center text-gray-400 py-4">Belum ada review untuk materi ini.</p>';

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
      icon.className = 'fas fa-star text-yellow-400';
    } else {
      icon.className = 'far fa-star text-gray-300';
    }
  });
  document.getElementById('rating-text').textContent = ratingTexts[rating] || '';
}

// Submit review
window.submitReview = async function () {
  if (currentUserRating === 0) {
    showToast('Pilih rating terlebih dahulu', 'error');
    return;
  }

  const btn = document.getElementById('submit-review-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Mengirim...';

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
    btn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i>Kirim Review';
  }
}

// Close review modal
window.closeReviewModal = function () {
  const modal = document.getElementById('review-modal');
  if (modal) modal.remove();
  currentReviewMateriId = null;
  currentUserRating = 0;
}
