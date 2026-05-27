'use strict';

const STORE_KEY = 'grocery-items';
let items = load();
let filter = 'all';

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(items));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function parseInput(raw) {
  raw = raw.trim();
  if (!raw) return null;
  // detect trailing quantity like "milk x2" or "eggs 12"
  const qtyMatch = raw.match(/^(.+?)\s+[xX×]?\s*(\d+)\s*$/);
  if (qtyMatch) return { name: qtyMatch[1].trim(), qty: qtyMatch[2] };
  return { name: raw, qty: null };
}

function addItem(raw) {
  const parsed = parseInput(raw);
  if (!parsed) return;
  items.unshift({ id: uid(), name: parsed.name, qty: parsed.qty, checked: false });
  save();
  render();
}

function toggleItem(id) {
  const item = items.find(i => i.id === id);
  if (item) { item.checked = !item.checked; save(); render(); }
}

function deleteItem(id) {
  items = items.filter(i => i.id !== id);
  save();
  render();
}

function clearChecked() {
  items = items.filter(i => !i.checked);
  save();
  render();
}

function visibleItems() {
  if (filter === 'active') return items.filter(i => !i.checked);
  if (filter === 'checked') return items.filter(i => i.checked);
  return items;
}

function render() {
  const list = document.getElementById('item-list');
  const empty = document.getElementById('empty');
  const summary = document.getElementById('summary');
  const btnClear = document.getElementById('btn-clear');

  const visible = visibleItems();
  const total = items.length;
  const done = items.filter(i => i.checked).length;

  // Summary
  summary.innerHTML = total === 0
    ? 'No items yet'
    : `<strong>${done}/${total}</strong> items done`;

  btnClear.disabled = done === 0;

  // Empty state
  if (visible.length === 0) {
    list.innerHTML = '';
    empty.hidden = false;
    empty.querySelector('p').textContent = filter === 'checked'
      ? 'No checked items'
      : filter === 'active'
      ? 'All done! Nothing left.'
      : 'Add your first item above.';
    return;
  }

  empty.hidden = true;

  // Split active / checked
  const active = visible.filter(i => !i.checked);
  const checked = visible.filter(i => i.checked);

  let html = '';

  if (active.length) {
    if (filter === 'all' && checked.length) html += '<p class="section-label">To buy</p>';
    html += '<ul class="item-list">' + active.map(itemHTML).join('') + '</ul>';
  }
  if (checked.length) {
    if (filter === 'all' && active.length) html += '<p class="section-label">In cart</p>';
    html += '<ul class="item-list">' + checked.map(itemHTML).join('') + '</ul>';
  }

  list.innerHTML = html;

  list.querySelectorAll('.item-check').forEach(btn => {
    btn.addEventListener('click', () => toggleItem(btn.dataset.id));
  });
  list.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', () => deleteItem(btn.dataset.id));
  });
}

function itemHTML(item) {
  const qty = item.qty ? `<span class="item-qty">×${item.qty}</span>` : '';
  return `<li class="item${item.checked ? ' checked' : ''}">
    <button class="item-check" data-id="${item.id}" aria-label="${item.checked ? 'Uncheck' : 'Check'} ${escHtml(item.name)}"></button>
    <span class="item-text">${escHtml(item.name)}</span>
    ${qty}
    <button class="btn-del" data-id="${item.id}" aria-label="Delete ${escHtml(item.name)}">&#x2715;</button>
  </li>`;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('add-form');
  const input = document.getElementById('add-input');

  form.addEventListener('submit', e => {
    e.preventDefault();
    addItem(input.value);
    input.value = '';
  });

  document.getElementById('btn-clear').addEventListener('click', clearChecked);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      render();
    });
  });

  render();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
