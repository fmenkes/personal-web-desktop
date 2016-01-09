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
};

AppWindow.prototype.attachApp = function(app) {
    this.app = app;

    while (this.appContainer.hasChildNodes()) {
        this.appContainer.removeChild(this.appContainer.firstElementChild);
    }

    this.appContainer.appendChild(app.getAppContent());
};

module.exports = AppWindow;

},{}],2:[function(require,module,exports){
/**
 *
 * @constructor
 */

function Chat(username) {
    var _this = this;

    this.lastLines = [];

    // Attempt to retrieve stored username. If this fails, it is handled in createAppContent.
    this.username = username;
    this.appContent = this.createAppContent();
    this.chatLines = this.appContent.querySelector(".chat-lines");
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
    this.lastLines.push({username: username, line: line});
    if (this.lastLines.length > 20) {
        this.lastLines.shift();
    }

    this.convertLinesToHTML();
};

Chat.prototype.convertLinesToHTML = function() {
    var _this = this;
    var template = document.querySelector("#chat-line-template");
    var chatLine = document.importNode(template.content, true).querySelector(".chat-message");

    while (this.chatLines.hasChildNodes()) {
        this.chatLines.removeChild(this.chatLines.firstElementChild);
    }

    this.lastLines.forEach(function(line, index) {
        var order = _this.lastLines.length - index;
        var newLine = chatLine.cloneNode(true);
        newLine.querySelector(".username").textContent = line.username;
        newLine.querySelector(".chat-line").textContent = line.line;

        newLine.style.order = order;

        _this.chatLines.appendChild(newLine);
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

    //this.socket.send(JSON.stringify(data));

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

    this.username = localStorage.getItem("username");

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
    this.totalBricks = 0;
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
    var board = appContent.querySelector(".board");
    var newGame = appContent.querySelector(".new-game");

    board.addEventListener("click", this.boundReveal);
    newGame.addEventListener("submit", this.newGame.bind(this));
};

Memory.prototype.newGame = function(event) {
    event.preventDefault();

    var newBoardX = event.target.elements[1].value;
    var newBoardY = event.target.elements[2].value;

    if (isNaN(newBoardX) || isNaN(newBoardY)) {
        this.info.textContent = "Please enter only numbers.";
        return;
    }

    if (newBoardX < 2 || newBoardX > 10 || newBoardY < 2 || newBoardY > 10) {
        this.info.textContent = "Please enter numbers between 2 and 10.";
        return;
    }

    if ((newBoardX * newBoardY) % 2 !== 0) {
        this.info.textContent = "The amount of bricks must be even.";
        return;
    }

    this.boardX = newBoardX;
    this.boardY = newBoardY;

    while (this.board.hasChildNodes()) {
        this.board.removeChild(this.board.firstElementChild);
    }

    this.info.textContent = "";

    this.initializeBoard();
};

Memory.prototype.initializeBoard = function() {
    var _this = this;

    this.board.style.width = (48 * this.boardX) + "px";
    this.board.style.height = (48 * this.boardY) + "px";

    this.totalBricks = this.boardX * this.boardY;
    this.removedBricks = 0;
    this.moves = 0;
    this.bricks = [];

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
            if (!desktop.username) {
                var user = prompt("Please enter a username:");

                if (user) {
                    localStorage.setItem("username", user);

                    desktop.username = user;
                } else {
                    return;
                }
            }

            desktop.instances.chat = new Chat(desktop.username);
        }

        desktop.attachWindow(desktop.instances.chat);
    });

    newMemoryWindow.addEventListener("click", function() {
        desktop.attachWindow(new Memory(4, 4));
    });
})();

},{"./Chat":2,"./Desktop":3,"./Memory":4}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQXBwV2luZG93LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9DaGF0LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9EZXNrdG9wLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9NZW1vcnkuanMiLCJjbGllbnQvc291cmNlL2pzL2FwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gQXBwV2luZG93KHdpZHRoLCBoZWlnaHQpIHtcbiAgICB0aGlzLmFwcCA9IG51bGw7XG5cbiAgICB0aGlzLmRpdiA9IHRoaXMuY3JlYXRlV2luZG93KHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgdGhpcy50b29sYmFyID0gdGhpcy5kaXYucXVlcnlTZWxlY3RvcihcIi50b29sYmFyXCIpO1xuICAgIHRoaXMuY2xvc2VXaW5kb3cgPSB0aGlzLmRpdi5xdWVyeVNlbGVjdG9yKFwiLmNsb3NlLXdpbmRvd1wiKTtcblxuICAgIHRoaXMuYXBwQ29udGFpbmVyID0gdGhpcy5kaXYucXVlcnlTZWxlY3RvcihcIi5hcHAtY29udGFpbmVyXCIpO1xufVxuXG5BcHBXaW5kb3cucHJvdG90eXBlLmNyZWF0ZVdpbmRvdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjd2luZG93LXRlbXBsYXRlXCIpO1xuICAgIHJldHVybiBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLXdpbmRvd1wiKTtcbn07XG5cbkFwcFdpbmRvdy5wcm90b3R5cGUuYXR0YWNoQXBwID0gZnVuY3Rpb24oYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG5cbiAgICB3aGlsZSAodGhpcy5hcHBDb250YWluZXIuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIHRoaXMuYXBwQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuYXBwQ29udGFpbmVyLmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmFwcENvbnRhaW5lci5hcHBlbmRDaGlsZChhcHAuZ2V0QXBwQ29udGVudCgpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwV2luZG93O1xuIiwiLyoqXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKi9cblxuZnVuY3Rpb24gQ2hhdCh1c2VybmFtZSkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLmxhc3RMaW5lcyA9IFtdO1xuXG4gICAgLy8gQXR0ZW1wdCB0byByZXRyaWV2ZSBzdG9yZWQgdXNlcm5hbWUuIElmIHRoaXMgZmFpbHMsIGl0IGlzIGhhbmRsZWQgaW4gY3JlYXRlQXBwQ29udGVudC5cbiAgICB0aGlzLnVzZXJuYW1lID0gdXNlcm5hbWU7XG4gICAgdGhpcy5hcHBDb250ZW50ID0gdGhpcy5jcmVhdGVBcHBDb250ZW50KCk7XG4gICAgdGhpcy5jaGF0TGluZXMgPSB0aGlzLmFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5jaGF0LWxpbmVzXCIpO1xuICAgIHRoaXMuYXBpS2V5ID0gXCJlREJFNzZkZVU3TDBIOW1FQmd4VUtWUjBWQ25xMFhCZFwiO1xuICAgIHRoaXMuc29ja2V0ID0gbmV3IFdlYlNvY2tldChcIndzOi8vdmhvc3QzLmxudS5zZToyMDA4MC9zb2NrZXQvXCIpO1xuXG4gICAgLy8gVE9ETzogTWFrZSBzdXJlIHRoZSBzb2NrZXQgb3BlbnMgYmVmb3JlIHRoZSB1c2VyIGNhbiBzZW5kIG1lc3NhZ2VzXG5cbiAgICB0aGlzLnNvY2tldC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBjb25zb2xlLmxvZyhldmVudC5kYXRhKTtcblxuICAgICAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG5cbiAgICAgICAgaWYgKG1lc3NhZ2UudHlwZSAhPSBcImhlYXJ0YmVhdFwiKSB7XG4gICAgICAgICAgICBfdGhpcy5hcHBlbmRMaW5lKG1lc3NhZ2UudXNlcm5hbWUsIG1lc3NhZ2UuZGF0YSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuQ2hhdC5wcm90b3R5cGUuY3JlYXRlQXBwQ29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFRPRE86IGJldHRlciB3YXkgb2YgZG9pbmcgdGhpcyB0aGFuIHRlbXBsYXRlcz9cbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NoYXQtdGVtcGxhdGVcIik7XG5cbiAgICB2YXIgYXBwQ29udGVudCA9IGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5hcHAtY29udGVudFwiKTtcblxuICAgIHRoaXMuYXR0YWNoRXZlbnRMaXN0ZW5lcnMoYXBwQ29udGVudCk7XG5cbiAgICByZXR1cm4gYXBwQ29udGVudDtcbn07XG5cbkNoYXQucHJvdG90eXBlLmF0dGFjaEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24oYXBwQ29udGVudCkge1xuICAgIHZhciBjaGF0Rm9ybSA9IGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5jaGF0LWZvcm1cIik7XG5cbiAgICBjaGF0Rm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIHRoaXMuc3VibWl0Q2hhdEZvcm0uYmluZCh0aGlzKSk7XG59O1xuXG5DaGF0LnByb3RvdHlwZS5zdWJtaXRDaGF0Rm9ybSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHRoaXMuc2VuZE1lc3NhZ2UoZXZlbnQudGFyZ2V0LmVsZW1lbnRzWzBdLnZhbHVlKTtcblxuICAgIGV2ZW50LnRhcmdldC5lbGVtZW50c1swXS52YWx1ZSA9IFwiXCI7XG59O1xuXG5DaGF0LnByb3RvdHlwZS5hcHBlbmRMaW5lID0gZnVuY3Rpb24odXNlcm5hbWUsIGxpbmUpIHtcbiAgICB0aGlzLmxhc3RMaW5lcy5wdXNoKHt1c2VybmFtZTogdXNlcm5hbWUsIGxpbmU6IGxpbmV9KTtcbiAgICBpZiAodGhpcy5sYXN0TGluZXMubGVuZ3RoID4gMjApIHtcbiAgICAgICAgdGhpcy5sYXN0TGluZXMuc2hpZnQoKTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnZlcnRMaW5lc1RvSFRNTCgpO1xufTtcblxuQ2hhdC5wcm90b3R5cGUuY29udmVydExpbmVzVG9IVE1MID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2NoYXQtbGluZS10ZW1wbGF0ZVwiKTtcbiAgICB2YXIgY2hhdExpbmUgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1tZXNzYWdlXCIpO1xuXG4gICAgd2hpbGUgKHRoaXMuY2hhdExpbmVzLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICB0aGlzLmNoYXRMaW5lcy5yZW1vdmVDaGlsZCh0aGlzLmNoYXRMaW5lcy5maXJzdEVsZW1lbnRDaGlsZCk7XG4gICAgfVxuXG4gICAgdGhpcy5sYXN0TGluZXMuZm9yRWFjaChmdW5jdGlvbihsaW5lLCBpbmRleCkge1xuICAgICAgICB2YXIgb3JkZXIgPSBfdGhpcy5sYXN0TGluZXMubGVuZ3RoIC0gaW5kZXg7XG4gICAgICAgIHZhciBuZXdMaW5lID0gY2hhdExpbmUuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICBuZXdMaW5lLnF1ZXJ5U2VsZWN0b3IoXCIudXNlcm5hbWVcIikudGV4dENvbnRlbnQgPSBsaW5lLnVzZXJuYW1lO1xuICAgICAgICBuZXdMaW5lLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1saW5lXCIpLnRleHRDb250ZW50ID0gbGluZS5saW5lO1xuXG4gICAgICAgIG5ld0xpbmUuc3R5bGUub3JkZXIgPSBvcmRlcjtcblxuICAgICAgICBfdGhpcy5jaGF0TGluZXMuYXBwZW5kQ2hpbGQobmV3TGluZSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnB1Ymxpc2hNZXNzYWdlcygpO1xufTtcblxuQ2hhdC5wcm90b3R5cGUucHVibGlzaE1lc3NhZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoO1xuXG4gICAgZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2hhdFwiKSwgZnVuY3Rpb24oY2hhdFdpbikge1xuICAgICAgICB2YXIgbmV3Q2hhdCA9IF90aGlzLmNoYXRMaW5lcy5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgY2hhdFdpbi5yZW1vdmVDaGlsZChjaGF0V2luLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1saW5lc1wiKSk7XG5cbiAgICAgICAgY2hhdFdpbi5pbnNlcnRCZWZvcmUobmV3Q2hhdCwgY2hhdFdpbi5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtZm9ybVwiKSk7XG4gICAgfSk7XG59O1xuXG5DaGF0LnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICB2YXIgZGF0YSA9IHt9O1xuXG4gICAgZGF0YS51c2VybmFtZSA9IHRoaXMudXNlcm5hbWU7XG4gICAgZGF0YS5kYXRhID0gbWVzc2FnZTtcbiAgICBkYXRhLmtleSA9IHRoaXMuYXBpS2V5O1xuICAgIGRhdGEudHlwZSA9IFwibWVzc2FnZVwiO1xuXG4gICAgLy90aGlzLnNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcblxuICAgIC8vIG9mZmxpbmUgY2FwYWJpbGl0aWVzIFRPRE86IHVzZSB0aGlzIGFzIGEgZmFsbGJhY2s/XG4gICAgdGhpcy5hcHBlbmRMaW5lKHRoaXMudXNlcm5hbWUsIG1lc3NhZ2UpO1xufTtcblxuQ2hhdC5wcm90b3R5cGUuZ2V0QXBwQ29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIENsb25pbmcgZG9lcyBub3QgYXR0YWNoIGV2ZW50IGxpc3RlbmVycywgc28gd2UgaGF2ZSB0byBkbyBpdCBhZnRlcndhcmRzXG5cbiAgICB2YXIgY29udGVudCA9IHRoaXMuYXBwQ29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKGNvbnRlbnQpO1xuXG4gICAgcmV0dXJuIGNvbnRlbnQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENoYXQ7XG4iLCJ2YXIgQXBwV2luZG93ID0gcmVxdWlyZShcIi4vQXBwV2luZG93XCIpO1xuXG4vKipcbiAqIERlc2t0b3Agb2JqZWN0IHdoaWNoIGNvbnRhaW5zIGFsbCB0aGUgQXBwV2luZG93IG9iamVjdHMgYWxvbmcgd2l0aCBzZXR0aW5ncy5cbiAqL1xuZnVuY3Rpb24gRGVza3RvcCgpIHtcbiAgICB0aGlzLndpbmRvd3MgPSBbXTtcblxuICAgIHRoaXMudXNlcm5hbWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInVzZXJuYW1lXCIpO1xuXG4gICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3dpbmRvd19jb250YWluZXJcIik7XG5cbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiYXp1cmVcIixcbiAgICAgICAgd2lkdGg6IDIwMCxcbiAgICAgICAgaGVpZ2h0OiAzMDBcbiAgICB9O1xuXG4gICAgLy8gVGhlIG9iamVjdCB0aGF0IGNvbnRhaW5zIGFwcHMgdGhhdCBzaG91bGQgb25seSBoYXZlIG9uZSBpbnN0YW5jZSBhY3Jvc3MgdGhlIGRlc2t0b3AgKGUuZy4gY2hhdCkuXG4gICAgdGhpcy5pbnN0YW5jZXMgPSB7XG5cbiAgICB9O1xuXG4gICAgdGhpcy5tb3ZpbmdXaW5kb3cgPSBudWxsO1xuICAgIHRoaXMudG9wWkluZGV4ID0gMTtcblxuICAgIHRoaXMuZGlzdGFuY2UgPSB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDBcbiAgICB9O1xuXG4gICAgdGhpcy5tb3VzZVBvcyA9IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgIH07XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMubW92ZVdpbmRvdy5iaW5kKHRoaXMpKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb3ZpbmdXaW5kb3cgPSBudWxsO1xuICAgIH0uYmluZCh0aGlzKSk7XG59XG5cbkRlc2t0b3AucHJvdG90eXBlLmF0dGFjaFdpbmRvdyA9IGZ1bmN0aW9uKGFwcCkge1xuICAgIHZhciBhcHBXaW5kb3cgPSBuZXcgQXBwV2luZG93KCk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGVyZSBhcmUgYW55IHdpbmRvd3MgaW4gdGhlIGRlc2t0b3AuIElmIHNvLCBjaGFuZ2UgaXRzIHBvc2l0aW9uLlxuICAgIGlmICh0aGlzLndpbmRvd3MubGVuZ3RoID49IDEpIHtcbiAgICAgICAgYXBwV2luZG93LmRpdi5zdHlsZS5sZWZ0ID0gKHRoaXMud2luZG93c1t0aGlzLndpbmRvd3MubGVuZ3RoIC0gMV0uZGl2Lm9mZnNldExlZnQgKyAyMCkgKyBcInB4XCI7XG4gICAgICAgIGFwcFdpbmRvdy5kaXYuc3R5bGUudG9wID0gKHRoaXMud2luZG93c1t0aGlzLndpbmRvd3MubGVuZ3RoIC0gMV0uZGl2Lm9mZnNldFRvcCArIDIwKSArIFwicHhcIjtcbiAgICB9XG5cbiAgICBhcHBXaW5kb3cuZGl2LnN0eWxlLnpJbmRleCA9IHRoaXMudG9wWkluZGV4O1xuICAgIHRoaXMudG9wWkluZGV4ICs9IDE7XG5cbiAgICAvLyBXZSBwdXNoIGl0IHRvIHRoZSBsaXN0IG9mIHdpbmRvd3MgZmlyc3QsIHNvIHRoYXQgd2Uga25vdyB0aGUgYXBwIHdpbmRvdydzIGluZGV4IGluIHRoZSBhcnJheVxuICAgIHRoaXMud2luZG93cy5wdXNoKGFwcFdpbmRvdyk7XG5cbiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKGFwcFdpbmRvdyk7XG5cbiAgICBpZiAoYXBwKSB7XG4gICAgICAgIGFwcFdpbmRvdy5hdHRhY2hBcHAoYXBwKTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZChhcHBXaW5kb3cuZGl2KTtcbn07XG5cbkRlc2t0b3AucHJvdG90eXBlLmF0dGFjaEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24oYXBwV2luZG93KSB7XG5cbiAgICAvLyBBdHRhY2hlcyB0aGUgZXZlbnQgbGlzdGVuZXIgdGhhdCBnaXZlcyB0aGUgYXBwIHdpbmRvdyBmb2N1c1xuICAgIGFwcFdpbmRvdy5kaXYuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB0aGlzLmdpdmVGb2N1cy5iaW5kKHRoaXMpKTtcblxuICAgIC8vIEF0dGFjaGVzIHRoZSBldmVudCBsaXN0ZW5lciB0aGF0IHN0YXJ0cyBtb3ZpbmcgdGhlIHdpbmRvd1xuICAgIGFwcFdpbmRvdy50b29sYmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgdGhpcy5zdGFydE1vdmUuYmluZCh0aGlzKSk7XG5cbiAgICAvLyBBdHRhY2hlcyB0aGUgZXZlbnQgbGlzdGVuZXIgdGhhdCBjbG9zZXMgdGhlIHdpbmRvdyBhbmQgcmVtb3ZlcyBpdCBmcm9tIHRoZSBsaXN0IG9mIHdpbmRvd3MuXG4gICAgYXBwV2luZG93LmNsb3NlV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQoYXBwV2luZG93LmRpdik7XG4gICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UodGhpcy53aW5kb3dzLmluZGV4T2YoYXBwV2luZG93KSwgMSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbkRlc2t0b3AucHJvdG90eXBlLmdpdmVGb2N1cyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaWYgKHBhcnNlSW50KGV2ZW50LmN1cnJlbnRUYXJnZXQuc3R5bGUuekluZGV4LCAxMCkgIT09IHRoaXMudG9wWkluZGV4IC0gMSkge1xuICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0LnN0eWxlLnpJbmRleCA9IHRoaXMudG9wWkluZGV4O1xuICAgICAgICB0aGlzLnRvcFpJbmRleCArPSAxO1xuICAgIH1cblxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xufTtcblxuRGVza3RvcC5wcm90b3R5cGUubW92ZVdpbmRvdyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdGhpcy5tb3VzZVBvcy54ID0gZXZlbnQuY2xpZW50WCAtIHRoaXMuY29udGFpbmVyLm9mZnNldExlZnQ7XG4gICAgdGhpcy5tb3VzZVBvcy55ID0gZXZlbnQuY2xpZW50WSAtIHRoaXMuY29udGFpbmVyLm9mZnNldFRvcDtcblxuICAgIGlmICh0aGlzLm1vdmluZ1dpbmRvdykge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHRoaXMubW92aW5nV2luZG93LnN0eWxlLnRvcCA9ICB0aGlzLm1vdXNlUG9zLnkgLSB0aGlzLmRpc3RhbmNlLnkgKyBcInB4XCI7XG4gICAgICAgIHRoaXMubW92aW5nV2luZG93LnN0eWxlLmxlZnQgPSAgdGhpcy5tb3VzZVBvcy54IC0gdGhpcy5kaXN0YW5jZS54ICsgXCJweFwiO1xuXG4gICAgICAgIC8vIFByZXZlbnQgdGhlIHdpbmRvdyBmcm9tIG1vdmluZyBvZmYgdGhlIHRvcCBvZiB0aGUgZGVza3RvcC4gT3RoZXIgZGlyZWN0aW9ucyBhcmUgZmluZSxcbiAgICAgICAgLy8ganVzdCBsaWtlIGluIGEgcmVhbCBvcGVyYXRpbmcgc3lzdGVtIVxuICAgICAgICBpZiAodGhpcy5tb3ZpbmdXaW5kb3cub2Zmc2V0VG9wIDwgMCkge1xuICAgICAgICAgICAgdGhpcy5tb3ZpbmdXaW5kb3cuc3R5bGUudG9wID0gMDtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkRlc2t0b3AucHJvdG90eXBlLnN0YXJ0TW92ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdGhpcy5tb3ZpbmdXaW5kb3cgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcblxuICAgIHRoaXMuZGlzdGFuY2UueCA9IHRoaXMubW91c2VQb3MueCAtIGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLm9mZnNldExlZnQ7XG4gICAgdGhpcy5kaXN0YW5jZS55ID0gdGhpcy5tb3VzZVBvcy55IC0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUub2Zmc2V0VG9wO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZXNrdG9wO1xuIiwiZnVuY3Rpb24gTWVtb3J5KGJvYXJkWCwgYm9hcmRZKSB7XG4gICAgLy8gVE9ETzogd2hlcmUgc2hvdWxkIEkgaGFuZGxlIGxlZ2FsL2lsbGVnYWwgYm9hcmQgc2l6ZXM/XG5cbiAgICB0aGlzLmJvYXJkWCA9IGJvYXJkWCB8fCA0O1xuICAgIHRoaXMuYm9hcmRZID0gYm9hcmRZIHx8IDQ7XG4gICAgdGhpcy50b3RhbEJyaWNrcyA9IDA7XG4gICAgdGhpcy5yZW1vdmVkQnJpY2tzID0gMDtcbiAgICB0aGlzLm1vdmVzID0gMDtcbiAgICB0aGlzLmJvYXJkID0gbnVsbDtcbiAgICB0aGlzLmluZm8gPSBudWxsO1xuICAgIHRoaXMuYnJpY2tzID0gW107XG4gICAgdGhpcy5ib3VuZFJldmVhbCA9IHRoaXMucmV2ZWFsQnJpY2suYmluZCh0aGlzKTtcblxuICAgIHRoaXMuc2VsZWN0ZWRCcmljayA9IG51bGw7XG5cbiAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnQoKTtcbn1cblxuTWVtb3J5LnByb3RvdHlwZS5jcmVhdGVBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNtZW1vcnktdGVtcGxhdGVcIik7XG4gICAgdmFyIGFwcENvbnRlbnQgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG5cbiAgICB0aGlzLmJvYXJkID0gYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmJvYXJkXCIpO1xuICAgIHRoaXMuaW5mbyA9IGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5pbmZvXCIpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZUJvYXJkKCk7XG5cbiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKGFwcENvbnRlbnQpO1xuXG4gICAgcmV0dXJuIGFwcENvbnRlbnQ7XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLmF0dGFjaEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24oYXBwQ29udGVudCkge1xuICAgIHZhciBib2FyZCA9IGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5ib2FyZFwiKTtcbiAgICB2YXIgbmV3R2FtZSA9IGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5uZXctZ2FtZVwiKTtcblxuICAgIGJvYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmJvdW5kUmV2ZWFsKTtcbiAgICBuZXdHYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgdGhpcy5uZXdHYW1lLmJpbmQodGhpcykpO1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5uZXdHYW1lID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdmFyIG5ld0JvYXJkWCA9IGV2ZW50LnRhcmdldC5lbGVtZW50c1sxXS52YWx1ZTtcbiAgICB2YXIgbmV3Qm9hcmRZID0gZXZlbnQudGFyZ2V0LmVsZW1lbnRzWzJdLnZhbHVlO1xuXG4gICAgaWYgKGlzTmFOKG5ld0JvYXJkWCkgfHwgaXNOYU4obmV3Qm9hcmRZKSkge1xuICAgICAgICB0aGlzLmluZm8udGV4dENvbnRlbnQgPSBcIlBsZWFzZSBlbnRlciBvbmx5IG51bWJlcnMuXCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobmV3Qm9hcmRYIDwgMiB8fCBuZXdCb2FyZFggPiAxMCB8fCBuZXdCb2FyZFkgPCAyIHx8IG5ld0JvYXJkWSA+IDEwKSB7XG4gICAgICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiUGxlYXNlIGVudGVyIG51bWJlcnMgYmV0d2VlbiAyIGFuZCAxMC5cIjtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICgobmV3Qm9hcmRYICogbmV3Qm9hcmRZKSAlIDIgIT09IDApIHtcbiAgICAgICAgdGhpcy5pbmZvLnRleHRDb250ZW50ID0gXCJUaGUgYW1vdW50IG9mIGJyaWNrcyBtdXN0IGJlIGV2ZW4uXCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmJvYXJkWCA9IG5ld0JvYXJkWDtcbiAgICB0aGlzLmJvYXJkWSA9IG5ld0JvYXJkWTtcblxuICAgIHdoaWxlICh0aGlzLmJvYXJkLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICB0aGlzLmJvYXJkLnJlbW92ZUNoaWxkKHRoaXMuYm9hcmQuZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiXCI7XG5cbiAgICB0aGlzLmluaXRpYWxpemVCb2FyZCgpO1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5pbml0aWFsaXplQm9hcmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5ib2FyZC5zdHlsZS53aWR0aCA9ICg0OCAqIHRoaXMuYm9hcmRYKSArIFwicHhcIjtcbiAgICB0aGlzLmJvYXJkLnN0eWxlLmhlaWdodCA9ICg0OCAqIHRoaXMuYm9hcmRZKSArIFwicHhcIjtcblxuICAgIHRoaXMudG90YWxCcmlja3MgPSB0aGlzLmJvYXJkWCAqIHRoaXMuYm9hcmRZO1xuICAgIHRoaXMucmVtb3ZlZEJyaWNrcyA9IDA7XG4gICAgdGhpcy5tb3ZlcyA9IDA7XG4gICAgdGhpcy5icmlja3MgPSBbXTtcblxuICAgIHZhciBpO1xuICAgIHZhciBjb3VudCA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMudG90YWxCcmlja3M7IGkgKz0gMikge1xuICAgICAgICB0aGlzLmJyaWNrc1tpXSA9IGNvdW50ICUgODtcbiAgICAgICAgdGhpcy5icmlja3NbaSArIDFdID0gY291bnQgJSA4O1xuICAgICAgICBjb3VudCA9IGNvdW50ID09IDcgPyBjb3VudCA9IDAgOiBjb3VudCArPSAxO1xuICAgIH1cblxuICAgIC8vIEZpc2hlci1ZYXRlc1xuICAgIGZvciAoaSA9IHRoaXMudG90YWxCcmlja3MgLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIHZhciBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkgKyAxKSk7XG4gICAgICAgIHZhciBrID0gdGhpcy5icmlja3Nbal07XG4gICAgICAgIHRoaXMuYnJpY2tzW2pdID0gdGhpcy5icmlja3NbaV07XG4gICAgICAgIHRoaXMuYnJpY2tzW2ldID0gaztcbiAgICB9XG5cbiAgICB0aGlzLmJyaWNrcy5mb3JFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYnJpY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgICAgICBicmljay5jbGFzc0xpc3QuYWRkKFwibWVtb3J5LWJyaWNrXCIpO1xuICAgICAgICBicmljay5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvaGlkZGVuLnBuZ1wiKTtcblxuICAgICAgICBfdGhpcy5ib2FyZC5hcHBlbmRDaGlsZChicmljayk7XG4gICAgfSk7XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLnJldmVhbEJyaWNrID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgYnJpY2sgPSBldmVudC50YXJnZXQ7XG4gICAgdmFyIHBhcmVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XG5cbiAgICBpZiAodGhpcy5zZWxlY3RlZEJyaWNrICYmIGJyaWNrID09PSB0aGlzLnNlbGVjdGVkQnJpY2suYnJpY2tFbGVtKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoYnJpY2sgPT09IHBhcmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChwYXJlbnQuY2hpbGRyZW4sIGJyaWNrKTtcblxuICAgIGJyaWNrLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9cIiArIHRoaXMuYnJpY2tzW2luZGV4XSArIFwiLnBuZ1wiKTtcblxuICAgIGlmICghdGhpcy5zZWxlY3RlZEJyaWNrKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRCcmljayA9IHticmlja0VsZW06IGJyaWNrLCB2YWx1ZTogdGhpcy5icmlja3NbaW5kZXhdfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNoZWNrTWF0Y2goe2JyaWNrRWxlbTogYnJpY2ssIHZhbHVlOiB0aGlzLmJyaWNrc1tpbmRleF19KVxuICAgIH1cbn07XG5cbk1lbW9yeS5wcm90b3R5cGUuY2hlY2tNYXRjaCA9IGZ1bmN0aW9uKGJyaWNrKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuYm9hcmQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuYm91bmRSZXZlYWwpO1xuXG4gICAgaWYgKGJyaWNrLnZhbHVlID09PSB0aGlzLnNlbGVjdGVkQnJpY2sudmFsdWUpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJyaWNrLmJyaWNrRWxlbS5jbGFzc0xpc3QuYWRkKFwicmVtb3ZlZFwiKTtcbiAgICAgICAgICAgIF90aGlzLnNlbGVjdGVkQnJpY2suYnJpY2tFbGVtLmNsYXNzTGlzdC5hZGQoXCJyZW1vdmVkXCIpO1xuXG4gICAgICAgICAgICBfdGhpcy5yZW1vdmVkQnJpY2tzICs9IDI7XG5cbiAgICAgICAgICAgIF90aGlzLnNlbGVjdGVkQnJpY2sgPSBudWxsO1xuICAgICAgICAgICAgX3RoaXMuYm9hcmQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIF90aGlzLmJvdW5kUmV2ZWFsKTtcblxuICAgICAgICAgICAgaWYgKF90aGlzLnJlbW92ZWRCcmlja3MgPT09IF90aGlzLnRvdGFsQnJpY2tzKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuZW5kR2FtZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxMDAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYnJpY2suYnJpY2tFbGVtLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9oaWRkZW4ucG5nXCIpO1xuICAgICAgICAgICAgX3RoaXMuc2VsZWN0ZWRCcmljay5icmlja0VsZW0uc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiL2ltYWdlL2hpZGRlbi5wbmdcIik7XG5cbiAgICAgICAgICAgIF90aGlzLnNlbGVjdGVkQnJpY2sgPSBudWxsO1xuICAgICAgICAgICAgX3RoaXMuYm9hcmQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIF90aGlzLmJvdW5kUmV2ZWFsKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxuXG4gICAgdGhpcy5tb3ZlcyArPSAxO1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5lbmRHYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pbmZvLnRleHRDb250ZW50ID0gXCJZb3Ugd29uISBNb3ZlcyB0YWtlbjogXCIgKyB0aGlzLm1vdmVzO1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5nZXRBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuYXBwQ29udGVudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTWVtb3J5O1xuIiwiLy8gQXBwIGNvbnRyb2xzIHRoZSBVSSBhbmQgaXMgcmVzcG9uc2libGUgZm9yIGNyZWF0aW5nIG5ldyBhcHAgaW5zdGFuY2VzLiBBZGRpbmcgbmV3IGFwcHNcbi8vIHRvIHRoZSBQZXJzb25hbCBXZWIgRGVza3RvcCBzaG91bGQgYmUgYXMgZWFzeSBhcyBpbXBvcnRpbmcgaXQgaW4gYXBwLmpzIGFuZCBjcmVhdGluZyBpdC5cblxuLy8gVGhlIGFwcHMgZm9sbG93IHRoZSBzYW1lIHN0cnVjdHVyZTpcbi8vIFRoZXkgYWxsIGNvbnRhaW4gYSBmdW5jdGlvbiBjYWxsZWQgZ2V0QXBwQ29udGVudCwgd2hpY2ggcmV0dXJucyB0aGUgZGl2IHRoYXQgbmVlZHMgdG9cbi8vIGJlIGF0dGFjaGVkIHRvIHRoZSBhcHAgd2luZG93J3MgYXBwIGNvbnRhaW5lci4gRm9yIGFwcHNcblxuKGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgZGVza3RvcC5cbiAgICB2YXIgRGVza3RvcCA9IHJlcXVpcmUoXCIuL0Rlc2t0b3BcIik7XG4gICAgdmFyIGRlc2t0b3AgPSBuZXcgRGVza3RvcCgpO1xuXG4gICAgLy8gSW1wb3J0IHRoZSBuZWNlc3NhcnkgYXBwcy5cbiAgICB2YXIgTWVtb3J5ID0gcmVxdWlyZShcIi4vTWVtb3J5XCIpO1xuICAgIHZhciBDaGF0ID0gcmVxdWlyZShcIi4vQ2hhdFwiKTtcblxuICAgIHZhciBuZXdXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld193aW5kb3dcIik7XG4gICAgdmFyIG5ld0NoYXRXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19jaGF0XCIpO1xuICAgIHZhciBuZXdNZW1vcnlXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19tZW1vcnlcIik7XG5cbiAgICBuZXdXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICBkZXNrdG9wLmF0dGFjaFdpbmRvdygpO1xuICAgIH0pO1xuXG4gICAgbmV3Q2hhdFdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghZGVza3RvcC5pbnN0YW5jZXMuY2hhdCkge1xuICAgICAgICAgICAgaWYgKCFkZXNrdG9wLnVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVzZXIgPSBwcm9tcHQoXCJQbGVhc2UgZW50ZXIgYSB1c2VybmFtZTpcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInVzZXJuYW1lXCIsIHVzZXIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGRlc2t0b3AudXNlcm5hbWUgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlc2t0b3AuaW5zdGFuY2VzLmNoYXQgPSBuZXcgQ2hhdChkZXNrdG9wLnVzZXJuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlc2t0b3AuYXR0YWNoV2luZG93KGRlc2t0b3AuaW5zdGFuY2VzLmNoYXQpO1xuICAgIH0pO1xuXG4gICAgbmV3TWVtb3J5V2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZGVza3RvcC5hdHRhY2hXaW5kb3cobmV3IE1lbW9yeSg0LCA0KSk7XG4gICAgfSk7XG59KSgpO1xuIl19
