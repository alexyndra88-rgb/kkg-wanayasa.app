import { showToast, showLoading, hideLoading } from '../utils.js';
import { api } from '../api.js';
import { state } from '../state.js';
import { renderLockedFeature } from '../components.js';

export async function renderRpp() {
  if (!state.user) {
    return renderLockedFeature(
      'Generator RPP Deep Learning',
      'Maaf, fitur ini khusus untuk anggota terdaftar. Silakan login untuk menyusun RPP Lengkap dalam hitungan detik menggunakan teknologi AI terbaru.',
      ['RPP Kurikulum Merdeka Otomatis', 'AI Deep Learning (Gemini, Mistral)', 'Ekspor ke Word & PDF', 'Tanpa Batas Penggunaan']
    );
  }

  return `
    <div class="animate-fade-in" id="rpp-page">
      <!-- FORM VIEW -->
      <div id="rpp-form-view">
        <!-- Header -->
        <div class="rpp-header">
          <div class="rpp-logo-mark">
            <i class="fas fa-layer-group"></i>
          </div>
          <div>
            <h1 class="rpp-title">RPP <span>MERDEKA</span></h1>
            <p class="rpp-subtitle"><i class="fas fa-sparkles"></i> DEEP LEARNING ARCHITECT A4EDU</p>
          </div>
        </div>

        <!-- 3-Column Form -->
        <form id="rpp-form" class="rpp-grid">

          <!-- Column 1: IDENTITAS -->
          <div class="rpp-card">
            <h3 class="rpp-card-title"><i class="fas fa-graduation-cap"></i> Identitas</h3>

            <label class="rpp-label">NAMA SEKOLAH</label>
            <input type="text" name="namaSekolah" value="SDN 2 Nangerang" class="rpp-input">

            <div class="rpp-row">
              <div class="rpp-col">
                <label class="rpp-label">KEPALA SEKOLAH</label>
                <input type="text" name="namaKepalaSekolah" value="H. Ujang Ma'Mun, S.Pd.I" class="rpp-input">
              </div>
              <div class="rpp-col">
                <label class="rpp-label">NIP KS</label>
                <input type="text" name="nipKepalaSekolah" value="19691212 200701 1 021" class="rpp-input">
              </div>
            </div>

            <div class="rpp-row">
              <div class="rpp-col">
                <label class="rpp-label">NAMA GURU</label>
                <input type="text" name="namaGuru" value="Andris Hadiansyah, S.Pd." class="rpp-input">
              </div>
              <div class="rpp-col">
                <label class="rpp-label">NIP GURU</label>
                <input type="text" name="nipGuru" value="19891106 202421 1 020" class="rpp-input">
              </div>
            </div>
          </div>

          <!-- Column 2: KURIKULUM -->
          <div class="rpp-card">
            <h3 class="rpp-card-title"><i class="fas fa-book-open"></i> Kurikulum</h3>

            <div class="rpp-row">
              <div class="rpp-col">
                <label class="rpp-label">KELAS</label>
                <input type="text" name="jenjangKelas" value="Kelas 5" class="rpp-input">
              </div>
              <div class="rpp-col">
                <label class="rpp-label">SEMESTER</label>
                <select name="semester" class="rpp-input">
                  <option>Ganjil</option>
                  <option selected>Genap</option>
                </select>
              </div>
            </div>

            <label class="rpp-label">MATA PELAJARAN</label>
            <input type="text" name="mataPelajaran" placeholder="Misal: Matematika" class="rpp-input" required>

            <label class="rpp-label">TOPIK / MATERI POKOK</label>
            <input type="text" name="topik" placeholder="Topik utama..." class="rpp-input rpp-input-bold" required>

            <div class="rpp-row">
              <div class="rpp-col" style="flex:1.2">
                <label class="rpp-label">ALOKASI WAKTU</label>
                <input type="text" name="alokasiWaktu" value="2 x 35 Menit" class="rpp-input">
              </div>
              <div class="rpp-col">
                <label class="rpp-label">PERTEMUAN</label>
                <div class="rpp-counter">
                  <button type="button" id="btn-prt-minus" class="rpp-counter-btn">−</button>
                  <span id="prt-count" class="rpp-counter-val">1P</span>
                  <input type="hidden" name="jumlahPertemuan" value="1">
                  <button type="button" id="btn-prt-plus" class="rpp-counter-btn">+</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 3: STRATEGI -->
          <div class="rpp-card">
            <h3 class="rpp-card-title"><i class="fas fa-crosshairs"></i> Strategi</h3>

            <label class="rpp-label">MODEL PEMBELAJARAN</label>
            <select name="strategi" class="rpp-input">
              <option>Problem Based Learning (PBL)</option>
              <option>Project Based Learning (PjBL)</option>
              <option>Discovery Learning</option>
              <option>Inquiry Learning</option>
            </select>

            <label class="rpp-label">LAMPIRKAN LKPD?</label>
            <select name="lampirkanLKPD" id="sel-lkpd" class="rpp-input rpp-input-highlight">
              <option value="Tidak">Tidak</option>
              <option value="Ya" selected>Ya (Otomatis)</option>
            </select>

            <label class="rpp-label">CAPAIAN PEMBELAJARAN (OPSIONAL)</label>
            <textarea name="capaianPembelajaran" rows="3" placeholder="Tulis CP di sini..." class="rpp-input rpp-textarea"></textarea>

            <label class="rpp-label">AI NEURAL ENGINE</label>
            <div class="rpp-ai-engines">
              <label class="rpp-engine-option">
                <input type="radio" name="aiProvider" value="gemini"> Gemini 2.0
              </label>
              <label class="rpp-engine-option">
                <input type="radio" name="aiProvider" value="groq"> Llama 3.3
              </label>
              <label class="rpp-engine-option rpp-engine-highlight">
                <input type="radio" name="aiProvider" value="mistral" checked> Mistral Medium (Magistral)
              </label>
            </div>
          </div>
        </form>

        <!-- Dimensi Profil Pelajar Pancasila -->
        <div class="rpp-profil-bar">
          <span class="rpp-profil-label">DIMENSI PROFIL:</span>
          <div class="rpp-profil-tags" id="profil-tags">
            ${['Keimanan & Ketakwaan', 'Kewargaan', 'Penalaran Kritis', 'Kreativitas', 'Kolaborasi', 'Kemandirian', 'Kesehatan', 'Komunikasi']
      .map(d => `<button type="button" class="rpp-tag" data-dim="${d}">${d}</button>`).join('')}
          </div>
        </div>

        <!-- Generate Button -->
        <div class="rpp-action-center">
          <button type="button" id="btn-generate-rpp" class="rpp-generate-btn">
            <i class="fas fa-magic"></i> Generate RPP Sekarang
          </button>
        </div>
      </div>

      <!-- RESULT VIEW (hidden by default) -->
      <div id="rpp-result-view" class="hidden">
        <div class="rpp-result-toolbar">
          <button id="btn-rpp-back" class="btn btn-secondary"><i class="fas fa-arrow-left mr-2"></i>Kembali</button>
          <div class="flex gap-3">
            <button id="btn-rpp-doc" class="btn btn-success"><i class="fas fa-download mr-2"></i>Unduh .doc</button>
            <button id="btn-rpp-print" class="btn btn-primary"><i class="fas fa-print mr-2"></i>Cetak / PDF</button>
          </div>
        </div>

        <div id="rpp-canvas" class="rpp-a4">
          <!-- Content rendered here -->
        </div>
      </div>
    </div>

    <style>
      /* ===== RPP Header ===== */
      .rpp-header {
        display: flex; align-items: center; justify-content: center;
        gap: 20px; margin-bottom: 32px; padding: 24px;
        background: linear-gradient(135deg, #1e1b4b, #312e81, #1e1b4b);
        border-radius: 20px;
        border: 1px solid rgba(99,102,241,0.3);
      }
      .rpp-logo-mark {
        width: 64px; height: 64px;
        background: rgba(99,102,241,0.15);
        border: 1px solid rgba(99,102,241,0.4);
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        font-size: 28px; color: #a5b4fc;
        box-shadow: 0 0 30px rgba(99,102,241,0.25);
      }
      .rpp-title {
        font-size: clamp(1.5rem, 5vw, 2.5rem); font-weight: 900;
        letter-spacing: -1.5px; line-height: 1; margin: 0;
        font-family: 'Orbitron','Inter',sans-serif;
        background: linear-gradient(90deg, #e0e7ff, #a5b4fc);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      }
      .rpp-subtitle {
        font-size: 0.8rem; font-weight: 800; margin-top: 6px;
        text-transform: uppercase; letter-spacing: 4px;
        color: #a5b4fc;
        display: flex; align-items: center; gap: 8px;
      }

      /* ===== Form Grid ===== */
      .rpp-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
      }
      @media (max-width: 1100px) { .rpp-grid { grid-template-columns: 1fr; } }

      .rpp-card {
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-border-subtle);
        border-radius: 16px;
        padding: 25px;
        display: flex; flex-direction: column; gap: 4px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      }
      .rpp-card-title {
        font-size: 1rem; font-weight: 900; text-transform: uppercase;
        letter-spacing: 1px; color: var(--color-text-primary);
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 8px;
      }
      .rpp-card-title i { color: #6366f1; font-size: 1.1rem; }
      .rpp-label {
        display: block; font-size: 10px; font-weight: 800;
        color: var(--color-text-secondary); text-transform: uppercase;
        letter-spacing: 1.2px; margin-top: 14px; margin-bottom: 5px;
      }
      .rpp-input {
        width: 100%; padding: 10px 14px;
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border-default);
        border-radius: 10px;
        color: var(--color-text-primary);
        font-size: 14px;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .rpp-input:focus {
        border-color: #6366f1; outline: none;
        box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
      }
      .rpp-input option { background: var(--color-bg-elevated); color: var(--color-text-primary); }
      .rpp-input::placeholder { color: var(--color-text-tertiary); }
      .rpp-input-bold { font-weight: 800; }
      .rpp-input-highlight { border: 2.5px solid #6366f1 !important; }
      .rpp-textarea { resize: vertical; min-height: 80px; font-family: inherit; }
      .rpp-row { display: flex; gap: 12px; }
      .rpp-col { flex: 1; }

      /* ===== Pertemuan Counter ===== */
      .rpp-counter {
        display: flex; align-items: center; justify-content: center;
        gap: 10px;
        background: var(--color-bg-tertiary);
        border: 1.5px solid var(--color-border-default);
        border-radius: 10px;
        padding: 0 10px; height: 42px;
      }
      .rpp-counter-btn {
        background: transparent; border: none;
        color: var(--color-text-primary);
        font-size: 18px; cursor: pointer; padding: 4px 8px;
        border-radius: 6px; transition: background 0.15s;
      }
      .rpp-counter-btn:hover { background: rgba(99,102,241,0.15); color: #6366f1; }
      .rpp-counter-val { font-weight: 800; font-size: 1rem; color: var(--color-text-primary); }

      /* ===== AI Engines ===== */
      .rpp-ai-engines {
        display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        margin-top: 4px;
      }
      .rpp-engine-option {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 12px;
        border: 1.5px solid var(--color-border-default);
        background: var(--color-bg-tertiary);
        border-radius: 10px;
        font-weight: 700; font-size: 11px;
        letter-spacing: 0.8px; text-transform: uppercase;
        color: var(--color-text-secondary);
        cursor: pointer; transition: all 0.2s;
      }
      .rpp-engine-option:has(input:checked) {
        border-color: #6366f1;
        background: rgba(99,102,241,0.12);
        color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
      }
      .rpp-engine-option input[type="radio"] { accent-color: #6366f1; }
      .rpp-engine-highlight { grid-column: span 2; }

      /* ===== Dimensi Profil Bar ===== */
      .rpp-profil-bar {
        margin-top: 20px; padding: 16px 24px;
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-border-subtle);
        border-radius: 16px;
        display: flex; flex-wrap: wrap; gap: 8px;
        align-items: center; justify-content: center;
        box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      }
      .rpp-profil-label {
        font-size: 0.8rem; font-weight: 900; color: var(--color-text-secondary);
        margin-right: 10px; text-transform: uppercase; letter-spacing: 2px;
      }
      .rpp-tag {
        padding: 6px 14px; font-size: 0.85rem; font-weight: 600;
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border-default);
        border-radius: 8px;
        color: var(--color-text-secondary);
        cursor: pointer; transition: all 0.2s;
      }
      .rpp-tag:hover {
        border-color: #6366f1;
        color: #6366f1;
      }
      .rpp-tag.active {
        background: rgba(99,102,241,0.12); color: #6366f1;
        border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        font-weight: 700;
      }

      /* ===== Generate Button ===== */
      .rpp-action-center { text-align: center; margin-top: 28px; }
      .rpp-generate-btn {
        padding: 14px 56px;
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        border: none; color: #fff;
        border-radius: 14px;
        font-weight: 800; font-size: 15px;
        letter-spacing: 1px; cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 8px 32px rgba(99,102,241,0.3);
      }
      .rpp-generate-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(99,102,241,0.45);
      }
      .rpp-generate-btn:disabled {
        opacity: 0.5; cursor: not-allowed;
        transform: none;
      }

      /* ===== Result View ===== */
      .rpp-result-toolbar {
        display: flex; justify-content: space-between; align-items: center;
        flex-wrap: wrap; gap: 12px;
        padding: 16px 24px; margin-bottom: 24px;
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-border-subtle);
        border-radius: 12px;
        position: sticky; top: 16px; z-index: 50;
      }
      .rpp-a4 {
        max-width: 21cm; margin: 0 auto;
        background: white; color: black;
        padding: 1.27cm;
        font-family: 'Times New Roman', Times, serif;
        font-size: 11pt; line-height: 1.5;
        box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        border-radius: 4px;
        min-height: 29.7cm;
      }
      .rpp-a4 h2 { text-transform: uppercase; margin: 10px 0; text-align: center; }
      .rpp-a4 h3, .rpp-a4 h4 { font-weight: bold; font-size: 11pt; margin: 10px 0; }
      .rpp-a4 table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
      .rpp-a4 th, .rpp-a4 td { border: 1px solid black; padding: 8px 12px; vertical-align: top; word-wrap: break-word; }
      .rpp-a4 .bullet-line {
        margin-bottom: 3px;
        margin-left: 12px; padding-left: 14px;
        text-indent: -14px; text-align: justify; line-height: 1.4;
      }
      .rpp-a4 .section-title {
        font-weight: bold; font-size: 11pt; text-transform: uppercase;
        margin-top: 16px; margin-bottom: 6px;
        text-decoration: underline;
      }

      @media print {
        #rpp-form-view, .rpp-result-toolbar, .sidebar, .app-header { display: none !important; }
        .rpp-a4 { box-shadow: none; margin: 0; padding: 0; }
      }
    </style>
  `;
}

export function initRpp() {
  const form = document.getElementById('rpp-form');
  if (!form) return;

  const selectedDimensions = new Set();

  // Profil dimension tags
  document.querySelectorAll('.rpp-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const dim = tag.dataset.dim;
      if (selectedDimensions.has(dim)) {
        selectedDimensions.delete(dim);
        tag.classList.remove('active');
      } else {
        selectedDimensions.add(dim);
        tag.classList.add('active');
      }
    });
  });

  // Pertemuan counter
  let pertemuan = 1;
  const prtCount = document.getElementById('prt-count');
  const prtInput = form.querySelector('input[name="jumlahPertemuan"]');

  document.getElementById('btn-prt-minus')?.addEventListener('click', () => {
    pertemuan = Math.max(1, pertemuan - 1);
    prtCount.textContent = pertemuan + 'P';
    prtInput.value = pertemuan;
  });
  document.getElementById('btn-prt-plus')?.addEventListener('click', () => {
    pertemuan = Math.min(10, pertemuan + 1);
    prtCount.textContent = pertemuan + 'P';
    prtInput.value = pertemuan;
  });

  // LKPD highlight
  const selLKPD = document.getElementById('sel-lkpd');
  if (selLKPD) {
    selLKPD.addEventListener('change', () => {
      selLKPD.classList.toggle('rpp-input-highlight', selLKPD.value === 'Ya');
    });
  }

  // Generate button
  document.getElementById('btn-generate-rpp')?.addEventListener('click', async () => {
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.profilLulusan = Array.from(selectedDimensions);

    if (!data.mataPelajaran || !data.mataPelajaran.trim()) {
      showToast('Harap isi Mata Pelajaran.', 'error'); return;
    }
    if (!data.topik || !data.topik.trim()) {
      showToast('Harap isi Topik/Materi terlebih dahulu.', 'error'); return;
    }

    const btn = document.getElementById('btn-generate-rpp');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sedang Menyusun RPP...';
    showLoading('AI sedang menyusun RPP Deep Learning...', 'Proses ini membutuhkan 30-60 detik');

    try {
      const result = await api('/rpp/generate', {
        method: 'POST',
        body: data,
        timeout: 300000 // 5 menit untuk AI generation agar tidak timeout
      });

      if (result.success) {
        renderResult(result.data, data);
        showToast('RPP berhasil digenerate!', 'success');
      } else {
        showToast(result.error?.message || 'Gagal generate RPP', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error: ' + err.message, 'error');
    } finally {
      hideLoading();
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-magic"></i> Generate RPP Sekarang';
    }
  });

  // Back
  document.getElementById('btn-rpp-back')?.addEventListener('click', () => {
    document.getElementById('rpp-form-view').classList.remove('hidden');
    document.getElementById('rpp-result-view').classList.add('hidden');
  });

  // Print
  document.getElementById('btn-rpp-print')?.addEventListener('click', () => window.print());

  // Download .doc
  document.getElementById('btn-rpp-doc')?.addEventListener('click', () => {
    const canvas = document.getElementById('rpp-canvas');
    if (!canvas) return;
    const html = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head><meta charset='utf-8'>
          <style>
            @page { size: A4; margin: 1.27cm; }
            body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; color: black; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 10px; table-layout: fixed; border: 1px solid black; }
            th, td { border: 1px solid black; padding: 8px 12px; vertical-align: top; word-wrap: break-word; }
            h2, h3, h4 { text-transform: uppercase; margin: 10px 0; }
            .bullet-line { margin-bottom: 3px; margin-left: 12px; padding-left: 14px; text-indent: -14px; text-align: justify; }
            .section-title { font-weight: bold; text-transform: uppercase; text-decoration: underline; }
          </style>
          </head>
          <body>${canvas.innerHTML}</body>
          </html>
        `;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RPP_${document.querySelector('input[name="topik"]')?.value || 'DeepLearning'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

/* ========== Formatting Helpers ========== */
function formatText(text) {
  if (!text && text !== 0) return '-';
  const safeText = String(text)
    .replace(/\\rightarrow/g, '→')
    .replace(/\$|\$/g, '')
    .replace(/\\\\/g, '');

  return safeText.split('\n').filter(l => l.trim()).map(line => {
    const t = line.trim();
    const isPoint = t.startsWith('-') || /^\d+\./.test(t);
    // Handle **bold** markers
    const parts = t.split('**');
    const html = parts.map((p, i) => i % 2 === 1 ? `<strong>${p}</strong>` : p).join('');
    return isPoint
      ? `<div class="bullet-line">${html}</div>`
      : `<div style="text-align:justify; margin-bottom:3px">${html}</div>`;
  }).join('');
}

/* ========== Render RPP Result ========== */
function renderResult(data, formData) {
  document.getElementById('rpp-form-view').classList.add('hidden');
  document.getElementById('rpp-result-view').classList.remove('hidden');

  const canvas = document.getElementById('rpp-canvas');
  let h = '';

  // Kop Sekolah Resmi
  h += `<table style="width:100%; border:none; border-bottom: 3px double black; margin-bottom: 20px;">
        <tr>
          <td style="width:15%; border:none; text-align:center; vertical-align:middle;">
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Tut_Wuri_Handayani.png/240px-Logo_Tut_Wuri_Handayani.png" width="80" height="80" alt="Logo" crossorigin="anonymous">
          </td>
          <td style="border:none; text-align:left; vertical-align:middle; padding-left:10px;">
             <div style="font-size:12pt; font-weight:bold; text-transform:uppercase; margin-bottom:2px">PEMERINTAH KABUPATEN PURWAKARTA</div>
             <div style="font-size:12pt; font-weight:bold; text-transform:uppercase; margin-bottom:2px">DINAS PENDIDIKAN</div>
             <div style="font-size:16pt; font-weight:900; text-transform:uppercase; margin-bottom:2px">${formData.namaSekolah || 'SD NEGERI 2 NANGERANG'}</div>
             <div style="font-size:10pt;">Alamat: Kp. Nangerang, Kec. Wanayasa, Kab. Purwakarta - Jawa Barat</div>
          </td>
        </tr>
      </table>`;

  // Judul RPP
  h += `<div style="text-align:center; margin-top:20px;">`;
  h += `<h2 style="font-size:14pt; text-decoration:underline; font-weight:bold; margin-bottom:4px; text-transform:uppercase;">MODUL AJAR / RPP</h2>`;
  h += `<h3 style="font-size:12pt; font-weight:bold; margin-top:0;">KURIKULUM MERDEKA</h3>`;
  h += `</div>`;

  // Identity Table
  h += `<table>
      <tr><td style="width:30%"><b>Satuan Pendidikan</b></td><td>: ${formData.namaSekolah || '-'}</td></tr>
      <tr><td><b>Nama Guru</b></td><td>: ${formData.namaGuru || '-'}</td></tr>
      <tr><td><b>Mata Pelajaran</b></td><td>: ${formData.mataPelajaran || '-'}</td></tr>
      <tr><td><b>Topik / Materi</b></td><td>: ${formData.topik || '-'}</td></tr>
      <tr><td><b>Kelas / Semester</b></td><td>: ${formData.jenjangKelas || '-'} / ${formData.semester || '-'}</td></tr>
      <tr><td><b>Alokasi Waktu</b></td><td>: ${formData.alokasiWaktu || '-'}</td></tr>
      <tr><td><b>Model Pembelajaran</b></td><td>: ${formData.strategi || '-'}</td></tr>
    </table>`;

  // A. Identifikasi
  const id = data.identifikasi || {};
  h += `<div class="section-title">A. IDENTIFIKASI MASALAH</div>`;
  h += `<table>
      <tr><td style="width:30%"><b>Kesiapan Belajar</b></td><td>${formatText(id.kesiapan)}</td></tr>
      <tr><td><b>Karakteristik Siswa</b></td><td>${formatText(id.karakteristik)}</td></tr>
      <tr><td><b>Kebutuhan Khusus</b></td><td>${formatText(id.kebutuhan)}</td></tr>
    </table>`;

  // B. Desain Pembelajaran
  const ds = data.desain || {};
  h += `<div class="section-title">B. DESAIN PEMBELAJARAN</div>`;
  h += `<table>
      <tr><td style="width:30%"><b>Capaian Pembelajaran</b></td><td>${formatText(ds.capaian)}</td></tr>
      <tr><td><b>Metode & Strategi</b></td><td>${formatText(ds.metode_pembelajaran || ds.metode_relevan)}</td></tr>
    </table>`;

  // Sarana Prasarana
  const sp = ds.sarana_prasarana || {};
  if (sp.sumber_belajar || sp.media || sp.alat_peraga) {
    h += `<table>
          <tr><td style="width:30%"><b>Sumber Belajar</b></td><td>${formatText(sp.sumber_belajar)}</td></tr>
          <tr><td><b>Media</b></td><td>${formatText(sp.media)}</td></tr>
          <tr><td><b>Alat Peraga</b></td><td>${formatText(sp.alat_peraga)}</td></tr>
        </table>`;
  }

  // Diferensiasi
  const dif = ds.diferensiasi || {};
  if (dif.visual || dif.auditori || dif.kinestetik) {
    h += `<table>
          <tr><th colspan="2" style="text-align:center; background:#f3f4f6">Diferensiasi Pembelajaran</th></tr>
          <tr><td style="width:30%"><b>Visual</b></td><td>${formatText(dif.visual)}</td></tr>
          <tr><td><b>Auditori</b></td><td>${formatText(dif.auditori)}</td></tr>
          <tr><td><b>Kinestetik</b></td><td>${formatText(dif.kinestetik)}</td></tr>
        </table>`;
  }

  // C. Skenario Pembelajaran
  h += `<div class="section-title">C. SKENARIO PEMBELAJARAN</div>`;

  const pertemuan = data.pertemuan || [];
  pertemuan.forEach(p => {
    h += `<h4 style="text-decoration:underline; margin-top:16px">PERTEMUAN ${p.nomor}</h4>`;

    // Tujuan Pertemuan
    const tp = p.tujuan_pertemuan || p.tujuan || [];
    if (tp.length > 0) {
      h += `<div style="margin-bottom:8px"><b>Tujuan Pembelajaran:</b></div>`;
      h += `<ol style="margin:0 0 10px 20px">`;
      tp.forEach(t => { h += `<li style="text-align:justify">${t}</li>`; });
      h += `</ol>`;
    }

    // Kegiatan Table
    const k = p.kegiatan || {};
    const phases = [
      { key: 'pendahuluan', label: 'PENDAHULUAN', color: '#e0f2fe' },
      { key: 'mindful', label: 'MINDFUL (Berkesadaran)', color: '#fef3c7' },
      { key: 'meaningful', label: 'MEANINGFUL (Bermakna)', color: '#dcfce7' },
      { key: 'joyful', label: 'JOYFUL (Menggembirakan)', color: '#fce7f3' },
      { key: 'penutup', label: 'PENUTUP', color: '#f3e8ff' }
    ];

    h += `<table>
          <tr style="background:#1e293b; color:white">
            <th style="width:25%; color:white">Fase</th>
            <th style="width:55%; color:white">Kegiatan</th>
            <th style="width:20%; color:white; text-align:center">Waktu</th>
          </tr>`;

    phases.forEach(ph => {
      const content = k[ph.key];
      if (content) {
        h += `<tr>
                  <td style="background:${ph.color}; font-weight:bold">${ph.label}</td>
                  <td>${formatText(content.isi)}</td>
                  <td style="text-align:center; font-weight:bold">${content.waktu || '-'}</td>
                </tr>`;
      }
    });
    h += `</table>`;

    // LKPD
    if (p.lkpd) {
      h += `<div style="margin-top:10px; page-break-before:auto">`;
      h += `<h4 style="text-decoration:underline">LAMPIRAN LKPD - PERTEMUAN ${p.nomor}</h4>`;
      h += `<table>
              <tr><td style="width:25%"><b>Petunjuk</b></td><td>${formatText(p.lkpd.identitas_petunjuk)}</td></tr>
              <tr><td><b>Tujuan (Siswa)</b></td><td>${formatText(p.lkpd.tujuan_siswa)}</td></tr>
              <tr><td><b>Masalah/Kasus</b></td><td>${formatText(p.lkpd.masalah)}</td></tr>
              <tr><td><b>Aktivitas</b></td><td>${formatText(p.lkpd.aktivitas)}</td></tr>
              <tr><td><b>Hasil Kerja</b></td><td>${formatText(p.lkpd.hasil_kerja)}</td></tr>
              <tr><td><b>Soal Penilaian</b></td><td>${formatText(p.lkpd.penilaian)}</td></tr>
            </table>`;
      h += `</div>`;
    }
  });

  // D. Asesmen
  const asm = data.asesmen || {};
  if (asm.formatif || asm.sumatif) {
    h += `<div class="section-title">D. ASESMEN</div>`;
    h += `<table>
          <tr><td style="width:30%"><b>Formatif</b></td><td>${formatText(asm.formatif)}</td></tr>
          <tr><td><b>Sumatif</b></td><td>${formatText(asm.sumatif)}</td></tr>
        </table>`;
  }

  // Tanda Tangan
  h += `<div style="margin-top:40px; display:flex; justify-content:space-between">
      <div style="text-align:center; width:45%">
        <p>Mengetahui,</p>
        <p>Kepala Sekolah</p>
        <br><br><br>
        <p style="text-decoration:underline; font-weight:bold">${formData.namaKepalaSekolah || '..............................'}</p>
        <p>NIP. ${formData.nipKepalaSekolah || '..............................'}</p>
      </div>
      <div style="text-align:center; width:45%">
        <p>&nbsp;</p>
        <p>Guru Pengampu</p>
        <br><br><br>
        <p style="text-decoration:underline; font-weight:bold">${formData.namaGuru || '..............................'}</p>
        <p>NIP. ${formData.nipGuru || '..............................'}</p>
      </div>
    </div>`;

  canvas.innerHTML = h;
  window.scrollTo(0, 0);
}
