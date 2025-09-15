// 공통 함수 정의
function fnLogin() { location.href = "project-login.html"; }
function fnstoreList(num, kind) { location.href = "project-board.html?kind=" + num + "&THEME=" + kind; }
function fnSearch() { location.href = "project-search.html"; }
function fnMyPage() { location.href = "project-mypage.html"; }

// 시계
function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById("clock");
    if(clockEl) clockEl.innerText = now.toLocaleDateString() + " " + now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// DOM 준비 후 header/footer 로드
$(document).ready(function(){
    $("#header-container").load("header.html", function(response, status, xhr){
        if(status == "error"){
            console.error("header 로드 실패: " + xhr.status + " " + xhr.statusText);
        }
    });

    $("#footer-container").load("footer.html", function(response, status, xhr){
        if(status == "error"){
            console.error("footer 로드 실패: " + xhr.status + " " + xhr.statusText);
        }
    });
});
