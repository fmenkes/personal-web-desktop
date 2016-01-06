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

var zIndex = 1;

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

    appWindow.style.zIndex = zIndex;

    zIndex += 1;

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
    if (parseInt(event.currentTarget.style.zIndex, 10) !== zIndex - 1) {
        event.currentTarget.style.zIndex = zIndex;
        zIndex += 1;
    }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQ2hhdC5qcyIsImNsaWVudC9zb3VyY2UvanMvTWVtb3J5LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9hcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImZ1bmN0aW9uIENoYXQoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMubGFzdExpbmVzID0gW107XG4gICAgdGhpcy5jaGF0Q29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5jaGF0Q29udGVudC5jbGFzc0xpc3QuYWRkKFwiY2hhdC1jb250ZW50XCIpO1xuICAgIHRoaXMudXNlcm5hbWUgPSBcImZwXCI7XG4gICAgdGhpcy5hcGlLZXkgPSBcImVEQkU3NmRlVTdMMEg5bUVCZ3hVS1ZSMFZDbnEwWEJkXCI7XG4gICAgdGhpcy5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KFwid3M6Ly92aG9zdDMubG51LnNlOjIwMDgwL3NvY2tldC9cIik7XG5cbiAgICAvLyBUT0RPOiBNYWtlIHN1cmUgdGhlIHNvY2tldCBvcGVucyBiZWZvcmUgdGhlIHVzZXIgY2FuIHNlbmQgbWVzc2FnZXNcblxuICAgIHRoaXMuc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGV2ZW50LmRhdGEpO1xuXG4gICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcblxuICAgICAgICBpZiAobWVzc2FnZS50eXBlICE9IFwiaGVhcnRiZWF0XCIpIHtcbiAgICAgICAgICAgIF90aGlzLmFwcGVuZExpbmUobWVzc2FnZS51c2VybmFtZSwgbWVzc2FnZS5kYXRhKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5DaGF0LnByb3RvdHlwZS5hcHBlbmRMaW5lID0gZnVuY3Rpb24odXNlcm5hbWUsIGxpbmUpIHtcbiAgICB0aGlzLmxhc3RMaW5lcy5wdXNoKHVzZXJuYW1lICsgXCI6IFwiICsgbGluZSk7XG4gICAgaWYgKHRoaXMubGFzdExpbmVzLmxlbmd0aCA+IDIwKSB7XG4gICAgICAgIHRoaXMubGFzdExpbmVzLnNoaWZ0KCk7XG4gICAgfVxuXG4gICAgdGhpcy5jb252ZXJ0TGluZXNUb0hUTUwoKTtcbn07XG5cbkNoYXQucHJvdG90eXBlLmNvbnZlcnRMaW5lc1RvSFRNTCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB3aGlsZSAodGhpcy5jaGF0Q29udGVudC5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5jaGF0Q29udGVudC5yZW1vdmVDaGlsZCh0aGlzLmNoYXRDb250ZW50LmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmxhc3RMaW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgdmFyIG5ld0xpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgbmV3TGluZS50ZXh0Q29udGVudCA9IGxpbmU7XG5cbiAgICAgICAgX3RoaXMuY2hhdENvbnRlbnQuYXBwZW5kQ2hpbGQobmV3TGluZSk7XG4gICAgICAgIF90aGlzLmNoYXRDb250ZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJiclwiKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnB1Ymxpc2hNZXNzYWdlcygpO1xufTtcblxuQ2hhdC5wcm90b3R5cGUucHVibGlzaE1lc3NhZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoO1xuXG4gICAgZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2hhdC13aW5kb3dcIiksIGZ1bmN0aW9uKGNoYXRXaW4pIHtcbiAgICAgICAgdmFyIG5ld0NoYXQgPSBfdGhpcy5jaGF0Q29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgY2hhdFdpbi5yZW1vdmVDaGlsZChjaGF0V2luLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1jb250ZW50XCIpKTtcblxuICAgICAgICBjaGF0V2luLmluc2VydEJlZm9yZShuZXdDaGF0LCBjaGF0V2luLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1mb3JtXCIpKTtcbiAgICB9KTtcbn07XG5cbkNoYXQucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIHZhciBkYXRhID0ge307XG5cbiAgICBkYXRhLnVzZXJuYW1lID0gdGhpcy51c2VybmFtZTtcbiAgICBkYXRhLmRhdGEgPSBtZXNzYWdlO1xuICAgIGRhdGEua2V5ID0gdGhpcy5hcGlLZXk7XG4gICAgZGF0YS50eXBlID0gXCJtZXNzYWdlXCI7XG5cbiAgICB0aGlzLnNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhdDtcbiIsImZ1bmN0aW9uIE1lbW9yeShzaXplLCBjb250YWluZXIpIHtcbiAgICAvLyBUT0RPOiB3aGVyZSBzaG91bGQgSSBoYW5kbGUgbGVnYWwvaWxsZWdhbCBib2FyZCBzaXplcz9cblxuICAgIHRoaXMuc2l6ZSA9IHNpemUgfHwgWzQsIDRdO1xuICAgIHRoaXMudG90YWxCcmlja3MgPSB0aGlzLnNpemVbMF0gKiB0aGlzLnNpemVbMV07XG4gICAgdGhpcy5yZW1vdmVkQnJpY2tzID0gMDtcbiAgICB0aGlzLm1vdmVzID0gMDtcbiAgICB0aGlzLmJvYXJkID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCIubWVtb3J5LWJvYXJkXCIpO1xuICAgIHRoaXMuaW5mbyA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFwiLmluZm9cIik7XG4gICAgdGhpcy5icmlja3MgPSBbXTtcbiAgICB0aGlzLmJvdW5kUmV2ZWFsID0gdGhpcy5yZXZlYWxCcmljay5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJyaWNrID0gbnVsbDtcblxuICAgIHRoaXMuaW5pdGlhbGl6ZUJvYXJkKCk7XG59XG5cbk1lbW9yeS5wcm90b3R5cGUuaW5pdGlhbGl6ZUJvYXJkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGk7XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zaXplWzBdICogdGhpcy5zaXplWzFdOyBpICs9IDIpIHtcbiAgICAgICAgdGhpcy5icmlja3NbaV0gPSBjb3VudCAlIDg7XG4gICAgICAgIHRoaXMuYnJpY2tzW2kgKyAxXSA9IGNvdW50ICUgODtcbiAgICAgICAgY291bnQgPSBjb3VudCA9PSA3ID8gY291bnQgPSAwIDogY291bnQgKz0gMTtcbiAgICB9XG5cbiAgICAvLyBGaXNoZXItWWF0ZXNcbiAgICBmb3IgKGkgPSB0aGlzLmJyaWNrcy5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIHZhciBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkgKyAxKSk7XG4gICAgICAgIHZhciBrID0gdGhpcy5icmlja3Nbal07XG4gICAgICAgIHRoaXMuYnJpY2tzW2pdID0gdGhpcy5icmlja3NbaV07XG4gICAgICAgIHRoaXMuYnJpY2tzW2ldID0gaztcbiAgICB9XG5cbiAgICB0aGlzLmF0dGFjaEJvYXJkKCk7XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLmF0dGFjaEJvYXJkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuYnJpY2tzLmZvckVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBicmljayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG4gICAgICAgIGJyaWNrLmNsYXNzTGlzdC5hZGQoXCJtZW1vcnktYnJpY2tcIik7XG4gICAgICAgIGJyaWNrLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9oaWRkZW4ucG5nXCIpO1xuXG4gICAgICAgIF90aGlzLmJvYXJkLmFwcGVuZENoaWxkKGJyaWNrKTtcbiAgICAgICAgX3RoaXMuYm9hcmQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIF90aGlzLmJvdW5kUmV2ZWFsKTtcbiAgICB9KTtcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUucmV2ZWFsQnJpY2sgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBicmljayA9IGV2ZW50LnRhcmdldDtcbiAgICB2YXIgcGFyZW50ID0gZXZlbnQuY3VycmVudFRhcmdldDtcblxuICAgIGlmICh0aGlzLnNlbGVjdGVkQnJpY2sgJiYgYnJpY2sgPT09IHRoaXMuc2VsZWN0ZWRCcmljay5icmlja0VsZW0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChicmljayA9PT0gcGFyZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgaW5kZXggPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHBhcmVudC5jaGlsZHJlbiwgYnJpY2spO1xuXG4gICAgYnJpY2suc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiL2ltYWdlL1wiICsgdGhpcy5icmlja3NbaW5kZXhdICsgXCIucG5nXCIpO1xuXG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkQnJpY2spIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZEJyaWNrID0ge2JyaWNrRWxlbTogYnJpY2ssIHZhbHVlOiB0aGlzLmJyaWNrc1tpbmRleF19O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2hlY2tNYXRjaCh7YnJpY2tFbGVtOiBicmljaywgdmFsdWU6IHRoaXMuYnJpY2tzW2luZGV4XX0pXG4gICAgfVxufTtcblxuTWVtb3J5LnByb3RvdHlwZS5jaGVja01hdGNoID0gZnVuY3Rpb24oYnJpY2spIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5ib2FyZC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5ib3VuZFJldmVhbCk7XG5cbiAgICBpZiAoYnJpY2sudmFsdWUgPT09IHRoaXMuc2VsZWN0ZWRCcmljay52YWx1ZSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYnJpY2suYnJpY2tFbGVtLmNsYXNzTGlzdC5hZGQoXCJyZW1vdmVkXCIpO1xuICAgICAgICAgICAgX3RoaXMuc2VsZWN0ZWRCcmljay5icmlja0VsZW0uY2xhc3NMaXN0LmFkZChcInJlbW92ZWRcIik7XG5cbiAgICAgICAgICAgIF90aGlzLnJlbW92ZWRCcmlja3MgKz0gMjtcblxuICAgICAgICAgICAgX3RoaXMuc2VsZWN0ZWRCcmljayA9IG51bGw7XG4gICAgICAgICAgICBfdGhpcy5ib2FyZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgX3RoaXMuYm91bmRSZXZlYWwpO1xuXG4gICAgICAgICAgICBpZiAoX3RoaXMucmVtb3ZlZEJyaWNrcyA9PT0gX3RoaXMudG90YWxCcmlja3MpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5lbmRHYW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBicmljay5icmlja0VsZW0uc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiL2ltYWdlL2hpZGRlbi5wbmdcIik7XG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrLmJyaWNrRWxlbS5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvaGlkZGVuLnBuZ1wiKTtcblxuICAgICAgICAgICAgX3RoaXMuc2VsZWN0ZWRCcmljayA9IG51bGw7XG4gICAgICAgICAgICBfdGhpcy5ib2FyZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgX3RoaXMuYm91bmRSZXZlYWwpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICB9XG5cbiAgICB0aGlzLm1vdmVzICs9IDE7XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLmVuZEdhbWUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmluZm8udGV4dENvbnRlbnQgPSBcIllvdSB3b24hIE1vdmVzIHRha2VuOiBcIiArIHRoaXMubW92ZXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbW9yeTtcbiIsInZhciBuZXdXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld193aW5kb3dcIik7XG52YXIgbmV3Q2hhdFdpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmV3X2NoYXRcIik7XG52YXIgbmV3TWVtb3J5V2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuZXdfbWVtb3J5XCIpO1xudmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjd2luZG93X2NvbnRhaW5lclwiKTtcblxudmFyIENoYXQgPSByZXF1aXJlKFwiLi9DaGF0XCIpO1xudmFyIE1lbW9yeSA9IHJlcXVpcmUoXCIuL01lbW9yeVwiKTtcblxudmFyIG1vdmluZyA9IG51bGw7XG5cbnZhciBjaGF0ID0gbnVsbDtcblxudmFyIHpJbmRleCA9IDE7XG5cbi8vIFRoZSBkaXN0YW5jZSBvZiB0aGUgY3Vyc29yIHRvIHRoZSBlZGdlIG9mIHRoZSBlbGVtZW50XG52YXIgZGlzdGFuY2UgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG59O1xuXG52YXIgbW91c2VQb3MgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG59O1xuXG5uZXdXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcHBXaW5kb3cgPSBjcmVhdGVBcHBXaW5kb3coKTtcblxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChhcHBXaW5kb3cpO1xufSk7XG5cbm5ld0NoYXRXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmICghY2hhdCkge1xuICAgICAgICBjaGF0ID0gbmV3IENoYXQoKTtcbiAgICB9XG5cbiAgICB2YXIgY2hhdENvbnRlbnQgPSBjaGF0LmNoYXRDb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB2YXIgYXBwV2luZG93ID0gY3JlYXRlQXBwV2luZG93KFwiV2ViY2hhdFwiKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3dlYi1jaGF0XCIpO1xuICAgIHZhciBjaGF0V2luZG93ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtd2luZG93XCIpO1xuICAgIHZhciBjaGF0Rm9ybSA9IGNoYXRXaW5kb3cucXVlcnlTZWxlY3RvcihcIi5jaGF0LWZvcm1cIik7XG4gICAgY2hhdFdpbmRvdy5pbnNlcnRCZWZvcmUoY2hhdENvbnRlbnQsIGNoYXRGb3JtKTtcblxuICAgIGNoYXRGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBjaGF0LnNlbmRNZXNzYWdlKGV2ZW50LnRhcmdldC5lbGVtZW50c1swXS52YWx1ZSk7XG5cbiAgICAgICAgZXZlbnQudGFyZ2V0LmVsZW1lbnRzWzBdLnZhbHVlID0gXCJcIjtcbiAgICB9KTtcblxuICAgIGFwcFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250YWluZXJcIikuYXBwZW5kQ2hpbGQoY2hhdFdpbmRvdyk7XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYXBwV2luZG93KTtcbn0pO1xuXG5uZXdNZW1vcnlXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcHBXaW5kb3cgPSBjcmVhdGVBcHBXaW5kb3coXCJNZW1vcnlcIik7XG4gICAgdmFyIG1lbW9yeUNvbnRhaW5lciA9IGFwcFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250YWluZXJcIik7XG5cbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI21lbW9yeVwiKTtcbiAgICBtZW1vcnlDb250YWluZXIuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKSk7XG5cbiAgICB2YXIgbWVtb3J5Qm9hcmQgPSBtZW1vcnlDb250YWluZXIucXVlcnlTZWxlY3RvcihcIi5tZW1vcnktYm9hcmRcIik7XG4gICAgbWVtb3J5Qm9hcmQuc3R5bGUud2lkdGggPSAoNCAqIDM2KSArIFwicHhcIjtcbiAgICBtZW1vcnlCb2FyZC5zdHlsZS5oZWlnaHQgPSAoNCAqIDM2KSArIFwicHhcIjtcblxuICAgIHZhciBtZW1vcnkgPSBuZXcgTWVtb3J5KFs0LCA0XSwgbWVtb3J5Q29udGFpbmVyKTtcblxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChhcHBXaW5kb3cpO1xufSk7XG5cbnZhciBjcmVhdGVBcHBXaW5kb3cgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgbmFtZSA9IG5hbWUgfHwgXCJCbGFuayB3aW5kb3dcIjtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3dpbmRvdy10ZW1wbGF0ZVwiKTtcbiAgICB2YXIgYXBwV2luZG93ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcFdpbmRvd1wiKTtcbiAgICB2YXIgdG9vbGJhciA9IGFwcFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLnRvb2xiYXJcIik7XG4gICAgdmFyIGFwcE5hbWUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShuYW1lKTtcblxuICAgIHZhciBjbG9zZVdpbmRvdyA9IGFwcFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLmNsb3NlV2luZG93XCIpO1xuXG4gICAgdG9vbGJhci5pbnNlcnRCZWZvcmUoYXBwTmFtZSwgY2xvc2VXaW5kb3cpO1xuXG4gICAgYXBwV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgZ2l2ZUZvY3VzKTtcblxuICAgIHRvb2xiYXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBzdGFydE1vdmUpO1xuXG4gICAgY2xvc2VXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnRhaW5lci5yZW1vdmVDaGlsZChldmVudC50YXJnZXQucGFyZW50Tm9kZS5wYXJlbnROb2RlKTtcbiAgICB9KTtcblxuICAgIGlmIChjb250YWluZXIubGFzdEVsZW1lbnRDaGlsZCkge1xuICAgICAgICBhcHBXaW5kb3cuc3R5bGUudG9wID0gKGNvbnRhaW5lci5sYXN0RWxlbWVudENoaWxkLm9mZnNldFRvcCArIDIwKSArIFwicHhcIjtcbiAgICAgICAgYXBwV2luZG93LnN0eWxlLmxlZnQgPSAoY29udGFpbmVyLmxhc3RFbGVtZW50Q2hpbGQub2Zmc2V0TGVmdCArIDIwKSArIFwicHhcIjtcbiAgICB9XG5cbiAgICBhcHBXaW5kb3cuc3R5bGUuekluZGV4ID0gekluZGV4O1xuXG4gICAgekluZGV4ICs9IDE7XG5cbiAgICByZXR1cm4gYXBwV2luZG93O1xufTtcblxudmFyIG1vdmVXaW5kb3cgPSBmdW5jdGlvbihldmVudCkge1xuICAgIG1vdXNlUG9zLnggPSBldmVudC5jbGllbnRYIC0gY29udGFpbmVyLm9mZnNldExlZnQ7XG4gICAgbW91c2VQb3MueSA9IGV2ZW50LmNsaWVudFkgLSBjb250YWluZXIub2Zmc2V0VG9wO1xuXG4gICAgaWYgKG1vdmluZykge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIG1vdmluZy5zdHlsZS50b3AgPSAgbW91c2VQb3MueSAtIGRpc3RhbmNlLnkgKyBcInB4XCI7XG4gICAgICAgIG1vdmluZy5zdHlsZS5sZWZ0ID0gIG1vdXNlUG9zLnggLSBkaXN0YW5jZS54ICsgXCJweFwiO1xuXG4gICAgICAgIGlmIChtb3Zpbmcub2Zmc2V0VG9wIDwgMCkge1xuICAgICAgICAgICAgbW92aW5nLnN0eWxlLnRvcCA9IDA7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG52YXIgZ2l2ZUZvY3VzID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZiAocGFyc2VJbnQoZXZlbnQuY3VycmVudFRhcmdldC5zdHlsZS56SW5kZXgsIDEwKSAhPT0gekluZGV4IC0gMSkge1xuICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LnN0eWxlLnpJbmRleCA9IHpJbmRleDtcbiAgICAgICAgekluZGV4ICs9IDE7XG4gICAgfVxuXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG59O1xuXG52YXIgc3RhcnRNb3ZlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBtb3ZpbmcgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcblxuICAgIGRpc3RhbmNlLnggPSBtb3VzZVBvcy54IC0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUub2Zmc2V0TGVmdDtcbiAgICBkaXN0YW5jZS55ID0gbW91c2VQb3MueSAtIGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLm9mZnNldFRvcDtcbn07XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgbW92ZVdpbmRvdyk7XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBmdW5jdGlvbigpIHtcbiAgICBtb3ZpbmcgPSBudWxsO1xufSk7XG4iXX0=
