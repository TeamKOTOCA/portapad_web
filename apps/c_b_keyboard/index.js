const keyMap = {
  1: 'F1',
  2: 'F2',
  3: 'F3',
  4: 'F4',
  5: 'F5',
  6: 'F6',
  7: 'F7',
  8: 'F8',
  9: 'F9',
  10: 'F10',
  11: 'F11',
  12: 'F12',
  13: 'NumLock',
  14: 'PrintScr',
  16: 'Delete',
  17: 'HanZen',
  18: '1',
  19: '2',
  20: '3',
  21: '4',
  22: '5',
  23: '6',
  24: '7',
  25: '8',
  26: '9',
  27: '0',
  28: '=',
  29: '^',
  30: '\\',
  31: 'Backspace',
  32: 'Tab',
  33: 'Q',
  34: 'W',
  35: 'E',
  36: 'R',
  37: 'T',
  38: 'Y',
  39: 'U',
  40: 'I',
  41: 'O',
  42: 'P',
  43: '@',
  44: '[',
  45: 'Enter',
  46: 'CapsLock',
  47: 'A',
  48: 'S',
  49: 'D',
  50: 'F',
  51: 'G',
  52: 'H',
  53: 'J',
  54: 'K',
  55: 'L',
  56: ';',
  57: ':',
  58: ']',
  59: 'Shift',
  60: 'Z',
  61: 'X',
  62: 'C',
  63: 'V',
  64: 'B',
  65: 'N',
  66: 'M',
  67: ',',
  68: '.',
  69: '/',
  70: '\\',
  71: 'Shift',
  72: 'Kana',
  73: null,
  74: 'Ctrl',
  75: 'Win',
  76: 'Alt',
  77: 'NonConvert',
  78: 'Space',
  79: 'Convert',
  80: 'Alt',
  81: 'Win',
  82: 'Ctrl',
  83: 'LeftArrow',
  84: 'DownArrow',
  85: 'RightArrow',
};

const modifierState = {
  Shift: false,
  Ctrl: false,
  Alt: false,
  Win: false,
};

document.querySelectorAll('.kbd .key').forEach(key => {
  const id = Number(key.dataset.id);
  if (id === 0) {
    return;
  }

  key.addEventListener('touchstart', event => {
    event.preventDefault();
    handleKeyDown(key, id);
  });

  key.addEventListener('touchend', event => {
    event.preventDefault();
    handleKeyUp(key, id);
  });
});

function handleKeyDown(key, id) {
  const value = keyMap[id];
  if (!value) {
    return;
  }

  if (value in modifierState) {
    if (modifierState[value]) {
      window.SendRtcKUp(value);
      key.classList.remove('pushedKey');
      modifierState[value] = false;
    } else {
      window.SendRtcKDown(value);
      key.classList.add('pushedKey');
      modifierState[value] = true;
    }
    return;
  }

  window.SendRtcKDown(value);
}

function handleKeyUp(key, id) {
  const value = keyMap[id];
  if (!value) {
    return;
  }

  if (!(value in modifierState)) {
    window.SendRtcKUp(value);
  }
}
