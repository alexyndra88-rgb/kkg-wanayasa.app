
import { api } from '../api.js';
import { state } from '../state.js';
import { formatDate, formatDateTime, escapeHtml, nl2br, showToast } from '../utils.js';
import { navigate } from '../router.js';

export async function renderForum() {
    let threads = [];
    try { const res = await api('/forum/threads'); threads = res.data || []; } catch (e) { }

    return `
  <div class="fade-in max-w-4xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800"><i class="fas fa-comments text-pink-500 mr-2"></i>Forum Diskusi</h1>
        <p class="text-gray-500 text-sm mt-1">Ruang diskusi dan sharing antar guru</p>
      </div>
      ${state.user ? `<button onclick="showNewThread()" class="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600"><i class="fas fa-plus mr-1"></i>Topik Baru</button>` : ''}
    </div>

    <div id="new-thread-modal" class="hidden mb-6"></div>

    <div id="thread-list" class="space-y-4">
      ${threads.length > 0 ? threads.map(t => `
        <div onclick="viewThread(${t.id})" class="bg-white rounded-xl p-5 border hover:border-pink-200 transition shadow-sm cursor-pointer">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center flex-shrink-0">
              <i class="fas fa-comment-dots text-pink-500"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                ${t.is_pinned ? '<span class="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full"><i class="fas fa-thumbtack mr-1"></i>Pin</span>' : ''}
                ${t.kategori ? `<span class="px-2 py-0.5 bg-pink-50 text-pink-600 text-xs rounded-full">${escapeHtml(t.kategori)}</span>` : ''}
              </div>
              <h3 class="font-bold text-gray-800">${escapeHtml(t.judul)}</h3>
              <p class="text-sm text-gray-500 mt-1 line-clamp-2">${escapeHtml((t.isi || '').substring(0, 150))}...</p>
              <div class="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span><i class="fas fa-user mr-1"></i>${escapeHtml(t.author_name || '-')}</span>
                <span><i class="fas fa-clock mr-1"></i>${formatDateTime(t.created_at)}</span>
                <span><i class="fas fa-reply mr-1"></i>${t.reply_count || 0} balasan</span>
              </div>
            </div>
          </div>
        </div>
      `).join('') : '<div class="text-center py-12 text-gray-400"><i class="fas fa-comment-slash text-4xl mb-4 block"></i>Belum ada diskusi.</div>'}
    </div>

    <div id="thread-detail" class="hidden mt-8"></div>
  </div>`;
}

// Global functions
window.showNewThread = function () {
    const container = document.getElementById('new-thread-modal');
    container.classList.remove('hidden');
    container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-lg p-6 border border-pink-200">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-plus-circle text-pink-500 mr-2"></i>Buat Topik Baru</h3>
      <form onsubmit="createThread(event)">
        <input type="text" name="judul" required placeholder="Judul Topik" class="w-full px-4 py-3 border rounded-xl mb-3">
        <select name="kategori" class="w-full px-4 py-3 border rounded-xl mb-3">
          <option value="umum">Umum</option><option value="best-practice">Best Practice</option><option value="kurikulum">Kurikulum</option>
          <option value="teknologi">Teknologi</option><option value="tanya-jawab">Tanya Jawab</option>
        </select>
        <textarea name="isi" required rows="4" placeholder="Tulis isi diskusi Anda..." class="w-full px-4 py-3 border rounded-xl mb-3"></textarea>
        <div class="flex gap-2">
          <button type="submit" class="px-6 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600">Posting</button>
          <button type="button" onclick="document.getElementById('new-thread-modal').classList.add('hidden')" class="px-6 py-2 bg-gray-200 rounded-lg font-medium">Batal</button>
        </div>
      </form>
    </div>`;
}

window.createThread = async function (e) {
    e.preventDefault();
    const form = e.target;
    try {
        await api('/forum/threads', { method: 'POST', body: { judul: form.judul.value, isi: form.isi.value, kategori: form.kategori.value } });
        showToast('Topik berhasil dibuat!');
        window.location.reload();
    } catch (e) { showToast(e.message, 'error'); }
}

window.viewThread = async function (id) {
    try {
        const res = await api(`/forum/threads/${id}`);
        const { thread, replies } = res.data;
        const container = document.getElementById('thread-detail');
        container.classList.remove('hidden');
        container.innerHTML = `
      <div class="bg-white rounded-2xl shadow-lg p-6 border">
        <button onclick="document.getElementById('thread-detail').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 float-right"><i class="fas fa-times text-lg"></i></button>
        <h2 class="font-bold text-xl text-gray-800 mb-2">${escapeHtml(thread.judul)}</h2>
        <div class="text-xs text-gray-400 mb-4"><i class="fas fa-user mr-1"></i>${escapeHtml(thread.author_name)} | <i class="fas fa-clock mr-1"></i>${formatDateTime(thread.created_at)}</div>
        <div class="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-700">${nl2br(thread.isi)}</div>
        
        <h3 class="font-bold text-gray-700 mb-4">Balasan (${replies.length})</h3>
        <div class="space-y-3 mb-6">
          ${replies.map(r => `
            <div class="bg-gray-50 rounded-xl p-4 border-l-4 border-pink-300">
              <div class="text-xs text-gray-400 mb-2"><strong class="text-gray-600">${escapeHtml(r.author_name)}</strong> | ${formatDateTime(r.created_at)}</div>
              <div class="text-sm text-gray-700">${nl2br(r.isi)}</div>
            </div>
          `).join('') || '<p class="text-gray-400 text-sm">Belum ada balasan.</p>'}
        </div>

        ${state.user ? `
          <form onsubmit="replyThread(event, ${thread.id})" class="border-t pt-4">
            <textarea name="isi" required rows="3" placeholder="Tulis balasan Anda..." class="w-full px-4 py-3 border rounded-xl mb-3"></textarea>
            <button type="submit" class="px-6 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600"><i class="fas fa-reply mr-1"></i>Balas</button>
          </form>
        ` : '<p class="text-sm text-gray-400 border-t pt-4"><a href="javascript:void(0)" onclick="navigate(\'login\')" class="text-blue-600 underline">Login</a> untuk membalas.</p>'}
      </div>`;
        container.scrollIntoView({ behavior: 'smooth' });
    } catch (e) { showToast(e.message, 'error'); }
}

window.replyThread = async function (e, threadId) {
    e.preventDefault();
    try {
        await api(`/forum/threads/${threadId}/reply`, { method: 'POST', body: { isi: e.target.isi.value } });
        showToast('Balasan berhasil dikirim!');
        viewThread(threadId);
    } catch (e) { showToast(e.message, 'error'); }
}
