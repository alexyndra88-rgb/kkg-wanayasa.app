import { api } from '../api.js';
import { state } from '../state.js';
import { navigate } from '../router.js';
import { formatDateTime, escapeHtml } from '../utils.js';

export async function renderHome() {
  let pengumuman = [];
  try {
    const res = await api('/pengumuman?limit=5');
    pengumuman = res.data || [];
  } catch (e) { console.log('Pengumuman not loaded:', e); }

  return `
  <div class="fade-in">
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-blue-900 to-emerald-900 text-white py-20 md:py-32 relative overflow-hidden">
      <!-- Decor & Shapes -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500 opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div class="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500 opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 mix-blend-overlay"></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 relative z-10 text-center">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium text-emerald-100 border border-white/10 mb-8 shadow-lg">
          <i class="fas fa-map-marker-alt text-emerald-400"></i>
          <span>Kabupaten Purwakarta, Jawa Barat</span>
        </div>
        
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold mb-6 leading-tight tracking-tight drop-shadow-sm">
          Portal Digital<br>
          <span class="text-white">KKG Gugus 3 Wanayasa</span>
        </h1>
        
        <p class="text-lg md:text-xl text-emerald-50 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Platform kolaborasi digital untuk Kelompok Kerja Guru Gugus 3 Kecamatan Wanayasa. Bersama memajukan mutu pendidikan.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          ${state.user ? `
          <button onclick="navigate('surat')" class="btn bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 text-lg shadow-xl shadow-emerald-900/20 hover:scale-105 transition-transform duration-300 border border-emerald-400/20 rounded-xl font-bold">
            <i class="fas fa-envelope mr-3"></i>Buat Surat Undangan
          </button>
          <button onclick="navigate('proker')" class="btn bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm px-8 py-3 text-lg transition-all duration-300 rounded-xl font-medium">
            <i class="fas fa-file-alt mr-3"></i>Buat Program Kerja
          </button>
          ` : `
          <button onclick="navigate('login')" class="btn bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 text-lg shadow-xl shadow-emerald-900/20 font-bold border-none rounded-xl">
            <i class="fas fa-sign-in-alt mr-3"></i>Masuk Portal
          </button>
          <button onclick="navigate('pengumuman')" class="btn bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm px-8 py-3 text-lg transition-all duration-300 rounded-xl">
            <i class="fas fa-bullhorn mr-3"></i>Lihat Pengumuman
          </button>
          `}
        </div>
      </div>
    </section>

    <!-- Stats / Vision Grid -->
    <section class="py-16 md:py-24 -mt-10 relative z-20 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="grid md:grid-cols-2 gap-8">
           <!-- Card Visi -->
           <div class="gradient-card p-8 md:p-10 rounded-3xl shadow-xl card-hover relative overflow-hidden group">
              <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <i class="fas fa-eye text-9xl"></i>
              </div>
              <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <i class="fas fa-eye text-3xl"></i>
              </div>
              <h3 class="text-2xl font-display font-bold text-[var(--color-text-primary)] mb-4">Visi Kami</h3>
              <p class="text-[var(--color-text-secondary)] leading-relaxed text-lg">
                Mewujudkan komunitas guru yang <span class="text-primary-600 font-semibold">Inovatif</span>, <span class="text-primary-600 font-semibold">Profesional</span>, dan berdaya saing global melalui kolaborasi digital yang berkelanjutan.
              </p>
           </div>
           
           <!-- Card Misi -->
           <div class="gradient-card p-8 md:p-10 rounded-3xl shadow-xl card-hover relative overflow-hidden group">
              <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <i class="fas fa-bullseye text-9xl"></i>
              </div>
              <div class="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <i class="fas fa-rocket text-3xl"></i>
              </div>
              <h3 class="text-2xl font-display font-bold text-[var(--color-text-primary)] mb-4">Misi Utama</h3>
              <ul class="space-y-3 text-[var(--color-text-secondary)]">
                <li class="flex items-start"><i class="fas fa-check-circle text-green-500 mt-1 mr-3 flex-shrink-0"></i><span>Meningkatkan kompetensi melalui <strong>Workshop & Pelatihan</strong>.</span></li>
                <li class="flex items-start"><i class="fas fa-check-circle text-green-500 mt-1 mr-3 flex-shrink-0"></i><span>Memfasilitasi <strong>Sharing Best Practice</strong> antar guru.</span></li>
                <li class="flex items-start"><i class="fas fa-check-circle text-green-500 mt-1 mr-3 flex-shrink-0"></i><span>Implementasi <strong>Kurikulum Merdeka</strong> berbasis digital.</span></li>
              </ul>
           </div>
        </div>
      </div>
    </section>
    
    <!-- Quick Access Grid -->
    <section class="py-12 px-4">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-10">
          <h2 class="text-3xl font-display font-bold text-[var(--color-text-primary)]">
            <span class="text-gradient">Akses Cepat</span>
          </h2>
          <div class="h-1 flex-1 bg-[var(--color-border-default)] ml-6 rounded-full opacity-50 hidden sm:block"></div>
        </div>
        
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
          ${[
      { id: 'surat', icon: 'fa-magic', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20', label: 'Generator Surat', desc: 'Buat surat resmi instan' },
      { id: 'proker', icon: 'fa-tasks', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20', label: 'Program Kerja', desc: 'Manajemen kegiatan' },
      { id: 'absensi', icon: 'fa-user-check', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20', label: 'Absensi Digital', desc: 'Rekap kehadiran' },
      { id: 'materi', icon: 'fa-book-reader', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20', label: 'E-Library', desc: 'Sumber belajar' },
      { id: 'guru', icon: 'fa-chalkboard-teacher', color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/20', label: 'Data Guru', desc: 'Direktori anggota' },
      { id: 'forum', icon: 'fa-comments', color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/20', label: 'Forum Diskusi', desc: 'Ruang kolaborasi' },
      { id: 'kalender', icon: 'fa-calendar-alt', color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/20', label: 'Agenda KKG', desc: 'Jadwal kegiatan' },
      { id: 'laporan', icon: 'fa-file-signature', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20', label: 'Laporan', desc: 'Arsip dokumen', admin: true },
    ].filter(item => !item.admin || (state.user && state.user.role === 'admin')).map(item => `
            <button onclick="navigate('${item.id}')" class="group bg-[var(--color-bg-elevated)] p-6 rounded-2xl border border-[var(--color-border-subtle)] text-left hover:border-primary-400 transition-all duration-300 hover:shadow-lg card-hover">
              <div class="w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <i class="fas ${item.icon} text-xl"></i>
              </div>
              <h3 class="font-bold text-[var(--color-text-primary)] mb-1 group-hover:text-primary-600 transition-colors">${item.label}</h3>
              <p class="text-sm text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors">${item.desc}</p>
            </button>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Latest Announcements -->
    <section class="py-16 bg-[var(--color-bg-tertiary)]/50">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between items-end mb-8">
          <div>
            <h2 class="text-3xl font-display font-bold text-[var(--color-text-primary)] mb-2">Papan Pengumuman</h2>
            <p class="text-[var(--color-text-secondary)]">Informasi terbaru seputar kegiatan KKG</p>
          </div>
          <button onclick="navigate('pengumuman')" class="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-2 group">
            Lihat Semua <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${pengumuman.length > 0 ? pengumuman.map(p => `
            <div class="bg-[var(--color-bg-elevated)] rounded-2xl p-6 border border-[var(--color-border-subtle)] hover:border-primary-300 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group flex flex-col h-full" onclick="navigate('pengumuman')">
              <div class="flex items-center gap-2 mb-4">
                 ${p.is_pinned ? '<span class="px-2.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full font-bold uppercase tracking-wider"><i class="fas fa-thumbtack mr-1"></i>Penting</span>' : ''}
                 <span class="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full font-bold uppercase tracking-wider">${escapeHtml(p.kategori || 'umum')}</span>
              </div>
              
              <h3 class="font-bold text-lg text-[var(--color-text-primary)] mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">${escapeHtml(p.judul)}</h3>
              <p class="text-[var(--color-text-secondary)] text-sm line-clamp-3 mb-4 flex-1">${escapeHtml((p.isi || '').substring(0, 150))}</p>
              
              <div class="flex items-center text-xs text-[var(--color-text-tertiary)] pt-4 border-t border-[var(--color-border-subtle)] mt-auto">
                <i class="far fa-clock mr-2"></i>
                ${formatDateTime(p.created_at)}
              </div>
            </div>
          `).join('') : `
            <div class="col-span-full py-12 text-center rounded-3xl border-2 border-dashed border-[var(--color-border-default)]">
               <div class="w-16 h-16 bg-[var(--color-bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--color-text-tertiary)]">
                 <i class="far fa-newspaper text-2xl"></i>
               </div>
               <p class="text-[var(--color-text-secondary)] font-medium">Belum ada pengumuman terbaru</p>
               <button onclick="initDb()" class="text-primary-600 hover:text-primary-700 text-sm mt-2 font-medium">Refresh Database</button>
            </div>
          `}
        </div>
      </div>
    </section>
  </div>`;
}
