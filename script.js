var menu_view = false;
var menu_btn = document.getElementById("hamburger");
var menu = document.getElementById("menu");
function hamburger(){
    if(menu_view == false){
        menu.classList.remove("closemenu");
        menu.classList.add("showmenu");
        menu_btn.src = "./ham_close.png";
        menu_view = true;
    }else{
        menu.classList.remove("showmenu");
        menu.classList.add("closemenu");
        menu_btn.src = "./humbar.png";
        menu_view = false;
    }
}


document.getElementById("install_btn").addEventListener("click", function() {
    const link = document.createElement("a");
    link.href = "https://github.com/TeamKOTOCA/PortaPad/releases/download/v2.0.1/portapad_installer.exe";
    link.download = "portapad_installer.exe";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
        window.location.href = "./pages/after_download/index.html";
    }, 100);
});