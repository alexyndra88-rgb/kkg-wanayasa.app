
import { api } from '../api.js';
import { state } from '../state.js';
import { escapeHtml, showToast } from '../utils.js';

let currentDate = new Date();
let currentView = 'month';
let events = [];

export async function renderKalender() {
    return `
  <div class="fade-in max-w-6xl mx-auto py-8 px-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100"><i class="fas fa-calendar-alt text-blue-500 mr-2"></i>Kalender Kegiatan</h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Jadwal kegiatan dan event KKG</p>
      </div>
      <div class="flex gap-2">
        ${state.user?.role === 'admin' ? `
          <button onclick="syncKegiatanToCalendar()" class="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50">
            <i class="fas fa-sync-alt mr-1"></i>Sync Kegiatan
          </button>
        ` : ''}
        ${state.user ? `
          <button onclick="showAddEvent()" class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
            <i class="fas fa-plus mr-1"></i>Tambah Event
          </button>
        ` : ''}
      </div>
    </div>

    <!-- Calendar Header -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div class="flex items-center gap-2">
          <button onclick="navigateMonth(-1)" class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <i class="fas fa-chevron-left text-gray-600 dark:text-gray-300"></i>
          </button>
          <h2 id="calendar-title" class="text-xl font-bold text-gray-800 dark:text-gray-100 min-w-[200px] text-center"></h2>
          <button onclick="navigateMonth(1)" class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <i class="fas fa-chevron-right text-gray-600 dark:text-gray-300"></i>
          </button>
          <button onclick="goToToday()" class="ml-2 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50">
            Hari Ini
          </button>
        </div>
        <div class="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button onclick="switchView('month')" id="view-month" class="px-3 py-1 text-sm rounded-md bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 shadow-sm font-medium">
            Bulan
          </button>
          <button onclick="switchView('week')" id="view-week" class="px-3 py-1 text-sm rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600/50">
            Minggu
          </button>
          <button onclick="switchView('list')" id="view-list" class="px-3 py-1 text-sm rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600/50">
            Daftar
          </button>
        </div>
      </div>

      <!-- Calendar Body -->
      <div id="calendar-body" class="p-4"></div>
    </div>

    <!-- Add Event Modal -->
    <div id="event-modal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold text-xl text-gray-800 dark:text-gray-100" id="event-modal-title"><i class="fas fa-calendar-plus text-blue-500 mr-2"></i>Tambah Event</h3>
          <button onclick="closeEventModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
        </div>
        <form id="event-form" onsubmit="saveEvent(event)">
          <input type="hidden" id="event-id" value="">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Judul Event <span class="text-red-500">*</span></label>
              <input type="text" id="event-title" required class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl" placeholder="Judul event...">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tanggal Mulai <span class="text-red-500">*</span></label>
                <input type="date" id="event-start-date" required class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tanggal Selesai</label>
                <input type="date" id="event-end-date" class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Waktu Mulai</label>
                <input type="time" id="event-start-time" class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Waktu Selesai</label>
                <input type="time" id="event-end-time" class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tipe Event</label>
              <select id="event-type" class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl">
                <option value="meeting">🗓️ Rapat</option>
                <option value="training">📚 Pelatihan</option>
                <option value="deadline">⏰ Deadline</option>
                <option value="holiday">🏖️ Libur</option>
                <option value="other">📌 Lainnya</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Lokasi</label>
              <input type="text" id="event-location" class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl" placeholder="Tempat pelaksanaan...">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Deskripsi</label>
              <textarea id="event-description" rows="3" class="w-full px-4 py-3 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl" placeholder="Deskripsi event..."></textarea>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Warna</label>
              <div class="flex gap-2" id="color-picker">
                ${['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((c, i) => `
                  <button type="button" onclick="selectColor('${c}')" data-color="${c}" class="w-8 h-8 rounded-full border-2 ${i === 0 ? 'border-gray-800 dark:border-white ring-2 ring-offset-2 ring-blue-500' : 'border-transparent'}" style="background: ${c}"></button>
                `).join('')}
              </div>
              <input type="hidden" id="event-color" value="#3B82F6">
            </div>
            <div class="flex gap-3 pt-4">
              <button type="button" onclick="closeEventModal()" class="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600">
                Batal
              </button>
              <button type="submit" class="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600">
                <i class="fas fa-save mr-1"></i>Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}

// Initialize calendar after render
export async function initKalender() {
    await loadEvents();
    renderCalendar();
}

async function loadEvents() {
    try {
        const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const res = await api(`/calendar/events?month=${month}`);
        events = res.data || [];
    } catch (e) {
        console.error('Load events error:', e);
        events = [];
    }
}

function renderCalendar() {
    const title = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    document.getElementById('calendar-title').textContent = title;

    if (currentView === 'month') {
        renderMonthView();
    } else if (currentView === 'week') {
        renderWeekView();
    } else {
        renderListView();
    }
}

function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    let html = `
        <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-600 rounded-xl overflow-hidden">
            ${days.map(d => `
                <div class="bg-gray-50 dark:bg-gray-700 py-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">${d}</div>
            `).join('')}
    `;

    // Empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
        html += `<div class="bg-gray-50 dark:bg-gray-700/50 min-h-[100px] p-1"></div>`;
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const dayEvents = events.filter(e => e.start_date === dateStr);

        html += `
            <div class="bg-white dark:bg-gray-800 min-h-[100px] p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition" onclick="showAddEvent('${dateStr}')">
                <div class="flex items-center justify-between p-1">
                    <span class="${isToday ? 'w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold' : 'text-gray-700 dark:text-gray-200 font-medium'}">${day}</span>
                    ${dayEvents.length > 3 ? `<span class="text-xs text-gray-400">+${dayEvents.length - 3}</span>` : ''}
                </div>
                <div class="space-y-1 mt-1">
                    ${dayEvents.slice(0, 3).map(e => `
                        <div onclick="event.stopPropagation(); viewEvent(${e.id})" class="text-xs px-1.5 py-0.5 rounded truncate text-white" style="background: ${e.color || '#3B82F6'}">
                            ${escapeHtml(e.title)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Empty cells after last day
    const remainingCells = (7 - ((startDayOfWeek + daysInMonth) % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
        html += `<div class="bg-gray-50 dark:bg-gray-700/50 min-h-[100px] p-1"></div>`;
    }

    html += '</div>';
    document.getElementById('calendar-body').innerHTML = html;
}

function renderWeekView() {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const today = new Date().toISOString().split('T')[0];

    let html = '<div class="grid grid-cols-7 gap-2">';

    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = dateStr === today;
        const dayEvents = events.filter(e => e.start_date === dateStr);

        html += `
            <div class="bg-white dark:bg-gray-800 rounded-xl p-3 border dark:border-gray-700 ${isToday ? 'ring-2 ring-blue-500' : ''}">
                <div class="text-center mb-3">
                    <div class="text-xs text-gray-500 dark:text-gray-400">${days[i]}</div>
                    <div class="${isToday ? 'w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-blue-500 text-white' : ''} text-lg font-bold text-gray-800 dark:text-gray-100">${date.getDate()}</div>
                </div>
                <div class="space-y-2">
                    ${dayEvents.length === 0 ? '<p class="text-xs text-gray-400 text-center">-</p>' : ''}
                    ${dayEvents.map(e => `
                        <div onclick="viewEvent(${e.id})" class="p-2 rounded-lg text-white text-xs cursor-pointer hover:opacity-80 transition" style="background: ${e.color || '#3B82F6'}">
                            <div class="font-medium truncate">${escapeHtml(e.title)}</div>
                            ${e.start_time ? `<div class="opacity-75"><i class="fas fa-clock mr-1"></i>${e.start_time}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += '</div>';
    document.getElementById('calendar-body').innerHTML = html;
}

function renderListView() {
    const sortedEvents = [...events].sort((a, b) => a.start_date.localeCompare(b.start_date));

    if (sortedEvents.length === 0) {
        document.getElementById('calendar-body').innerHTML = `
            <div class="text-center py-12 text-gray-400 dark:text-gray-500">
                <i class="fas fa-calendar-xmark text-4xl mb-4"></i>
                <p>Tidak ada event di bulan ini</p>
            </div>
        `;
        return;
    }

    let html = '<div class="space-y-3">';

    sortedEvents.forEach(e => {
        const eventDate = new Date(e.start_date);
        html += `
            <div onclick="viewEvent(${e.id})" class="flex items-start gap-4 p-4 bg-white dark:bg-gray-700/50 rounded-xl border dark:border-gray-700 hover:shadow-md cursor-pointer transition">
                <div class="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white" style="background: ${e.color || '#3B82F6'}">
                    <span class="text-xl font-bold">${eventDate.getDate()}</span>
                    <span class="text-xs">${eventDate.toLocaleDateString('id-ID', { month: 'short' })}</span>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-gray-800 dark:text-gray-100">${escapeHtml(e.title)}</h4>
                    <div class="flex flex-wrap gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        ${e.start_time ? `<span><i class="fas fa-clock mr-1"></i>${e.start_time}${e.end_time ? ' - ' + e.end_time : ''}</span>` : ''}
                        ${e.location ? `<span><i class="fas fa-map-marker-alt mr-1"></i>${escapeHtml(e.location)}</span>` : ''}
                    </div>
                    ${e.description ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">${escapeHtml(e.description)}</p>` : ''}
                </div>
                <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                    ${getEventTypeLabel(e.event_type)}
                </span>
            </div>
        `;
    });

    html += '</div>';
    document.getElementById('calendar-body').innerHTML = html;
}

function getEventTypeLabel(type) {
    const labels = { meeting: 'Rapat', training: 'Pelatihan', deadline: 'Deadline', holiday: 'Libur', other: 'Lainnya' };
    return labels[type] || type;
}

// Navigation
window.navigateMonth = async function (delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    await loadEvents();
    renderCalendar();
}

window.goToToday = async function () {
    currentDate = new Date();
    await loadEvents();
    renderCalendar();
}

window.switchView = function (view) {
    currentView = view;

    ['month', 'week', 'list'].forEach(v => {
        const btn = document.getElementById(`view-${v}`);
        if (v === view) {
            btn?.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-800', 'dark:text-gray-100', 'shadow-sm', 'font-medium');
            btn?.classList.remove('text-gray-600', 'dark:text-gray-400');
        } else {
            btn?.classList.remove('bg-white', 'dark:bg-gray-600', 'text-gray-800', 'dark:text-gray-100', 'shadow-sm', 'font-medium');
            btn?.classList.add('text-gray-600', 'dark:text-gray-400');
        }
    });

    renderCalendar();
}

// Event Modal
window.showAddEvent = function (date = null) {
    document.getElementById('event-modal').classList.remove('hidden');
    document.getElementById('event-modal-title').innerHTML = '<i class="fas fa-calendar-plus text-blue-500 mr-2"></i>Tambah Event';
    document.getElementById('event-form').reset();
    document.getElementById('event-id').value = '';
    document.getElementById('event-color').value = '#3B82F6';

    if (date) {
        document.getElementById('event-start-date').value = date;
    } else {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('event-start-date').value = today;
    }

    // Reset color picker
    document.querySelectorAll('#color-picker button').forEach((btn, i) => {
        if (i === 0) {
            btn.classList.add('border-gray-800', 'dark:border-white', 'ring-2', 'ring-offset-2', 'ring-blue-500');
            btn.classList.remove('border-transparent');
        } else {
            btn.classList.remove('border-gray-800', 'dark:border-white', 'ring-2', 'ring-offset-2', 'ring-blue-500');
            btn.classList.add('border-transparent');
        }
    });
}

window.closeEventModal = function () {
    document.getElementById('event-modal').classList.add('hidden');
}

window.selectColor = function (color) {
    document.getElementById('event-color').value = color;
    document.querySelectorAll('#color-picker button').forEach(btn => {
        if (btn.dataset.color === color) {
            btn.classList.add('border-gray-800', 'dark:border-white', 'ring-2', 'ring-offset-2', 'ring-blue-500');
            btn.classList.remove('border-transparent');
        } else {
            btn.classList.remove('border-gray-800', 'dark:border-white', 'ring-2', 'ring-offset-2', 'ring-blue-500');
            btn.classList.add('border-transparent');
        }
    });
}

window.saveEvent = async function (e) {
    e.preventDefault();

    const id = document.getElementById('event-id').value;
    const data = {
        title: document.getElementById('event-title').value,
        start_date: document.getElementById('event-start-date').value,
        end_date: document.getElementById('event-end-date').value || null,
        start_time: document.getElementById('event-start-time').value || null,
        end_time: document.getElementById('event-end-time').value || null,
        event_type: document.getElementById('event-type').value,
        location: document.getElementById('event-location').value || null,
        description: document.getElementById('event-description').value || null,
        color: document.getElementById('event-color').value
    };

    try {
        if (id) {
            await api(`/calendar/events/${id}`, { method: 'PUT', body: data });
            showToast('Event berhasil diperbarui!', 'success');
        } else {
            await api('/calendar/events', { method: 'POST', body: data });
            showToast('Event berhasil ditambahkan!', 'success');
        }
        closeEventModal();
        await loadEvents();
        renderCalendar();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.viewEvent = async function (id) {
    try {
        const res = await api(`/calendar/events/${id}`);
        const e = res.data;

        document.getElementById('event-modal').classList.remove('hidden');
        document.getElementById('event-modal-title').innerHTML = '<i class="fas fa-calendar-check text-green-500 mr-2"></i>Detail Event';
        document.getElementById('event-id').value = e.id;
        document.getElementById('event-title').value = e.title;
        document.getElementById('event-start-date').value = e.start_date;
        document.getElementById('event-end-date').value = e.end_date || '';
        document.getElementById('event-start-time').value = e.start_time || '';
        document.getElementById('event-end-time').value = e.end_time || '';
        document.getElementById('event-type').value = e.event_type || 'other';
        document.getElementById('event-location').value = e.location || '';
        document.getElementById('event-description').value = e.description || '';
        document.getElementById('event-color').value = e.color || '#3B82F6';

        selectColor(e.color || '#3B82F6');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.syncKegiatanToCalendar = async function () {
    if (!confirm('Sinkronkan semua kegiatan yang belum ada di kalender?')) return;

    try {
        const res = await api('/calendar/sync-kegiatan', { method: 'POST' });
        showToast(res.message || 'Sinkronisasi berhasil!', 'success');
        await loadEvents();
        renderCalendar();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Auto-init when page loads
setTimeout(() => {
    if (document.getElementById('calendar-body')) {
        initKalender();
    }
}, 100);
