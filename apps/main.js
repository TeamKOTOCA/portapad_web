import * as ed from './libs/ed25519/index.js';

const DEFAULT_SIGSERVER = 'wss://portapad-signal.onrender.com';
const BODY_BOX_ID = 'bodybox';
const DYNAMIC_STYLE_ID = 'dynamic-page-style';

const base64ToUint8Array = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const uint8ArrayToBase64 = bytes => btoa(String.fromCharCode(...bytes));

let ws = null;
let pc = null;
let dataChannel = null;
let currentHostId = null;
let pendingIceCandidates = [];
let pendingSignalMessages = [];
let currentPage = '';
let deferredPrompt = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let shouldReconnect = true;
let signalConnectionState = '未接続';

window.RCScal = 1;
window.RCHeight = 1;
window.RCWidth = 1;
window.pccode = '';

function normalizeSignalServerUrl(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return DEFAULT_SIGSERVER;
  }
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

function getSignalServer() {
  const saved = localStorage.getItem('sigserver');
  if (!saved) {
    localStorage.setItem('sigserver', DEFAULT_SIGSERVER);
    return DEFAULT_SIGSERVER;
  }
  return normalizeSignalServerUrl(saved);
}

function getBodyBox() {
  return document.getElementById(BODY_BOX_ID);
}

function updateConnectionStatusUi() {
  const statusElement = document.getElementById('connectionStatus');
  if (statusElement) {
    statusElement.textContent = signalConnectionState;
  }
}

window.setConnectionStatus = function setConnectionStatus(status) {
  signalConnectionState = status;
  updateConnectionStatusUi();
};

function ensurePeerConnection() {
  if (pc && pc.connectionState !== 'closed') {
    return pc;
  }

  resetPeerConnection();

  pc = new RTCPeerConnection();
  dataChannel = pc.createDataChannel('operate');
  window.dataChannel = dataChannel;

  dataChannel.onopen = () => {
    console.log('データチャネルが開きました');
  };

  dataChannel.onclose = () => {
    console.log('データチャネルが閉じました');
    window.location.reload();
  };

  dataChannel.onmessage = async event => {
    const text = event.data ?? '';
    const datatype = text.slice(0, 2);
    const databody = text.slice(2);

    if (datatype === 'ms') {
      const [remoteWidth = '1', remoteHeight = '1'] = databody.split(',');
      const parsedWidth = Number(remoteWidth) || 1;
      const parsedHeight = Number(remoteHeight) || 1;
      const widthScale = parsedWidth / Math.max(window.innerWidth, 1);
      const heightScale = parsedHeight / Math.max(window.innerHeight, 1);

      window.RCWidth = parsedWidth;
      window.RCHeight = parsedHeight;
      window.RCScal = Math.max(widthScale, heightScale);
      return;
    }

    if (datatype === 'ca') {
      window.pccode = databody;
      const storedKey = localStorage.getItem(databody);

      if (!storedKey) {
        await window.changepage('c_certification');
        return;
      }

      try {
        const secretKey = base64ToUint8Array(storedKey.trim());
        if (secretKey.length !== 32) {
          throw new Error('秘密鍵の長さが不正です');
        }

        const signature = await ed.signAsync(new TextEncoder().encode(databody), secretKey);
        dataChannel.send('cb' + uint8ArrayToBase64(signature));
        await window.changepage('c_menu');
      } catch (error) {
        console.error('署名に失敗しました', error);
        await window.changepage('c_certification');
      }
      return;
    }

    if (datatype === 'cb') {
      await window.changepage('c_certification');
    }
  };

  pc.onicecandidate = event => {
    if (!event.candidate) {
      return;
    }

    const candidate = event.candidate;
    if (!currentHostId) {
      pendingIceCandidates.push(candidate);
      return;
    }

    sendSignal({
      mtype: 'ice',
      tohost: currentHostId,
      body: candidate,
    });
  };

  pc.ondatachannel = event => {
    if (!event.channel) {
      return;
    }
  };

  return pc;
}

function resetPeerConnection() {
  try {
    if (pc) {
      pc.close();
    }
  } catch (error) {
    console.debug('PeerConnection の close に失敗しました', error);
  }

  pc = null;
  dataChannel = null;
  window.dataChannel = null;
  currentHostId = null;
  pendingIceCandidates = [];
}

function sendSignal(payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    pendingSignalMessages.push(payload);
    console.warn('シグナリングサーバーに接続していません。送信を保留しました');
    return;
  }
  ws.send(JSON.stringify(payload));
}

function flushPendingSignals() {
  if (!ws || ws.readyState !== WebSocket.OPEN || pendingSignalMessages.length === 0) {
    return;
  }

  const queue = pendingSignalMessages;
  pendingSignalMessages = [];
  for (const payload of queue) {
    ws.send(JSON.stringify(payload));
  }
}

function flushPendingIceCandidates() {
  if (!currentHostId || pendingIceCandidates.length === 0) {
    return;
  }

  const queue = pendingIceCandidates;
  pendingIceCandidates = [];
  for (const candidate of queue) {
    sendSignal({
      mtype: 'ice',
      tohost: currentHostId,
      body: candidate,
    });
  }
}

function getDynamicStyleElement() {
  let style = document.getElementById(DYNAMIC_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = DYNAMIC_STYLE_ID;
    document.head.appendChild(style);
  }
  return style;
}

function renderHostList(hostIds) {
  const container = document.getElementById('a_codes');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (hostIds.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty_state';
    empty.textContent = '接続できる PC がまだ見つかっていません。';
    container.appendChild(empty);
    return;
  }

  for (const id of hostIds) {
    const button = document.createElement('button');
    button.className = 'a_card';
    button.type = 'button';
    button.addEventListener('click', () => window.peersend(id));

    const heading = document.createElement('h2');
    heading.textContent = id;
    button.appendChild(heading);
    container.appendChild(button);
  }
}

function refreshInstallButton() {
  const button = document.getElementById('installBtn');
  if (!button) {
    return;
  }
  button.hidden = !deferredPrompt;
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect() {
  if (!shouldReconnect) {
    return;
  }

  clearReconnectTimer();
  const delay = Math.min(1000 * (2 ** reconnectAttempt), 15000);
  reconnectAttempt += 1;
  signalConnectionState = `再接続中... (${Math.round(delay / 1000)} 秒後)`;
  updateConnectionStatusUi();
  reconnectTimer = setTimeout(() => {
    connectSignalSocket();
  }, delay);
}

async function loadPageAssets(topage) {
  const box = getBodyBox();
  if (!box) {
    throw new Error('bodybox が見つかりません');
  }

  const htmlResponse = await fetch(`./${topage}/index.html`);
  if (!htmlResponse.ok) {
    throw new Error(`HTML の読み込みに失敗しました: ${topage}`);
  }
  box.innerHTML = await htmlResponse.text();

  const cssResponse = await fetch(`./${topage}/index.css`);
  if (cssResponse.ok) {
    getDynamicStyleElement().textContent = await cssResponse.text();
  } else {
    getDynamicStyleElement().textContent = '';
  }

  try {
    await import(`./${topage}/index.js?ts=${Date.now()}`);
  } catch (error) {
    console.debug(`JS モジュールの読み込みをスキップしました: ${topage}`, error);
  }

  updateConnectionStatusUi();
  refreshInstallButton();
}

async function syncPageHash(topage) {
  if (location.hash !== `#${topage}`) {
    location.hash = topage;
  }
}

window.changepage = async function changepage(topage, options = {}) {
  currentPage = topage;
  await loadPageAssets(topage);
  if (options.syncHash !== false) {
    await syncPageHash(topage);
  }
};

window.viewform = function viewform(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
};

window.fullscreen = async function fullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    console.warn('フルスクリーン化に失敗しました', error);
  }
};

function sendRtc(prefix, value) {
  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(prefix + value);
    return;
  }
  console.warn('データチャネルがまだ開いていません');
}

window.SendRtcMBtn = function SendRtcMBtn(button) {
  sendRtc('mb', button);
};

window.SendRtcMMove = function SendRtcMMove(x, y) {
  sendRtc('mm', `${x},${y}`);
};

window.SendRtcMPosition = function SendRtcMPosition(x, y) {
  sendRtc('mp', `${x},${y}`);
};

window.SendRtcMDrag = function SendRtcMDrag(x, y) {
  sendRtc('md', `${x},${y}`);
};

window.SendRtcMScroll = function SendRtcMScroll(x, y) {
  sendRtc('ms', `${x},${y}`);
};

window.SendRtcMUp = function SendRtcMUp() {
  sendRtc('mu', '');
};

window.SendRtcKPush = function SendRtcKPush(key) {
  sendRtc('kp', key);
};

window.SendRtcKDown = function SendRtcKDown(key) {
  sendRtc('kd', key);
};

window.SendRtcKUp = function SendRtcKUp(key) {
  sendRtc('ku', key);
};

window.SendRtcCust = function SendRtcCust(code) {
  sendRtc('', code);
};

window.installPwa = async function installPwa() {
  if (!deferredPrompt) {
    return;
  }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;

  const button = document.getElementById('installBtn');
  if (button) {
    button.hidden = true;
  }
};

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    refreshInstallButton();
  });
}

function connectSignalSocket() {
  clearReconnectTimer();

  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const server = getSignalServer();
  signalConnectionState = `接続中: ${server}`;
  updateConnectionStatusUi();

  ws = new WebSocket(server);

  ws.addEventListener('open', () => {
    reconnectAttempt = 0;
    ws.send('client');
    ws.send('hostview');
    signalConnectionState = `接続済み: ${server}`;
    updateConnectionStatusUi();
    flushPendingSignals();
  });

  ws.addEventListener('message', async event => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.warn('シグナリングメッセージの解析に失敗しました', error);
      return;
    }

    if (message.mtype === 'hosts') {
      const hostIds = Array.isArray(message.body)
        ? message.body
        : JSON.parse(message.body || '[]');
      renderHostList(hostIds);
      return;
    }

    if (message.mtype === 'sdp') {
      currentHostId = message.fromhost;
      const connection = ensurePeerConnection();

      try {
        await connection.setRemoteDescription(new RTCSessionDescription(message.body));
        flushPendingIceCandidates();
      } catch (error) {
        console.error('SDP の設定に失敗しました', error);
      }
      return;
    }

    if (message.mtype === 'ice') {
      try {
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(message.body));
        } else {
          pendingIceCandidates.push(message.body);
        }
      } catch (error) {
        console.error('ICE 候補の追加に失敗しました', error);
      }
    }
  });

  ws.addEventListener('error', error => {
    console.error('WebSocket エラー', error);
    signalConnectionState = '接続エラー';
    updateConnectionStatusUi();
  });

  ws.addEventListener('close', () => {
    console.warn('シグナリングサーバーとの接続が切れました');
    scheduleReconnect();
  });
}

function setupLocationSync() {
  window.addEventListener('hashchange', () => {
    const page = location.hash ? location.hash.slice(1) : 'c_home';
    if (page !== currentPage) {
      window.changepage(page, { syncHash: false });
    }
  });

  window.addEventListener('load', async () => {
    const initialPage = location.hash ? location.hash.slice(1) : 'c_home';
    await window.changepage(initialPage, { syncHash: false });
  });
}

window.peersend = async function peersend(tohost) {
  const connection = ensurePeerConnection();
  currentHostId = tohost;

  try {
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    sendSignal({
      mtype: 'sdpoffer',
      tohost,
      body: JSON.stringify(offer),
    });
    flushPendingIceCandidates();
  } catch (error) {
    console.error('Offer の作成に失敗しました', error);
  }
};

setupInstallPrompt();
setupSignalSocket();
setupLocationSync();

window.addEventListener('beforeunload', () => {
  shouldReconnect = false;
  clearReconnectTimer();
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
});
