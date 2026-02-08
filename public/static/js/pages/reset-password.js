/**
 * Reset Password Page
 */

import { api } from '../api.js';
import { showToast, getQueryParams } from '../utils.js';
import { navigate } from '../router.js';

export function renderResetPassword() {
    const params = getQueryParams();
    const token = params.token || '';

    return `
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 py-12 px-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
          <i class="fas fa-key text-3xl text-white"></i>
        </div>
        <h1 class="text-3xl font-bold text-white">Reset Password</h1>
        <p class="text-blue-200 mt-2">Masukkan password baru Anda</p>
      </div>

      <div class="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
        <div id="reset-form-container">
          ${token ? renderResetForm(token) : renderRequestForm()}
        </div>
      </div>

      <div class="text-center mt-6">
        <a href="javascript:void(0)" onclick="navigate('login')" class="text-white/80 hover:text-white transition">
          <i class="fas fa-arrow-left mr-2"></i>Kembali ke Login
        </a>
      </div>
    </div>
  </div>
  `;
}

function renderRequestForm() {
    return `
    <form id="forgot-password-form" onsubmit="handleForgotPassword(event)">
      <div class="mb-6">
        <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
          <i class="fas fa-envelope mr-1 text-blue-500"></i>Email
        </label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          required 
          autocomplete="email"
          placeholder="Masukkan email Anda"
          class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
        >
      </div>

      <button 
        type="submit" 
        id="forgot-btn"
        class="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition shadow-lg"
      >
        <i class="fas fa-paper-plane mr-2"></i>Kirim Link Reset
      </button>
    </form>

    <div id="success-message" class="hidden text-center">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-3xl text-green-600"></i>
      </div>
      <h3 class="text-lg font-semibold text-gray-800 mb-2">Email Terkirim!</h3>
      <p class="text-gray-600 mb-4">
        Jika email terdaftar, Anda akan menerima link untuk reset password.
        Silakan cek inbox dan folder spam Anda.
      </p>
      <button 
        onclick="navigate('login')" 
        class="text-blue-600 hover:underline font-medium"
      >
        Kembali ke Login
      </button>
    </div>
  `;
}

function renderResetForm(token) {
    return `
    <div id="token-checking" class="text-center py-8">
      <div class="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-gray-600">Memverifikasi token...</p>
    </div>

    <form id="reset-password-form" class="hidden" onsubmit="handleResetPassword(event)">
      <input type="hidden" name="token" value="${token}">
      
      <div class="mb-4">
        <label for="new_password" class="block text-sm font-semibold text-gray-700 mb-2">
          <i class="fas fa-lock mr-1 text-blue-500"></i>Password Baru
        </label>
        <div class="relative">
          <input 
            type="password" 
            id="new_password" 
            name="new_password" 
            required 
            minlength="8"
            placeholder="Minimal 8 karakter"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition pr-12"
          >
          <button 
            type="button" 
            onclick="togglePasswordVisibility('new_password')"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>

      <div class="mb-6">
        <label for="confirm_password" class="block text-sm font-semibold text-gray-700 mb-2">
          <i class="fas fa-lock mr-1 text-blue-500"></i>Konfirmasi Password
        </label>
        <div class="relative">
          <input 
            type="password" 
            id="confirm_password" 
            name="confirm_password" 
            required 
            minlength="8"
            placeholder="Ulangi password baru"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition pr-12"
          >
          <button 
            type="button" 
            onclick="togglePasswordVisibility('confirm_password')"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>

      <button 
        type="submit" 
        id="reset-btn"
        class="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition shadow-lg"
      >
        <i class="fas fa-save mr-2"></i>Simpan Password Baru
      </button>
    </form>

    <div id="invalid-token" class="hidden text-center">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-times text-3xl text-red-600"></i>
      </div>
      <h3 class="text-lg font-semibold text-gray-800 mb-2">Token Tidak Valid</h3>
      <p class="text-gray-600 mb-4">
        Link reset password tidak valid atau sudah kadaluarsa.
        Silakan minta link reset password baru.
      </p>
      <button 
        onclick="showRequestForm()" 
        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
      >
        Minta Link Baru
      </button>
    </div>

    <div id="reset-success" class="hidden text-center">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-3xl text-green-600"></i>
      </div>
      <h3 class="text-lg font-semibold text-gray-800 mb-2">Password Berhasil Direset!</h3>
      <p class="text-gray-600 mb-4">
        Silakan login dengan password baru Anda.
      </p>
      <button 
        onclick="navigate('login')" 
        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
      >
        <i class="fas fa-sign-in-alt mr-2"></i>Login Sekarang
      </button>
    </div>
  `;
}

// Initialize page
export function initResetPassword() {
    const params = getQueryParams();
    const token = params.token;

    if (token) {
        verifyToken(token);
    }
}

async function verifyToken(token) {
    try {
        const res = await api(`/auth/verify-reset-token/${token}`);

        document.getElementById('token-checking')?.classList.add('hidden');

        if (res.data?.valid) {
            document.getElementById('reset-password-form')?.classList.remove('hidden');
        } else {
            document.getElementById('invalid-token')?.classList.remove('hidden');
        }
    } catch (e) {
        document.getElementById('token-checking')?.classList.add('hidden');
        document.getElementById('invalid-token')?.classList.remove('hidden');
    }
}

// Global handlers
window.handleForgotPassword = async function (e) {
    e.preventDefault();

    const form = e.target;
    const btn = document.getElementById('forgot-btn');
    const email = form.email.value.trim();

    if (!email) {
        showToast('Masukkan email Anda', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Mengirim...';

    try {
        await api('/auth/forgot-password', {
            method: 'POST',
            body: { email }
        });

        // Show success message
        document.getElementById('forgot-password-form')?.classList.add('hidden');
        document.getElementById('success-message')?.classList.remove('hidden');
    } catch (e) {
        showToast(e.message || 'Gagal mengirim email', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Kirim Link Reset';
    }
}

window.handleResetPassword = async function (e) {
    e.preventDefault();

    const form = e.target;
    const btn = document.getElementById('reset-btn');
    const token = form.token.value;
    const newPassword = form.new_password.value;
    const confirmPassword = form.confirm_password.value;

    if (newPassword !== confirmPassword) {
        showToast('Password tidak cocok', 'warning');
        return;
    }

    if (newPassword.length < 8) {
        showToast('Password minimal 8 karakter', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Menyimpan...';

    try {
        await api('/auth/reset-password', {
            method: 'POST',
            body: {
                token,
                new_password: newPassword
            }
        });

        // Show success message
        document.getElementById('reset-password-form')?.classList.add('hidden');
        document.getElementById('reset-success')?.classList.remove('hidden');
        showToast('Password berhasil direset!', 'success');
    } catch (e) {
        showToast(e.message || 'Gagal reset password', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save mr-2"></i>Simpan Password Baru';
    }
}

window.showRequestForm = function () {
    const container = document.getElementById('reset-form-container');
    if (container) {
        container.innerHTML = renderRequestForm();
    }
}

window.togglePasswordVisibility = function (inputId) {
    const input = document.getElementById(inputId);
    const icon = input?.nextElementSibling?.querySelector('i');

    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}
