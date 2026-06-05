window.savesetting_top = function savesetting_top() {
  const input = document.getElementById('sigserver_address');
  const value = input ? input.value.trim() : '';
  if (value) {
    localStorage.setItem('sigserver', normalizeSignalServerUrl(value));
  }
  window.location.reload();
};

function normalizeSignalServerUrl(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) {
    return trimmed;
  }
  if (trimmed.startsWith('http://')) {
    return `ws://${trimmed.slice('http://'.length)}`;
  }
  if (trimmed.startsWith('https://')) {
    return `wss://${trimmed.slice('https://'.length)}`;
  }
  return `wss://${trimmed}`;
}

const sigserverInput = document.getElementById('sigserver_address');
const savedSigserver = localStorage.getItem('sigserver');
if (sigserverInput && savedSigserver) {
  sigserverInput.value = savedSigserver;
}
