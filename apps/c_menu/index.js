window.fullscreen = async function fullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch (error) {
    console.warn('フルスクリーン化に失敗しました', error);
  }
};
