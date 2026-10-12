// 메뉴 드롭다운: 단추를 누르면 목록이 열리고, 메뉴를 고르거나 바깥을 누르면 닫힌다.
// 2th5.html과 2th5-1.html이 같이 쓴다.

var menu = document.getElementById("menu");
var menuBtn = document.getElementById("menu-btn");

function closeMenu() {
    menu.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
}

menuBtn.addEventListener("click", function (e) {
    e.stopPropagation();          // 바로 아래 document 닫기 처리까지 넘어가지 않게 막는다
    menu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", menu.classList.contains("open"));
});

// 메뉴를 고르거나 화면 아무 곳이나 누르면 닫는다
document.addEventListener("click", closeMenu);

// 키보드 ESC로도 닫는다
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        closeMenu();
    }
});
