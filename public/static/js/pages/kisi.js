import { api } from '../api.js';
import { showToast, showLoading, hideLoading } from '../utils.js';
import { state } from '../state.js';
import { renderLockedFeature } from '../components.js';

export async function renderKisi() {
  if (!state.user) {
    return renderLockedFeature(
      'Generator Soal & Asesmen',
      'Penyusunan instrumen penilaian kini 10x lebih cepat. Dapatkan paket soal lengkap dengan kunci jawaban dan kisi-kisi berstandar HOTS (Higher Order Thinking Skills).',
      ['Paket Soal Lengkap (PG, Isian, Uraian)', 'Kisi-kisi Otomatis', 'Analisis Tingkat Kesulitan (HOTS)', 'Download Format MS Word Siap Cetak']
    );
  }

  return `
    <div class="animate-fade-in" id="asesmen-page">
      <!-- FORM VIEW -->
      <div id="asesmen-form-view">
        <!-- Header -->
        <div class="asesmen-header">
          <div class="asesmen-logo-mark">
            <i class="fas fa-brain"></i>
          </div>
          <div>
            <h1 class="asesmen-title">ASESMEN A4EDU</h1>
            <p class="asesmen-subtitle">NEURAL QUESTION ARCHITECT A4EDU</p>
          </div>
        </div>

        <!-- 3-Column Form -->
        <form id="asesmen-form" class="asesmen-grid">

          <!-- Column 1: IDENTITAS -->
          <div class="asesmen-card">
            <h3 class="asesmen-card-title"><i class="fas fa-school"></i> IDENTITAS</h3>

            <label class="asesmen-label">NAMA SEKOLAH</label>
            <input type="text" name="namaSekolah" value="SDN 2 NANGERANG" class="asesmen-input">

            <label class="asesmen-label">GURU PENGAMPU</label>
            <input type="text" name="namaGuru" value="Andris Hadiansyah, S.Pd." class="asesmen-input">

            <label class="asesmen-label">NIP GURU</label>
            <input type="text" name="nipGuru" value="19891106 202421 1 020" class="asesmen-input">

            <div class="asesmen-row">
              <div class="asesmen-col">
                <label class="asesmen-label">KELAS</label>
                <select name="jenjangKelas" class="asesmen-input">
                  <option>Kelas 1</option><option>Kelas 2</option><option>Kelas 3</option>
                  <option>Kelas 4</option><option selected>Kelas 5</option><option>Kelas 6</option>
                </select>
              </div>
              <div class="asesmen-col">
                <label class="asesmen-label">SEMESTER</label>
                <select name="semester" class="asesmen-input">
                  <option>Ganjil</option><option selected>Genap</option>
                </select>
              </div>
            </div>

            <label class="asesmen-label">JENIS SOAL / UJIAN</label>
            <select name="jenisUjian" class="asesmen-input">
              <option>Ulangan Harian</option>
              <option>STS</option>
              <option>SAS</option>
              <option>ASAT</option>
            </select>
          </div>

          <!-- Column 2: KURIKULUM & MATERI -->
          <div class="asesmen-card">
            <h3 class="asesmen-card-title"><i class="fas fa-graduation-cap"></i> KURIKULUM & MATERI</h3>

            <label class="asesmen-label">MATA PELAJARAN</label>
            <input type="text" name="mataPelajaran" placeholder="Misal: Matematika" class="asesmen-input" required>

            <label class="asesmen-label">RUANG LINGKUP / TOPIK</label>
            <textarea name="topik" rows="3" placeholder="Tuliskan topik bahasan di sini..." class="asesmen-input asesmen-textarea" required></textarea>

            <label class="asesmen-label">CAPAIAN PEMBELAJARAN (OPSIONAL)</label>
            <textarea name="capaianPembelajaran" rows="3" placeholder="Pelajari CP untuk lebih terfokus..." class="asesmen-input asesmen-textarea"></textarea>
          </div>

          <!-- Column 3: KARAKTERISTIK -->
          <div class="asesmen-card">
            <h3 class="asesmen-card-title"><i class="fas fa-sliders-h"></i> KARAKTERISTIK</h3>

            <!-- Question Type Counters -->
            <div class="asesmen-counter-grid">
              <div class="asesmen-counter-item">
                <span class="asesmen-counter-label">PG</span>
                <div class="asesmen-counter-controls">
                  <button type="button" class="asesmen-counter-btn" data-field="jumlahPG" data-dir="-1">−</button>
                  <input type="number" name="jumlahPG" value="10" min="0" max="50" class="asesmen-counter-value">
                  <button type="button" class="asesmen-counter-btn" data-field="jumlahPG" data-dir="1">+</button>
                </div>
              </div>
              <div class="asesmen-counter-item">
                <span class="asesmen-counter-label">Isian</span>
                <div class="asesmen-counter-controls">
                  <button type="button" class="asesmen-counter-btn" data-field="jumlahIsian" data-dir="-1">−</button>
                  <input type="number" name="jumlahIsian" value="5" min="0" max="20" class="asesmen-counter-value">
                  <button type="button" class="asesmen-counter-btn" data-field="jumlahIsian" data-dir="1">+</button>
                </div>
              </div>
              <div class="asesmen-counter-item">
                <span class="asesmen-counter-label">Essay</span>
                <div class="asesmen-counter-controls">
                  <button type="button" class="asesmen-counter-btn" data-field="jumlahUraian" data-dir="-1">−</button>
                  <input type="number" name="jumlahUraian" value="2" min="0" max="10" class="asesmen-counter-value">
                  <button type="button" class="asesmen-counter-btn" data-field="jumlahUraian" data-dir="1">+</button>
                </div>
              </div>
            </div>

            <label class="asesmen-label">FORMAT ISIAN SINGKAT</label>
            <select name="isianType" class="asesmen-input">
              <option value="Standard">Standard (Daftar Pertanyaan)</option>
              <option value="Crossword">Teka-Teki Silang</option>
              <option value="Menjodohkan">Menjodohkan</option>
            </select>

            <label class="asesmen-label">KOMPLEKSITAS AUTO</label>
            <select name="hotsRatio" class="asesmen-input">
              <option value="30:40:30">Balanced (30:40:30)</option>
              <option value="50:30:20">Easy (50:30:20)</option>
              <option value="20:30:50">Hard (20:30:50)</option>
            </select>

            <label class="asesmen-label">AI NEURAL ENGINE</label>
            <div class="asesmen-ai-engines">
              <label class="asesmen-engine-option">
                <input type="radio" name="aiProvider" value="gemini"> Gemini 2.0
              </label>
              <label class="asesmen-engine-option">
                <input type="radio" name="aiProvider" value="groq"> Llama 3.3
              </label>
              <label class="asesmen-engine-option asesmen-engine-highlight">
                <input type="radio" name="aiProvider" value="mistral" checked> Mistral Medium
              </label>
            </div>

            <button type="submit" class="asesmen-generate-btn">
              <i class="fas fa-magic"></i> GENERATE ASESMEN
            </button>
          </div>
        </form>
      </div>

      <!-- RESULT VIEW (Hidden by default) -->
      <div id="asesmen-result-view" class="hidden">
        <div class="asesmen-result-toolbar">
          <button id="btn-back-form" class="btn btn-secondary"><i class="fas fa-arrow-left mr-2"></i>Kembali ke Form</button>
          <div class="flex gap-3">
            <button id="btn-download-doc" class="btn btn-success"><i class="fas fa-download mr-2"></i>Unduh .doc</button>
            <button id="btn-print" class="btn btn-primary"><i class="fas fa-print mr-2"></i>Cetak / PDF</button>
          </div>
        </div>

        <!-- A4 Canvas -->
        <div id="asesmen-canvas" class="asesmen-a4">
          <!-- Content will be rendered here -->
        </div>
      </div>
    </div>

    <style>
      .asesmen-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 32px;
        padding: 24px;
      }
      .asesmen-logo-mark {
        width: 56px; height: 56px;
        background: linear-gradient(135deg, #06b6d4, #8b5cf6);
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        font-size: 28px; color: white;
        box-shadow: 0 8px 32px rgba(6,182,212,0.3);
      }
      .asesmen-title {
        font-size: 28px; font-weight: 900;
        letter-spacing: 4px;
        background: linear-gradient(90deg, #06b6d4, #a78bfa);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        margin: 0;
      }
      .asesmen-subtitle {
        font-size: 11px; letter-spacing: 6px;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        margin: 4px 0 0;
      }
      .asesmen-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
      }
      @media (max-width: 1024px) { .asesmen-grid { grid-template-columns: 1fr; } }
      .asesmen-card {
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-border-subtle);
        border-radius: 16px;
        padding: 24px;
      }
      .asesmen-card-title {
        font-size: 14px; font-weight: 700;
        letter-spacing: 2px; text-transform: uppercase;
        margin: 0 0 20px;
        display: flex; align-items: center; gap: 10px;
        color: var(--color-text-primary);
      }
      .asesmen-card-title i { color: #06b6d4; }
      .asesmen-label {
        display: block;
        font-size: 10px; font-weight: 600;
        letter-spacing: 1.5px; text-transform: uppercase;
        color: var(--color-text-secondary);
        margin: 16px 0 6px;
      }
      .asesmen-input {
        width: 100%; padding: 10px 14px;
        background: var(--color-bg-tertiary);
        border: 1px solid transparent;
        border-radius: 10px;
        color: var(--color-text-primary);
        font-size: 14px;
        transition: border-color 0.2s;
      }
      .asesmen-input:focus { border-color: #06b6d4; outline: none; }
      .asesmen-textarea { resize: vertical; min-height: 80px; font-family: inherit; }
      .asesmen-row { display: flex; gap: 12px; }
      .asesmen-col { flex: 1; }

      /* Counter Controls */
      .asesmen-counter-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
        margin-bottom: 8px;
      }
      .asesmen-counter-item { text-align: center; }
      .asesmen-counter-label {
        display: block; font-size: 10px; font-weight: 600;
        letter-spacing: 1px; text-transform: uppercase;
        color: var(--color-text-secondary); margin-bottom: 8px;
      }
      .asesmen-counter-controls {
        display: flex; align-items: center; justify-content: center;
        background: var(--color-bg-tertiary); border-radius: 10px;
        overflow: hidden;
      }
      .asesmen-counter-btn {
        width: 36px; height: 36px;
        background: transparent; border: none;
        color: var(--color-text-primary); font-size: 18px;
        cursor: pointer; transition: background 0.15s;
      }
      .asesmen-counter-btn:hover { background: var(--color-bg-primary); }
      .asesmen-counter-value {
        width: 48px; text-align: center;
        background: transparent; border: none;
        color: var(--color-text-primary);
        font-size: 18px; font-weight: 700;
        -moz-appearance: textfield;
      }
      .asesmen-counter-value::-webkit-outer-spin-button,
      .asesmen-counter-value::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

      /* AI Engine Selection */
      .asesmen-ai-engines {
        display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        margin-bottom: 12px;
      }
      .asesmen-engine-option {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 14px;
        background: var(--color-bg-tertiary);
        border: 1px solid transparent;
        border-radius: 10px;
        font-size: 13px; font-weight: 500;
        cursor: pointer; transition: all 0.2s;
        color: var(--color-text-primary);
      }
      .asesmen-engine-option:has(input:checked) {
        border-color: #06b6d4;
        background: rgba(6,182,212,0.1);
      }
      .asesmen-engine-option input[type="radio"] { accent-color: #06b6d4; }
      .asesmen-engine-highlight {
        grid-column: span 2;
        background: linear-gradient(90deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15));
        border: 1px solid rgba(6,182,212,0.3);
      }

      /* Generate Button */
      .asesmen-generate-btn {
        width: 100%; padding: 14px;
        background: linear-gradient(90deg, #06b6d4, #8b5cf6);
        color: white; border: none;
        border-radius: 12px;
        font-size: 15px; font-weight: 700;
        letter-spacing: 2px; text-transform: uppercase;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 6px 24px rgba(6,182,212,0.35);
        margin-top: 16px;
      }
      .asesmen-generate-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 40px rgba(6,182,212,0.45);
      }

      /* Result View */
      .asesmen-result-toolbar {
        display: flex; justify-content: space-between; align-items: center;
        flex-wrap: wrap; gap: 12px;
        padding: 16px 24px; margin-bottom: 24px;
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-border-subtle);
        border-radius: 12px;
        position: sticky; top: 16px; z-index: 50;
      }
      .asesmen-a4 {
        max-width: 21cm; margin: 0 auto;
        background: white; color: black;
        padding: 1cm;
        font-family: 'Times New Roman', Times, serif;
        font-size: 11pt; line-height: 1.15;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        border-radius: 4px;
        min-height: 29.7cm;
      }
      .asesmen-a4 h4 { font-weight: bold; font-size: 11pt; margin-bottom: 10px; }
      .asesmen-a4 table { border-collapse: collapse; width: 100%; }
      .asesmen-a4 .q-block { margin-bottom: 12px; display: flex; gap: 8px; }
      .asesmen-a4 .q-num { font-weight: bold; min-width: 25px; }
      .asesmen-a4 .q-body { flex: 1; }
      .asesmen-a4 .q-options { display: grid; gap: 2px; margin-top: 4px; }
      .asesmen-a4 .q-options.cols-4 { grid-template-columns: repeat(4, 1fr); }
      .asesmen-a4 .q-options.cols-2 { grid-template-columns: repeat(2, 1fr); }
      .asesmen-a4 .q-options.cols-1 { grid-template-columns: 1fr; }

      @media print {
        #asesmen-form-view, .asesmen-result-toolbar, .sidebar, .app-header { display: none !important; }
        .asesmen-a4 { box-shadow: none; margin: 0; padding: 0; }
      }
    </style>
  `;
}

export function initKisi() {
  const form = document.getElementById('asesmen-form');
  if (!form) return;

  // Counter buttons
  document.querySelectorAll('.asesmen-counter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      const dir = parseInt(btn.dataset.dir);
      const input = document.querySelector(`input[name="${field}"]`);
      if (!input) return;
      let val = parseInt(input.value) + dir;
      val = Math.max(parseInt(input.min) || 0, Math.min(parseInt(input.max) || 50, val));
      input.value = val;
    });
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    if (!data.topik || !data.topik.trim()) {
      showToast('Harap masukkan Topik/Materi terlebih dahulu.', 'error');
      return;
    }

    showLoading('AI sedang membuat soal...');

    try {
      const result = await api('/kisi/generate', {
        method: 'POST',
        body: data,
        timeout: 300000 // 5 menit untuk AI generation agar tidak timeout
      });

      if (result.success) {
        renderResult(result.data, data);
        showToast('Soal berhasil digenerate!', 'success');
      } else {
        showToast(result.error?.message || 'Gagal generate', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error: ' + err.message, 'error');
    } finally {
      hideLoading();
    }
  });

  // Back button
  document.getElementById('btn-back-form')?.addEventListener('click', () => {
    document.getElementById('asesmen-form-view').classList.remove('hidden');
    document.getElementById('asesmen-result-view').classList.add('hidden');
  });

  // Print
  document.getElementById('btn-print')?.addEventListener('click', () => window.print());

  // Download .doc
  document.getElementById('btn-download-doc')?.addEventListener('click', () => {
    const canvas = document.getElementById('asesmen-canvas');
    if (!canvas) return;

    const html = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head><meta charset='utf-8'>
          <style>
            @page { size: A4; margin: 1.27cm; }
            body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.15; color: black; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid black; padding: 2px 4px; vertical-align: top; }
            .q-block { margin-bottom: 12px; }
            .q-num { font-weight: bold; }
          </style>
          </head>
          <body>${canvas.innerHTML}</body>
          </html>
        `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Asesmen_Soal.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function renderResult(data, formData) {
  // Show result view, hide form
  document.getElementById('asesmen-form-view').classList.add('hidden');
  document.getElementById('asesmen-result-view').classList.remove('hidden');

  const canvas = document.getElementById('asesmen-canvas');
  let html = '';

  // KOP Surat
  html += `
      <div style="text-align:center; margin-bottom:15px">
        <h4 style="text-decoration:underline; font-weight:bold; font-size:12pt; margin-bottom:2px">
          ${formData.jenisUjian === 'STS' ? 'SUMATIF TENGAH SEMESTER' :
      formData.jenisUjian === 'SAS' ? 'SUMATIF AKHIR SEMESTER' :
        formData.jenisUjian === 'ASAT' ? 'ASESMEN SUMATIF AKHIR TAHUN' :
          formData.jenisUjian.toUpperCase()}
        </h4>
        <p style="font-weight:bold; font-size:11pt; margin:0">TAHUN PELAJARAN 2025/2026</p>
      </div>
    `;

  // Identity Table
  html += `
      <table style="border:1px solid black; margin-bottom:20px; font-size:10.5pt">
        <tr>
          <td style="border:1px solid black; padding:4px; width:12%">Mata Pelajaran</td>
          <td style="border:1px solid black; padding:4px; width:38%">: ${formData.mataPelajaran}</td>
          <td style="border:1px solid black; padding:4px; width:12%">Nama Siswa</td>
          <td style="border:1px solid black; padding:4px; width:38%">: .................................................</td>
        </tr>
        <tr>
          <td style="border:1px solid black; padding:4px">Kelas / Smt</td>
          <td style="border:1px solid black; padding:4px">: ${formData.jenjangKelas} / ${formData.semester}</td>
          <td style="border:1px solid black; padding:4px">Hari / Tgl</td>
          <td style="border:1px solid black; padding:4px">: .................. / .......................</td>
        </tr>
      </table>
    `;

  // PG Section
  if (data.pg && data.pg.length > 0) {
    html += `<h4>I. PILIHAN GANDA</h4>`;
    html += `<p style="font-size:9.5pt; font-style:italic; margin-bottom:10px">Berilah tanda silang (X) pada huruf A, B, C, atau D pada jawaban yang paling benar!</p>`;

    data.pg.forEach(q => {
      const opts = q.opsi || {};
      const allShort = Object.values(opts).every(v => (v || '').length < 15);
      const anyLong = Object.values(opts).some(v => (v || '').length > 60);
      const colClass = allShort ? 'cols-4' : anyLong ? 'cols-1' : 'cols-2';

      html += `
              <div class="q-block">
                <span class="q-num">${q.no}.</span>
                <div class="q-body">
                  <div style="margin-bottom:4px; text-align:justify">${q.soal}</div>
                  <div class="q-options ${colClass}">
                    <div>A. ${opts.A || '-'}</div>
                    <div>B. ${opts.B || '-'}</div>
                    <div>C. ${opts.C || '-'}</div>
                    <div>D. ${opts.D || '-'}</div>
                  </div>
                </div>
              </div>
            `;
    });
  }

  // Isian Section
  if (data.isian && data.isian.data && data.isian.data.length > 0) {
    html += `<h4 style="margin-top:20px">II. ISIAN SINGKAT</h4>`;
    html += `<p style="font-size:9.5pt; font-style:italic; margin-bottom:10px">Isilah titik-titik di bawah ini dengan jawaban yang tepat!</p>`;

    data.isian.data.forEach(q => {
      html += `
              <div class="q-block">
                <span class="q-num">${q.no}.</span>
                <div class="q-body">${q.soal}</div>
              </div>
            `;
    });
  }

  // Uraian Section
  if (data.uraian && data.uraian.length > 0) {
    html += `<h4 style="margin-top:20px">III. URAIAN</h4>`;
    html += `<p style="font-size:9.5pt; font-style:italic; margin-bottom:10px">Jawablah pertanyaan di bawah ini dengan jelas dan tepat!</p>`;

    data.uraian.forEach(q => {
      html += `
              <div class="q-block">
                <span class="q-num">${q.no}.</span>
                <div class="q-body">${q.soal}</div>
              </div>
            `;
    });
  }

  canvas.innerHTML = html;
  window.scrollTo(0, 0);
}
