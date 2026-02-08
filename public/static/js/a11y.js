/**
 * Accessibility Utilities for KKG Portal
 * WCAG 2.1 AA Compliance Helpers
 */

// ============================================
// Focus Management
// ============================================

/**
 * Trap focus within a modal/dialog
 */
export function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function handleKeyDown(e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }

    element.addEventListener('keydown', handleKeyDown);

    // Focus first element
    firstFocusable?.focus();

    // Return cleanup function
    return () => {
        element.removeEventListener('keydown', handleKeyDown);
    };
}

/**
 * Restore focus to element that triggered a modal
 */
let previousFocus = null;

export function saveFocus() {
    previousFocus = document.activeElement;
}

export function restoreFocus() {
    if (previousFocus && previousFocus.focus) {
        previousFocus.focus();
        previousFocus = null;
    }
}

// ============================================
// ARIA Live Regions
// ============================================

let liveRegion = null;

/**
 * Initialize live region for announcements
 */
export function initLiveRegion() {
    if (liveRegion) return;

    liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'a11y-live-region';
    document.body.appendChild(liveRegion);
}

/**
 * Announce message to screen readers
 */
export function announce(message, priority = 'polite') {
    if (!liveRegion) initLiveRegion();

    liveRegion.setAttribute('aria-live', priority);

    // Clear and set message (triggers announcement)
    liveRegion.textContent = '';
    requestAnimationFrame(() => {
        liveRegion.textContent = message;
    });
}

/**
 * Announce assertive message (interrupts current reading)
 */
export function announceAssertive(message) {
    announce(message, 'assertive');
}

// ============================================
// Keyboard Navigation
// ============================================

/**
 * Handle arrow key navigation in a list
 */
export function handleListNavigation(e, items, currentIndex, onSelect) {
    let newIndex = currentIndex;

    switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
            e.preventDefault();
            newIndex = (currentIndex + 1) % items.length;
            break;
        case 'ArrowUp':
        case 'ArrowLeft':
            e.preventDefault();
            newIndex = (currentIndex - 1 + items.length) % items.length;
            break;
        case 'Home':
            e.preventDefault();
            newIndex = 0;
            break;
        case 'End':
            e.preventDefault();
            newIndex = items.length - 1;
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            if (onSelect) onSelect(currentIndex);
            return currentIndex;
        default:
            return currentIndex;
    }

    items[newIndex]?.focus();
    return newIndex;
}

/**
 * Handle Escape key to close modals/menus
 */
export function handleEscapeKey(callback) {
    function handler(e) {
        if (e.key === 'Escape') {
            callback();
        }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
}

// ============================================
// Skip Links
// ============================================

/**
 * Render skip links for keyboard navigation
 */
export function renderSkipLinks() {
    return `
    <nav aria-label="Skip links" class="skip-links">
      <a href="#main-content" class="skip-link">
        Langsung ke konten utama
      </a>
      <a href="#main-nav" class="skip-link">
        Langsung ke navigasi
      </a>
    </nav>
  `;
}

// ============================================
// Form Accessibility
// ============================================

/**
 * Generate unique ID
 */
let idCounter = 0;
export function generateId(prefix = 'a11y') {
    return `${prefix}-${Date.now()}-${++idCounter}`;
}

/**
 * Create accessible form field with label
 */
export function accessibleInput(options) {
    const {
        type = 'text',
        name,
        label,
        value = '',
        placeholder = '',
        required = false,
        error = '',
        helpText = '',
        disabled = false,
        className = ''
    } = options;

    const inputId = generateId('input');
    const errorId = error ? generateId('error') : '';
    const helpId = helpText ? generateId('help') : '';

    const describedBy = [errorId, helpId].filter(Boolean).join(' ');

    return `
    <div class="form-field ${error ? 'has-error' : ''} ${className}">
      <label for="${inputId}" class="form-label ${required ? 'required' : ''}">
        ${label}
        ${required ? '<span class="text-red-500" aria-hidden="true">*</span>' : ''}
      </label>
      
      <input 
        type="${type}"
        id="${inputId}"
        name="${name}"
        value="${value}"
        placeholder="${placeholder}"
        ${required ? 'required aria-required="true"' : ''}
        ${disabled ? 'disabled' : ''}
        ${error ? `aria-invalid="true" aria-describedby="${describedBy}"` : ''}
        ${!error && describedBy ? `aria-describedby="${describedBy}"` : ''}
        class="form-input ${error ? 'border-red-500' : ''}"
      />
      
      ${helpText ? `
        <p id="${helpId}" class="form-help text-sm text-gray-500 mt-1">
          ${helpText}
        </p>
      ` : ''}
      
      ${error ? `
        <p id="${errorId}" class="form-error text-sm text-red-500 mt-1" role="alert">
          <i class="fas fa-exclamation-circle mr-1" aria-hidden="true"></i>
          ${error}
        </p>
      ` : ''}
    </div>
  `;
}

/**
 * Create accessible textarea
 */
export function accessibleTextarea(options) {
    const {
        name,
        label,
        value = '',
        placeholder = '',
        required = false,
        error = '',
        rows = 4,
        maxLength,
        className = ''
    } = options;

    const inputId = generateId('textarea');
    const errorId = error ? generateId('error') : '';

    return `
    <div class="form-field ${error ? 'has-error' : ''} ${className}">
      <label for="${inputId}" class="form-label ${required ? 'required' : ''}">
        ${label}
        ${required ? '<span class="text-red-500" aria-hidden="true">*</span>' : ''}
      </label>
      
      <textarea 
        id="${inputId}"
        name="${name}"
        placeholder="${placeholder}"
        rows="${rows}"
        ${maxLength ? `maxlength="${maxLength}"` : ''}
        ${required ? 'required aria-required="true"' : ''}
        ${error ? `aria-invalid="true" aria-describedby="${errorId}"` : ''}
        class="form-textarea ${error ? 'border-red-500' : ''}"
      >${value}</textarea>
      
      ${maxLength ? `
        <p class="text-xs text-gray-400 mt-1 text-right">
          <span id="${inputId}-count">0</span>/${maxLength} karakter
        </p>
      ` : ''}
      
      ${error ? `
        <p id="${errorId}" class="form-error text-sm text-red-500 mt-1" role="alert">
          ${error}
        </p>
      ` : ''}
    </div>
  `;
}

// ============================================
// Color Contrast
// ============================================

/**
 * Calculate relative luminance
 */
function getLuminance(color) {
    const rgb = color.match(/\d+/g).map(Number);
    const [r, g, b] = rgb.map((c) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1, color2) {
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standard
 */
export function meetsContrastAA(color1, color2, isLargeText = false) {
    const ratio = getContrastRatio(color1, color2);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

// ============================================
// Reduced Motion
// ============================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on user preference
 */
export function getAnimationDuration(normalDuration) {
    return prefersReducedMotion() ? 0 : normalDuration;
}

// ============================================
// Initialize Accessibility Features
// ============================================

export function initA11y() {
    // Initialize live region
    initLiveRegion();

    // Add skip link target IDs if missing
    const mainContent = document.querySelector('main');
    if (mainContent && !mainContent.id) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('tabindex', '-1');
    }

    const nav = document.querySelector('nav');
    if (nav && !nav.id) {
        nav.id = 'main-nav';
    }

    console.log('Accessibility features initialized');
}

// Export to global scope for inline handlers
window.announce = announce;
window.announceAssertive = announceAssertive;
