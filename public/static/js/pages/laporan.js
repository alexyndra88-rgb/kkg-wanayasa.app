
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

        <!-- Modal Form -->
        <div id="laporanModal" class="fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick="closeLaporanModal()"></div>
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-100 dark:border-gray-700">
                    
                    <!-- Modal Header -->
                    <div class="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 class="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                            Formulir Laporan Kegiatan
                        </h3>
                        <button onclick="closeLaporanModal()" class="text-gray-400 hover:text-gray-500 focus:outline-none">
                            <span class="sr-only">Close</span>
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <!-- Modal Body (Wizard) -->
                    <div class="px-6 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        
                        <!-- Tabs -->
                        <div class="flex border-b border-gray-200 dark:border-gray-700 mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10 pt-2">
                            <button onclick="switchTab('umum')" id="tab-umum" class="tab-btn px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium text-sm focus:outline-none">Data Umum</button>
                            <button onclick="switchTab('bab1')" id="tab-bab1" class="tab-btn px-4 py-2 text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-medium text-sm focus:outline-none">BAB I & II</button>
                            <button onclick="switchTab('bab2')" id="tab-bab2" class="tab-btn px-4 py-2 text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-medium text-sm focus:outline-none">BAB III & IV</button>
                            <button onclick="switchTab('lampiran')" id="tab-lampiran" class="tab-btn px-4 py-2 text-gray-500 hover:text-gray-700 border-b-2 border-transparent font-medium text-sm focus:outline-none">Lampiran</button>
                        </div>

                        <form id="laporanForm" onsubmit="event.preventDefault(); saveLaporan();">
                            <input type="hidden" id="laporanId">

                            <!-- TAB: DATA UMUM -->
                            <div id="content-umum" class="tab-content space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul Laporan</label>
                                        <input type="text" id="judul_laporan" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required placeholder="Contoh: Rapat Rutin Bulanan">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Periode / Tanggal</label>
                                        <input type="text" id="periode" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required placeholder="Contoh: 14 Februari 2026">
                                    </div>
                                </div>

                                <!-- AI Generator Box -->
                                <div class="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 p-5 rounded-xl border border-purple-100 dark:border-gray-700 mt-4">
                                    <div class="flex items-start gap-4">
                                        <div class="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                            <i class="fas fa-magic text-purple-600 text-xl"></i>
                                        </div>
                                        <div class="flex-1">
                                            <h4 class="font-bold text-gray-900 dark:text-white mb-1">AI Generator Otomatis</h4>
                                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                Biarkan AI membuatkan draf lengkap (BAB I - IV) berdasarkan judul kegiatan di atas.
                                            </p>
                                            <button type="button" onclick="generateAIContent()" id="btn-ai" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                                                <i class="fas fa-bolt"></i> Generate Isi Laporan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- TAB: BAB I & II -->
                            <div id="content-bab1" class="tab-content hidden space-y-6">
                                <div>
                                    <h4 class="font-bold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">BAB I: PENDAHULUAN</h4>
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">A. Latar Belakang</label>
                                            <textarea id="pendahuluan_latar_belakang" rows="4" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"></textarea>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">B. Tujuan</label>
                                            <textarea id="pendahuluan_tujuan" rows="3" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"></textarea>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">C. Manfaat</label>
                                            <textarea id="pendahuluan_manfaat" rows="3" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 class="font-bold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">BAB II: PELAKSANAAN KEGIATAN</h4>
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">A. Waktu dan Tempat</label>
                                            <textarea id="pelaksanaan_waktu_tempat" rows="3" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"></textarea>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">B. Materi Kegiatan</label>
                                            <textarea id="pelaksanaan_materi" rows="4" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"></textarea>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">C. Narasumber & Peserta</label>
                                            <textarea id="pelaksanaan_peserta" rows="3" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- TAB: BAB III & IV -->
                            <div id="content-bab2" class="tab-content hidden space-y-6">
                                <div>
                                    <h4 class="font-bold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">BAB III: HASIL KEGIATAN</h4>
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">A. Uraian Jalannya Kegiatan</label>
                                            <textarea id="hasil_uraian" rows="5" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"></textarea>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">B. Tindak Lanjut</label>
                                            <textarea id="hasil_tindak_lanjut" rows="3" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"></textarea>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">C. Dampak</label>
                                            <textarea id="hasil_dampak" rows="3" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 class="font-bold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">BAB IV: PENUTUP</h4>
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">A. Simpulan</label>
                                            <textarea id="penutup_simpulan" rows="3" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"></textarea>
                                        </div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">B. Saran</label>
                                            <textarea id="penutup_saran" rows="3" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- TAB: LAMPIRAN -->
                            <div id="content-lampiran" class="tab-content hidden space-y-4">
                                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                    <div class="flex">
                                        <div class="flex-shrink-0">
                                            <i class="fas fa-info-circle text-yellow-600"></i>
                                        </div>
                                        <div class="ml-3">
                                            <p class="text-sm text-yellow-700">Fitur upload file gambar akan segera hadir. Saat ini silakan masukkan URL gambar secara manual.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div id="foto-container" class="space-y-3">
                                    <!-- Dynamic Inputs -->
                                </div>
                                <button type="button" onclick="addFotoInput()" class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                                    <i class="fas fa-plus-circle"></i> Tambah URL Foto
                                </button>
                            </div>

                        </form>
                    </div>

                    <!-- Modal Footer -->
                    <div class="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                        <button onclick="closeLaporanModal()" class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                            Batal
                        </button>
                        <button onclick="saveLaporan('draft')" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors shadow-sm">
                            <i class="fas fa-save mr-1"></i> Simpan Draft
                        </button>
                        <button onclick="saveLaporan('final')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30">
                            <i class="fas fa-check-circle mr-1"></i> Simpan Final
                        </button>
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
    document.getElementById(`content-${tabName}`).classList.remove('hidden');

    // Reset tabs styles
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'border-blue-600');
        btn.classList.add('text-gray-500', 'border-transparent');
    });
    // Set active tab style
    const activeBtn = document.getElementById(`tab-${tabName}`);
    activeBtn.classList.remove('text-gray-500', 'border-transparent');
    activeBtn.classList.add('text-blue-600', 'border-blue-600');
};

window.addFotoInput = (value = '') => {
    const container = document.getElementById('foto-container');
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `
        <input type="text" name="lampiran_foto[]" value="${value}" class="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700" placeholder="https://example.com/foto.jpg">
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-2"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
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
                periode: periode
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
