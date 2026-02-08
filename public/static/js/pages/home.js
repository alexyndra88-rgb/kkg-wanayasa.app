
import { api } from '../api.js';
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
            { id: 'surat', icon: 'fa-envelope', color: 'bg-blue-500', label: 'Generator Surat' },
            { id: 'proker', icon: 'fa-clipboard-list', color: 'bg-green-500', label: 'Program Kerja' },
            { id: 'absensi', icon: 'fa-calendar-check', color: 'bg-purple-500', label: 'Absensi Digital' },
            { id: 'materi', icon: 'fa-book', color: 'bg-orange-500', label: 'Repository Materi' },
            { id: 'guru', icon: 'fa-users', color: 'bg-teal-500', label: 'Direktori Guru' },
            { id: 'forum', icon: 'fa-comments', color: 'bg-pink-500', label: 'Forum Diskusi' },
            { id: 'pengumuman', icon: 'fa-bullhorn', color: 'bg-yellow-500', label: 'Pengumuman' },
            { id: 'login', icon: 'fa-user-shield', color: 'bg-gray-600', label: 'Profil / Login' },
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
