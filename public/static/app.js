// ==========================================
// Portal Digital KKG Gugus 3 Wanayasa
// Single Page Application
// ==========================================

// === STATE MANAGEMENT ===
const state = {
  user: null,
  currentPage: 'home',
  loading: false,
  mobileMenuOpen: false,
};

// === UTILITY FUNCTIONS ===
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

async function api(path, options = {}) {
  const defaults = { headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' };
  const config = { ...defaults, ...options };
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }
  const res = await fetch(`/api${path}`, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
  return data;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function nl2br(str) {
  if (!str) return '';
  return escapeHtml(str).replace(/\n/g, '<br>');
}

// === ROUTER ===
function navigate(page, params = {}) {
  state.currentPage = page;
  state.pageParams = params;
  window.history.pushState({ page, params }, '', `/${page === 'home' ? '' : page}`);
  render();
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', (e) => {
  if (e.state) {
    state.currentPage = e.state.page || 'home';
    state.pageParams = e.state.params || {};
  } else {
    const path = window.location.pathname.slice(1) || 'home';
    state.currentPage = path;
    state.pageParams = {};
  }
  render();
});

// === NAVBAR COMPONENT ===
function renderNavbar() {
  const links = [
    { id: 'home', label: 'Beranda', icon: 'fa-home' },
    { id: 'surat', label: 'Generator Surat', icon: 'fa-envelope' },
    { id: 'proker', label: 'Program Kerja', icon: 'fa-clipboard-list' },
    { id: 'absensi', label: 'Absensi', icon: 'fa-calendar-check' },
    { id: 'materi', label: 'Materi', icon: 'fa-book' },
    { id: 'guru', label: 'Direktori Guru', icon: 'fa-users' },
    { id: 'forum', label: 'Forum', icon: 'fa-comments' },
    { id: 'pengumuman', label: 'Pengumuman', icon: 'fa-bullhorn' },
  ];

  return `
  <nav class="gradient-bg text-white shadow-xl sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center cursor-pointer" onclick="navigate('home')">
          <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
            <i class="fas fa-graduation-cap text-xl text-green-300"></i>
          </div>
          <div class="hidden sm:block">
            <div class="font-bold text-sm leading-tight">KKG Gugus 3</div>
            <div class="text-xs text-green-300 leading-tight">Wanayasa, Purwakarta</div>
          </div>
        </div>
        
        <div class="hidden lg:flex items-center space-x-1">
          ${links.map(l => `
            <button onclick="navigate('${l.id}')" 
              class="px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition ${state.currentPage === l.id ? 'nav-active' : ''}">
              <i class="fas ${l.icon} mr-1"></i>${l.label}
            </button>
          `).join('')}
        </div>

        <div class="flex items-center space-x-2">
          ${state.user ? `
            <div class="hidden sm:flex items-center space-x-2">
              <span class="text-sm text-green-200"><i class="fas fa-user mr-1"></i>${escapeHtml(state.user.nama)}</span>
              ${state.user.role === 'admin' ? `<button onclick="navigate('admin')" class="px-3 py-1 bg-yellow-500/20 text-yellow-200 rounded-full text-xs font-medium hover:bg-yellow-500/30"><i class="fas fa-cog mr-1"></i>Admin</button>` : ''}
              <button onclick="logout()" class="px-3 py-1 bg-red-500/20 text-red-200 rounded-full text-xs font-medium hover:bg-red-500/30"><i class="fas fa-sign-out-alt mr-1"></i>Keluar</button>
            </div>
          ` : `
            <button onclick="navigate('login')" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition">
              <i class="fas fa-sign-in-alt mr-1"></i>Masuk
            </button>
          `}
          <button onclick="toggleMobileMenu()" class="lg:hidden p-2 rounded-lg hover:bg-white/10">
            <i class="fas fa-bars text-lg"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div id="mobile-menu" class="mobile-menu lg:hidden fixed top-0 left-0 w-72 h-full bg-gray-900 z-50 overflow-y-auto">
      <div class="p-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          <div class="font-bold text-green-300">KKG Gugus 3 Wanayasa</div>
          <div class="text-xs text-gray-400">Portal Digital</div>
        </div>
        <button onclick="toggleMobileMenu()" class="p-2 hover:bg-white/10 rounded-lg"><i class="fas fa-times"></i></button>
      </div>
      <div class="p-2">
        ${links.map(l => `
          <button onclick="navigate('${l.id}');toggleMobileMenu()" 
            class="w-full text-left px-4 py-3 rounded-lg text-sm font-medium hover:bg-white/10 transition flex items-center ${state.currentPage === l.id ? 'bg-white/10 text-green-300' : 'text-gray-300'}">
            <i class="fas ${l.icon} w-6 mr-3"></i>${l.label}
          </button>
        `).join('')}
        <div class="border-t border-gray-700 mt-2 pt-2">
          ${state.user ? `
            <div class="px-4 py-2 text-sm text-green-300"><i class="fas fa-user mr-2"></i>${escapeHtml(state.user.nama)}</div>
            ${state.user.role === 'admin' ? `<button onclick="navigate('admin');toggleMobileMenu()" class="w-full text-left px-4 py-3 text-sm text-yellow-300 hover:bg-white/10 rounded-lg"><i class="fas fa-cog w-6 mr-3"></i>Panel Admin</button>` : ''}
            <button onclick="logout()" class="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-white/10 rounded-lg"><i class="fas fa-sign-out-alt w-6 mr-3"></i>Keluar</button>
          ` : `
            <button onclick="navigate('login');toggleMobileMenu()" class="w-full text-left px-4 py-3 text-sm text-green-300 hover:bg-white/10 rounded-lg"><i class="fas fa-sign-in-alt w-6 mr-3"></i>Masuk</button>
          `}
        </div>
      </div>
    </div>
  </nav>`;
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
}

// === FOOTER COMPONENT ===
function renderFooter() {
  return `
  <footer class="gradient-bg text-white mt-16">
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
              <i class="fas fa-graduation-cap text-xl text-green-300"></i>
            </div>
            <div>
              <div class="font-bold">KKG Gugus 3 Wanayasa</div>
              <div class="text-xs text-green-300">Portal Digital</div>
            </div>
          </div>
          <p class="text-sm text-gray-300 leading-relaxed">Portal digital untuk koordinasi, komunikasi, dan kolaborasi antar guru di lingkungan KKG Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta.</p>
        </div>
        <div>
          <h3 class="font-bold mb-4 text-green-300">Kontak Koordinator</h3>
          <ul class="space-y-2 text-sm text-gray-300">
            <li><i class="fas fa-map-marker-alt w-5 mr-2 text-green-400"></i>SDN 1 Wanayasa, Kec. Wanayasa</li>
            <li><i class="fas fa-map w-5 mr-2 text-green-400"></i>Kabupaten Purwakarta, Jawa Barat</li>
            <li><i class="fas fa-phone w-5 mr-2 text-green-400"></i>081234567890</li>
            <li><i class="fas fa-envelope w-5 mr-2 text-green-400"></i>kkg.gugus3@wanayasa.id</li>
          </ul>
        </div>
        <div>
          <h3 class="font-bold mb-4 text-green-300">Tautan Terkait</h3>
          <ul class="space-y-2 text-sm text-gray-300">
            <li><a href="https://www.kemdikbud.go.id" target="_blank" class="hover:text-green-300 transition"><i class="fas fa-external-link-alt w-5 mr-2"></i>Kemendikbudristek</a></li>
            <li><a href="#" class="hover:text-green-300 transition"><i class="fas fa-external-link-alt w-5 mr-2"></i>Dinas Pendidikan Purwakarta</a></li>
            <li><a href="#" class="hover:text-green-300 transition"><i class="fas fa-external-link-alt w-5 mr-2"></i>PGRI Purwakarta</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-white/10 mt-8 pt-6 text-center text-sm text-gray-400">
        <p>&copy; 2025/2026 KKG Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta</p>
        <p class="mt-1">Tahun Ajaran 2025/2026 | Portal Digital v1.0</p>
      </div>
    </div>
  </footer>`;
}

// === PAGE: HOME ===
async function renderHome() {
  let pengumuman = [];
  try {
    const res = await api('/pengumuman?limit=5');
    pengumuman = res.data || [];
  } catch(e) { console.log('Pengumuman not loaded:', e); }

  return `
  <div class="fade-in">
    <!-- Hero Section -->
    <section class="gradient-bg text-white py-16 md:py-24 relative overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full"></div>
        <div class="absolute bottom-10 right-10 w-48 h-48 border-2 border-white rounded-full"></div>
        <div class="absolute top-1/2 left-1/3 w-20 h-20 border border-white rounded-full"></div>
      </div>
      <div class="max-w-7xl mx-auto px-4 relative z-10">
        <div class="text-center">
          <div class="inline-block px-4 py-1 bg-white/10 rounded-full text-sm font-medium text-green-300 mb-6">
            <i class="fas fa-school mr-2"></i>Kabupaten Purwakarta, Jawa Barat
          </div>
          <h1 class="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
            Portal Digital<br>
            <span class="text-green-300">KKG Gugus 3 Wanayasa</span>
          </h1>
          <p class="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-8">
            Platform kolaborasi digital untuk Kelompok Kerja Guru Gugus 3 Kecamatan Wanayasa. 
            Bersama memajukan mutu pendidikan.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button onclick="navigate('surat')" class="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-bold text-lg transition shadow-lg shadow-green-500/30">
              <i class="fas fa-envelope mr-2"></i>Buat Surat Undangan
            </button>
            <button onclick="navigate('proker')" class="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl font-bold text-lg transition">
              <i class="fas fa-clipboard-list mr-2"></i>Buat Program Kerja
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Visi Misi -->
    <section class="py-12 bg-white">
      <div class="max-w-7xl mx-auto px-4">
        <div class="grid md:grid-cols-2 gap-8">
          <div class="gradient-card rounded-2xl p-8 border border-green-100">
            <div class="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <i class="fas fa-eye text-2xl text-green-600"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-3">Visi</h3>
            <p class="text-gray-600 leading-relaxed">Mewujudkan guru-guru yang profesional, kompeten, dan berdaya saing tinggi di Gugus 3 Kecamatan Wanayasa melalui kolaborasi dan pengembangan berkelanjutan.</p>
          </div>
          <div class="gradient-card rounded-2xl p-8 border border-blue-100">
            <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <i class="fas fa-bullseye text-2xl text-blue-600"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-3">Misi</h3>
            <ul class="text-gray-600 space-y-2">
              <li class="flex items-start"><i class="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>Meningkatkan kompetensi guru melalui pelatihan dan workshop berkala</li>
              <li class="flex items-start"><i class="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>Memfasilitasi pertukaran ilmu dan pengalaman antar guru</li>
              <li class="flex items-start"><i class="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>Mendorong inovasi pembelajaran sesuai Kurikulum Merdeka</li>
              <li class="flex items-start"><i class="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>Memanfaatkan teknologi digital untuk administrasi pendidikan</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Access -->
    <section class="py-12">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-2xl font-bold text-gray-800 text-center mb-8">
          <i class="fas fa-th-large text-blue-500 mr-2"></i>Akses Cepat
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${[
            { id:'surat', icon:'fa-envelope', color:'bg-blue-500', label:'Generator Surat' },
            { id:'proker', icon:'fa-clipboard-list', color:'bg-green-500', label:'Program Kerja' },
            { id:'absensi', icon:'fa-calendar-check', color:'bg-purple-500', label:'Absensi Digital' },
            { id:'materi', icon:'fa-book', color:'bg-orange-500', label:'Repository Materi' },
            { id:'guru', icon:'fa-users', color:'bg-teal-500', label:'Direktori Guru' },
            { id:'forum', icon:'fa-comments', color:'bg-pink-500', label:'Forum Diskusi' },
            { id:'pengumuman', icon:'fa-bullhorn', color:'bg-yellow-500', label:'Pengumuman' },
            { id:'login', icon:'fa-user-shield', color:'bg-gray-600', label: state.user ? 'Profil Saya' : 'Login/Daftar' },
          ].map(item => `
            <button onclick="navigate('${item.id}')" class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition group border border-gray-100">
              <div class="w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                <i class="fas ${item.icon} text-white text-xl"></i>
              </div>
              <div class="text-sm font-semibold text-gray-700 text-center">${item.label}</div>
            </button>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Pengumuman Terbaru -->
    <section class="py-12 bg-white">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-2xl font-bold text-gray-800"><i class="fas fa-bullhorn text-yellow-500 mr-2"></i>Pengumuman Terbaru</h2>
          <button onclick="navigate('pengumuman')" class="text-blue-600 hover:text-blue-800 font-medium text-sm">Lihat Semua <i class="fas fa-arrow-right ml-1"></i></button>
        </div>
        <div class="space-y-4">
          ${pengumuman.length > 0 ? pengumuman.map(p => `
            <div class="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-blue-200 transition cursor-pointer" onclick="navigate('pengumuman')">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    ${p.is_pinned ? '<span class="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium"><i class="fas fa-thumbtack mr-1"></i>Disematkan</span>' : ''}
                    <span class="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">${escapeHtml(p.kategori || 'umum')}</span>
                  </div>
                  <h3 class="font-bold text-gray-800 text-lg mb-2">${escapeHtml(p.judul)}</h3>
                  <p class="text-gray-500 text-sm line-clamp-2">${escapeHtml((p.isi || '').substring(0, 200))}...</p>
                </div>
                <div class="text-xs text-gray-400 ml-4 whitespace-nowrap">${formatDateTime(p.created_at)}</div>
              </div>
            </div>
          `).join('') : '<p class="text-gray-400 text-center py-8">Belum ada pengumuman. <a href="javascript:void(0)" onclick="initDb()" class="text-blue-500 underline">Inisialisasi Database</a></p>'}
        </div>
      </div>
    </section>
  </div>`;
}

// === PAGE: LOGIN ===
function renderLogin() {
  return `
  <div class="fade-in max-w-md mx-auto py-12 px-4">
    <div class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <div class="text-center mb-8">
        <div class="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-user-circle text-3xl text-white"></i>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">Masuk ke Portal</h1>
        <p class="text-gray-500 text-sm mt-1">KKG Gugus 3 Wanayasa</p>
      </div>

      <div class="flex mb-6 border-b border-gray-200">
        <button id="tab-login" onclick="switchAuthTab('login')" class="flex-1 py-3 text-sm font-semibold text-center tab-active">Masuk</button>
        <button id="tab-register" onclick="switchAuthTab('register')" class="flex-1 py-3 text-sm font-semibold text-center text-gray-400 hover:text-gray-600">Daftar Baru</button>
      </div>

      <form id="login-form" onsubmit="handleLogin(event)">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" required placeholder="contoh@email.com" 
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" name="password" required placeholder="Masukkan password" 
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
          </div>
          <button type="submit" id="login-btn" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30">
            <i class="fas fa-sign-in-alt mr-2"></i>Masuk
          </button>
        </div>
      </form>

      <form id="register-form" onsubmit="handleRegister(event)" class="hidden">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
            <input type="text" name="nama" required placeholder="Nama lengkap Anda"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" name="email" required placeholder="contoh@email.com"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input type="password" name="password" required minlength="6" placeholder="Min. 6 karakter"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">NIP</label>
              <input type="text" name="nip" placeholder="NIP"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
              <input type="text" name="no_hp" placeholder="08xxx"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sekolah</label>
            <input type="text" name="sekolah" placeholder="Nama sekolah"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
            <input type="text" name="mata_pelajaran" placeholder="Mata pelajaran"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
          </div>
          <button type="submit" id="register-btn" class="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-lg shadow-green-500/30">
            <i class="fas fa-user-plus mr-2"></i>Daftar
          </button>
        </div>
      </form>

      <div class="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
        <p class="font-semibold mb-1"><i class="fas fa-info-circle mr-1"></i>Demo Login:</p>
        <p>Admin: admin@kkg-wanayasa.id / admin123</p>
        <p>User: siti@kkg-wanayasa.id / admin123</p>
      </div>
    </div>
  </div>`;
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  if (tab === 'login') {
    loginForm.classList.remove('hidden'); registerForm.classList.add('hidden');
    tabLogin.className = 'flex-1 py-3 text-sm font-semibold text-center tab-active';
    tabRegister.className = 'flex-1 py-3 text-sm font-semibold text-center text-gray-400 hover:text-gray-600';
  } else {
    loginForm.classList.add('hidden'); registerForm.classList.remove('hidden');
    tabRegister.className = 'flex-1 py-3 text-sm font-semibold text-center tab-active';
    tabLogin.className = 'flex-1 py-3 text-sm font-semibold text-center text-gray-400 hover:text-gray-600';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('login-btn');
  btn.innerHTML = '<span class="spinner mr-2"></span>Memproses...'; btn.disabled = true;
  try {
    const res = await api('/auth/login', { method: 'POST', body: { email: form.email.value, password: form.password.value } });
    state.user = res.user;
    showToast(`Selamat datang, ${res.user.nama}!`);
    navigate('home');
  } catch (e) { showToast(e.message, 'error'); }
  btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Masuk'; btn.disabled = false;
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('register-btn');
  btn.innerHTML = '<span class="spinner mr-2"></span>Memproses...'; btn.disabled = true;
  try {
    const res = await api('/auth/register', { method: 'POST', body: {
      nama: form.nama.value, email: form.email.value, password: form.password.value,
      nip: form.nip.value, sekolah: form.sekolah.value, mata_pelajaran: form.mata_pelajaran.value, no_hp: form.no_hp.value,
    }});
    state.user = res.user;
    showToast('Pendaftaran berhasil!');
    navigate('home');
  } catch (e) { showToast(e.message, 'error'); }
  btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Daftar'; btn.disabled = false;
}

async function logout() {
  try { await api('/auth/logout', { method: 'POST' }); } catch(e) {}
  state.user = null;
  showToast('Berhasil keluar');
  navigate('home');
}

// === PAGE: GENERATOR SURAT UNDANGAN ===
function renderSurat() {
  return `
  <div class="fade-in max-w-4xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-envelope text-blue-500 mr-2"></i>Generator Surat Undangan</h1>
        <p class="text-gray-500 text-sm mt-1">Buat surat undangan KKG secara otomatis dengan AI</p>
      </div>
      ${state.user ? `<button onclick="loadSuratHistory()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"><i class="fas fa-history mr-1"></i>Riwayat</button>` : ''}
    </div>

    ${!state.user ? `
      <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
        <p class="text-yellow-800"><i class="fas fa-lock mr-2"></i>Silakan <a href="javascript:void(0)" onclick="navigate('login')" class="text-blue-600 underline font-semibold">login</a> untuk membuat surat undangan.</p>
      </div>
    ` : ''}

    <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
      <form id="surat-form" onsubmit="generateSurat(event)">
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-tag mr-1 text-blue-400"></i>Jenis Kegiatan *</label>
            <select name="jenis_kegiatan" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition">
              <option value="">-- Pilih Jenis Kegiatan --</option>
              <option value="Rapat Rutin KKG">Rapat Rutin KKG</option>
              <option value="Rapat Koordinasi">Rapat Koordinasi</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Pelatihan">Pelatihan</option>
              <option value="Kegiatan Bersama">Kegiatan Bersama</option>
              <option value="Sosialisasi">Sosialisasi</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-map-marker-alt mr-1 text-red-400"></i>Tempat Kegiatan *</label>
            <input type="text" name="tempat_kegiatan" required placeholder="Contoh: SDN 1 Wanayasa"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-calendar mr-1 text-green-400"></i>Tanggal Kegiatan *</label>
            <input type="date" name="tanggal_kegiatan" required
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-clock mr-1 text-purple-400"></i>Waktu Kegiatan *</label>
            <input type="text" name="waktu_kegiatan" required placeholder="Contoh: 09.00 - 12.00"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition">
          </div>
        </div>

        <div class="mt-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-list mr-1 text-orange-400"></i>Agenda/Acara *</label>
          <textarea name="agenda" required rows="3" placeholder="Tuliskan agenda kegiatan, pisahkan dengan enter untuk setiap poin..."
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition"></textarea>
        </div>

        <div class="mt-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-users mr-1 text-teal-400"></i>Peserta yang Diundang</label>
          <textarea name="peserta" rows="2" placeholder="Contoh: Seluruh anggota KKG Gugus 3 Wanayasa, Kepala Sekolah se-Gugus 3..."
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition"></textarea>
        </div>

        <div class="mt-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2"><i class="fas fa-user-tie mr-1 text-indigo-400"></i>Penanggung Jawab</label>
          <input type="text" name="penanggung_jawab" placeholder="Otomatis diisi dari data login" value="${state.user ? escapeHtml(state.user.nama) : ''}"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition">
        </div>

        <button type="submit" id="generate-surat-btn" ${!state.user ? 'disabled' : ''} 
          class="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30 text-lg">
          <i class="fas fa-magic mr-2"></i>Generate Surat dengan AI
        </button>
      </form>
    </div>

    <div id="surat-result" class="hidden mt-8">
      <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-800"><i class="fas fa-file-alt text-green-500 mr-2"></i>Preview Surat</h2>
          <div class="flex gap-2">
            <button onclick="downloadSuratPDF()" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition">
              <i class="fas fa-file-pdf mr-1"></i>Download PDF
            </button>
          </div>
        </div>
        <div id="surat-content" class="surat-preview bg-gray-50 border border-gray-200 rounded-xl p-8 text-sm"></div>
      </div>
    </div>

    <div id="surat-history" class="hidden mt-8"></div>
  </div>`;
}

async function generateSurat(e) {
  e.preventDefault();
  if (!state.user) { showToast('Silakan login terlebih dahulu', 'error'); return; }
  
  const form = e.target;
  const btn = document.getElementById('generate-surat-btn');
  btn.innerHTML = '<span class="spinner mr-2"></span>Memproses dengan AI... (30-60 detik)'; btn.disabled = true;

  try {
    const res = await api('/surat/generate', {
      method: 'POST',
      body: {
        jenis_kegiatan: form.jenis_kegiatan.value,
        tanggal_kegiatan: form.tanggal_kegiatan.value,
        waktu_kegiatan: form.waktu_kegiatan.value,
        tempat_kegiatan: form.tempat_kegiatan.value,
        agenda: form.agenda.value,
        peserta: form.peserta.value,
        penanggung_jawab: form.penanggung_jawab.value,
      }
    });

    document.getElementById('surat-content').textContent = res.data.isi_surat;
    document.getElementById('surat-result').classList.remove('hidden');
    showToast('Surat berhasil di-generate!');
  } catch (e) { showToast(e.message, 'error'); }

  btn.innerHTML = '<i class="fas fa-magic mr-2"></i>Generate Surat dengan AI'; btn.disabled = false;
}

function downloadSuratPDF() {
  const content = document.getElementById('surat-content').textContent;
  // Create a print-friendly version
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Surat Undangan KKG Gugus 3 Wanayasa</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; padding: 40px; max-width: 210mm; margin: auto; }
      @media print { body { padding: 20mm; } }
    </style></head>
    <body><pre style="white-space:pre-wrap;font-family:'Times New Roman',serif;">${escapeHtml(content)}</pre>
    <script>window.print();</script></body></html>
  `);
  win.document.close();
}

async function loadSuratHistory() {
  try {
    const res = await api('/surat/history');
    const container = document.getElementById('surat-history');
    container.classList.remove('hidden');
    
    if (!res.data || res.data.length === 0) {
      container.innerHTML = '<div class="bg-white rounded-2xl shadow-lg p-6 border text-center text-gray-400">Belum ada riwayat surat.</div>';
      return;
    }

    container.innerHTML = `
      <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 class="text-xl font-bold text-gray-800 mb-4"><i class="fas fa-history text-blue-500 mr-2"></i>Riwayat Surat</h2>
        <div class="space-y-3">
          ${res.data.map(s => `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border hover:border-blue-200 transition">
              <div>
                <div class="font-semibold text-gray-800">${escapeHtml(s.jenis_kegiatan)}</div>
                <div class="text-sm text-gray-500">${escapeHtml(s.nomor_surat)} | ${formatDate(s.tanggal_kegiatan)}</div>
              </div>
              <div class="flex gap-2">
                <button onclick="viewSurat(${s.id})" class="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200"><i class="fas fa-eye mr-1"></i>Lihat</button>
                <button onclick="deleteSurat(${s.id})" class="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"><i class="fas fa-trash mr-1"></i></button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  } catch (e) { showToast(e.message, 'error'); }
}

async function viewSurat(id) {
  try {
    const res = await api(`/surat/${id}`);
    document.getElementById('surat-content').textContent = res.data.isi_surat;
    document.getElementById('surat-result').classList.remove('hidden');
    document.getElementById('surat-result').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteSurat(id) {
  if (!confirm('Yakin ingin menghapus surat ini?')) return;
  try {
    await api(`/surat/${id}`, { method: 'DELETE' });
    showToast('Surat berhasil dihapus');
    loadSuratHistory();
  } catch (e) { showToast(e.message, 'error'); }
}

// === PAGE: GENERATOR PROGRAM KERJA ===
function renderProker() {
  return `
  <div class="fade-in max-w-4xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-clipboard-list text-green-500 mr-2"></i>Generator Program Kerja</h1>
        <p class="text-gray-500 text-sm mt-1">Susun program kerja KKG secara otomatis dengan AI</p>
      </div>
      ${state.user ? `<button onclick="loadProkerHistory()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"><i class="fas fa-history mr-1"></i>Riwayat</button>` : ''}
    </div>

    ${!state.user ? `
      <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
        <p class="text-yellow-800"><i class="fas fa-lock mr-2"></i>Silakan <a href="javascript:void(0)" onclick="navigate('login')" class="text-blue-600 underline font-semibold">login</a> untuk membuat program kerja.</p>
      </div>
    ` : ''}

    <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
      <form id="proker-form" onsubmit="generateProker(event)">
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Tahun Ajaran *</label>
            <select name="tahun_ajaran" required class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition">
              <option value="2025/2026" selected>2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="2024/2025">2024/2025</option>
            </select>
          </div>
        </div>

        <div class="mt-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2">Visi KKG *</label>
          <textarea name="visi" required rows="2" placeholder="Contoh: Mewujudkan guru profesional dan kompeten..."
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition"></textarea>
        </div>

        <div class="mt-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2">Misi KKG *</label>
          <textarea name="misi" required rows="3" placeholder="Tuliskan misi KKG, satu misi per baris..."
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition"></textarea>
        </div>

        <div class="mt-6">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-semibold text-gray-700">Daftar Program/Kegiatan *</label>
            <button type="button" onclick="addKegiatanRow()" class="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200">
              <i class="fas fa-plus mr-1"></i>Tambah
            </button>
          </div>
          <div id="kegiatan-rows" class="space-y-3">
            <div class="kegiatan-row bg-gray-50 rounded-xl p-4 border">
              <div class="grid md:grid-cols-2 gap-3">
                <input type="text" name="k_nama[]" placeholder="Nama Kegiatan" class="px-3 py-2 border rounded-lg text-sm w-full">
                <input type="text" name="k_waktu[]" placeholder="Waktu (mis: Januari 2026)" class="px-3 py-2 border rounded-lg text-sm w-full">
                <input type="text" name="k_pj[]" placeholder="Penanggung Jawab" class="px-3 py-2 border rounded-lg text-sm w-full">
                <input type="text" name="k_anggaran[]" placeholder="Anggaran (opsional)" class="px-3 py-2 border rounded-lg text-sm w-full">
              </div>
              <input type="text" name="k_indikator[]" placeholder="Indikator Keberhasilan" class="mt-3 px-3 py-2 border rounded-lg text-sm w-full">
            </div>
          </div>
        </div>

        <div class="mt-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2">Analisis Kebutuhan (Opsional)</label>
          <textarea name="analisis_kebutuhan" rows="3" placeholder="Tuliskan analisis kebutuhan guru dan sekolah di Gugus 3..."
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 transition"></textarea>
        </div>

        <button type="submit" id="generate-proker-btn" ${!state.user ? 'disabled' : ''} 
          class="mt-8 w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition shadow-lg shadow-green-500/30 text-lg">
          <i class="fas fa-magic mr-2"></i>Generate Program Kerja dengan AI
        </button>
      </form>
    </div>

    <div id="proker-result" class="hidden mt-8">
      <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-800"><i class="fas fa-file-alt text-green-500 mr-2"></i>Preview Program Kerja</h2>
          <button onclick="downloadProkerPDF()" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">
            <i class="fas fa-file-pdf mr-1"></i>Download PDF
          </button>
        </div>
        <div id="proker-content" class="proker-preview bg-gray-50 border border-gray-200 rounded-xl p-8 text-sm"></div>
      </div>
    </div>

    <div id="proker-history" class="hidden mt-8"></div>
  </div>`;
}

function addKegiatanRow() {
  const container = document.getElementById('kegiatan-rows');
  const row = document.createElement('div');
  row.className = 'kegiatan-row bg-gray-50 rounded-xl p-4 border relative';
  row.innerHTML = `
    <button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button>
    <div class="grid md:grid-cols-2 gap-3">
      <input type="text" name="k_nama[]" placeholder="Nama Kegiatan" class="px-3 py-2 border rounded-lg text-sm w-full">
      <input type="text" name="k_waktu[]" placeholder="Waktu (mis: Februari 2026)" class="px-3 py-2 border rounded-lg text-sm w-full">
      <input type="text" name="k_pj[]" placeholder="Penanggung Jawab" class="px-3 py-2 border rounded-lg text-sm w-full">
      <input type="text" name="k_anggaran[]" placeholder="Anggaran (opsional)" class="px-3 py-2 border rounded-lg text-sm w-full">
    </div>
    <input type="text" name="k_indikator[]" placeholder="Indikator Keberhasilan" class="mt-3 px-3 py-2 border rounded-lg text-sm w-full">
  `;
  container.appendChild(row);
}

async function generateProker(e) {
  e.preventDefault();
  if (!state.user) { showToast('Silakan login terlebih dahulu', 'error'); return; }

  const form = e.target;
  const btn = document.getElementById('generate-proker-btn');
  btn.innerHTML = '<span class="spinner mr-2"></span>Memproses dengan AI... (30-60 detik)'; btn.disabled = true;

  const namaList = form.querySelectorAll('[name="k_nama[]"]');
  const waktuList = form.querySelectorAll('[name="k_waktu[]"]');
  const pjList = form.querySelectorAll('[name="k_pj[]"]');
  const anggaranList = form.querySelectorAll('[name="k_anggaran[]"]');
  const indikatorList = form.querySelectorAll('[name="k_indikator[]"]');

  const kegiatan = [];
  namaList.forEach((el, i) => {
    if (el.value.trim()) {
      kegiatan.push({
        nama_kegiatan: el.value, waktu_pelaksanaan: waktuList[i]?.value || '',
        penanggung_jawab: pjList[i]?.value || '', anggaran: anggaranList[i]?.value || '',
        indikator: indikatorList[i]?.value || ''
      });
    }
  });

  try {
    const res = await api('/proker/generate', {
      method: 'POST',
      body: {
        tahun_ajaran: form.tahun_ajaran.value, visi: form.visi.value,
        misi: form.misi.value, kegiatan, analisis_kebutuhan: form.analisis_kebutuhan.value,
      }
    });

    document.getElementById('proker-content').textContent = res.data.isi_dokumen;
    document.getElementById('proker-result').classList.remove('hidden');
    showToast('Program Kerja berhasil di-generate!');
  } catch (e) { showToast(e.message, 'error'); }

  btn.innerHTML = '<i class="fas fa-magic mr-2"></i>Generate Program Kerja dengan AI'; btn.disabled = false;
}

function downloadProkerPDF() {
  const content = document.getElementById('proker-content').textContent;
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Program Kerja KKG Gugus 3 Wanayasa</title>
    <style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.8;padding:40px;max-width:210mm;margin:auto;}@media print{body{padding:20mm;}}</style></head>
    <body><pre style="white-space:pre-wrap;font-family:'Times New Roman',serif;">${escapeHtml(content)}</pre>
    <script>window.print();</script></body></html>
  `);
  win.document.close();
}

async function loadProkerHistory() {
  try {
    const res = await api('/proker/history');
    const container = document.getElementById('proker-history');
    container.classList.remove('hidden');
    if (!res.data || res.data.length === 0) {
      container.innerHTML = '<div class="bg-white rounded-2xl shadow-lg p-6 border text-center text-gray-400">Belum ada riwayat program kerja.</div>';
      return;
    }
    container.innerHTML = `
      <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 class="text-xl font-bold text-gray-800 mb-4"><i class="fas fa-history text-green-500 mr-2"></i>Riwayat Program Kerja</h2>
        <div class="space-y-3">
          ${res.data.map(p => `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border hover:border-green-200 transition">
              <div>
                <div class="font-semibold text-gray-800">Program Kerja TA ${escapeHtml(p.tahun_ajaran)}</div>
                <div class="text-sm text-gray-500">${formatDateTime(p.created_at)}</div>
              </div>
              <div class="flex gap-2">
                <button onclick="viewProker(${p.id})" class="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm hover:bg-green-200"><i class="fas fa-eye mr-1"></i>Lihat</button>
                <button onclick="deleteProker(${p.id})" class="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"><i class="fas fa-trash mr-1"></i></button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  } catch (e) { showToast(e.message, 'error'); }
}

async function viewProker(id) {
  try {
    const res = await api(`/proker/${id}`);
    document.getElementById('proker-content').textContent = res.data.isi_dokumen;
    document.getElementById('proker-result').classList.remove('hidden');
    document.getElementById('proker-result').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteProker(id) {
  if (!confirm('Yakin ingin menghapus program kerja ini?')) return;
  try { await api(`/proker/${id}`, { method: 'DELETE' }); showToast('Program kerja berhasil dihapus'); loadProkerHistory(); }
  catch (e) { showToast(e.message, 'error'); }
}

// === PAGE: ABSENSI ===
async function renderAbsensi() {
  let kegiatan = [];
  try { const res = await api('/absensi/kegiatan'); kegiatan = res.data || []; } catch(e) {}

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

function showAddKegiatan() {
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

async function addKegiatan(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/absensi/kegiatan', { method: 'POST', body: {
      nama_kegiatan: form.nama_kegiatan.value, tanggal: form.tanggal.value,
      waktu_mulai: form.waktu_mulai.value, waktu_selesai: form.waktu_selesai.value,
      tempat: form.tempat.value, deskripsi: form.deskripsi.value,
    }});
    showToast('Kegiatan berhasil ditambahkan!');
    render();
  } catch (e) { showToast(e.message, 'error'); }
}

async function checkinAbsensi(kegiatanId) {
  try {
    await api('/absensi/checkin', { method: 'POST', body: { kegiatan_id: kegiatanId } });
    showToast('Check-in berhasil!');
  } catch (e) { showToast(e.message, 'error'); }
}

async function viewAbsensi(kegiatanId, nama) {
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
              <tbody>${res.data.map((a, i) => `<tr class="border-t"><td class="px-4 py-3">${i+1}</td><td class="px-4 py-3 font-medium">${escapeHtml(a.nama)}</td><td class="px-4 py-3">${escapeHtml(a.nip || '-')}</td><td class="px-4 py-3">${escapeHtml(a.sekolah || '-')}</td><td class="px-4 py-3">${formatDateTime(a.waktu_checkin)}</td></tr>`).join('')}</tbody>
            </table>
          </div>
          <p class="mt-4 text-sm text-gray-500">Total hadir: <strong>${res.data.length}</strong> orang</p>
        ` : '<p class="text-gray-400 text-center py-6">Belum ada yang check-in.</p>'}
      </div>`;
    container.scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast(e.message, 'error'); }
}

async function showRekapAbsensi() {
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
            <tbody>${(res.data||[]).map(r => {
              const persen = r.total_kegiatan > 0 ? Math.round(r.total_hadir / r.total_kegiatan * 100) : 0;
              return `<tr class="border-t"><td class="px-4 py-3 font-medium">${escapeHtml(r.nama)}</td><td class="px-4 py-3">${escapeHtml(r.nip||'-')}</td><td class="px-4 py-3">${escapeHtml(r.sekolah||'-')}</td><td class="px-4 py-3 text-center">${r.total_hadir}</td><td class="px-4 py-3 text-center">${r.total_kegiatan}</td><td class="px-4 py-3 text-center"><span class="px-2 py-1 rounded-full text-xs font-bold ${persen >= 75 ? 'bg-green-100 text-green-700' : persen >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}">${persen}%</span></td></tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </div>`;
  } catch (e) { showToast(e.message, 'error'); }
}

// === PAGE: MATERI ===
async function renderMateri() {
  let materiList = [];
  try { const res = await api('/materi'); materiList = res.data || []; } catch(e) {}

  return `
  <div class="fade-in max-w-5xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-book text-orange-500 mr-2"></i>Repository Materi</h1>
        <p class="text-gray-500 text-sm mt-1">Kumpulan materi pembelajaran dan RPP</p>
      </div>
      ${state.user ? `<button onclick="showUploadMateri()" class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"><i class="fas fa-upload mr-1"></i>Upload Materi</button>` : ''}
    </div>

    <div id="upload-materi-modal" class="hidden mb-6"></div>

    <!-- Filter -->
    <div class="bg-white rounded-xl p-4 border mb-6 flex flex-wrap gap-3">
      <select id="filter-jenis" onchange="filterMateri()" class="px-3 py-2 border rounded-lg text-sm">
        <option value="">Semua Jenis</option>
        <option value="RPP">RPP</option><option value="Modul">Modul</option><option value="Silabus">Silabus</option>
        <option value="Media Ajar">Media Ajar</option><option value="Soal">Soal</option><option value="Lainnya">Lainnya</option>
      </select>
      <select id="filter-jenjang" onchange="filterMateri()" class="px-3 py-2 border rounded-lg text-sm">
        <option value="">Semua Jenjang</option>
        <option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
      </select>
      <input type="text" id="filter-search" onkeyup="filterMateri()" placeholder="Cari materi..." class="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm">
    </div>

    <div id="materi-list" class="grid md:grid-cols-2 gap-4">
      ${materiList.length > 0 ? materiList.map(m => renderMateriCard(m)).join('') : '<div class="md:col-span-2 text-center py-12 text-gray-400"><i class="fas fa-folder-open text-4xl mb-4 block"></i>Belum ada materi yang diupload.</div>'}
    </div>
  </div>`;
}

function renderMateriCard(m) {
  const icons = { 'RPP': 'fa-file-alt text-blue-500', 'Modul': 'fa-book text-green-500', 'Silabus': 'fa-file-contract text-purple-500', 'Media Ajar': 'fa-photo-video text-pink-500', 'Soal': 'fa-question-circle text-red-500' };
  const icon = icons[m.jenis] || 'fa-file text-gray-500';
  return `
    <div class="bg-white rounded-xl p-5 border hover:border-orange-200 transition shadow-sm">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <i class="fas ${icon} text-xl"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-gray-800 truncate">${escapeHtml(m.judul)}</h3>
          <p class="text-sm text-gray-500 mt-1 line-clamp-2">${escapeHtml(m.deskripsi || 'Tidak ada deskripsi')}</p>
          <div class="flex flex-wrap gap-2 mt-2">
            ${m.jenis ? `<span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">${escapeHtml(m.jenis)}</span>` : ''}
            ${m.jenjang ? `<span class="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">${escapeHtml(m.jenjang)}</span>` : ''}
            ${m.kategori ? `<span class="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full">${escapeHtml(m.kategori)}</span>` : ''}
          </div>
          <div class="flex items-center justify-between mt-3 text-xs text-gray-400">
            <span><i class="fas fa-user mr-1"></i>${escapeHtml(m.uploader_name || '-')}</span>
            <span><i class="fas fa-download mr-1"></i>${m.download_count || 0} unduhan</span>
          </div>
        </div>
      </div>
    </div>`;
}

function showUploadMateri() {
  const container = document.getElementById('upload-materi-modal');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-orange-200">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-upload text-orange-500 mr-2"></i>Upload Materi Baru</h3>
      <form onsubmit="uploadMateri(event)" class="grid md:grid-cols-2 gap-4">
        <div class="md:col-span-2"><input type="text" name="judul" required placeholder="Judul Materi" class="w-full px-4 py-3 border rounded-xl"></div>
        <div class="md:col-span-2"><textarea name="deskripsi" placeholder="Deskripsi materi..." rows="2" class="w-full px-4 py-3 border rounded-xl"></textarea></div>
        <select name="jenis" class="px-4 py-3 border rounded-xl">
          <option value="">Jenis Materi</option><option value="RPP">RPP</option><option value="Modul">Modul</option>
          <option value="Silabus">Silabus</option><option value="Media Ajar">Media Ajar</option><option value="Soal">Soal</option><option value="Lainnya">Lainnya</option>
        </select>
        <select name="jenjang" class="px-4 py-3 border rounded-xl">
          <option value="">Jenjang</option><option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
        </select>
        <input type="text" name="kategori" placeholder="Kategori/Mapel (contoh: Matematika)" class="px-4 py-3 border rounded-xl">
        <input type="url" name="file_url" placeholder="URL File (Google Drive, dll)" class="px-4 py-3 border rounded-xl">
        <div class="md:col-span-2 flex gap-2">
          <button type="submit" class="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600">Upload</button>
          <button type="button" onclick="document.getElementById('upload-materi-modal').classList.add('hidden')" class="px-6 py-2 bg-gray-200 rounded-lg font-medium">Batal</button>
        </div>
      </form>
    </div>`;
}

async function uploadMateri(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/materi', { method: 'POST', body: {
      judul: form.judul.value, deskripsi: form.deskripsi.value, jenis: form.jenis.value,
      jenjang: form.jenjang.value, kategori: form.kategori.value, file_url: form.file_url.value,
    }});
    showToast('Materi berhasil diupload!');
    render();
  } catch (e) { showToast(e.message, 'error'); }
}

async function filterMateri() {
  const jenis = document.getElementById('filter-jenis')?.value || '';
  const jenjang = document.getElementById('filter-jenjang')?.value || '';
  const search = document.getElementById('filter-search')?.value || '';
  try {
    const res = await api(`/materi?jenis=${jenis}&jenjang=${jenjang}&search=${encodeURIComponent(search)}`);
    const container = document.getElementById('materi-list');
    const list = res.data || [];
    container.innerHTML = list.length > 0 ? list.map(m => renderMateriCard(m)).join('') : '<div class="md:col-span-2 text-center py-12 text-gray-400">Tidak ada materi yang cocok.</div>';
  } catch (e) { console.error(e); }
}

// === PAGE: DIREKTORI GURU ===
async function renderGuru() {
  let guruList = [];
  try { const res = await api('/guru'); guruList = res.data || []; } catch(e) {}

  return `
  <div class="fade-in max-w-5xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-users text-teal-500 mr-2"></i>Direktori Guru</h1>
        <p class="text-gray-500 text-sm mt-1">Daftar anggota KKG Gugus 3 Wanayasa</p>
      </div>
    </div>

    <div class="bg-white rounded-xl p-4 border mb-6">
      <input type="text" id="guru-search" onkeyup="searchGuru()" placeholder="Cari berdasarkan nama, NIP, atau mata pelajaran..." class="w-full px-4 py-3 border rounded-xl">
    </div>

    <div id="guru-list" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${guruList.map(g => `
        <div class="bg-white rounded-xl p-5 border hover:border-teal-200 transition shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              ${escapeHtml((g.nama || '?')[0].toUpperCase())}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-gray-800 truncate">${escapeHtml(g.nama)}</h3>
              <p class="text-sm text-gray-500">${escapeHtml(g.mata_pelajaran || '-')}</p>
              <p class="text-xs text-gray-400">${escapeHtml(g.sekolah || '-')}</p>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500 space-y-1">
            ${g.nip ? `<div><i class="fas fa-id-card w-5 text-gray-400"></i>${escapeHtml(g.nip)}</div>` : ''}
            ${g.no_hp ? `<div><i class="fas fa-phone w-5 text-gray-400"></i>${escapeHtml(g.no_hp)}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    ${guruList.length === 0 ? '<div class="text-center py-12 text-gray-400">Belum ada data guru.</div>' : ''}
  </div>`;
}

async function searchGuru() {
  const search = document.getElementById('guru-search')?.value || '';
  try {
    const res = await api(`/guru?search=${encodeURIComponent(search)}`);
    const container = document.getElementById('guru-list');
    const list = res.data || [];
    container.innerHTML = list.map(g => `
      <div class="bg-white rounded-xl p-5 border hover:border-teal-200 transition shadow-sm">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">${escapeHtml((g.nama||'?')[0].toUpperCase())}</div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-gray-800 truncate">${escapeHtml(g.nama)}</h3>
            <p class="text-sm text-gray-500">${escapeHtml(g.mata_pelajaran||'-')}</p>
            <p class="text-xs text-gray-400">${escapeHtml(g.sekolah||'-')}</p>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500 space-y-1">
          ${g.nip ? `<div><i class="fas fa-id-card w-5 text-gray-400"></i>${escapeHtml(g.nip)}</div>` : ''}
          ${g.no_hp ? `<div><i class="fas fa-phone w-5 text-gray-400"></i>${escapeHtml(g.no_hp)}</div>` : ''}
        </div>
      </div>
    `).join('') || '<div class="md:col-span-3 text-center py-12 text-gray-400">Tidak ditemukan.</div>';
  } catch (e) { console.error(e); }
}

// === PAGE: FORUM ===
async function renderForum() {
  let threads = [];
  try { const res = await api('/forum/threads'); threads = res.data || []; } catch(e) {}

  return `
  <div class="fade-in max-w-4xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-comments text-pink-500 mr-2"></i>Forum Diskusi</h1>
        <p class="text-gray-500 text-sm mt-1">Ruang diskusi dan sharing antar guru</p>
      </div>
      ${state.user ? `<button onclick="showNewThread()" class="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600"><i class="fas fa-plus mr-1"></i>Topik Baru</button>` : ''}
    </div>

    <div id="new-thread-modal" class="hidden mb-6"></div>

    <div id="thread-list" class="space-y-4">
      ${threads.length > 0 ? threads.map(t => `
        <div onclick="viewThread(${t.id})" class="bg-white rounded-xl p-5 border hover:border-pink-200 transition shadow-sm cursor-pointer">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center flex-shrink-0">
              <i class="fas fa-comment-dots text-pink-500"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                ${t.is_pinned ? '<span class="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full"><i class="fas fa-thumbtack mr-1"></i>Pin</span>' : ''}
                ${t.kategori ? `<span class="px-2 py-0.5 bg-pink-50 text-pink-600 text-xs rounded-full">${escapeHtml(t.kategori)}</span>` : ''}
              </div>
              <h3 class="font-bold text-gray-800">${escapeHtml(t.judul)}</h3>
              <p class="text-sm text-gray-500 mt-1 line-clamp-2">${escapeHtml((t.isi||'').substring(0, 150))}...</p>
              <div class="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span><i class="fas fa-user mr-1"></i>${escapeHtml(t.author_name || '-')}</span>
                <span><i class="fas fa-clock mr-1"></i>${formatDateTime(t.created_at)}</span>
                <span><i class="fas fa-reply mr-1"></i>${t.reply_count || 0} balasan</span>
              </div>
            </div>
          </div>
        </div>
      `).join('') : '<div class="text-center py-12 text-gray-400"><i class="fas fa-comment-slash text-4xl mb-4 block"></i>Belum ada diskusi.</div>'}
    </div>

    <div id="thread-detail" class="hidden mt-8"></div>
  </div>`;
}

function showNewThread() {
  const container = document.getElementById('new-thread-modal');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-pink-200">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-plus-circle text-pink-500 mr-2"></i>Buat Topik Baru</h3>
      <form onsubmit="createThread(event)">
        <input type="text" name="judul" required placeholder="Judul Topik" class="w-full px-4 py-3 border rounded-xl mb-3">
        <select name="kategori" class="w-full px-4 py-3 border rounded-xl mb-3">
          <option value="umum">Umum</option><option value="best-practice">Best Practice</option><option value="kurikulum">Kurikulum</option>
          <option value="teknologi">Teknologi</option><option value="tanya-jawab">Tanya Jawab</option>
        </select>
        <textarea name="isi" required rows="4" placeholder="Tulis isi diskusi Anda..." class="w-full px-4 py-3 border rounded-xl mb-3"></textarea>
        <div class="flex gap-2">
          <button type="submit" class="px-6 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600">Posting</button>
          <button type="button" onclick="document.getElementById('new-thread-modal').classList.add('hidden')" class="px-6 py-2 bg-gray-200 rounded-lg font-medium">Batal</button>
        </div>
      </form>
    </div>`;
}

async function createThread(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/forum/threads', { method: 'POST', body: { judul: form.judul.value, isi: form.isi.value, kategori: form.kategori.value }});
    showToast('Topik berhasil dibuat!');
    render();
  } catch (e) { showToast(e.message, 'error'); }
}

async function viewThread(id) {
  try {
    const res = await api(`/forum/threads/${id}`);
    const { thread, replies } = res.data;
    const container = document.getElementById('thread-detail');
    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="bg-white rounded-2xl shadow-lg p-6 border">
        <button onclick="document.getElementById('thread-detail').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 float-right"><i class="fas fa-times text-lg"></i></button>
        <h2 class="font-bold text-xl text-gray-800 mb-2">${escapeHtml(thread.judul)}</h2>
        <div class="text-xs text-gray-400 mb-4"><i class="fas fa-user mr-1"></i>${escapeHtml(thread.author_name)} | <i class="fas fa-clock mr-1"></i>${formatDateTime(thread.created_at)}</div>
        <div class="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-700">${nl2br(thread.isi)}</div>
        
        <h3 class="font-bold text-gray-700 mb-4">Balasan (${replies.length})</h3>
        <div class="space-y-3 mb-6">
          ${replies.map(r => `
            <div class="bg-gray-50 rounded-xl p-4 border-l-4 border-pink-300">
              <div class="text-xs text-gray-400 mb-2"><strong class="text-gray-600">${escapeHtml(r.author_name)}</strong> | ${formatDateTime(r.created_at)}</div>
              <div class="text-sm text-gray-700">${nl2br(r.isi)}</div>
            </div>
          `).join('') || '<p class="text-gray-400 text-sm">Belum ada balasan.</p>'}
        </div>

        ${state.user ? `
          <form onsubmit="replyThread(event, ${thread.id})" class="border-t pt-4">
            <textarea name="isi" required rows="3" placeholder="Tulis balasan Anda..." class="w-full px-4 py-3 border rounded-xl mb-3"></textarea>
            <button type="submit" class="px-6 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600"><i class="fas fa-reply mr-1"></i>Balas</button>
          </form>
        ` : '<p class="text-sm text-gray-400 border-t pt-4"><a href="javascript:void(0)" onclick="navigate(\'login\')" class="text-blue-600 underline">Login</a> untuk membalas.</p>'}
      </div>`;
    container.scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast(e.message, 'error'); }
}

async function replyThread(e, threadId) {
  e.preventDefault();
  try {
    await api(`/forum/threads/${threadId}/reply`, { method: 'POST', body: { isi: e.target.isi.value }});
    showToast('Balasan berhasil dikirim!');
    viewThread(threadId);
  } catch (e) { showToast(e.message, 'error'); }
}

// === PAGE: PENGUMUMAN ===
async function renderPengumuman() {
  let pengumumanList = [];
  try { const res = await api('/pengumuman'); pengumumanList = res.data || []; } catch(e) {}

  return `
  <div class="fade-in max-w-4xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-bullhorn text-yellow-500 mr-2"></i>Pengumuman</h1>
        <p class="text-gray-500 text-sm mt-1">Informasi dan jadwal kegiatan KKG</p>
      </div>
      ${state.user?.role === 'admin' ? `<button onclick="showAddPengumuman()" class="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"><i class="fas fa-plus mr-1"></i>Buat Pengumuman</button>` : ''}
    </div>

    <div id="add-pengumuman-modal" class="hidden mb-6"></div>

    <div class="space-y-4">
      ${pengumumanList.length > 0 ? pengumumanList.map(p => `
        <div class="bg-white rounded-xl p-6 border hover:border-yellow-200 transition shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            ${p.is_pinned ? '<span class="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium"><i class="fas fa-thumbtack mr-1"></i>Disematkan</span>' : ''}
            <span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">${escapeHtml(p.kategori || 'umum')}</span>
          </div>
          <h2 class="font-bold text-gray-800 text-xl mb-3">${escapeHtml(p.judul)}</h2>
          <div class="text-gray-600 leading-relaxed text-sm">${nl2br(p.isi)}</div>
          <div class="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
            <span><i class="fas fa-user mr-1"></i>${escapeHtml(p.author_name || '-')}</span>
            <span><i class="fas fa-clock mr-1"></i>${formatDateTime(p.created_at)}</span>
          </div>
        </div>
      `).join('') : '<div class="text-center py-12 text-gray-400"><i class="fas fa-bullhorn text-4xl mb-4 block"></i>Belum ada pengumuman.</div>'}
    </div>
  </div>`;
}

function showAddPengumuman() {
  const container = document.getElementById('add-pengumuman-modal');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-yellow-200">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-plus-circle text-yellow-500 mr-2"></i>Buat Pengumuman Baru</h3>
      <form onsubmit="addPengumuman(event)">
        <input type="text" name="judul" required placeholder="Judul Pengumuman" class="w-full px-4 py-3 border rounded-xl mb-3">
        <div class="grid grid-cols-2 gap-3 mb-3">
          <select name="kategori" class="px-4 py-3 border rounded-xl">
            <option value="umum">Umum</option><option value="jadwal">Jadwal</option><option value="kegiatan">Kegiatan</option><option value="penting">Penting</option>
          </select>
          <label class="flex items-center px-4 py-3 border rounded-xl"><input type="checkbox" name="is_pinned" class="mr-2"> Sematkan</label>
        </div>
        <textarea name="isi" required rows="5" placeholder="Isi pengumuman..." class="w-full px-4 py-3 border rounded-xl mb-3"></textarea>
        <div class="flex gap-2">
          <button type="submit" class="px-6 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600">Posting</button>
          <button type="button" onclick="document.getElementById('add-pengumuman-modal').classList.add('hidden')" class="px-6 py-2 bg-gray-200 rounded-lg font-medium">Batal</button>
        </div>
      </form>
    </div>`;
}

async function addPengumuman(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/pengumuman', { method: 'POST', body: {
      judul: form.judul.value, isi: form.isi.value, kategori: form.kategori.value, is_pinned: form.is_pinned.checked,
    }});
    showToast('Pengumuman berhasil dibuat!');
    render();
  } catch (e) { showToast(e.message, 'error'); }
}

// === PAGE: ADMIN ===
async function renderAdmin() {
  if (!state.user || state.user.role !== 'admin') {
    return '<div class="max-w-4xl mx-auto py-12 px-4 text-center text-red-500"><i class="fas fa-lock text-4xl mb-4 block"></i><p class="text-xl font-bold">Akses Ditolak</p><p>Halaman ini hanya untuk admin.</p></div>';
  }

  let stats = {}, settings = {}, users = [];
  try { const r = await api('/admin/dashboard'); stats = r.data; } catch(e) {}
  try { const r = await api('/admin/settings'); settings = r.data; } catch(e) {}
  try { const r = await api('/admin/users'); users = r.data || []; } catch(e) {}

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

async function saveSettings(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await api('/admin/settings', { method: 'PUT', body: {
      mistral_api_key: form.mistral_api_key.value,
      nama_ketua: form.nama_ketua.value,
      tahun_ajaran: form.tahun_ajaran.value,
      alamat_sekretariat: form.alamat_sekretariat.value,
    }});
    showToast('Pengaturan berhasil disimpan!');
  } catch (e) { showToast(e.message, 'error'); }
}

async function toggleRole(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  if (!confirm(`Ubah role menjadi ${newRole}?`)) return;
  try {
    await api(`/guru/${userId}/role`, { method: 'PUT', body: { role: newRole }});
    showToast('Role berhasil diubah!');
    render();
  } catch (e) { showToast(e.message, 'error'); }
}

async function resetUserPassword(userId) {
  const newPw = prompt('Masukkan password baru (min. 6 karakter):');
  if (!newPw || newPw.length < 6) { showToast('Password minimal 6 karakter', 'error'); return; }
  try {
    await api(`/admin/users/${userId}/reset-password`, { method: 'POST', body: { new_password: newPw }});
    showToast('Password berhasil direset!');
  } catch (e) { showToast(e.message, 'error'); }
}

// === DB INIT ===
async function initDb() {
  try {
    const res = await api('/init-db');
    showToast(res.message || 'Database berhasil diinisialisasi!');
    render();
  } catch (e) { showToast(e.message, 'error'); }
}

// === MAIN RENDER ===
async function render() {
  const app = document.getElementById('app');
  let content = '';

  switch (state.currentPage) {
    case 'home': content = await renderHome(); break;
    case 'login': content = renderLogin(); break;
    case 'surat': content = renderSurat(); break;
    case 'proker': content = renderProker(); break;
    case 'absensi': content = await renderAbsensi(); break;
    case 'materi': content = await renderMateri(); break;
    case 'guru': content = await renderGuru(); break;
    case 'forum': content = await renderForum(); break;
    case 'pengumuman': content = await renderPengumuman(); break;
    case 'admin': content = await renderAdmin(); break;
    default: content = await renderHome(); break;
  }

  app.innerHTML = renderNavbar() + `<main class="min-h-screen">${content}</main>` + renderFooter();
}

// === INITIALIZE ===
async function init() {
  // Check session
  try {
    const res = await api('/auth/me');
    if (res.user) state.user = res.user;
  } catch (e) {}

  // Parse URL
  const path = window.location.pathname.slice(1) || 'home';
  state.currentPage = path;

  render();
}

// Start app
init();
