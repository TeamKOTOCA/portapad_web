        var ws;
        ws = new WebSocket('wss://portapad-signal.onrender.com');
        console.log('wss://portapad-signal.onrender.com');

        // WebRTCの初期化
        const pc = new RTCPeerConnection();
        // ICE候補の保留
        const pendingIceCandidates = [];
        let fromhost = null;

        const dataChannel = pc.createDataChannel("operate");
        // データチャネルのイベントハンドラ
        dataChannel.onopen = () => {
            console.log("データチャネルが開きました！");
            dataChannel.onmessage = (event) => {
                console.log("受信したメッセージ:", event.data);
            };
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
                    const candidate = new RTCIceCandidate(JSON.parse(message.body));
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

    function SendRtcMBtn(btype){
        const sendbtn = "bt" + btype;
        if (dataChannel && dataChannel.readyState === "open") {
            dataChannel.send(sendbtn);
        } else {
            console.log("dataChannelがまだ開いていません!");
        }
    }
    function SendRtcMMove(x,y){
        const sendmove = "mm" + x + "," + y;
        if (dataChannel && dataChannel.readyState === "open") {
            dataChannel.send(sendmove);
        } else {
            console.log("dataChannelがまだ開いていません!");
        }
    }