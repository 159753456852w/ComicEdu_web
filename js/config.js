const BUILT_API_ORIGIN = 'https://karissa-unsiding-graphemically.ngrok-free.dev';
const PRODUCTION_API_ORIGIN = 'https://karissa-unsiding-graphemically.ngrok-free.dev';
const localHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const localApiOrigin = ['', '80', '8081'].includes(window.location.port)
    ? window.location.origin
    : 'http://127.0.0.1:80';
const API_ORIGIN = (window.GK_API_BASE_URL || (
    BUILT_API_ORIGIN !== 'https://karissa-unsiding-graphemically.ngrok-free.dev'
        ? BUILT_API_ORIGIN
        : (localHost ? localApiOrigin : PRODUCTION_API_ORIGIN)
)).replace(/\/$/, '');
const API_BASE = `${API_ORIGIN}/api/v1`;

async function apiFetch(input, init = {}) {
    const headers = new Headers(init.headers || {});
    headers.set('X-Ngrok-Skip-Browser-Warning', 'true');
    return fetch(input, { ...init, headers, credentials: 'include' });
}

function apiAssetUrl(value) {
    if (!value) return value;
    if (/^https?:\/\//i.test(value)) return value;
    return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`;
}

(() => {
    const projectId = new URLSearchParams(window.location.search).get('projectId');
    const stageMatch = location.pathname.match(/\/(\d)_/);
    const viewedStage = stageMatch ? Number(stageMatch[1]) : 0;
    if (!projectId || !viewedStage) return;

    window.PROJECT_READ_ONLY = false;
    const navigationButton = element => {
        const text = element.textContent.trim();
        const action = element.getAttribute('onclick') || '';
        return /^(上一頁|下一頁|\d+|chevron_left|chevron_right|check)$/.test(text) || /flipPage|flipToPage|switchExportPage|switchPage|switchScriptPage|goToScriptPage/.test(action);
    };
    const applyReadOnly = () => {
        const main = document.querySelector('main');
        if (!main || !window.PROJECT_READ_ONLY) return;
        main.querySelectorAll('input, textarea, select').forEach(control => {
            control.disabled = true;
            control.setAttribute('aria-disabled', 'true');
        });
        main.querySelectorAll('button').forEach(button => {
            if (!navigationButton(button)) {
                button.setAttribute('aria-disabled', 'true');
                button.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });
        if (!document.getElementById('history-readonly-banner')) {
            const banner = document.createElement('div');
            banner.id = 'history-readonly-banner';
            banner.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-b-xl bg-slate-900 text-white text-xs font-semibold shadow-lg';
            banner.textContent = '歷史紀錄模式：可查看內容，但不可修改。';
            document.body.appendChild(banner);
        }
    };

    document.addEventListener('click', event => {
        const lockedStage = event.target.closest('a[data-stage-locked="true"]');
        if (lockedStage) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        if (!window.PROJECT_READ_ONLY) return;
        const button = event.target.closest('button');
        const formControl = event.target.closest('input, textarea, select');
        const clickableCard = event.target.closest('[data-char-id], [data-layout-name], [onclick]');
        const main = document.querySelector('main');
        const target = button || formControl || clickableCard;
        if (target && main?.contains(target) && !navigationButton(target)) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);

    document.addEventListener('DOMContentLoaded', async () => {
        document.querySelectorAll('a').forEach(link => {
            const label = link.textContent.trim();
            if (label === '教學社群') link.remove();
            if (label === '我的專案') link.href = 'Projects.html#my-projects';
            if (label === '資源庫') link.href = 'Projects.html#resource-library';
        });
        document.querySelectorAll('header, nav').forEach(container => {
            [...container.querySelectorAll('span, div')].filter(element => element.textContent.trim() === '漫教工坊 ComicEdu Studio').forEach(logo => {
                logo.setAttribute('role', 'link');
                logo.setAttribute('tabindex', '0');
                logo.style.cursor = 'pointer';
                logo.addEventListener('click', () => { window.location.href = 'Portal.html'; });
                logo.addEventListener('keydown', event => { if (event.key === 'Enter') window.location.href = 'Portal.html'; });
            });
        });
        try {
            const response = await fetch(`${API_BASE}/projects/${projectId}?t=${Date.now()}`, { cache: 'no-store' });
            const payload = await response.json();
            const completedStep = Number(payload?.data?.completedStep || 1);
            document.querySelectorAll('a[href]').forEach(link => {
                const targetStage = link.getAttribute('href')?.match(/(?:^|\/)([1-5])_/);
                if (targetStage && Number(targetStage[1]) > completedStep) {
                    link.dataset.stageLocked = 'true';
                    link.removeAttribute('href');
                    link.setAttribute('aria-disabled', 'true');
                    link.setAttribute('title', '請先完成目前階段');
                    link.classList.add('opacity-35', 'cursor-not-allowed', 'pointer-events-auto');
                }
            });
            window.PROJECT_READ_ONLY = viewedStage < completedStep;
            if (window.PROJECT_READ_ONLY) {
                applyReadOnly();
                new MutationObserver(applyReadOnly).observe(document.body, { childList: true, subtree: true });
            }
        } catch (error) {
            console.error('無法判斷歷史紀錄狀態', error);
        }
    });
})();
