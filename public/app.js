const AUTO_LABELS = {
  no_website: 'No website',
  social_only: 'Social page only',
  unreachable: 'Unreachable',
  broken: 'Broken (HTTP error)',
  no_ssl: 'No HTTPS',
  minimal: 'Placeholder / thin page',
  ok: 'Loaded OK',
};

const NEW_SOURCE_VALUE = '__new__';

const form = document.getElementById('search-form');
const categoryInput = document.getElementById('category');
const locationInput = document.getElementById('location');
const searchBtn = document.getElementById('search-btn');
const statusEl = document.getElementById('status');
const table = document.getElementById('results-table');
const tbody = document.getElementById('results-body');
const filterFlagged = document.getElementById('filter-flagged');
const exportBtn = document.getElementById('export-btn');
const loadMoreBtn = document.getElementById('load-more-btn');
const selectAllTh = document.getElementById('select-all-th');
const selectedCountEl = document.getElementById('selected-count');
const sourceSelect = document.getElementById('crm-source-select');
const sourceNewInput = document.getElementById('crm-source-new');
const pushCrmBtn = document.getElementById('push-crm-btn');

let rows = new Map(); // place_id -> business row
let selected = new Set(); // place_ids currently checked
let nextPageToken = null;
let lastQuery = { category: '', location: '' };
let defaultSource = '';

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('error', isError);
}

function isFlagged(b) {
  if (b.manual_status === 'needs_website') return true;
  if (b.manual_status === 'looks_fine') return false;
  return b.auto_flag && b.auto_flag !== 'ok';
}

function visibleRows() {
  const list = Array.from(rows.values());
  return filterFlagged.checked ? list.filter(isFlagged) : list;
}

function updateSelectionUi() {
  const visible = visibleRows();
  const visibleIds = new Set(visible.map((b) => b.place_id));
  // Drop selections for rows no longer visible (e.g. filter just narrowed) so
  // the count and "select all" checkbox stay honest about what's on screen.
  for (const id of Array.from(selected)) {
    if (!visibleIds.has(id)) selected.delete(id);
  }

  selectedCountEl.textContent = `${selected.size} selected`;
  pushCrmBtn.disabled = selected.size === 0;
  selectAllTh.checked = visible.length > 0 && visible.every((b) => selected.has(b.place_id));
  selectAllTh.indeterminate = selected.size > 0 && !selectAllTh.checked;
}

function render() {
  const list = Array.from(rows.values());
  const visible = visibleRows();

  tbody.innerHTML = '';
  for (const b of visible) {
    tbody.appendChild(renderRow(b));
  }

  table.style.display = list.length ? '' : 'none';
  exportBtn.disabled = visible.length === 0;
  updateSelectionUi();
}

function renderRow(b) {
  const tr = document.createElement('tr');
  tr.dataset.placeId = b.place_id;

  if (b.manual_status === 'looks_fine') {
    tr.classList.add('row-fine');
  } else if (isFlagged(b)) {
    tr.classList.add('row-flagged');
  }

  const website = b.website
    ? `<a class="visit-link" href="${escapeAttr(b.website)}" target="_blank" rel="noopener noreferrer">Open site →</a>`
    : `<span class="no-website">No website</span>`;

  const badge = `<span class="badge badge-${b.auto_flag}">${AUTO_LABELS[b.auto_flag] || b.auto_flag}</span>`;
  const reason = b.auto_reason ? `<div class="manual-tag">${escapeHtml(b.auto_reason)}</div>` : '';

  const crmStatus = b.pushed_to_crm_at
    ? `<span class="crm-pushed" title="${escapeAttr(b.pushed_to_crm_at)}">✓ In CRM</span>`
    : '<span class="crm-not-pushed">—</span>';

  tr.innerHTML = `
    <td><input type="checkbox" class="row-select" ${selected.has(b.place_id) ? 'checked' : ''} /></td>
    <td>${escapeHtml(b.name || '')}</td>
    <td>${escapeHtml(b.phone || '—')}</td>
    <td>${escapeHtml(b.address || '')}</td>
    <td>${b.rating ? `${b.rating}★ (${b.rating_count ?? 0})` : '—'}</td>
    <td>${badge}${reason}</td>
    <td>${website}</td>
    <td>
      <span class="manual-tag">${manualLabel(b.manual_status)}</span>
      <div class="mark-group">
        <button class="needs ${b.manual_status === 'needs_website' ? 'active' : ''}" data-action="needs_website">Needs site</button>
        <button class="fine ${b.manual_status === 'looks_fine' ? 'active' : ''}" data-action="looks_fine">Looks fine</button>
        <button class="clear" data-action="clear">Clear</button>
      </div>
    </td>
    <td>${crmStatus}</td>
  `;

  tr.querySelectorAll('.mark-group button').forEach((btn) => {
    btn.addEventListener('click', () => mark(b.place_id, btn.dataset.action));
  });

  tr.querySelector('.row-select').addEventListener('change', (e) => {
    if (e.target.checked) selected.add(b.place_id);
    else selected.delete(b.place_id);
    updateSelectionUi();
  });

  return tr;
}

function manualLabel(status) {
  if (status === 'needs_website') return 'Marked: needs website';
  if (status === 'looks_fine') return 'Marked: looks fine';
  return 'Not reviewed yet';
}

async function mark(placeId, action) {
  const status = action === 'clear' ? null : action;
  try {
    const res = await fetch('/api/mark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId, status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save.');
    rows.set(placeId, data.business);
    render();
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function runSearch({ append = false } = {}) {
  const category = categoryInput.value.trim();
  const location = locationInput.value.trim();
  if (!category || !location) return;

  if (!append) {
    rows = new Map();
    selected = new Set();
    nextPageToken = null;
    lastQuery = { category, location };
  }

  searchBtn.disabled = true;
  loadMoreBtn.disabled = true;
  setStatus(append ? 'Loading more results…' : `Searching for "${category}" in "${location}"…`);

  try {
    const body = append ? { pageToken: nextPageToken } : { category, location };
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Search failed.');

    for (const b of data.results) rows.set(b.place_id, b);
    nextPageToken = data.nextPageToken || null;
    loadMoreBtn.style.display = nextPageToken ? '' : 'none';

    render();
    setStatus(`${rows.size} result(s) so far.`);
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    searchBtn.disabled = false;
    loadMoreBtn.disabled = false;
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  runSearch({ append: false });
});

loadMoreBtn.addEventListener('click', () => runSearch({ append: true }));
filterFlagged.addEventListener('change', render);

selectAllTh.addEventListener('change', () => {
  const visible = visibleRows();
  if (selectAllTh.checked) {
    for (const b of visible) selected.add(b.place_id);
  } else {
    for (const b of visible) selected.delete(b.place_id);
  }
  render();
});

// --- CRM source picker ---

async function loadCrmSources() {
  try {
    const [configRes, sourcesRes] = await Promise.all([
      fetch('/api/crm-config'),
      fetch('/api/crm-sources'),
    ]);
    const config = await configRes.json();
    defaultSource = config.defaultSource || '';

    if (!sourcesRes.ok) {
      const err = await sourcesRes.json();
      throw new Error(err.error || 'Failed to load CRM sources.');
    }
    const { sources } = await sourcesRes.json();
    populateSourceSelect(sources);
  } catch (err) {
    sourceSelect.innerHTML = '<option value="">CRM not reachable</option>';
    sourceSelect.disabled = true;
    setStatus(`Couldn't load CRM lead sources: ${err.message}`, true);
  }
}

function populateSourceSelect(sources) {
  sourceSelect.innerHTML = '';
  for (const name of sources) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    sourceSelect.appendChild(opt);
  }
  const addOpt = document.createElement('option');
  addOpt.value = NEW_SOURCE_VALUE;
  addOpt.textContent = '+ Add new source…';
  sourceSelect.appendChild(addOpt);

  if (defaultSource && sources.includes(defaultSource)) {
    sourceSelect.value = defaultSource;
  } else if (sources.length > 0) {
    sourceSelect.value = sources[0];
  } else {
    sourceSelect.value = NEW_SOURCE_VALUE;
  }
  sourceSelect.dispatchEvent(new Event('change'));
}

sourceSelect.addEventListener('change', () => {
  const isNew = sourceSelect.value === NEW_SOURCE_VALUE;
  sourceNewInput.style.display = isNew ? '' : 'none';
  if (isNew) sourceNewInput.focus();
});

loadCrmSources();

// --- Push to CRM ---

pushCrmBtn.addEventListener('click', async () => {
  const placeIds = Array.from(selected);
  if (placeIds.length === 0) return;

  const source =
    sourceSelect.value === NEW_SOURCE_VALUE ? sourceNewInput.value.trim() : sourceSelect.value;
  if (!source) {
    setStatus('Pick a lead source or type a new one first.', true);
    return;
  }

  pushCrmBtn.disabled = true;
  setStatus(`Pushing ${placeIds.length} lead(s) to the CRM under "${source}"…`);

  try {
    const res = await fetch('/api/push-to-crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeIds, source }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Push failed.');

    for (const [placeId, business] of Object.entries(data.updatedBusinesses || {})) {
      rows.set(placeId, business);
      selected.delete(placeId);
    }
    render();

    const skippedNoPhone = data.skippedNoPhone?.length || 0;
    const parts = [`${data.created} pushed`, `${data.duplicate} already in CRM`];
    if (skippedNoPhone) parts.push(`${skippedNoPhone} skipped (no usable phone)`);
    setStatus(parts.join(', ') + '.');

    // A newly-typed source is now real in the CRM -- refresh the dropdown
    // so it's pickable (not just re-typeable) on the next push.
    if (sourceSelect.value === NEW_SOURCE_VALUE) loadCrmSources();
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    updateSelectionUi();
  }
});

exportBtn.addEventListener('click', () => {
  const visible = visibleRows();
  const header = ['Business Name', 'Phone', 'Address', 'Website', 'Auto Suggestion', 'Manual Status'];
  const lines = [header.join(',')];

  for (const b of visible) {
    lines.push(
      [
        csvCell(b.name),
        csvCell(b.phone),
        csvCell(b.address),
        csvCell(b.website || 'none'),
        csvCell(AUTO_LABELS[b.auto_flag] || b.auto_flag),
        csvCell(manualLabel(b.manual_status)),
      ].join(',')
    );
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeCat = (lastQuery.category || 'leads').replace(/[^a-z0-9]+/gi, '-');
  const safeLoc = (lastQuery.location || '').replace(/[^a-z0-9]+/gi, '-');
  a.href = url;
  a.download = `leads-${safeCat}-${safeLoc}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

function csvCell(value) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function escapeAttr(str) {
  return escapeHtml(str);
}
