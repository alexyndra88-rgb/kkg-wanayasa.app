import { api } from '../api.js';
import { state } from '../state.js';
import { showToast, escapeHtml } from '../utils.js';

export async function renderProfile() {
  let profile = {};
  let sekolahList = [];

  try {
    const [profileRes, sekolahRes] = await Promise.all([
      api('/profile'),
      api('/sekolah')
    ]);
    profile = profileRes.data;
    sekolahList = sekolahRes.data || [];
  } catch (e) {
    showToast('Gagal memuat profil: ' + e.message, 'error');
    // Fallback to state user if API fails
    profile = state.user || {};
  }

  return `
    <div class="max-w-4xl mx-auto py-8 px-4 fade-in">
        <h1 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <i class="fas fa-user-circle text-blue-500"></i> Profil Saya
        </h1>

        <div class="grid md:grid-cols-3 gap-6">
            <!-- Left Column: Photo & Role -->
            <div class="md:col-span-1">
                <div class="bg-white rounded-2xl shadow-sm border p-6 text-center">
                    <div class="relative w-32 h-32 mx-auto mb-4 group">
                        <img src="${profile.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nama)}&background=random`}" 
                             alt="Foto Profil" 
                             class="w-full h-full object-cover rounded-full border-4 border-blue-50 group-hover:border-blue-200 transition-colors">
                        <label class="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 shadow-md transition-transform hover:scale-110" title="Ubah Foto">
                            <i class="fas fa-camera text-sm"></i>
                            <input type="file" accept="image/*" class="hidden" onchange="uploadProfilePhoto(this)">
                        </label>
                    </div>
                    
                    <h2 class="font-bold text-xl text-gray-800">${escapeHtml(profile.nama)}</h2>
                    <p class="text-gray-500 text-sm mb-4">${escapeHtml(profile.email)}</p>
                    
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
                        <i class="fas ${profile.role === 'admin' ? 'fa-shield-alt' : 'fa-user'}"></i>
                        ${profile.role === 'admin' ? 'Administrator' : 'Anggota KKG'}
                    </div>

                    <div class="mt-6 pt-6 border-t text-left space-y-3">
                        <div class="text-sm">
                            <span class="block text-gray-500 text-xs">Bergabung Sejak</span>
                            <span class="font-medium text-gray-700">${profile.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Edit Forms -->
            <div class="md:col-span-2 space-y-6">
                
                <!-- Biodata Form -->
                <div class="bg-white rounded-2xl shadow-sm border p-6">
                    <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-id-card text-gray-400"></i> Data Pribadi
                    </h3>
                    
                    <form onsubmit="updateProfile(event)" class="space-y-4">
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input type="text" name="nama" value="${escapeHtml(profile.nama || '')}" required
                                       class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                                <input type="text" name="nip" value="${escapeHtml(profile.nip || '')}" 
                                       class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">NIK</label>
                                <input type="text" name="nik" value="${escapeHtml(profile.nik || '')}" 
                                       class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">No. HP / WhatsApp</label>
                                <input type="tel" name="no_hp" value="${escapeHtml(profile.no_hp || '')}" 
                                       class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Alamat Rumah</label>
                                <input type="text" name="alamat" value="${escapeHtml(profile.alamat || '')}" 
                                       class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                            </div>
                        </div>

                        <hr class="border-gray-100 my-4">

                        <h4 class="font-medium text-gray-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-briefcase text-gray-400"></i> Data Kepegawaian
                        </h4>

                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Sekolah Induk</label>
                                <select name="sekolah" class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                    <option value="">-- Pilih Sekolah --</option>
                                    ${sekolahList.map(s => `
                                        <option value="${escapeHtml(s.nama)}" ${profile.sekolah === s.nama ? 'selected' : ''}>${escapeHtml(s.nama)}</option>
                                    `).join('')}
                                    <option value="Lainnya" ${profile.sekolah === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran / Jabatan</label>
                                <select name="mata_pelajaran_select" onchange="toggleMapelInput(this)" class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white mb-2">
                                    <option value="">-- Pilih Jabatan --</option>
                                    ${['Kepala Sekolah', 'Guru Kelas 1', 'Guru Kelas 2', 'Guru Kelas 3', 'Guru Kelas 4', 'Guru Kelas 5', 'Guru Kelas 6', 'Guru PAI', 'Guru PJOK', 'Guru Bahasa Inggris', 'Guru Bahasa Sunda', 'Operator Sekolah', 'Penjaga Sekolah'].map(jabatan => `
                                        <option value="${jabatan}" ${profile.mata_pelajaran === jabatan ? 'selected' : ''}>${jabatan}</option>
                                    `).join('')}
                                    <option value="Lainnya" ${!['Kepala Sekolah', 'Guru Kelas 1', 'Guru Kelas 2', 'Guru Kelas 3', 'Guru Kelas 4', 'Guru Kelas 5', 'Guru Kelas 6', 'Guru PAI', 'Guru PJOK', 'Guru Bahasa Inggris', 'Guru Bahasa Sunda', 'Operator Sekolah', 'Penjaga Sekolah'].includes(profile.mata_pelajaran) && profile.mata_pelajaran ? 'selected' : ''}>Lainnya</option>
                                </select>
                                <input type="text" name="mata_pelajaran_custom" id="mapel-custom-input" 
                                       value="${!['Kepala Sekolah', 'Guru Kelas 1', 'Guru Kelas 2', 'Guru Kelas 3', 'Guru Kelas 4', 'Guru Kelas 5', 'Guru Kelas 6', 'Guru PAI', 'Guru PJOK', 'Guru Bahasa Inggris', 'Guru Bahasa Sunda', 'Operator Sekolah', 'Penjaga Sekolah'].includes(profile.mata_pelajaran) ? (profile.mata_pelajaran || '') : ''}" 
                                       placeholder="Tuliskan jabatan lainnya..."
                                       class="${!['Kepala Sekolah', 'Guru Kelas 1', 'Guru Kelas 2', 'Guru Kelas 3', 'Guru Kelas 4', 'Guru Kelas 5', 'Guru Kelas 6', 'Guru PAI', 'Guru PJOK', 'Guru Bahasa Inggris', 'Guru Bahasa Sunda', 'Operator Sekolah', 'Penjaga Sekolah'].includes(profile.mata_pelajaran) && profile.mata_pelajaran ? '' : 'hidden'} w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
                            </div>
                        </div>

                        <div class="flex justify-end pt-4">
                            <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-md transition-all flex items-center gap-2">
                                <i class="fas fa-save"></i> Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Password Form -->
                <div class="bg-white rounded-2xl shadow-sm border p-6">
                    <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-key text-gray-400"></i> Ganti Password
                    </h3>
                    
                    <form onsubmit="changePassword(event)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
                            <input type="password" name="current_password" required
                                   class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                                <input type="password" name="new_password" required minlength="8"
                                       class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                                <p class="text-xs text-gray-400 mt-1">Minimal 8 karakter</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                                <input type="password" name="confirm_password" required minlength="8"
                                       class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                            </div>
                        </div>

                        <div class="flex justify-end pt-2">
                            <button type="submit" class="px-6 py-2 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 shadow-md transition-all flex items-center gap-2">
                                <i class="fas fa-lock"></i> Update Password
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    </div>
    `;
}

// Global functions for event handlers
window.toggleMapelInput = function (select) {
  const customInput = document.getElementById('mapel-custom-input');
  if (select.value === 'Lainnya') {
    customInput.classList.remove('hidden');
    customInput.focus();
  } else {
    customInput.classList.add('hidden');
  }
}

window.updateProfile = async function (e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

  // Determine Mata Pelajaran Value
  let mapelValue = form.mata_pelajaran_select.value;
  if (mapelValue === 'Lainnya' || (!mapelValue && form.mata_pelajaran_custom.value)) {
    mapelValue = form.mata_pelajaran_custom.value;
  }

  const data = {
    nama: form.nama.value,
    nip: form.nip.value,
    nik: form.nik.value,
    no_hp: form.no_hp.value,
    alamat: form.alamat.value,
    sekolah: form.sekolah.value,
    mata_pelajaran: mapelValue
  };

  try {
    const res = await api('/profile', {
      method: 'PUT',
      body: data
    });

    // Update local state and UI
    state.user = { ...state.user, ...res.data };
    showToast('Profil berhasil diperbarui', 'success');

    // Reload to refresh sidebar/navbar info if needed
    setTimeout(() => window.location.reload(), 1000);

  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

window.changePassword = async function (e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;

  if (form.new_password.value !== form.confirm_password.value) {
    showToast('Konfirmasi password tidak cocok', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

  try {
    await api('/profile/password', {
      method: 'PUT',
      body: {
        current_password: form.current_password.value,
        new_password: form.new_password.value,
        confirm_password: form.confirm_password.value
      }
    });

    showToast('Password berhasil diubah. Silakan login ulang.', 'success');
    form.reset();

    // Logout user to force re-login with new credentials
    setTimeout(() => {
      api('/auth/logout', { method: 'POST' }).finally(() => {
        window.location.href = '/login';
      });
    }, 1500);

  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

window.uploadProfilePhoto = async function (input) {
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  if (file.size > 2 * 1024 * 1024) {
    showToast('Ukuran foto maksimal 2MB', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  showToast('Mengupload foto...', 'info');

  try {
    // Upload to general file upload endpoint first
    // Note: we need to handle auth header manually if using fetch with FormData, 
    // but our API wrapper handles JSON mainly. 
    // Let's rely on browser cookies for auth.

    // However, we need CSRF token.
    const csrfToken = getCookie('csrf_token');

    const uploadRes = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRF-Token': csrfToken
      }
    }).then(r => r.json());

    if (!uploadRes.success) throw new Error(uploadRes.message || 'Gagal upload foto');

    // Update profile with new photo URL
    await api('/profile/photo', {
      method: 'POST',
      body: { photo_url: uploadRes.data.url }
    });

    showToast('Foto profil berhasil diperbarui', 'success');
    setTimeout(() => window.location.reload(), 1000);

  } catch (e) {
    showToast(e.message, 'error');
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
}
