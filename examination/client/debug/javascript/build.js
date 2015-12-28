(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function Chat() {
    var _this = this;

    this.lastLines = [];
    this.chatContent = document.createElement("div");
    this.chatContent.classList.add("chat-content");
    this.username = "fp";
    this.apiKey = "eDBE76deU7L0H9mEBgxUKVR0VCnq0XBd";
    this.socket = new WebSocket("ws://vhost3.lnu.se:20080/socket/");

    // TODO: Make sure the socket opens before the user can send messages

    this.socket.addEventListener("message", function(event) {
        console.log(event.data);

        var message = JSON.parse(event.data);

        if (message.type != "heartbeat") {
            _this.appendLine(message.username, message.data);
        }
    });
}

Chat.prototype.appendLine = function(username, line) {
    this.lastLines.push(username + ": " + line);
    if (this.lastLines.length > 20) {
        this.lastLines.shift();
    }

    this.convertLinesToHTML();
};

Chat.prototype.convertLinesToHTML = function() {
    var _this = this;

    while (this.chatContent.hasChildNodes()) {
        this.chatContent.removeChild(this.chatContent.firstElementChild);
    }

    this.lastLines.forEach(function(line) {
        var newLine = document.createElement("span");
        newLine.textContent = line;

        _this.chatContent.appendChild(newLine);
        _this.chatContent.appendChild(document.createElement("br"));
    });

    this.publishMessages();
};

Chat.prototype.publishMessages = function() {
    var _this = this;
    var forEach = Array.prototype.forEach;

    forEach.call(document.querySelectorAll(".chat-window"), function(chatWin) {
        var newChat = _this.chatContent.cloneNode(true);

        chatWin.removeChild(chatWin.querySelector(".chat-content"));

        chatWin.insertBefore(newChat, chatWin.querySelector(".chat-form"));
    });
};

Chat.prototype.sendMessage = function(message) {
    var data = {};

    data.username = this.username;
    data.data = message;
    data.key = this.apiKey;
    data.type = "message";

    this.socket.send(JSON.stringify(data));
};

module.exports = Chat;

},{}],2:[function(require,module,exports){
function Memory(size) {
    // TODO: where should I handle legal/illegal board sizes?

    this.size = size || [4, 4];
    this.bricks = [];
    this.boundReveal = this.revealBrick.bind(this);

    this.initializeBoard();
}

Memory.prototype.initializeBoard = function() {
    var i;
    var count = 0;
    for (i = 0; i < this.size[0] * this.size[1]; i += 2) {
        this.bricks[i] = count % 8;
        this.bricks[i + 1] = count % 8;
        count = count == 7 ? count = 0 : count += 1;
    }

    // Fisher-Yates
    for (i = this.bricks.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var k = this.bricks[j];
        this.bricks[j] = this.bricks[i];
        this.bricks[i] = k;
    }
};

Memory.prototype.attachBoard = function(container) {
    var _this = this;

    this.bricks.forEach(function() {
        var brickIMG = document.createElement("img");
        brickIMG.classList.add("memory-brick");
        brickIMG.setAttribute("src", "/image/hidden.png");
        brickIMG.addEventListener("click", _this.boundReveal);

        container.appendChild(brickIMG);
    });
};

Memory.prototype.revealBrick = function(event) {
    var _this = this;

    var brick = event.target;
    var parent = brick.parentNode;

    var indexOf = Array.prototype.indexOf;

    var index = indexOf.call(parent.children, brick);

    brick.setAttribute("src", "/image/" + this.bricks[index] + ".png");

    brick.removeEventListener("click", this.boundReveal);

    setTimeout(function() {
        _this.hideBrick(brick);
    }, 1000);
};

Memory.prototype.hideBrick = function(brick) {
    brick.setAttribute("src", "/image/hidden.png");

    brick.addEventListener("click", this.boundReveal);
};

module.exports = Memory;

},{}],3:[function(require,module,exports){
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

},{"./Chat":1,"./Memory":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQ2hhdC5qcyIsImNsaWVudC9zb3VyY2UvanMvTWVtb3J5LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9hcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImZ1bmN0aW9uIENoYXQoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMubGFzdExpbmVzID0gW107XG4gICAgdGhpcy5jaGF0Q29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5jaGF0Q29udGVudC5jbGFzc0xpc3QuYWRkKFwiY2hhdC1jb250ZW50XCIpO1xuICAgIHRoaXMudXNlcm5hbWUgPSBcImZwXCI7XG4gICAgdGhpcy5hcGlLZXkgPSBcImVEQkU3NmRlVTdMMEg5bUVCZ3hVS1ZSMFZDbnEwWEJkXCI7XG4gICAgdGhpcy5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KFwid3M6Ly92aG9zdDMubG51LnNlOjIwMDgwL3NvY2tldC9cIik7XG5cbiAgICAvLyBUT0RPOiBNYWtlIHN1cmUgdGhlIHNvY2tldCBvcGVucyBiZWZvcmUgdGhlIHVzZXIgY2FuIHNlbmQgbWVzc2FnZXNcblxuICAgIHRoaXMuc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGV2ZW50LmRhdGEpO1xuXG4gICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcblxuICAgICAgICBpZiAobWVzc2FnZS50eXBlICE9IFwiaGVhcnRiZWF0XCIpIHtcbiAgICAgICAgICAgIF90aGlzLmFwcGVuZExpbmUobWVzc2FnZS51c2VybmFtZSwgbWVzc2FnZS5kYXRhKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5DaGF0LnByb3RvdHlwZS5hcHBlbmRMaW5lID0gZnVuY3Rpb24odXNlcm5hbWUsIGxpbmUpIHtcbiAgICB0aGlzLmxhc3RMaW5lcy5wdXNoKHVzZXJuYW1lICsgXCI6IFwiICsgbGluZSk7XG4gICAgaWYgKHRoaXMubGFzdExpbmVzLmxlbmd0aCA+IDIwKSB7XG4gICAgICAgIHRoaXMubGFzdExpbmVzLnNoaWZ0KCk7XG4gICAgfVxuXG4gICAgdGhpcy5jb252ZXJ0TGluZXNUb0hUTUwoKTtcbn07XG5cbkNoYXQucHJvdG90eXBlLmNvbnZlcnRMaW5lc1RvSFRNTCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB3aGlsZSAodGhpcy5jaGF0Q29udGVudC5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5jaGF0Q29udGVudC5yZW1vdmVDaGlsZCh0aGlzLmNoYXRDb250ZW50LmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmxhc3RMaW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgdmFyIG5ld0xpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgbmV3TGluZS50ZXh0Q29udGVudCA9IGxpbmU7XG5cbiAgICAgICAgX3RoaXMuY2hhdENvbnRlbnQuYXBwZW5kQ2hpbGQobmV3TGluZSk7XG4gICAgICAgIF90aGlzLmNoYXRDb250ZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJiclwiKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnB1Ymxpc2hNZXNzYWdlcygpO1xufTtcblxuQ2hhdC5wcm90b3R5cGUucHVibGlzaE1lc3NhZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoO1xuXG4gICAgZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2hhdC13aW5kb3dcIiksIGZ1bmN0aW9uKGNoYXRXaW4pIHtcbiAgICAgICAgdmFyIG5ld0NoYXQgPSBfdGhpcy5jaGF0Q29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgY2hhdFdpbi5yZW1vdmVDaGlsZChjaGF0V2luLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1jb250ZW50XCIpKTtcblxuICAgICAgICBjaGF0V2luLmluc2VydEJlZm9yZShuZXdDaGF0LCBjaGF0V2luLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1mb3JtXCIpKTtcbiAgICB9KTtcbn07XG5cbkNoYXQucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIHZhciBkYXRhID0ge307XG5cbiAgICBkYXRhLnVzZXJuYW1lID0gdGhpcy51c2VybmFtZTtcbiAgICBkYXRhLmRhdGEgPSBtZXNzYWdlO1xuICAgIGRhdGEua2V5ID0gdGhpcy5hcGlLZXk7XG4gICAgZGF0YS50eXBlID0gXCJtZXNzYWdlXCI7XG5cbiAgICB0aGlzLnNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhdDtcbiIsImZ1bmN0aW9uIE1lbW9yeShzaXplKSB7XG4gICAgLy8gVE9ETzogd2hlcmUgc2hvdWxkIEkgaGFuZGxlIGxlZ2FsL2lsbGVnYWwgYm9hcmQgc2l6ZXM/XG5cbiAgICB0aGlzLnNpemUgPSBzaXplIHx8IFs0LCA0XTtcbiAgICB0aGlzLmJyaWNrcyA9IFtdO1xuICAgIHRoaXMuYm91bmRSZXZlYWwgPSB0aGlzLnJldmVhbEJyaWNrLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmluaXRpYWxpemVCb2FyZCgpO1xufVxuXG5NZW1vcnkucHJvdG90eXBlLmluaXRpYWxpemVCb2FyZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpO1xuICAgIHZhciBjb3VudCA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuc2l6ZVswXSAqIHRoaXMuc2l6ZVsxXTsgaSArPSAyKSB7XG4gICAgICAgIHRoaXMuYnJpY2tzW2ldID0gY291bnQgJSA4O1xuICAgICAgICB0aGlzLmJyaWNrc1tpICsgMV0gPSBjb3VudCAlIDg7XG4gICAgICAgIGNvdW50ID0gY291bnQgPT0gNyA/IGNvdW50ID0gMCA6IGNvdW50ICs9IDE7XG4gICAgfVxuXG4gICAgLy8gRmlzaGVyLVlhdGVzXG4gICAgZm9yIChpID0gdGhpcy5icmlja3MubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICB2YXIgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgICB2YXIgayA9IHRoaXMuYnJpY2tzW2pdO1xuICAgICAgICB0aGlzLmJyaWNrc1tqXSA9IHRoaXMuYnJpY2tzW2ldO1xuICAgICAgICB0aGlzLmJyaWNrc1tpXSA9IGs7XG4gICAgfVxufTtcblxuTWVtb3J5LnByb3RvdHlwZS5hdHRhY2hCb2FyZCA9IGZ1bmN0aW9uKGNvbnRhaW5lcikge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLmJyaWNrcy5mb3JFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYnJpY2tJTUcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgICAgICBicmlja0lNRy5jbGFzc0xpc3QuYWRkKFwibWVtb3J5LWJyaWNrXCIpO1xuICAgICAgICBicmlja0lNRy5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvaGlkZGVuLnBuZ1wiKTtcbiAgICAgICAgYnJpY2tJTUcuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIF90aGlzLmJvdW5kUmV2ZWFsKTtcblxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYnJpY2tJTUcpO1xuICAgIH0pO1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5yZXZlYWxCcmljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHZhciBicmljayA9IGV2ZW50LnRhcmdldDtcbiAgICB2YXIgcGFyZW50ID0gYnJpY2sucGFyZW50Tm9kZTtcblxuICAgIHZhciBpbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2Y7XG5cbiAgICB2YXIgaW5kZXggPSBpbmRleE9mLmNhbGwocGFyZW50LmNoaWxkcmVuLCBicmljayk7XG5cbiAgICBicmljay5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvXCIgKyB0aGlzLmJyaWNrc1tpbmRleF0gKyBcIi5wbmdcIik7XG5cbiAgICBicmljay5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5ib3VuZFJldmVhbCk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5oaWRlQnJpY2soYnJpY2spO1xuICAgIH0sIDEwMDApO1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5oaWRlQnJpY2sgPSBmdW5jdGlvbihicmljaykge1xuICAgIGJyaWNrLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9oaWRkZW4ucG5nXCIpO1xuXG4gICAgYnJpY2suYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuYm91bmRSZXZlYWwpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZW1vcnk7XG4iLCJ2YXIgbmV3V2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuZXdfd2luZG93XCIpO1xudmFyIG5ld0NoYXRXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19jaGF0XCIpO1xudmFyIG5ld01lbW9yeVdpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmV3X21lbW9yeVwiKTtcbnZhciBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3dpbmRvd19jb250YWluZXJcIik7XG5cbnZhciBDaGF0ID0gcmVxdWlyZShcIi4vQ2hhdFwiKTtcbnZhciBNZW1vcnkgPSByZXF1aXJlKFwiLi9NZW1vcnlcIik7XG5cbnZhciBtb3ZpbmcgPSBudWxsO1xuXG52YXIgY2hhdCA9IG51bGw7XG5cbi8vIFRoZSBkaXN0YW5jZSBvZiB0aGUgY3Vyc29yIHRvIHRoZSBlZGdlIG9mIHRoZSBlbGVtZW50XG52YXIgZGlzdGFuY2UgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG59O1xuXG52YXIgbW91c2VQb3MgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG59O1xuXG5uZXdXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcHBXaW5kb3cgPSBjcmVhdGVBcHBXaW5kb3coKTtcblxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChhcHBXaW5kb3cpO1xufSk7XG5cbm5ld0NoYXRXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmICghY2hhdCkge1xuICAgICAgICBjaGF0ID0gbmV3IENoYXQoKTtcbiAgICB9XG5cbiAgICB2YXIgY2hhdENvbnRlbnQgPSBjaGF0LmNoYXRDb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB2YXIgYXBwV2luZG93ID0gY3JlYXRlQXBwV2luZG93KFwiV2ViY2hhdFwiKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3dlYi1jaGF0XCIpO1xuICAgIHZhciBjaGF0V2luZG93ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtd2luZG93XCIpO1xuICAgIHZhciBjaGF0Rm9ybSA9IGNoYXRXaW5kb3cucXVlcnlTZWxlY3RvcihcIi5jaGF0LWZvcm1cIik7XG4gICAgY2hhdFdpbmRvdy5pbnNlcnRCZWZvcmUoY2hhdENvbnRlbnQsIGNoYXRGb3JtKTtcblxuICAgIGNoYXRGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBjaGF0LnNlbmRNZXNzYWdlKGV2ZW50LnRhcmdldC5lbGVtZW50c1swXS52YWx1ZSk7XG5cbiAgICAgICAgZXZlbnQudGFyZ2V0LmVsZW1lbnRzWzBdLnZhbHVlID0gXCJcIjtcbiAgICB9KTtcblxuICAgIGFwcFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250YWluZXJcIikuYXBwZW5kQ2hpbGQoY2hhdFdpbmRvdyk7XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYXBwV2luZG93KTtcbn0pO1xuXG5uZXdNZW1vcnlXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcHBXaW5kb3cgPSBjcmVhdGVBcHBXaW5kb3coXCJNZW1vcnlcIik7XG4gICAgdmFyIGFwcENvbnRhaW5lciA9IGFwcFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250YWluZXJcIik7XG4gICAgdmFyIG1lbW9yeUNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbWVtb3J5Q29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJtZW1vcnktY29udGFpbmVyXCIpO1xuICAgIG1lbW9yeUNvbnRhaW5lci5zdHlsZS53aWR0aCA9ICg0ICogMzYpICsgXCJweFwiO1xuICAgIG1lbW9yeUNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSAoNCAqIDM2KSArIFwicHhcIjtcbiAgICB2YXIgbWVtb3J5ID0gbmV3IE1lbW9yeSgpO1xuXG4gICAgbWVtb3J5LmF0dGFjaEJvYXJkKG1lbW9yeUNvbnRhaW5lcik7XG5cbiAgICBhcHBDb250YWluZXIuYXBwZW5kQ2hpbGQobWVtb3J5Q29udGFpbmVyKTtcblxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChhcHBXaW5kb3cpO1xufSk7XG5cbnZhciBjcmVhdGVBcHBXaW5kb3cgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgbmFtZSA9IG5hbWUgfHwgXCJCbGFuayB3aW5kb3dcIjtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3dpbmRvdy10ZW1wbGF0ZVwiKTtcbiAgICB2YXIgYXBwV2luZG93ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcFdpbmRvd1wiKTtcbiAgICB2YXIgdG9vbGJhciA9IGFwcFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLnRvb2xiYXJcIik7XG4gICAgdmFyIGFwcE5hbWUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShuYW1lKTtcblxuICAgIHZhciBjbG9zZVdpbmRvdyA9IGFwcFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLmNsb3NlV2luZG93XCIpO1xuXG4gICAgdG9vbGJhci5pbnNlcnRCZWZvcmUoYXBwTmFtZSwgY2xvc2VXaW5kb3cpO1xuXG4gICAgdG9vbGJhci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIGdpdmVGb2N1cyk7XG5cbiAgICBjbG9zZVdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgY29udGFpbmVyLnJlbW92ZUNoaWxkKGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLnBhcmVudE5vZGUpO1xuICAgIH0pO1xuXG4gICAgaWYgKGNvbnRhaW5lci5sYXN0RWxlbWVudENoaWxkKSB7XG4gICAgICAgIGFwcFdpbmRvdy5zdHlsZS50b3AgPSAoY29udGFpbmVyLmxhc3RFbGVtZW50Q2hpbGQub2Zmc2V0VG9wICsgMjApICsgXCJweFwiO1xuICAgICAgICBhcHBXaW5kb3cuc3R5bGUubGVmdCA9IChjb250YWluZXIubGFzdEVsZW1lbnRDaGlsZC5vZmZzZXRMZWZ0ICsgMjApICsgXCJweFwiO1xuICAgIH1cblxuICAgIHJldHVybiBhcHBXaW5kb3c7XG59O1xuXG52YXIgbW92ZVdpbmRvdyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgbW91c2VQb3MueCA9IGV2ZW50LmNsaWVudFggLSBjb250YWluZXIub2Zmc2V0TGVmdDtcbiAgICBtb3VzZVBvcy55ID0gZXZlbnQuY2xpZW50WSAtIGNvbnRhaW5lci5vZmZzZXRUb3A7XG5cbiAgICBpZiAobW92aW5nKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgbW92aW5nLnN0eWxlLnRvcCA9ICBtb3VzZVBvcy55IC0gZGlzdGFuY2UueSArIFwicHhcIjtcbiAgICAgICAgbW92aW5nLnN0eWxlLmxlZnQgPSAgbW91c2VQb3MueCAtIGRpc3RhbmNlLnggKyBcInB4XCI7XG5cbiAgICAgICAgaWYgKG1vdmluZy5vZmZzZXRUb3AgPCAwKSB7XG4gICAgICAgICAgICBtb3Zpbmcuc3R5bGUudG9wID0gMDtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbnZhciBnaXZlRm9jdXMgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBmb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG4gICAgdmFyIHdpbmRvd3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmFwcFdpbmRvd1wiKTtcblxuICAgIGZvckVhY2guY2FsbCh3aW5kb3dzLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIGl0ZW0uc3R5bGUuekluZGV4ID0gXCItMVwiO1xuICAgIH0pO1xuXG4gICAgZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUuc3R5bGUuekluZGV4ID0gXCIxXCI7XG5cbiAgICBtb3ZpbmcgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcblxuICAgIGRpc3RhbmNlLnggPSBtb3VzZVBvcy54IC0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUub2Zmc2V0TGVmdDtcbiAgICBkaXN0YW5jZS55ID0gbW91c2VQb3MueSAtIGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLm9mZnNldFRvcDtcbn07XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgbW92ZVdpbmRvdyk7XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBmdW5jdGlvbigpIHtcbiAgICBtb3ZpbmcgPSBudWxsO1xufSk7XG4iXX0=
