
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
        <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-calendar-check text-purple-500 mr-2"></i>Absensi Digital</h1>
        <p class="text-gray-500 text-sm mt-1">Kelola kehadiran kegiatan KKG</p>
      </div>
      <div class="flex gap-2">
        <button onclick="showRekapAbsensi()" class="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-200"><i class="fas fa-chart-bar mr-1"></i>Rekap</button>
        ${state.user?.role === 'admin' ? `<button onclick="showAddKegiatan()" class="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600"><i class="fas fa-plus mr-1"></i>Kegiatan Baru</button>` : ''}
      </div>
    </div>

    <div id="add-kegiatan-modal" class="hidden"></div>
    <div id="rekap-container" class="hidden mb-8"></div>

    <div class="space-y-4">
      ${kegiatan.length > 0 ? kegiatan.map(k => `
        <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:border-purple-200 transition">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1">
              <h3 class="font-bold text-gray-800 text-lg">${escapeHtml(k.nama_kegiatan)}</h3>
              <div class="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                <span><i class="fas fa-calendar mr-1 text-purple-400"></i>${formatDate(k.tanggal)}</span>
                <span><i class="fas fa-clock mr-1 text-blue-400"></i>${escapeHtml(k.waktu_mulai || '')} - ${escapeHtml(k.waktu_selesai || '')}</span>
                <span><i class="fas fa-map-marker-alt mr-1 text-red-400"></i>${escapeHtml(k.tempat || '-')}</span>
              </div>
              ${k.deskripsi ? `<p class="text-sm text-gray-500 mt-2">${escapeHtml(k.deskripsi)}</p>` : ''}
            </div>
            <div class="flex gap-2">
              ${state.user ? `<button onclick="checkinAbsensi(${k.id})" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition"><i class="fas fa-check mr-1"></i>Check-in</button>` : ''}
              <button onclick="viewAbsensi(${k.id}, '${escapeHtml(k.nama_kegiatan)}')" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"><i class="fas fa-list mr-1"></i>Daftar Hadir</button>
            </div>
          </div>
        </div>
      `).join('') : '<div class="text-center py-12 text-gray-400"><i class="fas fa-calendar-times text-4xl mb-4 block"></i>Belum ada data kegiatan.</div>'}
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
    try {
        await api('/absensi/checkin', { method: 'POST', body: { kegiatan_id: kegiatanId } });
        showToast('Check-in berhasil!');
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

        container.innerHTML = `
      <div class="bg-white rounded-2xl shadow-lg p-6 border">
        <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-chart-bar text-purple-500 mr-2"></i>Rekap Kehadiran</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="bg-gray-50"><th class="px-4 py-3 text-left">Nama</th><th class="px-4 py-3 text-left">NIP</th><th class="px-4 py-3 text-left">Sekolah</th><th class="px-4 py-3 text-center">Hadir</th><th class="px-4 py-3 text-center">Total Kegiatan</th><th class="px-4 py-3 text-center">%</th></tr></thead>
            <tbody>${(res.data || []).map(r => {
            const persen = r.total_kegiatan > 0 ? Math.round(r.total_hadir / r.total_kegiatan * 100) : 0;
            return `<tr class="border-t"><td class="px-4 py-3 font-medium">${escapeHtml(r.nama)}</td><td class="px-4 py-3">${escapeHtml(r.nip || '-')}</td><td class="px-4 py-3">${escapeHtml(r.sekolah || '-')}</td><td class="px-4 py-3 text-center">${r.total_hadir}</td><td class="px-4 py-3 text-center">${r.total_kegiatan}</td><td class="px-4 py-3 text-center"><span class="px-2 py-1 rounded-full text-xs font-bold ${persen >= 75 ? 'bg-green-100 text-green-700' : persen >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">${persen}%</span></td></tr>`;
        }).join('')}</tbody>
          </table>
        </div>
      </div>`;
    } catch (e) { showToast(e.message, 'error'); }
}
