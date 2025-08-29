var menu_view = false;
var menu_btn = document.getElementById("hamburger");
var menu = document.getElementById("menu");
function hamburger(){
    if(menu_view == false){
        menu.classList.remove("closemenu");
        menu.classList.add("showmenu");
        menu_btn.src = "../../ham_close.png";
        menu_view = true;
    }else{
        menu.classList.remove("showmenu");
        menu.classList.add("closemenu");
        menu_btn.src = "../../humbar.png";
        menu_view = false;
    }
}