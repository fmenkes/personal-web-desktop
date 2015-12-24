var newWindow = document.querySelector("#new_window");
var container = document.querySelector("#window_container");

var moving = null;

// The distance of the cursor to the edge of the element
var distance = {
    x: 0,
    y: 0
};

var mousePos = {
    x: 0,
    y: 0
};

newWindow.addEventListener("click", function () {
    var template = document.querySelector("#window-template");
    var appWindow = document.importNode(template.content, true);
    var toolbar = appWindow.querySelector(".toolbar");
    var closeWindow = appWindow.querySelector(".closeWindow");

    toolbar.addEventListener("mousedown", function(event) {
        var _ = Array.prototype.forEach;
        var windows = document.querySelectorAll(".appWindow");

        _.call(windows, function(window) {
            window.style.zIndex = "-1";
        });

        event.target.parentNode.style.zIndex = "1";

        moving = event.target.parentNode;

        distance.x = mousePos.x - event.target.parentNode.offsetLeft;
        distance.y = mousePos.y - event.target.parentNode.offsetTop;
    });

    closeWindow.addEventListener("click", function(event) {
        container.removeChild(event.target.parentNode.parentNode);
    });

    if(container.lastElementChild) {
        appWindow.querySelector(".appWindow").style.top = (container.lastElementChild.offsetTop + 10) + "px";
        appWindow.querySelector(".appWindow").style.left = (container.lastElementChild.offsetLeft + 10) + "px";
    }

    document.querySelector("#window_container").appendChild(appWindow);
});

var moveWindow = function (event) {
    mousePos.x = event.clientX - container.offsetLeft;
    mousePos.y = event.clientY - container.offsetTop;

    document.querySelector("#mousepos").textContent = "X: " + mousePos.x + ", Y: " + mousePos.y;

    if(moving) {
        event.preventDefault();
        moving.style.top =  mousePos.y - distance.y + "px";
        moving.style.left =  mousePos.x - distance.x + "px";
    }
};

document.addEventListener("mousemove", moveWindow);
document.addEventListener("mouseup", function() {
    moving = null;
});
