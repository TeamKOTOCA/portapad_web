// 設定の保存（トップページ）
window.savesetting_top = function () {
    const sigserverinput = document.getElementById("sigserver_address");
    const value = sigserverinput.value.trim();
    localStorage.setItem("sigserver", value);
    window.location.reload();
};

const sigserverinput = document.getElementById("sigserver_address");
const savedSigserver = localStorage.getItem("sigserver");
if (savedSigserver) {
    sigserverinput.value = savedSigserver;
}
