var newWindow = document.querySelector("#new_window");
var container = document.querySelector("#window_container");

newWindow.addEventListener("click", function () {
    var div = document.createElement("div");
    div.classList.add("window");

    if(container.firstElementChild) {
        div.style.top = (container.lastElementChild.offsetTop + 10) + "px";
        div.style.left = (container.lastElementChild.offsetLeft + 10) + "px";
    }

    document.querySelector("#window_container").appendChild(div);
});
