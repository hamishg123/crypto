import { COINS, maskAddress, validateWalletAddress } from './core.js';

const $ = (selector) => document.querySelector(selector);
const workerSupported = typeof Worker !== 'undefined' && Boolean(globalThis.crypto?.subtle);
const walletKey = 'fieldnote.publicWallet.v1';
const statusPill = $('#session-status');
const statusText = statusPill.querySelector('span');
const consent = $('#consent');
const startButton = $('#start-button');
const pauseButton = $('#pause-button');
const stopButton = $('#stop-button');
const workload = $('#workload');
const dialog = $('#wallet-review');
let worker;
let sessionState = 'stopped';
let startedAt = 0;
let elapsedBeforePause = 0;
let totalHashes = 0;
let lastHashSampleAt = 0;
let lastHashSampleCount = 0;
let hashRate = 0;
let pendingWallet = null;
let currentWallet = null;
let revealAddress = false;
let notificationEnabled = false;
let toastTimeout;

function setStatus(state, label) {
  sessionState = state;
  statusText.textContent = label;
  statusPill.classList.toggle('is-running', state === 'running');
  statusPill.classList.toggle('is-paused', state === 'paused');
  $('#telemetry-state').textContent = state === 'running' ? 'WORKING' : state === 'paused' ? 'PAUSED' : 'IDLE';
  $('#telemetry-state').parentElement.classList.toggle('is-live', state === 'running');
  $('.pulse-mark').classList.toggle('is-live', state === 'running');
  $('#telemetry-note').textContent = state === 'running'
    ? 'Local hashing is active; no pool or chain connection.'
    : state === 'paused' ? 'Benchmark paused. Resume only when you are ready.' : 'No computation is running.';
  pauseButton.textContent = state === 'paused' ? 'Resume' : 'Pause';
  pauseButton.disabled = state === 'stopped';
  stopButton.disabled = state === 'stopped';
  startButton.disabled = !workerSupported || !consent.checked || state !== 'stopped';
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

function setWalletMessage(message) {
  $('#control-message').textContent = message;
}

function currentElapsedMs() {
  return elapsedBeforePause + (sessionState === 'running' ? Math.max(0, Date.now() - startedAt) : 0);
}

function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function updateMetrics() {
  $('#hash-count').textContent = totalHashes.toLocaleString();
  $('#elapsed').textContent = formatDuration(currentElapsedMs());
  $('#hashrate').textContent = sessionState === 'stopped' && totalHashes === 0
    ? '—'
    : `${Math.max(0, Math.round(hashRate)).toLocaleString()}`;
}

function notify(title, body) {
  if (notificationEnabled && 'Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: new URL('./brand.svg', import.meta.url).href, tag: 'fieldnote-bench' }); } catch { /* Browser may block notifications in this context. */ }
  }
}

function onWorkerMessage(event) {
  const message = event.data ?? {};
  if (message.type === 'hashes') {
    totalHashes += Number(message.count) || 0;
    const now = performance.now();
    if (!lastHashSampleAt) {
      lastHashSampleAt = now;
      lastHashSampleCount = totalHashes;
    } else if (now - lastHashSampleAt >= 1000) {
      hashRate = (totalHashes - lastHashSampleCount) / ((now - lastHashSampleAt) / 1000);
      lastHashSampleAt = now;
      lastHashSampleCount = totalHashes;
    }
    updateMetrics();
  } else if (message.type === 'error') {
    terminateWorker();
    setStatus('stopped', 'Stopped · worker error');
    setWalletMessage(`Benchmark stopped: ${message.message}`);
    updateMetrics();
  }
}

function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = undefined;
  }
}

function startBenchmark() {
  if (!workerSupported || !consent.checked || sessionState !== 'stopped') return;
  try {
    worker = new Worker(new URL('./hash-worker.js', import.meta.url));
    worker.addEventListener('message', onWorkerMessage);
    worker.addEventListener('error', () => {
      terminateWorker();
      setStatus('stopped', 'Stopped · unsupported worker');
      setWalletMessage('Your browser stopped the worker. The benchmark has been stopped.');
    }, { once: true });
    totalHashes = 0;
    hashRate = 0;
    elapsedBeforePause = 0;
    startedAt = Date.now();
    lastHashSampleAt = 0;
    lastHashSampleCount = 0;
    worker.postMessage({ type: 'start', dutyPercent: Number(workload.value) });
    $('#connection-state').textContent = 'No pool';
    setStatus('running', 'Running · local only');
    setWalletMessage('Running locally. This benchmark cannot earn or send cryptocurrency.');
    updateMetrics();
  } catch {
    terminateWorker();
    setStatus('stopped', 'Unsupported browser');
    setWalletMessage('A secure browser worker is not available. No mining was started.');
  }
}

function pauseBenchmark(autoPaused = false) {
  if (sessionState !== 'running') return;
  elapsedBeforePause += Math.max(0, Date.now() - startedAt);
  worker?.postMessage({ type: 'pause' });
  setStatus('paused', autoPaused ? 'Paused · tab hidden' : 'Paused');
  updateMetrics();
  if (autoPaused) {
    notify('Benchmark paused', 'Fieldnote paused local hashing because this browser tab is hidden.');
    setWalletMessage('Paused because this tab is hidden. Return and choose Resume to continue.');
  }
}

function resumeBenchmark() {
  if (sessionState !== 'paused') return;
  startedAt = Date.now();
  worker?.postMessage({ type: 'resume', dutyPercent: Number(workload.value) });
  setStatus('running', 'Running · local only');
  setWalletMessage('Running locally. This benchmark cannot earn or send cryptocurrency.');
}

function stopBenchmark() {
  if (sessionState === 'running') elapsedBeforePause += Math.max(0, Date.now() - startedAt);
  worker?.postMessage({ type: 'stop' });
  terminateWorker();
  hashRate = 0;
  setStatus('stopped', 'Stopped');
  setWalletMessage(totalHashes ? 'Benchmark stopped. Results are local hashes only; no coins were earned.' : 'Benchmark stopped.');
  updateMetrics();
}

function renderWallet() {
  const empty = $('#wallet-empty');
  const linked = $('#wallet-linked');
  empty.hidden = Boolean(currentWallet);
  linked.hidden = !currentWallet;
  $('#payout-destination').textContent = currentWallet
    ? `${COINS[currentWallet.coin].symbol} · ${maskAddress(currentWallet.address)}`
    : 'No address linked';
  if (!currentWallet) return;
  $('#linked-coin').textContent = `${COINS[currentWallet.coin].name} · ${COINS[currentWallet.coin].network.replace(`${COINS[currentWallet.coin].name} `, '')}`;
  $('#address-display').textContent = revealAddress ? currentWallet.address : maskAddress(currentWallet.address);
  $('#toggle-address').textContent = revealAddress ? 'Mask' : 'Reveal';
}

function loadWallet() {
  try {
    const raw = localStorage.getItem(walletKey);
    if (!raw) return;
    const saved = JSON.parse(raw);
    const validation = validateWalletAddress(saved.coin, saved.address);
    if (validation.valid && COINS[saved.coin]) currentWallet = saved;
    else localStorage.removeItem(walletKey);
  } catch { currentWallet = null; }
  renderWallet();
}

function openWalletForm(editing = false) {
  if (editing && currentWallet) {
    $('#coin-select').value = currentWallet.coin;
    $('#address-input').value = currentWallet.address;
  } else {
    $('#address-input').value = '';
  }
  $('#wallet-entry').hidden = false;
  $('#wallet-empty').querySelector('p').hidden = true;
  $('#open-wallet').hidden = true;
  $('#address-input').focus();
}

function closeWalletForm() {
  $('#wallet-entry').hidden = true;
  $('#wallet-empty').querySelector('p').hidden = false;
  $('#open-wallet').hidden = false;
  $('#address-error').textContent = '';
}

function prepareWalletReview() {
  const coin = $('#coin-select').value;
  const address = $('#address-input').value.trim();
  const result = validateWalletAddress(coin, address);
  if (!result.valid) {
    $('#address-error').textContent = result.message;
    $('#address-input').setAttribute('aria-invalid', 'true');
    return;
  }
  $('#address-input').removeAttribute('aria-invalid');
  $('#address-error').textContent = '';
  pendingWallet = { coin, address };
  $('#review-network').textContent = `${COINS[coin].name} · ${COINS[coin].network}`;
  $('#review-address').textContent = address;
  dialog.showModal();
}

function saveWallet() {
  if (!pendingWallet) return;
  try {
    localStorage.setItem(walletKey, JSON.stringify(pendingWallet));
    currentWallet = pendingWallet;
    pendingWallet = null;
    revealAddress = false;
    dialog.close();
    closeWalletForm();
    renderWallet();
    showToast('Public address saved on this device.');
  } catch {
    $('#address-error').textContent = 'This browser could not save local storage. Your address was not saved.';
    dialog.close();
  }
}

consent.addEventListener('change', () => {
  startButton.disabled = !workerSupported || !consent.checked || sessionState !== 'stopped';
  setWalletMessage(consent.checked
    ? 'Consent recorded for this page session. Review the CPU and battery warning before starting.'
    : 'Tick the consent box to enable the benchmark.');
});
startButton.addEventListener('click', startBenchmark);
pauseButton.addEventListener('click', () => sessionState === 'running' ? pauseBenchmark() : resumeBenchmark());
stopButton.addEventListener('click', stopBenchmark);
workload.addEventListener('input', () => {
  const value = Number(workload.value);
  $('#workload-value').textContent = String(value);
  $('#metric-duty').textContent = String(value);
  if (sessionState !== 'stopped') worker?.postMessage({ type: 'intensity', dutyPercent: value });
});

$('#notification-button').addEventListener('click', async () => {
  const feedback = $('#notification-feedback');
  if (!('Notification' in window)) {
    feedback.textContent = 'Notifications are not supported in this browser.';
    return;
  }
  if (Notification.permission === 'denied') {
    feedback.textContent = 'Notifications are blocked in browser settings.';
    return;
  }
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  notificationEnabled = permission === 'granted';
  feedback.textContent = notificationEnabled
    ? 'Alerts enabled. This page may notify you when the benchmark auto-pauses.'
    : 'Alerts were not enabled. The benchmark still works without notifications.';
  $('#notification-button').textContent = notificationEnabled ? 'Alerts enabled' : 'Enable alerts';
  $('#notification-button').disabled = notificationEnabled;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && sessionState === 'running') pauseBenchmark(true);
});
window.addEventListener('beforeunload', terminateWorker);

$('#open-wallet').addEventListener('click', () => openWalletForm());
$('#edit-wallet').addEventListener('click', () => openWalletForm(true));
$('#cancel-wallet').addEventListener('click', () => dialog.close());
$('#confirm-wallet').addEventListener('click', saveWallet);
$('#toggle-address').addEventListener('click', () => {
  revealAddress = !revealAddress;
  renderWallet();
});
$('#unlink-wallet').addEventListener('click', () => {
  if (!currentWallet || !window.confirm('Unlink and remove this public address from local storage on this device?')) return;
  localStorage.removeItem(walletKey);
  currentWallet = null;
  revealAddress = false;
  renderWallet();
  showToast('Address removed from this device.');
});
$('#wallet-form').addEventListener('submit', (event) => {
  event.preventDefault();
  prepareWalletReview();
});
$('#address-input').addEventListener('input', () => $('#address-input').removeAttribute('aria-invalid'));

document.addEventListener('click', (event) => {
  if (event.target.matches('[data-close-wallet]')) closeWalletForm();
});

if (!workerSupported) {
  setStatus('stopped', 'Unsupported browser');
  $('#control-message').textContent = 'A secure Web Worker and Web Crypto are required. This browser is unsupported; no work has started.';
  $('#start-button').disabled = true;
} else {
  setStatus('stopped', 'Stopped');
}
loadWallet();
updateMetrics();
setInterval(updateMetrics, 500);
