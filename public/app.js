const AUTO_LABELS = {
  no_website: 'No website',
  social_only: 'Social page only',
  unreachable: 'Unreachable',
  broken: 'Broken (HTTP error)',
  no_ssl: 'No HTTPS',
  minimal: 'Placeholder / thin page',
  ok: 'Loaded OK',
};

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

let rows = new Map(); // place_id -> business row
let nextPageToken = null;
let lastQuery = { category: '', location: '' };

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('error', isError);
}

function isFlagged(b) {
  if (b.manual_status === 'needs_website') return true;
  if (b.manual_status === 'looks_fine') return false;
  return b.auto_flag && b.auto_flag !== 'ok';
}

function render() {
  const list = Array.from(rows.values());
  const visible = filterFlagged.checked ? list.filter(isFlagged) : list;

  tbody.innerHTML = '';
  for (const b of visible) {
    tbody.appendChild(renderRow(b));
  }

  table.style.display = list.length ? '' : 'none';
  exportBtn.disabled = visible.length === 0;
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

  tr.innerHTML = `
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
  `;

  tr.querySelectorAll('.mark-group button').forEach((btn) => {
    btn.addEventListener('click', () => mark(b.place_id, btn.dataset.action));
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

exportBtn.addEventListener('click', () => {
  const list = Array.from(rows.values());
  const visible = filterFlagged.checked ? list.filter(isFlagged) : list;
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
