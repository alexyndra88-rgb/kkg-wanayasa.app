
import { api } from '../api.js';
import { state } from '../state.js';
import { formatDate, formatDateTime, escapeHtml, showToast } from '../utils.js';

export async function renderAbsensi() {
  let kegiatan = [];
  try { const res = await api('/absensi/kegiatan'); kegiatan = res.data || []; } catch (e) { }

  return `
  <div class="fade-in max-w-5xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-calendar-check text-purple-500 mr-2"></i>Absensi Digital</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Kelola kehadiran kegiatan KKG</p>
      </div>
      <div class="flex gap-2">
        ${state.user ? `<button onclick="showQRScanner()" class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"><i class="fas fa-qrcode mr-1"></i>Scan QR</button>` : ''}
        <button onclick="showRekapAbsensi()" class="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800"><i class="fas fa-chart-bar mr-1"></i>Rekap</button>
        ${state.user?.role === 'admin' ? `<button onclick="showAddKegiatan()" class="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600"><i class="fas fa-plus mr-1"></i>Kegiatan Baru</button>` : ''}
      </div>
    </div>

    <!-- QR Scanner Modal -->
    <div id="qr-scanner-modal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-qrcode text-green-500 mr-2"></i>Scan QR Absensi</h3>
          <button onclick="closeQRScanner()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div id="qr-reader" class="mb-4 rounded-xl overflow-hidden"></div>
        <div id="qr-result" class="hidden p-4 bg-green-50 dark:bg-green-900/30 rounded-xl"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center">Arahkan kamera ke QR code yang ditampilkan admin</p>
      </div>
    </div>

    <!-- QR Display Modal -->
    <div id="qr-display-modal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-qrcode text-purple-500 mr-2"></i>QR Code Absensi</h3>
          <button onclick="closeQRDisplay()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div id="qr-display-content" class="text-center"></div>
      </div>
    </div>

    <div id="add-kegiatan-modal" class="hidden"></div>
    <div id="rekap-container" class="hidden mb-8"></div>

    <div class="space-y-4">
      ${kegiatan.length > 0 ? kegiatan.map(k => `
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-500 transition">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1">
              <h3 class="font-bold text-gray-800 dark:text-gray-100 text-lg">${escapeHtml(k.nama_kegiatan)}</h3>
              <div class="flex flex-wrap gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span><i class="fas fa-calendar mr-1 text-purple-400"></i>${formatDate(k.tanggal)}</span>
                <span><i class="fas fa-clock mr-1 text-blue-400"></i>${escapeHtml(k.waktu_mulai || '')} - ${escapeHtml(k.waktu_selesai || '')}</span>
                <span><i class="fas fa-map-marker-alt mr-1 text-red-400"></i>${escapeHtml(k.tempat || '-')}</span>
              </div>
              ${k.deskripsi ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${escapeHtml(k.deskripsi)}</p>` : ''}
            </div>
            <div class="flex flex-wrap gap-2">
              ${state.user?.role === 'admin' ? `<button onclick="showQRCode(${k.id})" class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition"><i class="fas fa-qrcode mr-1"></i>QR</button>` : ''}
              ${state.user ? `<button onclick="checkinAbsensi(${k.id})" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition"><i class="fas fa-check mr-1"></i>Check-in</button>` : ''}
              <button onclick="viewAbsensi(${k.id}, '${escapeHtml(k.nama_kegiatan)}')" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium dark:text-gray-200"><i class="fas fa-list mr-1"></i>Daftar Hadir</button>
            </div>
          </div>
        </div>
      `).join('') : '<div class="text-center py-12 text-gray-400 dark:text-gray-500"><i class="fas fa-calendar-times text-4xl mb-4 block"></i>Belum ada data kegiatan.</div>'}
    </div>

    <div id="absensi-detail" class="hidden mt-8"></div>
  </div>`;
}

// Global functions
window.showAddKegiatan = function () {
  const container = document.getElementById('add-kegiatan-modal');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-purple-200 mb-6">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-plus-circle text-purple-500 mr-2"></i>Tambah Kegiatan Baru</h3>
      <form onsubmit="addKegiatan(event)" class="grid md:grid-cols-2 gap-4">
        <div class="md:col-span-2"><input type="text" name="nama_kegiatan" required placeholder="Nama Kegiatan" class="w-full px-4 py-3 border rounded-xl"></div>
        <input type="date" name="tanggal" required class="px-4 py-3 border rounded-xl">
        <input type="text" name="tempat" placeholder="Tempat" class="px-4 py-3 border rounded-xl">
        <input type="text" name="waktu_mulai" placeholder="Waktu Mulai (09:00)" class="px-4 py-3 border rounded-xl">
        <input type="text" name="waktu_selesai" placeholder="Waktu Selesai (12:00)" class="px-4 py-3 border rounded-xl">
        <div class="md:col-span-2"><textarea name="deskripsi" placeholder="Deskripsi (opsional)" rows="2" class="w-full px-4 py-3 border rounded-xl"></textarea></div>
        <div class="md:col-span-2 flex gap-2">
          <button type="submit" class="px-6 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600">Simpan</button>
          <button type="button" onclick="document.getElementById('add-kegiatan-modal').classList.add('hidden')" class="px-6 py-2 bg-gray-200 rounded-lg font-medium">Batal</button>
        </div>
      </form>
    </div>`;
}

window.addKegiatan = async function (e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/absensi/kegiatan', {
      method: 'POST', body: {
        nama_kegiatan: form.nama_kegiatan.value, tanggal: form.tanggal.value,
        waktu_mulai: form.waktu_mulai.value, waktu_selesai: form.waktu_selesai.value,
        tempat: form.tempat.value, deskripsi: form.deskripsi.value,
      }
    });
    showToast('Kegiatan berhasil ditambahkan!');
    window.location.reload(); // Simple reload to refresh list or re-render (since render is expensive to call from here without import)
    // Actually, calling render() would be better, but we don't have it here. 
    // We can use navigate('absensi') to trigger re-render?
    // navigate('absensi'); // But we need to import navigate?
    // Let's assume user will refresh or we add a way to refresh.
  } catch (e) { showToast(e.message, 'error'); }
}

window.checkinAbsensi = async function (kegiatanId) {
  // Show status selection modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
      <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4 text-center"><i class="fas fa-calendar-check text-purple-500 mr-2"></i>Status Kehadiran</h3>
      <div class="space-y-3 mb-4">
        <button onclick="submitCheckin(${kegiatanId}, 'hadir')" class="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition">
          <i class="fas fa-check mr-2"></i>Hadir
        </button>
        <button onclick="submitCheckin(${kegiatanId}, 'izin')" class="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold transition">
          <i class="fas fa-file-alt mr-2"></i>Izin
        </button>
        <button onclick="submitCheckin(${kegiatanId}, 'sakit')" class="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition">
          <i class="fas fa-medkit mr-2"></i>Sakit
        </button>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Keterangan (opsional)</label>
        <input type="text" id="checkin-keterangan" placeholder="Alasan izin/sakit..." class="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
      </div>
      <button onclick="this.closest('.fixed').remove()" class="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600">Batal</button>
    </div>
  `;
  document.body.appendChild(modal);
}

window.submitCheckin = async function (kegiatanId, status) {
  const keterangan = document.getElementById('checkin-keterangan')?.value || '';
  try {
    await api('/absensi/checkin', {
      method: 'POST',
      body: { kegiatan_id: kegiatanId, status, keterangan }
    });
    showToast(status === 'hadir' ? 'Check-in berhasil!' : `Status ${status} berhasil dicatat!`);
    // Close modal
    document.querySelector('.fixed.inset-0')?.remove();
  } catch (e) { showToast(e.message, 'error'); }
}

window.viewAbsensi = async function (kegiatanId, nama) {
  try {
    const res = await api(`/absensi/kegiatan/${kegiatanId}/absensi`);
    const container = document.getElementById('absensi-detail');
    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="bg-white rounded-2xl shadow-lg p-6 border">
        <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-list text-purple-500 mr-2"></i>Daftar Hadir: ${escapeHtml(nama)}</h3>
        ${res.data.length > 0 ? `
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead><tr class="bg-gray-50"><th class="px-4 py-3 text-left">No</th><th class="px-4 py-3 text-left">Nama</th><th class="px-4 py-3 text-left">NIP</th><th class="px-4 py-3 text-left">Sekolah</th><th class="px-4 py-3 text-left">Waktu Check-in</th></tr></thead>
              <tbody>${res.data.map((a, i) => `<tr class="border-t"><td class="px-4 py-3">${i + 1}</td><td class="px-4 py-3 font-medium">${escapeHtml(a.nama)}</td><td class="px-4 py-3">${escapeHtml(a.nip || '-')}</td><td class="px-4 py-3">${escapeHtml(a.sekolah || '-')}</td><td class="px-4 py-3">${formatDateTime(a.waktu_checkin)}</td></tr>`).join('')}</tbody>
            </table>
          </div>
          <p class="mt-4 text-sm text-gray-500">Total hadir: <strong>${res.data.length}</strong> orang</p>
        ` : '<p class="text-gray-400 text-center py-6">Belum ada yang check-in.</p>'}
      </div>`;
    container.scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast(e.message, 'error'); }
}

window.showRekapAbsensi = async function () {
  try {
    const res = await api('/absensi/rekap');
    const container = document.getElementById('rekap-container');
    container.classList.toggle('hidden');
    if (container.classList.contains('hidden')) return;

    const isAdmin = state.user?.role === 'admin';

    container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-chart-bar text-purple-500 mr-2"></i>Rekap Kehadiran</h3>
          ${isAdmin ? `
          <button onclick="exportRekapCSV()" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
            <i class="fas fa-download mr-1"></i>Export CSV
          </button>` : ''}
        </div>
        
        <!-- Status Legend -->
        <div class="flex flex-wrap gap-4 mb-4 text-sm">
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-green-500 rounded-full"></span>Hadir</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-yellow-500 rounded-full"></span>Izin</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-orange-500 rounded-full"></span>Sakit</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-red-500 rounded-full"></span>Alpha</span>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-700">
                <th class="px-4 py-3 text-left">Nama</th>
                <th class="px-4 py-3 text-left">Sekolah</th>
                <th class="px-3 py-3 text-center text-green-600"><i class="fas fa-check"></i></th>
                <th class="px-3 py-3 text-center text-yellow-600"><i class="fas fa-file-alt"></i></th>
                <th class="px-3 py-3 text-center text-orange-600"><i class="fas fa-medkit"></i></th>
                <th class="px-3 py-3 text-center text-red-600"><i class="fas fa-times"></i></th>
                <th class="px-4 py-3 text-center">Total</th>
                <th class="px-4 py-3 text-center">%</th>
              </tr>
            </thead>
            <tbody>${(res.data || []).map(r => {
      const persen = r.total_kegiatan > 0 ? Math.round((r.total_hadir || 0) / r.total_kegiatan * 100) : 0;
      return `<tr class="border-t dark:border-gray-700">
                <td class="px-4 py-3 font-medium dark:text-gray-200">${escapeHtml(r.nama)}</td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400">${escapeHtml(r.sekolah || '-')}</td>
                <td class="px-3 py-3 text-center text-green-600 font-bold">${r.total_hadir || 0}</td>
                <td class="px-3 py-3 text-center text-yellow-600">${r.total_izin || 0}</td>
                <td class="px-3 py-3 text-center text-orange-600">${r.total_sakit || 0}</td>
                <td class="px-3 py-3 text-center text-red-600">${r.total_alpha || 0}</td>
                <td class="px-4 py-3 text-center dark:text-gray-300">${r.total_kegiatan}</td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2 py-1 rounded-full text-xs font-bold ${persen >= 75 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : persen >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}">${persen}%</span>
                </td>
              </tr>`;
    }).join('')}</tbody>
          </table>
        </div>
      </div>`;
  } catch (e) { showToast(e.message, 'error'); }
}

// Export rekap to CSV
window.exportRekapCSV = function () {
  window.open('/api/absensi/rekap/export?format=csv', '_blank');
  showToast('Mengunduh rekap absensi...');
}

// ============================================
// QR Code Functions
// ============================================

// Show QR code for a kegiatan (admin only)
window.showQRCode = async function (kegiatanId) {
  const modal = document.getElementById('qr-display-modal');
  const content = document.getElementById('qr-display-content');

  modal.classList.remove('hidden');
  content.innerHTML = `
        <div class="flex justify-center py-8">
            <div class="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
    `;

  try {
    const res = await api(`/absensi/kegiatan/${kegiatanId}/qr?expiry=120`);
    const data = res.data;

    content.innerHTML = `
            <div class="mb-4">
                <h4 class="font-bold text-lg text-gray-800 dark:text-gray-100">${escapeHtml(data.nama_kegiatan)}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">${formatDate(data.tanggal)}</p>
            </div>
            <div class="bg-white p-4 rounded-xl inline-block mb-4">
                <img src="${data.qr_image}" alt="QR Code" class="w-64 h-64 mx-auto">
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                <p><i class="fas fa-clock mr-1"></i>Berlaku: ${data.expires_in_minutes} menit</p>
                <p class="text-xs mt-1">Kadaluarsa: ${new Date(data.expires_at).toLocaleString('id-ID')}</p>
            </div>
            <div class="flex gap-2 justify-center">
                <button onclick="refreshQRCode(${kegiatanId})" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">
                    <i class="fas fa-sync-alt mr-1"></i>Refresh
                </button>
                <button onclick="copyQRData('${data.qr_data}')" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium dark:text-gray-200">
                    <i class="fas fa-copy mr-1"></i>Copy Data
                </button>
            </div>
        `;
  } catch (e) {
    content.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <p class="text-gray-600 dark:text-gray-300">${e.message || 'Gagal generate QR code'}</p>
            </div>
        `;
  }
}

window.refreshQRCode = function (kegiatanId) {
  showQRCode(kegiatanId);
}

window.copyQRData = function (qrData) {
  navigator.clipboard.writeText(qrData).then(() => {
    showToast('QR data disalin ke clipboard', 'success');
  }).catch(() => {
    showToast('Gagal menyalin', 'error');
  });
}

window.closeQRDisplay = function () {
  document.getElementById('qr-display-modal').classList.add('hidden');
}

// QR Scanner 
let html5QrCode = null;

window.showQRScanner = async function () {
  const modal = document.getElementById('qr-scanner-modal');
  const reader = document.getElementById('qr-reader');
  const result = document.getElementById('qr-result');

  modal.classList.remove('hidden');
  result.classList.add('hidden');

  // Fallback to manual input (for camera use html5-qrcode library)
  reader.innerHTML = `
        <div class="p-6 text-center">
            <i class="fas fa-qrcode text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-300 mb-4">Masukkan kode QR dari admin:</p>
            <input type="text" id="manual-qr-input" placeholder="kkg-absensi:..." class="w-full px-4 py-3 border rounded-xl mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <button onclick="submitManualQR()" class="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium">
                <i class="fas fa-check mr-2"></i>Submit
            </button>
        </div>
    `;
}

window.submitManualQR = async function () {
  const input = document.getElementById('manual-qr-input');
  const qrData = input?.value?.trim();

  if (!qrData) {
    showToast('Masukkan kode QR', 'warning');
    return;
  }

  await onQRScanSuccess(qrData);
}

async function onQRScanSuccess(qrData) {
  const result = document.getElementById('qr-result');
  result.classList.remove('hidden');
  result.innerHTML = `
        <div class="flex items-center justify-center py-4">
            <div class="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
            <span class="ml-2 text-gray-600 dark:text-gray-300">Memverifikasi...</span>
        </div>
    `;

  try {
    const verifyRes = await api('/absensi/verify-qr', {
      method: 'POST',
      body: { qr_data: qrData }
    });

    if (!verifyRes.data?.valid) {
      result.innerHTML = `
                <div class="text-center text-red-600 dark:text-red-400">
                    <i class="fas fa-times-circle text-3xl mb-2"></i>
                    <p>${escapeHtml(verifyRes.data?.error || 'QR code tidak valid')}</p>
                </div>
            `;
      return;
    }

    const kegiatan = verifyRes.data.kegiatan;

    result.innerHTML = `
            <div class="text-center">
                <i class="fas fa-check-circle text-4xl text-green-500 mb-3"></i>
                <h4 class="font-bold text-gray-800 dark:text-gray-100">${escapeHtml(kegiatan.nama_kegiatan)}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    ${formatDate(kegiatan.tanggal)} | ${escapeHtml(kegiatan.waktu_mulai || '')}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <i class="fas fa-map-marker-alt mr-1"></i>${escapeHtml(kegiatan.tempat || '-')}
                </p>
                <button onclick="confirmQRCheckin('${qrData}')" class="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold">
                    <i class="fas fa-check mr-2"></i>Konfirmasi Check-in
                </button>
            </div>
        `;
  } catch (e) {
    result.innerHTML = `
            <div class="text-center text-red-600 dark:text-red-400">
                <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                <p>${escapeHtml(e.message || 'Gagal memverifikasi QR code')}</p>
            </div>
        `;
  }
}

window.confirmQRCheckin = async function (qrData) {
  const result = document.getElementById('qr-result');

  result.innerHTML = `
        <div class="flex items-center justify-center py-4">
            <div class="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
            <span class="ml-2 text-gray-600 dark:text-gray-300">Memproses check-in...</span>
        </div>
    `;

  try {
    const res = await api('/absensi/checkin/qr', {
      method: 'POST',
      body: { qr_data: qrData }
    });

    result.innerHTML = `
            <div class="text-center">
                <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check text-3xl text-green-600 dark:text-green-400"></i>
                </div>
                <h4 class="font-bold text-gray-800 dark:text-gray-100 mb-2">Check-in Berhasil!</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">${escapeHtml(res.data?.nama_kegiatan || 'Kegiatan')}</p>
                <button onclick="closeQRScanner()" class="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium dark:text-gray-200">
                    Tutup
                </button>
            </div>
        `;

    showToast('Check-in berhasil!', 'success');
  } catch (e) {
    result.innerHTML = `
            <div class="text-center text-red-600 dark:text-red-400">
                <i class="fas fa-times-circle text-3xl mb-2"></i>
                <p>${escapeHtml(e.message || 'Gagal check-in')}</p>
                <button onclick="showQRScanner()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
                    Coba Lagi
                </button>
            </div>
        `;
  }
}

window.closeQRScanner = function () {
  document.getElementById('qr-scanner-modal').classList.add('hidden');
  document.getElementById('qr-reader').innerHTML = '';
  document.getElementById('qr-result').classList.add('hidden');
}

