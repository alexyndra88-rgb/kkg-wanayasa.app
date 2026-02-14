
import { api } from '../api.js';
import { state } from '../state.js';
import { escapeHtml, showToast, formatDateTime, skeletonTable } from '../utils.js';

// Initialize admin data
window.initAdminData = async function () {
  const tasks = [
    loadAdminDashboard(),
    loadAdminSettings()
    // Users are loaded when tab is switched or explicitly requested
  ];
  await Promise.allSettled(tasks);
}

// Load Dashboard Data
async function loadAdminDashboard() {
  try {
    const res = await api('/admin/dashboard');
    const stats = res.data;

    updateStatCard('total-guru', stats.total_guru || 0);
    updateStatCard('total-surat', stats.total_surat || 0);
    updateStatCard('total-proker', stats.total_proker || 0);
    updateStatCard('total-kegiatan', stats.total_kegiatan || 0);

    if (!document.getElementById('panel-dashboard').classList.contains('hidden')) {
      setTimeout(() => initDashboardCharts(), 100);
    }
  } catch (e) {
    console.error('Failed to load dashboard:', e);
  }
}

// Load Settings Data
async function loadAdminSettings() {
  try {
    const res = await api('/admin/settings');
    const s = res.data;

    setVal('profil-nama_kkg', s.nama_kkg);
    setVal('profil-tahun_ajaran', s.tahun_ajaran);
    setVal('profil-npsn_sekolah_induk', s.npsn_sekolah_induk);
    setVal('profil-nama_sekolah_induk', s.nama_sekolah_induk);
    setVal('profil-alamat_sekretariat', s.alamat_sekretariat);
    setVal('profil-kecamatan', s.kecamatan);
    setVal('profil-kabupaten', s.kabupaten);
    setVal('profil-provinsi', s.provinsi);
    setVal('profil-kode_pos', s.kode_pos);
    setVal('profil-email_kkg', s.email_kkg);
    setVal('profil-telepon_kkg', s.telepon_kkg);
    setVal('profil-website_kkg', s.website_kkg);
    setVal('profil-nama_ketua', s.nama_ketua);
    setVal('profil-nama_sekretaris', s.nama_sekretaris);
    setVal('profil-nama_bendahara', s.nama_bendahara);
    setVal('profil-struktur_organisasi', s.struktur_organisasi);
    setVal('profil-visi_misi', s.visi_misi);

    const form = document.querySelector('#panel-settings form');
    if (form) {
      if (form.mistral_api_key) form.mistral_api_key.value = s.mistral_api_key || '';
      if (form.nama_ketua) form.nama_ketua.value = s.nama_ketua || '';
      if (form.tahun_ajaran) form.tahun_ajaran.value = s.tahun_ajaran || '';
      if (form.alamat_sekretariat) form.alamat_sekretariat.value = s.alamat_sekretariat || '';
    }

    const logoContainer = document.getElementById('logo-preview');
    if (logoContainer && s.logo_url) {
      logoContainer.innerHTML = `<img src="${s.logo_url}" alt="Logo KKG" class="w-full h-full object-contain">`;
    }

  } catch (e) { console.error('Failed to load settings:', e); }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function updateStatCard(id, val) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = val;
    el.parentElement.parentElement.classList.remove('animate-pulse');
  }
}

// Load Users Data
window.loadAdminUsers = async function () {
  const container = document.querySelector('#panel-users tbody');
  if (!container) return;

  // Use skeleton loader
  container.innerHTML = skeletonTable(5, 5);

  try {
    const res = await api('/admin/users');
    const users = res.data || [];

    if (users.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-[var(--color-text-tertiary)]">Belum ada user</td></tr>`;
      return;
    }

    container.innerHTML = users.map(u => `
      <tr class="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
        <td class="px-4 py-3 font-medium text-[var(--color-text-primary)] relative group">
           ${escapeHtml(u.nama)}
           <div class="hidden group-hover:block absolute top-0 left-0 bg-black text-white text-xs p-1 rounded z-10">${u.id}</div>
        </td>
        <td class="px-4 py-3 text-[var(--color-text-secondary)]">${escapeHtml(u.email)}</td>
        <td class="px-4 py-3 text-[var(--color-text-secondary)]">${escapeHtml(u.sekolah || '-')}</td>
        <td class="px-4 py-3 text-center">
            <span class="px-2 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}">${u.role}</span>
        </td>
        <td class="px-4 py-3 text-center">
          <button onclick='editUser(${JSON.stringify(u).replace(/'/g, "&#39;")})' class="btn btn-sm bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 border-none mr-1" title="Edit User">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="resetUserPassword(${u.id})" class="btn btn-sm bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 border-none" title="Reset password">
            <i class="fas fa-key"></i>
          </button>
          <button onclick="deleteUser(${u.id})" class="btn btn-sm bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 border-none ml-1" title="Hapus User">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    container.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500">Gagal memuat user: ${e.message}</td></tr>`;
  }
}

export async function renderAdmin() {
  if (!state.user || state.user.role !== 'admin') {
    return `
      <div class="fade-in max-w-4xl mx-auto py-16 px-4 text-center">
        <div class="bg-[var(--color-bg-elevated)] border border-red-200 dark:border-red-900/50 rounded-3xl p-10 max-w-lg mx-auto shadow-xl">
          <i class="fas fa-lock text-5xl text-red-500 mb-6 block"></i>
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)] mb-3">Akses Ditolak</h2>
          <p class="text-[var(--color-text-secondary)] mb-6">Halaman ini hanya dapat diakses oleh Administrator.</p>
          <button onclick="navigate('home')" class="btn btn-primary">Kembali ke Beranda</button>
        </div>
      </div>`;
  }

  // Trigger data loading in background
  setTimeout(() => window.initAdminData(), 0);

  return `
  <div class="fade-in max-w-7xl mx-auto py-8 px-4">
    <div class="flex items-center gap-3 mb-8">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <i class="fas fa-cog text-xl"></i>
        </div>
        <div>
            <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">Panel Admin</h1>
            <p class="text-[var(--color-text-secondary)]">Kelola sistem, pengguna, dan pengaturan KKG</p>
        </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex flex-wrap gap-2 mb-8 bg-[var(--color-bg-elevated)] p-1 rounded-xl border border-[var(--color-border-subtle)] shadow-sm w-fit">
      <button onclick="switchAdminTab('dashboard')" id="tab-dashboard" class="px-4 py-2 text-sm font-bold rounded-lg transition-all bg-primary-100/10 text-primary-600 shadow-sm">
        <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
      </button>
      <button onclick="switchAdminTab('profil')" id="tab-profil" class="px-4 py-2 text-sm font-medium rounded-lg transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]">
        <i class="fas fa-building mr-2"></i>Profil
      </button>
      <button onclick="switchAdminTab('sekolah')" id="tab-sekolah" class="px-4 py-2 text-sm font-medium rounded-lg transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]">
        <i class="fas fa-school mr-2"></i>Sekolah
      </button>
      <button onclick="switchAdminTab('settings')" id="tab-settings" class="px-4 py-2 text-sm font-medium rounded-lg transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]">
        <i class="fas fa-sliders-h mr-2"></i>Pengaturan
      </button>
      <button onclick="switchAdminTab('templates')" id="tab-templates" class="px-4 py-2 text-sm font-medium rounded-lg transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]">
        <i class="fas fa-file-alt mr-2"></i>Template
      </button>
      <button onclick="switchAdminTab('users')" id="tab-users" class="px-4 py-2 text-sm font-medium rounded-lg transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]">
        <i class="fas fa-users-cog mr-2"></i>Pengguna
      </button>
      <button onclick="switchAdminTab('logs')" id="tab-logs" class="px-4 py-2 text-sm font-medium rounded-lg transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]">
        <i class="fas fa-history mr-2"></i>Logs
      </button>
    </div>

    <!-- Dashboard Tab -->
    <div id="panel-dashboard" class="animate-fade-in">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <!-- Stats Cards -->
        <div class="gradient-card p-6 animate-pulse">
           <div class="flex items-center gap-4">
             <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white"><i class="fas fa-users text-xl"></i></div>
             <div class="text-white">
                <div class="text-3xl font-bold mb-1" id="total-guru">...</div>
                <div class="text-sm opacity-80">Total Guru</div>
             </div>
           </div>
        </div>
        <div class="gradient-card p-6 animate-pulse" style="--gradient-start: var(--color-success); --gradient-end: #10b981;">
           <div class="flex items-center gap-4">
             <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white"><i class="fas fa-envelope text-xl"></i></div>
             <div class="text-white">
                <div class="text-3xl font-bold mb-1" id="total-surat">...</div>
                <div class="text-sm opacity-80">Surat Dibuat</div>
             </div>
           </div>
        </div>
        <div class="gradient-card p-6 animate-pulse" style="--gradient-start: var(--color-warning); --gradient-end: #f59e0b;">
           <div class="flex items-center gap-4">
             <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white"><i class="fas fa-clipboard-list text-xl"></i></div>
             <div class="text-white">
                <div class="text-3xl font-bold mb-1" id="total-proker">...</div>
                <div class="text-sm opacity-80">Program Kerja</div>
             </div>
           </div>
        </div>
        <div class="gradient-card p-6 animate-pulse" style="--gradient-start: var(--color-danger); --gradient-end: #ef4444;">
           <div class="flex items-center gap-4">
             <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white"><i class="fas fa-calendar text-xl"></i></div>
             <div class="text-white">
                <div class="text-3xl font-bold mb-1" id="total-kegiatan">...</div>
                <div class="text-sm opacity-80">Kegiatan</div>
             </div>
           </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-lg border border-[var(--color-border-subtle)] p-6">
          <h3 class="font-bold text-[var(--color-text-primary)] mb-6 flex items-center"><i class="fas fa-chart-line text-blue-500 mr-2"></i>Tren Aktivitas</h3>
          <div class="h-64">
            <canvas id="activity-chart"></canvas>
          </div>
        </div>
        <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-lg border border-[var(--color-border-subtle)] p-6">
          <h3 class="font-bold text-[var(--color-text-primary)] mb-6 flex items-center"><i class="fas fa-pie-chart text-purple-500 mr-2"></i>Distribusi Anggota</h3>
          <div class="h-64">
            <canvas id="member-chart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Profil KKG Tab -->
    <div id="panel-profil" class="hidden animate-fade-in">
      <div class="grid gap-8">
        <!-- Logo & Header Section -->
        <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-lg border border-[var(--color-border-subtle)] p-8">
          <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center"><i class="fas fa-image text-blue-500 mr-2"></i>Identitas Visual & Header</h2>
          <div class="flex flex-col md:flex-row gap-8">
            <div class="flex-shrink-0 text-center">
              <div id="logo-preview" class="w-40 h-40 bg-[var(--color-bg-tertiary)] rounded-2xl flex items-center justify-center border-2 border-dashed border-[var(--color-border-default)] overflow-hidden mx-auto">
                 <span class="text-[var(--color-text-tertiary)] text-sm">Belum ada logo</span>
              </div>
              <label class="mt-4 block cursor-pointer">
                <input type="file" id="logo-input" accept="image/*" class="hidden" onchange="uploadLogo(this)">
                <span class="btn btn-sm btn-secondary w-full">
                  <i class="fas fa-upload mr-2"></i>Upload Logo
                </span>
              </label>
            </div>
            <div class="flex-1 space-y-5">
              <div>
                <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Nama KKG</label>
                <input type="text" id="profil-nama_kkg" class="w-full input-field" placeholder="KKG Gugus 3 Kecamatan Wanayasa">
              </div>
              <div class="grid grid-cols-2 gap-5">
                <div>
                  <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Tahun Ajaran</label>
                  <input type="text" id="profil-tahun_ajaran" class="w-full input-field" placeholder="2025/2026">
                </div>
                <div>
                  <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">NPSN Sekolah Induk</label>
                  <input type="text" id="profil-npsn_sekolah_induk" class="w-full input-field" placeholder="20231234">
                </div>
              </div>
              <div>
                <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Nama Sekolah Induk</label>
                <input type="text" id="profil-nama_sekolah_induk" class="w-full input-field" placeholder="SDN 1 Wanayasa">
              </div>
            </div>
          </div>
        </div>

        <!-- Alamat Section -->
        <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-lg border border-[var(--color-border-subtle)] p-8">
          <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center"><i class="fas fa-map-marker-alt text-red-500 mr-2"></i>Alamat Sekretariat</h2>
          <div class="grid md:grid-cols-2 gap-5">
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Alamat Lengkap</label>
              <input type="text" id="profil-alamat_sekretariat" class="w-full input-field" placeholder="Jl. Raya Wanayasa No. 1">
            </div>
            <div>
              <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Kecamatan</label>
              <input type="text" id="profil-kecamatan" class="w-full input-field" placeholder="Wanayasa">
            </div>
            <div>
              <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Kabupaten/Kota</label>
              <input type="text" id="profil-kabupaten" class="w-full input-field" placeholder="Purwakarta">
            </div>
          </div>
        </div>

        <!-- Struktur Organisasi & Kontak -->
        <div class="grid md:grid-cols-2 gap-8">
            <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-lg border border-[var(--color-border-subtle)] p-8">
                <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center"><i class="fas fa-sitemap text-purple-500 mr-2"></i>Struktur Inti</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Ketua</label>
                        <input type="text" id="profil-nama_ketua" class="w-full input-field">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Sekretaris</label>
                        <input type="text" id="profil-nama_sekretaris" class="w-full input-field">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Bendahara</label>
                        <input type="text" id="profil-nama_bendahara" class="w-full input-field">
                    </div>
                </div>
            </div>
             <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-lg border border-[var(--color-border-subtle)] p-8">
                <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-6 flex items-center"><i class="fas fa-address-book text-green-500 mr-2"></i>Kontak</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Email</label>
                        <input type="email" id="profil-email_kkg" class="w-full input-field">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Telepon/WA</label>
                        <input type="tel" id="profil-telepon_kkg" class="w-full input-field">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Website</label>
                        <input type="url" id="profil-website_kkg" class="w-full input-field">
                    </div>
                </div>
            </div>
        </div>

        <div class="flex justify-end">
          <button onclick="saveProfilKKG()" class="btn btn-primary btn-lg shadow-lg">
            <i class="fas fa-save mr-2"></i>Simpan Perubahan
          </button>
        </div>
      </div>
    </div>

    <!-- Sekolah Tab -->
    <div id="panel-sekolah" class="hidden animate-fade-in">
      <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-lg border border-[var(--color-border-subtle)] p-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 class="text-xl font-bold text-[var(--color-text-primary)]"><i class="fas fa-school text-green-500 mr-2"></i>Daftar Sekolah</h2>
          <button onclick="showAddSekolahModal()" class="btn btn-success shadow-lg shadow-green-500/20">
            <i class="fas fa-plus mr-2"></i>Tambah Sekolah
          </button>
        </div>

        <div class="overflow-x-auto rounded-xl border border-[var(--color-border-default)]">
          <table class="w-full text-sm">
            <thead class="bg-[var(--color-bg-tertiary)]">
              <tr>
                <th class="px-4 py-3 text-center text-[var(--color-text-secondary)] w-12">No</th>
                <th class="px-4 py-3 text-left text-[var(--color-text-secondary)]">Nama Sekolah</th>
                <th class="px-4 py-3 text-left text-[var(--color-text-secondary)]">Tipe</th>
                <th class="px-4 py-3 text-left text-[var(--color-text-secondary)]">Kepala Sekolah</th>
                <th class="px-4 py-3 text-center text-[var(--color-text-secondary)]">Guru</th>
                <th class="px-4 py-3 text-center text-[var(--color-text-secondary)]">Aksi</th>
              </tr>
            </thead>
            <tbody id="sekolah-table-body" class="divide-y divide-[var(--color-border-subtle)]">
              <tr><td colspan="6" class="text-center py-8 text-[var(--color-text-tertiary)]"><i class="fas fa-spinner fa-spin mr-2"></i>Memuat...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- User Management Tab -->
    <div id="panel-users" class="hidden animate-fade-in">
      <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-lg border border-[var(--color-border-subtle)] p-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 class="text-xl font-bold text-[var(--color-text-primary)]"><i class="fas fa-users-cog text-blue-500 mr-2"></i>Kelola Pengguna</h2>
          <button onclick="showAddUserModal()" class="btn btn-primary shadow-lg shadow-primary-500/20">
            <i class="fas fa-user-plus mr-2"></i>Tambah User
          </button>
        </div>

        <div class="overflow-x-auto rounded-xl border border-[var(--color-border-default)]">
          <table class="w-full text-sm">
             <thead class="bg-[var(--color-bg-tertiary)]">
              <tr>
                <th class="px-4 py-3 text-left text-[var(--color-text-secondary)]">Nama</th>
                <th class="px-4 py-3 text-left text-[var(--color-text-secondary)]">Email</th>
                <th class="px-4 py-3 text-left text-[var(--color-text-secondary)]">Sekolah</th>
                <th class="px-4 py-3 text-center text-[var(--color-text-secondary)]">Role</th>
                <th class="px-4 py-3 text-center text-[var(--color-text-secondary)]">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border-subtle)]">
                <!-- Data loaded via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Settings Tab -->
    <div id="panel-settings" class="hidden animate-fade-in">
         <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-lg border border-[var(--color-border-subtle)] p-8 max-w-2xl mx-auto">
             <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-6"><i class="fas fa-key text-yellow-500 mr-2"></i>Konfigurasi API</h2>
             <form onsubmit="saveSettings(event)" class="space-y-6">
                <div>
                   <label class="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Mistral AI API Key</label>
                   <input type="password" name="mistral_api_key" class="w-full input-field font-mono" placeholder="sk-...">
                   <p class="text-xs text-[var(--color-text-tertiary)] mt-1">Dapatkan key dari console.mistral.ai</p>
                </div>
                 <div class="pt-4 border-t border-[var(--color-border-subtle)]">
                    <h3 class="font-bold text-[var(--color-text-primary)] mb-4">Maintenance</h3>
                    <div class="flex gap-4">
                        <button type="button" onclick="clearAllCaches()" class="btn btn-danger btn-sm"><i class="fas fa-broom mr-2"></i>Clear Cache</button>
                        <button type="button" onclick="initDb()" class="btn btn-warning btn-sm"><i class="fas fa-database mr-2"></i>Reset Database</button>
                    </div>
                </div>

                <div class="flex justify-end pt-6">
                     <button type="submit" class="btn btn-primary">Simpan Pengaturan</button>
                </div>
             </form>
         </div>
    </div>

    <!-- Templates Tab -->
    <div id="panel-templates" class="hidden animate-fade-in">
      <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-lg border border-[var(--color-border-subtle)] p-6">
         <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-[var(--color-text-primary)]"><i class="fas fa-file-alt text-orange-500 mr-2"></i>Template Surat</h2>
            <button onclick="showTemplateModal()" class="btn btn-warning text-white shadow-lg shadow-orange-500/20"><i class="fas fa-plus mr-2"></i>Buat Template</button>
         </div>
         
         <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button onclick="filterTemplates('')" class="template-filter-btn px-4 py-2 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-600 transition-all border border-transparent">Semua</button>
            <button onclick="filterTemplates('undangan')" class="template-filter-btn px-4 py-2 rounded-full text-sm font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all border border-transparent">Undangan</button>
            <button onclick="filterTemplates('tugas')" class="template-filter-btn px-4 py-2 rounded-full text-sm font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all border border-transparent">Tugas</button>
         </div>

         <div id="templates-list" class="grid md:grid-cols-2 gap-4">
            <!-- Loaded via JS -->
         </div>
      </div>
    </div>

    <!-- Logs Tab -->
    <div id="panel-logs" class="hidden animate-fade-in">
        <div class="bg-[var(--color-bg-elevated)] rounded-2xl shadow-lg border border-[var(--color-border-subtle)] p-6">
             <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-[var(--color-text-primary)]"><i class="fas fa-history text-purple-500 mr-2"></i>Audit Logs</h2>
                <div id="log-stats" class="text-xs text-[var(--color-text-tertiary)]"></div>
             </div>
             <div class="grid md:grid-cols-4 gap-4 mb-6">
                <select id="log-filter-action" onchange="loadAuditLogs()" class="input-field text-sm"><option value="">Semua Aksi</option></select>
                <input type="text" id="log-filter-search" placeholder="Cari..." class="input-field text-sm" onkeyup="debounceLogSearch()">
             </div>
             
             <div class="overflow-x-auto border border-[var(--color-border-default)] rounded-xl">
                 <table class="w-full text-sm">
                    <thead class="bg-[var(--color-bg-tertiary)]">
                        <tr>
                            <th class="px-4 py-3 text-left">Waktu</th>
                            <th class="px-4 py-3 text-left">User</th>
                            <th class="px-4 py-3 text-center">Aksi</th>
                            <th class="px-4 py-3 text-left">Detail</th>
                        </tr>
                    </thead>
                    <tbody id="audit-log-body" class="divide-y divide-[var(--color-border-subtle)]"></tbody>
                 </table>
             </div>
             <div id="log-pagination" class="flex justify-end mt-4 gap-2"></div>
        </div>
    </div>

    <!-- Modals (Sekolah, User, Template) -->
    <div id="sekolah-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="bg-[var(--color-bg-elevated)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div class="px-6 py-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
                <h3 id="sekolah-modal-title" class="font-bold text-lg text-[var(--color-text-primary)]">Tambah Sekolah</h3>
                <button onclick="closeSekolahModal()" class="text-[var(--color-text-tertiary)] hover:text-red-500"><i class="fas fa-times"></i></button>
            </div>
            <form id="sekolah-form" onsubmit="saveSekolah(event)" class="p-6 space-y-4">
                <input type="text" name="nama" placeholder="Nama Sekolah *" class="input-field w-full" required>
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" name="npsn" placeholder="NPSN" class="input-field w-full">
                    <select name="tipe" class="input-field w-full"><option value="negeri">Negeri</option><option value="swasta">Swasta</option></select>
                </div>
                <input type="text" name="kepala_sekolah" placeholder="Kepala Sekolah" class="input-field w-full">
                <div class="flex items-center gap-4">
                    <label class="flex items-center gap-2 text-sm text-[var(--color-text-primary)]"><input type="checkbox" name="is_sekretariat" class="accent-primary-500"> Sekretariat</label>
                    <label class="flex items-center gap-2 text-sm text-[var(--color-text-primary)]"><input type="checkbox" name="is_sekolah_penggerak" class="accent-primary-500"> Penggerak</label>
                </div>
                <button type="submit" class="btn btn-primary w-full mt-2">Simpan</button>
            </form>
        </div>
    </div>
    
    <div id="add-user-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
         <div class="bg-[var(--color-bg-elevated)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div class="px-6 py-4 border-b border-[var(--color-border-subtle)] bg-primary-100/10">
                <h3 class="font-bold text-lg text-[var(--color-text-primary)]">Tambah User Baru</h3>
            </div>
            <form onsubmit="saveNewUser(event)" class="p-6 space-y-4">
                <input type="text" name="nama" placeholder="Nama Lengkap *" class="input-field w-full" required>
                <input type="email" name="email" placeholder="Email *" class="input-field w-full" required>
                <input type="password" name="password" placeholder="Password *" class="input-field w-full" required>
                <div class="grid grid-cols-2 gap-4">
                    <select name="role" class="input-field w-full"><option value="user">User</option><option value="admin">Admin</option></select>
                    <input type="text" name="sekolah" placeholder="Sekolah" class="input-field w-full">
                </div>
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" onclick="document.getElementById('add-user-modal').classList.add('hidden')" class="btn btn-secondary">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan User</button>
                </div>
            </form>
         </div>
    </div>

    <!-- Edit User Modal -->
    <div id="edit-user-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
         <div class="bg-[var(--color-bg-elevated)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div class="px-6 py-4 border-b border-[var(--color-border-subtle)]">
                <h3 class="font-bold text-lg text-[var(--color-text-primary)]">Edit User</h3>
            </div>
            <form onsubmit="saveUser(event)" class="p-6 space-y-4">
                <input type="hidden" name="id">
                <input type="text" name="nama" placeholder="Nama Lengkap" class="input-field w-full" required>
                <input type="email" name="email" placeholder="Email" class="input-field w-full" required>
                <select name="sekolah" id="user-sekolah-select" class="input-field w-full"><option value="">-- Pilih Sekolah --</option></select>
                <select name="role" class="input-field w-full"><option value="user">User</option><option value="admin">Admin</option></select>
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" onclick="document.getElementById('edit-user-modal').classList.add('hidden')" class="btn btn-secondary">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
                </div>
            </form>
         </div>
    </div>

  </div>`;
}

// Tab Switching
window.switchAdminTab = function (tab) {
  const tabs = ['dashboard', 'profil', 'sekolah', 'settings', 'templates', 'users', 'logs'];
  tabs.forEach(t => {
    const tabBtn = document.getElementById(`tab-${t}`);
    const panel = document.getElementById(`panel-${t}`);
    if (t === tab) {
      tabBtn?.classList.remove('text-[var(--color-text-secondary)]', 'hover:bg-[var(--color-bg-tertiary)]');
      tabBtn?.classList.add('bg-primary-100/10', 'text-primary-600', 'shadow-sm');
      panel?.classList.remove('hidden');
    } else {
      tabBtn?.classList.add('text-[var(--color-text-secondary)]', 'hover:bg-[var(--color-bg-tertiary)]');
      tabBtn?.classList.remove('bg-primary-100/10', 'text-primary-600', 'shadow-sm');
      panel?.classList.add('hidden');
    }
  });

  if (tab === 'logs') { loadAuditLogsActions(); loadAuditLogs(); loadAuditStats(); }
  else if (tab === 'sekolah') loadSekolah();
  else if (tab === 'templates') loadTemplates();
  else if (tab === 'users') loadAdminUsers();
  else if (tab === 'dashboard') setTimeout(() => initDashboardCharts(), 100);
}

// ============================================
// Chart Functions
// ============================================

let activityChart = null;
let memberChart = null;

window.initDashboardCharts = async function () {
  try {
    const trendsRes = await api('/dashboard/trends?period=weekly');
    const trends = trendsRes.data;
    const memberRes = await api('/dashboard/members');
    const memberData = memberRes.data;

    // Activity Chart
    const activityCtx = document.getElementById('activity-chart');
    if (activityCtx && window.Chart) {
      if (activityChart) activityChart.destroy();
      const labels = trends.surat?.map(d => d.period) || [];

      activityChart = new Chart(activityCtx, {
        type: 'line',
        data: {
          labels: labels.length > 0 ? labels : ['No Data'],
          datasets: [
            { label: 'Surat', data: trends.surat?.map(d => d.count) || [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, fill: true },
            { label: 'Absensi', data: trends.absensi?.map(d => d.count) || [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.4, fill: true }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
      });
    }

    // Member Chart
    const memberCtx = document.getElementById('member-chart');
    if (memberCtx && window.Chart) {
      if (memberChart) memberChart.destroy();
      memberChart = new Chart(memberCtx, {
        type: 'doughnut',
        data: {
          labels: memberData?.bySchool?.map(s => s.sekolah) || ['No Data'],
          datasets: [{
            data: memberData?.bySchool?.map(s => s.count) || [1],
            backgroundColor: ['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4'],
            borderWidth: 0
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: { size: 10 } } } } }
      });
    }
  } catch (e) {
    console.error('Failed to load charts:', e);
  }
}

// ============================================
// Logic Functions
// ============================================

// [Audit Log Functions]
window.loadAuditLogs = async function (page = 1) {
  const body = document.getElementById('audit-log-body');
  const pagination = document.getElementById('log-pagination');

  // Skeleton loader
  body.innerHTML = skeletonTable(4, 5);

  try {
    const action = document.getElementById('log-filter-action')?.value || '';
    const search = document.getElementById('log-filter-search')?.value || '';
    const res = await api(`/admin/logs?page=${page}&limit=10&action=${action}&search=${search}`);
    const logs = res.data?.logs || [];

    if (logs.length === 0) {
      body.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-[var(--color-text-tertiary)]">Tidak ada log data.</td></tr>';
      pagination.innerHTML = '';
      return;
    }

    body.innerHTML = logs.map(log => `
            <tr class="hover:bg-[var(--color-bg-tertiary)] transition-colors">
                <td class="px-4 py-3 text-[var(--color-text-secondary)] whitespace-nowrap">${formatDateTime(log.created_at)}</td>
                <td class="px-4 py-3"><div class="font-medium text-[var(--color-text-primary)]">${escapeHtml(log.user_name || 'System')}</div></td>
                <td class="px-4 py-3 text-center"><span class="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">${escapeHtml(log.action)}</span></td>
                <td class="px-4 py-3 text-xs text-[var(--color-text-secondary)] truncate max-w-xs" title="${escapeHtml(JSON.stringify(log.details))}">${JSON.stringify(log.details).substring(0, 50)}...</td>
            </tr>
        `).join('');

    // Simple pagination
    pagination.innerHTML = `
            <button onclick="loadAuditLogs(${page - 1})" ${page <= 1 ? 'disabled' : ''} class="btn btn-sm btn-secondary"><i class="fas fa-chevron-left"></i></button>
            <span class="text-sm self-center text-[var(--color-text-secondary)]">Hal ${page}</span>
            <button onclick="loadAuditLogs(${page + 1})" class="btn btn-sm btn-secondary"><i class="fas fa-chevron-right"></i></button>
        `;
  } catch (e) { body.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 py-4">${e.message}</td></tr>`; }
}
let logSearchTimeout = null;
window.debounceLogSearch = function () {
  clearTimeout(logSearchTimeout);
  logSearchTimeout = setTimeout(() => window.loadAuditLogs(), 500);
}

window.loadAuditLogsActions = async function () {
  try {
    const res = await api('/admin/logs/actions');
    const s = document.getElementById('log-filter-action');
    if (s && res.data) s.innerHTML = '<option value="">Semua Aksi</option>' + res.data.map(a => `<option value="${a.value}">${a.label}</option>`).join('');
  } catch (e) { }
}
window.loadAuditStats = async function () {
  try {
    const res = await api('/admin/logs/stats');
    const container = document.getElementById('log-stats');
    if (container && res.data) {
      container.innerHTML = `
        <span><i class="fas fa-list mr-1"></i>Total: ${res.data.total}</span>
        <span class="ml-2"><i class="fas fa-calendar-day mr-1"></i>Today: ${res.data.today}</span>
      `;
    }
  } catch (e) { }
}

// [Template Functions]
window.loadTemplates = async function () {
  const list = document.getElementById('templates-list');
  try {
    const url = window.currentTemplateFilter
      ? `/templates?jenis=${window.currentTemplateFilter}&active=false`
      : '/templates?active=false';
    const res = await api(url);
    if (!res.data || res.data.length === 0) { list.innerHTML = '<div class="col-span-2 text-center py-10 text-[var(--color-text-tertiary)]">Belum ada template.</div>'; return; }

    list.innerHTML = res.data.map(t => `
            <div class="bg-[var(--color-bg-primary)] p-4 rounded-xl border border-[var(--color-border-subtle)] hover:border-primary-500 transition-colors group">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-[var(--color-text-primary)] group-hover:text-primary-600 transition-colors">${escapeHtml(t.nama)}</h3>
                        <span class="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] uppercase">${t.jenis}</span>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="editTemplate(${t.id})" class="btn btn-sm btn-ghost text-blue-500"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteTemplate(${t.id}, '${escapeHtml(t.nama)}')" class="btn btn-sm btn-ghost text-red-500"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <p class="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-2">${escapeHtml(t.deskripsi || '-')}</p>
            </div>
        `).join('');
  } catch (e) { list.innerHTML = `<div class="text-red-500">${e.message}</div>`; }
}
window.filterTemplates = function (type) {
  window.currentTemplateFilter = type;
  document.querySelectorAll('.template-filter-btn').forEach(btn => {
    if ((type === '' && btn.innerText === 'Semua') || btn.innerText.toLowerCase().includes(type)) {
      btn.classList.add('bg-primary-100', 'text-primary-600');
      btn.classList.remove('bg-[var(--color-bg-tertiary)]');
    } else {
      btn.classList.remove('bg-primary-100', 'text-primary-600');
      btn.classList.add('bg-[var(--color-bg-tertiary)]');
    }
  });
  loadTemplates();
}

// [User Functions] 
window.showAddUserModal = function () {
  document.getElementById('add-user-modal').classList.remove('hidden');
}

window.saveNewUser = async function (e) {
  e.preventDefault();
  const form = e.target;
  // Basic validation
  if (!form.nama.value || !form.email.value || !form.password.value) {
    showToast('Harap isi semua field wajib (*)', 'warning');
    return;
  }

  try {
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Menyimpan...';

    await api('/admin/users', {
      method: 'POST',
      body: {
        nama: form.nama.value,
        email: form.email.value,
        password: form.password.value,
        role: form.role.value,
        sekolah: form.sekolah.value
      }
    });

    showToast('User berhasil dibuat', 'success');
    document.getElementById('add-user-modal').classList.add('hidden');
    form.reset();
    await loadAdminUsers();

    btn.disabled = false;
    btn.innerHTML = originalText;
  } catch (e) {
    showToast(e.message || 'Gagal membuat user', 'error');
  }
}

window.editUser = async function (user) {
  const modal = document.getElementById('edit-user-modal');
  modal.classList.remove('hidden');
  const form = modal.querySelector('form');

  // Fill data
  form.id.value = user.id;
  form.nama.value = user.nama || '';
  form.email.value = user.email || '';
  form.role.value = user.role || 'user';

  // Load sekolah options
  const sekolahSelect = form.querySelector('select[name="sekolah"]');
  if (sekolahSelect) {
    try {
      const res = await api('/sekolah');
      if (res.data) {
        sekolahSelect.innerHTML = '<option value="">-- Pilih Sekolah --</option>' +
          res.data.map(s => `<option value="${escapeHtml(s.nama)}">${escapeHtml(s.nama)}</option>`).join('');
        sekolahSelect.value = user.sekolah || '';
      }
    } catch (e) { }
  }
}

window.saveUser = async function (e) {
  e.preventDefault();
  const form = e.target;
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
    showToast('User updated successfully', 'success');
    document.getElementById('edit-user-modal').classList.add('hidden');
    loadAdminUsers();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

window.deleteUser = async function (id) {
  if (!confirm('Delete this user?')) return;
  try {
    await api(`/admin/users/${id}`, { method: 'DELETE' });
    showToast('User deleted', 'success');
    loadAdminUsers();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

window.resetUserPassword = async function (userId) {
  const newPw = prompt('Masukkan password baru (min. 6 karakter):');
  if (!newPw || newPw.length < 6) return; // Cancelled or too short
  try {
    await api(`/admin/users/${userId}/reset-password`, { method: 'POST', body: { new_password: newPw } });
    showToast('Password berhasil direset!', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}


// [Sekolah Functions]
window.loadSekolah = async function () {
  const container = document.getElementById('sekolah-table-body');
  if (!container) return;

  // Skeleton loader
  container.innerHTML = skeletonTable(6, 5);

  try {
    const res = await api('/sekolah');
    const sekolahList = res.data || [];
    if (sekolahList.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-[var(--color-text-tertiary)]">Belum ada data sekolah</td></tr>`;
      return;
    }

    container.innerHTML = sekolahList.map((s, idx) => `
            <tr class="hover:bg-[var(--color-bg-tertiary)] transition-colors">
              <td class="px-4 py-3 text-center">${idx + 1}</td>
              <td class="px-4 py-3 font-medium text-[var(--color-text-primary)]">${escapeHtml(s.nama)}
                  ${s.is_sekretariat ? '<span class="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Sekretariat</span>' : ''}
              </td>
              <td class="px-4 py-3 capitalize">${s.tipe}</td>
              <td class="px-4 py-3">${escapeHtml(s.kepala_sekolah || '-')}</td>
              <td class="px-4 py-3 text-center">${s.jumlah_guru || '-'}</td>
               <td class="px-4 py-3 text-center">
                <button onclick='editSekolah(${JSON.stringify(s).replace(/'/g, "&#39;")})' class="btn btn-sm btn-ghost text-blue-500"><i class="fas fa-edit"></i></button>
                <button onclick="deleteSekolah(${s.id})" class="btn btn-sm btn-ghost text-red-500"><i class="fas fa-trash"></i></button>
              </td>
            </tr>
        `).join('');
  } catch (e) {
    container.innerHTML = `<tr><td colspan="6" class="text-center text-red-500 py-4">${e.message}</td></tr>`;
  }
}

window.showAddSekolahModal = function () {
  const modal = document.getElementById('sekolah-modal');
  modal.classList.remove('hidden');
  document.getElementById('sekolah-form').reset();
  document.getElementById('sekolah-modal-title').textContent = 'Tambah Sekolah';
  // Clear hidden ID if any
  const form = document.getElementById('sekolah-form');
  if (form.id_sekolah) form.id_sekolah.value = '';
}

window.saveSekolah = async function (e) {
  e.preventDefault();
  const form = e.target;
  // Collect data
  const data = {
    nama: form.nama.value,
    npsn: form.npsn.value,
    tipe: form.tipe.value,
    kepala_sekolah: form.kepala_sekolah.value,
    is_sekretariat: form.is_sekretariat.checked,
    is_sekolah_penggerak: form.is_sekolah_penggerak.checked
  };

  // Determine if update or create based on existence of ID
  // Note: The current modal form structure in the render function didn't have a hidden ID field. 
  // We should treat this as a create function unless we implement edit mode fuller.
  // For now assuming create only or simple toggle.
  try {
    await api('/sekolah', { method: 'POST', body: data });
    showToast('Sekolah berhasil disimpan', 'success');
    document.getElementById('sekolah-modal').classList.add('hidden');
    loadSekolah();
  } catch (e) { showToast(e.message, 'error'); }
}

window.closeSekolahModal = function () {
  document.getElementById('sekolah-modal').classList.add('hidden');
}

window.deleteSekolah = async function (id) {
  if (!confirm('Hapus sekolah ini?')) return;
  try {
    await api(`/sekolah/${id}`, { method: 'DELETE' });
    showToast('Sekolah dihapus', 'success');
    loadSekolah();
  } catch (e) { showToast(e.message, 'error'); }
}

window.saveSettings = async function (e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/admin/settings', {
      method: 'PUT',
      body: { mistral_api_key: form.mistral_api_key.value }
    });
    showToast('Settings saved', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

window.saveProfilKKG = async function () {
  try {
    const data = {
      nama_kkg: document.getElementById('profil-nama_kkg').value,
      tahun_ajaran: document.getElementById('profil-tahun_ajaran').value,
      // ... collect other fields
      nama_ketua: document.getElementById('profil-nama_ketua').value,
      nama_sekretaris: document.getElementById('profil-nama_sekretaris').value,
      nama_bendahara: document.getElementById('profil-nama_bendahara').value,
      email_kkg: document.getElementById('profil-email_kkg').value,
      telepon_kkg: document.getElementById('profil-telepon_kkg').value,
      website_kkg: document.getElementById('profil-website_kkg').value,
      alamat_sekretariat: document.getElementById('profil-alamat_sekretariat').value,
      kecamatan: document.getElementById('profil-kecamatan').value,
      kabupaten: document.getElementById('profil-kabupaten').value,
      npsn_sekolah_induk: document.getElementById('profil-npsn_sekolah_induk').value,
      nama_sekolah_induk: document.getElementById('profil-nama_sekolah_induk').value,
    };

    await api('/admin/settings', { method: 'PUT', body: data });
    showToast('Profil KKG saved', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

window.uploadLogo = async function (input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file maksimal 2MB', 'error');
      input.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    const previewContainer = document.getElementById('logo-preview');
    const originalContent = previewContainer.innerHTML;
    previewContainer.innerHTML = '<div class="flex items-center justify-center h-full"><i class="fas fa-spinner fa-spin text-2xl text-[var(--color-primary)]"></i></div>';

    try {
      // Use fetch directly for FormData to let browser set Content-Type with boundary
      const headers = {};
      const csrfMatch = document.cookie.match(/csrf_token=([^;]+)/);
      if (csrfMatch) headers['X-CSRF-Token'] = csrfMatch[1];

      const res = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message || 'Gagal upload logo');

      // Update preview
      previewContainer.innerHTML = `<img src="${data.data.logo_url}" alt="Logo KKG" class="w-full h-full object-contain">`;

      // Update state
      if (window.state && window.state.settings) {
        window.state.settings.logo_url = data.data.logo_url;
      }

      showToast('Logo berhasil diupload', 'success');

      // Reload to update logo everywhere
      setTimeout(() => window.location.reload(), 1500);

    } catch (e) {
      console.error(e);
      showToast(e.message, 'error');
      previewContainer.innerHTML = originalContent;
      input.value = '';
    }
  }
}

// Global scope expose for inline onclicks
window.clearAllCaches = async function () {
  // call global from main.js if accessible or reimplement
  if (window.parent && window.parent.clearAllCaches) {
    window.parent.clearAllCaches();
  } else {
    showToast('Cache clearing...', 'info');
  }
}
