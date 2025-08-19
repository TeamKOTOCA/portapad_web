window.fullscreen = function(){
    try{
        document.body.requestFullscreen();
    }catch{}
    try{
        document.body.requestWakeLock();
    }catch{}
    try{
        document.getElementById('full_screen').remove();
    }catch{}
}

    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      // デフォルトのプロンプトを抑制
      e.preventDefault();
      deferredPrompt = e;

      // ボタンを表示
      const installBtn = document.getElementById('installBtn');
      installBtn.style.display = 'inline-block';

      installBtn.addEventListener('click', async () => {
        installBtn.style.display = 'none'; // 二度押し防止
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const result = await deferredPrompt.userChoice;
          if (result.outcome === 'accepted') {
            console.log('ユーザーがインストールを承諾');
          } else {
            console.log('ユーザーがインストールを拒否');
          }
          deferredPrompt = null;
        }
      });
    });