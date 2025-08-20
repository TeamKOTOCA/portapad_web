
const keyMapNoShift = {
  1: 'F1', 2: 'F2', 3: 'F3', 4: 'F4', 5: 'F5', 6: 'F6', 7: 'F7', 8: 'F8',
  9: 'F9', 10: 'F10', 11: 'F11', 12: 'F12', 13: 'NumLock', 14: 'PrintScr',
  15: 'Insert', 16: 'Delete', 17: 'HanZen', 18: '1', 19: '2', 20: '3', 21: '4',
  22: '5', 23: '6', 24: '7', 25: '8', 26: '9', 27: '0', 28: '-', 29: '^',
  30: '¥', 31: 'Backspace', 32: 'Tab', 33: 'q', 34: 'w', 35: 'e', 36: 'r',
  37: 't', 38: 'y', 39: 'u', 40: 'i', 41: 'o', 42: 'p', 43: '@', 44: '[',
  45: 'Enter', 46: 'CapsLock', 47: 'a', 48: 's', 49: 'd', 50: 'f', 51: 'g',
  52: 'h', 53: 'j', 54: 'k', 55: 'l', 56: '+;', 57: '*:', 58: '}]', 59: 'LShift',
  60: 'z', 61: 'x', 62: 'c', 63: 'v', 64: 'b', 65: 'n', 66: 'm', 67: ',',
  68: '.', 69: '/', 70: '\\', 71: 'RShift', 72: '↑', 73: 'Fn', 74: 'LControl',
  75: 'LMeta', 76: 'LAlt', 77: 'NonConvert', 78: 'Space', 79: 'Convert', 80: 'Kana',
  81: 'RAlt', 82: 'RMeta', 83: 'RControl', 84: 'LeftArrow', 85: 'DownArrow', 86: 'RightArrow'
};

// kbd 内のすべてのキーを監視
document.querySelectorAll('.kbd .key').forEach(key => {
  key.addEventListener('touchstart', (e) => {
    e.preventDefault(); // 二重処理防止
    const id = key.dataset.id;
    const value = keyMapNoShift[id];
    console.log('押されたキー:', value);
    window.SendRtcKDown(value);
    
  });
  key.addEventListener('touchend', (e) => {
    e.preventDefault(); // 二重処理防止
    const id = key.dataset.id;
    const value = keyMapNoShift[id];
    console.log('押されたキー:', value);
    window.SendRtcKUp(value);
    
  });

  // クリックでも反応するように（PC向け）
  key.addEventListener('click', () => {
    const id = key.dataset.id;
    const value = keyMapNoShift[id];
    console.log('クリックされたキー:', value);
  });
});
