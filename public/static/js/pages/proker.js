
import { api } from '../api.js';
import { state } from '../state.js';
import { formatDate, formatDateTime, escapeHtml, showToast } from '../utils.js';
import { navigate } from '../router.js';

export function renderProker() {
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
          <div id="kegiatan-container" class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <input type="text" name="nama_kegiatan[]" placeholder="Nama Kegiatan" class="w-full px-3 py-2 border rounded-lg text-sm">
              <input type="text" name="waktu_pelaksanaan[]" placeholder="Waktu Pelaksanaan" class="w-full px-3 py-2 border rounded-lg text-sm">
              <input type="text" name="penanggung_jawab[]" placeholder="Penanggung Jawab" class="w-full px-3 py-2 border rounded-lg text-sm">
              <input type="text" name="anggaran[]" placeholder="Estimasi Anggaran" class="w-full px-3 py-2 border rounded-lg text-sm">
              <div class="md:col-span-2">
                <input type="text" name="indikator[]" placeholder="Indikator Keberhasilan" class="w-full px-3 py-2 border rounded-lg text-sm">
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2">Analisis Kebutuhan (Opsional)</label>
          <textarea name="analisis_kebutuhan" rows="2" placeholder="Catatan tambahan..."
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
          <div class="flex gap-2">
            <button onclick="downloadProkerDocx()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium cursor-pointer">
              <i class="fas fa-file-word mr-1"></i>Download DOCX
            </button>
            <button onclick="downloadProkerPDF()" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">
              <i class="fas fa-file-pdf mr-1"></i>Download PDF
            </button>
          </div>
        </div>
        <div id="proker-content" class="proker-preview bg-gray-50 border border-gray-200 rounded-xl p-8 text-sm"></div>
      </div>
    </div>

    <div id="proker-history" class="hidden mt-8"></div>
  </div>`;
}

// Global functions
window.addKegiatanRow = function () {
    const div = document.createElement('div');
    div.className = 'grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 relative';
    div.innerHTML = `
    <button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-red-500 hover:text-red-700"><i class="fas fa-times"></i></button>
    <input type="text" name="nama_kegiatan[]" placeholder="Nama Kegiatan" class="w-full px-3 py-2 border rounded-lg text-sm">
    <input type="text" name="waktu_pelaksanaan[]" placeholder="Waktu Pelaksanaan" class="w-full px-3 py-2 border rounded-lg text-sm">
    <input type="text" name="penanggung_jawab[]" placeholder="Penanggung Jawab" class="w-full px-3 py-2 border rounded-lg text-sm">
    <input type="text" name="anggaran[]" placeholder="Estimasi Anggaran" class="w-full px-3 py-2 border rounded-lg text-sm">
    <div class="md:col-span-2">
      <input type="text" name="indikator[]" placeholder="Indikator Keberhasilan" class="w-full px-3 py-2 border rounded-lg text-sm">
    </div>`;
    document.getElementById('kegiatan-container').appendChild(div);
}

window.generateProker = async function (e) {
    e.preventDefault();
    if (!state.user) { showToast('Silakan login terlebih dahulu', 'error'); return; }

    const form = e.target;
    const btn = document.getElementById('generate-proker-btn');
    btn.innerHTML = '<span class="spinner mr-2"></span>Memproses dengan AI... (30-60 detik)'; btn.disabled = true;

    // Gather arrays
    const namaList = document.getElementsByName('nama_kegiatan[]');
    const waktuList = document.getElementsByName('waktu_pelaksanaan[]');
    const pjList = document.getElementsByName('penanggung_jawab[]');
    const anggaranList = document.getElementsByName('anggaran[]');
    const indikatorList = document.getElementsByName('indikator[]');

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

window.downloadProkerPDF = function () {
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

window.downloadProkerDocx = function () {
    const content = document.getElementById('proker-content').textContent;
    if (!content) return;

    const doc = new docx.Document({
        sections: [{
            properties: {},
            children: content.split('\n').map(line => new docx.Paragraph({
                children: [new docx.TextRun({ text: line, font: "Times New Roman", size: 24 })],
                spacing: { after: 120 },
            })),
        }],
    });

    docx.Packer.toBlob(doc).then(blob => {
        saveAs(blob, "Program_Kerja_KKG.docx");
        showToast('Program Kerja berhasil di-download sebagai DOCX');
    });
}

window.loadProkerHistory = async function () {
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

window.viewProker = async function (id) {
    try {
        const res = await api(`/proker/${id}`);
        document.getElementById('proker-content').textContent = res.data.isi_dokumen;
        document.getElementById('proker-result').classList.remove('hidden');
        document.getElementById('proker-result').scrollIntoView({ behavior: 'smooth' });
    } catch (e) { showToast(e.message, 'error'); }
}

window.deleteProker = async function (id) {
    if (!confirm('Yakin ingin menghapus program kerja ini?')) return;
    try { await api(`/proker/${id}`, { method: 'DELETE' }); showToast('Program kerja berhasil dihapus'); loadProkerHistory(); }
    catch (e) { showToast(e.message, 'error'); }
}
