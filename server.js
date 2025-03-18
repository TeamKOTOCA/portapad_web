const express = require('express');
const path = require('path');
const http = require('http');//httpsサーバー

const app = express();
const server = http.createServer(app); // HTTPサーバー作成
// /静的ファイルを公開 (http://localhost:3000/)
app.use('/', express.static(path.join(__dirname, 'html')));
app.use('/apps', express.static(path.join(__dirname, 'apps')));

//サーバーを起動
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is started at http://localhost:${PORT}`);
});


//console上での終了操作
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
console.log('終了はqまたはｑと入力');

rl.on('line', (input) => {
    if (input.trim() === 'q' || input.trim() === "ｑ") {
        console.log('終了します。');
        rl.close();
        process.exit(0);
    }
});