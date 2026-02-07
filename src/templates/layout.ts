export function renderHTML(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Digital KKG Gugus 3 Wanayasa</title>
  <meta name="description" content="Portal Digital Kelompok Kerja Guru (KKG) Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b' },
            secondary: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' },
            accent: { 50:'#f0f9ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1',800:'#075985',900:'#0c4a6e' }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .gradient-bg { background: linear-gradient(135deg, #1e3a8a 0%, #065f46 50%, #0c4a6e 100%); }
    .gradient-card { background: linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%); }
    .glass { background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); }
    .fade-in { animation: fadeIn 0.3s ease-in; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #2563eb; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; display: inline-block; }
    @keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
    .nav-active { background: rgba(255,255,255,0.15); border-bottom: 2px solid #34d399; }
    .toast { position:fixed; top:20px; right:20px; z-index:9999; padding:12px 24px; border-radius:8px; color:#fff; font-weight:500; animation: slideIn 0.3s ease; }
    @keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
    .toast-success { background:#059669; }
    .toast-error { background:#dc2626; }
    .modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:50; display:flex; align-items:center; justify-content:center; }
    .modal-content { background:#fff; border-radius:12px; max-width:600px; width:90%; max-height:90vh; overflow-y:auto; padding:24px; }
    .tab-active { color: #2563eb; border-bottom: 2px solid #2563eb; }
    [x-cloak] { display: none !important; }
    .mobile-menu { transform: translateX(-100%); transition: transform 0.3s ease; }
    .mobile-menu.open { transform: translateX(0); }
    .surat-preview { white-space: pre-wrap; font-family: 'Times New Roman', serif; line-height: 1.8; }
    .proker-preview { white-space: pre-wrap; font-family: 'Times New Roman', serif; line-height: 1.8; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div id="app"></div>
  <div id="toast-container"></div>
  <script src="/static/app.js"></script>
</body>
</html>`;
}
