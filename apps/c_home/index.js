//設定の保存（トップページ）
window.savesetting_top = function(){
    var sigserverinput = document.getElementById("sigserver_address");
    localStorage.setItem("sigserver", sigserverinput.value);
    window.location.reload();
}


        var sigserverinput = document.getElementById("sigserver_address");
        sigserverinput.value = localStorage.getItem("sigserver");