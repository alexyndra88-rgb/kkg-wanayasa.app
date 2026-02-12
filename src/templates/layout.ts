// Generate a version hash at server start time for cache-busting
const APP_VERSION = Date.now().toString(36);

export function renderHTML(): string {
  return `<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Digital KKG Gugus 3 Wanayasa</title>
  <meta name="description" content="Portal Digital Kelompok Kerja Guru (KKG) Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta">
  <meta name="theme-color" content="#4f46e5">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Icons -->
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" rel="stylesheet">
  
  <!-- Fonts (Preload for performance) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- DOCX Export Libraries -->
  <script src="https://cdn.jsdelivr.net/npm/docx@7.1.0/build/index.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
  
  <!-- Chart.js for Statistics -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            display: ['Outfit', 'sans-serif'],
          },
          colors: {
            // Premium Indigo Palette
            primary: { 
              50:'#eef2ff', 100:'#e0e7ff', 200:'#c7d2fe', 300:'#a5b4fc', 
              400:'#818cf8', 500:'#6366f1', 600:'#4f46e5', 700:'#4338ca', 
              800:'#3730a3', 900:'#312e81', 950:'#1e1b4b' 
            },
            // Rich Violet Accents
            secondary: { 
              50:'#f5f3ff', 100:'#ede9fe', 200:'#ddd6fe', 300:'#c4b5fd', 
              400:'#a78bfa', 500:'#8b5cf6', 600:'#7c3aed', 700:'#6d28d9', 
              800:'#5b21b6', 900:'#4c1d95', 950:'#2e1065' 
            }
          }
        }
      }
    }
  </script>
  
  <link rel="stylesheet" href="/static/style.css?v=${APP_VERSION}">
</head>
<body class="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] antialiased transition-colors duration-300 selection:bg-primary-500 selection:text-white">
  <div id="app">
    <!-- Initial Loading State (Premium) -->
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-[var(--color-bg-primary)] z-50">
      <div class="relative mb-6">
        <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
            <i class="fas fa-shapes text-primary-600 text-xl animate-pulse"></i>
        </div>
      </div>
      <h2 class="text-xl font-display font-bold text-[var(--color-text-primary)] tracking-tight mb-2">KKG Portal</h2>
      <p id="loading-status" class="text-sm text-[var(--color-text-tertiary)] font-medium animate-pulse">Memuat Aplikasi...</p>
    </div>
  </div>
  
  <div id="toast-container"></div>
  
  <noscript>
    <div class="fixed inset-0 flex items-center justify-center bg-white z-[9999] text-center p-4">
      <div>
        <h1 class="text-2xl font-bold text-red-600 mb-2">JavaScript Diperlukan</h1>
        <p class="text-gray-600">Aplikasi ini memerlukan JavaScript untuk berjalan. Mohon aktifkan JavaScript di browser Anda.</p>
      </div>
    </div>
  </noscript>

  <script type="module" src="/static/js/main.js?v=${APP_VERSION}"></script>
</body>
</html>`;
}


