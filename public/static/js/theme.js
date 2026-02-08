/**
 * Theme Manager - Dark Mode Toggle
 * Handles theme switching with localStorage persistence and system preference detection
 */

const THEME_KEY = 'kkg-theme';
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

/**
 * Get system color scheme preference
 */
function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return THEMES.DARK;
    }
    return THEMES.LIGHT;
}

/**
 * Get saved theme preference
 */
function getSavedTheme() {
    try {
        return localStorage.getItem(THEME_KEY) || THEMES.SYSTEM;
    } catch (e) {
        return THEMES.SYSTEM;
    }
}

/**
 * Get effective theme (resolves 'system' to actual theme)
 */
function getEffectiveTheme() {
    const saved = getSavedTheme();
    if (saved === THEMES.SYSTEM) {
        return getSystemTheme();
    }
    return saved;
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
    const effectiveTheme = theme === THEMES.SYSTEM ? getSystemTheme() : theme;

    // Remove existing theme classes
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.removeAttribute('data-theme');

    // Apply new theme
    if (effectiveTheme === THEMES.DARK) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', effectiveTheme === THEMES.DARK ? '#0f172a' : '#1e40af');
    }

    // Dispatch custom event for components that need to react
    window.dispatchEvent(new CustomEvent('themechange', {
        detail: { theme: effectiveTheme }
    }));
}

/**
 * Save theme preference
 */
function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
        console.warn('Could not save theme preference');
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const current = getEffectiveTheme();
    const newTheme = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    saveTheme(newTheme);
    applyTheme(newTheme);
    return newTheme;
}

/**
 * Set specific theme
 */
function setTheme(theme) {
    if (!Object.values(THEMES).includes(theme)) {
        console.warn('Invalid theme:', theme);
        return;
    }
    saveTheme(theme);
    applyTheme(theme);
}

/**
 * Initialize theme on page load
 */
function initTheme() {
    // Apply saved/system theme immediately
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);

    // Listen for system theme changes
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // Only react if user preference is 'system'
            if (getSavedTheme() === THEMES.SYSTEM) {
                applyTheme(THEMES.SYSTEM);
            }
        });
    }
}

/**
 * Render theme toggle button component
 */
function renderThemeToggle(className = '') {
    const currentTheme = getEffectiveTheme();
    const isDark = currentTheme === THEMES.DARK;

    return `
    <button 
      onclick="toggleTheme()" 
      class="theme-toggle ${className}"
      aria-label="${isDark ? 'Switch to light mode' : 'Switch to dark mode'}"
      title="${isDark ? 'Switch to light mode' : 'Switch to dark mode'}"
    >
      <i class="fas fa-sun icon-sun ${isDark ? 'hidden' : ''}"></i>
      <i class="fas fa-moon icon-moon ${isDark ? '' : 'hidden'}"></i>
      <span class="sr-only">${isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
    </button>
  `;
}

/**
 * Render theme selector dropdown
 */
function renderThemeSelector() {
    const currentTheme = getSavedTheme();

    return `
    <div class="theme-selector">
      <label for="theme-select" class="sr-only">Select theme</label>
      <select 
        id="theme-select" 
        onchange="setTheme(this.value)"
        class="bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
      >
        <option value="light" ${currentTheme === THEMES.LIGHT ? 'selected' : ''}>
          ☀️ Light
        </option>
        <option value="dark" ${currentTheme === THEMES.DARK ? 'selected' : ''}>
          🌙 Dark
        </option>
        <option value="system" ${currentTheme === THEMES.SYSTEM ? 'selected' : ''}>
          💻 System
        </option>
      </select>
    </div>
  `;
}

// Initialize theme on script load
initTheme();

// Export functions for use in other modules
export {
    THEMES,
    getEffectiveTheme,
    getSavedTheme,
    toggleTheme,
    setTheme,
    initTheme,
    renderThemeToggle,
    renderThemeSelector
};

// Also expose to global scope for inline handlers
window.toggleTheme = toggleTheme;
window.setTheme = setTheme;
