// 載入精選範例
async function loadShowcase() {
    try {
        const res = await apiFetch(`${API_BASE}/showcase`);
        const json = await res.json();
        if (!json.success || !json.data || !json.data.items) return;
        const grid = document.getElementById('showcase-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const categoryLabel = { science: '自然科學', history: '歷史社會', language: '語文學習' };
        const categoryImg = {
            science: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvWzFJypJ6ig9OPaCed8ou6VLUhtaKLdvWR4GCVhkonJ1M8_IxUtcxkvO3MY4VrAvGrfAtYOZOKgKaqj3900v7ZCopTjZxfdnQA8iATPyFbFMBsH0eB04QfJ3k4qTJkH1oUNX_pW16C3YIYVHViMGNelg7cT_wRZj6p55dsgw-qXJ_6rSOv6P5q1iwGfqI9aLCFZagy-cxDhAGO0fT3hDVEAd1DXEFU7jlvvzireJc6XQMdx9ujqKcGkD0bsQ7fuSxMf760ZmH8kRH',
            history: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKgyjFRWhzs262e42NcHxsXTQTGG3iNM4um_Q1eufc9TTsNdCNTjEv1zyMifSYrVU01F0QVUJ1V3ublc01T4qMTtzLeYMbg7WHQ5zVkXQjdJcgxFiTPSLBb0yrqerseQxgBAZyyOMtw32x2CBdaCPfxikbNSeCm989AO_sqirWLZqTP3v_LopelO-e5qTVSrYd3BhhvWydMIPgPPYD4cR_cMXKR2LKLrm5vaTCW8Yk649I4lAM5VPYvlBNV5KxgsS2QjcLI4r7Vo77',
            language: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPV4mRVkaVsTR4pgyr3bwtn6bjqw8vMUE7GwdMyaSsFLQ2IX2IXYNrv0Ggsf71Psm-1CMAGzYjsAiGmcN-d5KFlPjpQ-att32RNTSVJ_FS4g8_y6puqBRJ-GFo8n0L3u_kga4zLMSR2TQ-mOGrdjvikCmlWWx78av7XQud9PD_BVW0fhwAsXphp1H64-lAgx4m6VsPUaML5uUlg6DFSwC8fbsg1mP3mlGKUZRiY6cUurPv2kOTT7peMlCDOj95IsSdrc7rRj9lvxcr'
        };
        json.data.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group';
            const cat = categoryLabel[item.category] || item.category;
            const img = categoryImg[item.category] || '';
            card.innerHTML = `
                <div class="relative h-64 overflow-hidden">
                    <img alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-duration-500" src="${img}"/>
                    <div class="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary">${cat}</div>
                </div>
                <div class="p-6">
                    <h4 class="text-xl font-bold mb-2">${item.title}</h4>
                    <p class="text-on-surface-variant text-sm mb-4">適用對象：${item.targetAudience || ''} | 分鏡數：${item.panelCount || ''}</p>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-slate-200"></div><span class="text-xs font-medium">${item.authorName}</span></div>
                        <span class="material-symbols-outlined text-on-surface-variant">favorite</span>
                    </div>
                </div>`;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error('載入 Showcase 失敗:', e);
    }
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
}

function projectRoute(project) {
    const pages = ['1_劇本構思.html', '2_角色設定.html', '3_分鏡配置.html', '4_AI生圖.html', '5_匯出分享.html'];
    const step = Math.max(1, Math.min(5, Number(project.completedStep || 1)));
    return `${pages[step - 1]}?projectId=${encodeURIComponent(project.id)}`;
}

function renderProjectCollection(projects, gridId, countId, completed) {
    const grid = document.getElementById(gridId);
    const count = document.getElementById(countId);
    if (!grid || !count) return;
    count.textContent = `${projects.length} 個專案`;
    if (projects.length === 0) {
        grid.innerHTML = `<div class="sm:col-span-2 min-h-36 rounded-2xl border border-dashed border-slate-300 bg-white/70 flex flex-col items-center justify-center text-center p-6">
            <span class="material-symbols-outlined text-3xl text-slate-300 mb-2">${completed ? 'collections_bookmark' : 'edit_note'}</span>
            <p class="text-sm font-semibold text-slate-600">${completed ? '完成漫畫後會出現在這裡' : '目前沒有進行中的專案'}</p>
        </div>`;
        return;
    }
    grid.innerHTML = projects.map(project => `
        <a href="${projectRoute(project)}" class="group rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all">
            ${project.coverUrl ? `<img src="${apiAssetUrl(project.coverUrl)}&t=${Date.now()}" alt="${escapeHtml(project.title)}封面" class="w-full h-40 object-cover object-top bg-white">` : `<div class="h-28 bg-slate-100 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-300">auto_stories</span></div>`}
            <div class="p-4">
                <div class="flex items-start justify-between gap-3"><h3 class="font-bold text-slate-900 leading-snug">${escapeHtml(project.title)}</h3><span class="text-[10px] whitespace-nowrap text-indigo-600 font-bold">${completed ? '已完成' : `步驟 ${project.completedStep}/5`}</span></div>
                <p class="text-xs text-slate-500 mt-2">${escapeHtml(project.subject || '未分類')} · ${escapeHtml(project.gradeLevel || '未設定年級')} · ${project.pageCount} 頁</p>
            </div>
        </a>`).join('');
}

async function loadProjects() {
    try {
        const response = await apiFetch(`${API_BASE}/projects?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const projects = await response.json();
        if (projects.length === 0 && /(?:^|\/)Projects\.html$/i.test(window.location.pathname)) {
            window.location.replace('1_劇本構思.html');
            return;
        }
        renderProjectCollection(projects.filter(project => !project.completed), 'active-project-grid', 'active-project-count', false);
        renderProjectCollection(projects.filter(project => project.completed), 'completed-project-grid', 'completed-project-count', true);
    } catch (error) {
        console.error('載入專案失敗', error);
        renderProjectCollection([], 'active-project-grid', 'active-project-count', false);
        renderProjectCollection([], 'completed-project-grid', 'completed-project-count', true);
    }
}

// 跳轉到劇本設計頁
function goToCreate() {
    window.location.href = 'Projects.html';
}

function goToNewProject() {
    window.location.href = '1_劇本構思.html';
}

document.addEventListener('DOMContentLoaded', () => {
    loadShowcase();
    if (document.getElementById('active-project-grid')) loadProjects();
    // 綁定所有「開始創作」按鈕
    document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.trim();
        if (text.includes('立即開始創作') || text === '開始創作') {
            btn.addEventListener('click', goToCreate);
        }
    });
});

