import { api } from '../api.js';
import { showToast, showLoading, hideLoading, escapeHtml } from '../utils.js';
import { state } from '../state.js';
import { renderLockedFeature } from '../components.js';

export async function renderSlide() {
    if (!state.user) {
        return renderLockedFeature(
            'Slide Presentasi Otomatis',
            'Buat presentasi pembelajaran yang menarik & interaktif dalam hitungan detik. Fitur ini dirancang khusus untuk membantu guru membuat media ajar visual tanpa ribet.',
            ['Generate Slide dari Topik Apapun', 'Ekspor ke PowerPoint (PPTX)', 'Materi Disesuaikan dengan Target Audiens', 'Layout & Desain Profesional']
        );
    }

    return `
    <div class="animate-fade-in space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-display font-bold text-[var(--color-text-primary)]">Slide Generator</h1>
          <p class="text-[var(--color-text-secondary)]">Buat presentasi menarik dalam hitungan detik dengan AI</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Input Form -->
        <div class="bg-[var(--color-bg-elevated)] p-6 rounded-2xl shadow-sm border border-[var(--color-border-subtle)]">
          <form id="slide-form" class="space-y-4">
            
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Topik Presentasi</label>
              <input type="text" name="topic" required placeholder="Contoh: Tata Surya, Sejarah Kemerdekaan, Pecahan" class="w-full px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary)] border-transparent focus:bg-[var(--color-bg-primary)] focus:border-primary-500 transition-colors">
            </div>

            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Target Audiens</label>
              <select name="audience" class="w-full px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary)] border-transparent focus:bg-[var(--color-bg-primary)] focus:border-primary-500 transition-colors">
                <option value="Siswa SD Kelas 1-3">Siswa SD Kelas 1-3</option>
                <option value="Siswa SD Kelas 4-6">Siswa SD Kelas 4-6</option>
                <option value="Guru / Rekan Sejawat">Guru / Rekan Sejawat</option>
                <option value="Orang Tua Siswa">Orang Tua Siswa</option>
              </select>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Jumlah Slide</label>
                <input type="number" name="slideCount" value="7" min="3" max="15" class="w-full px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary)] border-transparent focus:bg-[var(--color-bg-primary)] focus:border-primary-500 transition-colors">
              </div>
              <div>
                 <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Model AI</label>
                 <select name="model" class="w-full px-4 py-2 rounded-xl bg-[var(--color-bg-tertiary)] border-transparent focus:bg-[var(--color-bg-primary)] focus:border-primary-500 transition-colors">
                    <option value="gemini">Gemini (Cepat)</option>
                    <option value="groq">Llama 3 (Cerdas)</option>
                 </select>
              </div>
            </div>

            <button type="submit" class="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5">
              <i class="fas fa-magic mr-2"></i>Generate Slide
            </button>
          </form>
        </div>

        <!-- Result Preview -->
        <div class="space-y-4">
          <div id="result-container" class="hidden bg-[var(--color-bg-elevated)] p-6 rounded-2xl shadow-sm border border-[var(--color-border-subtle)] h-full min-h-[500px] flex flex-col">
             <div class="flex justify-between items-center mb-4">
                <h3 class="font-display font-bold text-lg text-[var(--color-text-primary)]">Preview Slide</h3>
                <button id="btn-export-pptx" class="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg shadow-sm">
                   <i class="fas fa-file-powerpoint mr-1"></i> Export PPTX
                </button>
             </div>
             
             <!-- Slide Preview Carousel -->
             <div class="flex-1 relative bg-gray-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center p-8 group">
                 <div id="slide-preview-content" class="text-white text-center">
                     <!-- Current Slide Content -->
                 </div>
                 
                 <!-- Controls -->
                 <button id="prev-slide" class="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fas fa-chevron-left"></i>
                 </button>
                 <button id="next-slide" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="fas fa-chevron-right"></i>
                 </button>
                 
                 <div id="slide-indicator" class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    <!-- Dots -->
                 </div>
             </div>
             
             <div class="mt-4 p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border-default)]">
                 <h4 class="text-xs font-bold uppercase text-[var(--color-text-secondary)] mb-2">Catatan Pembicara</h4>
                 <p id="speaker-notes" class="text-sm text-[var(--color-text-primary)] italic">...</p>
             </div>
          </div>
          
          <!-- Empty State -->
          <div id="empty-state" class="bg-[var(--color-bg-elevated)] p-8 rounded-2xl shadow-sm border border-[var(--color-border-subtle)] h-full flex flex-col items-center justify-center text-center opacity-70">
             <div class="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                <i class="fas fa-images text-3xl text-primary-500"></i>
             </div>
             <h3 class="font-display font-bold text-lg text-[var(--color-text-primary)]">Siap Membuat Presentasi?</h3>
             <p class="text-[var(--color-text-secondary)] max-w-xs mx-auto mt-2">Isi formulir, pilih jumlah slide, dan dapatkan file PPTX siap pakai dalam sekejap.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initSlide() {
    const form = document.getElementById('slide-form');
    const resultContainer = document.getElementById('result-container');
    const emptyState = document.getElementById('empty-state');
    const btnExport = document.getElementById('btn-export-pptx');

    const previewContent = document.getElementById('slide-preview-content');
    const speakerNotes = document.getElementById('speaker-notes');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    const indicators = document.getElementById('slide-indicator');

    let currentSlides = [];
    let currentIndex = 0;
    let currentTitle = 'Presentasi';

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            showLoading('Merancang slide presentasi...');

            try {
                const res = await api('/presentation/generate', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });

                if (res.success) {
                    currentSlides = res.data.slides || [];
                    currentTitle = res.data.title || data.topic;
                    currentIndex = 0;

                    if (currentSlides.length > 0) {
                        // Switch view
                        emptyState.classList.add('hidden');
                        resultContainer.classList.remove('hidden');

                        updatePreview();
                        showToast('Slide berhasil dibuat!', 'success');
                    } else {
                        showToast('Gagal membuat slide', 'error');
                    }
                } else {
                    showToast(res.message || 'Gagal membuat slide', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Terjadi kesalahan network', 'error');
            } finally {
                hideLoading();
            }
        });
    }

    function updatePreview() {
        if (currentSlides.length === 0) return;
        const slide = currentSlides[currentIndex];

        previewContent.innerHTML = `
         <h2 class="text-3xl font-bold mb-4">${slide.title}</h2>
         <ul class="text-left list-disc pl-6 space-y-2 text-lg">
            ${slide.content?.bullets?.map(b => `<li>${b}</li>`).join('') || ''}
         </ul>
      `;
        speakerNotes.textContent = slide.content?.speakerNotes || 'Tidak ada catatan.';

        // Update dots
        indicators.innerHTML = currentSlides.map((_, i) => `
         <div class="w-2 h-2 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/30'}"></div>
     `).join('');
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updatePreview();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentIndex < currentSlides.length - 1) {
                currentIndex++;
                updatePreview();
            }
        });
    }

    if (btnExport) {
        btnExport.addEventListener('click', async () => {
            if (currentSlides.length === 0) return;

            showLoading('Mengexport PPTX...');
            try {
                // Dynamic import PptxGenJS
                const pptxgen = (await import('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.es.js')).default;

                const pres = new pptxgen();
                pres.layout = 'LAYOUT_16x9';

                // Add Slides
                currentSlides.forEach(s => {
                    let slide = pres.addSlide();

                    // Title
                    slide.addText(s.title, { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 32, bold: true, color: '363636' });

                    // Content
                    if (s.content?.bullets) {
                        slide.addText(s.content.bullets.map(b => ({ text: b, options: { bullet: true } })),
                            { x: 0.5, y: 1.8, w: 9, h: 3, fontSize: 18, color: '666666' });
                    }

                    // Notes
                    if (s.content?.speakerNotes) {
                        slide.addNotes(s.content.speakerNotes);
                    }
                });

                await pres.writeFile({ fileName: `${currentTitle}.pptx` });
                showToast('PPTX berhasil didownload', 'success');

            } catch (e) {
                console.error(e);
                showToast('Gagal export PPTX: ' + e.message, 'error');
            } finally {
                hideLoading();
            }
        });
    }
}
