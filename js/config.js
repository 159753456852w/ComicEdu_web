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
    // ngrok's free-domain interstitial checks this exact lower-case header.
    headers.set('ngrok-skip-browser-warning', 'true');
    return fetch(input, { ...init, headers, credentials: 'include' });
}

function apiAssetUrl(value) {
    if (!value) return value;
    if (/^https?:\/\//i.test(value)) return value;
    return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`;
}

const API_IMAGE_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

async function fetchApiAsset(value) {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            const response = await apiFetch(apiAssetUrl(value), { cache: 'no-store' });
            if (!response.ok) throw new Error(`圖片載入失敗（HTTP ${response.status}）`);
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) throw new Error(`圖片格式錯誤（${blob.type || 'unknown'}）`);
            return blob;
        } catch (error) {
            lastError = error;
            if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
        }
    }
    throw lastError;
}

async function setApiImageSource(image, value) {
    if (!image || !value) return;
    const url = apiAssetUrl(value);
    const requestToken = `${Date.now()}-${Math.random()}`;
    image.dataset.apiImageToken = requestToken;
    image.dataset.apiSrc = url;
    try {
        const blob = await fetchApiAsset(url);
        if (image.dataset.apiImageToken !== requestToken) return;
        const objectUrl = URL.createObjectURL(blob);
        image.addEventListener('load', () => URL.revokeObjectURL(objectUrl), { once: true });
        image.src = objectUrl;
        image.dataset.apiImageReady = 'true';
    } catch (error) {
        if (image.dataset.apiImageToken !== requestToken) return;
        image.dataset.apiImageError = error.message;
        image.dispatchEvent(new Event('error'));
        console.error('API 圖片載入失敗', url, error);
    }
}

function apiImageAttributes(value) {
    const url = apiAssetUrl(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return `src="${API_IMAGE_PLACEHOLDER}" data-api-src="${url}"`;
}

function apiMaskAttributes(value) {
    const url = apiAssetUrl(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return `data-api-mask="${url}"`;
}

async function setApiMaskSource(element, value) {
    if (!element || !value) return;
    const url = apiAssetUrl(value);
    const requestToken = `${Date.now()}-${Math.random()}`;
    element.dataset.apiMaskToken = requestToken;
    try {
        const objectUrl = URL.createObjectURL(await fetchApiAsset(url));
        if (element.dataset.apiMaskToken !== requestToken) {
            URL.revokeObjectURL(objectUrl);
            return;
        }
        const previousUrl = element.dataset.apiMaskObjectUrl;
        element.style.webkitMaskImage = `url("${objectUrl}")`;
        element.style.maskImage = `url("${objectUrl}")`;
        element.dataset.apiMaskObjectUrl = objectUrl;
        if (previousUrl) URL.revokeObjectURL(previousUrl);
    } catch (error) {
        element.dataset.apiMaskError = error.message;
        console.error('API 遮罩載入失敗', url, error);
    }
}

function hydrateApiImages(root = document) {
    const images = [];
    if (root instanceof HTMLImageElement && root.matches('img[data-api-src]')) images.push(root);
    if (root.querySelectorAll) images.push(...root.querySelectorAll('img[data-api-src]'));
    images.forEach(image => {
        const url = image.dataset.apiSrc;
        if (url && image.dataset.apiHydratedUrl !== url) {
            image.dataset.apiHydratedUrl = url;
            setApiImageSource(image, url);
        }
    });
}

function hydrateApiMasks(root = document) {
    const elements = [];
    if (root instanceof Element && root.matches('[data-api-mask]')) elements.push(root);
    if (root.querySelectorAll) elements.push(...root.querySelectorAll('[data-api-mask]'));
    elements.forEach(element => {
        const url = element.dataset.apiMask;
        if (url && element.dataset.apiMaskHydratedUrl !== url) {
            element.dataset.apiMaskHydratedUrl = url;
            setApiMaskSource(element, url);
        }
    });
}

function hydrateApiAssets(root = document) {
    hydrateApiImages(root);
    hydrateApiMasks(root);
}

const apiImageObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) hydrateApiAssets(node);
    }));
});
apiImageObserver.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', () => hydrateApiAssets());

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
            const response = await apiFetch(`${API_BASE}/projects/${projectId}?t=${Date.now()}`, { cache: 'no-store' });
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
