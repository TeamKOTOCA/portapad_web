const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const output = document.getElementById('output');
const context = canvas.getContext('2d');

// jsQRを読み込む関数
function loadJsQR() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/jsqr/dist/jsQR.js';
    script.onload = () => {
      if (typeof jsQR !== "undefined") {
        resolve(jsQR);
      } else {
        reject(new Error("jsQR failed to load"));
      }
    };
    script.onerror = () => reject(new Error("jsQR script load error"));
    document.head.appendChild(script);
  });
}

// メイン処理
loadJsQR().then(() => {
  // カメラ起動
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      video.srcObject = stream;
      video.setAttribute("playsinline", true); // iOS対応
      requestAnimationFrame(tick);
    });

  function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
          output.textContent = code.data;
          // Base64としてデコードできるか & 32バイトか
          try {
            const decoded = atob(code.data);
            if (decoded.length === 32) {
              output.textContent += " ✅ 有効なEd25519秘密鍵です";
              localStorage.setItem(window.pccode, code.data);
              //window.changepage("c_manu");
              location.reload();
            } else {
              output.textContent += " ❌ 長さが32バイトではありません";
            }
          } catch (e) {
            output.textContent += " ❌ Base64として無効です";
          }
      } else {
        output.textContent = "なし";
      }
    }
    requestAnimationFrame(tick);
  }
}).catch(err => {
  console.error("jsQRの読み込み失敗:", err);
  output.textContent = "QRライブラリの読み込みに失敗しました";
});
