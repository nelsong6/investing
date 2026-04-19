import { CONFIG } from './config.js';

const msalConfig = {
  auth: {
    clientId: CONFIG.microsoftClientId,
    authority: 'https://login.microsoftonline.com/consumers',
    redirectUri: window.location.origin,
  },
};

let msalInstance;
let token = null;
let isAdmin = false;

async function init() {
  msalInstance = new msal.PublicClientApplication(msalConfig);
  await msalInstance.initialize();

  const response = await msalInstance.handleRedirectPromise();
  if (response) {
    await handleAuth(response);
  }

  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    try {
      const silentResponse = await msalInstance.acquireTokenSilent({
        scopes: ['openid', 'profile', 'email'],
        account: accounts[0],
      });
      await handleAuth(silentResponse);
    } catch {
      showLogin();
    }
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('user-bar').classList.remove('hidden');
}

async function handleAuth(response) {
  const res = await fetch('/auth/microsoft/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: response.idToken }),
  });

  if (!res.ok) return showLogin();

  const data = await res.json();
  token = data.token;
  isAdmin = data.user?.role === 'admin';

  document.getElementById('user-bar').classList.remove('hidden');
  document.getElementById('microsoft-login-btn').classList.add('hidden');
  document.getElementById('user-email').textContent = data.user?.email || '';
  document.getElementById('logout-btn').classList.remove('hidden');
  document.getElementById('app').classList.remove('hidden');

  if (isAdmin) {
    document.getElementById('admin-panel').classList.remove('hidden');
  }

  await loadPortfolio();
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
  msalInstance.loginRedirect({
    scopes: ['openid', 'profile', 'email'],
    prompt: 'select_account',
  });
});

document.getElementById('logout-btn').addEventListener('click', () => {
  msalInstance.logoutRedirect();
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
