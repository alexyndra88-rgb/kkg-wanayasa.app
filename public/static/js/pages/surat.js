
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
      <!-- Mode Tabs -->
      <div class="flex gap-2 mb-6 border-b dark:border-gray-700 pb-4">
        <button type="button" onclick="switchSuratMode('ai')" id="mode-ai" class="px-4 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-600 dark:text-blue-400">
          <i class="fas fa-magic mr-1"></i>Generate dengan AI
        </button>
        <button type="button" onclick="switchSuratMode('template')" id="mode-template" class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
          <i class="fas fa-file-alt mr-1"></i>Gunakan Template
        </button>
      </div>

      <!-- Template Selector (hidden by default) -->
      <div id="template-selector" class="hidden mb-6">
        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"><i class="fas fa-file-alt mr-1 text-orange-400"></i>Pilih Template Surat</label>
        <select id="template_id" onchange="loadTemplateForSurat()" class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition">
          <option value="">-- Pilih Template --</option>
        </select>
        <p id="template-desc" class="text-xs text-gray-400 mt-1"></p>
      </div>

      <!-- Template Variables Form (dynamic) -->
      <div id="template-variables-form" class="hidden mb-6">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3"><i class="fas fa-edit mr-1 text-green-400"></i>Isi Data Surat</h3>
        <div id="template-variables-fields" class="grid md:grid-cols-2 gap-4"></div>
      </div>

      <!-- AI Form -->
      <form id="surat-form" onsubmit="generateSurat(event)">
        <div id="ai-form-fields" class="grid md:grid-cols-2 gap-6">
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

      <!-- Template Generate Button (hidden by default) -->
      <button type="button" id="generate-from-template-btn" onclick="generateFromTemplateNew()" ${!state.user ? 'disabled' : ''} 
        class="hidden mt-8 w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/30 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2">
        <i class="fas fa-file-alt mr-2" aria-hidden="true"></i>Buat Surat dari Template
      </button>
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

window.downloadSuratDocx = async function () {
  // If no data
  if (!currentSuratData) {
    showToast('Tidak ada surat untuk diunduh. Silakan generate atau pilih surat terlebih dahulu.', 'warning');
    return;
  }

  // If no ID (template preview), use client-side generation
  if (!currentSuratData.id) {
    return window.downloadSuratDocxClientSide();
  }

  try {
    showToast('Mengunduh dokumen...', 'info');

    // Use server-side DOCX generation
    const response = await fetch(`/api/surat/${currentSuratData.id}/download`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Gagal mengunduh dokumen' }));
      throw new Error(error.message || 'Gagal mengunduh dokumen');
    }

    // Get blob and download
    const blob = await response.blob();
    const filename = `Surat_Undangan_${currentSuratData.jenis_kegiatan || 'KKG'}_${new Date().toISOString().slice(0, 10)}.docx`.replace(/\s+/g, '_');

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    showToast('Surat berhasil diunduh sebagai DOCX', 'success');
  } catch (error) {
    console.error('DOCX download error:', error);
    showToast('Gagal mengunduh dokumen: ' + error.message, 'error');
  }
}

// Fallback client-side DOCX generation (in case server fails)
// Fallback client-side DOCX generation (in case server fails)
// Fallback client-side DOCX generation (in case server fails)
window.downloadSuratDocxClientSide = async function () {
  const content = document.getElementById('surat-content').textContent;
  if (!content) {
    showToast('Tidak ada surat untuk diunduh', 'warning');
    return;
  }

  // Fetch logo if settings loaded
  let logoBuffer = null;
  if (typeof letterSettings !== 'undefined' && letterSettings?.logo_url) {
    try {
      const resp = await fetch(letterSettings.logo_url);
      if (resp.ok) logoBuffer = await resp.arrayBuffer();
    } catch (e) {
      console.warn("Failed to load logo", e);
    }
  }

  try {
    const docxLib = window.docx;
    if (!docxLib) throw new Error('Library DOCX belum dimuat. Silakan refresh halaman.');

    // Destructure needed modules - check lib version compatibility
    const { Document, Paragraph, TextRun, AlignmentType, BorderStyle, convertInchesToTwip, Table, TableRow, TableCell, WidthType, ImageRun, VerticalAlign } = docxLib;

    const lines = content.split('\n');
    const headerLines = [];
    const bodyLines = [];
    const footerLines = [];

    let section = 'HEADER';

    // Parse content
    for (const line of lines) {
      const txt = line.trim();
      if (txt.includes('_____')) {
        section = 'BODY';
        continue;
      }

      if (section === 'HEADER') {
        if (txt) headerLines.push(txt);
      } else if (section === 'BODY') {
        // Check footer start
        if (txt.match(/^[A-Za-z\s]+,\s+\d+\s+[A-Za-z]+\s+\d{4}$/) || txt.startsWith('Ketua KKG') || txt.startsWith('Kepala')) {
          section = 'FOOTER';
          footerLines.push(txt);
        } else {
          bodyLines.push(txt);
        }
      } else {
        footerLines.push(txt);
      }
    }

    const docChildren = [];

    // 1. Header (Table with Logo)
    if (headerLines.length > 0) {
      const headerParagraphs = headerLines.map(text => new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text, font: 'Times New Roman', size: text.startsWith('Alamat') ? 20 : 24, bold: !text.startsWith('Alamat') })]
      }));

      const logoCellChildren = [];
      if (logoBuffer) {
        logoCellChildren.push(new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new ImageRun({ data: logoBuffer, transformation: { width: 80, height: 80 } })]
        }));
      } else {
        logoCellChildren.push(new Paragraph({}));
      }

      docChildren.push(new Table({
        columnWidths: [convertInchesToTwip(5.5), convertInchesToTwip(1.5)],
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: headerParagraphs,
                width: { size: 80, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
              }),
              new TableCell({
                children: logoCellChildren,
                width: { size: 20, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign ? VerticalAlign.CENTER : undefined,
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
              })
            ]
          })
        ],
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 24, space: 1 }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
      }));

      // Separation
      docChildren.push(new Paragraph({ spacing: { before: 240 } }));
    }

    // 2. Body
    for (const line of bodyLines) {
      if (!line.trim()) {
        docChildren.push(new Paragraph({ spacing: { after: 120 } }));
        continue;
      }

      const isBoldKey = line.startsWith('Nomor') || line.startsWith('Perihal') || line.startsWith('Lampiran');

      docChildren.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 120, line: 276 },
        children: [new TextRun({ text: line, font: 'Times New Roman', size: 24, bold: isBoldKey })]
      }));
    }

    // 3. Footer
    for (const line of footerLines) {
      if (!line.trim()) {
        docChildren.push(new Paragraph({ spacing: { after: 120 } }));
        continue;
      }

      const isDate = line.match(/^[A-Za-z\s]+,\s+\d+\s+[A-Za-z]+\s+\d{4}$/);
      const isNip = line.startsWith('NIP');
      const isTitle = line.startsWith('Ketua') || line.startsWith('Kepala') || line.startsWith('Sekretaris');
      const isName = !isDate && !isTitle && !isNip && line.length > 2;

      docChildren.push(new Paragraph({
        indent: { left: convertInchesToTwip(4) },
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: line, font: 'Times New Roman', size: 24, bold: isName, underline: isName ? {} : undefined })]
      }));
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: convertInchesToTwip(1), right: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1) }
          }
        },
        children: docChildren
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

// ============================================
// Template Integration Functions
// ============================================

let currentSuratMode = 'ai';
let loadedTemplates = [];
let selectedTemplate = null;
let letterSettings = null;

async function fetchLetterSettings() {
  if (letterSettings) return;
  try {
    const res = await api('/surat/settings');
    letterSettings = res.data;
  } catch (e) {
    console.error('Fetch settings error:', e);
    // Fallback defaults
    letterSettings = {
      nama_ketua: 'Admin KKG Gugus 3',
      nip_ketua: '-',
      alamat_sekretariat: 'Wanayasa',
      kabupaten: 'Purwakarta',
      kecamatan: 'Wanayasa',
      gugus: '03'
    };
  }
}

// Switch between AI and Template mode
window.switchSuratMode = function (mode) {
  currentSuratMode = mode;

  // Update tab styles
  const aiTab = document.getElementById('mode-ai');
  const templateTab = document.getElementById('mode-template');

  if (mode === 'ai') {
    aiTab.classList.add('border-b-2', 'border-blue-500', 'text-blue-600', 'dark:text-blue-400');
    aiTab.classList.remove('text-gray-500', 'dark:text-gray-400');
    templateTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-600', 'dark:text-blue-400');
    templateTab.classList.add('text-gray-500', 'dark:text-gray-400');

    // Show AI form, hide template
    document.getElementById('ai-form-fields').classList.remove('hidden');
    document.getElementById('generate-surat-btn').classList.remove('hidden');
    document.getElementById('template-selector').classList.add('hidden');
    document.getElementById('template-variables-form').classList.add('hidden');
    document.getElementById('generate-from-template-btn').classList.add('hidden');
  } else {
    templateTab.classList.add('border-b-2', 'border-orange-500', 'text-orange-600', 'dark:text-orange-400');
    templateTab.classList.remove('text-gray-500', 'dark:text-gray-400');
    aiTab.classList.remove('border-b-2', 'border-blue-500', 'text-blue-600', 'dark:text-blue-400');
    aiTab.classList.add('text-gray-500', 'dark:text-gray-400');

    // Hide AI form, show template
    document.getElementById('ai-form-fields').classList.add('hidden');
    document.getElementById('generate-surat-btn').classList.add('hidden');
    document.getElementById('template-selector').classList.remove('hidden');
    document.getElementById('generate-from-template-btn').classList.remove('hidden');

    // Load settings and templates if not loaded
    fetchLetterSettings();
    if (loadedTemplates.length === 0) {
      loadTemplatesForSurat();
    }
  }
}

// Load available templates
async function loadTemplatesForSurat() {
  try {
    const res = await api('/templates?active=true');
    loadedTemplates = res.data || [];

    const select = document.getElementById('template_id');
    select.innerHTML = '<option value="">-- Pilih Template --</option>';

    // Group by jenis
    const grouped = {};
    loadedTemplates.forEach(t => {
      if (!grouped[t.jenis]) grouped[t.jenis] = [];
      grouped[t.jenis].push(t);
    });

    Object.entries(grouped).forEach(([jenis, templates]) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = jenis.charAt(0).toUpperCase() + jenis.slice(1);
      templates.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = t.nama;
        optgroup.appendChild(option);
      });
      select.appendChild(optgroup);
    });
  } catch (e) {
    console.error('Load templates error:', e);
    showToast('Gagal memuat template', 'error');
  }
}

// Load selected template and show variable fields
window.loadTemplateForSurat = async function () {
  const templateId = document.getElementById('template_id').value;

  if (!templateId) {
    document.getElementById('template-variables-form').classList.add('hidden');
    document.getElementById('template-desc').textContent = '';
    selectedTemplate = null;
    return;
  }

  try {
    const res = await api(`/templates/${templateId}`);
    selectedTemplate = res.data;

    // Show description
    document.getElementById('template-desc').textContent = selectedTemplate.deskripsi || '';

    // Build variable fields
    const variables = selectedTemplate.variables || [];
    const fieldsContainer = document.getElementById('template-variables-fields');

    if (variables.length === 0) {
      fieldsContainer.innerHTML = '<p class="text-gray-400 text-sm col-span-2">Template ini tidak memerlukan input data.</p>';
    } else {
      fieldsContainer.innerHTML = variables.map(v => {
        // Generate user-friendly label
        const label = v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const isTextarea = ['isi_edaran', 'acara', 'materi', 'agenda'].includes(v);

        return `
          <div class="${isTextarea ? 'md:col-span-2' : ''}">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${label}</label>
            ${isTextarea
            ? `<textarea id="var-${v}" name="var-${v}" rows="3" placeholder="Isi ${label.toLowerCase()}..." class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition"></textarea>`
            : `<input type="${v.includes('tanggal') ? 'date' : 'text'}" id="var-${v}" name="var-${v}" placeholder="Isi ${label.toLowerCase()}..." class="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition">`
          }
          </div>
        `;
      }).join('');
    }

    document.getElementById('template-variables-form').classList.remove('hidden');
  } catch (e) {
    console.error('Load template error:', e);
    showToast('Gagal memuat template', 'error');
  }
}

// Generate surat from template
window.generateFromTemplate = async function () {
  if (!selectedTemplate) {
    showToast('Pilih template terlebih dahulu', 'error');
    return;
  }

  const btn = document.getElementById('generate-from-template-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Membuat Surat...';

  try {
    // Collect variable values
    const variables = selectedTemplate.variables || [];
    const data = {};

    for (const v of variables) {
      const input = document.getElementById(`var-${v}`);
      if (input) {
        const value = input.value.trim();
        // Format date if needed
        if (v.includes('tanggal') && value) {
          const date = new Date(value);
          data[v] = date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } else {
          data[v] = value || `[${v}]`;
        }
      }
    }

    // Replace variables in template content
    let content = selectedTemplate.konten;
    for (const [key, value] of Object.entries(data)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    // Store for export
    currentSuratData = {
      id: null,
      nomor_surat: generateTempNomorSurat(selectedTemplate.jenis),
      jenis_kegiatan: selectedTemplate.nama,
      tanggal_kegiatan: data.tanggal || new Date().toISOString().split('T')[0],
      isi_surat: content,
      template_id: selectedTemplate.id,
      created_at: new Date().toISOString()
    };

    // Show result
    document.getElementById('surat-content').textContent = content;
    document.getElementById('surat-result').classList.remove('hidden');
    document.getElementById('surat-result').scrollIntoView({ behavior: 'smooth' });

    showToast('Surat berhasil dibuat dari template!', 'success');
  } catch (e) {
    console.error('Generate from template error:', e);
    showToast(e.message || 'Gagal membuat surat', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-file-alt mr-2"></i>Buat Surat dari Template';
  }
}

// Generate temporary nomor surat
function generateTempNomorSurat(jenis) {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const jenisCode = {
    'undangan': 'UND',
    'tugas': 'TGS',
    'keterangan': 'KET',
    'edaran': 'EDR',
    'permohonan': 'PHN',
    'lainnya': 'SRT'
  };
  const code = jenisCode[jenis] || 'SRT';
  const num = String(Math.floor(Math.random() * 100) + 1).padStart(3, '0');
  return `${num}/KKG-G3/${code}/${month}/${year}`;
}

// Wrap content with Kop Surat and Signature
async function wrapWithKopAndSignature(content, nomorSurat) {
  // Ensure settings are loaded
  await fetchLetterSettings();
  const s = letterSettings;

  // Format date now
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return `PEMERINTAH KABUPATEN ${s.kabupaten.toUpperCase()}
DINAS PENDIDIKAN
KELOMPOK KERJA GURU (KKG) GUGUS ${s.gugus}
KECAMATAN ${s.kecamatan.toUpperCase()}
Alamat: ${s.alamat_sekretariat}

__________________________________________________________________________

Nomor   : ${nomorSurat}
Lampiran: -
Perihal : ${selectedTemplate.nama}

${content}

${s.kecamatan}, ${today}
Ketua KKG Gugus ${s.gugus},


${s.nama_ketua}
NIP. ${s.nip_ketua}`;
}

// New Generate Function
window.generateFromTemplateNew = async function () {
  if (!selectedTemplate) {
    showToast('Pilih template terlebih dahulu', 'error');
    return;
  }

  const btn = document.getElementById('generate-from-template-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Membuat Surat...';

  try {
    // Collect variables
    const variables = selectedTemplate.variables || [];
    const data = {};

    for (const v of variables) {
      const input = document.getElementById(`var-${v}`);
      if (input) {
        let value = input.value.trim();
        if (v.includes('tanggal') && value) {
          const date = new Date(value);
          value = date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        data[v] = value || `[${v}]`;
      }
    }

    // Replace content
    let content = selectedTemplate.konten;
    for (const [key, value] of Object.entries(data)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    // Generate nomor
    const nomorSurat = generateTempNomorSurat(selectedTemplate.jenis);

    // Wrap
    const fullContent = await wrapWithKopAndSignature(content, nomorSurat);

    // Store
    currentSuratData = {
      id: null,
      nomor_surat: nomorSurat,
      jenis_kegiatan: selectedTemplate.nama,
      tanggal_kegiatan: data.tanggal || new Date().toISOString().split('T')[0],
      isi_surat: fullContent,
      template_id: selectedTemplate.id,
      created_at: new Date().toISOString()
    };

    // Show
    document.getElementById('surat-content').textContent = fullContent;
    document.getElementById('surat-result').classList.remove('hidden');
    document.getElementById('surat-result').scrollIntoView({ behavior: 'smooth' });

    showToast('Surat berhasil dibuat!', 'success');
  } catch (e) {
    console.error('Error generation:', e);
    showToast('Gagal membuat surat: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-file-alt mr-2"></i>Buat Surat dari Template';
  }
}
