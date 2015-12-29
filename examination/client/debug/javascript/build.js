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
function Memory(size, container) {
    // TODO: where should I handle legal/illegal board sizes?

    this.size = size || [4, 4];
    this.totalBricks = this.size[0] * this.size[1];
    this.removedBricks = 0;
    this.moves = 0;
    this.board = container.querySelector(".memory-board");
    this.info = container.querySelector(".info");
    this.bricks = [];
    this.boundReveal = this.revealBrick.bind(this);

    this.selectedBrick = null;

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

    this.attachBoard();
};

Memory.prototype.attachBoard = function() {
    var _this = this;

    this.bricks.forEach(function() {
        var brick = document.createElement("img");
        brick.classList.add("memory-brick");
        brick.setAttribute("src", "/image/hidden.png");

        _this.board.appendChild(brick);
        _this.board.addEventListener("click", _this.boundReveal);
    });
};

Memory.prototype.revealBrick = function(event) {
    var brick = event.target;
    var parent = event.currentTarget;

    if (this.selectedBrick && brick === this.selectedBrick.brickElem) {
        return;
    }

    if (brick === parent) {
        return;
    }

    var index = Array.prototype.indexOf.call(parent.children, brick);

    brick.setAttribute("src", "/image/" + this.bricks[index] + ".png");

    if (!this.selectedBrick) {
        this.selectedBrick = {brickElem: brick, value: this.bricks[index]};
    } else {
        this.checkMatch({brickElem: brick, value: this.bricks[index]})
    }
};

Memory.prototype.checkMatch = function(brick) {
    var _this = this;

    this.board.removeEventListener("click", this.boundReveal);

    if (brick.value === this.selectedBrick.value) {
        setTimeout(function() {
            brick.brickElem.classList.add("removed");
            _this.selectedBrick.brickElem.classList.add("removed");

            _this.removedBricks += 2;

            _this.selectedBrick = null;
            _this.board.addEventListener("click", _this.boundReveal);

            if (_this.removedBricks === _this.totalBricks) {
                _this.endGame();
            }
        }, 1000);
    } else {
        setTimeout(function() {
            brick.brickElem.setAttribute("src", "/image/hidden.png");
            _this.selectedBrick.brickElem.setAttribute("src", "/image/hidden.png");

            _this.selectedBrick = null;
            _this.board.addEventListener("click", _this.boundReveal);
        }, 1000);
    }

    this.moves += 1;
};

Memory.prototype.endGame = function() {
    this.info.textContent = "You won! Moves taken: " + this.moves;
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
    var memoryContainer = appWindow.querySelector(".app-container");

    var template = document.querySelector("#memory");
    memoryContainer.appendChild(document.importNode(template.content, true));

    var memoryBoard = memoryContainer.querySelector(".memory-board");
    memoryBoard.style.width = (4 * 36) + "px";
    memoryBoard.style.height = (4 * 36) + "px";

    var memory = new Memory([4, 4], memoryContainer);

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

    appWindow.addEventListener("mousedown", giveFocus);

    toolbar.addEventListener("mousedown", startMove);

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

    event.currentTarget.style.zIndex = "1";

    event.stopPropagation();
};

var startMove = function(event) {
    moving = event.target.parentNode;

    distance.x = mousePos.x - event.target.parentNode.offsetLeft;
    distance.y = mousePos.y - event.target.parentNode.offsetTop;
};

document.addEventListener("mousemove", moveWindow);
document.addEventListener("mouseup", function() {
    moving = null;
});

},{"./Chat":1,"./Memory":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQ2hhdC5qcyIsImNsaWVudC9zb3VyY2UvanMvTWVtb3J5LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9hcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gQ2hhdCgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5sYXN0TGluZXMgPSBbXTtcbiAgICB0aGlzLmNoYXRDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmNoYXRDb250ZW50LmNsYXNzTGlzdC5hZGQoXCJjaGF0LWNvbnRlbnRcIik7XG4gICAgdGhpcy51c2VybmFtZSA9IFwiZnBcIjtcbiAgICB0aGlzLmFwaUtleSA9IFwiZURCRTc2ZGVVN0wwSDltRUJneFVLVlIwVkNucTBYQmRcIjtcbiAgICB0aGlzLnNvY2tldCA9IG5ldyBXZWJTb2NrZXQoXCJ3czovL3Zob3N0My5sbnUuc2U6MjAwODAvc29ja2V0L1wiKTtcblxuICAgIC8vIFRPRE86IE1ha2Ugc3VyZSB0aGUgc29ja2V0IG9wZW5zIGJlZm9yZSB0aGUgdXNlciBjYW4gc2VuZCBtZXNzYWdlc1xuXG4gICAgdGhpcy5zb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgY29uc29sZS5sb2coZXZlbnQuZGF0YSk7XG5cbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuXG4gICAgICAgIGlmIChtZXNzYWdlLnR5cGUgIT0gXCJoZWFydGJlYXRcIikge1xuICAgICAgICAgICAgX3RoaXMuYXBwZW5kTGluZShtZXNzYWdlLnVzZXJuYW1lLCBtZXNzYWdlLmRhdGEpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbkNoYXQucHJvdG90eXBlLmFwcGVuZExpbmUgPSBmdW5jdGlvbih1c2VybmFtZSwgbGluZSkge1xuICAgIHRoaXMubGFzdExpbmVzLnB1c2godXNlcm5hbWUgKyBcIjogXCIgKyBsaW5lKTtcbiAgICBpZiAodGhpcy5sYXN0TGluZXMubGVuZ3RoID4gMjApIHtcbiAgICAgICAgdGhpcy5sYXN0TGluZXMuc2hpZnQoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnZlcnRMaW5lc1RvSFRNTCgpO1xufTtcblxuQ2hhdC5wcm90b3R5cGUuY29udmVydExpbmVzVG9IVE1MID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHdoaWxlICh0aGlzLmNoYXRDb250ZW50Lmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICB0aGlzLmNoYXRDb250ZW50LnJlbW92ZUNoaWxkKHRoaXMuY2hhdENvbnRlbnQuZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIHRoaXMubGFzdExpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZSkge1xuICAgICAgICB2YXIgbmV3TGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBuZXdMaW5lLnRleHRDb250ZW50ID0gbGluZTtcblxuICAgICAgICBfdGhpcy5jaGF0Q29udGVudC5hcHBlbmRDaGlsZChuZXdMaW5lKTtcbiAgICAgICAgX3RoaXMuY2hhdENvbnRlbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJyXCIpKTtcbiAgICB9KTtcblxuICAgIHRoaXMucHVibGlzaE1lc3NhZ2VzKCk7XG59O1xuXG5DaGF0LnByb3RvdHlwZS5wdWJsaXNoTWVzc2FnZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciBmb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG5cbiAgICBmb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jaGF0LXdpbmRvd1wiKSwgZnVuY3Rpb24oY2hhdFdpbikge1xuICAgICAgICB2YXIgbmV3Q2hhdCA9IF90aGlzLmNoYXRDb250ZW50LmNsb25lTm9kZSh0cnVlKTtcblxuICAgICAgICBjaGF0V2luLnJlbW92ZUNoaWxkKGNoYXRXaW4ucXVlcnlTZWxlY3RvcihcIi5jaGF0LWNvbnRlbnRcIikpO1xuXG4gICAgICAgIGNoYXRXaW4uaW5zZXJ0QmVmb3JlKG5ld0NoYXQsIGNoYXRXaW4ucXVlcnlTZWxlY3RvcihcIi5jaGF0LWZvcm1cIikpO1xuICAgIH0pO1xufTtcblxuQ2hhdC5wcm90b3R5cGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgdmFyIGRhdGEgPSB7fTtcblxuICAgIGRhdGEudXNlcm5hbWUgPSB0aGlzLnVzZXJuYW1lO1xuICAgIGRhdGEuZGF0YSA9IG1lc3NhZ2U7XG4gICAgZGF0YS5rZXkgPSB0aGlzLmFwaUtleTtcbiAgICBkYXRhLnR5cGUgPSBcIm1lc3NhZ2VcIjtcblxuICAgIHRoaXMuc29ja2V0LnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGF0O1xuIiwiZnVuY3Rpb24gTWVtb3J5KHNpemUsIGNvbnRhaW5lcikge1xuICAgIC8vIFRPRE86IHdoZXJlIHNob3VsZCBJIGhhbmRsZSBsZWdhbC9pbGxlZ2FsIGJvYXJkIHNpemVzP1xuXG4gICAgdGhpcy5zaXplID0gc2l6ZSB8fCBbNCwgNF07XG4gICAgdGhpcy50b3RhbEJyaWNrcyA9IHRoaXMuc2l6ZVswXSAqIHRoaXMuc2l6ZVsxXTtcbiAgICB0aGlzLnJlbW92ZWRCcmlja3MgPSAwO1xuICAgIHRoaXMubW92ZXMgPSAwO1xuICAgIHRoaXMuYm9hcmQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcihcIi5tZW1vcnktYm9hcmRcIik7XG4gICAgdGhpcy5pbmZvID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCIuaW5mb1wiKTtcbiAgICB0aGlzLmJyaWNrcyA9IFtdO1xuICAgIHRoaXMuYm91bmRSZXZlYWwgPSB0aGlzLnJldmVhbEJyaWNrLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLnNlbGVjdGVkQnJpY2sgPSBudWxsO1xuXG4gICAgdGhpcy5pbml0aWFsaXplQm9hcmQoKTtcbn1cblxuTWVtb3J5LnByb3RvdHlwZS5pbml0aWFsaXplQm9hcmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaTtcbiAgICB2YXIgY291bnQgPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnNpemVbMF0gKiB0aGlzLnNpemVbMV07IGkgKz0gMikge1xuICAgICAgICB0aGlzLmJyaWNrc1tpXSA9IGNvdW50ICUgODtcbiAgICAgICAgdGhpcy5icmlja3NbaSArIDFdID0gY291bnQgJSA4O1xuICAgICAgICBjb3VudCA9IGNvdW50ID09IDcgPyBjb3VudCA9IDAgOiBjb3VudCArPSAxO1xuICAgIH1cblxuICAgIC8vIEZpc2hlci1ZYXRlc1xuICAgIGZvciAoaSA9IHRoaXMuYnJpY2tzLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgdmFyIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoaSArIDEpKTtcbiAgICAgICAgdmFyIGsgPSB0aGlzLmJyaWNrc1tqXTtcbiAgICAgICAgdGhpcy5icmlja3Nbal0gPSB0aGlzLmJyaWNrc1tpXTtcbiAgICAgICAgdGhpcy5icmlja3NbaV0gPSBrO1xuICAgIH1cblxuICAgIHRoaXMuYXR0YWNoQm9hcmQoKTtcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUuYXR0YWNoQm9hcmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5icmlja3MuZm9yRWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJyaWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICAgICAgYnJpY2suY2xhc3NMaXN0LmFkZChcIm1lbW9yeS1icmlja1wiKTtcbiAgICAgICAgYnJpY2suc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiL2ltYWdlL2hpZGRlbi5wbmdcIik7XG5cbiAgICAgICAgX3RoaXMuYm9hcmQuYXBwZW5kQ2hpbGQoYnJpY2spO1xuICAgICAgICBfdGhpcy5ib2FyZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgX3RoaXMuYm91bmRSZXZlYWwpO1xuICAgIH0pO1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5yZXZlYWxCcmljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIGJyaWNrID0gZXZlbnQudGFyZ2V0O1xuICAgIHZhciBwYXJlbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRCcmljayAmJiBicmljayA9PT0gdGhpcy5zZWxlY3RlZEJyaWNrLmJyaWNrRWxlbSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGJyaWNrID09PSBwYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBpbmRleCA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwocGFyZW50LmNoaWxkcmVuLCBicmljayk7XG5cbiAgICBicmljay5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvXCIgKyB0aGlzLmJyaWNrc1tpbmRleF0gKyBcIi5wbmdcIik7XG5cbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRCcmljaykge1xuICAgICAgICB0aGlzLnNlbGVjdGVkQnJpY2sgPSB7YnJpY2tFbGVtOiBicmljaywgdmFsdWU6IHRoaXMuYnJpY2tzW2luZGV4XX07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jaGVja01hdGNoKHticmlja0VsZW06IGJyaWNrLCB2YWx1ZTogdGhpcy5icmlja3NbaW5kZXhdfSlcbiAgICB9XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLmNoZWNrTWF0Y2ggPSBmdW5jdGlvbihicmljaykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLmJvYXJkLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmJvdW5kUmV2ZWFsKTtcblxuICAgIGlmIChicmljay52YWx1ZSA9PT0gdGhpcy5zZWxlY3RlZEJyaWNrLnZhbHVlKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBicmljay5icmlja0VsZW0uY2xhc3NMaXN0LmFkZChcInJlbW92ZWRcIik7XG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrLmJyaWNrRWxlbS5jbGFzc0xpc3QuYWRkKFwicmVtb3ZlZFwiKTtcblxuICAgICAgICAgICAgX3RoaXMucmVtb3ZlZEJyaWNrcyArPSAyO1xuXG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrID0gbnVsbDtcbiAgICAgICAgICAgIF90aGlzLmJvYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfdGhpcy5ib3VuZFJldmVhbCk7XG5cbiAgICAgICAgICAgIGlmIChfdGhpcy5yZW1vdmVkQnJpY2tzID09PSBfdGhpcy50b3RhbEJyaWNrcykge1xuICAgICAgICAgICAgICAgIF90aGlzLmVuZEdhbWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJyaWNrLmJyaWNrRWxlbS5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvaGlkZGVuLnBuZ1wiKTtcbiAgICAgICAgICAgIF90aGlzLnNlbGVjdGVkQnJpY2suYnJpY2tFbGVtLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9oaWRkZW4ucG5nXCIpO1xuXG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrID0gbnVsbDtcbiAgICAgICAgICAgIF90aGlzLmJvYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfdGhpcy5ib3VuZFJldmVhbCk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH1cblxuICAgIHRoaXMubW92ZXMgKz0gMTtcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUuZW5kR2FtZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiWW91IHdvbiEgTW92ZXMgdGFrZW46IFwiICsgdGhpcy5tb3Zlcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWVtb3J5O1xuIiwidmFyIG5ld1dpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmV3X3dpbmRvd1wiKTtcbnZhciBuZXdDaGF0V2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuZXdfY2hhdFwiKTtcbnZhciBuZXdNZW1vcnlXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19tZW1vcnlcIik7XG52YXIgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN3aW5kb3dfY29udGFpbmVyXCIpO1xuXG52YXIgQ2hhdCA9IHJlcXVpcmUoXCIuL0NoYXRcIik7XG52YXIgTWVtb3J5ID0gcmVxdWlyZShcIi4vTWVtb3J5XCIpO1xuXG52YXIgbW92aW5nID0gbnVsbDtcblxudmFyIGNoYXQgPSBudWxsO1xuXG4vLyBUaGUgZGlzdGFuY2Ugb2YgdGhlIGN1cnNvciB0byB0aGUgZWRnZSBvZiB0aGUgZWxlbWVudFxudmFyIGRpc3RhbmNlID0ge1xuICAgIHg6IDAsXG4gICAgeTogMFxufTtcblxudmFyIG1vdXNlUG9zID0ge1xuICAgIHg6IDAsXG4gICAgeTogMFxufTtcblxubmV3V2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXBwV2luZG93ID0gY3JlYXRlQXBwV2luZG93KCk7XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYXBwV2luZG93KTtcbn0pO1xuXG5uZXdDaGF0V2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoIWNoYXQpIHtcbiAgICAgICAgY2hhdCA9IG5ldyBDaGF0KCk7XG4gICAgfVxuXG4gICAgdmFyIGNoYXRDb250ZW50ID0gY2hhdC5jaGF0Q29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgdmFyIGFwcFdpbmRvdyA9IGNyZWF0ZUFwcFdpbmRvdyhcIldlYmNoYXRcIik7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN3ZWItY2hhdFwiKTtcbiAgICB2YXIgY2hhdFdpbmRvdyA9IGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5jaGF0LXdpbmRvd1wiKTtcbiAgICB2YXIgY2hhdEZvcm0gPSBjaGF0V2luZG93LnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1mb3JtXCIpO1xuICAgIGNoYXRXaW5kb3cuaW5zZXJ0QmVmb3JlKGNoYXRDb250ZW50LCBjaGF0Rm9ybSk7XG5cbiAgICBjaGF0Rm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY2hhdC5zZW5kTWVzc2FnZShldmVudC50YXJnZXQuZWxlbWVudHNbMF0udmFsdWUpO1xuXG4gICAgICAgIGV2ZW50LnRhcmdldC5lbGVtZW50c1swXS52YWx1ZSA9IFwiXCI7XG4gICAgfSk7XG5cbiAgICBhcHBXaW5kb3cucXVlcnlTZWxlY3RvcihcIi5hcHAtY29udGFpbmVyXCIpLmFwcGVuZENoaWxkKGNoYXRXaW5kb3cpO1xuXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGFwcFdpbmRvdyk7XG59KTtcblxubmV3TWVtb3J5V2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXBwV2luZG93ID0gY3JlYXRlQXBwV2luZG93KFwiTWVtb3J5XCIpO1xuICAgIHZhciBtZW1vcnlDb250YWluZXIgPSBhcHBXaW5kb3cucXVlcnlTZWxlY3RvcihcIi5hcHAtY29udGFpbmVyXCIpO1xuXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNtZW1vcnlcIik7XG4gICAgbWVtb3J5Q29udGFpbmVyLmFwcGVuZENoaWxkKGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkpO1xuXG4gICAgdmFyIG1lbW9yeUJvYXJkID0gbWVtb3J5Q29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCIubWVtb3J5LWJvYXJkXCIpO1xuICAgIG1lbW9yeUJvYXJkLnN0eWxlLndpZHRoID0gKDQgKiAzNikgKyBcInB4XCI7XG4gICAgbWVtb3J5Qm9hcmQuc3R5bGUuaGVpZ2h0ID0gKDQgKiAzNikgKyBcInB4XCI7XG5cbiAgICB2YXIgbWVtb3J5ID0gbmV3IE1lbW9yeShbNCwgNF0sIG1lbW9yeUNvbnRhaW5lcik7XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYXBwV2luZG93KTtcbn0pO1xuXG52YXIgY3JlYXRlQXBwV2luZG93ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIG5hbWUgPSBuYW1lIHx8IFwiQmxhbmsgd2luZG93XCI7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN3aW5kb3ctdGVtcGxhdGVcIik7XG4gICAgdmFyIGFwcFdpbmRvdyA9IGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5hcHBXaW5kb3dcIik7XG4gICAgdmFyIHRvb2xiYXIgPSBhcHBXaW5kb3cucXVlcnlTZWxlY3RvcihcIi50b29sYmFyXCIpO1xuICAgIHZhciBhcHBOYW1lID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobmFtZSk7XG5cbiAgICB2YXIgY2xvc2VXaW5kb3cgPSBhcHBXaW5kb3cucXVlcnlTZWxlY3RvcihcIi5jbG9zZVdpbmRvd1wiKTtcblxuICAgIHRvb2xiYXIuaW5zZXJ0QmVmb3JlKGFwcE5hbWUsIGNsb3NlV2luZG93KTtcblxuICAgIGFwcFdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIGdpdmVGb2N1cyk7XG5cbiAgICB0b29sYmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgc3RhcnRNb3ZlKTtcblxuICAgIGNsb3NlV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBjb250YWluZXIucmVtb3ZlQ2hpbGQoZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUucGFyZW50Tm9kZSk7XG4gICAgfSk7XG5cbiAgICBpZiAoY29udGFpbmVyLmxhc3RFbGVtZW50Q2hpbGQpIHtcbiAgICAgICAgYXBwV2luZG93LnN0eWxlLnRvcCA9IChjb250YWluZXIubGFzdEVsZW1lbnRDaGlsZC5vZmZzZXRUb3AgKyAyMCkgKyBcInB4XCI7XG4gICAgICAgIGFwcFdpbmRvdy5zdHlsZS5sZWZ0ID0gKGNvbnRhaW5lci5sYXN0RWxlbWVudENoaWxkLm9mZnNldExlZnQgKyAyMCkgKyBcInB4XCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFwcFdpbmRvdztcbn07XG5cbnZhciBtb3ZlV2luZG93ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBtb3VzZVBvcy54ID0gZXZlbnQuY2xpZW50WCAtIGNvbnRhaW5lci5vZmZzZXRMZWZ0O1xuICAgIG1vdXNlUG9zLnkgPSBldmVudC5jbGllbnRZIC0gY29udGFpbmVyLm9mZnNldFRvcDtcblxuICAgIGlmIChtb3ZpbmcpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBtb3Zpbmcuc3R5bGUudG9wID0gIG1vdXNlUG9zLnkgLSBkaXN0YW5jZS55ICsgXCJweFwiO1xuICAgICAgICBtb3Zpbmcuc3R5bGUubGVmdCA9ICBtb3VzZVBvcy54IC0gZGlzdGFuY2UueCArIFwicHhcIjtcblxuICAgICAgICBpZiAobW92aW5nLm9mZnNldFRvcCA8IDApIHtcbiAgICAgICAgICAgIG1vdmluZy5zdHlsZS50b3AgPSAwO1xuICAgICAgICB9XG4gICAgfVxufTtcblxudmFyIGdpdmVGb2N1cyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIGZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDtcbiAgICB2YXIgd2luZG93cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuYXBwV2luZG93XCIpO1xuXG4gICAgZm9yRWFjaC5jYWxsKHdpbmRvd3MsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgaXRlbS5zdHlsZS56SW5kZXggPSBcIi0xXCI7XG4gICAgfSk7XG5cbiAgICBldmVudC5jdXJyZW50VGFyZ2V0LnN0eWxlLnpJbmRleCA9IFwiMVwiO1xuXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG59O1xuXG52YXIgc3RhcnRNb3ZlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBtb3ZpbmcgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcblxuICAgIGRpc3RhbmNlLnggPSBtb3VzZVBvcy54IC0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUub2Zmc2V0TGVmdDtcbiAgICBkaXN0YW5jZS55ID0gbW91c2VQb3MueSAtIGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLm9mZnNldFRvcDtcbn07XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgbW92ZVdpbmRvdyk7XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBmdW5jdGlvbigpIHtcbiAgICBtb3ZpbmcgPSBudWxsO1xufSk7XG4iXX0=
