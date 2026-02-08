
import { state } from './state.js';

let _render;

export function initRouter(renderFunc) {
    _render = renderFunc;

    window.addEventListener('popstate', (e) => {
        if (e.state) {
            state.currentPage = e.state.page || 'home';
            state.pageParams = e.state.params || {};
        } else {
            const path = window.location.pathname.slice(1) || 'home';
            state.currentPage = path;
            state.pageParams = {};
        }
        if (_render) _render();
    });
}

export function navigate(page, params = {}) {
    state.currentPage = page;
    state.pageParams = params;
    window.history.pushState({ page, params }, '', `/${page === 'home' ? '' : page}`);
    if (_render) _render();
    window.scrollTo(0, 0);
}
