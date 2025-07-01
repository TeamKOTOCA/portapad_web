            console.log("pentab");
            document.body.style.backgroundImage = `url(${localStorage.getItem("backgroundurls")})`;
            var bodybox = document.getElementById("body");
            bodybox.style.height = window.RCHeight / window.RCScal;
            bodybox.style.width = window.RCWidth / window.RCScal;

            bodybox.addEventListener('touchmove', (event) => {
                const touches = event.changedTouches;
                const touch = touches[0];
                var x = Math.floor(touch.clientX) * window.RCScal;
                var y = Math.floor(touch.clientY) * window.RCScal;
                if(x <= window.RCWidth && y <= window.RCHeight){
                    window.SendRtcMPosition(x,y);
                }
            });
            bodybox.addEventListener('touchend', (event) => {

            });