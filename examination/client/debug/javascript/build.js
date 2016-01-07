(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function AppWindow(width, height) {
    this.app = null;

    this.div = this.createWindow(width, height);

    this.toolbar = this.div.querySelector(".toolbar");
    this.closeWindow = this.div.querySelector(".close-window");

    this.appContainer = this.div.querySelector(".app-container");
}

AppWindow.prototype.createWindow = function() {
    var template = document.querySelector("#window-template");
    return document.importNode(template.content, true).querySelector(".app-window");

    /*appWindow.style.width = width + "px";
    appWindow.style.height = height + "px";*/
};

/*AppWindow.prototype.resize = function(width, height) {
    this.div.style.width = width + "px";
    this.div.style.height = height + "px";
};*/

AppWindow.prototype.attachApp = function(app) {
    this.app = app;

    this.appContainer.appendChild(app.getAppContent());
};

module.exports = AppWindow;

},{}],2:[function(require,module,exports){
/**
 *
 * @constructor
 */

function Chat() {
    var _this = this;

    this.lastLines = [];
    this.appContent = this.createAppContent();
    this.chatLines = this.appContent.querySelector(".chat-lines");
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

Chat.prototype.createAppContent = function() {
    // TODO: better way of doing this than templates?

    var template = document.querySelector("#chat-template");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    this.attachEventListeners(appContent);

    return appContent;
};

Chat.prototype.attachEventListeners = function(appContent) {
    var chatForm = appContent.querySelector(".chat-form");

    chatForm.addEventListener("submit", this.submitChatForm.bind(this));
};

Chat.prototype.submitChatForm = function(event) {
    event.preventDefault();

    this.sendMessage(event.target.elements[0].value);

    event.target.elements[0].value = "";
};

Chat.prototype.appendLine = function(username, line) {
    this.lastLines.push(username + ": " + line);
    if (this.lastLines.length > 20) {
        this.lastLines.shift();
    }

    this.convertLinesToHTML();
};

Chat.prototype.convertLinesToHTML = function() {
    var _this = this;

    while (this.chatLines.hasChildNodes()) {
        this.chatLines.removeChild(this.chatLines.firstElementChild);
    }

    this.lastLines.forEach(function(line) {
        var newLine = document.createElement("span");
        newLine.textContent = line;

        _this.chatLines.appendChild(newLine);
        _this.chatLines.appendChild(document.createElement("br"));
    });

    this.publishMessages();
};

Chat.prototype.publishMessages = function() {
    var _this = this;
    var forEach = Array.prototype.forEach;

    forEach.call(document.querySelectorAll(".chat"), function(chatWin) {
        var newChat = _this.chatLines.cloneNode(true);

        chatWin.removeChild(chatWin.querySelector(".chat-lines"));

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

    // offline capabilities TODO: use this as a fallback?
    this.appendLine(this.username, message);
};

Chat.prototype.getAppContent = function() {
    // Cloning does not attach event listeners, so we have to do it afterwards

    var content = this.appContent.cloneNode(true);

    this.attachEventListeners(content);

    return content;
};

module.exports = Chat;

},{}],3:[function(require,module,exports){
var AppWindow = require("./AppWindow");

/**
 * Desktop object which contains all the AppWindow objects along with settings.
 */
function Desktop() {
    this.windows = [];

    this.container = document.querySelector("#window_container");

    this.settings = {
        backgroundColor: "azure",
        width: 200,
        height: 300
    };

    // The object that contains apps that should only have one instance across the desktop (e.g. chat).
    this.instances = {

    };

    this.movingWindow = null;
    this.topZIndex = 1;

    this.distance = {
        x: 0,
        y: 0
    };

    this.mousePos = {
        x: 0,
        y: 0
    };

    document.addEventListener("mousemove", this.moveWindow.bind(this));
    document.addEventListener("mouseup", function() {
        this.movingWindow = null;
    }.bind(this));
}

Desktop.prototype.attachWindow = function(app) {
    var appWindow = new AppWindow();

    // Check if there are any windows in the desktop. If so, change its position.
    if (this.windows.length >= 1) {
        appWindow.div.style.left = (this.windows[this.windows.length - 1].div.offsetLeft + 20) + "px";
        appWindow.div.style.top = (this.windows[this.windows.length - 1].div.offsetTop + 20) + "px";
    }

    appWindow.div.style.zIndex = this.topZIndex;
    this.topZIndex += 1;

    // We push it to the list of windows first, so that we know the app window's index in the array
    this.windows.push(appWindow);

    this.attachEventListeners(appWindow);

    if (app) {
        appWindow.attachApp(app);
    }

    this.container.appendChild(appWindow.div);
};

Desktop.prototype.attachEventListeners = function(appWindow) {

    // Attaches the event listener that gives the app window focus
    appWindow.div.addEventListener("mousedown", this.giveFocus.bind(this));

    // Attaches the event listener that starts moving the window
    appWindow.toolbar.addEventListener("mousedown", this.startMove.bind(this));

    // Attaches the event listener that closes the window and removes it from the list of windows.
    appWindow.closeWindow.addEventListener("click", function() {
        this.container.removeChild(appWindow.div);
        this.windows.splice(this.windows.indexOf(appWindow), 1);
    }.bind(this));
};

Desktop.prototype.giveFocus = function(event) {
    if (parseInt(event.currentTarget.style.zIndex, 10) !== this.topZIndex - 1) {
        event.currentTarget.style.zIndex = this.topZIndex;
        this.topZIndex += 1;
    }

    event.stopPropagation();
};

Desktop.prototype.moveWindow = function(event) {
    this.mousePos.x = event.clientX - this.container.offsetLeft;
    this.mousePos.y = event.clientY - this.container.offsetTop;

    if (this.movingWindow) {
        event.preventDefault();

        this.movingWindow.style.top =  this.mousePos.y - this.distance.y + "px";
        this.movingWindow.style.left =  this.mousePos.x - this.distance.x + "px";

        // Prevent the window from moving off the top of the desktop. Other directions are fine,
        // just like in a real operating system!
        if (this.movingWindow.offsetTop < 0) {
            this.movingWindow.style.top = 0;
        }
    }
};

Desktop.prototype.startMove = function(event) {
    this.movingWindow = event.target.parentNode;

    this.distance.x = this.mousePos.x - event.target.parentNode.offsetLeft;
    this.distance.y = this.mousePos.y - event.target.parentNode.offsetTop;
};

module.exports = Desktop;

},{"./AppWindow":1}],4:[function(require,module,exports){
function Memory(boardX, boardY) {
    // TODO: where should I handle legal/illegal board sizes?

    this.boardX = boardX || 4;
    this.boardY = boardY || 4;
    this.totalBricks = this.boardX * this.boardY;
    this.removedBricks = 0;
    this.moves = 0;
    this.board = null;
    this.info = null;
    this.bricks = [];
    this.boundReveal = this.revealBrick.bind(this);

    this.selectedBrick = null;

    this.appContent = this.createAppContent();
}

Memory.prototype.createAppContent = function() {
    var template = document.querySelector("#memory-template");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    this.board = appContent.querySelector(".board");
    this.info = appContent.querySelector(".info");
    this.initializeBoard();

    this.attachEventListeners(appContent);

    return appContent;
};

Memory.prototype.attachEventListeners = function(appContent) {
    this.board.addEventListener("click", this.boundReveal);
};

Memory.prototype.initializeBoard = function() {
    var _this = this;

    this.board.style.width = (48 * this.boardX) + "px";
    this.board.style.height = (48 * this.boardY) + "px";

    var i;
    var count = 0;
    for (i = 0; i < this.totalBricks; i += 2) {
        this.bricks[i] = count % 8;
        this.bricks[i + 1] = count % 8;
        count = count == 7 ? count = 0 : count += 1;
    }

    // Fisher-Yates
    for (i = this.totalBricks - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var k = this.bricks[j];
        this.bricks[j] = this.bricks[i];
        this.bricks[i] = k;
    }

    this.bricks.forEach(function() {
        var brick = document.createElement("img");
        brick.classList.add("memory-brick");
        brick.setAttribute("src", "/image/hidden.png");

        _this.board.appendChild(brick);
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

Memory.prototype.getAppContent = function() {
    return this.appContent;
};

module.exports = Memory;

},{}],5:[function(require,module,exports){
// App controls the UI and is responsible for creating new app instances. Adding new apps
// to the Personal Web Desktop should be as easy as importing it in app.js and creating it.

// The apps follow the same structure:
// They all contain a function called getAppContent, which returns the div that needs to
// be attached to the app window's app container. For apps

(function init() {
    // Initialize the desktop.
    var Desktop = require("./Desktop");
    var desktop = new Desktop();

    // Import the necessary apps.
    var Memory = require("./Memory");
    var Chat = require("./Chat");

    var newWindow = document.querySelector("#new_window");
    var newChatWindow = document.querySelector("#new_chat");
    var newMemoryWindow = document.querySelector("#new_memory");

    newWindow.addEventListener("click", function() {
        desktop.attachWindow();
    });

    newChatWindow.addEventListener("click", function() {
        if (!desktop.instances.chat) {
            desktop.instances.chat = new Chat();
        }

        desktop.attachWindow(desktop.instances.chat);
    });

    newMemoryWindow.addEventListener("click", function() {
        desktop.attachWindow(new Memory(4, 4));
    });
})();

},{"./Chat":2,"./Desktop":3,"./Memory":4}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQXBwV2luZG93LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9DaGF0LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9EZXNrdG9wLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9NZW1vcnkuanMiLCJjbGllbnQvc291cmNlL2pzL2FwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJmdW5jdGlvbiBBcHBXaW5kb3cod2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMuYXBwID0gbnVsbDtcblxuICAgIHRoaXMuZGl2ID0gdGhpcy5jcmVhdGVXaW5kb3cod2lkdGgsIGhlaWdodCk7XG5cbiAgICB0aGlzLnRvb2xiYXIgPSB0aGlzLmRpdi5xdWVyeVNlbGVjdG9yKFwiLnRvb2xiYXJcIik7XG4gICAgdGhpcy5jbG9zZVdpbmRvdyA9IHRoaXMuZGl2LnF1ZXJ5U2VsZWN0b3IoXCIuY2xvc2Utd2luZG93XCIpO1xuXG4gICAgdGhpcy5hcHBDb250YWluZXIgPSB0aGlzLmRpdi5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250YWluZXJcIik7XG59XG5cbkFwcFdpbmRvdy5wcm90b3R5cGUuY3JlYXRlV2luZG93ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN3aW5kb3ctdGVtcGxhdGVcIik7XG4gICAgcmV0dXJuIGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5hcHAtd2luZG93XCIpO1xuXG4gICAgLyphcHBXaW5kb3cuc3R5bGUud2lkdGggPSB3aWR0aCArIFwicHhcIjtcbiAgICBhcHBXaW5kb3cuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgXCJweFwiOyovXG59O1xuXG4vKkFwcFdpbmRvdy5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMuZGl2LnN0eWxlLndpZHRoID0gd2lkdGggKyBcInB4XCI7XG4gICAgdGhpcy5kaXYuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgXCJweFwiO1xufTsqL1xuXG5BcHBXaW5kb3cucHJvdG90eXBlLmF0dGFjaEFwcCA9IGZ1bmN0aW9uKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuXG4gICAgdGhpcy5hcHBDb250YWluZXIuYXBwZW5kQ2hpbGQoYXBwLmdldEFwcENvbnRlbnQoKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcFdpbmRvdztcbiIsIi8qKlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5cbmZ1bmN0aW9uIENoYXQoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMubGFzdExpbmVzID0gW107XG4gICAgdGhpcy5hcHBDb250ZW50ID0gdGhpcy5jcmVhdGVBcHBDb250ZW50KCk7XG4gICAgdGhpcy5jaGF0TGluZXMgPSB0aGlzLmFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5jaGF0LWxpbmVzXCIpO1xuICAgIHRoaXMudXNlcm5hbWUgPSBcImZwXCI7XG4gICAgdGhpcy5hcGlLZXkgPSBcImVEQkU3NmRlVTdMMEg5bUVCZ3hVS1ZSMFZDbnEwWEJkXCI7XG4gICAgdGhpcy5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KFwid3M6Ly92aG9zdDMubG51LnNlOjIwMDgwL3NvY2tldC9cIik7XG5cbiAgICAvLyBUT0RPOiBNYWtlIHN1cmUgdGhlIHNvY2tldCBvcGVucyBiZWZvcmUgdGhlIHVzZXIgY2FuIHNlbmQgbWVzc2FnZXNcblxuICAgIHRoaXMuc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGV2ZW50LmRhdGEpO1xuXG4gICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcblxuICAgICAgICBpZiAobWVzc2FnZS50eXBlICE9IFwiaGVhcnRiZWF0XCIpIHtcbiAgICAgICAgICAgIF90aGlzLmFwcGVuZExpbmUobWVzc2FnZS51c2VybmFtZSwgbWVzc2FnZS5kYXRhKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5DaGF0LnByb3RvdHlwZS5jcmVhdGVBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gVE9ETzogYmV0dGVyIHdheSBvZiBkb2luZyB0aGlzIHRoYW4gdGVtcGxhdGVzP1xuXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjaGF0LXRlbXBsYXRlXCIpO1xuICAgIHZhciBhcHBDb250ZW50ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250ZW50XCIpO1xuXG4gICAgdGhpcy5hdHRhY2hFdmVudExpc3RlbmVycyhhcHBDb250ZW50KTtcblxuICAgIHJldHVybiBhcHBDb250ZW50O1xufTtcblxuQ2hhdC5wcm90b3R5cGUuYXR0YWNoRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbihhcHBDb250ZW50KSB7XG4gICAgdmFyIGNoYXRGb3JtID0gYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtZm9ybVwiKTtcblxuICAgIGNoYXRGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgdGhpcy5zdWJtaXRDaGF0Rm9ybS5iaW5kKHRoaXMpKTtcbn07XG5cbkNoYXQucHJvdG90eXBlLnN1Ym1pdENoYXRGb3JtID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdGhpcy5zZW5kTWVzc2FnZShldmVudC50YXJnZXQuZWxlbWVudHNbMF0udmFsdWUpO1xuXG4gICAgZXZlbnQudGFyZ2V0LmVsZW1lbnRzWzBdLnZhbHVlID0gXCJcIjtcbn07XG5cbkNoYXQucHJvdG90eXBlLmFwcGVuZExpbmUgPSBmdW5jdGlvbih1c2VybmFtZSwgbGluZSkge1xuICAgIHRoaXMubGFzdExpbmVzLnB1c2godXNlcm5hbWUgKyBcIjogXCIgKyBsaW5lKTtcbiAgICBpZiAodGhpcy5sYXN0TGluZXMubGVuZ3RoID4gMjApIHtcbiAgICAgICAgdGhpcy5sYXN0TGluZXMuc2hpZnQoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnZlcnRMaW5lc1RvSFRNTCgpO1xufTtcblxuQ2hhdC5wcm90b3R5cGUuY29udmVydExpbmVzVG9IVE1MID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHdoaWxlICh0aGlzLmNoYXRMaW5lcy5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5jaGF0TGluZXMucmVtb3ZlQ2hpbGQodGhpcy5jaGF0TGluZXMuZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIHRoaXMubGFzdExpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZSkge1xuICAgICAgICB2YXIgbmV3TGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBuZXdMaW5lLnRleHRDb250ZW50ID0gbGluZTtcblxuICAgICAgICBfdGhpcy5jaGF0TGluZXMuYXBwZW5kQ2hpbGQobmV3TGluZSk7XG4gICAgICAgIF90aGlzLmNoYXRMaW5lcy5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnJcIikpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5wdWJsaXNoTWVzc2FnZXMoKTtcbn07XG5cbkNoYXQucHJvdG90eXBlLnB1Ymxpc2hNZXNzYWdlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdmFyIGZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDtcblxuICAgIGZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNoYXRcIiksIGZ1bmN0aW9uKGNoYXRXaW4pIHtcbiAgICAgICAgdmFyIG5ld0NoYXQgPSBfdGhpcy5jaGF0TGluZXMuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgIGNoYXRXaW4ucmVtb3ZlQ2hpbGQoY2hhdFdpbi5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtbGluZXNcIikpO1xuXG4gICAgICAgIGNoYXRXaW4uaW5zZXJ0QmVmb3JlKG5ld0NoYXQsIGNoYXRXaW4ucXVlcnlTZWxlY3RvcihcIi5jaGF0LWZvcm1cIikpO1xuICAgIH0pO1xufTtcblxuQ2hhdC5wcm90b3R5cGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgdmFyIGRhdGEgPSB7fTtcblxuICAgIGRhdGEudXNlcm5hbWUgPSB0aGlzLnVzZXJuYW1lO1xuICAgIGRhdGEuZGF0YSA9IG1lc3NhZ2U7XG4gICAgZGF0YS5rZXkgPSB0aGlzLmFwaUtleTtcbiAgICBkYXRhLnR5cGUgPSBcIm1lc3NhZ2VcIjtcblxuICAgIHRoaXMuc29ja2V0LnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXG4gICAgLy8gb2ZmbGluZSBjYXBhYmlsaXRpZXMgVE9ETzogdXNlIHRoaXMgYXMgYSBmYWxsYmFjaz9cbiAgICB0aGlzLmFwcGVuZExpbmUodGhpcy51c2VybmFtZSwgbWVzc2FnZSk7XG59O1xuXG5DaGF0LnByb3RvdHlwZS5nZXRBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gQ2xvbmluZyBkb2VzIG5vdCBhdHRhY2ggZXZlbnQgbGlzdGVuZXJzLCBzbyB3ZSBoYXZlIHRvIGRvIGl0IGFmdGVyd2FyZHNcblxuICAgIHZhciBjb250ZW50ID0gdGhpcy5hcHBDb250ZW50LmNsb25lTm9kZSh0cnVlKTtcblxuICAgIHRoaXMuYXR0YWNoRXZlbnRMaXN0ZW5lcnMoY29udGVudCk7XG5cbiAgICByZXR1cm4gY29udGVudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhdDtcbiIsInZhciBBcHBXaW5kb3cgPSByZXF1aXJlKFwiLi9BcHBXaW5kb3dcIik7XG5cbi8qKlxuICogRGVza3RvcCBvYmplY3Qgd2hpY2ggY29udGFpbnMgYWxsIHRoZSBBcHBXaW5kb3cgb2JqZWN0cyBhbG9uZyB3aXRoIHNldHRpbmdzLlxuICovXG5mdW5jdGlvbiBEZXNrdG9wKCkge1xuICAgIHRoaXMud2luZG93cyA9IFtdO1xuXG4gICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3dpbmRvd19jb250YWluZXJcIik7XG5cbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiYXp1cmVcIixcbiAgICAgICAgd2lkdGg6IDIwMCxcbiAgICAgICAgaGVpZ2h0OiAzMDBcbiAgICB9O1xuXG4gICAgLy8gVGhlIG9iamVjdCB0aGF0IGNvbnRhaW5zIGFwcHMgdGhhdCBzaG91bGQgb25seSBoYXZlIG9uZSBpbnN0YW5jZSBhY3Jvc3MgdGhlIGRlc2t0b3AgKGUuZy4gY2hhdCkuXG4gICAgdGhpcy5pbnN0YW5jZXMgPSB7XG5cbiAgICB9O1xuXG4gICAgdGhpcy5tb3ZpbmdXaW5kb3cgPSBudWxsO1xuICAgIHRoaXMudG9wWkluZGV4ID0gMTtcblxuICAgIHRoaXMuZGlzdGFuY2UgPSB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDBcbiAgICB9O1xuXG4gICAgdGhpcy5tb3VzZVBvcyA9IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgIH07XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMubW92ZVdpbmRvdy5iaW5kKHRoaXMpKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb3ZpbmdXaW5kb3cgPSBudWxsO1xuICAgIH0uYmluZCh0aGlzKSk7XG59XG5cbkRlc2t0b3AucHJvdG90eXBlLmF0dGFjaFdpbmRvdyA9IGZ1bmN0aW9uKGFwcCkge1xuICAgIHZhciBhcHBXaW5kb3cgPSBuZXcgQXBwV2luZG93KCk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGVyZSBhcmUgYW55IHdpbmRvd3MgaW4gdGhlIGRlc2t0b3AuIElmIHNvLCBjaGFuZ2UgaXRzIHBvc2l0aW9uLlxuICAgIGlmICh0aGlzLndpbmRvd3MubGVuZ3RoID49IDEpIHtcbiAgICAgICAgYXBwV2luZG93LmRpdi5zdHlsZS5sZWZ0ID0gKHRoaXMud2luZG93c1t0aGlzLndpbmRvd3MubGVuZ3RoIC0gMV0uZGl2Lm9mZnNldExlZnQgKyAyMCkgKyBcInB4XCI7XG4gICAgICAgIGFwcFdpbmRvdy5kaXYuc3R5bGUudG9wID0gKHRoaXMud2luZG93c1t0aGlzLndpbmRvd3MubGVuZ3RoIC0gMV0uZGl2Lm9mZnNldFRvcCArIDIwKSArIFwicHhcIjtcbiAgICB9XG5cbiAgICBhcHBXaW5kb3cuZGl2LnN0eWxlLnpJbmRleCA9IHRoaXMudG9wWkluZGV4O1xuICAgIHRoaXMudG9wWkluZGV4ICs9IDE7XG5cbiAgICAvLyBXZSBwdXNoIGl0IHRvIHRoZSBsaXN0IG9mIHdpbmRvd3MgZmlyc3QsIHNvIHRoYXQgd2Uga25vdyB0aGUgYXBwIHdpbmRvdydzIGluZGV4IGluIHRoZSBhcnJheVxuICAgIHRoaXMud2luZG93cy5wdXNoKGFwcFdpbmRvdyk7XG5cbiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKGFwcFdpbmRvdyk7XG5cbiAgICBpZiAoYXBwKSB7XG4gICAgICAgIGFwcFdpbmRvdy5hdHRhY2hBcHAoYXBwKTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZChhcHBXaW5kb3cuZGl2KTtcbn07XG5cbkRlc2t0b3AucHJvdG90eXBlLmF0dGFjaEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24oYXBwV2luZG93KSB7XG5cbiAgICAvLyBBdHRhY2hlcyB0aGUgZXZlbnQgbGlzdGVuZXIgdGhhdCBnaXZlcyB0aGUgYXBwIHdpbmRvdyBmb2N1c1xuICAgIGFwcFdpbmRvdy5kaXYuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB0aGlzLmdpdmVGb2N1cy5iaW5kKHRoaXMpKTtcblxuICAgIC8vIEF0dGFjaGVzIHRoZSBldmVudCBsaXN0ZW5lciB0aGF0IHN0YXJ0cyBtb3ZpbmcgdGhlIHdpbmRvd1xuICAgIGFwcFdpbmRvdy50b29sYmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgdGhpcy5zdGFydE1vdmUuYmluZCh0aGlzKSk7XG5cbiAgICAvLyBBdHRhY2hlcyB0aGUgZXZlbnQgbGlzdGVuZXIgdGhhdCBjbG9zZXMgdGhlIHdpbmRvdyBhbmQgcmVtb3ZlcyBpdCBmcm9tIHRoZSBsaXN0IG9mIHdpbmRvd3MuXG4gICAgYXBwV2luZG93LmNsb3NlV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQoYXBwV2luZG93LmRpdik7XG4gICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UodGhpcy53aW5kb3dzLmluZGV4T2YoYXBwV2luZG93KSwgMSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbkRlc2t0b3AucHJvdG90eXBlLmdpdmVGb2N1cyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaWYgKHBhcnNlSW50KGV2ZW50LmN1cnJlbnRUYXJnZXQuc3R5bGUuekluZGV4LCAxMCkgIT09IHRoaXMudG9wWkluZGV4IC0gMSkge1xuICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LnN0eWxlLnpJbmRleCA9IHRoaXMudG9wWkluZGV4O1xuICAgICAgICB0aGlzLnRvcFpJbmRleCArPSAxO1xuICAgIH1cblxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xufTtcblxuRGVza3RvcC5wcm90b3R5cGUubW92ZVdpbmRvdyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdGhpcy5tb3VzZVBvcy54ID0gZXZlbnQuY2xpZW50WCAtIHRoaXMuY29udGFpbmVyLm9mZnNldExlZnQ7XG4gICAgdGhpcy5tb3VzZVBvcy55ID0gZXZlbnQuY2xpZW50WSAtIHRoaXMuY29udGFpbmVyLm9mZnNldFRvcDtcblxuICAgIGlmICh0aGlzLm1vdmluZ1dpbmRvdykge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHRoaXMubW92aW5nV2luZG93LnN0eWxlLnRvcCA9ICB0aGlzLm1vdXNlUG9zLnkgLSB0aGlzLmRpc3RhbmNlLnkgKyBcInB4XCI7XG4gICAgICAgIHRoaXMubW92aW5nV2luZG93LnN0eWxlLmxlZnQgPSAgdGhpcy5tb3VzZVBvcy54IC0gdGhpcy5kaXN0YW5jZS54ICsgXCJweFwiO1xuXG4gICAgICAgIC8vIFByZXZlbnQgdGhlIHdpbmRvdyBmcm9tIG1vdmluZyBvZmYgdGhlIHRvcCBvZiB0aGUgZGVza3RvcC4gT3RoZXIgZGlyZWN0aW9ucyBhcmUgZmluZSxcbiAgICAgICAgLy8ganVzdCBsaWtlIGluIGEgcmVhbCBvcGVyYXRpbmcgc3lzdGVtIVxuICAgICAgICBpZiAodGhpcy5tb3ZpbmdXaW5kb3cub2Zmc2V0VG9wIDwgMCkge1xuICAgICAgICAgICAgdGhpcy5tb3ZpbmdXaW5kb3cuc3R5bGUudG9wID0gMDtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkRlc2t0b3AucHJvdG90eXBlLnN0YXJ0TW92ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdGhpcy5tb3ZpbmdXaW5kb3cgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcblxuICAgIHRoaXMuZGlzdGFuY2UueCA9IHRoaXMubW91c2VQb3MueCAtIGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLm9mZnNldExlZnQ7XG4gICAgdGhpcy5kaXN0YW5jZS55ID0gdGhpcy5tb3VzZVBvcy55IC0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUub2Zmc2V0VG9wO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZXNrdG9wO1xuIiwiZnVuY3Rpb24gTWVtb3J5KGJvYXJkWCwgYm9hcmRZKSB7XG4gICAgLy8gVE9ETzogd2hlcmUgc2hvdWxkIEkgaGFuZGxlIGxlZ2FsL2lsbGVnYWwgYm9hcmQgc2l6ZXM/XG5cbiAgICB0aGlzLmJvYXJkWCA9IGJvYXJkWCB8fCA0O1xuICAgIHRoaXMuYm9hcmRZID0gYm9hcmRZIHx8IDQ7XG4gICAgdGhpcy50b3RhbEJyaWNrcyA9IHRoaXMuYm9hcmRYICogdGhpcy5ib2FyZFk7XG4gICAgdGhpcy5yZW1vdmVkQnJpY2tzID0gMDtcbiAgICB0aGlzLm1vdmVzID0gMDtcbiAgICB0aGlzLmJvYXJkID0gbnVsbDtcbiAgICB0aGlzLmluZm8gPSBudWxsO1xuICAgIHRoaXMuYnJpY2tzID0gW107XG4gICAgdGhpcy5ib3VuZFJldmVhbCA9IHRoaXMucmV2ZWFsQnJpY2suYmluZCh0aGlzKTtcblxuICAgIHRoaXMuc2VsZWN0ZWRCcmljayA9IG51bGw7XG5cbiAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnQoKTtcbn1cblxuTWVtb3J5LnByb3RvdHlwZS5jcmVhdGVBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNtZW1vcnktdGVtcGxhdGVcIik7XG4gICAgdmFyIGFwcENvbnRlbnQgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG5cbiAgICB0aGlzLmJvYXJkID0gYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmJvYXJkXCIpO1xuICAgIHRoaXMuaW5mbyA9IGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5pbmZvXCIpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZUJvYXJkKCk7XG5cbiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKGFwcENvbnRlbnQpO1xuXG4gICAgcmV0dXJuIGFwcENvbnRlbnQ7XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLmF0dGFjaEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24oYXBwQ29udGVudCkge1xuICAgIHRoaXMuYm9hcmQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuYm91bmRSZXZlYWwpO1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5pbml0aWFsaXplQm9hcmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5ib2FyZC5zdHlsZS53aWR0aCA9ICg0OCAqIHRoaXMuYm9hcmRYKSArIFwicHhcIjtcbiAgICB0aGlzLmJvYXJkLnN0eWxlLmhlaWdodCA9ICg0OCAqIHRoaXMuYm9hcmRZKSArIFwicHhcIjtcblxuICAgIHZhciBpO1xuICAgIHZhciBjb3VudCA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMudG90YWxCcmlja3M7IGkgKz0gMikge1xuICAgICAgICB0aGlzLmJyaWNrc1tpXSA9IGNvdW50ICUgODtcbiAgICAgICAgdGhpcy5icmlja3NbaSArIDFdID0gY291bnQgJSA4O1xuICAgICAgICBjb3VudCA9IGNvdW50ID09IDcgPyBjb3VudCA9IDAgOiBjb3VudCArPSAxO1xuICAgIH1cblxuICAgIC8vIEZpc2hlci1ZYXRlc1xuICAgIGZvciAoaSA9IHRoaXMudG90YWxCcmlja3MgLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIHZhciBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkgKyAxKSk7XG4gICAgICAgIHZhciBrID0gdGhpcy5icmlja3Nbal07XG4gICAgICAgIHRoaXMuYnJpY2tzW2pdID0gdGhpcy5icmlja3NbaV07XG4gICAgICAgIHRoaXMuYnJpY2tzW2ldID0gaztcbiAgICB9XG5cbiAgICB0aGlzLmJyaWNrcy5mb3JFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYnJpY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgICAgICBicmljay5jbGFzc0xpc3QuYWRkKFwibWVtb3J5LWJyaWNrXCIpO1xuICAgICAgICBicmljay5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvaGlkZGVuLnBuZ1wiKTtcblxuICAgICAgICBfdGhpcy5ib2FyZC5hcHBlbmRDaGlsZChicmljayk7XG4gICAgfSk7XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLnJldmVhbEJyaWNrID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgYnJpY2sgPSBldmVudC50YXJnZXQ7XG4gICAgdmFyIHBhcmVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XG5cbiAgICBpZiAodGhpcy5zZWxlY3RlZEJyaWNrICYmIGJyaWNrID09PSB0aGlzLnNlbGVjdGVkQnJpY2suYnJpY2tFbGVtKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoYnJpY2sgPT09IHBhcmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChwYXJlbnQuY2hpbGRyZW4sIGJyaWNrKTtcblxuICAgIGJyaWNrLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9cIiArIHRoaXMuYnJpY2tzW2luZGV4XSArIFwiLnBuZ1wiKTtcblxuICAgIGlmICghdGhpcy5zZWxlY3RlZEJyaWNrKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRCcmljayA9IHticmlja0VsZW06IGJyaWNrLCB2YWx1ZTogdGhpcy5icmlja3NbaW5kZXhdfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNoZWNrTWF0Y2goe2JyaWNrRWxlbTogYnJpY2ssIHZhbHVlOiB0aGlzLmJyaWNrc1tpbmRleF19KVxuICAgIH1cbn07XG5cbk1lbW9yeS5wcm90b3R5cGUuY2hlY2tNYXRjaCA9IGZ1bmN0aW9uKGJyaWNrKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuYm9hcmQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuYm91bmRSZXZlYWwpO1xuXG4gICAgaWYgKGJyaWNrLnZhbHVlID09PSB0aGlzLnNlbGVjdGVkQnJpY2sudmFsdWUpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJyaWNrLmJyaWNrRWxlbS5jbGFzc0xpc3QuYWRkKFwicmVtb3ZlZFwiKTtcbiAgICAgICAgICAgIF90aGlzLnNlbGVjdGVkQnJpY2suYnJpY2tFbGVtLmNsYXNzTGlzdC5hZGQoXCJyZW1vdmVkXCIpO1xuXG4gICAgICAgICAgICBfdGhpcy5yZW1vdmVkQnJpY2tzICs9IDI7XG5cbiAgICAgICAgICAgIF90aGlzLnNlbGVjdGVkQnJpY2sgPSBudWxsO1xuICAgICAgICAgICAgX3RoaXMuYm9hcmQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIF90aGlzLmJvdW5kUmV2ZWFsKTtcblxuICAgICAgICAgICAgaWYgKF90aGlzLnJlbW92ZWRCcmlja3MgPT09IF90aGlzLnRvdGFsQnJpY2tzKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuZW5kR2FtZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxMDAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYnJpY2suYnJpY2tFbGVtLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9oaWRkZW4ucG5nXCIpO1xuICAgICAgICAgICAgX3RoaXMuc2VsZWN0ZWRCcmljay5icmlja0VsZW0uc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiL2ltYWdlL2hpZGRlbi5wbmdcIik7XG5cbiAgICAgICAgICAgIF90aGlzLnNlbGVjdGVkQnJpY2sgPSBudWxsO1xuICAgICAgICAgICAgX3RoaXMuYm9hcmQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIF90aGlzLmJvdW5kUmV2ZWFsKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxuXG4gICAgdGhpcy5tb3ZlcyArPSAxO1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5lbmRHYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pbmZvLnRleHRDb250ZW50ID0gXCJZb3Ugd29uISBNb3ZlcyB0YWtlbjogXCIgKyB0aGlzLm1vdmVzO1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5nZXRBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuYXBwQ29udGVudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWVtb3J5O1xuIiwiLy8gQXBwIGNvbnRyb2xzIHRoZSBVSSBhbmQgaXMgcmVzcG9uc2libGUgZm9yIGNyZWF0aW5nIG5ldyBhcHAgaW5zdGFuY2VzLiBBZGRpbmcgbmV3IGFwcHNcbi8vIHRvIHRoZSBQZXJzb25hbCBXZWIgRGVza3RvcCBzaG91bGQgYmUgYXMgZWFzeSBhcyBpbXBvcnRpbmcgaXQgaW4gYXBwLmpzIGFuZCBjcmVhdGluZyBpdC5cblxuLy8gVGhlIGFwcHMgZm9sbG93IHRoZSBzYW1lIHN0cnVjdHVyZTpcbi8vIFRoZXkgYWxsIGNvbnRhaW4gYSBmdW5jdGlvbiBjYWxsZWQgZ2V0QXBwQ29udGVudCwgd2hpY2ggcmV0dXJucyB0aGUgZGl2IHRoYXQgbmVlZHMgdG9cbi8vIGJlIGF0dGFjaGVkIHRvIHRoZSBhcHAgd2luZG93J3MgYXBwIGNvbnRhaW5lci4gRm9yIGFwcHNcblxuKGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgZGVza3RvcC5cbiAgICB2YXIgRGVza3RvcCA9IHJlcXVpcmUoXCIuL0Rlc2t0b3BcIik7XG4gICAgdmFyIGRlc2t0b3AgPSBuZXcgRGVza3RvcCgpO1xuXG4gICAgLy8gSW1wb3J0IHRoZSBuZWNlc3NhcnkgYXBwcy5cbiAgICB2YXIgTWVtb3J5ID0gcmVxdWlyZShcIi4vTWVtb3J5XCIpO1xuICAgIHZhciBDaGF0ID0gcmVxdWlyZShcIi4vQ2hhdFwiKTtcblxuICAgIHZhciBuZXdXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld193aW5kb3dcIik7XG4gICAgdmFyIG5ld0NoYXRXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19jaGF0XCIpO1xuICAgIHZhciBuZXdNZW1vcnlXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19tZW1vcnlcIik7XG5cbiAgICBuZXdXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICBkZXNrdG9wLmF0dGFjaFdpbmRvdygpO1xuICAgIH0pO1xuXG4gICAgbmV3Q2hhdFdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghZGVza3RvcC5pbnN0YW5jZXMuY2hhdCkge1xuICAgICAgICAgICAgZGVza3RvcC5pbnN0YW5jZXMuY2hhdCA9IG5ldyBDaGF0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBkZXNrdG9wLmF0dGFjaFdpbmRvdyhkZXNrdG9wLmluc3RhbmNlcy5jaGF0KTtcbiAgICB9KTtcblxuICAgIG5ld01lbW9yeVdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRlc2t0b3AuYXR0YWNoV2luZG93KG5ldyBNZW1vcnkoNCwgNCkpO1xuICAgIH0pO1xufSkoKTtcbiJdfQ==
