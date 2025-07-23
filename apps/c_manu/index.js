window.fullscreen = function(){
    try{
        document.body.requestFullscreen();
    }catch{}
    try{
        document.body.requestWakeLock();
    }catch{}
    try{
        document.getElementById('full_screen').remove();
    }catch{}
}