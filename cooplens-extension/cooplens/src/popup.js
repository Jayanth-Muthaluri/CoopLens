// CoopLens popup.js v2

let currentJD = null;
let currentAnalysis = null;
let loadingInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupNav();
  setupSettings();
  await loadSettingsUI();
  await scrapeCurrentPage();
});

// ── Navigation ────────────────────────────────────────
function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`view-${btn.dataset.tab}`).classList.add('active');
      if (btn.dataset.tab === 'tracker') renderTracker();
    });
  });
  document.getElementById('btn-refresh').addEventListener('click', scrapeCurrentPage);
}

// ── Settings ──────────────────────────────────────────
async function loadSettingsUI() {
  const { apiKey, profile } = await chrome.storage.local.get(['apiKey', 'profile']);
  if (apiKey) document.getElementById('apiKeyInput').value = apiKey;
  if (profile) {
    document.getElementById('profileInput').value = profile;
    document.getElementById('profile-chars').textContent = profile.length;
  }
}

function setupSettings() {
  document.getElementById('profileInput').addEventListener('input', e => {
    document.getElementById('profile-chars').textContent = e.target.value.length;
  });

  document.getElementById('btn-save-key').addEventListener('click', async () => {
    const key = document.getElementById('apiKeyInput').value.trim();
    await chrome.storage.local.set({ apiKey: key });
    flash('key-saved');
  });

  document.getElementById('btn-save-profile').addEventListener('click', async () => {
    const profile = document.getElementById('profileInput').value.trim();
    await chrome.storage.local.set({ profile });
    flash('profile-saved');
  });

  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);

  document.getElementById('btn-clear-data').addEventListener('click', async () => {
    if (confirm('Clear all saved applications and settings?')) {
      await chrome.storage.local.clear();
      loadSettingsUI();
      renderAnalyzeReady(currentJD);
    }
  });
}

function flash(id) {
  const el = document.getElementById(id);
  el.style.display = 'inline';
  setTimeout(() => { el.style.display = 'none'; }, 2000);
}

// ── Scraping ──────────────────────────────────────────
async function scrapeCurrentPage() {
  showInAnalyze(renderLoading('Scanning page…'));
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content.js'],
    }).catch(() => {});

    const result = await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_JD' })
      .catch(() => null);

    if (!result?.success || !result.description) {
      showInAnalyze(renderEmpty());
      return;
    }

    currentJD = result;
    showInAnalyze(renderJobDetected(result));

  } catch (e) {
    showInAnalyze(renderEmpty());
  }
}

// ── Analysis ──────────────────────────────────────────
async function runAnalysis() {
  const { apiKey, profile } = await chrome.storage.local.get(['apiKey', 'profile']);

  if (!apiKey) {
    showInAnalyze(
      renderError('No API key. Go to <strong>Settings</strong> and add your Groq API key.') +
      renderJobDetected(currentJD)
    );
    return;
  }
  if (!profile) {
    showInAnalyze(
      renderError('No profile saved. Go to <strong>Settings</strong> and paste your resume.') +
      renderJobDetected(currentJD)
    );
    return;
  }

  startLoadingAnimation();

  const response = await chrome.runtime.sendMessage({
    type: 'ANALYZE_JD',
    payload: { jd: currentJD, profile, apiKey },
  });

  stopLoadingAnimation();

  if (!response.success) {
    showInAnalyze(
      renderError(esc(response.error)) +
      renderJobDetected(currentJD)
    );
    return;
  }

  currentAnalysis = response.data;

  const app = {
    id: Date.now().toString(),
    ...currentJD,
    analysis: currentAnalysis,
    status: 'To Apply',
    savedAt: new Date().toISOString(),
  };
  await chrome.runtime.sendMessage({ type: 'SAVE_APPLICATION', payload: app });

  showInAnalyze(renderResults(currentJD, currentAnalysis));
}

function startLoadingAnimation() {
  const steps = ['Reading job description', 'Matching your profile', 'Scoring fit & gaps', 'Writing recommendations'];
  let current = 0;

  function buildSteps(active) {
    return steps.map((s, i) => {
      const cls = i < active ? 'done' : i === active ? 'active' : '';
      return `<div class="loading-step"><div class="step-dot ${cls}"></div>${esc(s)}</div>`;
    }).join('');
  }

  showInAnalyze(`
    <div class="loading">
      <div class="spinner"></div>
      <div class="loading-text">Analyzing your fit…</div>
      <div class="loading-steps" id="loading-steps">${buildSteps(0)}</div>
    </div>`);

  loadingInterval = setInterval(() => {
    current = Math.min(current + 1, steps.length - 1);
    const el = document.getElementById('loading-steps');
    if (el) el.innerHTML = buildSteps(current);
  }, 900);
}

function stopLoadingAnimation() {
  if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }
}

// ── Rendering ─────────────────────────────────────────
function showInAnalyze(html) {
  const el = document.getElementById('analyze-content');
  el.innerHTML = html;
  bindDynamicListeners(el);
}

function bindDynamicListeners(root) {
  root.querySelectorAll('.section-hd').forEach(hd => {
    hd.addEventListener('click', () => hd.parentElement.classList.toggle('open'));
  });
  root.querySelector('#btn-analyze')?.addEventListener('click', runAnalysis);
  root.querySelector('#btn-reanalyze')?.addEventListener('click', () => {
    showInAnalyze(renderJobDetected(currentJD));
  });
}

function renderEmpty() {
  return `<div class="empty">
    <div class="empty-icon">🔎</div>
    <div class="empty-title">No job posting detected</div>
    <div class="empty-sub">Navigate to a job listing on LinkedIn, Handshake, Greenhouse, Lever, or Indeed — then click the extension icon.</div>
  </div>`;
}

function renderError(msg) {
  return `<div class="error-banner">${msg}</div>`;
}

function renderLoading(msg) {
  return `<div class="loading"><div class="spinner"></div><div class="loading-text">${esc(msg)}</div></div>`;
}

function renderJobDetected(jd) {
  const domain = (() => { try { return new URL(jd.url).hostname; } catch(e) { return ''; } })();
  const favicon = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32` : '';

  return `
    <div class="job-card">
      <div class="job-card-row">
        <div class="job-favicon">
          ${favicon ? `<img src="${favicon}" onerror="this.style.display='none'">` : '🏢'}
        </div>
        <div class="job-meta">
          <div class="job-title">${esc(jd.title)}</div>
          <div class="job-company">${esc(jd.company)}${jd.location ? ' · ' + esc(jd.location) : ''}</div>
        </div>
        <span class="platform-pill">${esc(jd.platform)}</span>
      </div>
    </div>
    <div class="analyze-area">
      <button class="btn-analyze" id="btn-analyze">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-2 2.5h3L12 7"/><path d="M10 14v-3"/><path d="M14 14v-3"/><path d="M10 19c-2.2 0-4-1.8-4-4v-5a6 6 0 0 1 12 0v5c0 2.2-1.8 4-4 4"/><path d="M5 19H3m4 2v2m8-2v2m4-2h2"/></svg>
        Analyze my fit
      </button>
      <div class="analyze-hint">Powered by Groq · Free · ~5 seconds</div>
    </div>`;
}

function renderResults(jd, a) {
  const scoreColor = a.fitScore >= 70 ? 'var(--green)' : a.fitScore >= 45 ? 'var(--amber)' : 'var(--red)';
  const recColors = {
    'Apply Now':             { bg: 'var(--green-dim)',  text: 'var(--green)' },
    'Apply With Tweaks':     { bg: 'var(--amber-dim)',  text: 'var(--amber)' },
    'Stretch — Apply Anyway':{ bg: 'var(--amber-dim)',  text: 'var(--amber)' },
    'Skip':                  { bg: 'var(--red-dim)',    text: 'var(--red)'   },
  };
  const recEmoji = {
    'Apply Now': '✅', 'Apply With Tweaks': '✏️',
    'Stretch — Apply Anyway': '🎯', 'Skip': '⏭️',
  };
  const rc = recColors[a.applyRecommendation] || { bg: 'var(--accent-dim)', text: 'var(--accent)' };
  const C = 2 * Math.PI * 26;
  const offset = C - (Math.min(Math.max(a.fitScore, 0), 100) / 100) * C;

  return `<div class="results">
    <div class="score-block">
      <div class="ring-wrap">
        <svg width="68" height="68" viewBox="0 0 68 68">
          <circle cx="34" cy="34" r="26" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="6"/>
          <circle cx="34" cy="34" r="26" fill="none" stroke="${scoreColor}" stroke-width="6"
            stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
            stroke-linecap="round" transform="rotate(-90 34 34)" style="transition:stroke-dashoffset 0.6s ease"/>
          <text x="34" y="39" text-anchor="middle" font-size="15" font-weight="700" fill="${scoreColor}">${a.fitScore}</text>
        </svg>
      </div>
      <div class="score-detail">
        <div class="score-label" style="color:${scoreColor}">${esc(a.fitLabel)}</div>
        <div class="score-summary">${esc(a.fitSummary)}</div>
        <div class="rec-pill" style="background:${rc.bg};color:${rc.text}">
          ${recEmoji[a.applyRecommendation] || '📋'} ${esc(a.applyRecommendation)}
        </div>
      </div>
    </div>

    ${section('💪', 'Strengths', a.matchedStrengths?.length,
      (a.matchedStrengths||[]).map(s => `
        <div class="item">
          <div class="item-title">${esc(s.skill)}</div>
          <div class="item-sub">${esc(s.evidence)}</div>
        </div>`).join('')
    )}

    ${section('⚠️', 'Gaps to address', a.gaps?.length,
      (a.gaps||[]).map(g => `
        <div class="item">
          <span class="sev-pill sev-${(g.severity||'').toLowerCase()}">${esc(g.severity)}</span>
          <div class="item-title">${esc(g.gap)}</div>
          <div class="item-sub">${esc(g.fix)}</div>
        </div>`).join('')
    )}

    ${section('📄', 'Resume tweaks', a.resumeTweaks?.length,
      `<ul class="arrow-list">${(a.resumeTweaks||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`
    )}

    ${section('✉️', 'Cover letter angle', 1,
      `<div class="cover-block">${esc(a.coverLetterAngle)}</div>`
    )}

    ${section('🎤', 'Interview prep', a.interviewPrepTopics?.length,
      `<ul class="arrow-list">${(a.interviewPrepTopics||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`
    )}

    ${a.redFlags?.length ? section('🚩', 'Red flags', a.redFlags.length,
      `<ul class="arrow-list">${a.redFlags.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`
    ) : ''}

    <button class="reanalyze-btn" id="btn-reanalyze">↺ Re-analyze this role</button>
  </div>`;
}

function section(icon, title, count, body) {
  return `<div class="section open">
    <div class="section-hd">
      <div class="section-hd-left">
        <span>${icon}</span> ${esc(title)}
        <span class="section-badge">${count || 0}</span>
      </div>
      <span class="chevron">▾</span>
    </div>
    <div class="section-body">${body}</div>
  </div>`;
}

// ── Tracker ───────────────────────────────────────────
async function renderTracker() {
  const res = await chrome.runtime.sendMessage({ type: 'GET_APPLICATIONS' });
  const apps = res.data || [];
  const el = document.getElementById('tracker-content');

  if (!apps.length) {
    el.innerHTML = `<div class="empty">
      <div class="empty-icon">📋</div>
      <div class="empty-title">No applications yet</div>
      <div class="empty-sub">Analyze a job posting and it'll be saved here automatically.</div>
    </div>`;
    return;
  }

  el.innerHTML = `<div class="tracker-wrap">
    <div class="tracker-header">
      <div class="tracker-title">${apps.length} application${apps.length !== 1 ? 's' : ''}</div>
      <button class="export-btn" id="export-csv-btn">↓ Export CSV</button>
    </div>
    ${apps.map(app => {
      const score = app.analysis?.fitScore;
      const scoreColor = !score ? 'color:var(--muted)' :
        score >= 70 ? 'color:var(--green)' :
        score >= 45 ? 'color:var(--amber)' : 'color:var(--red)';
      const date = new Date(app.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `<div class="app-card" data-id="${esc(app.id)}">
        <div class="app-card-top">
          <div class="app-card-title">${esc(app.title)}</div>
          ${score ? `<span class="score-dot" style="${scoreColor}">${score}</span>` : ''}
        </div>
        <div class="app-card-company">${esc(app.company)}${app.location ? ' · ' + esc(app.location) : ''}</div>
        <div class="app-card-foot">
          <select class="status-sel" data-id="${esc(app.id)}">
            ${['To Apply','Applied','Phone Screen','Interview','Offer','Rejected'].map(s =>
              `<option ${app.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <div class="app-meta">
            <span class="app-date">${date}</span>
            <button class="del-btn" data-id="${esc(app.id)}" title="Remove">✕</button>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;

  document.getElementById('export-csv-btn')?.addEventListener('click', exportCSV);

  el.querySelectorAll('.status-sel').forEach(sel => {
    sel.addEventListener('change', async e => {
      e.stopPropagation();
      const r = await chrome.runtime.sendMessage({ type: 'GET_APPLICATIONS' });
      const all = r.data || [];
      const app = all.find(a => a.id === e.target.dataset.id);
      if (app) { app.status = e.target.value; await chrome.runtime.sendMessage({ type: 'SAVE_APPLICATION', payload: app }); }
    });
  });

  el.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await chrome.runtime.sendMessage({ type: 'DELETE_APPLICATION', id: e.target.dataset.id });
      renderTracker();
    });
  });

  el.querySelectorAll('.app-card').forEach(card => {
    card.addEventListener('click', async e => {
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
      const r = await chrome.runtime.sendMessage({ type: 'GET_APPLICATIONS' });
      const app = (r.data || []).find(a => a.id === card.dataset.id);
      if (!app?.analysis) return;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelector('.nav-btn[data-tab="analyze"]').classList.add('active');
      document.getElementById('view-analyze').classList.add('active');
      currentJD = app; currentAnalysis = app.analysis;
      showInAnalyze(renderResults(app, app.analysis));
    });
  });
}

// ── CSV Export ────────────────────────────────────────
async function exportCSV() {
  const res = await chrome.runtime.sendMessage({ type: 'GET_APPLICATIONS' });
  const apps = res.data || [];
  if (!apps.length) return;
  const headers = ['Title','Company','Location','Fit Score','Fit Label','Recommendation','Status','Platform','URL','Saved'];
  const rows = apps.map(a => [
    a.title, a.company, a.location,
    a.analysis?.fitScore || '', a.analysis?.fitLabel || '',
    a.analysis?.applyRecommendation || '',
    a.status, a.platform, a.url,
    new Date(a.savedAt).toLocaleDateString(),
  ].map(v => `"${String(v||'').replace(/"/g,'""')}"`));
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'cooplens-tracker.csv';
  a.click();
}

// ── Utils ─────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
