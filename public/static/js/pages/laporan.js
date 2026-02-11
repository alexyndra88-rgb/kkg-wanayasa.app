import { api } from '../api.js';
import { showToast, showLoading, hideLoading, confirm } from '../utils.js';
import { state } from '../state.js';

let laporanList = [];
let currentLaporan = null;
let isGenerating = false;

// Main Render Function
export async function renderLaporan() {
    // 1. Fetch data
    try {
        const res = await api('/laporan');
        if (res.success) {
            laporanList = res.data;
        }
    } catch (e) {
        console.error('Error fetching laporan:', e);
        showToast('Gagal memuat data laporan', 'error');
    }

    // 2. Return HTML template
    return `
    <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Laporan Kegiatan KKG
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-2">Kelola dan buat laporan pertanggungjawaban kegiatan secara profesional.</p>
            </div>
            <button onclick="openLaporanModal()" class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
                <i class="fas fa-plus"></i> Buat Laporan Baru
            </button>
        </div>

        <!-- Laporan Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="laporan-grid">
            ${renderLaporanGrid()}
        </div>

        <!-- Modal Form (Full Screen / Two Column) -->
        <div id="laporanModal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-center justify-center min-h-screen px-4 pb-4 pt-4 text-center sm:block sm:p-0 h-full">
                <!-- Overlay (Click listener REMOVED to prevent accidental close) -->
                <div class="fixed inset-0 bg-gray-900 bg-opacity-90 transition-opacity backdrop-blur-sm" aria-hidden="true"></div>
                
                <!-- Modal Panel -->
                <div class="inline-block align-middle bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-4 w-full max-w-[95vw] h-[92vh] flex flex-col border border-gray-200 dark:border-gray-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    
                    <!-- 1. Header (Fixed) -->
                    <div class="bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-20 shadow-sm shrink-0">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <i class="fas fa-file-signature text-blue-600 dark:text-blue-400 text-lg"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">Editor Laporan</h3>
                                <p class="text-xs text-gray-500">Edit dan pratinjau konten laporan Anda</p>
                            </div>
                        </div>
                        <button onclick="closeLaporanModal()" class="group p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Tutup Tanpa Simpan">
                            <i class="fas fa-times text-gray-400 group-hover:text-red-500 text-xl transition-colors"></i>
                        </button>
                    </div>

                    <!-- 2. Main Body (Split View) -->
                    <div class="flex flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
                        
                        <!-- Left Sidebar (Navigation) -->
                        <div class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 overflow-y-auto hidden md:flex">
                            <div class="p-4 space-y-1">
                                <button onclick="switchTab('umum')" id="tab-umum" class="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 tab-btn bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    <i class="fas fa-info-circle"></i>
                                    <span>Data Umum</span>
                                </button>
                                <button onclick="switchTab('bab1')" id="tab-bab1" class="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-3 tab-btn">
                                    <i class="fas fa-book-open"></i>
                                    <span>BAB I & II</span>
                                </button>
                                <button onclick="switchTab('bab2')" id="tab-bab2" class="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-3 tab-btn">
                                    <i class="fas fa-chart-line"></i>
                                    <span>BAB III & IV</span>
                                </button>
                                <button onclick="switchTab('lampiran')" id="tab-lampiran" class="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-3 tab-btn">
                                    <i class="fas fa-images"></i>
                                    <span>Lampiran Foto</span>
                                </button>
                            </div>
                            
                            <div class="mt-auto p-4 border-t border-gray-100 dark:border-gray-700">
                                <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                    <h4 class="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">Tips Editor</h4>
                                    <p class="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">
                                        Gunakan fitur 'Generate AI' di menu Data Umum untuk membuat draft awal, lalu edit detailnya disini.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Mobile Tab Navigation (Visible only on small screens) -->
                        <div class="md:hidden w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 absolute top-0 z-10 flex overflow-x-auto">
                             <button onclick="switchTab('umum')" class="flex-1 py-3 text-center text-xs font-medium border-b-2 tab-btn-mobile">Umum</button>
                             <button onclick="switchTab('bab1')" class="flex-1 py-3 text-center text-xs font-medium border-b-2 tab-btn-mobile">BAB 1-2</button>
                             <button onclick="switchTab('bab2')" class="flex-1 py-3 text-center text-xs font-medium border-b-2 tab-btn-mobile">BAB 3-4</button>
                             <button onclick="switchTab('lampiran')" class="flex-1 py-3 text-center text-xs font-medium border-b-2 tab-btn-mobile">Foto</button>
                        </div>

                        <!-- Right Content (Form Area) -->
                        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 scroll-smooth mt-10 md:mt-0" id="scrollContainer">
                            <form id="laporanForm" onsubmit="event.preventDefault(); saveLaporan();" class="max-w-4xl mx-auto space-y-8">
                                <input type="hidden" id="laporanId">

                                <!-- TAB: DATA UMUM -->
                                <div id="content-umum" class="tab-content animate-fade-in">
                                    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                                        <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                            <i class="fas fa-database text-blue-500"></i> Informasi Dasar
                                        </h4>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div class="col-span-2">
                                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Judul Laporan</label>
                                                <input type="text" id="judul_laporan" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all" required placeholder="Contoh: Laporan Kegiatan KKG Bulan Februari 2026">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Periode / Tanggal</label>
                                                <input type="text" id="periode" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all" required placeholder="Contoh: 14 Februari 2026">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tema / Topik</label>
                                                <input type="text" id="tema" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all" placeholder="Contoh: Peningkatan Literasi Digital">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Narasumber</label>
                                                <input type="text" id="narasumber" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all" placeholder="Nama Narasumber">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tempat</label>
                                                <input type="text" id="tempat" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all" placeholder="Lokasi Kegiatan">
                                            </div>
                                        </div>
                                    </div>

                                    <!-- AI Generator -->
                                    <div class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                                        <div class="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                                        <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                            <div class="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20">
                                                <i class="fas fa-robot text-4xl"></i>
                                            </div>
                                            <div class="flex-1 text-center md:text-left">
                                                <h4 class="text-xl font-bold mb-2">AI Content Generator</h4>
                                                <p class="text-indigo-100 text-sm mb-0">Biarkan AI menyusun draft lengkap laporan Anda berdasarkan data di atas. Hemat waktu hingga 90%.</p>
                                            </div>
                                            <button type="button" onclick="generateAIContent()" id="btn-ai" class="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
                                                <i class="fas fa-magic"></i> Generate Draft
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- TAB: BAB I & II -->
                                <div id="content-bab1" class="tab-content hidden animate-fade-in space-y-8">
                                    <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
                                        <div class="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl"></div>
                                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">BAB I: PENDAHULUAN</h4>
                                        <div class="space-y-6">
                                            <div class="space-y-2">
                                                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">A. Latar Belakang</label>
                                                <textarea id="pendahuluan_latar_belakang" rows="12" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white leading-relaxed text-sm"></textarea>
                                            </div>
                                            <div class="grid grid-cols-1 gap-6">
                                                <div class="space-y-2">
                                                    <label class="text-sm font-bold text-gray-700 dark:text-gray-300">B. Tujuan</label>
                                                    <textarea id="pendahuluan_tujuan" rows="5" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white leading-relaxed text-sm"></textarea>
                                                </div>
                                                <div class="space-y-2">
                                                    <label class="text-sm font-bold text-gray-700 dark:text-gray-300">C. Manfaat</label>
                                                    <textarea id="pendahuluan_manfaat" rows="5" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white leading-relaxed text-sm"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
                                        <div class="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-2xl"></div>
                                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">BAB II: PELAKSANAAN</h4>
                                        <div class="space-y-6">
                                            <div class="space-y-2">
                                                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">A. Waktu dan Tempat</label>
                                                <textarea id="pelaksanaan_waktu_tempat" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white leading-relaxed text-sm"></textarea>
                                            </div>
                                            <div class="space-y-2">
                                                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">B. Materi Kegiatan</label>
                                                <textarea id="pelaksanaan_materi" rows="10" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white leading-relaxed text-sm"></textarea>
                                            </div>
                                            <div class="space-y-2">
                                                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">C. Narasumber & Peserta</label>
                                                <textarea id="pelaksanaan_peserta" rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white leading-relaxed text-sm"></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- TAB: BAB III & IV -->
                                <div id="content-bab2" class="tab-content hidden animate-fade-in space-y-8">
                                    <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
                                        <div class="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-2xl"></div>
                                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">BAB III: HASIL KEGIATAN</h4>
                                        <div class="space-y-6">
                                            <div class="space-y-2">
                                                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">A. Uraian Jalannya Kegiatan</label>
                                                <textarea id="hasil_uraian" rows="15" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white leading-relaxed text-sm font-mono bg-gray-50 dark:bg-gray-900/50"></textarea>
                                            </div>
                                            <div class="grid grid-cols-1 gap-6">
                                                <div class="space-y-2">
                                                    <label class="text-sm font-bold text-gray-700 dark:text-gray-300">B. Tindak Lanjut</label>
                                                    <textarea id="hasil_tindak_lanjut" rows="5" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white leading-relaxed text-sm"></textarea>
                                                </div>
                                                <div class="space-y-2">
                                                    <label class="text-sm font-bold text-gray-700 dark:text-gray-300">C. Dampak</label>
                                                    <textarea id="hasil_dampak" rows="5" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white leading-relaxed text-sm"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
                                        <div class="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-2xl"></div>
                                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">BAB IV: PENUTUP</h4>
                                        <div class="space-y-6">
                                            <div class="space-y-2">
                                                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">A. Simpulan</label>
                                                <textarea id="penutup_simpulan" rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white leading-relaxed text-sm"></textarea>
                                            </div>
                                            <div class="space-y-2">
                                                <label class="text-sm font-bold text-gray-700 dark:text-gray-300">B. Saran</label>
                                                <textarea id="penutup_saran" rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white leading-relaxed text-sm"></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- TAB: LAMPIRAN -->
                                <div id="content-lampiran" class="tab-content hidden animate-fade-in">
                                    <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                            <i class="fas fa-camera text-pink-500"></i> Dokumentasi Kegiatan
                                        </h4>
                                        <div id="foto-container" class="space-y-4 mb-6"></div>
                                        <button type="button" onclick="addFotoInput()" class="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2 group">
                                            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 flex items-center justify-center transition-colors">
                                                <i class="fas fa-plus"></i>
                                            </div>
                                            <span class="font-medium">Tambah Foto / Dokumentasi Lainnya</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                            
                            <!-- Spacer for footer -->
                            <div class="h-20"></div>
                        </div>
                    </div>

                    <!-- 3. Footer (Fixed) -->
                    <div class="bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center z-20 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                        <div class="text-xs text-gray-500 hidden md:block">
                            <i class="fas fa-save mr-1"></i> Perubahan terakhir disimpan otomatis (draft)
                        </div>
                        <div class="flex gap-3 w-full md:w-auto justify-end">
                            <button onclick="closeLaporanModal()" class="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95">
                                Batal
                            </button>
                            <button onclick="saveLaporan('draft')" class="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2">
                                <i class="fas fa-file-invoice"></i> Simpan Draft
                            </button>
                            <button onclick="saveLaporan('final')" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2">
                                <i class="fas fa-check-circle"></i> Simpan Final
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

// --- Helper Functions attached to Window ---

function renderLaporanGrid() {
    if (laporanList.length === 0) {
        return `
        <div class="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-file-alt text-2xl text-gray-400"></i>
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Belum ada laporan</h3>
            <p class="text-gray-500 mb-4">Mulai buat laporan kegiatan pertama Anda sekarang.</p>
        </div>
        `;
    }

    return laporanList.map(item => `
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <i class="fas fa-file-contract text-blue-600 dark:text-blue-400 text-xl"></i>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-medium ${item.status === 'final' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                    ${item.status === 'final' ? 'Final' : 'Draft'}
                </span>
            </div>
            <h3 class="font-bold text-lg mb-2 text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">${item.judul_laporan}</h3>
            <p class="text-gray-500 text-sm mb-4"><i class="far fa-calendar-alt mr-1"></i> ${item.periode}</p>
            
            <div class="flex gap-2 border-t pt-4 border-gray-100 dark:border-gray-700">
                <button onclick="downloadLaporanDocx(${item.id})" class="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                    <i class="fas fa-download mr-1"></i> DOCX
                </button>
                <button onclick="editLaporan(${item.id})" class="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Edit">
                    <i class="fas fa-pen"></i>
                </button>
                <button onclick="deleteLaporan(${item.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Window functions for interactivity
window.openLaporanModal = () => {
    currentLaporan = null;
    document.getElementById('laporanId').value = '';
    document.getElementById('laporanForm').reset();
    document.getElementById('foto-container').innerHTML = '';
    addFotoInput(); // Add one empty input

    // Switch to first tab
    switchTab('umum');

    document.getElementById('laporanModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

window.closeLaporanModal = () => {
    document.getElementById('laporanModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
};

window.switchTab = (tabName) => {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));

    // Show active content
    const content = document.getElementById(`content-${tabName}`);
    if (content) {
        content.classList.remove('hidden');
        // Scroll to top of content container when switching
        const container = document.getElementById('scrollContainer');
        if (container) container.scrollTop = 0;
    }

    // Reset tabs styles
    document.querySelectorAll('.tab-btn').forEach(btn => {
        // Remove active styles
        btn.classList.remove('bg-blue-50', 'text-blue-700', 'dark:bg-blue-900/30', 'dark:text-blue-400');
        // Add inactive styles
        btn.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-50', 'dark:hover:bg-gray-700');
    });

    // Set active tab style
    const activeBtn = document.getElementById(`tab-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-50', 'dark:hover:bg-gray-700');
        activeBtn.classList.add('bg-blue-50', 'text-blue-700', 'dark:bg-blue-900/30', 'dark:text-blue-400');
    }
};


window.addFotoInput = (value = '') => {
    const container = document.getElementById('foto-container');
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-start mb-3';
    div.innerHTML = `
        <div class="flex-1">
            <div class="flex gap-2">
                <input type="text" name="lampiran_foto[]" value="${value}" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="URL Foto (atau upload file)">
                
                <label class="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors" title="Upload Foto">
                    <i class="fas fa-upload"></i>
                    <input type="file" class="hidden" accept="image/*" onchange="uploadFotoLaporan(this)">
                </label>
            </div>
            ${value ? `<div class="mt-1"><img src="${value}" class="h-16 w-auto rounded border border-gray-200 dark:border-gray-700 object-cover"></div>` : '<div class="preview-area mt-1 hidden"></div>'}
        </div>
        <button type="button" onclick="this.closest('.flex').remove()" class="text-red-500 hover:text-red-700 p-2 self-start mt-1" title="Hapus"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
};

window.uploadFotoLaporan = async (input) => {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const parentRow = input.closest('.flex-1');
    const urlInput = parentRow.querySelector('input[type="text"]');
    const previewArea = parentRow.querySelector('.preview-area');
    const uploadBtnIcon = input.parentElement.querySelector('i');

    // Show validation
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Ukuran file terlalu besar (max 5MB)', 'error');
        input.value = '';
        return;
    }

    // Set loading state
    const originalIcon = uploadBtnIcon.className;
    uploadBtnIcon.className = 'fas fa-circle-notch fa-spin';
    parentRow.classList.add('opacity-70', 'pointer-events-none');

    const formData = new FormData();
    formData.append('file', file);

    try {
        // Use existing file upload endpoint
        const res = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData,
            // Don't set Content-Type header manually, let browser set boundary
        });

        const data = await res.json();

        if (res.ok && data.success) {
            // Success
            urlInput.value = data.data.url;
            showToast('Foto berhasil diupload', 'success');

            // Show preview
            if (previewArea) {
                previewArea.innerHTML = `<img src="${data.data.url}" class="h-16 w-auto rounded border border-gray-200 dark:border-gray-700 object-cover">`;
                previewArea.classList.remove('hidden');
            }
        } else {
            throw new Error(data.error?.message || 'Gagal upload file');
        }
    } catch (e) {
        console.error('Upload Error:', e);
        showToast(e.message, 'error');
    } finally {
        // Reset state
        uploadBtnIcon.className = originalIcon;
        parentRow.classList.remove('opacity-70', 'pointer-events-none');
        input.value = ''; // Reset input so same file can be selected again if needed
    }
};


window.generateAIContent = async () => {
    const judul = document.getElementById('judul_laporan').value;
    const periode = document.getElementById('periode').value;

    if (!judul || !periode) {
        showToast('Mohon isi Judul Laporan dan Periode terlebih dahulu.', 'warning');
        return;
    }

    const btn = document.getElementById('btn-ai');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sedang Membuat...';
    btn.disabled = true;

    try {
        const res = await api('/laporan/generate-content', {
            method: 'POST',
            body: {
                judul_laporan: judul,
                periode: periode,
                tema: document.getElementById('tema').value,
                narasumber: document.getElementById('narasumber').value,
                tempat: document.getElementById('tempat').value
            }
        });

        if (res.success && res.data) {
            const d = res.data;
            // Fill fields
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val || '';
            };

            setVal('pendahuluan_latar_belakang', d.pendahuluan_latar_belakang);
            setVal('pendahuluan_tujuan', d.pendahuluan_tujuan);
            setVal('pendahuluan_manfaat', d.pendahuluan_manfaat);
            setVal('pelaksanaan_waktu_tempat', d.pelaksanaan_waktu_tempat);
            setVal('pelaksanaan_materi', d.pelaksanaan_materi);
            setVal('pelaksanaan_peserta', d.pelaksanaan_peserta);
            setVal('hasil_uraian', d.hasil_uraian);
            setVal('hasil_tindak_lanjut', d.hasil_tindak_lanjut);
            setVal('hasil_dampak', d.hasil_dampak);
            setVal('penutup_simpulan', d.penutup_simpulan);
            setVal('penutup_saran', d.penutup_saran);

            showToast('Konten berhasil dibuat oleh AI!', 'success');
            window.switchTab('bab1'); // Move to review
        }
    } catch (e) {
        console.error('AI Generation Error:', e);
        // Show detailed error in alert/toast
        const msg = e.message || JSON.stringify(e);
        alert(`Gagal generate AI:\n${msg}`);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

window.saveLaporan = async (status = 'draft') => {
    const id = document.getElementById('laporanId').value;

    // Collect data
    const getVal = (id) => document.getElementById(id)?.value || '';
    const fotoInputs = document.querySelectorAll('input[name="lampiran_foto[]"]');
    const fotos = Array.from(fotoInputs).map(i => i.value).filter(v => v.trim() !== '');

    const data = {
        judul_laporan: getVal('judul_laporan'),
        periode: getVal('periode'),
        pendahuluan_latar_belakang: getVal('pendahuluan_latar_belakang'),
        pendahuluan_tujuan: getVal('pendahuluan_tujuan'),
        pendahuluan_manfaat: getVal('pendahuluan_manfaat'),
        pelaksanaan_waktu_tempat: getVal('pelaksanaan_waktu_tempat'),
        pelaksanaan_materi: getVal('pelaksanaan_materi'),
        pelaksanaan_peserta: getVal('pelaksanaan_peserta'),
        hasil_uraian: getVal('hasil_uraian'),
        hasil_tindak_lanjut: getVal('hasil_tindak_lanjut'),
        hasil_dampak: getVal('hasil_dampak'),
        penutup_simpulan: getVal('penutup_simpulan'),
        penutup_saran: getVal('penutup_saran'),
        lampiran_foto: fotos,
        status: status
    };

    if (!data.judul_laporan) {
        showToast('Judul laporan wajib diisi', 'warning');
        return;
    }

    try {
        const url = id ? `/laporan/${id}` : '/laporan';
        const method = id ? 'PUT' : 'POST';

        const res = await api(url, { method, body: data });
        if (res.success) {
            showToast('Laporan berhasil disimpan!', 'success');
            closeLaporanModal();
            // Refresh list
            const pageRes = await api('/laporan');
            if (pageRes.success) {
                laporanList = pageRes.data;
                document.getElementById('laporan-grid').innerHTML = renderLaporanGrid();
            }
        }
    } catch (e) {
        showToast('Gagal menyimpan: ' + e.message, 'error');
    }
};

window.editLaporan = async (id) => {
    const item = laporanList.find(i => i.id === id);
    if (!item) return;

    openLaporanModal();
    document.getElementById('laporanId').value = item.id;

    // Fill fields
    const setVal = (id, val) => document.getElementById(id).value = val || '';
    setVal('judul_laporan', item.judul_laporan);
    setVal('periode', item.periode);
    setVal('pendahuluan_latar_belakang', item.pendahuluan_latar_belakang);
    setVal('pendahuluan_tujuan', item.pendahuluan_tujuan);
    setVal('pendahuluan_manfaat', item.pendahuluan_manfaat);
    setVal('pelaksanaan_waktu_tempat', item.pelaksanaan_waktu_tempat);
    setVal('pelaksanaan_materi', item.pelaksanaan_materi);
    setVal('pelaksanaan_peserta', item.pelaksanaan_peserta);
    setVal('hasil_uraian', item.hasil_uraian);
    setVal('hasil_tindak_lanjut', item.hasil_tindak_lanjut);
    setVal('hasil_dampak', item.hasil_dampak);
    setVal('penutup_simpulan', item.penutup_simpulan);
    setVal('penutup_saran', item.penutup_saran);

    // Photos
    document.getElementById('foto-container').innerHTML = '';
    if (item.lampiran_foto && item.lampiran_foto.length > 0) {
        item.lampiran_foto.forEach(url => addFotoInput(url));
    } else {
        addFotoInput();
    }
};

window.deleteLaporan = async (id) => {
    if (!await confirm('Hapus laporan ini permanen?')) return;
    try {
        await api(`/laporan/${id}`, { method: 'DELETE' });
        showToast('Laporan dihapus', 'success');
        // Refresh
        laporanList = laporanList.filter(i => i.id !== id);
        document.getElementById('laporan-grid').innerHTML = renderLaporanGrid();
    } catch (e) {
        showToast('Gagal hapus: ' + e.message, 'error');
    }
};

// Download DOCX
window.downloadLaporanDocx = (id) => {
    // Direct link to download
    window.location.href = `/api/laporan/${id}/docx`;
};
