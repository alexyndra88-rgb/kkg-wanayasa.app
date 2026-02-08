// Profile Page Module
import { state } from '../state.js';
import { api, validators, validateForm, showFormErrors, clearFormErrors } from '../api.js';
import { showToast, escapeHtml, avatar, confirm } from '../utils.js';
import { navigate } from '../router.js';
import { pageHeader, card, alert } from '../components.js';

/**
 * Render Profile page
 */
export async function renderProfile() {
    if (!state.user) {
        navigate('login');
        return '<div class="p-8 text-center">Redirecting...</div>';
    }

    return `
    ${pageHeader('Profil Saya', 'Kelola informasi akun Anda')}
    
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="grid md:grid-cols-3 gap-8">
        <!-- Profile Card -->
        <div class="md:col-span-1">
          ${card(`
            <div class="text-center">
              <div class="inline-block mb-4">
                ${avatar(state.user.nama, 'xl', state.user.foto_url)}
              </div>
              <h2 class="text-xl font-bold text-gray-800">${escapeHtml(state.user.nama)}</h2>
              <p class="text-gray-500">${escapeHtml(state.user.email)}</p>
              <span class="inline-block mt-2 px-3 py-1 ${state.user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} text-sm rounded-full font-medium">
                ${state.user.role === 'admin' ? 'Administrator' : 'Member'}
              </span>
            </div>
          `)}
          
          <div class="mt-4">
            ${card(`
              <h3 class="font-semibold text-gray-800 mb-4">
                <i class="fas fa-shield-alt text-blue-500 mr-2"></i>Keamanan
              </h3>
              <button 
                onclick="toggleChangePassword()"
                class="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                <i class="fas fa-key mr-2"></i>Ubah Password
              </button>
            `)}
          </div>
        </div>

        <!-- Edit Profile Form -->
        <div class="md:col-span-2">
          ${card(`
            <h3 class="text-lg font-semibold text-gray-800 mb-6">
              <i class="fas fa-user-edit text-blue-500 mr-2"></i>Edit Profil
            </h3>
            
            <form id="profile-form" onsubmit="handleUpdateProfile(event)">
              <div class="grid md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                  <input 
                    type="text" 
                    name="nama" 
                    value="${escapeHtml(state.user.nama || '')}"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    value="${escapeHtml(state.user.email || '')}"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                    disabled
                  />
                  <p class="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">NIP</label>
                  <input 
                    type="text" 
                    name="nip" 
                    value="${escapeHtml(state.user.nip || '')}"
                    placeholder="Nomor Induk Pegawai"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Asal Sekolah</label>
                  <input 
                    type="text" 
                    name="sekolah" 
                    value="${escapeHtml(state.user.sekolah || '')}"
                    placeholder="Nama sekolah tempat mengajar"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Mata Pelajaran</label>
                  <input 
                    type="text" 
                    name="mata_pelajaran" 
                    value="${escapeHtml(state.user.mata_pelajaran || '')}"
                    placeholder="Misal: Matematika, IPA, dll"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">No. HP</label>
                  <input 
                    type="tel" 
                    name="no_hp" 
                    value="${escapeHtml(state.user.no_hp || '')}"
                    placeholder="08xxxxxxxxxx"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                  <textarea 
                    name="alamat" 
                    rows="2"
                    placeholder="Alamat lengkap (opsional)"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  >${escapeHtml(state.user.alamat || '')}</textarea>
                </div>
              </div>

              <div class="mt-6 flex justify-end">
                <button 
                  type="submit" 
                  id="save-profile-btn"
                  class="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  <span class="btn-text"><i class="fas fa-save mr-2"></i>Simpan Perubahan</span>
                  <span class="btn-loading hidden"><i class="fas fa-spinner fa-spin mr-2"></i>Menyimpan...</span>
                </button>
              </div>
            </form>
          `)}

          <!-- Change Password Form (Hidden by default) -->
          <div id="change-password-section" class="mt-4 hidden">
            ${card(`
              <h3 class="text-lg font-semibold text-gray-800 mb-6">
                <i class="fas fa-lock text-yellow-500 mr-2"></i>Ubah Password
              </h3>
              
              ${alert('Password baru harus minimal 8 karakter, mengandung huruf dan angka.', 'info')}
              
              <form id="password-form" class="mt-4" onsubmit="handleChangePassword(event)">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Password Saat Ini</label>
                    <input 
                      type="password" 
                      name="current_password" 
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      required
                    />
                  </div>

                  <div class="grid md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
                      <input 
                        type="password" 
                        name="new_password" 
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
                      <input 
                        type="password" 
                        name="confirm_password" 
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div class="mt-6 flex space-x-3 justify-end">
                  <button 
                    type="button"
                    onclick="toggleChangePassword()"
                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    id="change-password-btn"
                    class="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 rounded-xl font-medium hover:from-yellow-500 hover:to-orange-600 transition-all"
                  >
                    <span class="btn-text"><i class="fas fa-key mr-2"></i>Ubah Password</span>
                    <span class="btn-loading hidden"><i class="fas fa-spinner fa-spin mr-2"></i>Memproses...</span>
                  </button>
                </div>
              </form>
            `)}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Toggle change password form visibility
 */
window.toggleChangePassword = function () {
    const section = document.getElementById('change-password-section');
    if (section) {
        section.classList.toggle('hidden');
        if (!section.classList.contains('hidden')) {
            section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
};

/**
 * Handle profile update
 */
window.handleUpdateProfile = async function (e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Validate
    const { valid, errors } = validateForm(data, {
        nama: [
            (v) => validators.required(v, 'Nama'),
            (v) => validators.minLength(v, 2, 'Nama')
        ]
    });

    if (!valid) {
        showFormErrors(errors, 'profile-form');
        return;
    }

    const btn = document.getElementById('save-profile-btn');
    setButtonLoading(btn, true);

    try {
        const response = await api('/guru/profile', {
            method: 'PUT',
            body: data
        });

        // Update local state
        state.user = { ...state.user, ...response.data };

        showToast('Profil berhasil diperbarui', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
};

/**
 * Handle password change
 */
window.handleChangePassword = async function (e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Validate
    const { valid, errors } = validateForm(data, {
        current_password: [
            (v) => validators.required(v, 'Password saat ini')
        ],
        new_password: [
            (v) => validators.required(v, 'Password baru'),
            validators.password
        ],
        confirm_password: [
            (v) => validators.required(v, 'Konfirmasi password'),
            (v) => validators.match(v, data.new_password, 'Password tidak cocok')
        ]
    });

    if (!valid) {
        showFormErrors(errors, 'password-form');
        return;
    }

    const btn = document.getElementById('change-password-btn');
    setButtonLoading(btn, true);

    try {
        await api('/auth/change-password', {
            method: 'POST',
            body: data
        });

        showToast('Password berhasil diubah', 'success');
        form.reset();
        toggleChangePassword();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
};

/**
 * Helper to toggle button loading state
 */
function setButtonLoading(btn, loading) {
    if (!btn) return;

    const textEl = btn.querySelector('.btn-text');
    const loadingEl = btn.querySelector('.btn-loading');

    if (loading) {
        btn.disabled = true;
        if (textEl) textEl.classList.add('hidden');
        if (loadingEl) loadingEl.classList.remove('hidden');
    } else {
        btn.disabled = false;
        if (textEl) textEl.classList.remove('hidden');
        if (loadingEl) loadingEl.classList.add('hidden');
    }
}
