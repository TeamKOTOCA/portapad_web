            console.log("asd");
document.body.style.backgroundImage = `url(${localStorage.getItem("backgroundurls")})`;

            var allview = document.getElementById("body");
            var isdorugX;
            var isdorugY;
            var isright = false;
            var isscroll = false;
            var lastX= 0;
            var lastY= 0;
            var touchtime = 0;
            var touchfingers = 1;

            allview.addEventListener('touchstart', (event) => {
                touchtime = Date.now();
                touchfingers = event.touches.length;
                if (touchfingers === 2) {
                    isright = true;
                    isdorugX = event.touches[0].clientX;
                    isdorugY = event.touches[0].clientY;
                }
            });

            allview.addEventListener('touchend', (event) => {
                console.log(Date.now() - touchtime);
                if(Date.now() - touchtime <= 200){
                    if(touchfingers === 1 && isright == false){
                        window.SendRtcMBtn(0);
                    }else if(touchfingers === 2){
                        window.SendRtcMBtn(1);
                    }
                }
                if(event.touches.length === 0){
                    window.SendRtcMUp();
                }
                isscroll = false;
                isright = false;
            });

            allview.addEventListener('touchmove', (event) => {
                try{
                    document.body.requestFullscreen();
                    document.body.requestWakeLock();
                }catch{}

                const touches = event.changedTouches;
                const touch = touches[0];
                var x = Math.floor(touch.clientX);
                var y = Math.floor(touch.clientY);
                var xdif = x - lastX;
                var ydif = y - lastY;

                if(Math.abs(xdif) <= 20 && Math.abs(ydif) <= 20){
                    //カーソル移動
                    if(event.touches.length == 1){
                        window.SendRtcMMove(xdif,ydif);
                    }else if(event.touches.length == 2){
                        if(!isscroll && Math.abs(event.touches[0].clientX - isdorugX) <= 2 && Math.abs(event.touches[0].clientY - isdorugY) <= 2 && Math.abs(event.touches[1].clientX - isdorugX) >= 2 && Math.abs(event.touches[1].clientY - isdorugY) >= 2 ){
                            //どらっぐ
                            x = event.touches[1].clientX - lastX;
                            y = event.touches[1].clientY - lastY;
                            window.SendRtcMDrag(xdif,ydif);
                            isdorugX = event.touches[0].clientX;
                            isdorugY = event.touches[0].clientY;
                        }else{
                            //スクロール
                            isscroll = true;
                            window.SendRtcMScroll(xdif,ydif);
                        }
                            isdorugX = event.touches[0].clientX;
                            isdorugY = event.touches[0].clientY;
                    }
                }
                    lastX = x;
                    lastY = y;
            });