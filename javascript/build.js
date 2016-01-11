(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function AppWindow(width, height) {
    this.app = null;

    this.div = this.createWindow(width, height);

    this.toolbar = this.div.querySelector(".toolbar");

    this.menuIcon = this.div.querySelector(".toolbar-icon");

    this.dropdown = this.div.querySelector(".toolbar-dropdown");

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

    if (app.imageSrc !== "") {
        this.menuIcon.setAttribute("src", "image/" + app.imageSrc + ".png");
    }

    if (app.menuItems) {
        this.attachMenu();
    }

    this.appContainer.appendChild(app.getAppContent());
};

AppWindow.prototype.attachMenu = function() {
    var _this = this;

    var template = document.querySelector("#dropdown-template");

    this.app.menuItems.forEach(function(item) {
        var menuItem = document.importNode(template.content, true).querySelector(".dropdown-item");

        menuItem.querySelector(".dropdown-name").textContent = item.name;

        menuItem.addEventListener("click", item.eventHandler);

        _this.dropdown.appendChild(menuItem);
    });
};

AppWindow.prototype.refreshApp = function() {
    while (this.appContainer.hasChildNodes()) {
        this.appContainer.removeChild(this.appContainer.firstElementChild);
    }

    this.appContainer.appendChild(this.app.getAppContent());
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

    this.imageSrc = "chat";

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

        if (event.target.value.charAt(0) === "/") {
            this.handleCommand(event.target.value.slice(1));
        } else if (event.target.value !== "") {
            this.sendMessage(event.target.value);
        }

        event.target.value = "";
    }
};

Chat.prototype.handleCommand = function(command) {
    var commandKeyword = command.split(" ")[0];
    var commandParameters = null;

    if (command.split(" ").length > 1) {
        commandParameters = command.substr(command.indexOf(" ") + 1, command.length);
    }

    switch (commandKeyword) {
        case "name":
            if (commandParameters) {
                this.username = commandParameters;
                localStorage.setItem("username", commandParameters);

                this.appendLine("PWD", "Your username is now " + commandParameters + ".");
            } else {
                this.appendLine("PWD", "Please enter a username.");
            }

            break;
        default:
            this.appendLine("PWD", commandKeyword + " command not yet implemented.");
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
    var _this = this;

    // Attaches the event listener that gives the app window focus and hides the menu
    appWindow.div.addEventListener("mousedown", function(event) {
        _this.giveFocus(event);

        if (!appWindow.dropdown.classList.contains("removed") && !event.target.classList.contains("toolbar-icon")
            && !event.target.classList.contains("dropdown-name") && !event.target.classList.contains("dropdown-item")) {
            appWindow.dropdown.classList.add("removed");
        }
    });

    appWindow.appContainer.addEventListener("refresh", function() {
        appWindow.refreshApp();
    });

    // Attaches the event listener that starts moving the window
    appWindow.toolbar.addEventListener("mousedown", this.startMove.bind(this));

    appWindow.menuIcon.addEventListener("click", this.showMenu.bind(appWindow));

    // Attaches the event listener that closes the window and removes it from the list of windows.
    appWindow.closeWindow.addEventListener("click", function() {
        //TODO: make sure this deletes the chat instance too!
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

Desktop.prototype.showMenu = function(event) {
    event.preventDefault();

    this.dropdown.classList.toggle("removed");
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
    // Make sure the user isn't selecting the menu icon or "close window" button.
    if (!event.target.classList.contains("toolbar")) {
        return;
    }

    this.movingWindow = event.target.parentNode;

    this.distance.x = this.mousePos.x - event.target.parentNode.offsetLeft;
    this.distance.y = this.mousePos.y - event.target.parentNode.offsetTop;
};

module.exports = Desktop;

},{"./AppWindow":1}],4:[function(require,module,exports){
function Memory(boardX, boardY) {
    // TODO: where should I handle legal/illegal board sizes?

    this.imageSrc = "puzzle";

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
function Notebook() {
    this.noteArray = [{name: "test", content:"This is a test note"}];

    this.event = new Event("refresh");

    this.menuItems = [
        {name: "New", eventHandler: this.newNote.bind(this)},
        {name: "Save", eventHandler: this.saveNote.bind(this)},
        {name: "Load", eventHandler: this.loadScreen.bind(this)}
    ];

    this.imageSrc = "diary";

    this.state = "new";

    this.appContent = this.createAppContentNew();
}

Notebook.prototype.createAppContentNew = function() {
    var template = document.querySelector("#notebook-template-new");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    return appContent;
};

Notebook.prototype.createAppContentSavedNote = function(noteName) {
    var template = document.querySelector("#notebook-template-new");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    var note = this.getNote(noteName);

    if (note) {
        appContent.querySelector(".note").value = note.content;
    }

    return appContent;
};

Notebook.prototype.newNote = function() {
    console.log("new");

    this.state = "new";

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.saveNote = function() {
    console.log("save");

    if (this.state === "new") {
        var name = prompt("Please enter a name: ", "Untitled");

        if (!name) {
            return;
        }

        if (this.getNote(name)) {
            alert("Name already taken.");
        } else {
            this.noteArray.push({name: name, content: this.appContent.querySelector(".note").value});

            this.state = name;
        }
    } else {
        this.getNote(this.state).content = this.appContent.querySelector(".note").value;
    }
};

Notebook.prototype.loadScreen = function() {
    console.log("load");

    this.state = "load";

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.loadNote = function(event) {
    this.state = event.target.textContent + "";

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.deleteNote = function(event) {
    var name = event.target.textContent + "";

    this.noteArray = this.noteArray.slice(this.noteArray.indexOf(this.getNote(name)), 1);

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.createAppContentLoadMenu = function() {
    var template = document.querySelector("#notebook-template-load");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    var _this = this;

    this.noteArray.forEach(function(note) {
        var itemTemplate = document.querySelector("#notebook-listitem-template");
        var item = document.importNode(itemTemplate.content, true).querySelector(".notebook-listitem");

        item.querySelector(".item-name").textContent = note.name;

        item.querySelector(".item-name").addEventListener("click", _this.loadNote.bind(_this));

        item.querySelector(".delete-item").addEventListener("click", _this.deleteNote.bind(_this));

        appContent.appendChild(item);
    });

    return appContent;
};

Notebook.prototype.getNote = function(name) {
    var resultNote = null;

    this.noteArray.forEach(function(note) {
        if (note.name === name) {
            resultNote = note;
        }
    });

    return resultNote;
};

Notebook.prototype.getAppContent = function() {
    if (this.state === "new") {
        this.appContent = this.createAppContentNew();

        return this.appContent;
    } else if (this.state === "load") {
        this.appContent = this.createAppContentLoadMenu();

        return this.appContent;
    } else {
        this.appContent = this.createAppContentSavedNote(this.state);

        return this.appContent;
    }
};

module.exports = Notebook;

},{}],6:[function(require,module,exports){
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
    var Notebook = require("./Notebook");
    var Memory = require("./Memory");
    var Chat = require("./Chat");

    var newNotebookWindow = document.querySelector("#new_notebook");
    var newChatWindow = document.querySelector("#new_chat");
    var newMemoryWindow = document.querySelector("#new_memory");

    newNotebookWindow.addEventListener("click", function() {
        desktop.attachWindow(new Notebook());
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

},{"./Chat":2,"./Desktop":3,"./Memory":4,"./Notebook":5}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQXBwV2luZG93LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9DaGF0LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9EZXNrdG9wLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9NZW1vcnkuanMiLCJjbGllbnQvc291cmNlL2pzL05vdGVib29rLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9hcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gQXBwV2luZG93KHdpZHRoLCBoZWlnaHQpIHtcbiAgICB0aGlzLmFwcCA9IG51bGw7XG5cbiAgICB0aGlzLmRpdiA9IHRoaXMuY3JlYXRlV2luZG93KHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgdGhpcy50b29sYmFyID0gdGhpcy5kaXYucXVlcnlTZWxlY3RvcihcIi50b29sYmFyXCIpO1xuXG4gICAgdGhpcy5tZW51SWNvbiA9IHRoaXMuZGl2LnF1ZXJ5U2VsZWN0b3IoXCIudG9vbGJhci1pY29uXCIpO1xuXG4gICAgdGhpcy5kcm9wZG93biA9IHRoaXMuZGl2LnF1ZXJ5U2VsZWN0b3IoXCIudG9vbGJhci1kcm9wZG93blwiKTtcblxuICAgIHRoaXMuY2xvc2VXaW5kb3cgPSB0aGlzLmRpdi5xdWVyeVNlbGVjdG9yKFwiLmNsb3NlLXdpbmRvd1wiKTtcblxuICAgIHRoaXMuYXBwQ29udGFpbmVyID0gdGhpcy5kaXYucXVlcnlTZWxlY3RvcihcIi5hcHAtY29udGFpbmVyXCIpO1xufVxuXG5BcHBXaW5kb3cucHJvdG90eXBlLmNyZWF0ZVdpbmRvdyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjd2luZG93LXRlbXBsYXRlXCIpO1xuICAgIHJldHVybiBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLXdpbmRvd1wiKTtcbn07XG5cbkFwcFdpbmRvdy5wcm90b3R5cGUuYXR0YWNoQXBwID0gZnVuY3Rpb24oYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG5cbiAgICB3aGlsZSAodGhpcy5hcHBDb250YWluZXIuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIHRoaXMuYXBwQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuYXBwQ29udGFpbmVyLmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICB9XG5cbiAgICBpZiAoYXBwLmltYWdlU3JjICE9PSBcIlwiKSB7XG4gICAgICAgIHRoaXMubWVudUljb24uc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiaW1hZ2UvXCIgKyBhcHAuaW1hZ2VTcmMgKyBcIi5wbmdcIik7XG4gICAgfVxuXG4gICAgaWYgKGFwcC5tZW51SXRlbXMpIHtcbiAgICAgICAgdGhpcy5hdHRhY2hNZW51KCk7XG4gICAgfVxuXG4gICAgdGhpcy5hcHBDb250YWluZXIuYXBwZW5kQ2hpbGQoYXBwLmdldEFwcENvbnRlbnQoKSk7XG59O1xuXG5BcHBXaW5kb3cucHJvdG90eXBlLmF0dGFjaE1lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNkcm9wZG93bi10ZW1wbGF0ZVwiKTtcblxuICAgIHRoaXMuYXBwLm1lbnVJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdmFyIG1lbnVJdGVtID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmRyb3Bkb3duLWl0ZW1cIik7XG5cbiAgICAgICAgbWVudUl0ZW0ucXVlcnlTZWxlY3RvcihcIi5kcm9wZG93bi1uYW1lXCIpLnRleHRDb250ZW50ID0gaXRlbS5uYW1lO1xuXG4gICAgICAgIG1lbnVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBpdGVtLmV2ZW50SGFuZGxlcik7XG5cbiAgICAgICAgX3RoaXMuZHJvcGRvd24uYXBwZW5kQ2hpbGQobWVudUl0ZW0pO1xuICAgIH0pO1xufTtcblxuQXBwV2luZG93LnByb3RvdHlwZS5yZWZyZXNoQXBwID0gZnVuY3Rpb24oKSB7XG4gICAgd2hpbGUgKHRoaXMuYXBwQ29udGFpbmVyLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICB0aGlzLmFwcENvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLmFwcENvbnRhaW5lci5maXJzdEVsZW1lbnRDaGlsZCk7XG4gICAgfVxuXG4gICAgdGhpcy5hcHBDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5hcHAuZ2V0QXBwQ29udGVudCgpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwV2luZG93O1xuIiwiLyoqXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKi9cblxuZnVuY3Rpb24gQ2hhdCh1c2VybmFtZSkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLmxhc3RMaW5lcyA9IFtdO1xuXG4gICAgdGhpcy5pbWFnZVNyYyA9IFwiY2hhdFwiO1xuXG4gICAgdGhpcy5kZWZhdWx0VGl0bGUgPSBkb2N1bWVudC50aXRsZTtcbiAgICB0aGlzLnVzZXJuYW1lID0gdXNlcm5hbWU7XG5cbiAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnQoKTtcbiAgICB0aGlzLmNoYXRMaW5lcyA9IHRoaXMuYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtbGluZXNcIik7XG4gICAgdGhpcy5hcGlLZXkgPSBcImVEQkU3NmRlVTdMMEg5bUVCZ3hVS1ZSMFZDbnEwWEJkXCI7XG4gICAgdGhpcy5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KFwid3M6Ly92aG9zdDMubG51LnNlOjIwMDgwL3NvY2tldC9cIik7XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCB0aGlzLmhhbmRsZVZpc2liaWxpdHlDaGFuZ2UuYmluZCh0aGlzKSk7XG5cbiAgICAvLyBUT0RPOiBNYWtlIHN1cmUgdGhlIHNvY2tldCBvcGVucyBiZWZvcmUgdGhlIHVzZXIgY2FuIHNlbmQgbWVzc2FnZXNcblxuICAgIHRoaXMuc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGV2ZW50LmRhdGEpO1xuXG4gICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcblxuICAgICAgICBpZiAobWVzc2FnZS50eXBlICE9IFwiaGVhcnRiZWF0XCIpIHtcbiAgICAgICAgICAgIF90aGlzLmFwcGVuZExpbmUobWVzc2FnZS51c2VybmFtZSwgbWVzc2FnZS5kYXRhKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5DaGF0LnByb3RvdHlwZS5jcmVhdGVBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gVE9ETzogYmV0dGVyIHdheSBvZiBkb2luZyB0aGlzIHRoYW4gdGVtcGxhdGVzP1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY2hhdC10ZW1wbGF0ZVwiKTtcblxuICAgIHZhciBhcHBDb250ZW50ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250ZW50XCIpO1xuXG4gICAgdGhpcy5hdHRhY2hFdmVudExpc3RlbmVycyhhcHBDb250ZW50KTtcblxuICAgIHJldHVybiBhcHBDb250ZW50O1xufTtcblxuQ2hhdC5wcm90b3R5cGUuYXR0YWNoRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbihhcHBDb250ZW50KSB7XG4gICAgdmFyIGNoYXRGb3JtID0gYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtZm9ybVwiKTtcbiAgICB2YXIgdGV4dEFyZWEgPSBjaGF0Rm9ybS5xdWVyeVNlbGVjdG9yKFwidGV4dGFyZWFcIik7XG5cbiAgICB0ZXh0QXJlYS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZVRleHRJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAvL3RleHRBcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCB0aGlzLmhhbmRsZUZvY3VzLmJpbmQodGhpcykpO1xufTtcblxuQ2hhdC5wcm90b3R5cGUuaGFuZGxlVGV4dElucHV0ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZiAoIWV2ZW50LnNoaWZ0S2V5ICYmIGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC52YWx1ZS5jaGFyQXQoMCkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUNvbW1hbmQoZXZlbnQudGFyZ2V0LnZhbHVlLnNsaWNlKDEpKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC50YXJnZXQudmFsdWUgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZE1lc3NhZ2UoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV2ZW50LnRhcmdldC52YWx1ZSA9IFwiXCI7XG4gICAgfVxufTtcblxuQ2hhdC5wcm90b3R5cGUuaGFuZGxlQ29tbWFuZCA9IGZ1bmN0aW9uKGNvbW1hbmQpIHtcbiAgICB2YXIgY29tbWFuZEtleXdvcmQgPSBjb21tYW5kLnNwbGl0KFwiIFwiKVswXTtcbiAgICB2YXIgY29tbWFuZFBhcmFtZXRlcnMgPSBudWxsO1xuXG4gICAgaWYgKGNvbW1hbmQuc3BsaXQoXCIgXCIpLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY29tbWFuZFBhcmFtZXRlcnMgPSBjb21tYW5kLnN1YnN0cihjb21tYW5kLmluZGV4T2YoXCIgXCIpICsgMSwgY29tbWFuZC5sZW5ndGgpO1xuICAgIH1cblxuICAgIHN3aXRjaCAoY29tbWFuZEtleXdvcmQpIHtcbiAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgIGlmIChjb21tYW5kUGFyYW1ldGVycykge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgPSBjb21tYW5kUGFyYW1ldGVycztcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInVzZXJuYW1lXCIsIGNvbW1hbmRQYXJhbWV0ZXJzKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kTGluZShcIlBXRFwiLCBcIllvdXIgdXNlcm5hbWUgaXMgbm93IFwiICsgY29tbWFuZFBhcmFtZXRlcnMgKyBcIi5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kTGluZShcIlBXRFwiLCBcIlBsZWFzZSBlbnRlciBhIHVzZXJuYW1lLlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aGlzLmFwcGVuZExpbmUoXCJQV0RcIiwgY29tbWFuZEtleXdvcmQgKyBcIiBjb21tYW5kIG5vdCB5ZXQgaW1wbGVtZW50ZWQuXCIpO1xuICAgIH1cbn07XG5cbkNoYXQucHJvdG90eXBlLmhhbmRsZVZpc2liaWxpdHlDaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIWRvY3VtZW50LmhpZGRlbikge1xuICAgICAgICBkb2N1bWVudC50aXRsZSA9IHRoaXMuZGVmYXVsdFRpdGxlO1xuICAgIH1cbn07XG5cbkNoYXQucHJvdG90eXBlLmFwcGVuZExpbmUgPSBmdW5jdGlvbih1c2VybmFtZSwgbGluZSkge1xuICAgIHRoaXMubGFzdExpbmVzLnB1c2goe3VzZXJuYW1lOiB1c2VybmFtZSwgbGluZTogbGluZX0pO1xuXG4gICAgaWYgKHRoaXMubGFzdExpbmVzLmxlbmd0aCA+IDIwKSB7XG4gICAgICAgIHRoaXMubGFzdExpbmVzLnNoaWZ0KCk7XG4gICAgfVxuXG4gICAgaWYgKGRvY3VtZW50LmhpZGRlbikge1xuICAgICAgICB2YXIgYXVkaW8gPSB0aGlzLmFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcImF1ZGlvXCIpO1xuXG4gICAgICAgIGF1ZGlvLnBsYXkoKTtcblxuICAgICAgICBkb2N1bWVudC50aXRsZSA9IFwiKiBcIiArIHRoaXMuZGVmYXVsdFRpdGxlO1xuICAgIH1cblxuICAgIHRoaXMuY29udmVydExpbmVzVG9IVE1MKCk7XG59O1xuXG5DaGF0LnByb3RvdHlwZS5jb252ZXJ0TGluZXNUb0hUTUwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY2hhdC1saW5lLXRlbXBsYXRlXCIpO1xuICAgIHZhciBjaGF0TGluZSA9IGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5jaGF0LW1lc3NhZ2VcIik7XG5cbiAgICB3aGlsZSAodGhpcy5jaGF0TGluZXMuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIHRoaXMuY2hhdExpbmVzLnJlbW92ZUNoaWxkKHRoaXMuY2hhdExpbmVzLmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmxhc3RMaW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUsIGluZGV4KSB7XG4gICAgICAgIHZhciBvcmRlciA9IF90aGlzLmxhc3RMaW5lcy5sZW5ndGggLSBpbmRleDtcbiAgICAgICAgdmFyIG5ld0xpbmUgPSBjaGF0TGluZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIG5ld0xpbmUucXVlcnlTZWxlY3RvcihcIi51c2VybmFtZVwiKS50ZXh0Q29udGVudCA9IGxpbmUudXNlcm5hbWU7XG4gICAgICAgIG5ld0xpbmUucXVlcnlTZWxlY3RvcihcIi5jaGF0LWxpbmVcIikudGV4dENvbnRlbnQgPSBsaW5lLmxpbmU7XG5cbiAgICAgICAgbmV3TGluZS5zdHlsZS5vcmRlciA9IG9yZGVyO1xuXG4gICAgICAgIF90aGlzLmNoYXRMaW5lcy5hcHBlbmRDaGlsZChuZXdMaW5lKTtcbiAgICB9KTtcblxuICAgIHRoaXMucHVibGlzaE1lc3NhZ2VzKCk7XG59O1xuXG5DaGF0LnByb3RvdHlwZS5wdWJsaXNoTWVzc2FnZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciBmb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG5cbiAgICBmb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jaGF0XCIpLCBmdW5jdGlvbihjaGF0V2luKSB7XG4gICAgICAgIHZhciBuZXdDaGF0ID0gX3RoaXMuY2hhdExpbmVzLmNsb25lTm9kZSh0cnVlKTtcblxuICAgICAgICBjaGF0V2luLnJlbW92ZUNoaWxkKGNoYXRXaW4ucXVlcnlTZWxlY3RvcihcIi5jaGF0LWxpbmVzXCIpKTtcblxuICAgICAgICBjaGF0V2luLmluc2VydEJlZm9yZShuZXdDaGF0LCBjaGF0V2luLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1mb3JtXCIpKTtcbiAgICB9KTtcbn07XG5cbkNoYXQucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIHZhciBkYXRhID0ge307XG5cbiAgICBkYXRhLnVzZXJuYW1lID0gdGhpcy51c2VybmFtZTtcbiAgICBkYXRhLmRhdGEgPSBtZXNzYWdlO1xuICAgIGRhdGEua2V5ID0gdGhpcy5hcGlLZXk7XG4gICAgZGF0YS50eXBlID0gXCJtZXNzYWdlXCI7XG5cbiAgICB0aGlzLnNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcblxuICAgIC8vIG9mZmxpbmUgY2FwYWJpbGl0aWVzIFRPRE86IHVzZSB0aGlzIGFzIGEgZmFsbGJhY2s/XG4gICAgLy90aGlzLmFwcGVuZExpbmUodGhpcy51c2VybmFtZSwgbWVzc2FnZSk7XG59O1xuXG5DaGF0LnByb3RvdHlwZS5nZXRBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gQ2xvbmluZyBkb2VzIG5vdCBhdHRhY2ggZXZlbnQgbGlzdGVuZXJzLCBzbyB3ZSBoYXZlIHRvIGRvIGl0IGFmdGVyd2FyZHNcblxuICAgIHZhciBjb250ZW50ID0gdGhpcy5hcHBDb250ZW50LmNsb25lTm9kZSh0cnVlKTtcblxuICAgIHRoaXMuYXR0YWNoRXZlbnRMaXN0ZW5lcnMoY29udGVudCk7XG5cbiAgICByZXR1cm4gY29udGVudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhdDtcbiIsInZhciBBcHBXaW5kb3cgPSByZXF1aXJlKFwiLi9BcHBXaW5kb3dcIik7XG5cbi8qKlxuICogRGVza3RvcCBvYmplY3Qgd2hpY2ggY29udGFpbnMgYWxsIHRoZSBBcHBXaW5kb3cgb2JqZWN0cyBhbG9uZyB3aXRoIHNldHRpbmdzLlxuICovXG5mdW5jdGlvbiBEZXNrdG9wKCkge1xuICAgIHRoaXMud2luZG93cyA9IFtdO1xuXG4gICAgdGhpcy51c2VybmFtZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidXNlcm5hbWVcIik7XG5cbiAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjd2luZG93X2NvbnRhaW5lclwiKTtcblxuICAgIHRoaXMuc2V0dGluZ3MgPSB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJhenVyZVwiLFxuICAgICAgICB3aWR0aDogMjAwLFxuICAgICAgICBoZWlnaHQ6IDMwMFxuICAgIH07XG5cbiAgICAvLyBUaGUgb2JqZWN0IHRoYXQgY29udGFpbnMgYXBwcyB0aGF0IHNob3VsZCBvbmx5IGhhdmUgb25lIGluc3RhbmNlIGFjcm9zcyB0aGUgZGVza3RvcCAoZS5nLiBjaGF0KS5cbiAgICB0aGlzLmluc3RhbmNlcyA9IHtcblxuICAgIH07XG5cbiAgICB0aGlzLm1vdmluZ1dpbmRvdyA9IG51bGw7XG4gICAgdGhpcy50b3BaSW5kZXggPSAxO1xuXG4gICAgdGhpcy5kaXN0YW5jZSA9IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgIH07XG5cbiAgICB0aGlzLm1vdXNlUG9zID0ge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwXG4gICAgfTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5tb3ZlV2luZG93LmJpbmQodGhpcykpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vdmluZ1dpbmRvdyA9IG51bGw7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn1cblxuRGVza3RvcC5wcm90b3R5cGUuYXR0YWNoV2luZG93ID0gZnVuY3Rpb24oYXBwKSB7XG4gICAgdmFyIGFwcFdpbmRvdyA9IG5ldyBBcHBXaW5kb3coKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZXJlIGFyZSBhbnkgd2luZG93cyBpbiB0aGUgZGVza3RvcC4gSWYgc28sIGNoYW5nZSBpdHMgcG9zaXRpb24uXG4gICAgaWYgKHRoaXMud2luZG93cy5sZW5ndGggPj0gMSkge1xuICAgICAgICBhcHBXaW5kb3cuZGl2LnN0eWxlLmxlZnQgPSAodGhpcy53aW5kb3dzW3RoaXMud2luZG93cy5sZW5ndGggLSAxXS5kaXYub2Zmc2V0TGVmdCArIDIwKSArIFwicHhcIjtcbiAgICAgICAgYXBwV2luZG93LmRpdi5zdHlsZS50b3AgPSAodGhpcy53aW5kb3dzW3RoaXMud2luZG93cy5sZW5ndGggLSAxXS5kaXYub2Zmc2V0VG9wICsgMjApICsgXCJweFwiO1xuICAgIH1cblxuICAgIGFwcFdpbmRvdy5kaXYuc3R5bGUuekluZGV4ID0gdGhpcy50b3BaSW5kZXg7XG4gICAgdGhpcy50b3BaSW5kZXggKz0gMTtcblxuICAgIC8vIFdlIHB1c2ggaXQgdG8gdGhlIGxpc3Qgb2Ygd2luZG93cyBmaXJzdCwgc28gdGhhdCB3ZSBrbm93IHRoZSBhcHAgd2luZG93J3MgaW5kZXggaW4gdGhlIGFycmF5XG4gICAgdGhpcy53aW5kb3dzLnB1c2goYXBwV2luZG93KTtcblxuICAgIHRoaXMuYXR0YWNoRXZlbnRMaXN0ZW5lcnMoYXBwV2luZG93KTtcblxuICAgIGlmIChhcHApIHtcbiAgICAgICAgYXBwV2luZG93LmF0dGFjaEFwcChhcHApO1xuICAgIH1cblxuICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKGFwcFdpbmRvdy5kaXYpO1xufTtcblxuRGVza3RvcC5wcm90b3R5cGUuYXR0YWNoRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbihhcHBXaW5kb3cpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gQXR0YWNoZXMgdGhlIGV2ZW50IGxpc3RlbmVyIHRoYXQgZ2l2ZXMgdGhlIGFwcCB3aW5kb3cgZm9jdXMgYW5kIGhpZGVzIHRoZSBtZW51XG4gICAgYXBwV2luZG93LmRpdi5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIF90aGlzLmdpdmVGb2N1cyhldmVudCk7XG5cbiAgICAgICAgaWYgKCFhcHBXaW5kb3cuZHJvcGRvd24uY2xhc3NMaXN0LmNvbnRhaW5zKFwicmVtb3ZlZFwiKSAmJiAhZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcInRvb2xiYXItaWNvblwiKVxuICAgICAgICAgICAgJiYgIWV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJkcm9wZG93bi1uYW1lXCIpICYmICFldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiZHJvcGRvd24taXRlbVwiKSkge1xuICAgICAgICAgICAgYXBwV2luZG93LmRyb3Bkb3duLmNsYXNzTGlzdC5hZGQoXCJyZW1vdmVkXCIpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBhcHBXaW5kb3cuYXBwQ29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJyZWZyZXNoXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhcHBXaW5kb3cucmVmcmVzaEFwcCgpO1xuICAgIH0pO1xuXG4gICAgLy8gQXR0YWNoZXMgdGhlIGV2ZW50IGxpc3RlbmVyIHRoYXQgc3RhcnRzIG1vdmluZyB0aGUgd2luZG93XG4gICAgYXBwV2luZG93LnRvb2xiYXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB0aGlzLnN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcblxuICAgIGFwcFdpbmRvdy5tZW51SWNvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaG93TWVudS5iaW5kKGFwcFdpbmRvdykpO1xuXG4gICAgLy8gQXR0YWNoZXMgdGhlIGV2ZW50IGxpc3RlbmVyIHRoYXQgY2xvc2VzIHRoZSB3aW5kb3cgYW5kIHJlbW92ZXMgaXQgZnJvbSB0aGUgbGlzdCBvZiB3aW5kb3dzLlxuICAgIGFwcFdpbmRvdy5jbG9zZVdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vVE9ETzogbWFrZSBzdXJlIHRoaXMgZGVsZXRlcyB0aGUgY2hhdCBpbnN0YW5jZSB0b28hXG4gICAgICAgIHRoaXMuY29udGFpbmVyLnJlbW92ZUNoaWxkKGFwcFdpbmRvdy5kaXYpO1xuICAgICAgICB0aGlzLndpbmRvd3Muc3BsaWNlKHRoaXMud2luZG93cy5pbmRleE9mKGFwcFdpbmRvdyksIDEpO1xuICAgIH0uYmluZCh0aGlzKSk7XG59O1xuXG5EZXNrdG9wLnByb3RvdHlwZS5naXZlRm9jdXMgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGlmIChwYXJzZUludChldmVudC5jdXJyZW50VGFyZ2V0LnN0eWxlLnpJbmRleCwgMTApICE9PSB0aGlzLnRvcFpJbmRleCAtIDEpIHtcbiAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5zdHlsZS56SW5kZXggPSB0aGlzLnRvcFpJbmRleDtcbiAgICAgICAgdGhpcy50b3BaSW5kZXggKz0gMTtcbiAgICB9XG5cbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbn07XG5cbkRlc2t0b3AucHJvdG90eXBlLnNob3dNZW51ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QudG9nZ2xlKFwicmVtb3ZlZFwiKTtcbn07XG5cbkRlc2t0b3AucHJvdG90eXBlLm1vdmVXaW5kb3cgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHRoaXMubW91c2VQb3MueCA9IGV2ZW50LmNsaWVudFggLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRMZWZ0O1xuICAgIHRoaXMubW91c2VQb3MueSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRUb3A7XG5cbiAgICBpZiAodGhpcy5tb3ZpbmdXaW5kb3cpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB0aGlzLm1vdmluZ1dpbmRvdy5zdHlsZS50b3AgPSAgdGhpcy5tb3VzZVBvcy55IC0gdGhpcy5kaXN0YW5jZS55ICsgXCJweFwiO1xuICAgICAgICB0aGlzLm1vdmluZ1dpbmRvdy5zdHlsZS5sZWZ0ID0gIHRoaXMubW91c2VQb3MueCAtIHRoaXMuZGlzdGFuY2UueCArIFwicHhcIjtcblxuICAgICAgICAvLyBQcmV2ZW50IHRoZSB3aW5kb3cgZnJvbSBtb3Zpbmcgb2ZmIHRoZSB0b3Agb2YgdGhlIGRlc2t0b3AuIE90aGVyIGRpcmVjdGlvbnMgYXJlIGZpbmUsXG4gICAgICAgIC8vIGp1c3QgbGlrZSBpbiBhIHJlYWwgb3BlcmF0aW5nIHN5c3RlbSFcbiAgICAgICAgaWYgKHRoaXMubW92aW5nV2luZG93Lm9mZnNldFRvcCA8IDApIHtcbiAgICAgICAgICAgIHRoaXMubW92aW5nV2luZG93LnN0eWxlLnRvcCA9IDA7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5EZXNrdG9wLnByb3RvdHlwZS5zdGFydE1vdmUgPSBmdW5jdGlvbihldmVudCkge1xuICAgIC8vIE1ha2Ugc3VyZSB0aGUgdXNlciBpc24ndCBzZWxlY3RpbmcgdGhlIG1lbnUgaWNvbiBvciBcImNsb3NlIHdpbmRvd1wiIGJ1dHRvbi5cbiAgICBpZiAoIWV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJ0b29sYmFyXCIpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLm1vdmluZ1dpbmRvdyA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xuXG4gICAgdGhpcy5kaXN0YW5jZS54ID0gdGhpcy5tb3VzZVBvcy54IC0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUub2Zmc2V0TGVmdDtcbiAgICB0aGlzLmRpc3RhbmNlLnkgPSB0aGlzLm1vdXNlUG9zLnkgLSBldmVudC50YXJnZXQucGFyZW50Tm9kZS5vZmZzZXRUb3A7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlc2t0b3A7XG4iLCJmdW5jdGlvbiBNZW1vcnkoYm9hcmRYLCBib2FyZFkpIHtcbiAgICAvLyBUT0RPOiB3aGVyZSBzaG91bGQgSSBoYW5kbGUgbGVnYWwvaWxsZWdhbCBib2FyZCBzaXplcz9cblxuICAgIHRoaXMuaW1hZ2VTcmMgPSBcInB1enpsZVwiO1xuXG4gICAgdGhpcy5ib2FyZFggPSBib2FyZFggfHwgNDtcbiAgICB0aGlzLmJvYXJkWSA9IGJvYXJkWSB8fCA0O1xuICAgIHRoaXMudG90YWxCcmlja3MgPSAwO1xuICAgIHRoaXMucmVtb3ZlZEJyaWNrcyA9IDA7XG4gICAgdGhpcy5tb3ZlcyA9IDA7XG4gICAgdGhpcy5ib2FyZCA9IG51bGw7XG4gICAgdGhpcy5pbmZvID0gbnVsbDtcbiAgICB0aGlzLmJyaWNrcyA9IFtdO1xuICAgIHRoaXMuYm91bmRSZXZlYWwgPSB0aGlzLnJldmVhbEJyaWNrLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLnNlbGVjdGVkQnJpY2sgPSBudWxsO1xuXG4gICAgdGhpcy5hcHBDb250ZW50ID0gdGhpcy5jcmVhdGVBcHBDb250ZW50KCk7XG59XG5cbk1lbW9yeS5wcm90b3R5cGUuY3JlYXRlQXBwQ29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbWVtb3J5LXRlbXBsYXRlXCIpO1xuICAgIHZhciBhcHBDb250ZW50ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250ZW50XCIpO1xuXG4gICAgdGhpcy5ib2FyZCA9IGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5ib2FyZFwiKTtcbiAgICB0aGlzLmluZm8gPSBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIuaW5mb1wiKTtcbiAgICB0aGlzLmluaXRpYWxpemVCb2FyZCgpO1xuXG4gICAgdGhpcy5hdHRhY2hFdmVudExpc3RlbmVycyhhcHBDb250ZW50KTtcblxuICAgIHJldHVybiBhcHBDb250ZW50O1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5hdHRhY2hFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uKGFwcENvbnRlbnQpIHtcbiAgICB2YXIgYm9hcmQgPSBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIuYm9hcmRcIik7XG4gICAgdmFyIG5ld0dhbWUgPSBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIubmV3LWdhbWVcIik7XG5cbiAgICBib2FyZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5ib3VuZFJldmVhbCk7XG4gICAgbmV3R2FtZS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIHRoaXMubmV3R2FtZS5iaW5kKHRoaXMpKTtcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUubmV3R2FtZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHZhciBuZXdCb2FyZFggPSBldmVudC50YXJnZXQuZWxlbWVudHNbMV0udmFsdWU7XG4gICAgdmFyIG5ld0JvYXJkWSA9IGV2ZW50LnRhcmdldC5lbGVtZW50c1syXS52YWx1ZTtcblxuICAgIGlmIChpc05hTihuZXdCb2FyZFgpIHx8IGlzTmFOKG5ld0JvYXJkWSkpIHtcbiAgICAgICAgdGhpcy5pbmZvLnRleHRDb250ZW50ID0gXCJQbGVhc2UgZW50ZXIgb25seSBudW1iZXJzLlwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG5ld0JvYXJkWCA8IDIgfHwgbmV3Qm9hcmRYID4gMTAgfHwgbmV3Qm9hcmRZIDwgMiB8fCBuZXdCb2FyZFkgPiAxMCkge1xuICAgICAgICB0aGlzLmluZm8udGV4dENvbnRlbnQgPSBcIlBsZWFzZSBlbnRlciBudW1iZXJzIGJldHdlZW4gMiBhbmQgMTAuXCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoKG5ld0JvYXJkWCAqIG5ld0JvYXJkWSkgJSAyICE9PSAwKSB7XG4gICAgICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiVGhlIGFtb3VudCBvZiBicmlja3MgbXVzdCBiZSBldmVuLlwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5ib2FyZFggPSBuZXdCb2FyZFg7XG4gICAgdGhpcy5ib2FyZFkgPSBuZXdCb2FyZFk7XG5cbiAgICB3aGlsZSAodGhpcy5ib2FyZC5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5ib2FyZC5yZW1vdmVDaGlsZCh0aGlzLmJvYXJkLmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmluZm8udGV4dENvbnRlbnQgPSBcIlwiO1xuXG4gICAgdGhpcy5pbml0aWFsaXplQm9hcmQoKTtcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUuaW5pdGlhbGl6ZUJvYXJkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuYm9hcmQuc3R5bGUud2lkdGggPSAoNDggKiB0aGlzLmJvYXJkWCkgKyBcInB4XCI7XG4gICAgdGhpcy5ib2FyZC5zdHlsZS5oZWlnaHQgPSAoNDggKiB0aGlzLmJvYXJkWSkgKyBcInB4XCI7XG5cbiAgICB0aGlzLnRvdGFsQnJpY2tzID0gdGhpcy5ib2FyZFggKiB0aGlzLmJvYXJkWTtcbiAgICB0aGlzLnJlbW92ZWRCcmlja3MgPSAwO1xuICAgIHRoaXMubW92ZXMgPSAwO1xuICAgIHRoaXMuYnJpY2tzID0gW107XG5cbiAgICB2YXIgaTtcbiAgICB2YXIgY291bnQgPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnRvdGFsQnJpY2tzOyBpICs9IDIpIHtcbiAgICAgICAgdGhpcy5icmlja3NbaV0gPSBjb3VudCAlIDg7XG4gICAgICAgIHRoaXMuYnJpY2tzW2kgKyAxXSA9IGNvdW50ICUgODtcbiAgICAgICAgY291bnQgPSBjb3VudCA9PSA3ID8gY291bnQgPSAwIDogY291bnQgKz0gMTtcbiAgICB9XG5cbiAgICAvLyBGaXNoZXItWWF0ZXNcbiAgICBmb3IgKGkgPSB0aGlzLnRvdGFsQnJpY2tzIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICB2YXIgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgICB2YXIgayA9IHRoaXMuYnJpY2tzW2pdO1xuICAgICAgICB0aGlzLmJyaWNrc1tqXSA9IHRoaXMuYnJpY2tzW2ldO1xuICAgICAgICB0aGlzLmJyaWNrc1tpXSA9IGs7XG4gICAgfVxuXG4gICAgdGhpcy5icmlja3MuZm9yRWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJyaWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICAgICAgYnJpY2suY2xhc3NMaXN0LmFkZChcIm1lbW9yeS1icmlja1wiKTtcbiAgICAgICAgYnJpY2suc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiL2ltYWdlL2hpZGRlbi5wbmdcIik7XG5cbiAgICAgICAgX3RoaXMuYm9hcmQuYXBwZW5kQ2hpbGQoYnJpY2spO1xuICAgIH0pO1xufTtcblxuTWVtb3J5LnByb3RvdHlwZS5yZXZlYWxCcmljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIGJyaWNrID0gZXZlbnQudGFyZ2V0O1xuICAgIHZhciBwYXJlbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRCcmljayAmJiBicmljayA9PT0gdGhpcy5zZWxlY3RlZEJyaWNrLmJyaWNrRWxlbSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGJyaWNrID09PSBwYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBpbmRleCA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwocGFyZW50LmNoaWxkcmVuLCBicmljayk7XG5cbiAgICBicmljay5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvXCIgKyB0aGlzLmJyaWNrc1tpbmRleF0gKyBcIi5wbmdcIik7XG5cbiAgICBpZiAoIXRoaXMuc2VsZWN0ZWRCcmljaykge1xuICAgICAgICB0aGlzLnNlbGVjdGVkQnJpY2sgPSB7YnJpY2tFbGVtOiBicmljaywgdmFsdWU6IHRoaXMuYnJpY2tzW2luZGV4XX07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jaGVja01hdGNoKHticmlja0VsZW06IGJyaWNrLCB2YWx1ZTogdGhpcy5icmlja3NbaW5kZXhdfSlcbiAgICB9XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLmNoZWNrTWF0Y2ggPSBmdW5jdGlvbihicmljaykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLmJvYXJkLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmJvdW5kUmV2ZWFsKTtcblxuICAgIGlmIChicmljay52YWx1ZSA9PT0gdGhpcy5zZWxlY3RlZEJyaWNrLnZhbHVlKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBicmljay5icmlja0VsZW0uY2xhc3NMaXN0LmFkZChcInJlbW92ZWRcIik7XG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrLmJyaWNrRWxlbS5jbGFzc0xpc3QuYWRkKFwicmVtb3ZlZFwiKTtcblxuICAgICAgICAgICAgX3RoaXMucmVtb3ZlZEJyaWNrcyArPSAyO1xuXG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrID0gbnVsbDtcbiAgICAgICAgICAgIF90aGlzLmJvYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfdGhpcy5ib3VuZFJldmVhbCk7XG5cbiAgICAgICAgICAgIGlmIChfdGhpcy5yZW1vdmVkQnJpY2tzID09PSBfdGhpcy50b3RhbEJyaWNrcykge1xuICAgICAgICAgICAgICAgIF90aGlzLmVuZEdhbWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJyaWNrLmJyaWNrRWxlbS5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvaGlkZGVuLnBuZ1wiKTtcbiAgICAgICAgICAgIF90aGlzLnNlbGVjdGVkQnJpY2suYnJpY2tFbGVtLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9oaWRkZW4ucG5nXCIpO1xuXG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrID0gbnVsbDtcbiAgICAgICAgICAgIF90aGlzLmJvYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfdGhpcy5ib3VuZFJldmVhbCk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH1cblxuICAgIHRoaXMubW92ZXMgKz0gMTtcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUuZW5kR2FtZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiWW91IHdvbiEgTW92ZXMgdGFrZW46IFwiICsgdGhpcy5tb3Zlcztcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUuZ2V0QXBwQ29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmFwcENvbnRlbnQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbW9yeTtcbiIsImZ1bmN0aW9uIE5vdGVib29rKCkge1xuICAgIHRoaXMubm90ZUFycmF5ID0gW3tuYW1lOiBcInRlc3RcIiwgY29udGVudDpcIlRoaXMgaXMgYSB0ZXN0IG5vdGVcIn1dO1xuXG4gICAgdGhpcy5ldmVudCA9IG5ldyBFdmVudChcInJlZnJlc2hcIik7XG5cbiAgICB0aGlzLm1lbnVJdGVtcyA9IFtcbiAgICAgICAge25hbWU6IFwiTmV3XCIsIGV2ZW50SGFuZGxlcjogdGhpcy5uZXdOb3RlLmJpbmQodGhpcyl9LFxuICAgICAgICB7bmFtZTogXCJTYXZlXCIsIGV2ZW50SGFuZGxlcjogdGhpcy5zYXZlTm90ZS5iaW5kKHRoaXMpfSxcbiAgICAgICAge25hbWU6IFwiTG9hZFwiLCBldmVudEhhbmRsZXI6IHRoaXMubG9hZFNjcmVlbi5iaW5kKHRoaXMpfVxuICAgIF07XG5cbiAgICB0aGlzLmltYWdlU3JjID0gXCJkaWFyeVwiO1xuXG4gICAgdGhpcy5zdGF0ZSA9IFwibmV3XCI7XG5cbiAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnROZXcoKTtcbn1cblxuTm90ZWJvb2sucHJvdG90eXBlLmNyZWF0ZUFwcENvbnRlbnROZXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25vdGVib29rLXRlbXBsYXRlLW5ld1wiKTtcbiAgICB2YXIgYXBwQ29udGVudCA9IGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5hcHAtY29udGVudFwiKTtcblxuICAgIHJldHVybiBhcHBDb250ZW50O1xufTtcblxuTm90ZWJvb2sucHJvdG90eXBlLmNyZWF0ZUFwcENvbnRlbnRTYXZlZE5vdGUgPSBmdW5jdGlvbihub3RlTmFtZSkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbm90ZWJvb2stdGVtcGxhdGUtbmV3XCIpO1xuICAgIHZhciBhcHBDb250ZW50ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250ZW50XCIpO1xuXG4gICAgdmFyIG5vdGUgPSB0aGlzLmdldE5vdGUobm90ZU5hbWUpO1xuXG4gICAgaWYgKG5vdGUpIHtcbiAgICAgICAgYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLm5vdGVcIikudmFsdWUgPSBub3RlLmNvbnRlbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFwcENvbnRlbnQ7XG59O1xuXG5Ob3RlYm9vay5wcm90b3R5cGUubmV3Tm90ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKFwibmV3XCIpO1xuXG4gICAgdGhpcy5zdGF0ZSA9IFwibmV3XCI7XG5cbiAgICB0aGlzLmFwcENvbnRlbnQucGFyZW50Tm9kZS5kaXNwYXRjaEV2ZW50KHRoaXMuZXZlbnQpO1xufTtcblxuTm90ZWJvb2sucHJvdG90eXBlLnNhdmVOb3RlID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coXCJzYXZlXCIpO1xuXG4gICAgaWYgKHRoaXMuc3RhdGUgPT09IFwibmV3XCIpIHtcbiAgICAgICAgdmFyIG5hbWUgPSBwcm9tcHQoXCJQbGVhc2UgZW50ZXIgYSBuYW1lOiBcIiwgXCJVbnRpdGxlZFwiKTtcblxuICAgICAgICBpZiAoIW5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmdldE5vdGUobmFtZSkpIHtcbiAgICAgICAgICAgIGFsZXJ0KFwiTmFtZSBhbHJlYWR5IHRha2VuLlwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubm90ZUFycmF5LnB1c2goe25hbWU6IG5hbWUsIGNvbnRlbnQ6IHRoaXMuYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLm5vdGVcIikudmFsdWV9KTtcblxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IG5hbWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmdldE5vdGUodGhpcy5zdGF0ZSkuY29udGVudCA9IHRoaXMuYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLm5vdGVcIikudmFsdWU7XG4gICAgfVxufTtcblxuTm90ZWJvb2sucHJvdG90eXBlLmxvYWRTY3JlZW4gPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZyhcImxvYWRcIik7XG5cbiAgICB0aGlzLnN0YXRlID0gXCJsb2FkXCI7XG5cbiAgICB0aGlzLmFwcENvbnRlbnQucGFyZW50Tm9kZS5kaXNwYXRjaEV2ZW50KHRoaXMuZXZlbnQpO1xufTtcblxuTm90ZWJvb2sucHJvdG90eXBlLmxvYWROb3RlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB0aGlzLnN0YXRlID0gZXZlbnQudGFyZ2V0LnRleHRDb250ZW50ICsgXCJcIjtcblxuICAgIHRoaXMuYXBwQ29udGVudC5wYXJlbnROb2RlLmRpc3BhdGNoRXZlbnQodGhpcy5ldmVudCk7XG59O1xuXG5Ob3RlYm9vay5wcm90b3R5cGUuZGVsZXRlTm90ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIG5hbWUgPSBldmVudC50YXJnZXQudGV4dENvbnRlbnQgKyBcIlwiO1xuXG4gICAgdGhpcy5ub3RlQXJyYXkgPSB0aGlzLm5vdGVBcnJheS5zbGljZSh0aGlzLm5vdGVBcnJheS5pbmRleE9mKHRoaXMuZ2V0Tm90ZShuYW1lKSksIDEpO1xuXG4gICAgdGhpcy5hcHBDb250ZW50LnBhcmVudE5vZGUuZGlzcGF0Y2hFdmVudCh0aGlzLmV2ZW50KTtcbn07XG5cbk5vdGVib29rLnByb3RvdHlwZS5jcmVhdGVBcHBDb250ZW50TG9hZE1lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25vdGVib29rLXRlbXBsYXRlLWxvYWRcIik7XG4gICAgdmFyIGFwcENvbnRlbnQgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5ub3RlQXJyYXkuZm9yRWFjaChmdW5jdGlvbihub3RlKSB7XG4gICAgICAgIHZhciBpdGVtVGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25vdGVib29rLWxpc3RpdGVtLXRlbXBsYXRlXCIpO1xuICAgICAgICB2YXIgaXRlbSA9IGRvY3VtZW50LmltcG9ydE5vZGUoaXRlbVRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIubm90ZWJvb2stbGlzdGl0ZW1cIik7XG5cbiAgICAgICAgaXRlbS5xdWVyeVNlbGVjdG9yKFwiLml0ZW0tbmFtZVwiKS50ZXh0Q29udGVudCA9IG5vdGUubmFtZTtcblxuICAgICAgICBpdGVtLnF1ZXJ5U2VsZWN0b3IoXCIuaXRlbS1uYW1lXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfdGhpcy5sb2FkTm90ZS5iaW5kKF90aGlzKSk7XG5cbiAgICAgICAgaXRlbS5xdWVyeVNlbGVjdG9yKFwiLmRlbGV0ZS1pdGVtXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfdGhpcy5kZWxldGVOb3RlLmJpbmQoX3RoaXMpKTtcblxuICAgICAgICBhcHBDb250ZW50LmFwcGVuZENoaWxkKGl0ZW0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGFwcENvbnRlbnQ7XG59O1xuXG5Ob3RlYm9vay5wcm90b3R5cGUuZ2V0Tm90ZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgcmVzdWx0Tm90ZSA9IG51bGw7XG5cbiAgICB0aGlzLm5vdGVBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKG5vdGUpIHtcbiAgICAgICAgaWYgKG5vdGUubmFtZSA9PT0gbmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0Tm90ZSA9IG5vdGU7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHROb3RlO1xufTtcblxuTm90ZWJvb2sucHJvdG90eXBlLmdldEFwcENvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gXCJuZXdcIikge1xuICAgICAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnROZXcoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hcHBDb250ZW50O1xuICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZSA9PT0gXCJsb2FkXCIpIHtcbiAgICAgICAgdGhpcy5hcHBDb250ZW50ID0gdGhpcy5jcmVhdGVBcHBDb250ZW50TG9hZE1lbnUoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hcHBDb250ZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYXBwQ29udGVudCA9IHRoaXMuY3JlYXRlQXBwQ29udGVudFNhdmVkTm90ZSh0aGlzLnN0YXRlKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hcHBDb250ZW50O1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTm90ZWJvb2s7XG4iLCIvLyBBcHAgY29udHJvbHMgdGhlIFVJIGFuZCBpcyByZXNwb25zaWJsZSBmb3IgY3JlYXRpbmcgbmV3IGFwcCBpbnN0YW5jZXMuIEFkZGluZyBuZXcgYXBwc1xuLy8gdG8gdGhlIFBlcnNvbmFsIFdlYiBEZXNrdG9wIHNob3VsZCBiZSBhcyBlYXN5IGFzIGltcG9ydGluZyBpdCBpbiBhcHAuanMgYW5kIGNyZWF0aW5nIGl0LlxuXG4vLyBUaGUgYXBwcyBmb2xsb3cgdGhlIHNhbWUgc3RydWN0dXJlOlxuLy8gVGhleSBhbGwgY29udGFpbiBhIGZ1bmN0aW9uIGNhbGxlZCBnZXRBcHBDb250ZW50LCB3aGljaCByZXR1cm5zIHRoZSBkaXYgdGhhdCBuZWVkcyB0b1xuLy8gYmUgYXR0YWNoZWQgdG8gdGhlIGFwcCB3aW5kb3cncyBhcHAgY29udGFpbmVyLiBGb3IgYXBwc1xuXG4oZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAvLyBJbml0aWFsaXplIHRoZSBkZXNrdG9wLlxuICAgIHZhciBEZXNrdG9wID0gcmVxdWlyZShcIi4vRGVza3RvcFwiKTtcbiAgICB2YXIgZGVza3RvcCA9IG5ldyBEZXNrdG9wKCk7XG5cbiAgICAvLyBJbXBvcnQgdGhlIG5lY2Vzc2FyeSBhcHBzLlxuICAgIHZhciBOb3RlYm9vayA9IHJlcXVpcmUoXCIuL05vdGVib29rXCIpO1xuICAgIHZhciBNZW1vcnkgPSByZXF1aXJlKFwiLi9NZW1vcnlcIik7XG4gICAgdmFyIENoYXQgPSByZXF1aXJlKFwiLi9DaGF0XCIpO1xuXG4gICAgdmFyIG5ld05vdGVib29rV2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuZXdfbm90ZWJvb2tcIik7XG4gICAgdmFyIG5ld0NoYXRXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19jaGF0XCIpO1xuICAgIHZhciBuZXdNZW1vcnlXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19tZW1vcnlcIik7XG5cbiAgICBuZXdOb3RlYm9va1dpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRlc2t0b3AuYXR0YWNoV2luZG93KG5ldyBOb3RlYm9vaygpKTtcbiAgICB9KTtcblxuICAgIG5ld0NoYXRXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIWRlc2t0b3AuaW5zdGFuY2VzLmNoYXQpIHtcbiAgICAgICAgICAgIGlmICghZGVza3RvcC51c2VybmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciB1c2VyID0gcHJvbXB0KFwiUGxlYXNlIGVudGVyIGEgdXNlcm5hbWU6XCIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ1c2VybmFtZVwiLCB1c2VyKTtcblxuICAgICAgICAgICAgICAgICAgICBkZXNrdG9wLnVzZXJuYW1lID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZXNrdG9wLmluc3RhbmNlcy5jaGF0ID0gbmV3IENoYXQoZGVza3RvcC51c2VybmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBkZXNrdG9wLmF0dGFjaFdpbmRvdyhkZXNrdG9wLmluc3RhbmNlcy5jaGF0KTtcbiAgICB9KTtcblxuICAgIG5ld01lbW9yeVdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRlc2t0b3AuYXR0YWNoV2luZG93KG5ldyBNZW1vcnkoNCwgNCkpO1xuICAgIH0pO1xufSkoKTtcbiJdfQ==
