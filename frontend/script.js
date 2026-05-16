import { bootstrapAuth, startLogin, logout, getStoredToken } from './auth.js';

let token = null;
let isAdmin = false;

async function init() {
  document.getElementById('user-bar').classList.remove('hidden');

  const user = await bootstrapAuth();
  if (user) {
    token = getStoredToken();
    onSignedIn(user);
  }
}

function onSignedIn(user) {
  isAdmin = user.role === 'admin';
  document.getElementById('microsoft-login-btn').classList.add('hidden');
  document.getElementById('user-email').textContent = user.email || '';
  document.getElementById('logout-btn').classList.remove('hidden');
  document.getElementById('app').classList.remove('hidden');

  if (isAdmin) {
    document.getElementById('admin-panel').classList.remove('hidden');
  }

  loadPortfolio();
}

async function loadPortfolio() {
  const res = await fetch('/api/portfolio', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return;

  const data = await res.json();
  renderHoldings(data.holdings || []);
}

function renderHoldings(holdings) {
  const tbody = document.querySelector('#holdings-table tbody');
  tbody.innerHTML = '';
  for (const h of holdings) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${h.symbol}</td>
      <td>${h.name}</td>
      <td>${h.allocationPct}%</td>
      <td>${h.sector}</td>
    `;
    tbody.appendChild(tr);
  }
}

document.getElementById('microsoft-login-btn').addEventListener('click', () => {
  startLogin();
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await logout();
});

document.getElementById('import-btn')?.addEventListener('click', () => {
  document.getElementById('import-area').classList.toggle('hidden');
});

document.getElementById('csv-submit')?.addEventListener('click', async () => {
  const csv = document.getElementById('csv-input').value;
  if (!csv.trim()) return;

  await fetch('/api/portfolio/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ csv }),
  });

  await loadPortfolio();
});

init();
