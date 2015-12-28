var newWindow = document.querySelector("#new_window");
var newChatWindow = document.querySelector("#new_chat");
var newMemoryWindow = document.querySelector("#new_memory");
var container = document.querySelector("#window_container");

var Chat = require("./Chat");
var Memory = require("./Memory");

var moving = null;

var chat = null;

// The distance of the cursor to the edge of the element
var distance = {
    x: 0,
    y: 0
};

var mousePos = {
    x: 0,
    y: 0
};

newWindow.addEventListener("click", function() {
    var appWindow = createAppWindow();

    container.appendChild(appWindow);
});

newChatWindow.addEventListener("click", function() {
    if (!chat) {
        chat = new Chat();
    }

    var chatContent = chat.chatContent.cloneNode(true);
    var appWindow = createAppWindow("Webchat");
    var template = document.querySelector("#web-chat");
    var chatWindow = document.importNode(template.content, true).querySelector(".chat-window");
    var chatForm = chatWindow.querySelector(".chat-form");
    chatWindow.insertBefore(chatContent, chatForm);

    chatForm.addEventListener("submit", function(event) {
        event.preventDefault();

        chat.sendMessage(event.target.elements[0].value);

        event.target.elements[0].value = "";
    });

    appWindow.querySelector(".app-container").appendChild(chatWindow);

    container.appendChild(appWindow);
});

newMemoryWindow.addEventListener("click", function() {
    var appWindow = createAppWindow("Memory");
    var appContainer = appWindow.querySelector(".app-container");
    var memoryContainer = document.createElement("div");
    memoryContainer.classList.add("memory-container");
    memoryContainer.style.width = (4 * 36) + "px";
    memoryContainer.style.height = (4 * 36) + "px";
    var memory = new Memory();

    memory.attachBoard(memoryContainer);

    appContainer.appendChild(memoryContainer);

    container.appendChild(appWindow);
});

var createAppWindow = function(name) {
    name = name || "Blank window";
    var template = document.querySelector("#window-template");
    var appWindow = document.importNode(template.content, true).querySelector(".appWindow");
    var toolbar = appWindow.querySelector(".toolbar");
    var appName = document.createTextNode(name);

    var closeWindow = appWindow.querySelector(".closeWindow");

    toolbar.insertBefore(appName, closeWindow);

    toolbar.addEventListener("mousedown", giveFocus);

    closeWindow.addEventListener("click", function(event) {
        container.removeChild(event.target.parentNode.parentNode);
    });

    if (container.lastElementChild) {
        appWindow.style.top = (container.lastElementChild.offsetTop + 20) + "px";
        appWindow.style.left = (container.lastElementChild.offsetLeft + 20) + "px";
    }

    return appWindow;
};

var moveWindow = function(event) {
    mousePos.x = event.clientX - container.offsetLeft;
    mousePos.y = event.clientY - container.offsetTop;

    if (moving) {
        event.preventDefault();

        moving.style.top =  mousePos.y - distance.y + "px";
        moving.style.left =  mousePos.x - distance.x + "px";

        if (moving.offsetTop < 0) {
            moving.style.top = 0;
        }
    }
};

var giveFocus = function(event) {
    var forEach = Array.prototype.forEach;
    var windows = document.querySelectorAll(".appWindow");

    forEach.call(windows, function(item) {
        item.style.zIndex = "-1";
    });

    event.target.parentNode.style.zIndex = "1";

    moving = event.target.parentNode;

    distance.x = mousePos.x - event.target.parentNode.offsetLeft;
    distance.y = mousePos.y - event.target.parentNode.offsetTop;
};

document.addEventListener("mousemove", moveWindow);
document.addEventListener("mouseup", function() {
    moving = null;
});
