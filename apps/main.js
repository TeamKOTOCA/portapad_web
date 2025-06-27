        var ws;
        ws = new WebSocket('wss://portapad-signal.onrender.com');
        console.log('wss://portapad-signal.onrender.com');

        // WebRTCの初期化
        let pc;
        if (!pc) {
        pc = new RTCPeerConnection();
        }
        // ICE候補の保留
        const pendingIceCandidates = [];
        let fromhost = null;

        const dataChannel = pc.createDataChannel("operate");
        // データチャネルのイベントハンドラ
        dataChannel.onopen = () => {
            console.log("データチャネルが開きました");
            changepage("c_manu");
            dataChannel.onmessage = (event) => {
                console.log("受信メッセ:", event.data);
                const datatype = event.data.slice(0,2);
                const databody = event.data.slice(2);
                if(datatype == "ms"){
                    const remotemonitor = databody.split(",");
                    const innerWidth = window.innerWidth;
                    const innerHeight = window.innerHeight;
                    const widthscal = remotemonitor[0] / innerWidth;
                    const heightscal = remotemonitor[1] / innerHeight;
                    if(widthscal == heightscal){
                        console.log("画面比率は同じです")
                    }else if(widthscal <= heightscal){
                        console.log("縦のほうが長くなる")
                    }else if(widthscal >= heightscal){
                        console.log("yokoのほうが長くなる")
                    }
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
        function peersend(tohost){
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
    async function changepage(topage){

        try {
            const res = await fetch("./" + topage +"/index.html");
            if (!res.ok) throw new Error('fetch HTML error');
            const html = await res.text();
            document.getElementById('bodybox').innerHTML = html;
        } catch (e) {
            console.error(e);
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