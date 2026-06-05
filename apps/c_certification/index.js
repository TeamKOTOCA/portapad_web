const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const output = document.getElementById('output');
const context = canvas.getContext('2d');

function loadJsQR() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/jsqr/dist/jsQR.js';
    script.onload = () => {
      if (typeof jsQR !== 'undefined') {
        resolve(jsQR);
      } else {
        reject(new Error('jsQR の読み込みに失敗しました'));
      }
    };
    script.onerror = () => reject(new Error('jsQR のスクリプト読み込みに失敗しました'));
    document.head.appendChild(script);
  });
}

async function startScanner() {
  const qr = await loadJsQR();

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
  });

  video.srcObject = stream;
  video.setAttribute('playsinline', 'true');
  await video.play();

  const tick = () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = qr(imageData.data, imageData.width, imageData.height);

      if (code?.data) {
        output.textContent = code.data;

        try {
          const decoded = atob(code.data);
          if (decoded.length !== 32) {
            output.textContent = '読み取りましたが、鍵の形式が正しくありません。';
            requestAnimationFrame(tick);
            return;
          }

          if (!window.pccode) {
            output.textContent = 'PC コードが未設定です。先に接続を開始してください。';
            requestAnimationFrame(tick);
            return;
          }

          localStorage.setItem(window.pccode, code.data);
          window.SendRtcCust('cc');
          location.reload();
          return;
        } catch (error) {
          output.textContent = 'Base64 ではないため保存できません。';
        }
      }
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

startScanner().catch(error => {
  console.error('QR スキャナーの起動に失敗しました', error);
  if (output) {
    output.textContent = 'カメラを開始できませんでした。';
  }
});
