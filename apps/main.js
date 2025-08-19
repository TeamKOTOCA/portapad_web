        //シグナリングサーバーが設定されていなければ公式のものを追加
        if(localStorage.getItem("sigserver") == null || localStorage.getItem("sigserver") == ""){
            localStorage.setItem("sigserver", "wss://portapad-signal.onrender.com");
        }
        var sigserverinput = document.getElementById("sigserver_address");
        sigserverinput.value = localStorage.getItem("sigserver");

        var ws;
        ws = new WebSocket(localStorage.getItem("sigserver"));


        //認証用ed25519のいろいろ
        import * as ed25519 from "https://esm.sh/@noble/ed25519";
        import { sha512 } from "https://esm.sh/@noble/hashes/sha512?target=es2020";
        ed25519.etc.sha512Sync = sha512;
        const base64ToUint8Array = (b64) =>
            Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const uint8ArrayToBase64 = (bytes) =>
            btoa(String.fromCharCode(...bytes));


        // WebRTCの初期化
        let pc;
        if (!pc) {
        pc = new RTCPeerConnection();
        }
        // ICE候補の保留
        const pendingIceCandidates = [];
        let fromhost = null;

        
        window.RCScal = 1;
        window.RCHeight = 1;
        window.RCWidth = 1;
        window.pccode = "";

        const dataChannel = pc.createDataChannel("operate");
        // データチャネルのイベントハンドラ
        dataChannel.onopen = () => {
            console.log("データチャネルが開きました");
            dataChannel.onmessage = async (event) => {
                console.log("受信メッセ:", event.data);
                const datatype = event.data.slice(0,2);
                const databody = event.data.slice(2);
                if(datatype == "ms"){
                    const remotemonitor = databody.split(",");
                    const innerWidth = window.innerWidth;
                    const innerHeight = window.innerHeight;
                    const widthscal = remotemonitor[0] / innerWidth;
                    const heightscal = remotemonitor[1] / innerHeight;
                    RCWidth = remotemonitor[0];
                    RCHeight = remotemonitor[1];
                    if(widthscal < heightscal){
                        console.log("縦のほうが長くなる")
                        RCScal = heightscal;
                    }else if(widthscal > heightscal){
                        console.log("yokoのほうが長くなる")
                        RCScal = widthscal;
                    }
                }else if(datatype == "ca"){
                    window.pccode = databody;
                    //ダミーコードを用意
                    let private_key = "Gj+nyCMQ+Ylu0InwPRTxxyfN2Kc6ycdV7Q/sC4gMisU=";
                    if(localStorage.getItem(databody) !== null){
                        private_key = localStorage.getItem(databody);
                    }
                    try {
                        const secretKey = base64ToUint8Array(private_key.trim());
                        if (secretKey.length !== 32) {
                            throw new Error("秘密鍵は32バイトである必要があります");
                        }

                        //const pubKey = await ed25519.getPublicKey(secretKey);
                        const signature = await ed25519.sign(new TextEncoder().encode(databody), secretKey);
                        const signatureBase64 = uint8ArrayToBase64(signature);
                        dataChannel.send("cb" + signatureBase64);
                        changepage("c_menu");
                    } catch (err) {
                        console.error(err);
                    }
                }else if(datatype == "cb"){
                    changepage("c_certification");
                }

            };
            dataChannel.onclose = () => {
                window.location.reload();
            }
        };

        ws.onopen = () => {
            console.log('WebSocket接続が開きました。');
            ws.send('client');
            ws.send('hostview');
        };

        ws.onmessage = (event) => {
            console.log('WebSocketメッセージ受信:', event.data);
            // 受信したメッセージを処理
            const message = JSON.parse(event.data);

            console.log(event.data);
            if(message.mtype === "hosts"){
                let hostids = JSON.parse(message.body);


                const container = document.getElementById("a_codes");
                container.innerHTML = "";
                console.log("hosts: " + hostids);
                hostids.forEach((id, index) => {
                    container.innerHTML += `
                        <button class="a_card" onclick="peersend('${id}')">
                            <h2>${id}</h2>
                        </button>
                    `;
                });
            }else if(message.mtype === "sdp"){
                // 受信したSDPをリモートのSDPとして設定
                pc.setRemoteDescription(new RTCSessionDescription(message.body))
                    .then(() => {
                        fromhost = message.fromhost;
                        
                        // バッファに貯めたICE候補をまとめて送信
                        pendingIceCandidates.forEach(candidate => {
                            const icesend = {
                                mtype: 'ice',
                                tohost: fromhost,
                                body: candidate
                            };
                            ws.send(JSON.stringify(icesend));
                            console.log("[ICE送信:バッファ] ", icesend);
                        });
                        pendingIceCandidates.length = 0; // バッファクリア
                    })
                    .catch(error => {
                        console.error("setRemoteDescription失敗:", error);
                    });

            } else if(message.mtype === "ice"){
                // ICE候補を追加する前に、必ずsetRemoteDescriptionが完了していることを確認
                console.log("受け取ったICE候補 message.body:", message.body);
                if (pc.remoteDescription) {
                    const candidate = new RTCIceCandidate(message.body);
                    pc.addIceCandidate(candidate)
                        .catch(e => console.error("ICE候補の追加に失敗:", e));
                    console.log("iceきた");
                } else {
                    console.log("[ICEバッファ] Remote descriptionがまだ設定されていないため、候補を保留します。");
                    pendingIceCandidates.push(message.body);
                }
            }
        };

        pc.onicecandidate = (event) => {
            console.log("ice1");
            if (event.candidate) {
                const candidate = event.candidate;
                if (fromhost) {
                    const icesend = {
                        mtype: 'ice',
                        tohost: fromhost,
                        body: candidate
                    };
                    ws.send(JSON.stringify(icesend));
                    console.log("[ICE送信] ", icesend);
                } else {
                    // fromhostなし＞バッファに貯める
                    pendingIceCandidates.push(candidate);
                    console.log("[ICEバッファ] fromhost未定なので一時保存");
                }
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            // エラー発生時の処理を記述
            alert('WebSocket接続でエラーが発生しました。');
        };

        // peersend関数
        window.peersend = function(tohost){
            console.log(tohost);
            pc.createOffer()
            .then(offer => pc.setLocalDescription(offer).then(() => offer)) // 作成したofferをローカルのSDPとして設定
            .then(offer => {
                // offerをJSON形式に変換（シグナリングサーバーへ送信する代わりにコンソールに出力）
                const offerData = {
                    mtype: 'sdpoffer',
                    tohost: tohost,
                    body: JSON.stringify(offer)
                };
                // offerをシグナリングサーバーに送信
                ws.send(JSON.stringify(offerData));
                console.log("[SDP Offer送信]", JSON.stringify(offerData));
            })
            .catch(error => console.error("Offer作成エラー:", error));
        }



        //設定の保存（トップページ）
        window.savesetting_top = function(){
            var sigserverinput = document.getElementById("sigserver_address");
            localStorage.setItem("sigserver", sigserverinput.value);
            window.location.reload()
        }


    //実際に送信する関数

    window.SendRtcMBtn = function(btype){
        const sendbtn = "mb" + btype;
        if (dataChannel && dataChannel.readyState === "open") {
            dataChannel.send(sendbtn);
        } else {
            console.log("dataChannelがまだ開いていません!");
        }
    }
    window.SendRtcMMove = function(x,y){
        const sendmove = "mm" + x + "," + y;
        if (dataChannel && dataChannel.readyState === "open") {
            dataChannel.send(sendmove);
        } else {
            console.log("dataChannelがまだ開いていません!");
        }
    }
    window.SendRtcMPosition = function(x,y){
        const sendmove = "mp" + x + "," + y;
        if (dataChannel && dataChannel.readyState === "open") {
            dataChannel.send(sendmove);
        } else {
            console.log("dataChannelがまだ開いていません!");
        }
    }
    window.SendRtcMDrag = function(x,y){
        const sendmove = "md" + x + "," + y;
        if (dataChannel && dataChannel.readyState === "open") {
            dataChannel.send(sendmove);
        } else {
            console.log("dataChannelがまだ開いていません!");
        }
    }
    window.SendRtcMScroll = function(x,y){
        const sendmove = "ms" + x + "," + y;
        if (dataChannel && dataChannel.readyState === "open") {
            dataChannel.send(sendmove);
        } else {
            console.log("dataChannelがまだ開いていません!");
        }
    }
    window.SendRtcMUp = function(){
        const sendmove = "mu";
        if (dataChannel && dataChannel.readyState === "open") {
            dataChannel.send(sendmove);
        } else {
            console.log("dataChannelがまだ開いていません!");
        }
    }
    window.SendRtcKPush = function(key){
        const sendkey = "kp" + key;
        if (dataChannel && dataChannel.readyState === "open") {
            dataChannel.send(sendkey);
        } else {
            console.log("dataChannelがまだ開いていません");
        }
    }
    window.SendRtcKDown = function(key){
        const sendkey = "kd" + key;
        if (dataChannel && dataChannel.readyState === "open") {
            dataChannel.send(sendkey);
        } else {
            console.log("dataChannelがまだ開いていません");
        }
    }
    window.SendRtcKUp = function(key){
        const sendkey = "ku" + key;
        if (dataChannel && dataChannel.readyState === "open") {
            dataChannel.send(sendkey);
        } else {
            console.log("dataChannelがまだ開いていません");
        }
    }


    //ページ移管
    //changepage('c_b_trackpad')
    //こんな感じで呼び出す
    window.changepage = async function(topage){

        try {
            const res = await fetch("./" + topage +"/index.html");
            if (!res.ok) throw new Error('fetch HTML error');
            const html = await res.text();
            document.getElementById('bodybox').innerHTML = html;
        } catch (e) {
            console.error("html関連エラー: " + e);
        }
        try {
            const res = await fetch("./" + topage +"/index.css");
            const css = await res.text();

            const css_f = "<style>" + css + "</style>";
            document.getElementById('bodybox').innerHTML += css_f;
        } catch (e) {
            console.error("css無しorエラー: " + e);
        }

        try{
            const module = await import(`./${topage}/index.js?${Date.now()}`);
        }catch(e){
            console.error("jsモジュールエラー: " + e);
        }
    }

    window.viewform = function(a){
        window.open(a);
    }