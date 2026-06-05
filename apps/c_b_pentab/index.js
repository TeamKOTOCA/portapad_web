console.log('pentab');

const bodybox = document.getElementById('body');
const background = localStorage.getItem('backgroundurls');

if (background) {
  document.body.style.backgroundImage = `url(${background})`;
}

if (bodybox) {
  const scale = Number(window.RCScal) || 1;
  bodybox.style.height = `${Math.max((Number(window.RCHeight) || 0) / scale, 1)}px`;
  bodybox.style.width = `${Math.max((Number(window.RCWidth) || 0) / scale, 1)}px`;

  bodybox.addEventListener('touchmove', event => {
    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    const x = Math.floor(touch.clientX * scale);
    const y = Math.floor(touch.clientY * scale);
    if (x <= window.RCWidth && y <= window.RCHeight) {
      window.SendRtcMPosition(x, y);
    }
  });
}
