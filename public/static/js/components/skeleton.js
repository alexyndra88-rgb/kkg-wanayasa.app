/**
 * Skeleton Loading Components
 * Provides loading skeleton placeholders for better UX
 */

// Generate skeleton loading for list items
export function skeletonList(count = 5) {
    return Array(count).fill(0).map(() => `
    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 animate-pulse">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// Generate skeleton for cards
export function skeletonCards(count = 4) {
    return Array(count).fill(0).map(() => `
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700 animate-pulse">
      <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div class="space-y-3">
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
      <div class="flex gap-2 mt-4">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-20"></div>
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-16"></div>
      </div>
    </div>
  `).join('');
}

// Generate skeleton for table
export function skeletonTable(rows = 5, cols = 4) {
    const headerCells = Array(cols).fill(0).map(() =>
        `<th class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div></th>`
    ).join('');

    const bodyRows = Array(rows).fill(0).map(() => `
    <tr class="border-t dark:border-gray-700">
      ${Array(cols).fill(0).map(() =>
        `<td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div></td>`
    ).join('')}
    </tr>
  `).join('');

    return `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-700"><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;
}

// Generate skeleton for dashboard stats
export function skeletonStats(count = 4) {
    return `
    <div class="grid grid-cols-2 md:grid-cols-${count} gap-4">
      ${Array(count).fill(0).map(() => `
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 animate-pulse">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div class="flex-1">
              <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-1"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Generate skeleton for form
export function skeletonForm(fields = 4) {
    return `
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700 animate-pulse">
      <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
      <div class="space-y-4">
        ${Array(fields).fill(0).map(() => `
          <div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        `).join('')}
      </div>
      <div class="flex gap-3 mt-6">
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24"></div>
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-20"></div>
      </div>
    </div>
  `;
}

// Generate skeleton for profile/detail page
export function skeletonProfile() {
    return `
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border dark:border-gray-700 animate-pulse">
      <div class="flex items-center gap-6 mb-6">
        <div class="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div class="flex-1">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        ${Array(6).fill(0).map(() => `
          <div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1"></div>
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Generate inline skeleton loader
export function skeletonInline(width = 'w-24') {
    return `<span class="inline-block h-4 bg-gray-200 dark:bg-gray-700 rounded ${width} animate-pulse"></span>`;
}

// Full page skeleton with header
export function skeletonPage() {
    return `
    <div class="max-w-5xl mx-auto py-8 px-4 animate-pulse">
      <div class="flex items-center justify-between mb-6">
        <div>
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        </div>
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32"></div>
      </div>
      ${skeletonCards(3)}
    </div>
  `;
}

// Show loading state in a container
export function showSkeleton(containerId, type = 'cards', count = 4) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletons = {
        cards: () => skeletonCards(count),
        list: () => skeletonList(count),
        table: () => skeletonTable(count, 4),
        stats: () => skeletonStats(count),
        form: () => skeletonForm(count),
        profile: () => skeletonProfile(),
        page: () => skeletonPage()
    };

    container.innerHTML = skeletons[type]?.() || skeletons.cards();
}

// Replace skeleton with actual content after loading
export function replaceSkeleton(containerId, content) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = content;
    container.classList.add('fade-in');
}

// Global skeleton functions for inline use
window.showSkeleton = showSkeleton;
window.replaceSkeleton = replaceSkeleton;

// Export skeleton templates for use in other modules
export const skeleton = {
    list: skeletonList,
    cards: skeletonCards,
    table: skeletonTable,
    stats: skeletonStats,
    form: skeletonForm,
    profile: skeletonProfile,
    inline: skeletonInline,
    page: skeletonPage
};
