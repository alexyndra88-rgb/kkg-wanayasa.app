
import { api } from '../api.js';
import { state } from '../state.js';
import { formatDate, escapeHtml, showToast } from '../utils.js';
import { navigate } from '../router.js';
// DOCX functions will be defined inline below

// Store current surat metadata for export
let currentSuratData = null;

export function renderSurat() {
  // Return HTML string
  return `
  <div class="fade-in max-w-4xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-envelope text-blue-500 mr-2" aria-hidden="true"></i>Generator Surat Undangan</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Buat surat undangan KKG secara otomatis dengan AI</p>
      </div>
      ${state.user ? `<button onclick="loadSuratHistory()" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium dark:text-gray-200"><i class="fas fa-history mr-1" aria-hidden="true"></i>Riwayat</button>` : ''}
    </div>

    ${!state.user ? `
      <div class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6 mb-6" role="alert">
        <p class="text-yellow-800 dark:text-yellow-200"><i class="fas fa-lock mr-2" aria-hidden="true"></i>Silakan <a href="javascript:void(0)" onclick="navigate('login')" class="text-blue-600 dark:text-blue-400 underline font-semibold">login</a> untuk membuat surat undangan.</p>
      </div>
    ` : ''}

    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 dark:border-gray-700">
      <form id="surat-form" onsubmit="generateSurat(event)">
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <label for="jenis_kegiatan" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"><i class="fas fa-tag mr-1 text-blue-400" aria-hidden="true"></i>Jenis Kegiatan <span class="text-red-500">*</span></label>
            <select id="jenis_kegiatan" name="jenis_kegiatan" required class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" aria-required="true">
              <option value="">-- Pilih Jenis Kegiatan --</option>
              <option value="Rapat Rutin KKG">Rapat Rutin KKG</option>
              <option value="Rapat Koordinasi">Rapat Koordinasi</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Pelatihan">Pelatihan</option>
              <option value="Kegiatan Bersama">Kegiatan Bersama</option>
              <option value="Sosialisasi">Sosialisasi</option>
              <option value="Kunjungan Kerja">Kunjungan Kerja</option>
              <option value="Lomba/Kompetisi">Lomba/Kompetisi</option>
            </select>
          </div>
          <div>
            <label for="tempat_kegiatan" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"><i class="fas fa-map-marker-alt mr-1 text-red-400" aria-hidden="true"></i>Tempat Kegiatan <span class="text-red-500">*</span></label>
            <input type="text" id="tempat_kegiatan" name="tempat_kegiatan" required placeholder="Contoh: SDN 1 Wanayasa"
              class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" aria-required="true">
          </div>
          <div>
            <label for="tanggal_kegiatan" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"><i class="fas fa-calendar mr-1 text-green-400" aria-hidden="true"></i>Tanggal Kegiatan <span class="text-red-500">*</span></label>
            <input type="date" id="tanggal_kegiatan" name="tanggal_kegiatan" required
              class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" aria-required="true">
          </div>
          <div>
            <label for="waktu_kegiatan" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"><i class="fas fa-clock mr-1 text-purple-400" aria-hidden="true"></i>Waktu Kegiatan <span class="text-red-500">*</span></label>
            <input type="text" id="waktu_kegiatan" name="waktu_kegiatan" required placeholder="Contoh: 09.00 - 12.00 WIB"
              class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" aria-required="true">
          </div>
        </div>

        <div class="mt-6">
          <label for="agenda" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"><i class="fas fa-list mr-1 text-orange-400" aria-hidden="true"></i>Agenda/Acara <span class="text-red-500">*</span></label>
          <textarea id="agenda" name="agenda" required rows="3" placeholder="Tuliskan agenda kegiatan, pisahkan dengan enter untuk setiap poin..."
            class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition" aria-required="true"></textarea>
          <p class="text-xs text-gray-400 mt-1">Tips: Pisahkan setiap agenda dengan baris baru</p>
        </div>

        <div class="mt-6">
          <label for="peserta" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"><i class="fas fa-users mr-1 text-teal-400" aria-hidden="true"></i>Peserta yang Diundang</label>
          <textarea id="peserta" name="peserta" rows="2" placeholder="Contoh: Seluruh anggota KKG Gugus 3 Wanayasa, Kepala Sekolah se-Gugus 3..."
            class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"></textarea>
        </div>

        <div class="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <label for="penanggung_jawab" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"><i class="fas fa-user-tie mr-1 text-indigo-400" aria-hidden="true"></i>Penanggung Jawab / Penandatangan</label>
            <input type="text" id="penanggung_jawab" name="penanggung_jawab" placeholder="Nama Ketua KKG" value="${state.user ? escapeHtml(state.user.nama) : ''}"
              class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition">
          </div>
          <div>
            <label for="lampiran" class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"><i class="fas fa-paperclip mr-1 text-gray-400" aria-hidden="true"></i>Lampiran</label>
            <input type="text" id="lampiran" name="lampiran" placeholder="Contoh: 1 (satu) berkas, - (jika tidak ada)"
              class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition">
          </div>
        </div>

        <button type="submit" id="generate-surat-btn" ${!state.user ? 'disabled' : ''} 
          class="mt-8 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
          <i class="fas fa-magic mr-2" aria-hidden="true"></i>Generate Surat dengan AI
        </button>
      </form>
    </div>

    <div id="surat-result" class="hidden mt-8">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 dark:border-gray-700">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-file-alt text-green-500 mr-2" aria-hidden="true"></i>Preview Surat</h2>
          <div class="flex flex-wrap gap-2">
            <button onclick="editSuratContent()" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <i class="fas fa-edit mr-1" aria-hidden="true"></i>Edit
            </button>
            <button onclick="downloadSuratDocx()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-400">
              <i class="fas fa-file-word mr-1" aria-hidden="true"></i>Download DOCX
            </button>
            <button onclick="downloadSuratPDF()" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-red-400">
              <i class="fas fa-file-pdf mr-1" aria-hidden="true"></i>Print PDF
            </button>
          </div>
        </div>
        <div id="surat-content" class="surat-preview bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl p-8 text-sm font-serif whitespace-pre-wrap leading-relaxed dark:text-gray-200" style="font-family: 'Times New Roman', serif;"></div>
        
        <!-- Edit mode -->
        <div id="surat-edit-mode" class="hidden">
          <textarea id="surat-edit-textarea" rows="20" class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition font-serif" style="font-family: 'Times New Roman', serif;"></textarea>
          <div class="flex gap-2 mt-4">
            <button onclick="saveSuratEdit()" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition">
              <i class="fas fa-save mr-1" aria-hidden="true"></i>Simpan
            </button>
            <button onclick="cancelSuratEdit()" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition">
              <i class="fas fa-times mr-1" aria-hidden="true"></i>Batal
            </button>
          </div>
        </div>
      </div>
    </div>

    <div id="surat-history" class="hidden mt-8"></div>
  </div>`;
}

// Store current surat for export
window.setCurrentSuratData = function (data) {
  currentSuratData = data;
}

// Global functions
window.generateSurat = async function (e) {
  e.preventDefault();
  if (!state.user) { showToast('Silakan login terlebih dahulu', 'error'); return; }

  const form = e.target;
  const btn = document.getElementById('generate-surat-btn');
  btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Memproses dengan AI... (30-60 detik)';
  btn.disabled = true;

  try {
    const formData = {
      jenis_kegiatan: form.jenis_kegiatan.value,
      tanggal_kegiatan: form.tanggal_kegiatan.value,
      waktu_kegiatan: form.waktu_kegiatan.value,
      tempat_kegiatan: form.tempat_kegiatan.value,
      agenda: form.agenda.value,
      peserta: form.peserta.value,
      penanggung_jawab: form.penanggung_jawab.value,
    };

    const res = await api('/surat/generate', {
      method: 'POST',
      body: formData
    });

    // Store data for export
    currentSuratData = {
      ...formData,
      id: res.data.id,
      nomor_surat: res.data.nomor_surat,
      isi_surat: res.data.isi_surat,
      created_at: res.data.created_at
    };

    document.getElementById('surat-content').textContent = res.data.isi_surat;
    document.getElementById('surat-result').classList.remove('hidden');
    document.getElementById('surat-result').scrollIntoView({ behavior: 'smooth' });
    showToast('Surat berhasil di-generate!', 'success');
  } catch (e) {
    showToast(e.message || 'Gagal generate surat', 'error');
  }

  btn.innerHTML = '<i class="fas fa-magic mr-2"></i>Generate Surat dengan AI';
  btn.disabled = false;
}

window.downloadSuratPDF = function () {
  const content = document.getElementById('surat-content').textContent;
  if (!content) return;

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html><head>
      <title>Surat Undangan KKG Gugus 3 Wanayasa</title>
      <style>
        @page { size: A4; margin: 2.5cm 2cm 2cm 2.5cm; }
        body { 
          font-family: 'Times New Roman', Times, serif; 
          font-size: 12pt; 
          line-height: 1.5; 
          max-width: 210mm; 
          margin: auto; 
          padding: 20px;
          color: #000;
        }
        pre { 
          white-space: pre-wrap; 
          word-wrap: break-word;
          font-family: 'Times New Roman', Times, serif; 
          font-size: 12pt;
          margin: 0;
        }
        @media print { 
          body { padding: 0; } 
        }
      </style>
    </head>
    <body>
      <pre>${escapeHtml(content)}</pre>
      <script>
        setTimeout(function() { window.print(); }, 500);
      </script>
    </body></html>
  `);
  win.document.close();
}

window.downloadSuratDocx = function () {
  const content = document.getElementById('surat-content').textContent;
  if (!content) {
    showToast('Tidak ada surat untuk diunduh', 'warning');
    return;
  }

  try {
    const { Document, Paragraph, TextRun, AlignmentType, BorderStyle, convertInchesToTwip, HeadingLevel } = docx;

    const lines = content.split('\n');
    const children = [];

    // Parse content sections
    let section = 'kop'; // kop, metadata, body
    let kopEndIndex = -1;
    let dateLineIndex = -1;

    // Identify sections
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (line.includes('nomor') || line.includes('lampiran') || line.includes('perihal')) {
        if (kopEndIndex === -1) kopEndIndex = i;
        section = 'metadata';
      }
      // Find date line (Purwakarta, tanggal)
      if (line.includes('purwakarta,') || (line.includes('februari') && line.includes('202'))) {
        dateLineIndex = i;
      }
    }
    if (kopEndIndex === -1) kopEndIndex = 5; // Default

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const lowerLine = line.toLowerCase();

      // Skip empty lines at start
      if (index < 2 && !trimmedLine) return;

      // KOP SURAT - Smaller fonts
      if (index < kopEndIndex) {
        if (!trimmedLine) return;

        // Determine font size for kop (smaller)
        let fontSize = 22; // 11pt default
        let isBold = true;

        if (lowerLine.includes('pemerintah')) fontSize = 24; // 12pt
        else if (lowerLine.includes('dinas')) fontSize = 22;
        else if (lowerLine.includes('kelompok kerja') || lowerLine.includes('kkg')) fontSize = 22;
        else if (lowerLine.includes('alamat') || lowerLine.includes('email')) { fontSize = 20; isBold = false; }

        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40, line: 240 },
          children: [
            new TextRun({
              text: trimmedLine,
              font: 'Times New Roman',
              size: fontSize,
              bold: isBold
            })
          ]
        }));

        // Add double line border after kop
        if (index === kopEndIndex - 1 || (lowerLine.includes('email') || lowerLine.includes('@'))) {
          children.push(new Paragraph({
            border: { bottom: { color: '000000', space: 1, size: 12, style: BorderStyle.DOUBLE } },
            spacing: { after: 200 }
          }));
        }
        return;
      }

      // DATE LINE - Right aligned after kop
      if (index === dateLineIndex || (lowerLine.includes('purwakarta,') && lowerLine.includes('202'))) {
        children.push(new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 200, after: 200 },
          children: [
            new TextRun({
              text: trimmedLine,
              font: 'Times New Roman',
              size: 24,
              bold: false
            })
          ]
        }));
        return;
      }

      // NOMOR/LAMPIRAN/PERIHAL lines
      if (lowerLine.includes('nomor') || lowerLine.includes('lampiran') || lowerLine.includes('perihal')) {
        children.push(new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: trimmedLine,
              font: 'Times New Roman',
              size: 24
            })
          ]
        }));
        return;
      }

      // KEPADA YTH. and address - Left aligned
      if (lowerLine.includes('kepada yth') || lowerLine.includes('di tempat') ||
        lowerLine.includes('bapak/ibu') || lowerLine.includes('guru pendamping')) {
        children.push(new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 40 },
          indent: { left: convertInchesToTwip(0.5) },
          children: [
            new TextRun({
              text: trimmedLine,
              font: 'Times New Roman',
              size: 24
            })
          ]
        }));
        return;
      }

      // SIGNATURE section - Right aligned
      if (lowerLine.includes('hormat kami') || lowerLine.includes('ketua kkg') ||
        lowerLine.includes('nama lengkap') || lowerLine.includes('nip') ||
        lowerLine.startsWith('_____') || trimmedLine === '___') {
        children.push(new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 40 },
          indent: { left: convertInchesToTwip(3.5) },
          children: [
            new TextRun({
              text: trimmedLine,
              font: 'Times New Roman',
              size: 24
            })
          ]
        }));
        return;
      }

      // BODY TEXT - Justified
      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 120, line: 276 },
        children: [
          new TextRun({
            text: line,
            font: 'Times New Roman',
            size: 24
          })
        ]
      }));
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(1.25),
            }
          }
        },
        children: children
      }]
    });

    const filename = `Surat_Undangan_${currentSuratData?.jenis_kegiatan || 'KKG'}_${new Date().toISOString().slice(0, 10)}.docx`.replace(/\s+/g, '_');

    docx.Packer.toBlob(doc).then(blob => {
      saveAs(blob, filename);
      showToast('Surat berhasil diunduh sebagai DOCX', 'success');
    });
  } catch (error) {
    console.error('DOCX generation error:', error);
    showToast('Gagal membuat dokumen DOCX: ' + error.message, 'error');
  }
}

// Fallback simple DOCX download
window.downloadSuratDocxSimple = function () {
  window.downloadSuratDocx();
}

window.editSuratContent = function () {
  const content = document.getElementById('surat-content').textContent;
  document.getElementById('surat-edit-textarea').value = content;
  document.getElementById('surat-content').classList.add('hidden');
  document.getElementById('surat-edit-mode').classList.remove('hidden');
}

window.saveSuratEdit = function () {
  const newContent = document.getElementById('surat-edit-textarea').value;
  document.getElementById('surat-content').textContent = newContent;

  // Update stored data
  if (currentSuratData) {
    currentSuratData.isi_surat = newContent;
  }

  cancelSuratEdit();
  showToast('Perubahan disimpan', 'success');
}

window.cancelSuratEdit = function () {
  document.getElementById('surat-content').classList.remove('hidden');
  document.getElementById('surat-edit-mode').classList.add('hidden');
}

window.loadSuratHistory = async function () {
  try {
    const res = await api('/surat/history');
    const container = document.getElementById('surat-history');
    container.classList.remove('hidden');

    if (!res.data?.items || res.data.items.length === 0) {
      container.innerHTML = '<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700 text-center text-gray-400">Belum ada riwayat surat.</div>';
      return;
    }

    container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4"><i class="fas fa-history text-blue-500 mr-2" aria-hidden="true"></i>Riwayat Surat</h2>
        <div class="space-y-3">
          ${res.data.items.map(s => `
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-500 transition">
              <div>
                <div class="font-semibold text-gray-800 dark:text-gray-100">${escapeHtml(s.jenis_kegiatan)}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">${escapeHtml(s.nomor_surat)} | ${formatDate(s.tanggal_kegiatan)}</div>
              </div>
              <div class="flex gap-2">
                <button onclick="viewSurat(${s.id})" class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition"><i class="fas fa-eye mr-1" aria-hidden="true"></i>Lihat</button>
                <button onclick="deleteSurat(${s.id})" class="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-800 transition"><i class="fas fa-trash" aria-hidden="true"></i></button>
              </div>
            </div>
          `).join('')}
        </div>
        ${res.data.pagination.totalPages > 1 ? `
          <div class="mt-4 text-center text-sm text-gray-500">
            Halaman ${res.data.pagination.page} dari ${res.data.pagination.totalPages} (${res.data.pagination.total} surat)
          </div>
        ` : ''}
      </div>`;
  } catch (e) { showToast(e.message, 'error'); }
}

window.viewSurat = async function (id) {
  try {
    const res = await api(`/surat/${id}`);

    // Store data for export
    currentSuratData = res.data;

    document.getElementById('surat-content').textContent = res.data.isi_surat;
    document.getElementById('surat-result').classList.remove('hidden');
    document.getElementById('surat-result').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast(e.message, 'error'); }
}

window.deleteSurat = async function (id) {
  if (!confirm('Yakin ingin menghapus surat ini?')) return;
  try {
    await api(`/surat/${id}`, { method: 'DELETE' });
    showToast('Surat berhasil dihapus', 'success');
    loadSuratHistory();
  } catch (e) { showToast(e.message, 'error'); }
}
