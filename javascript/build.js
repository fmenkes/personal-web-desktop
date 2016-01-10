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

    this.defaultTitle = document.title;
    this.username = username;
    this.appContent = this.createAppContent();
    this.chatLines = this.appContent.querySelector(".chat-lines");
    this.apiKey = "eDBE76deU7L0H9mEBgxUKVR0VCnq0XBd";
    this.socket = new WebSocket("ws://vhost3.lnu.se:20080/socket/");

    document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this));

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

    appContent.querySelector("textarea").focus();

    this.attachEventListeners(appContent);

    return appContent;
};

Chat.prototype.attachEventListeners = function(appContent) {
    var chatForm = appContent.querySelector(".chat-form");
    var textArea = chatForm.querySelector("textarea");

    textArea.addEventListener("keydown", this.handleTextInput.bind(this));
    //textArea.addEventListener("focus", this.handleFocus.bind(this));
};

Chat.prototype.handleTextInput = function(event) {
    if (!event.shiftKey && event.keyCode === 13) {
        event.preventDefault();

        this.sendMessage(event.target.value);

        event.target.value = "";
    }
};

Chat.prototype.handleVisibilityChange = function() {
    if (!document.hidden) {
        document.title = this.defaultTitle;
    }
};

Chat.prototype.appendLine = function(username, line) {
    this.lastLines.push({username: username, line: line});

    if (this.lastLines.length > 20) {
        this.lastLines.shift();
    }

    if (document.hidden) {
        var audio = this.appContent.querySelector("audio");

        audio.play();

        document.title = "* " + this.defaultTitle;
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

    this.socket.send(JSON.stringify(data));

    // offline capabilities TODO: use this as a fallback?
    //this.appendLine(this.username, message);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQXBwV2luZG93LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9DaGF0LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9EZXNrdG9wLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9NZW1vcnkuanMiLCJjbGllbnQvc291cmNlL2pzL2FwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImZ1bmN0aW9uIEFwcFdpbmRvdyh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdGhpcy5hcHAgPSBudWxsO1xuXG4gICAgdGhpcy5kaXYgPSB0aGlzLmNyZWF0ZVdpbmRvdyh3aWR0aCwgaGVpZ2h0KTtcblxuICAgIHRoaXMudG9vbGJhciA9IHRoaXMuZGl2LnF1ZXJ5U2VsZWN0b3IoXCIudG9vbGJhclwiKTtcbiAgICB0aGlzLmNsb3NlV2luZG93ID0gdGhpcy5kaXYucXVlcnlTZWxlY3RvcihcIi5jbG9zZS13aW5kb3dcIik7XG5cbiAgICB0aGlzLmFwcENvbnRhaW5lciA9IHRoaXMuZGl2LnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRhaW5lclwiKTtcbn1cblxuQXBwV2luZG93LnByb3RvdHlwZS5jcmVhdGVXaW5kb3cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3dpbmRvdy10ZW1wbGF0ZVwiKTtcbiAgICByZXR1cm4gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC13aW5kb3dcIik7XG59O1xuXG5BcHBXaW5kb3cucHJvdG90eXBlLmF0dGFjaEFwcCA9IGZ1bmN0aW9uKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuXG4gICAgd2hpbGUgKHRoaXMuYXBwQ29udGFpbmVyLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICB0aGlzLmFwcENvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLmFwcENvbnRhaW5lci5maXJzdEVsZW1lbnRDaGlsZCk7XG4gICAgfVxuXG4gICAgdGhpcy5hcHBDb250YWluZXIuYXBwZW5kQ2hpbGQoYXBwLmdldEFwcENvbnRlbnQoKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcFdpbmRvdztcbiIsIi8qKlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5cbmZ1bmN0aW9uIENoYXQodXNlcm5hbWUpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5sYXN0TGluZXMgPSBbXTtcblxuICAgIHRoaXMuZGVmYXVsdFRpdGxlID0gZG9jdW1lbnQudGl0bGU7XG4gICAgdGhpcy51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgIHRoaXMuYXBwQ29udGVudCA9IHRoaXMuY3JlYXRlQXBwQ29udGVudCgpO1xuICAgIHRoaXMuY2hhdExpbmVzID0gdGhpcy5hcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1saW5lc1wiKTtcbiAgICB0aGlzLmFwaUtleSA9IFwiZURCRTc2ZGVVN0wwSDltRUJneFVLVlIwVkNucTBYQmRcIjtcbiAgICB0aGlzLnNvY2tldCA9IG5ldyBXZWJTb2NrZXQoXCJ3czovL3Zob3N0My5sbnUuc2U6MjAwODAvc29ja2V0L1wiKTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ2aXNpYmlsaXR5Y2hhbmdlXCIsIHRoaXMuaGFuZGxlVmlzaWJpbGl0eUNoYW5nZS5iaW5kKHRoaXMpKTtcblxuICAgIC8vIFRPRE86IE1ha2Ugc3VyZSB0aGUgc29ja2V0IG9wZW5zIGJlZm9yZSB0aGUgdXNlciBjYW4gc2VuZCBtZXNzYWdlc1xuXG4gICAgdGhpcy5zb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgY29uc29sZS5sb2coZXZlbnQuZGF0YSk7XG5cbiAgICAgICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuXG4gICAgICAgIGlmIChtZXNzYWdlLnR5cGUgIT0gXCJoZWFydGJlYXRcIikge1xuICAgICAgICAgICAgX3RoaXMuYXBwZW5kTGluZShtZXNzYWdlLnVzZXJuYW1lLCBtZXNzYWdlLmRhdGEpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbkNoYXQucHJvdG90eXBlLmNyZWF0ZUFwcENvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBUT0RPOiBiZXR0ZXIgd2F5IG9mIGRvaW5nIHRoaXMgdGhhbiB0ZW1wbGF0ZXM/XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjaGF0LXRlbXBsYXRlXCIpO1xuXG4gICAgdmFyIGFwcENvbnRlbnQgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG5cbiAgICBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCJ0ZXh0YXJlYVwiKS5mb2N1cygpO1xuXG4gICAgdGhpcy5hdHRhY2hFdmVudExpc3RlbmVycyhhcHBDb250ZW50KTtcblxuICAgIHJldHVybiBhcHBDb250ZW50O1xufTtcblxuQ2hhdC5wcm90b3R5cGUuYXR0YWNoRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbihhcHBDb250ZW50KSB7XG4gICAgdmFyIGNoYXRGb3JtID0gYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtZm9ybVwiKTtcbiAgICB2YXIgdGV4dEFyZWEgPSBjaGF0Rm9ybS5xdWVyeVNlbGVjdG9yKFwidGV4dGFyZWFcIik7XG5cbiAgICB0ZXh0QXJlYS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZVRleHRJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAvL3RleHRBcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCB0aGlzLmhhbmRsZUZvY3VzLmJpbmQodGhpcykpO1xufTtcblxuQ2hhdC5wcm90b3R5cGUuaGFuZGxlVGV4dElucHV0ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZiAoIWV2ZW50LnNoaWZ0S2V5ICYmIGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdGhpcy5zZW5kTWVzc2FnZShldmVudC50YXJnZXQudmFsdWUpO1xuXG4gICAgICAgIGV2ZW50LnRhcmdldC52YWx1ZSA9IFwiXCI7XG4gICAgfVxufTtcblxuQ2hhdC5wcm90b3R5cGUuaGFuZGxlVmlzaWJpbGl0eUNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghZG9jdW1lbnQuaGlkZGVuKSB7XG4gICAgICAgIGRvY3VtZW50LnRpdGxlID0gdGhpcy5kZWZhdWx0VGl0bGU7XG4gICAgfVxufTtcblxuQ2hhdC5wcm90b3R5cGUuYXBwZW5kTGluZSA9IGZ1bmN0aW9uKHVzZXJuYW1lLCBsaW5lKSB7XG4gICAgdGhpcy5sYXN0TGluZXMucHVzaCh7dXNlcm5hbWU6IHVzZXJuYW1lLCBsaW5lOiBsaW5lfSk7XG5cbiAgICBpZiAodGhpcy5sYXN0TGluZXMubGVuZ3RoID4gMjApIHtcbiAgICAgICAgdGhpcy5sYXN0TGluZXMuc2hpZnQoKTtcbiAgICB9XG5cbiAgICBpZiAoZG9jdW1lbnQuaGlkZGVuKSB7XG4gICAgICAgIHZhciBhdWRpbyA9IHRoaXMuYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiYXVkaW9cIik7XG5cbiAgICAgICAgYXVkaW8ucGxheSgpO1xuXG4gICAgICAgIGRvY3VtZW50LnRpdGxlID0gXCIqIFwiICsgdGhpcy5kZWZhdWx0VGl0bGU7XG4gICAgfVxuXG4gICAgdGhpcy5jb252ZXJ0TGluZXNUb0hUTUwoKTtcbn07XG5cbkNoYXQucHJvdG90eXBlLmNvbnZlcnRMaW5lc1RvSFRNTCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjaGF0LWxpbmUtdGVtcGxhdGVcIik7XG4gICAgdmFyIGNoYXRMaW5lID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtbWVzc2FnZVwiKTtcblxuICAgIHdoaWxlICh0aGlzLmNoYXRMaW5lcy5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5jaGF0TGluZXMucmVtb3ZlQ2hpbGQodGhpcy5jaGF0TGluZXMuZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIHRoaXMubGFzdExpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZSwgaW5kZXgpIHtcbiAgICAgICAgdmFyIG9yZGVyID0gX3RoaXMubGFzdExpbmVzLmxlbmd0aCAtIGluZGV4O1xuICAgICAgICB2YXIgbmV3TGluZSA9IGNoYXRMaW5lLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgbmV3TGluZS5xdWVyeVNlbGVjdG9yKFwiLnVzZXJuYW1lXCIpLnRleHRDb250ZW50ID0gbGluZS51c2VybmFtZTtcbiAgICAgICAgbmV3TGluZS5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtbGluZVwiKS50ZXh0Q29udGVudCA9IGxpbmUubGluZTtcblxuICAgICAgICBuZXdMaW5lLnN0eWxlLm9yZGVyID0gb3JkZXI7XG5cbiAgICAgICAgX3RoaXMuY2hhdExpbmVzLmFwcGVuZENoaWxkKG5ld0xpbmUpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5wdWJsaXNoTWVzc2FnZXMoKTtcbn07XG5cbkNoYXQucHJvdG90eXBlLnB1Ymxpc2hNZXNzYWdlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdmFyIGZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDtcblxuICAgIGZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmNoYXRcIiksIGZ1bmN0aW9uKGNoYXRXaW4pIHtcbiAgICAgICAgdmFyIG5ld0NoYXQgPSBfdGhpcy5jaGF0TGluZXMuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgICAgIGNoYXRXaW4ucmVtb3ZlQ2hpbGQoY2hhdFdpbi5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtbGluZXNcIikpO1xuXG4gICAgICAgIGNoYXRXaW4uaW5zZXJ0QmVmb3JlKG5ld0NoYXQsIGNoYXRXaW4ucXVlcnlTZWxlY3RvcihcIi5jaGF0LWZvcm1cIikpO1xuICAgIH0pO1xufTtcblxuQ2hhdC5wcm90b3R5cGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgdmFyIGRhdGEgPSB7fTtcblxuICAgIGRhdGEudXNlcm5hbWUgPSB0aGlzLnVzZXJuYW1lO1xuICAgIGRhdGEuZGF0YSA9IG1lc3NhZ2U7XG4gICAgZGF0YS5rZXkgPSB0aGlzLmFwaUtleTtcbiAgICBkYXRhLnR5cGUgPSBcIm1lc3NhZ2VcIjtcblxuICAgIHRoaXMuc29ja2V0LnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXG4gICAgLy8gb2ZmbGluZSBjYXBhYmlsaXRpZXMgVE9ETzogdXNlIHRoaXMgYXMgYSBmYWxsYmFjaz9cbiAgICAvL3RoaXMuYXBwZW5kTGluZSh0aGlzLnVzZXJuYW1lLCBtZXNzYWdlKTtcbn07XG5cbkNoYXQucHJvdG90eXBlLmdldEFwcENvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBDbG9uaW5nIGRvZXMgbm90IGF0dGFjaCBldmVudCBsaXN0ZW5lcnMsIHNvIHdlIGhhdmUgdG8gZG8gaXQgYWZ0ZXJ3YXJkc1xuXG4gICAgdmFyIGNvbnRlbnQgPSB0aGlzLmFwcENvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuXG4gICAgdGhpcy5hdHRhY2hFdmVudExpc3RlbmVycyhjb250ZW50KTtcblxuICAgIHJldHVybiBjb250ZW50O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGF0O1xuIiwidmFyIEFwcFdpbmRvdyA9IHJlcXVpcmUoXCIuL0FwcFdpbmRvd1wiKTtcblxuLyoqXG4gKiBEZXNrdG9wIG9iamVjdCB3aGljaCBjb250YWlucyBhbGwgdGhlIEFwcFdpbmRvdyBvYmplY3RzIGFsb25nIHdpdGggc2V0dGluZ3MuXG4gKi9cbmZ1bmN0aW9uIERlc2t0b3AoKSB7XG4gICAgdGhpcy53aW5kb3dzID0gW107XG5cbiAgICB0aGlzLnVzZXJuYW1lID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ1c2VybmFtZVwiKTtcblxuICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN3aW5kb3dfY29udGFpbmVyXCIpO1xuXG4gICAgdGhpcy5zZXR0aW5ncyA9IHtcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcImF6dXJlXCIsXG4gICAgICAgIHdpZHRoOiAyMDAsXG4gICAgICAgIGhlaWdodDogMzAwXG4gICAgfTtcblxuICAgIC8vIFRoZSBvYmplY3QgdGhhdCBjb250YWlucyBhcHBzIHRoYXQgc2hvdWxkIG9ubHkgaGF2ZSBvbmUgaW5zdGFuY2UgYWNyb3NzIHRoZSBkZXNrdG9wIChlLmcuIGNoYXQpLlxuICAgIHRoaXMuaW5zdGFuY2VzID0ge1xuXG4gICAgfTtcblxuICAgIHRoaXMubW92aW5nV2luZG93ID0gbnVsbDtcbiAgICB0aGlzLnRvcFpJbmRleCA9IDE7XG5cbiAgICB0aGlzLmRpc3RhbmNlID0ge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwXG4gICAgfTtcblxuICAgIHRoaXMubW91c2VQb3MgPSB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDBcbiAgICB9O1xuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLm1vdmVXaW5kb3cuYmluZCh0aGlzKSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubW92aW5nV2luZG93ID0gbnVsbDtcbiAgICB9LmJpbmQodGhpcykpO1xufVxuXG5EZXNrdG9wLnByb3RvdHlwZS5hdHRhY2hXaW5kb3cgPSBmdW5jdGlvbihhcHApIHtcbiAgICB2YXIgYXBwV2luZG93ID0gbmV3IEFwcFdpbmRvdygpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlcmUgYXJlIGFueSB3aW5kb3dzIGluIHRoZSBkZXNrdG9wLiBJZiBzbywgY2hhbmdlIGl0cyBwb3NpdGlvbi5cbiAgICBpZiAodGhpcy53aW5kb3dzLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgIGFwcFdpbmRvdy5kaXYuc3R5bGUubGVmdCA9ICh0aGlzLndpbmRvd3NbdGhpcy53aW5kb3dzLmxlbmd0aCAtIDFdLmRpdi5vZmZzZXRMZWZ0ICsgMjApICsgXCJweFwiO1xuICAgICAgICBhcHBXaW5kb3cuZGl2LnN0eWxlLnRvcCA9ICh0aGlzLndpbmRvd3NbdGhpcy53aW5kb3dzLmxlbmd0aCAtIDFdLmRpdi5vZmZzZXRUb3AgKyAyMCkgKyBcInB4XCI7XG4gICAgfVxuXG4gICAgYXBwV2luZG93LmRpdi5zdHlsZS56SW5kZXggPSB0aGlzLnRvcFpJbmRleDtcbiAgICB0aGlzLnRvcFpJbmRleCArPSAxO1xuXG4gICAgLy8gV2UgcHVzaCBpdCB0byB0aGUgbGlzdCBvZiB3aW5kb3dzIGZpcnN0LCBzbyB0aGF0IHdlIGtub3cgdGhlIGFwcCB3aW5kb3cncyBpbmRleCBpbiB0aGUgYXJyYXlcbiAgICB0aGlzLndpbmRvd3MucHVzaChhcHBXaW5kb3cpO1xuXG4gICAgdGhpcy5hdHRhY2hFdmVudExpc3RlbmVycyhhcHBXaW5kb3cpO1xuXG4gICAgaWYgKGFwcCkge1xuICAgICAgICBhcHBXaW5kb3cuYXR0YWNoQXBwKGFwcCk7XG4gICAgfVxuXG4gICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQoYXBwV2luZG93LmRpdik7XG59O1xuXG5EZXNrdG9wLnByb3RvdHlwZS5hdHRhY2hFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uKGFwcFdpbmRvdykge1xuXG4gICAgLy8gQXR0YWNoZXMgdGhlIGV2ZW50IGxpc3RlbmVyIHRoYXQgZ2l2ZXMgdGhlIGFwcCB3aW5kb3cgZm9jdXNcbiAgICBhcHBXaW5kb3cuZGl2LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgdGhpcy5naXZlRm9jdXMuYmluZCh0aGlzKSk7XG5cbiAgICAvLyBBdHRhY2hlcyB0aGUgZXZlbnQgbGlzdGVuZXIgdGhhdCBzdGFydHMgbW92aW5nIHRoZSB3aW5kb3dcbiAgICBhcHBXaW5kb3cudG9vbGJhci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMuc3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuXG4gICAgLy8gQXR0YWNoZXMgdGhlIGV2ZW50IGxpc3RlbmVyIHRoYXQgY2xvc2VzIHRoZSB3aW5kb3cgYW5kIHJlbW92ZXMgaXQgZnJvbSB0aGUgbGlzdCBvZiB3aW5kb3dzLlxuICAgIGFwcFdpbmRvdy5jbG9zZVdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLnJlbW92ZUNoaWxkKGFwcFdpbmRvdy5kaXYpO1xuICAgICAgICB0aGlzLndpbmRvd3Muc3BsaWNlKHRoaXMud2luZG93cy5pbmRleE9mKGFwcFdpbmRvdyksIDEpO1xuICAgIH0uYmluZCh0aGlzKSk7XG59O1xuXG5EZXNrdG9wLnByb3RvdHlwZS5naXZlRm9jdXMgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGlmIChwYXJzZUludChldmVudC5jdXJyZW50VGFyZ2V0LnN0eWxlLnpJbmRleCwgMTApICE9PSB0aGlzLnRvcFpJbmRleCAtIDEpIHtcbiAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5zdHlsZS56SW5kZXggPSB0aGlzLnRvcFpJbmRleDtcbiAgICAgICAgdGhpcy50b3BaSW5kZXggKz0gMTtcbiAgICB9XG5cbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbn07XG5cbkRlc2t0b3AucHJvdG90eXBlLm1vdmVXaW5kb3cgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHRoaXMubW91c2VQb3MueCA9IGV2ZW50LmNsaWVudFggLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRMZWZ0O1xuICAgIHRoaXMubW91c2VQb3MueSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRUb3A7XG5cbiAgICBpZiAodGhpcy5tb3ZpbmdXaW5kb3cpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB0aGlzLm1vdmluZ1dpbmRvdy5zdHlsZS50b3AgPSAgdGhpcy5tb3VzZVBvcy55IC0gdGhpcy5kaXN0YW5jZS55ICsgXCJweFwiO1xuICAgICAgICB0aGlzLm1vdmluZ1dpbmRvdy5zdHlsZS5sZWZ0ID0gIHRoaXMubW91c2VQb3MueCAtIHRoaXMuZGlzdGFuY2UueCArIFwicHhcIjtcblxuICAgICAgICAvLyBQcmV2ZW50IHRoZSB3aW5kb3cgZnJvbSBtb3Zpbmcgb2ZmIHRoZSB0b3Agb2YgdGhlIGRlc2t0b3AuIE90aGVyIGRpcmVjdGlvbnMgYXJlIGZpbmUsXG4gICAgICAgIC8vIGp1c3QgbGlrZSBpbiBhIHJlYWwgb3BlcmF0aW5nIHN5c3RlbSFcbiAgICAgICAgaWYgKHRoaXMubW92aW5nV2luZG93Lm9mZnNldFRvcCA8IDApIHtcbiAgICAgICAgICAgIHRoaXMubW92aW5nV2luZG93LnN0eWxlLnRvcCA9IDA7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5EZXNrdG9wLnByb3RvdHlwZS5zdGFydE1vdmUgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHRoaXMubW92aW5nV2luZG93ID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGU7XG5cbiAgICB0aGlzLmRpc3RhbmNlLnggPSB0aGlzLm1vdXNlUG9zLnggLSBldmVudC50YXJnZXQucGFyZW50Tm9kZS5vZmZzZXRMZWZ0O1xuICAgIHRoaXMuZGlzdGFuY2UueSA9IHRoaXMubW91c2VQb3MueSAtIGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLm9mZnNldFRvcDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRGVza3RvcDtcbiIsImZ1bmN0aW9uIE1lbW9yeShib2FyZFgsIGJvYXJkWSkge1xuICAgIC8vIFRPRE86IHdoZXJlIHNob3VsZCBJIGhhbmRsZSBsZWdhbC9pbGxlZ2FsIGJvYXJkIHNpemVzP1xuXG4gICAgdGhpcy5ib2FyZFggPSBib2FyZFggfHwgNDtcbiAgICB0aGlzLmJvYXJkWSA9IGJvYXJkWSB8fCA0O1xuICAgIHRoaXMudG90YWxCcmlja3MgPSAwO1xuICAgIHRoaXMucmVtb3ZlZEJyaWNrcyA9IDA7XG4gICAgdGhpcy5tb3ZlcyA9IDA7XG4gICAgdGhpcy5ib2FyZCA9IG51bGw7XG4gICAgdGhpcy5pbmZvID0gbnVsbDtcbiAgICB0aGlzLmJyaWNrcyA9IFtdO1xuICAgIHRoaXMuYm91bmRSZXZlYWwgPSB0aGlzLnJldmVhbEJyaWNrLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLnNlbGVjdGVkQnJpY2sgPSBudWxsO1xuXG4gICAgdGhpcy5hcHBDb250ZW50ID0gdGhpcy5jcmVhdGVBcHBDb250ZW50KCk7XG59XG5cbk1lbW9yeS5wcm90b3R5cGUuY3JlYXRlQXBwQ29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbWVtb3J5LXRlbXBsYXRlXCIpO1xuICAgIHZhciBhcHBDb250ZW50ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250ZW50XCIpO1xuXG4gICAgdGhpcy5ib2FyZCA9IGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5ib2FyZFwiKTtcbiAgICB0aGlzLmluZm8gPSBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIuaW5mb1wiKTtcbiAgICB0aGlzLmluaXRpYWxpemVCb2FyZCgpO1xuXG4gICAgdGhpcy5hdHRhY2hFdmVudExpc3RlbmVycyhhcHBDb250ZW50KTtcblxuICAgIHJldHVybiBhcHBDb250ZW50O1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5hdHRhY2hFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uKGFwcENvbnRlbnQpIHtcbiAgICB2YXIgYm9hcmQgPSBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIuYm9hcmRcIik7XG4gICAgdmFyIG5ld0dhbWUgPSBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIubmV3LWdhbWVcIik7XG5cbiAgICBib2FyZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5ib3VuZFJldmVhbCk7XG4gICAgbmV3R2FtZS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIHRoaXMubmV3R2FtZS5iaW5kKHRoaXMpKTtcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUubmV3R2FtZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciBuZXdCb2FyZFggPSBldmVudC50YXJnZXQuZWxlbWVudHNbMV0udmFsdWU7XG4gICAgdmFyIG5ld0JvYXJkWSA9IGV2ZW50LnRhcmdldC5lbGVtZW50c1syXS52YWx1ZTtcblxuICAgIGlmIChpc05hTihuZXdCb2FyZFgpIHx8IGlzTmFOKG5ld0JvYXJkWSkpIHtcbiAgICAgICAgdGhpcy5pbmZvLnRleHRDb250ZW50ID0gXCJQbGVhc2UgZW50ZXIgb25seSBudW1iZXJzLlwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG5ld0JvYXJkWCA8IDIgfHwgbmV3Qm9hcmRYID4gMTAgfHwgbmV3Qm9hcmRZIDwgMiB8fCBuZXdCb2FyZFkgPiAxMCkge1xuICAgICAgICB0aGlzLmluZm8udGV4dENvbnRlbnQgPSBcIlBsZWFzZSBlbnRlciBudW1iZXJzIGJldHdlZW4gMiBhbmQgMTAuXCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoKG5ld0JvYXJkWCAqIG5ld0JvYXJkWSkgJSAyICE9PSAwKSB7XG4gICAgICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiVGhlIGFtb3VudCBvZiBicmlja3MgbXVzdCBiZSBldmVuLlwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5ib2FyZFggPSBuZXdCb2FyZFg7XG4gICAgdGhpcy5ib2FyZFkgPSBuZXdCb2FyZFk7XG5cbiAgICB3aGlsZSAodGhpcy5ib2FyZC5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5ib2FyZC5yZW1vdmVDaGlsZCh0aGlzLmJvYXJkLmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmluZm8udGV4dENvbnRlbnQgPSBcIlwiO1xuXG4gICAgdGhpcy5pbml0aWFsaXplQm9hcmQoKTtcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUuaW5pdGlhbGl6ZUJvYXJkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuYm9hcmQuc3R5bGUud2lkdGggPSAoNDggKiB0aGlzLmJvYXJkWCkgKyBcInB4XCI7XG4gICAgdGhpcy5ib2FyZC5zdHlsZS5oZWlnaHQgPSAoNDggKiB0aGlzLmJvYXJkWSkgKyBcInB4XCI7XG5cbiAgICB0aGlzLnRvdGFsQnJpY2tzID0gdGhpcy5ib2FyZFggKiB0aGlzLmJvYXJkWTtcbiAgICB0aGlzLnJlbW92ZWRCcmlja3MgPSAwO1xuICAgIHRoaXMubW92ZXMgPSAwO1xuICAgIHRoaXMuYnJpY2tzID0gW107XG5cbiAgICB2YXIgaTtcbiAgICB2YXIgY291bnQgPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnRvdGFsQnJpY2tzOyBpICs9IDIpIHtcbiAgICAgICAgdGhpcy5icmlja3NbaV0gPSBjb3VudCAlIDg7XG4gICAgICAgIHRoaXMuYnJpY2tzW2kgKyAxXSA9IGNvdW50ICUgODtcbiAgICAgICAgY291bnQgPSBjb3VudCA9PSA3ID8gY291bnQgPSAwIDogY291bnQgKz0gMTtcbiAgICB9XG5cbiAgICAvLyBGaXNoZXItWWF0ZXNcbiAgICBmb3IgKGkgPSB0aGlzLnRvdGFsQnJpY2tzIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICB2YXIgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgICB2YXIgayA9IHRoaXMuYnJpY2tzW2pdO1xuICAgICAgICB0aGlzLmJyaWNrc1tqXSA9IHRoaXMuYnJpY2tzW2ldO1xuICAgICAgICB0aGlzLmJyaWNrc1tpXSA9IGs7XG4gICAgfVxuXG4gICAgdGhpcy5icmlja3MuZm9yRWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJyaWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICAgICAgYnJpY2suY2xhc3NMaXN0LmFkZChcIm1lbW9yeS1icmlja1wiKTtcbiAgICAgICAgYnJpY2suc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiL2ltYWdlL2hpZGRlbi5wbmdcIik7XG5cbiAgICAgICAgX3RoaXMuYm9hcmQuYXBwZW5kQ2hpbGQoYnJpY2spO1xuICAgIH0pO1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5yZXZlYWxCcmljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIGJyaWNrID0gZXZlbnQudGFyZ2V0O1xuICAgIHZhciBwYXJlbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRCcmljayAmJiBicmljayA9PT0gdGhpcy5zZWxlY3RlZEJyaWNrLmJyaWNrRWxlbSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGJyaWNrID09PSBwYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBpbmRleCA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwocGFyZW50LmNoaWxkcmVuLCBicmljayk7XG5cbiAgICBicmljay5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvXCIgKyB0aGlzLmJyaWNrc1tpbmRleF0gKyBcIi5wbmdcIik7XG5cbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRCcmljaykge1xuICAgICAgICB0aGlzLnNlbGVjdGVkQnJpY2sgPSB7YnJpY2tFbGVtOiBicmljaywgdmFsdWU6IHRoaXMuYnJpY2tzW2luZGV4XX07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jaGVja01hdGNoKHticmlja0VsZW06IGJyaWNrLCB2YWx1ZTogdGhpcy5icmlja3NbaW5kZXhdfSlcbiAgICB9XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLmNoZWNrTWF0Y2ggPSBmdW5jdGlvbihicmljaykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLmJvYXJkLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmJvdW5kUmV2ZWFsKTtcblxuICAgIGlmIChicmljay52YWx1ZSA9PT0gdGhpcy5zZWxlY3RlZEJyaWNrLnZhbHVlKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBicmljay5icmlja0VsZW0uY2xhc3NMaXN0LmFkZChcInJlbW92ZWRcIik7XG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrLmJyaWNrRWxlbS5jbGFzc0xpc3QuYWRkKFwicmVtb3ZlZFwiKTtcblxuICAgICAgICAgICAgX3RoaXMucmVtb3ZlZEJyaWNrcyArPSAyO1xuXG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrID0gbnVsbDtcbiAgICAgICAgICAgIF90aGlzLmJvYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfdGhpcy5ib3VuZFJldmVhbCk7XG5cbiAgICAgICAgICAgIGlmIChfdGhpcy5yZW1vdmVkQnJpY2tzID09PSBfdGhpcy50b3RhbEJyaWNrcykge1xuICAgICAgICAgICAgICAgIF90aGlzLmVuZEdhbWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJyaWNrLmJyaWNrRWxlbS5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvaGlkZGVuLnBuZ1wiKTtcbiAgICAgICAgICAgIF90aGlzLnNlbGVjdGVkQnJpY2suYnJpY2tFbGVtLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9oaWRkZW4ucG5nXCIpO1xuXG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrID0gbnVsbDtcbiAgICAgICAgICAgIF90aGlzLmJvYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfdGhpcy5ib3VuZFJldmVhbCk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH1cblxuICAgIHRoaXMubW92ZXMgKz0gMTtcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUuZW5kR2FtZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiWW91IHdvbiEgTW92ZXMgdGFrZW46IFwiICsgdGhpcy5tb3Zlcztcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUuZ2V0QXBwQ29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmFwcENvbnRlbnQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbW9yeTtcbiIsIi8vIEFwcCBjb250cm9scyB0aGUgVUkgYW5kIGlzIHJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyBuZXcgYXBwIGluc3RhbmNlcy4gQWRkaW5nIG5ldyBhcHBzXG4vLyB0byB0aGUgUGVyc29uYWwgV2ViIERlc2t0b3Agc2hvdWxkIGJlIGFzIGVhc3kgYXMgaW1wb3J0aW5nIGl0IGluIGFwcC5qcyBhbmQgY3JlYXRpbmcgaXQuXG5cbi8vIFRoZSBhcHBzIGZvbGxvdyB0aGUgc2FtZSBzdHJ1Y3R1cmU6XG4vLyBUaGV5IGFsbCBjb250YWluIGEgZnVuY3Rpb24gY2FsbGVkIGdldEFwcENvbnRlbnQsIHdoaWNoIHJldHVybnMgdGhlIGRpdiB0aGF0IG5lZWRzIHRvXG4vLyBiZSBhdHRhY2hlZCB0byB0aGUgYXBwIHdpbmRvdydzIGFwcCBjb250YWluZXIuIEZvciBhcHBzXG5cbihmdW5jdGlvbiBpbml0KCkge1xuICAgIC8vIEluaXRpYWxpemUgdGhlIGRlc2t0b3AuXG4gICAgdmFyIERlc2t0b3AgPSByZXF1aXJlKFwiLi9EZXNrdG9wXCIpO1xuICAgIHZhciBkZXNrdG9wID0gbmV3IERlc2t0b3AoKTtcblxuICAgIC8vIEltcG9ydCB0aGUgbmVjZXNzYXJ5IGFwcHMuXG4gICAgdmFyIE1lbW9yeSA9IHJlcXVpcmUoXCIuL01lbW9yeVwiKTtcbiAgICB2YXIgQ2hhdCA9IHJlcXVpcmUoXCIuL0NoYXRcIik7XG5cbiAgICB2YXIgbmV3V2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuZXdfd2luZG93XCIpO1xuICAgIHZhciBuZXdDaGF0V2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuZXdfY2hhdFwiKTtcbiAgICB2YXIgbmV3TWVtb3J5V2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuZXdfbWVtb3J5XCIpO1xuXG4gICAgbmV3V2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZGVza3RvcC5hdHRhY2hXaW5kb3coKTtcbiAgICB9KTtcblxuICAgIG5ld0NoYXRXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIWRlc2t0b3AuaW5zdGFuY2VzLmNoYXQpIHtcbiAgICAgICAgICAgIGlmICghZGVza3RvcC51c2VybmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciB1c2VyID0gcHJvbXB0KFwiUGxlYXNlIGVudGVyIGEgdXNlcm5hbWU6XCIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ1c2VybmFtZVwiLCB1c2VyKTtcblxuICAgICAgICAgICAgICAgICAgICBkZXNrdG9wLnVzZXJuYW1lID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZXNrdG9wLmluc3RhbmNlcy5jaGF0ID0gbmV3IENoYXQoZGVza3RvcC51c2VybmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBkZXNrdG9wLmF0dGFjaFdpbmRvdyhkZXNrdG9wLmluc3RhbmNlcy5jaGF0KTtcbiAgICB9KTtcblxuICAgIG5ld01lbW9yeVdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRlc2t0b3AuYXR0YWNoV2luZG93KG5ldyBNZW1vcnkoNCwgNCkpO1xuICAgIH0pO1xufSkoKTtcbiJdfQ==
