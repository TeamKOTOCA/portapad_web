# portapad_web

PortaPad のスマホ向け Web クライアントです。

## できること

- トップ画面の表示
- スマホからの接続先一覧表示
- トラックパッド、キーボード、テンキーの操作送信
- QR 認証画面の表示

## 起動

```powershell
python -m http.server 8000
```

その後 `http://127.0.0.1:8000/` を開きます。

## 主な入口

- `/index.html`
- `/apps/index.html`
- `/pages/HowToUse/index.html`

## 補足

- `apps/main.js` が画面切り替えと WebSocket / WebRTC の制御を担当します
- 接続先のシグナリングサーバーは設定画面から変更できます
