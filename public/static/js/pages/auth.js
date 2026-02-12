// Auth Page Module - Login & Register
import { state } from '../state.js';
import { api, validators, validateForm, showFormErrors, clearFormErrors } from '../api.js';
import { showToast, escapeHtml } from '../utils.js';
import { navigate } from '../router.js';

/**
 * Render Login/Register page
 */
export function renderLogin() {
  return `
    <div class="min-h-screen relative flex items-center justify-center py-12 px-4 overflow-hidden bg-gray-900">
      <!-- Animated Background -->
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900"></div>
        <div class="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>
      </div>

      <div class="max-w-md w-full relative z-10 animate-fade-in">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl mb-6 shadow-xl border border-white/10 ring-1 ring-white/20">
            <i class="fas fa-shapes text-4xl text-white drop-shadow-md"></i>
          </div>
          <h1 id="kkg-name" class="text-3xl font-display font-bold text-white mb-2 drop-shadow-sm">Portal Digital KKG</h1>
          <p id="kkg-address-subtitle" class="text-indigo-200 font-medium tracking-wide">Gugus 3 Kecamatan Wanayasa</p>
        </div>

        <!-- Card -->
        <div class="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 ring-1 ring-black/5">
          <!-- Tabs -->
          <div class="flex p-1 mb-8 bg-black/20 rounded-xl backdrop-blur-sm">
            <button 
              id="tab-login" 
              onclick="switchAuthTab('login')"
              class="auth-tab flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 text-white shadow-sm bg-white/20"
            >
              <i class="fas fa-sign-in-alt mr-2"></i>Masuk
            </button>
            <button 
              id="tab-register" 
              onclick="switchAuthTab('register')"
              class="auth-tab flex-1 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 text-white/60 hover:text-white hover:bg-white/5"
            >
              <i class="fas fa-user-plus mr-2"></i>Daftar
            </button>
          </div>

          <!-- Login Form -->
          <form id="login-form" onsubmit="handleLogin(event)" class="animate-slide-up">
            <div class="space-y-5">
              <div>
                <label class="block text-white/90 text-sm font-semibold mb-2 ml-1">Email</label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-300 group-focus-within:text-white transition-colors">
                    <i class="fas fa-envelope"></i>
                  </span>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="nama@email.com"
                    class="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-black/30 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label class="block text-white/90 text-sm font-semibold mb-2 ml-1">Password</label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-300 group-focus-within:text-white transition-colors">
                    <i class="fas fa-lock"></i>
                  </span>
                  <input 
                    type="password" 
                    name="password" 
                    placeholder="Masukkan password"
                    class="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-black/30 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                id="login-btn"
                class="w-full py-3.5 mt-2 bg-gradient-to-r from-primary-500 to-secondary-600 text-white font-bold rounded-xl hover:from-primary-400 hover:to-secondary-500 transform hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-indigo-500/30 flex items-center justify-center group"
              >
                <span class="btn-text group-hover:tracking-wider transition-all">Masuk Aplikasi</span>
                <span class="btn-loading hidden">
                  <i class="fas fa-circle-notch fa-spin mr-2"></i>Memproses...
                </span>
              </button>
              
              <div class="text-center pt-2">
                <a href="javascript:void(0)" onclick="navigate('reset-password')" class="text-sm text-indigo-200 hover:text-white transition-colors">
                  Lupa Password?
                </a>
              </div>
            </div>
          </form>

          <!-- Register Form -->
          <form id="register-form" class="hidden animate-slide-up" onsubmit="handleRegister(event)">
            <div class="space-y-4">
              <div>
                <label class="block text-white/90 text-sm font-semibold mb-1.5 ml-1">Nama Lengkap <span class="text-red-400">*</span></label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-300 group-focus-within:text-white transition-colors">
                    <i class="fas fa-user"></i>
                  </span>
                  <input 
                    type="text" 
                    name="nama" 
                    placeholder="Nama lengkap Anda"
                    class="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-black/30 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label class="block text-white/90 text-sm font-semibold mb-1.5 ml-1">Email <span class="text-red-400">*</span></label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-300 group-focus-within:text-white transition-colors">
                    <i class="fas fa-envelope"></i>
                  </span>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="nama@email.com"
                    class="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-black/30 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-white/90 text-sm font-semibold mb-1.5 ml-1">Password <span class="text-red-400">*</span></label>
                  <input 
                    type="password" 
                    name="password" 
                    placeholder="Min. 8 karakter"
                    class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-black/30 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label class="block text-white/90 text-sm font-semibold mb-1.5 ml-1">Konfirmasi <span class="text-red-400">*</span></label>
                  <input 
                    type="password" 
                    name="confirm_password" 
                    placeholder="Ulangi password"
                    class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-black/30 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-white/90 text-sm font-semibold mb-1.5 ml-1">NIP</label>
                  <input 
                    type="text" 
                    name="nip" 
                    placeholder="NIP (opsional)"
                    class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-black/30 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all font-medium"
                  />
                </div>
                <div>
                  <label class="block text-white/90 text-sm font-semibold mb-1.5 ml-1">No. HP</label>
                  <input 
                    type="tel" 
                    name="no_hp" 
                    placeholder="08xxx (opsional)"
                    class="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-black/30 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label class="block text-white/90 text-sm font-semibold mb-1.5 ml-1">Asal Sekolah</label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-300 group-focus-within:text-white transition-colors">
                    <i class="fas fa-school"></i>
                  </span>
                  <select 
                    name="sekolah" 
                    id="register-sekolah-select"
                    class="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:bg-black/30 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50 transition-all font-medium appearance-none"
                  >
                    <option value="" class="text-gray-800 bg-white">-- Pilih Sekolah --</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/60">
                    <i class="fas fa-chevron-down text-xs"></i>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                id="register-btn"
                class="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transform hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-emerald-500/30 flex items-center justify-center group"
              >
                <span class="btn-text group-hover:tracking-wider transition-all">Daftar Sekarang</span>
                <span class="btn-loading hidden">
                  <i class="fas fa-circle-notch fa-spin mr-2"></i>Memproses...
                </span>
              </button>
            </div>
          </form>

          <!-- Demo Credentials -->
          <div class="mt-8 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 backdrop-blur-sm">
            <p class="text-xs text-indigo-200 text-center">
              <i class="fas fa-info-circle mr-1"></i>
              <strong>Demo Account:</strong> admin@kkg-wanayasa.id / admin123
            </p>
          </div>
        </div>

        <!-- Back to Home -->
        <div class="text-center mt-8">
          <button onclick="navigate('home')" class="text-white/60 hover:text-white transition-colors text-sm flex items-center justify-center mx-auto gap-2 group">
            <i class="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  `;
}


/**
 * Initialize Auth Page (Load public settings)
 */
export async function initAuth() {
  try {
    const res = await api('/settings/public');
    const settings = res.data;

    if (settings) {
      const nameEl = document.getElementById('kkg-name');
      const addressEl = document.getElementById('kkg-address-subtitle');

      if (nameEl && settings.nama_kkg) {
        nameEl.textContent = `Portal Digital ${settings.nama_kkg}`;
      }

      if (addressEl) {
        let address = '';
        if (settings.kecamatan) address += `Kecamatan ${settings.kecamatan}`;
        if (settings.kabupaten) address += `, Kabupaten ${settings.kabupaten}`;

        // Use full address if available or fallback to built parts
        addressEl.textContent = settings.alamat_sekretariat || address || 'Gugus 3 Kecamatan Wanayasa';
      }
    }
  } catch (e) {
    console.error('Failed to load public settings:', e);
  }
}

/**
 * Switch between login and register tabs
 */
window.switchAuthTab = function (tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');

  if (!loginForm || !registerForm) return;

  // Clear any form errors
  clearFormErrors('login-form');
  clearFormErrors('register-form');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');

    // Animate transition
    loginForm.classList.add('animate-slide-up');

    tabLogin.classList.remove('text-white/60', 'hover:text-white', 'hover:bg-white/5');
    tabLogin.classList.add('text-white', 'shadow-sm', 'bg-white/20');

    tabRegister.classList.add('text-white/60', 'hover:text-white', 'hover:bg-white/5');
    tabRegister.classList.remove('text-white', 'shadow-sm', 'bg-white/20');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');

    // Animate transition
    registerForm.classList.add('animate-slide-up');

    tabLogin.classList.add('text-white/60', 'hover:text-white', 'hover:bg-white/5');
    tabLogin.classList.remove('text-white', 'shadow-sm', 'bg-white/20');

    tabRegister.classList.remove('text-white/60', 'hover:text-white', 'hover:bg-white/5');
    tabRegister.classList.add('text-white', 'shadow-sm', 'bg-white/20');

    // Load sekolah list if empty
    const sekolahSelect = document.getElementById('register-sekolah-select');
    if (sekolahSelect && sekolahSelect.options.length <= 1) {
      loadSekolahForRegister(sekolahSelect);
    }
  }
};

async function loadSekolahForRegister(select) {
  try {
    const res = await api('/sekolah');
    const sekolahList = res.data || [];

    // Add options
    sekolahList.forEach(s => {
      const option = document.createElement('option');
      option.value = s.nama;
      option.textContent = s.nama;
      option.className = "text-gray-800 bg-white"; // Ensure text is visible on white background options
      select.appendChild(option);
    });
  } catch (e) {
    console.error('Failed to load sekolah:', e);
  }
}

/**
 * Handle login form submission
 */
window.handleLogin = async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Validate
  const { valid, errors } = validateForm(data, {
    email: [
      (v) => validators.required(v, 'Email'),
      validators.email
    ],
    password: [
      (v) => validators.required(v, 'Password')
    ]
  });

  if (!valid) {
    showFormErrors(errors, 'login-form');
    return;
  }

  // Show loading state
  const btn = document.getElementById('login-btn');
  setButtonLoading(btn, true);

  try {
    const response = await api('/auth/login', {
      method: 'POST',
      body: data
    });

    state.user = response.data.user;
    showToast('Login berhasil! Selamat datang kembali.', 'success');
    navigate('home');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
};

/**
 * Handle register form submission
 */
window.handleRegister = async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Validate
  const { valid, errors } = validateForm(data, {
    nama: [
      (v) => validators.required(v, 'Nama'),
      (v) => validators.minLength(v, 2, 'Nama')
    ],
    email: [
      (v) => validators.required(v, 'Email'),
      validators.email
    ],
    password: [
      (v) => validators.required(v, 'Password'),
      validators.password
    ],
    confirm_password: [
      (v) => validators.required(v, 'Konfirmasi password'),
      (v) => validators.match(v, data.password, 'Password tidak cocok')
    ]
  });

  if (!valid) {
    showFormErrors(errors, 'register-form');
    return;
  }

  // Show loading state
  const btn = document.getElementById('register-btn');
  setButtonLoading(btn, true);

  try {
    // Remove confirm_password before sending
    const { confirm_password, ...registerData } = data;

    const response = await api('/auth/register', {
      method: 'POST',
      body: registerData
    });

    state.user = response.data.user;
    showToast('Registrasi berhasil! Selamat bergabung.', 'success');
    navigate('home');
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
    btn.classList.add('opacity-80', 'cursor-not-allowed');
    if (textEl) textEl.classList.add('hidden');
    if (loadingEl) loadingEl.classList.remove('hidden');
  } else {
    btn.disabled = false;
    btn.classList.remove('opacity-80', 'cursor-not-allowed');
    if (textEl) textEl.classList.remove('hidden');
    if (loadingEl) loadingEl.classList.add('hidden');
  }
}

/**
 * Logout handler
 */
window.logout = async function () {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch (e) {
    // Ignore errors, still log out client-side
  }

  state.user = null;
  showToast('Logout berhasil', 'success');
  navigate('home');
};
