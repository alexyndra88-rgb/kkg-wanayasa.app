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
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center py-12 px-4">
      <div class="max-w-md w-full">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <i class="fas fa-graduation-cap text-4xl text-yellow-400"></i>
          </div>
          <h1 class="text-2xl font-bold text-white">Portal Digital KKG</h1>
          <p class="text-blue-200">Gugus 3 Kecamatan Wanayasa</p>
        </div>

        <!-- Card -->
        <div class="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <!-- Tabs -->
          <div class="flex space-x-1 mb-6 bg-white/10 rounded-xl p-1">
            <button 
              id="tab-login" 
              onclick="switchAuthTab('login')"
              class="auth-tab flex-1 py-2.5 rounded-lg font-medium transition-all text-white bg-white/20"
            >
              <i class="fas fa-sign-in-alt mr-2"></i>Masuk
            </button>
            <button 
              id="tab-register" 
              onclick="switchAuthTab('register')"
              class="auth-tab flex-1 py-2.5 rounded-lg font-medium transition-all text-white/70 hover:text-white"
            >
              <i class="fas fa-user-plus mr-2"></i>Daftar
            </button>
          </div>

          <!-- Login Form -->
          <form id="login-form" onsubmit="handleLogin(event)">
            <div class="space-y-4">
              <div>
                <label class="block text-white/80 text-sm font-medium mb-2">Email</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-white/50">
                    <i class="fas fa-envelope"></i>
                  </span>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="nama@email.com"
                    class="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label class="block text-white/80 text-sm font-medium mb-2">Password</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-white/50">
                    <i class="fas fa-lock"></i>
                  </span>
                  <input 
                    type="password" 
                    name="password" 
                    placeholder="Masukkan password"
                    class="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                id="login-btn"
                class="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-400 transform hover:scale-[1.02] transition-all shadow-lg"
              >
                <span class="btn-text">Masuk</span>
                <span class="btn-loading hidden">
                  <i class="fas fa-spinner fa-spin mr-2"></i>Memproses...
                </span>
              </button>
              
              <div class="text-center">
                <a href="javascript:void(0)" onclick="navigate('reset-password')" class="text-sm text-white/70 hover:text-white transition">
                  <i class="fas fa-key mr-1"></i>Lupa Password?
                </a>
              </div>
            </div>
          </form>

          <!-- Register Form -->
          <form id="register-form" class="hidden" onsubmit="handleRegister(event)">
            <div class="space-y-4">
              <div>
                <label class="block text-white/80 text-sm font-medium mb-2">Nama Lengkap <span class="text-red-400">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-white/50">
                    <i class="fas fa-user"></i>
                  </span>
                  <input 
                    type="text" 
                    name="nama" 
                    placeholder="Nama lengkap Anda"
                    class="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label class="block text-white/80 text-sm font-medium mb-2">Email <span class="text-red-400">*</span></label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-white/50">
                    <i class="fas fa-envelope"></i>
                  </span>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="nama@email.com"
                    class="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-white/80 text-sm font-medium mb-2">Password <span class="text-red-400">*</span></label>
                  <input 
                    type="password" 
                    name="password" 
                    placeholder="Min. 8 karakter"
                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/50 transition-all"
                    required
                  />
                </div>
                <div>
                  <label class="block text-white/80 text-sm font-medium mb-2">Konfirmasi <span class="text-red-400">*</span></label>
                  <input 
                    type="password" 
                    name="confirm_password" 
                    placeholder="Ulangi password"
                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/50 transition-all"
                    required
                  />
                </div>
              </div>
              <p class="text-xs text-white/50 -mt-2">Password minimal 8 karakter, mengandung huruf dan angka</p>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-white/80 text-sm font-medium mb-2">NIP</label>
                  <input 
                    type="text" 
                    name="nip" 
                    placeholder="NIP (opsional)"
                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/50 transition-all"
                  />
                </div>
                <div>
                  <label class="block text-white/80 text-sm font-medium mb-2">No. HP</label>
                  <input 
                    type="tel" 
                    name="no_hp" 
                    placeholder="08xxx (opsional)"
                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label class="block text-white/80 text-sm font-medium mb-2">Asal Sekolah</label>
                <input 
                  type="text" 
                  name="sekolah" 
                  placeholder="Nama sekolah (opsional)"
                  class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/50 transition-all"
                />
              </div>

              <button 
                type="submit" 
                id="register-btn"
                class="w-full py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-gray-900 font-bold rounded-xl hover:from-green-300 hover:to-emerald-400 transform hover:scale-[1.02] transition-all shadow-lg"
              >
                <span class="btn-text">Daftar Sekarang</span>
                <span class="btn-loading hidden">
                  <i class="fas fa-spinner fa-spin mr-2"></i>Memproses...
                </span>
              </button>
            </div>
          </form>

          <!-- Demo Credentials -->
          <div class="mt-6 p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
            <p class="text-sm text-blue-200">
              <i class="fas fa-info-circle mr-2"></i>
              <strong>Demo:</strong> admin@kkg-wanayasa.id / admin123
            </p>
          </div>
        </div>

        <!-- Back to Home -->
        <div class="text-center mt-6">
          <button onclick="navigate('home')" class="text-white/70 hover:text-white transition-colors">
            <i class="fas fa-arrow-left mr-2"></i>Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  `;
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
    tabLogin.classList.add('bg-white/20');
    tabLogin.classList.remove('text-white/70');
    tabLogin.classList.add('text-white');
    tabRegister.classList.remove('bg-white/20');
    tabRegister.classList.add('text-white/70');
    tabRegister.classList.remove('text-white');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabLogin.classList.remove('bg-white/20');
    tabLogin.classList.add('text-white/70');
    tabLogin.classList.remove('text-white');
    tabRegister.classList.add('bg-white/20');
    tabRegister.classList.remove('text-white/70');
    tabRegister.classList.add('text-white');
  }
};

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
    if (textEl) textEl.classList.add('hidden');
    if (loadingEl) loadingEl.classList.remove('hidden');
  } else {
    btn.disabled = false;
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
