
import { api } from '../api.js';
import { state } from '../state.js';
import { escapeHtml, showToast, formatDateTime } from '../utils.js';

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
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6"><i class="fas fa-cog text-gray-500 mr-2"></i>Panel Admin</h1>

    <!-- Tab Navigation -->
    <div class="flex flex-wrap gap-2 mb-6 border-b dark:border-gray-700">
      <button onclick="switchAdminTab('dashboard')" id="tab-dashboard" class="px-4 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-600 dark:text-blue-400">
        <i class="fas fa-tachometer-alt mr-1"></i>Dashboard
      </button>
      <button onclick="switchAdminTab('profil')" id="tab-profil" class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
        <i class="fas fa-building mr-1"></i>Profil KKG
      </button>
      <button onclick="switchAdminTab('sekolah')" id="tab-sekolah" class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
        <i class="fas fa-school mr-1"></i>Daftar Sekolah
      </button>
      <button onclick="switchAdminTab('settings')" id="tab-settings" class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
        <i class="fas fa-sliders-h mr-1"></i>Pengaturan
      </button>
      <button onclick="switchAdminTab('templates')" id="tab-templates" class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
        <i class="fas fa-file-alt mr-1"></i>Template Surat
      </button>
      <button onclick="switchAdminTab('users')" id="tab-users" class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
        <i class="fas fa-users-cog mr-1"></i>Pengguna
      </button>
      <button onclick="switchAdminTab('logs')" id="tab-logs" class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
        <i class="fas fa-history mr-1"></i>Audit Log
      </button>
    </div>

    <!-- Dashboard Tab -->
    <div id="panel-dashboard">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        ${[
      { label: 'Total Guru', val: stats.total_guru || 0, icon: 'fa-users', color: 'bg-blue-500' },
      { label: 'Surat Dibuat', val: stats.total_surat || 0, icon: 'fa-envelope', color: 'bg-green-500' },
      { label: 'Program Kerja', val: stats.total_proker || 0, icon: 'fa-clipboard-list', color: 'bg-purple-500' },
      { label: 'Kegiatan', val: stats.total_kegiatan || 0, icon: 'fa-calendar', color: 'bg-orange-500' },
    ].map(s => `
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 ${s.color} rounded-lg flex items-center justify-center"><i class="fas ${s.icon} text-white"></i></div>
            <div><div class="text-2xl font-bold text-gray-800 dark:text-gray-100">${s.val}</div><div class="text-xs text-gray-500 dark:text-gray-400">${s.label}</div></div>
          </div>
        </div>
      `).join('')}
      </div>

      <!-- Charts Section -->
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <!-- Activity Trend Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
          <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4"><i class="fas fa-chart-line text-blue-500 mr-2"></i>Tren Aktivitas</h3>
          <div class="h-64">
            <canvas id="activity-chart"></canvas>
          </div>
        </div>
        
        <!-- Member Distribution Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
          <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4"><i class="fas fa-pie-chart text-purple-500 mr-2"></i>Distribusi Anggota</h3>
          <div class="h-64">
            <canvas id="member-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Quick Summary -->
      <div id="dashboard-summary" class="grid md:grid-cols-3 gap-4">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm opacity-80">Minggu Ini</div>
              <div class="text-2xl font-bold" id="week-kegiatan">0</div>
              <div class="text-xs opacity-70">Kegiatan</div>
            </div>
            <i class="fas fa-calendar-week text-3xl opacity-50"></i>
          </div>
        </div>
        <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm opacity-80">Hari Ini</div>
              <div class="text-2xl font-bold" id="today-absensi">0</div>
              <div class="text-xs opacity-70">Check-in</div>
            </div>
            <i class="fas fa-user-check text-3xl opacity-50"></i>
          </div>
        </div>
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm opacity-80">Audit Log</div>
              <div class="text-2xl font-bold" id="today-logs">0</div>
              <div class="text-xs opacity-70">Aktivitas hari ini</div>
            </div>
            <i class="fas fa-history text-3xl opacity-50"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Profil KKG Tab -->
    <div id="panel-profil" class="hidden">
      <div class="grid gap-6">
        <!-- Logo & Header Section -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4"><i class="fas fa-image text-blue-500 mr-2"></i>Logo & Header</h2>
          <div class="flex flex-col md:flex-row gap-6">
            <div class="flex-shrink-0">
              <div id="logo-preview" class="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
                ${settings.logo_url
      ? `<img src="${settings.logo_url}" alt="Logo KKG" class="w-full h-full object-contain">`
      : `<span class="text-gray-400 text-sm text-center px-2">Belum ada logo</span>`
    }
              </div>
              <label class="mt-3 block cursor-pointer">
                <input type="file" id="logo-input" accept="image/*" class="hidden" onchange="uploadLogo(this)">
                <span class="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer">
                  <i class="fas fa-upload mr-2"></i>Upload Logo
                </span>
              </label>
              <p class="text-xs text-gray-400 mt-1">Maks 2MB, PNG/JPEG/GIF</p>
            </div>
            <div class="flex-1 space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nama KKG</label>
                <input type="text" id="profil-nama_kkg" value="${escapeHtml(settings.nama_kkg || '')}" placeholder="KKG Gugus 3 Kecamatan Wanayasa"
                  class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tahun Ajaran</label>
                  <input type="text" id="profil-tahun_ajaran" value="${escapeHtml(settings.tahun_ajaran || '')}" placeholder="2025/2026"
                    class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">NPSN Sekolah Induk</label>
                  <input type="text" id="profil-npsn_sekolah_induk" value="${escapeHtml(settings.npsn_sekolah_induk || '')}" placeholder="20231234"
                    class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
                </div>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nama Sekolah Induk</label>
                <input type="text" id="profil-nama_sekolah_induk" value="${escapeHtml(settings.nama_sekolah_induk || '')}" placeholder="SDN 1 Wanayasa"
                  class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
              </div>
            </div>
          </div>
        </div>

        <!-- Alamat Section -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4"><i class="fas fa-map-marker-alt text-red-500 mr-2"></i>Alamat Sekretariat</h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Alamat Lengkap</label>
              <input type="text" id="profil-alamat_sekretariat" value="${escapeHtml(settings.alamat_sekretariat || '')}" 
                placeholder="Jl. Raya Wanayasa No. 1"
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kecamatan</label>
              <input type="text" id="profil-kecamatan" value="${escapeHtml(settings.kecamatan || '')}" placeholder="Wanayasa"
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kabupaten/Kota</label>
              <input type="text" id="profil-kabupaten" value="${escapeHtml(settings.kabupaten || '')}" placeholder="Purwakarta"
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Provinsi</label>
              <input type="text" id="profil-provinsi" value="${escapeHtml(settings.provinsi || '')}" placeholder="Jawa Barat"
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kode Pos</label>
              <input type="text" id="profil-kode_pos" value="${escapeHtml(settings.kode_pos || '')}" placeholder="41174"
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
          </div>
        </div>

        <!-- Kontak Section -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4"><i class="fas fa-phone text-green-500 mr-2"></i>Informasi Kontak</h2>
          <div class="grid md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email KKG</label>
              <input type="email" id="profil-email_kkg" value="${escapeHtml(settings.email_kkg || '')}" placeholder="kkg-wanayasa@example.com"
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Telepon</label>
              <input type="tel" id="profil-telepon_kkg" value="${escapeHtml(settings.telepon_kkg || '')}" placeholder="0817xxxxxxxx"
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Website</label>
              <input type="url" id="profil-website_kkg" value="${escapeHtml(settings.website_kkg || '')}" placeholder="https://kkg-wanayasa.id"
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
          </div>
        </div>

        <!-- Struktur Organisasi Section -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4"><i class="fas fa-sitemap text-purple-500 mr-2"></i>Struktur Organisasi</h2>
          <div class="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nama Ketua</label>
              <input type="text" id="profil-nama_ketua" value="${escapeHtml(settings.nama_ketua || '')}" placeholder="Nama Ketua KKG"
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nama Sekretaris</label>
              <input type="text" id="profil-nama_sekretaris" value="${escapeHtml(settings.nama_sekretaris || '')}" placeholder="Nama Sekretaris"
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nama Bendahara</label>
              <input type="text" id="profil-nama_bendahara" value="${escapeHtml(settings.nama_bendahara || '')}" placeholder="Nama Bendahara"
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Struktur Lengkap (JSON/Text)</label>
            <textarea id="profil-struktur_organisasi" rows="4" placeholder='{"ketua": "Nama", "sekretaris": "Nama", ...}'
              class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl font-mono text-sm">${escapeHtml(settings.struktur_organisasi || '')}</textarea>
            <p class="text-xs text-gray-400 mt-1">Format JSON atau teks bebas untuk kebutuhan dokumen</p>
          </div>
        </div>

        <!-- Visi Misi Section -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4"><i class="fas fa-bullseye text-indigo-500 mr-2"></i>Visi & Misi</h2>
          <div>
            <textarea id="profil-visi_misi" rows="5" placeholder="Visi:\n...\n\nMisi:\n1. ...\n2. ..."
              class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">${escapeHtml(settings.visi_misi || '')}</textarea>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end">
          <button onclick="saveProfilKKG()" class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg">
            <i class="fas fa-save mr-2"></i>Simpan Profil KKG
          </button>
        </div>
      </div>
    </div>

    <!-- Sekolah Tab -->
    <div id="panel-sekolah" class="hidden">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-school text-green-500 mr-2"></i>Daftar Sekolah Anggota KKG</h2>
          <button onclick="showAddSekolahModal()" class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">
            <i class="fas fa-plus mr-1"></i>Tambah Sekolah
          </button>
        </div>
        
        <!-- Info Box -->
        <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
          <div class="flex items-start gap-3">
            <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
            <div class="text-sm text-blue-700 dark:text-blue-300">
              <p class="font-medium mb-1">Data Sekolah untuk AI</p>
              <p class="text-blue-600 dark:text-blue-400">Data sekolah ini akan digunakan oleh AI ketika generate Program Kerja dan Surat agar tidak salah menyebutkan nama sekolah.</p>
            </div>
          </div>
        </div>
        
        <!-- Sekolah Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-700">
                <th class="px-4 py-3 text-center dark:text-gray-300 w-12">No</th>
                <th class="px-4 py-3 text-left dark:text-gray-300">Nama Sekolah</th>
                <th class="px-4 py-3 text-left dark:text-gray-300">Tipe</th>
                <th class="px-4 py-3 text-left dark:text-gray-300">Kepala Sekolah</th>
                <th class="px-4 py-3 text-center dark:text-gray-300">Guru</th>
                <th class="px-4 py-3 text-center dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody id="sekolah-table-body">
              <tr><td colspan="6" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Memuat...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Sekolah Modal -->
      <div id="sekolah-modal" class="hidden fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4">
          <div class="fixed inset-0 bg-black bg-opacity-50" onclick="closeSekolahModal()"></div>
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg relative z-10">
            <div class="px-6 py-4 border-b dark:border-gray-700">
              <h3 id="sekolah-modal-title" class="text-lg font-bold text-gray-800 dark:text-gray-100">Tambah Sekolah</h3>
            </div>
            <form id="sekolah-form" onsubmit="saveSekolah(event)" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Sekolah *</label>
                <input type="text" name="nama" required class="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" placeholder="SDN 1 Wanayasa">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NPSN</label>
                  <input type="text" name="npsn" class="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" placeholder="20231234">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipe</label>
                  <select name="tipe" class="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg">
                    <option value="negeri">Negeri</option>
                    <option value="swasta">Swasta</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kepala Sekolah</label>
                <input type="text" name="kepala_sekolah" class="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" placeholder="Nama kepala sekolah">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Guru</label>
                  <input type="number" name="jumlah_guru" class="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" placeholder="15">
                </div>
                <div class="flex items-end gap-4">
                  <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" name="is_sekretariat" class="w-4 h-4">
                    <span>Sekretariat</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" name="is_sekolah_penggerak" class="w-4 h-4">
                    <span>Penggerak</span>
                  </label>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alamat</label>
                <input type="text" name="alamat" class="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" placeholder="Jl. Raya Wanayasa No. 1">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan</label>
                <input type="text" name="keterangan" class="w-full px-4 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" placeholder="Keterangan tambahan">
              </div>
              <div class="flex justify-end gap-2 pt-4">
                <button type="button" onclick="closeSekolahModal()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Batal</button>
                <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Tab -->
    <div id="panel-settings" class="hidden">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4"><i class="fas fa-key text-yellow-500 mr-2"></i>Pengaturan API Mistral</h2>
        <form onsubmit="saveSettings(event)">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">API Key Mistral Large 3</label>
              <input type="text" name="mistral_api_key" placeholder="Masukkan API Key Mistral..." value="${escapeHtml(settings.mistral_api_key || '')}"
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl font-mono text-sm">
              <p class="text-xs text-gray-400 mt-1">Dapatkan API Key dari <a href="https://console.mistral.ai/" target="_blank" class="text-blue-500 underline">console.mistral.ai</a></p>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nama Ketua KKG</label>
                <input type="text" name="nama_ketua" value="${escapeHtml(settings.nama_ketua || '')}" class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tahun Ajaran</label>
                <input type="text" name="tahun_ajaran" value="${escapeHtml(settings.tahun_ajaran || '')}" class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Alamat Sekretariat</label>
              <input type="text" name="alamat_sekretariat" value="${escapeHtml(settings.alamat_sekretariat || '')}" class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
            <button type="submit" class="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
              <i class="fas fa-save mr-2"></i>Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>

      <!-- Maintenance Section -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700 mt-6">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4"><i class="fas fa-tools text-gray-500 mr-2"></i>Pemeliharaan</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <h3 class="font-semibold text-gray-700 dark:text-gray-200">Bersihkan Cache Browser</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Hapus semua file yang tersimpan di cache browser. Berguna jika tampilan tidak update setelah perubahan.</p>
            </div>
            <button onclick="clearAllCaches()" class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition flex-shrink-0 ml-4">
              <i class="fas fa-broom mr-1"></i>Bersihkan
            </button>
          </div>
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <h3 class="font-semibold text-gray-700 dark:text-gray-200">Inisialisasi Database</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Reset dan inisialisasi ulang database. Hanya gunakan jika diperlukan.</p>
            </div>
            <button onclick="initDb()" class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition flex-shrink-0 ml-4">
              <i class="fas fa-database mr-1"></i>Init DB
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Templates Tab -->
    <div id="panel-templates" class="hidden">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-file-alt text-orange-500 mr-2"></i>Template Surat</h2>
          <button onclick="showTemplateModal()" class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
            <i class="fas fa-plus mr-1"></i>Tambah Template
          </button>
        </div>
        
        <!-- Filter by jenis -->
        <div class="flex gap-2 mb-4 flex-wrap">
          <button onclick="filterTemplates('')" class="template-filter-btn px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 active">Semua</button>
          <button onclick="filterTemplates('undangan')" class="template-filter-btn px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600">Undangan</button>
          <button onclick="filterTemplates('tugas')" class="template-filter-btn px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600">Tugas</button>
          <button onclick="filterTemplates('keterangan')" class="template-filter-btn px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600">Keterangan</button>
          <button onclick="filterTemplates('edaran')" class="template-filter-btn px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600">Edaran</button>
          <button onclick="filterTemplates('permohonan')" class="template-filter-btn px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600">Permohonan</button>
        </div>
        
        <!-- Templates list -->
        <div id="templates-list" class="space-y-3">
          <div class="text-center py-8 text-gray-400"><div class="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>Memuat template...</div>
        </div>
      </div>
    </div>

// Users Tab
    <div id="panel-users" class="hidden">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4"><i class="fas fa-users-cog text-blue-500 mr-2"></i>Kelola Pengguna</h2>
        
        <!-- User Edit Modal -->
        <div id="edit-user-modal" class="hidden fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick="document.getElementById('edit-user-modal').classList.add('hidden')"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-blue-200">
              <div class="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <h3 class="font-bold text-gray-800 flex items-center"><i class="fas fa-user-edit text-blue-600 mr-2"></i>Edit Pengguna</h3>
              </div>
              <form onsubmit="saveUser(event)" class="p-6 space-y-4">
                <input type="hidden" name="id">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input type="text" name="nama" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Sekolah</label>
                  <select name="sekolah" id="user-sekolah-select" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Pilih Sekolah --</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select name="role" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div class="flex justify-end gap-2 pt-4">
                  <button type="button" onclick="document.getElementById('edit-user-modal').classList.add('hidden')" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Batal</button>
                  <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="bg-gray-50 dark:bg-gray-700"><th class="px-4 py-3 text-left dark:text-gray-300">Nama</th><th class="px-4 py-3 text-left dark:text-gray-300">Email</th><th class="px-4 py-3 text-left dark:text-gray-300">Sekolah</th><th class="px-4 py-3 text-center dark:text-gray-300">Role</th><th class="px-4 py-3 text-center dark:text-gray-300">Aksi</th></tr></thead>
            <tbody>
              ${users.map(u => `
                <tr class="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="px-4 py-3 font-medium dark:text-gray-200">${escapeHtml(u.nama)}</td>
                  <td class="px-4 py-3 text-gray-500 dark:text-gray-400">${escapeHtml(u.email)}</td>
                  <td class="px-4 py-3 text-gray-500 dark:text-gray-400">${escapeHtml(u.sekolah || '-')}</td>
                  <td class="px-4 py-3 text-center"><span class="px-2 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}">${u.role}</span></td>
                  <td class="px-4 py-3 text-center">
                    <button onclick='editUser(${JSON.stringify(u).replace(/'/g, "&#39;")})' class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 mr-1" title="Edit User">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="resetUserPassword(${u.id})" class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded text-xs hover:bg-yellow-200 dark:hover:bg-yellow-900/50" title="Reset password">
                      <i class="fas fa-key"></i>
                    </button>
                    <button onclick="deleteUser(${u.id})" class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs hover:bg-red-200 dark:hover:bg-red-900/50 ml-1" title="Hapus User">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Audit Log Tab -->
    <div id="panel-logs" class="hidden">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-history text-purple-500 mr-2"></i>Audit Log</h2>
          <div id="log-stats" class="flex gap-4 text-sm text-gray-500 dark:text-gray-400"></div>
        </div>
        
        <!-- Filters -->
        <div class="grid md:grid-cols-4 gap-3 mb-4">
          <select id="log-filter-action" onchange="loadAuditLogs()" class="px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm">
            <option value="">Semua Aksi</option>
          </select>
          <input type="date" id="log-filter-start" onchange="loadAuditLogs()" class="px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm">
          <input type="date" id="log-filter-end" onchange="loadAuditLogs()" class="px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm">
          <input type="text" id="log-filter-search" onkeyup="debounceLogSearch()" placeholder="Cari..." class="px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm">
        </div>

        <!-- Log Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-700">
                <th class="px-4 py-3 text-left dark:text-gray-300">Waktu</th>
                <th class="px-4 py-3 text-left dark:text-gray-300">User</th>
                <th class="px-4 py-3 text-left dark:text-gray-300">Aksi</th>
                <th class="px-4 py-3 text-left dark:text-gray-300">Detail</th>
              </tr>
            </thead>
            <tbody id="audit-log-body">
              <tr><td colspan="4" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Memuat...</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div id="log-pagination" class="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400"></div>
      </div>
    </div>
  </div>`;
}

// Tab switching
window.switchAdminTab = function (tab) {
  const tabs = ['dashboard', 'profil', 'sekolah', 'settings', 'templates', 'users', 'logs'];
  tabs.forEach(t => {
    const tabBtn = document.getElementById(`tab-${t}`);
    const panel = document.getElementById(`panel-${t}`);
    if (t === tab) {
      tabBtn?.classList.add('border-b-2', 'border-blue-500', 'text-blue-600', 'dark:text-blue-400');
      tabBtn?.classList.remove('text-gray-500', 'dark:text-gray-400');
      panel?.classList.remove('hidden');
    } else {
      tabBtn?.classList.remove('border-b-2', 'border-blue-500', 'text-blue-600', 'dark:text-blue-400');
      tabBtn?.classList.add('text-gray-500', 'dark:text-gray-400');
      panel?.classList.add('hidden');
    }
  });

  // Load data when switching tabs
  if (tab === 'logs') {
    loadAuditLogsActions();
    loadAuditLogs();
    loadAuditStats();
  } else if (tab === 'sekolah') {
    loadSekolah();
  } else if (tab === 'templates') {
    loadTemplates();
  }
}

// Audit log state
let auditLogPage = 1;
let logSearchTimeout = null;

window.debounceLogSearch = function () {
  if (logSearchTimeout) clearTimeout(logSearchTimeout);
  logSearchTimeout = setTimeout(() => loadAuditLogs(), 500);
}

async function loadAuditLogsActions() {
  try {
    const res = await api('/admin/logs/actions');
    const select = document.getElementById('log-filter-action');
    if (select && res.data) {
      select.innerHTML = '<option value="">Semua Aksi</option>' +
        res.data.map(a => `<option value="${a.value}">${escapeHtml(a.label)}</option>`).join('');
    }
  } catch (e) { console.error('Load actions error:', e); }
}

async function loadAuditStats() {
  try {
    const res = await api('/admin/logs/stats');
    const container = document.getElementById('log-stats');
    if (container && res.data) {
      container.innerHTML = `
                <span><i class="fas fa-list mr-1"></i>Total: ${res.data.total}</span>
                <span><i class="fas fa-calendar-day mr-1"></i>Hari ini: ${res.data.today}</span>
                <span><i class="fas fa-calendar-week mr-1"></i>Minggu ini: ${res.data.thisWeek}</span>
            `;
    }
  } catch (e) { console.error('Load stats error:', e); }
}

window.loadAuditLogs = async function (page = 1) {
  auditLogPage = page;
  const body = document.getElementById('audit-log-body');
  const pagination = document.getElementById('log-pagination');

  body.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Memuat...</td></tr>';

  try {
    const action = document.getElementById('log-filter-action')?.value || '';
    const startDate = document.getElementById('log-filter-start')?.value || '';
    const endDate = document.getElementById('log-filter-end')?.value || '';
    const search = document.getElementById('log-filter-search')?.value || '';

    const params = new URLSearchParams({ page, limit: 20 });
    if (action) params.append('action', action);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (search) params.append('search', search);

    const res = await api(`/admin/logs?${params.toString()}`);
    const logs = res.data?.logs || [];
    const pag = res.data?.pagination || {};

    if (logs.length === 0) {
      body.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-gray-400"><i class="fas fa-inbox mr-2"></i>Tidak ada log ditemukan</td></tr>';
    } else {
      body.innerHTML = logs.map(log => `
                <tr class="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td class="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">${formatLogTime(log.created_at)}</td>
                    <td class="px-4 py-3">
                        <div class="font-medium dark:text-gray-200">${escapeHtml(log.user_name || 'System')}</div>
                        <div class="text-xs text-gray-400">${escapeHtml(log.user_email || '')}</div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}">
                            ${formatAction(log.action)}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate" title="${escapeHtml(JSON.stringify(log.details || {}))}">
                        ${formatDetails(log)}
                    </td>
                </tr>
            `).join('');
    }

    // Pagination
    if (pag.totalPages > 1) {
      let pagHtml = `<span>Menampilkan ${((pag.page - 1) * pag.limit) + 1}-${Math.min(pag.page * pag.limit, pag.total)} dari ${pag.total}</span><div class="flex gap-1">`;

      if (pag.page > 1) {
        pagHtml += `<button onclick="loadAuditLogs(${pag.page - 1})" class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><i class="fas fa-chevron-left"></i></button>`;
      }

      for (let i = Math.max(1, pag.page - 2); i <= Math.min(pag.totalPages, pag.page + 2); i++) {
        const active = i === pag.page ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200';
        pagHtml += `<button onclick="loadAuditLogs(${i})" class="px-3 py-1 rounded ${active}">${i}</button>`;
      }

      if (pag.page < pag.totalPages) {
        pagHtml += `<button onclick="loadAuditLogs(${pag.page + 1})" class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><i class="fas fa-chevron-right"></i></button>`;
      }

      pagHtml += '</div>';
      pagination.innerHTML = pagHtml;
    } else {
      pagination.innerHTML = `<span>Total: ${pag.total || 0} log</span>`;
    }

  } catch (e) {
    body.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i>${e.message}</td></tr>`;
  }
}

function formatLogTime(datetime) {
  if (!datetime) return '-';
  const d = new Date(datetime);
  return d.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
}

function formatAction(action) {
  const labels = {
    'USER_LOGIN': 'Login',
    'USER_LOGOUT': 'Logout',
    'USER_REGISTER': 'Registrasi',
    'USER_PASSWORD_RESET': 'Reset Password',
    'USER_PROFILE_UPDATE': 'Update Profil',
    'USER_DELETE': 'Hapus User',
    'SETTINGS_UPDATE': 'Update Pengaturan',
    'KEGIATAN_CREATE': 'Buat Kegiatan',
    'ABSENSI_CHECKIN': 'Check-in',
    'ABSENSI_QR_GENERATE': 'Generate QR',
    'MATERI_UPLOAD': 'Upload Materi',
    'SURAT_CREATE': 'Buat Surat',
    'ADMIN_ACTION': 'Aksi Admin'
  };
  return labels[action] || action.replace(/_/g, ' ');
}

function getActionColor(action) {
  if (action.includes('DELETE')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (action.includes('CREATE') || action.includes('UPLOAD')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (action.includes('UPDATE') || action.includes('RESET')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
}

function formatDetails(log) {
  if (!log.details) return '-';
  if (typeof log.details === 'string') return log.details;

  // Format common details
  const d = log.details;
  if (d.deleted_user_id) return `User ID: ${d.deleted_user_id}`;
  if (d.action) return d.action;
  if (log.entity_type && log.entity_id) return `${log.entity_type} #${log.entity_id}`;

  return JSON.stringify(d).substring(0, 50) + '...';
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
    // Update local state
    state.settings = {
      ...state.settings, ...{
        mistral_api_key: form.mistral_api_key.value,
        nama_ketua: form.nama_ketua.value,
        tahun_ajaran: form.tahun_ajaran.value,
        alamat_sekretariat: form.alamat_sekretariat.value,
      }
    };
    showToast('Pengaturan berhasil disimpan!', 'success');

  } catch (e) { showToast(e.message, 'error'); }
}

window.saveProfilKKG = async function () {
  const btn = document.querySelector('#panel-profil button');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Menyimpan...';

  const fields = [
    'nama_kkg', 'tahun_ajaran', 'npsn_sekolah_induk', 'nama_sekolah_induk',
    'alamat_sekretariat', 'kecamatan', 'kabupaten', 'provinsi', 'kode_pos',
    'email_kkg', 'telepon_kkg', 'website_kkg',
    'nama_ketua', 'nama_sekretaris', 'nama_bendahara',
    'struktur_organisasi', 'visi_misi'
  ];

  const data = {};
  fields.forEach(field => {
    const el = document.getElementById(`profil-${field}`);
    if (el) data[field] = el.value;
  });

  try {
    await api('/admin/settings', {
      method: 'PUT',
      body: data
    });
    showToast('Profil KKG berhasil disimpan!', 'success');

    // Update local state partially
    state.settings = { ...state.settings, ...data };

  } catch (e) {
    console.error('Save profil error:', e);
    showToast('Gagal menyimpan profil: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

window.uploadLogo = async function (input) {
  const file = input.files[0];
  if (!file) return;

  // Validate size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showToast('Ukuran file maksimal 2MB', 'error');
    input.value = '';
    return;
  }

  const formData = new FormData();
  formData.append('logo', file);

  const preview = document.getElementById('logo-preview');
  const originalContent = preview.innerHTML;
  preview.innerHTML = '<div class="text-gray-400 flex flex-col items-center"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><span class="text-xs">Uploading...</span></div>';

  try {
    const res = await api('/admin/settings/logo', {
      method: 'POST',
      body: formData
    });

    // Update preview
    if (res.data && res.data.logo_url) {
      preview.innerHTML = `<img src="${res.data.logo_url}" alt="Logo KKG" class="w-full h-full object-contain">`;
      showToast('Logo berhasil diupload!', 'success');

      // Update local state if needed
      if (state.settings) state.settings.logo_url = res.data.logo_url;
    } else {
      throw new Error('Gagal mendapatkan URL logo');
    }

  } catch (e) {
    console.error('Upload logo error:', e);
    showToast(e.message || 'Gagal mengupload logo', 'error');
    preview.innerHTML = originalContent;
  } finally {
    input.value = ''; // Reset input to allow re-uploading same file
  }
}

window.editUser = async function (user) {
  const modal = document.getElementById('edit-user-modal');
  const form = modal.querySelector('form');
  const sekolahSelect = document.getElementById('user-sekolah-select');

  // Load sekolah list to dropdown
  try {
    const res = await api('/sekolah');
    const sekolahList = res.data || [];
    sekolahSelect.innerHTML = '<option value="">-- Pilih Sekolah --</option>' +
      sekolahList.map(s => `<option value="${escapeHtml(s.nama)}">${escapeHtml(s.nama)}</option>`).join('');
  } catch (e) {
    console.error('Failed to load sekolah:', e);
  }

  form.id.value = user.id;
  form.nama.value = user.nama || '';
  form.email.value = user.email || '';
  form.sekolah.value = user.sekolah || '';
  form.role.value = user.role || 'user';

  modal.classList.remove('hidden');
}

window.saveUser = async function (e) {
  e.preventDefault();
  const form = e.target;
  // Find submit btn
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Menyimpan...';

  try {
    await api(`/admin/users/${form.id.value}`, {
      method: 'PUT',
      body: {
        nama: form.nama.value,
        email: form.email.value,
        sekolah: form.sekolah.value,
        role: form.role.value
      }
    });
    showToast('Data user berhasil disimpan!', 'success');
    document.getElementById('edit-user-modal').classList.add('hidden');
    window.location.reload();
  } catch (e) {
    showToast(e.message, 'error');
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

window.deleteUser = async function (id) {
  if (!confirm('Apakah Anda yakin ingin menghapus user ini secara permanen?')) return;
  try {
    await api(`/admin/users/${id}`, { method: 'DELETE' });
    showToast('User berhasil dihapus', 'success');
    window.location.reload();
  } catch (e) { showToast(e.message, 'error'); }
}

window.resetUserPassword = async function (userId) {
  const newPw = prompt('Masukkan password baru (min. 6 karakter):');
  if (!newPw || newPw.length < 6) { showToast('Password minimal 6 karakter', 'error'); return; }
  try {
    await api(`/admin/users/${userId}/reset-password`, { method: 'POST', body: { new_password: newPw } });
    showToast('Password berhasil direset!', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

// Save KKG Profile
window.saveProfilKKG = async function () {
  const profilFields = [
    'nama_kkg', 'tahun_ajaran', 'npsn_sekolah_induk', 'nama_sekolah_induk',
    'alamat_sekretariat', 'kecamatan', 'kabupaten', 'provinsi', 'kode_pos',
    'email_kkg', 'telepon_kkg', 'website_kkg',
    'nama_ketua', 'nama_sekretaris', 'nama_bendahara',
    'struktur_organisasi', 'visi_misi'
  ];

  const data = {};
  profilFields.forEach(field => {
    const el = document.getElementById(`profil-${field}`);
    if (el) data[field] = el.value;
  });

  try {
    await api('/admin/settings', { method: 'PUT', body: data });
    state.settings = { ...state.settings, ...data };
    showToast('Profil KKG berhasil disimpan!', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// Upload KKG Logo
window.uploadLogo = async function (input) {
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];

  // Validate file size
  if (file.size > 2 * 1024 * 1024) {
    showToast('Ukuran file maksimal 2MB', 'error');
    return;
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showToast('Tipe file tidak didukung. Gunakan PNG, JPEG, GIF, atau WebP', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('logo', file);

  try {
    const res = await fetch('/api/admin/settings/logo', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error?.message || 'Upload gagal');
    }

    // Update preview
    const preview = document.getElementById('logo-preview');
    if (preview && json.data?.logo_url) {
      preview.innerHTML = `<img src="${json.data.logo_url}" alt="Logo KKG" class="w-full h-full object-contain">`;
    }

    showToast('Logo berhasil diupload!', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }

  // Reset input
  input.value = '';
}

// ============================================
// Chart Functions for Dashboard
// ============================================

// Store chart instances for cleanup
let activityChart = null;
let memberChart = null;

// Initialize dashboard charts
window.initDashboardCharts = async function () {
  try {
    // Load trend data
    const trendsRes = await api('/dashboard/trends?period=weekly');
    const trends = trendsRes.data;

    // Load summary data
    const summaryRes = await api('/dashboard/summary');
    const summary = summaryRes.data;

    // Update quick summary cards
    const weekKegiatan = document.getElementById('week-kegiatan');
    const todayAbsensi = document.getElementById('today-absensi');
    const todayLogs = document.getElementById('today-logs');

    if (weekKegiatan) weekKegiatan.textContent = summary.thisWeek?.kegiatan || 0;
    if (todayAbsensi) todayAbsensi.textContent = summary.today?.absensi || 0;
    if (todayLogs) todayLogs.textContent = summary.today?.auditLogs || 0;

    // Initialize Activity Chart
    const activityCtx = document.getElementById('activity-chart');
    if (activityCtx && window.Chart) {
      // Destroy existing chart if any
      if (activityChart) activityChart.destroy();

      // Prepare data
      const labels = trends.surat?.map(d => d.period) || [];

      activityChart = new Chart(activityCtx, {
        type: 'line',
        data: {
          labels: labels.length > 0 ? labels : ['No Data'],
          datasets: [
            {
              label: 'Surat',
              data: trends.surat?.map(d => d.count) || [],
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Absensi',
              data: trends.absensi?.map(d => d.count) || [],
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Materi',
              data: trends.materi?.map(d => d.count) || [],
              borderColor: '#a855f7',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 15
              }
            }
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }
      });
    }

    // Initialize Member Distribution Chart
    const memberCtx = document.getElementById('member-chart');
    if (memberCtx && window.Chart) {
      if (memberChart) memberChart.destroy();

      // Get member data
      const memberRes = await api('/dashboard/members');
      const memberData = memberRes.data;

      memberChart = new Chart(memberCtx, {
        type: 'doughnut',
        data: {
          labels: memberData?.bySchool?.map(s => s.sekolah) || ['No Data'],
          datasets: [{
            data: memberData?.bySchool?.map(s => s.count) || [1],
            backgroundColor: [
              '#3b82f6', '#22c55e', '#a855f7', '#f59e0b',
              '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6',
              '#14b8a6', '#f97316'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                usePointStyle: true,
                padding: 10,
                font: { size: 11 }
              }
            }
          }
        }
      });
    }
  } catch (e) {
    console.error('Failed to load dashboard charts:', e);
  }
}

// Call initDashboardCharts when switching to dashboard tab
const originalSwitchAdminTab = window.switchAdminTab;
window.switchAdminTab = function (tab) {
  originalSwitchAdminTab(tab);
  if (tab === 'dashboard') {
    setTimeout(() => initDashboardCharts(), 100);
  }
  if (tab === 'templates') {
    loadTemplates();
  }
}

// Initialize charts on page load
setTimeout(() => {
  if (document.getElementById('activity-chart')) {
    initDashboardCharts();
  }
}, 500);

// ============================================
// Template Management Functions
// ============================================

let currentTemplateFilter = '';

// Load templates
window.loadTemplates = async function () {
  const container = document.getElementById('templates-list');
  if (!container) return;

  try {
    const url = currentTemplateFilter
      ? `/templates?jenis=${currentTemplateFilter}&active=false`
      : '/templates?active=false';
    const res = await api(url);
    const templates = res.data || [];

    if (templates.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-400 dark:text-gray-500">
          <i class="fas fa-file-alt text-4xl mb-4 block"></i>
          <p>Belum ada template${currentTemplateFilter ? ` jenis "${currentTemplateFilter}"` : ''}.</p>
        </div>
      `;
      return;
    }

    const jenisColors = {
      undangan: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      tugas: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      keterangan: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      edaran: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      permohonan: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      lainnya: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };

    container.innerHTML = templates.map(t => `
      <div class="p-4 border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition ${!t.is_active ? 'opacity-60' : ''}">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-bold text-gray-800 dark:text-gray-100">${escapeHtml(t.nama)}</h3>
              <span class="px-2 py-0.5 ${jenisColors[t.jenis] || jenisColors.lainnya} text-xs rounded-full capitalize">${t.jenis}</span>
              ${!t.is_active ? '<span class="px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full">Non-aktif</span>' : ''}
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">${escapeHtml(t.deskripsi || 'Tidak ada deskripsi')}</p>
            <div class="flex flex-wrap gap-1 mt-2">
              ${(t.variables || []).map(v => `<span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded font-mono">{{${v}}}</span>`).join('')}
            </div>
          </div>
          <div class="flex gap-1 flex-shrink-0">
            <button onclick="previewTemplate(${t.id})" class="p-2 text-gray-400 hover:text-blue-500" title="Preview">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="editTemplate(${t.id})" class="p-2 text-gray-400 hover:text-green-500" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="duplicateTemplate(${t.id})" class="p-2 text-gray-400 hover:text-purple-500" title="Duplikasi">
              <i class="fas fa-copy"></i>
            </button>
            <button onclick="toggleTemplateActive(${t.id}, ${t.is_active})" class="p-2 text-gray-400 hover:text-yellow-500" title="${t.is_active ? 'Nonaktifkan' : 'Aktifkan'}">
              <i class="fas fa-${t.is_active ? 'toggle-on text-green-500' : 'toggle-off'}"></i>
            </button>
            <button onclick="deleteTemplate(${t.id}, '${escapeHtml(t.nama).replace(/'/g, "\\'")}')" class="p-2 text-gray-400 hover:text-red-500" title="Hapus">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Load templates error:', e);
    container.innerHTML = '<div class="text-center py-8 text-red-500">Gagal memuat template</div>';
  }
}

// Filter templates
window.filterTemplates = function (jenis) {
  currentTemplateFilter = jenis;

  // Update active button
  document.querySelectorAll('.template-filter-btn').forEach(btn => {
    btn.classList.remove('bg-orange-500', 'text-white');
    btn.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
  });

  event.target.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
  event.target.classList.add('bg-orange-500', 'text-white');

  loadTemplates();
}

// Show template modal (add/edit)
window.showTemplateModal = function (template = null) {
  const isEdit = !!template;

  const modal = document.createElement('div');
  modal.id = 'template-modal';
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-file-alt text-orange-500 mr-2"></i>${isEdit ? 'Edit' : 'Tambah'} Template</h3>
        <button onclick="closeTemplateModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
      </div>
      
      <form onsubmit="saveTemplate(event, ${template?.id || 'null'})">
        <div class="space-y-4">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nama Template *</label>
              <input type="text" id="tpl-nama" value="${escapeHtml(template?.nama || '')}" required
                class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Jenis *</label>
              <select id="tpl-jenis" required class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
                <option value="">Pilih Jenis</option>
                <option value="undangan" ${template?.jenis === 'undangan' ? 'selected' : ''}>Undangan</option>
                <option value="tugas" ${template?.jenis === 'tugas' ? 'selected' : ''}>Surat Tugas</option>
                <option value="keterangan" ${template?.jenis === 'keterangan' ? 'selected' : ''}>Surat Keterangan</option>
                <option value="edaran" ${template?.jenis === 'edaran' ? 'selected' : ''}>Surat Edaran</option>
                <option value="permohonan" ${template?.jenis === 'permohonan' ? 'selected' : ''}>Surat Permohonan</option>
                <option value="lainnya" ${template?.jenis === 'lainnya' ? 'selected' : ''}>Lainnya</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Deskripsi</label>
            <input type="text" id="tpl-deskripsi" value="${escapeHtml(template?.deskripsi || '')}" placeholder="Deskripsi singkat template"
              class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Konten Template *</label>
            <textarea id="tpl-konten" rows="10" required placeholder="Isi template surat...&#10;&#10;Gunakan {{variabel}} untuk placeholder, contoh:&#10;{{tanggal}}, {{waktu}}, {{tempat}}, {{acara}}"
              class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl font-mono text-sm">${escapeHtml(template?.konten || '')}</textarea>
            <p class="text-xs text-gray-400 mt-1">Variabel otomatis terdeteksi dari pattern {{nama_variabel}}</p>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="tpl-active" ${template?.is_active !== false ? 'checked' : ''}>
            <label for="tpl-active" class="text-sm text-gray-700 dark:text-gray-300">Template aktif</label>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button type="button" onclick="closeTemplateModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">Batal</button>
          <button type="submit" id="save-template-btn" class="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600">
            <i class="fas fa-save mr-2"></i>${isEdit ? 'Update' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

// Close template modal
window.closeTemplateModal = function () {
  const modal = document.getElementById('template-modal');
  if (modal) modal.remove();
}

// Save template
window.saveTemplate = async function (e, id) {
  e.preventDefault();
  const btn = document.getElementById('save-template-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Menyimpan...';

  try {
    const data = {
      nama: document.getElementById('tpl-nama').value,
      jenis: document.getElementById('tpl-jenis').value,
      deskripsi: document.getElementById('tpl-deskripsi').value,
      konten: document.getElementById('tpl-konten').value,
      is_active: document.getElementById('tpl-active').checked
    };

    if (id) {
      await api(`/templates/${id}`, { method: 'PUT', body: data });
      showToast('Template berhasil diperbarui!', 'success');
    } else {
      await api('/templates', { method: 'POST', body: data });
      showToast('Template berhasil ditambahkan!', 'success');
    }

    closeTemplateModal();
    loadTemplates();
  } catch (e) {
    showToast(e.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save mr-2"></i>Simpan';
  }
}

// Edit template
window.editTemplate = async function (id) {
  try {
    const res = await api(`/templates/${id}`);
    showTemplateModal(res.data);
  } catch (e) {
    showToast('Gagal memuat template', 'error');
  }
}

// Preview template
window.previewTemplate = async function (id) {
  try {
    const res = await api(`/templates/${id}`);
    const t = res.data;

    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-eye text-blue-500 mr-2"></i>Preview: ${escapeHtml(t.nama)}</h3>
          <button onclick="document.getElementById('preview-modal').remove()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl mb-4">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Variabel: ${(t.variables || []).map(v => `<code class="bg-gray-200 dark:bg-gray-600 px-1 rounded">{{${v}}}</code>`).join(', ')}</p>
        </div>
        <div class="p-6 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl font-serif whitespace-pre-wrap leading-relaxed">
          ${escapeHtml(t.konten)}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (e) {
    showToast('Gagal memuat preview', 'error');
  }
}

// Duplicate template
window.duplicateTemplate = async function (id) {
  if (!confirm('Duplikasi template ini?')) return;
  try {
    await api(`/templates/${id}/duplicate`, { method: 'POST' });
    showToast('Template berhasil diduplikasi!', 'success');
    loadTemplates();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// Toggle template active
window.toggleTemplateActive = async function (id, currentActive) {
  try {
    await api(`/templates/${id}/toggle`, { method: 'POST' });
    showToast(`Template ${currentActive ? 'dinonaktifkan' : 'diaktifkan'}!`, 'success');
    loadTemplates();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// Delete template
window.deleteTemplate = async function (id, nama) {
  if (!confirm(`Hapus template "${nama}"?`)) return;
  try {
    await api(`/templates/${id}`, { method: 'DELETE' });
    showToast('Template berhasil dihapus!', 'success');
    loadTemplates();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ============================================
// Sekolah Management Functions
// ============================================

let sekolahList = [];
let editingSekolah = null;

window.loadSekolah = async function () {
  const container = document.getElementById('sekolah-table-body');
  if (!container) return;

  try {
    const res = await api('/sekolah');
    sekolahList = res.data || [];
    renderSekolahTable();
  } catch (e) {
    container.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i>${e.message}</td></tr>`;
  }
}

function renderSekolahTable() {
  const container = document.getElementById('sekolah-table-body');
  if (!container) return;

  if (sekolahList.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-gray-400">
          <i class="fas fa-school text-2xl mb-2 block opacity-50"></i>
          Belum ada data sekolah
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = sekolahList.map((s, idx) => `
    <tr class="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td class="px-4 py-3 text-center font-medium dark:text-gray-300">${idx + 1}</td>
      <td class="px-4 py-3">
        <div class="font-semibold dark:text-gray-200">${escapeHtml(s.nama)}</div>
        ${s.is_sekretariat ? '<span class="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-0.5 rounded mt-1">Sekretariat</span>' : ''}
        ${s.is_sekolah_penggerak ? '<span class="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded mt-1 ml-1">Penggerak</span>' : ''}
      </td>
      <td class="px-4 py-3">
        <span class="capitalize ${s.tipe === 'negeri' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}">
          ${s.tipe === 'negeri' ? '<i class="fas fa-landmark mr-1"></i>' : '<i class="fas fa-building mr-1"></i>'}
          ${s.tipe}
        </span>
      </td>
      <td class="px-4 py-3 text-gray-600 dark:text-gray-400">${escapeHtml(s.kepala_sekolah || '-')}</td>
      <td class="px-4 py-3 text-center dark:text-gray-400">${s.jumlah_guru || '-'}</td>
      <td class="px-4 py-3">
        <div class="flex gap-2 justify-center">
          <button onclick="editSekolah(${s.id})" class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs hover:bg-blue-200" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteSekolah(${s.id}, '${escapeHtml(s.nama).replace(/'/g, "\\'")}');" class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs hover:bg-red-200" title="Hapus">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.showAddSekolahModal = function () {
  editingSekolah = null;
  document.getElementById('sekolah-modal-title').textContent = 'Tambah Sekolah';
  document.getElementById('sekolah-form').reset();
  document.getElementById('sekolah-modal').classList.remove('hidden');
}

window.editSekolah = function (id) {
  const sekolah = sekolahList.find(s => s.id === id);
  if (!sekolah) return;

  editingSekolah = sekolah;
  document.getElementById('sekolah-modal-title').textContent = 'Edit Sekolah';

  const form = document.getElementById('sekolah-form');
  form.nama.value = sekolah.nama || '';
  form.npsn.value = sekolah.npsn || '';
  form.tipe.value = sekolah.tipe || 'negeri';
  form.alamat.value = sekolah.alamat || '';
  form.kepala_sekolah.value = sekolah.kepala_sekolah || '';
  form.jumlah_guru.value = sekolah.jumlah_guru || '';
  form.is_sekretariat.checked = sekolah.is_sekretariat === 1;
  form.is_sekolah_penggerak.checked = sekolah.is_sekolah_penggerak === 1;
  form.keterangan.value = sekolah.keterangan || '';

  document.getElementById('sekolah-modal').classList.remove('hidden');
}

window.saveSekolah = async function (event) {
  event.preventDefault();

  const form = event.target;
  const data = {
    nama: form.nama.value.trim(),
    npsn: form.npsn.value.trim() || null,
    tipe: form.tipe.value,
    alamat: form.alamat.value.trim() || null,
    kepala_sekolah: form.kepala_sekolah.value.trim() || null,
    jumlah_guru: form.jumlah_guru.value ? parseInt(form.jumlah_guru.value) : null,
    is_sekretariat: form.is_sekretariat.checked,
    is_sekolah_penggerak: form.is_sekolah_penggerak.checked,
    keterangan: form.keterangan.value.trim() || null
  };

  if (!data.nama) {
    showToast('Nama sekolah harus diisi', 'error');
    return;
  }

  try {
    if (editingSekolah) {
      await api(`/sekolah/${editingSekolah.id}`, { method: 'PUT', body: data });
      showToast('Sekolah berhasil diperbarui', 'success');
    } else {
      await api('/sekolah', { method: 'POST', body: data });
      showToast('Sekolah berhasil ditambahkan', 'success');
    }
    closeSekolahModal();
    await loadSekolah();
  } catch (e) {
    showToast('Gagal menyimpan: ' + e.message, 'error');
  }
}

window.deleteSekolah = async function (id, nama) {
  if (!confirm(`Yakin ingin menghapus "${nama}"?`)) return;

  try {
    await api(`/sekolah/${id}`, { method: 'DELETE' });
    showToast('Sekolah berhasil dihapus', 'success');
    await loadSekolah();
  } catch (e) {
    showToast('Gagal menghapus: ' + e.message, 'error');
  }
}

window.closeSekolahModal = function () {
  document.getElementById('sekolah-modal').classList.add('hidden');
  editingSekolah = null;
}
