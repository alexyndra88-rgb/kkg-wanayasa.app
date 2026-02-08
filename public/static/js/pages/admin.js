
import { api } from '../api.js';
import { state } from '../state.js';
import { escapeHtml, showToast } from '../utils.js';

export async function renderAdmin() {
    if (!state.user || state.user.role !== 'admin') {
        return '<div class="max-w-4xl mx-auto py-12 px-4 text-center text-red-500"><i class="fas fa-lock text-4xl mb-4 block"></i><p class="text-xl font-bold">Akses Ditolak</p><p>Halaman ini hanya untuk admin.</p></div>';
    }

    let stats = {}, settings = {}, users = [];
    try { const r = await api('/admin/dashboard'); stats = r.data; } catch (e) { }
    try { const r = await api('/admin/settings'); settings = r.data; } catch (e) { }
    try { const r = await api('/admin/users'); users = r.data || []; } catch (e) { }

    return `
  <div class="fade-in max-w-6xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-bold text-gray-800 mb-6"><i class="fas fa-cog text-gray-500 mr-2"></i>Panel Admin</h1>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      ${[
            { label: 'Total Guru', val: stats.total_guru || 0, icon: 'fa-users', color: 'bg-blue-500' },
            { label: 'Surat Dibuat', val: stats.total_surat || 0, icon: 'fa-envelope', color: 'bg-green-500' },
            { label: 'Program Kerja', val: stats.total_proker || 0, icon: 'fa-clipboard-list', color: 'bg-purple-500' },
            { label: 'Kegiatan', val: stats.total_kegiatan || 0, icon: 'fa-calendar', color: 'bg-orange-500' },
        ].map(s => `
        <div class="bg-white rounded-xl p-4 border shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 ${s.color} rounded-lg flex items-center justify-center"><i class="fas ${s.icon} text-white"></i></div>
            <div><div class="text-2xl font-bold text-gray-800">${s.val}</div><div class="text-xs text-gray-500">${s.label}</div></div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Settings -->
    <div class="bg-white rounded-2xl shadow-lg p-6 border mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4"><i class="fas fa-key text-yellow-500 mr-2"></i>Pengaturan API Mistral</h2>
      <form onsubmit="saveSettings(event)">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">API Key Mistral Large 3</label>
            <input type="text" name="mistral_api_key" placeholder="Masukkan API Key Mistral..." value="${escapeHtml(settings.mistral_api_key || '')}"
              class="w-full px-4 py-3 border rounded-xl font-mono text-sm">
            <p class="text-xs text-gray-400 mt-1">Dapatkan API Key dari <a href="https://console.mistral.ai/" target="_blank" class="text-blue-500 underline">console.mistral.ai</a></p>
          </div>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Nama Ketua KKG</label>
              <input type="text" name="nama_ketua" value="${escapeHtml(settings.nama_ketua || '')}" class="w-full px-4 py-3 border rounded-xl">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Tahun Ajaran</label>
              <input type="text" name="tahun_ajaran" value="${escapeHtml(settings.tahun_ajaran || '')}" class="w-full px-4 py-3 border rounded-xl">
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Alamat Sekretariat</label>
            <input type="text" name="alamat_sekretariat" value="${escapeHtml(settings.alamat_sekretariat || '')}" class="w-full px-4 py-3 border rounded-xl">
          </div>
          <button type="submit" class="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
            <i class="fas fa-save mr-2"></i>Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>

    <!-- Users Management -->
    <div class="bg-white rounded-2xl shadow-lg p-6 border">
      <h2 class="text-xl font-bold text-gray-800 mb-4"><i class="fas fa-users-cog text-blue-500 mr-2"></i>Kelola Pengguna</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="bg-gray-50"><th class="px-4 py-3 text-left">Nama</th><th class="px-4 py-3 text-left">Email</th><th class="px-4 py-3 text-left">Sekolah</th><th class="px-4 py-3 text-center">Role</th><th class="px-4 py-3 text-center">Aksi</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr class="border-t hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">${escapeHtml(u.nama)}</td>
                <td class="px-4 py-3 text-gray-500">${escapeHtml(u.email)}</td>
                <td class="px-4 py-3 text-gray-500">${escapeHtml(u.sekolah || '-')}</td>
                <td class="px-4 py-3 text-center"><span class="px-2 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}">${u.role}</span></td>
                <td class="px-4 py-3 text-center">
                  <button onclick="toggleRole(${u.id}, '${u.role}')" class="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200 mr-1" title="Toggle role">
                    <i class="fas fa-exchange-alt"></i>
                  </button>
                  <button onclick="resetUserPassword(${u.id})" class="px-2 py-1 bg-yellow-100 text-yellow-600 rounded text-xs hover:bg-yellow-200" title="Reset password">
                    <i class="fas fa-key"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// Global functions
window.saveSettings = async function (e) {
    e.preventDefault();
    const form = e.target;
    try {
        await api('/admin/settings', {
            method: 'PUT', body: {
                mistral_api_key: form.mistral_api_key.value,
                nama_ketua: form.nama_ketua.value,
                tahun_ajaran: form.tahun_ajaran.value,
                alamat_sekretariat: form.alamat_sekretariat.value,
            }
        });
        showToast('Pengaturan berhasil disimpan!');
    } catch (e) { showToast(e.message, 'error'); }
}

window.toggleRole = async function (userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Ubah role menjadi ${newRole}?`)) return;
    try {
        await api(`/guru/${userId}/role`, { method: 'PUT', body: { role: newRole } });
        showToast('Role berhasil diubah!');
        // Ideally re-render
        window.location.reload();
    } catch (e) { showToast(e.message, 'error'); }
}

window.resetUserPassword = async function (userId) {
    const newPw = prompt('Masukkan password baru (min. 6 karakter):');
    if (!newPw || newPw.length < 6) { showToast('Password minimal 6 karakter', 'error'); return; }
    try {
        await api(`/admin/users/${userId}/reset-password`, { method: 'POST', body: { new_password: newPw } });
        showToast('Password berhasil direset!');
    } catch (e) { showToast(e.message, 'error'); }
}
