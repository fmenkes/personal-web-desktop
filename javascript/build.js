(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function AppWindow(width, height) {
    this.app = null;

    this.div = this.createWindow(width, height);

    this.toolbar = this.div.querySelector(".toolbar");

    this.menuIcon = this.div.querySelector(".toolbar-icon");

    this.menuTitle = this.div.querySelector(".toolbar-title");

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

    if (app.title !== "") {
        this.menuTitle.textContent = app.title;
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

        menuItem.addEventListener("click", item.eventHandler, true);

        _this.dropdown.appendChild(menuItem);
    });
};

AppWindow.prototype.refreshApp = function() {
    while (this.appContainer.hasChildNodes()) {
        this.appContainer.removeChild(this.appContainer.firstElementChild);
    }

    this.menuTitle.textContent = this.app.title;

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
    this.title = "Webchat";

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
    appWindow.div.addEventListener("mousedown", this.giveFocus.bind(this));

    appWindow.div.addEventListener("click", function() {
        if (!appWindow.dropdown.classList.contains("removed") && !event.target.classList.contains("toolbar-icon")) {
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

    //event.stopPropagation();
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
    this.imageSrc = "puzzle";
    this.title = "Memory";

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
    //this.noteArray = [{name: "test", content:"This is a test note"}];

    this.noteArray = JSON.parse(localStorage.getItem("notes"));

    this.event = new Event("refresh");

    this.menuItems = [
        {name: "New", eventHandler: this.newNote.bind(this)},
        {name: "Save", eventHandler: this.saveNote.bind(this)},
        {name: "Load", eventHandler: this.loadScreen.bind(this)}
    ];

    this.imageSrc = "diary";
    this.title = "Untitled";

    this.state = "new";

    this.appContent = this.createAppContentNew();
}

Notebook.prototype.createAppContentNew = function() {
    var template = document.querySelector("#notebook-template-new");
    return document.importNode(template.content, true).querySelector(".app-content");
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
    this.title = "Untitled";

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.saveNote = function() {
    console.log("save");

    if (this.state === "load") {
        return;
    }

    if (this.state === "new") {
        var name = prompt("Please enter a name: ");

        if (name === null) {
            return;
        }

        if (this.getNote(name)) {
            alert("Name already taken.");
        } else if (name === "Untitled" || name === "") {
            alert("Please give your note a name.");
        } else {
            this.noteArray.push({name: name, content: this.appContent.querySelector(".note").value});

            localStorage.setItem("notes", JSON.stringify(this.noteArray));

            this.state = name;
            this.title = name;

            this.appContent.parentNode.dispatchEvent(this.event);
        }
    } else {
        this.getNote(this.state).content = this.appContent.querySelector(".note").value;
    }
};

Notebook.prototype.loadScreen = function() {
    console.log("load");

    this.state = "load";
    this.title = "Load";

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.loadNote = function(event) {
    this.state = event.currentTarget.dataset.noteName;
    this.title = event.currentTarget.dataset.noteName;

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.deleteNote = function(event) {
    event.stopPropagation();

    var name = event.target.dataset.noteName;
    var note = this.getNote(name);

    if (note) {
        this.noteArray.splice(this.noteArray.indexOf(note), 1);
        localStorage.setItem("notes", JSON.stringify(this.noteArray));
    }

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.createAppContentLoadMenu = function() {
    var template = document.querySelector("#notebook-template-load");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    var _this = this;

    this.noteArray.forEach(function(note) {
        var itemTemplate = document.querySelector("#notebook-listitem-template");
        var item = document.importNode(itemTemplate.content, true).querySelector(".notebook-listitem");

        item.setAttribute("data-note-name", note.name);

        item.querySelector(".item-name").textContent = note.name;

        item.querySelector(".delete-item").setAttribute("data-note-name", note.name);

        item.addEventListener("click", _this.loadNote.bind(_this));

        item.querySelector(".delete-item").addEventListener("click", _this.deleteNote.bind(_this));

        appContent.querySelector(".notelist").appendChild(item);
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
        if (!localStorage.getItem("notes")) {
            localStorage.setItem("notes", JSON.stringify([{name: "Welcome", content: "Welcome to the Notebook app!"}]));
        }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQXBwV2luZG93LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9DaGF0LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9EZXNrdG9wLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9NZW1vcnkuanMiLCJjbGllbnQvc291cmNlL2pzL05vdGVib29rLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9hcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gQXBwV2luZG93KHdpZHRoLCBoZWlnaHQpIHtcbiAgICB0aGlzLmFwcCA9IG51bGw7XG5cbiAgICB0aGlzLmRpdiA9IHRoaXMuY3JlYXRlV2luZG93KHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgdGhpcy50b29sYmFyID0gdGhpcy5kaXYucXVlcnlTZWxlY3RvcihcIi50b29sYmFyXCIpO1xuXG4gICAgdGhpcy5tZW51SWNvbiA9IHRoaXMuZGl2LnF1ZXJ5U2VsZWN0b3IoXCIudG9vbGJhci1pY29uXCIpO1xuXG4gICAgdGhpcy5tZW51VGl0bGUgPSB0aGlzLmRpdi5xdWVyeVNlbGVjdG9yKFwiLnRvb2xiYXItdGl0bGVcIik7XG5cbiAgICB0aGlzLmRyb3Bkb3duID0gdGhpcy5kaXYucXVlcnlTZWxlY3RvcihcIi50b29sYmFyLWRyb3Bkb3duXCIpO1xuXG4gICAgdGhpcy5jbG9zZVdpbmRvdyA9IHRoaXMuZGl2LnF1ZXJ5U2VsZWN0b3IoXCIuY2xvc2Utd2luZG93XCIpO1xuXG4gICAgdGhpcy5hcHBDb250YWluZXIgPSB0aGlzLmRpdi5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250YWluZXJcIik7XG59XG5cbkFwcFdpbmRvdy5wcm90b3R5cGUuY3JlYXRlV2luZG93ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN3aW5kb3ctdGVtcGxhdGVcIik7XG4gICAgcmV0dXJuIGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5hcHAtd2luZG93XCIpO1xufTtcblxuQXBwV2luZG93LnByb3RvdHlwZS5hdHRhY2hBcHAgPSBmdW5jdGlvbihhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcblxuICAgIHdoaWxlICh0aGlzLmFwcENvbnRhaW5lci5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5hcHBDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5hcHBDb250YWluZXIuZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIGlmIChhcHAuaW1hZ2VTcmMgIT09IFwiXCIpIHtcbiAgICAgICAgdGhpcy5tZW51SWNvbi5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCJpbWFnZS9cIiArIGFwcC5pbWFnZVNyYyArIFwiLnBuZ1wiKTtcbiAgICB9XG5cbiAgICBpZiAoYXBwLnRpdGxlICE9PSBcIlwiKSB7XG4gICAgICAgIHRoaXMubWVudVRpdGxlLnRleHRDb250ZW50ID0gYXBwLnRpdGxlO1xuICAgIH1cblxuICAgIGlmIChhcHAubWVudUl0ZW1zKSB7XG4gICAgICAgIHRoaXMuYXR0YWNoTWVudSgpO1xuICAgIH1cblxuICAgIHRoaXMuYXBwQ29udGFpbmVyLmFwcGVuZENoaWxkKGFwcC5nZXRBcHBDb250ZW50KCkpO1xufTtcblxuQXBwV2luZG93LnByb3RvdHlwZS5hdHRhY2hNZW51ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZHJvcGRvd24tdGVtcGxhdGVcIik7XG5cbiAgICB0aGlzLmFwcC5tZW51SXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHZhciBtZW51SXRlbSA9IGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5kcm9wZG93bi1pdGVtXCIpO1xuXG4gICAgICAgIG1lbnVJdGVtLnF1ZXJ5U2VsZWN0b3IoXCIuZHJvcGRvd24tbmFtZVwiKS50ZXh0Q29udGVudCA9IGl0ZW0ubmFtZTtcblxuICAgICAgICBtZW51SXRlbS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaXRlbS5ldmVudEhhbmRsZXIsIHRydWUpO1xuXG4gICAgICAgIF90aGlzLmRyb3Bkb3duLmFwcGVuZENoaWxkKG1lbnVJdGVtKTtcbiAgICB9KTtcbn07XG5cbkFwcFdpbmRvdy5wcm90b3R5cGUucmVmcmVzaEFwcCA9IGZ1bmN0aW9uKCkge1xuICAgIHdoaWxlICh0aGlzLmFwcENvbnRhaW5lci5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5hcHBDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5hcHBDb250YWluZXIuZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIHRoaXMubWVudVRpdGxlLnRleHRDb250ZW50ID0gdGhpcy5hcHAudGl0bGU7XG5cbiAgICB0aGlzLmFwcENvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmFwcC5nZXRBcHBDb250ZW50KCkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcHBXaW5kb3c7XG4iLCIvKipcbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuXG5mdW5jdGlvbiBDaGF0KHVzZXJuYW1lKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMubGFzdExpbmVzID0gW107XG5cbiAgICB0aGlzLmltYWdlU3JjID0gXCJjaGF0XCI7XG4gICAgdGhpcy50aXRsZSA9IFwiV2ViY2hhdFwiO1xuXG4gICAgdGhpcy5kZWZhdWx0VGl0bGUgPSBkb2N1bWVudC50aXRsZTtcbiAgICB0aGlzLnVzZXJuYW1lID0gdXNlcm5hbWU7XG5cbiAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnQoKTtcbiAgICB0aGlzLmNoYXRMaW5lcyA9IHRoaXMuYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtbGluZXNcIik7XG4gICAgdGhpcy5hcGlLZXkgPSBcImVEQkU3NmRlVTdMMEg5bUVCZ3hVS1ZSMFZDbnEwWEJkXCI7XG4gICAgdGhpcy5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KFwid3M6Ly92aG9zdDMubG51LnNlOjIwMDgwL3NvY2tldC9cIik7XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCB0aGlzLmhhbmRsZVZpc2liaWxpdHlDaGFuZ2UuYmluZCh0aGlzKSk7XG5cbiAgICAvLyBUT0RPOiBNYWtlIHN1cmUgdGhlIHNvY2tldCBvcGVucyBiZWZvcmUgdGhlIHVzZXIgY2FuIHNlbmQgbWVzc2FnZXNcblxuICAgIHRoaXMuc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGV2ZW50LmRhdGEpO1xuXG4gICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcblxuICAgICAgICBpZiAobWVzc2FnZS50eXBlICE9IFwiaGVhcnRiZWF0XCIpIHtcbiAgICAgICAgICAgIF90aGlzLmFwcGVuZExpbmUobWVzc2FnZS51c2VybmFtZSwgbWVzc2FnZS5kYXRhKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5DaGF0LnByb3RvdHlwZS5jcmVhdGVBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gVE9ETzogYmV0dGVyIHdheSBvZiBkb2luZyB0aGlzIHRoYW4gdGVtcGxhdGVzP1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY2hhdC10ZW1wbGF0ZVwiKTtcblxuICAgIHZhciBhcHBDb250ZW50ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250ZW50XCIpO1xuXG4gICAgdGhpcy5hdHRhY2hFdmVudExpc3RlbmVycyhhcHBDb250ZW50KTtcblxuICAgIHJldHVybiBhcHBDb250ZW50O1xufTtcblxuQ2hhdC5wcm90b3R5cGUuYXR0YWNoRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbihhcHBDb250ZW50KSB7XG4gICAgdmFyIGNoYXRGb3JtID0gYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtZm9ybVwiKTtcbiAgICB2YXIgdGV4dEFyZWEgPSBjaGF0Rm9ybS5xdWVyeVNlbGVjdG9yKFwidGV4dGFyZWFcIik7XG5cbiAgICB0ZXh0QXJlYS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZVRleHRJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAvL3RleHRBcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCB0aGlzLmhhbmRsZUZvY3VzLmJpbmQodGhpcykpO1xufTtcblxuQ2hhdC5wcm90b3R5cGUuaGFuZGxlVGV4dElucHV0ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZiAoIWV2ZW50LnNoaWZ0S2V5ICYmIGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC52YWx1ZS5jaGFyQXQoMCkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUNvbW1hbmQoZXZlbnQudGFyZ2V0LnZhbHVlLnNsaWNlKDEpKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC50YXJnZXQudmFsdWUgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZE1lc3NhZ2UoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV2ZW50LnRhcmdldC52YWx1ZSA9IFwiXCI7XG4gICAgfVxufTtcblxuQ2hhdC5wcm90b3R5cGUuaGFuZGxlQ29tbWFuZCA9IGZ1bmN0aW9uKGNvbW1hbmQpIHtcbiAgICB2YXIgY29tbWFuZEtleXdvcmQgPSBjb21tYW5kLnNwbGl0KFwiIFwiKVswXTtcbiAgICB2YXIgY29tbWFuZFBhcmFtZXRlcnMgPSBudWxsO1xuXG4gICAgaWYgKGNvbW1hbmQuc3BsaXQoXCIgXCIpLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY29tbWFuZFBhcmFtZXRlcnMgPSBjb21tYW5kLnN1YnN0cihjb21tYW5kLmluZGV4T2YoXCIgXCIpICsgMSwgY29tbWFuZC5sZW5ndGgpO1xuICAgIH1cblxuICAgIHN3aXRjaCAoY29tbWFuZEtleXdvcmQpIHtcbiAgICAgICAgY2FzZSBcIm5hbWVcIjpcbiAgICAgICAgICAgIGlmIChjb21tYW5kUGFyYW1ldGVycykge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgPSBjb21tYW5kUGFyYW1ldGVycztcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInVzZXJuYW1lXCIsIGNvbW1hbmRQYXJhbWV0ZXJzKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kTGluZShcIlBXRFwiLCBcIllvdXIgdXNlcm5hbWUgaXMgbm93IFwiICsgY29tbWFuZFBhcmFtZXRlcnMgKyBcIi5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kTGluZShcIlBXRFwiLCBcIlBsZWFzZSBlbnRlciBhIHVzZXJuYW1lLlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aGlzLmFwcGVuZExpbmUoXCJQV0RcIiwgY29tbWFuZEtleXdvcmQgKyBcIiBjb21tYW5kIG5vdCB5ZXQgaW1wbGVtZW50ZWQuXCIpO1xuICAgIH1cbn07XG5cbkNoYXQucHJvdG90eXBlLmhhbmRsZVZpc2liaWxpdHlDaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIWRvY3VtZW50LmhpZGRlbikge1xuICAgICAgICBkb2N1bWVudC50aXRsZSA9IHRoaXMuZGVmYXVsdFRpdGxlO1xuICAgIH1cbn07XG5cbkNoYXQucHJvdG90eXBlLmFwcGVuZExpbmUgPSBmdW5jdGlvbih1c2VybmFtZSwgbGluZSkge1xuICAgIHRoaXMubGFzdExpbmVzLnB1c2goe3VzZXJuYW1lOiB1c2VybmFtZSwgbGluZTogbGluZX0pO1xuXG4gICAgaWYgKHRoaXMubGFzdExpbmVzLmxlbmd0aCA+IDIwKSB7XG4gICAgICAgIHRoaXMubGFzdExpbmVzLnNoaWZ0KCk7XG4gICAgfVxuXG4gICAgaWYgKGRvY3VtZW50LmhpZGRlbikge1xuICAgICAgICB2YXIgYXVkaW8gPSB0aGlzLmFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcImF1ZGlvXCIpO1xuXG4gICAgICAgIGF1ZGlvLnBsYXkoKTtcblxuICAgICAgICBkb2N1bWVudC50aXRsZSA9IFwiKiBcIiArIHRoaXMuZGVmYXVsdFRpdGxlO1xuICAgIH1cblxuICAgIHRoaXMuY29udmVydExpbmVzVG9IVE1MKCk7XG59O1xuXG5DaGF0LnByb3RvdHlwZS5jb252ZXJ0TGluZXNUb0hUTUwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY2hhdC1saW5lLXRlbXBsYXRlXCIpO1xuICAgIHZhciBjaGF0TGluZSA9IGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5jaGF0LW1lc3NhZ2VcIik7XG5cbiAgICB3aGlsZSAodGhpcy5jaGF0TGluZXMuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIHRoaXMuY2hhdExpbmVzLnJlbW92ZUNoaWxkKHRoaXMuY2hhdExpbmVzLmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmxhc3RMaW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUsIGluZGV4KSB7XG4gICAgICAgIHZhciBvcmRlciA9IF90aGlzLmxhc3RMaW5lcy5sZW5ndGggLSBpbmRleDtcbiAgICAgICAgdmFyIG5ld0xpbmUgPSBjaGF0TGluZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIG5ld0xpbmUucXVlcnlTZWxlY3RvcihcIi51c2VybmFtZVwiKS50ZXh0Q29udGVudCA9IGxpbmUudXNlcm5hbWU7XG4gICAgICAgIG5ld0xpbmUucXVlcnlTZWxlY3RvcihcIi5jaGF0LWxpbmVcIikudGV4dENvbnRlbnQgPSBsaW5lLmxpbmU7XG5cbiAgICAgICAgbmV3TGluZS5zdHlsZS5vcmRlciA9IG9yZGVyO1xuXG4gICAgICAgIF90aGlzLmNoYXRMaW5lcy5hcHBlbmRDaGlsZChuZXdMaW5lKTtcbiAgICB9KTtcblxuICAgIHRoaXMucHVibGlzaE1lc3NhZ2VzKCk7XG59O1xuXG5DaGF0LnByb3RvdHlwZS5wdWJsaXNoTWVzc2FnZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciBmb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG5cbiAgICBmb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jaGF0XCIpLCBmdW5jdGlvbihjaGF0V2luKSB7XG4gICAgICAgIHZhciBuZXdDaGF0ID0gX3RoaXMuY2hhdExpbmVzLmNsb25lTm9kZSh0cnVlKTtcblxuICAgICAgICBjaGF0V2luLnJlbW92ZUNoaWxkKGNoYXRXaW4ucXVlcnlTZWxlY3RvcihcIi5jaGF0LWxpbmVzXCIpKTtcblxuICAgICAgICBjaGF0V2luLmluc2VydEJlZm9yZShuZXdDaGF0LCBjaGF0V2luLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1mb3JtXCIpKTtcbiAgICB9KTtcbn07XG5cbkNoYXQucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIHZhciBkYXRhID0ge307XG5cbiAgICBkYXRhLnVzZXJuYW1lID0gdGhpcy51c2VybmFtZTtcbiAgICBkYXRhLmRhdGEgPSBtZXNzYWdlO1xuICAgIGRhdGEua2V5ID0gdGhpcy5hcGlLZXk7XG4gICAgZGF0YS50eXBlID0gXCJtZXNzYWdlXCI7XG5cbiAgICB0aGlzLnNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcblxuICAgIC8vIG9mZmxpbmUgY2FwYWJpbGl0aWVzIFRPRE86IHVzZSB0aGlzIGFzIGEgZmFsbGJhY2s/XG4gICAgLy90aGlzLmFwcGVuZExpbmUodGhpcy51c2VybmFtZSwgbWVzc2FnZSk7XG59O1xuXG5DaGF0LnByb3RvdHlwZS5nZXRBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gQ2xvbmluZyBkb2VzIG5vdCBhdHRhY2ggZXZlbnQgbGlzdGVuZXJzLCBzbyB3ZSBoYXZlIHRvIGRvIGl0IGFmdGVyd2FyZHNcblxuICAgIHZhciBjb250ZW50ID0gdGhpcy5hcHBDb250ZW50LmNsb25lTm9kZSh0cnVlKTtcblxuICAgIHRoaXMuYXR0YWNoRXZlbnRMaXN0ZW5lcnMoY29udGVudCk7XG5cbiAgICByZXR1cm4gY29udGVudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhdDtcbiIsInZhciBBcHBXaW5kb3cgPSByZXF1aXJlKFwiLi9BcHBXaW5kb3dcIik7XG5cbi8qKlxuICogRGVza3RvcCBvYmplY3Qgd2hpY2ggY29udGFpbnMgYWxsIHRoZSBBcHBXaW5kb3cgb2JqZWN0cyBhbG9uZyB3aXRoIHNldHRpbmdzLlxuICovXG5mdW5jdGlvbiBEZXNrdG9wKCkge1xuICAgIHRoaXMud2luZG93cyA9IFtdO1xuXG4gICAgdGhpcy51c2VybmFtZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidXNlcm5hbWVcIik7XG5cbiAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjd2luZG93X2NvbnRhaW5lclwiKTtcblxuICAgIHRoaXMuc2V0dGluZ3MgPSB7XG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJhenVyZVwiLFxuICAgICAgICB3aWR0aDogMjAwLFxuICAgICAgICBoZWlnaHQ6IDMwMFxuICAgIH07XG5cbiAgICAvLyBUaGUgb2JqZWN0IHRoYXQgY29udGFpbnMgYXBwcyB0aGF0IHNob3VsZCBvbmx5IGhhdmUgb25lIGluc3RhbmNlIGFjcm9zcyB0aGUgZGVza3RvcCAoZS5nLiBjaGF0KS5cbiAgICB0aGlzLmluc3RhbmNlcyA9IHtcblxuICAgIH07XG5cbiAgICB0aGlzLm1vdmluZ1dpbmRvdyA9IG51bGw7XG4gICAgdGhpcy50b3BaSW5kZXggPSAxO1xuXG4gICAgdGhpcy5kaXN0YW5jZSA9IHtcbiAgICAgICAgeDogMCxcbiAgICAgICAgeTogMFxuICAgIH07XG5cbiAgICB0aGlzLm1vdXNlUG9zID0ge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwXG4gICAgfTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5tb3ZlV2luZG93LmJpbmQodGhpcykpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vdmluZ1dpbmRvdyA9IG51bGw7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn1cblxuRGVza3RvcC5wcm90b3R5cGUuYXR0YWNoV2luZG93ID0gZnVuY3Rpb24oYXBwKSB7XG4gICAgdmFyIGFwcFdpbmRvdyA9IG5ldyBBcHBXaW5kb3coKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZXJlIGFyZSBhbnkgd2luZG93cyBpbiB0aGUgZGVza3RvcC4gSWYgc28sIGNoYW5nZSBpdHMgcG9zaXRpb24uXG4gICAgaWYgKHRoaXMud2luZG93cy5sZW5ndGggPj0gMSkge1xuICAgICAgICBhcHBXaW5kb3cuZGl2LnN0eWxlLmxlZnQgPSAodGhpcy53aW5kb3dzW3RoaXMud2luZG93cy5sZW5ndGggLSAxXS5kaXYub2Zmc2V0TGVmdCArIDIwKSArIFwicHhcIjtcbiAgICAgICAgYXBwV2luZG93LmRpdi5zdHlsZS50b3AgPSAodGhpcy53aW5kb3dzW3RoaXMud2luZG93cy5sZW5ndGggLSAxXS5kaXYub2Zmc2V0VG9wICsgMjApICsgXCJweFwiO1xuICAgIH1cblxuICAgIGFwcFdpbmRvdy5kaXYuc3R5bGUuekluZGV4ID0gdGhpcy50b3BaSW5kZXg7XG4gICAgdGhpcy50b3BaSW5kZXggKz0gMTtcblxuICAgIC8vIFdlIHB1c2ggaXQgdG8gdGhlIGxpc3Qgb2Ygd2luZG93cyBmaXJzdCwgc28gdGhhdCB3ZSBrbm93IHRoZSBhcHAgd2luZG93J3MgaW5kZXggaW4gdGhlIGFycmF5XG4gICAgdGhpcy53aW5kb3dzLnB1c2goYXBwV2luZG93KTtcblxuICAgIHRoaXMuYXR0YWNoRXZlbnRMaXN0ZW5lcnMoYXBwV2luZG93KTtcblxuICAgIGlmIChhcHApIHtcbiAgICAgICAgYXBwV2luZG93LmF0dGFjaEFwcChhcHApO1xuICAgIH1cblxuICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKGFwcFdpbmRvdy5kaXYpO1xufTtcblxuRGVza3RvcC5wcm90b3R5cGUuYXR0YWNoRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbihhcHBXaW5kb3cpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gQXR0YWNoZXMgdGhlIGV2ZW50IGxpc3RlbmVyIHRoYXQgZ2l2ZXMgdGhlIGFwcCB3aW5kb3cgZm9jdXMgYW5kIGhpZGVzIHRoZSBtZW51XG4gICAgYXBwV2luZG93LmRpdi5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMuZ2l2ZUZvY3VzLmJpbmQodGhpcykpO1xuXG4gICAgYXBwV2luZG93LmRpdi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghYXBwV2luZG93LmRyb3Bkb3duLmNsYXNzTGlzdC5jb250YWlucyhcInJlbW92ZWRcIikgJiYgIWV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJ0b29sYmFyLWljb25cIikpIHtcbiAgICAgICAgICAgIGFwcFdpbmRvdy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwicmVtb3ZlZFwiKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgYXBwV2luZG93LmFwcENvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwicmVmcmVzaFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYXBwV2luZG93LnJlZnJlc2hBcHAoKTtcbiAgICB9KTtcblxuICAgIC8vIEF0dGFjaGVzIHRoZSBldmVudCBsaXN0ZW5lciB0aGF0IHN0YXJ0cyBtb3ZpbmcgdGhlIHdpbmRvd1xuICAgIGFwcFdpbmRvdy50b29sYmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgdGhpcy5zdGFydE1vdmUuYmluZCh0aGlzKSk7XG5cbiAgICBhcHBXaW5kb3cubWVudUljb24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2hvd01lbnUuYmluZChhcHBXaW5kb3cpKTtcblxuICAgIC8vIEF0dGFjaGVzIHRoZSBldmVudCBsaXN0ZW5lciB0aGF0IGNsb3NlcyB0aGUgd2luZG93IGFuZCByZW1vdmVzIGl0IGZyb20gdGhlIGxpc3Qgb2Ygd2luZG93cy5cbiAgICBhcHBXaW5kb3cuY2xvc2VXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAvL1RPRE86IG1ha2Ugc3VyZSB0aGlzIGRlbGV0ZXMgdGhlIGNoYXQgaW5zdGFuY2UgdG9vIVxuICAgICAgICB0aGlzLmNvbnRhaW5lci5yZW1vdmVDaGlsZChhcHBXaW5kb3cuZGl2KTtcbiAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZSh0aGlzLndpbmRvd3MuaW5kZXhPZihhcHBXaW5kb3cpLCAxKTtcbiAgICB9LmJpbmQodGhpcykpO1xufTtcblxuRGVza3RvcC5wcm90b3R5cGUuZ2l2ZUZvY3VzID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBpZiAocGFyc2VJbnQoZXZlbnQuY3VycmVudFRhcmdldC5zdHlsZS56SW5kZXgsIDEwKSAhPT0gdGhpcy50b3BaSW5kZXggLSAxKSB7XG4gICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuc3R5bGUuekluZGV4ID0gdGhpcy50b3BaSW5kZXg7XG4gICAgICAgIHRoaXMudG9wWkluZGV4ICs9IDE7XG4gICAgfVxuXG4gICAgLy9ldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbn07XG5cbkRlc2t0b3AucHJvdG90eXBlLnNob3dNZW51ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QudG9nZ2xlKFwicmVtb3ZlZFwiKTtcbn07XG5cbkRlc2t0b3AucHJvdG90eXBlLm1vdmVXaW5kb3cgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHRoaXMubW91c2VQb3MueCA9IGV2ZW50LmNsaWVudFggLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRMZWZ0O1xuICAgIHRoaXMubW91c2VQb3MueSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRUb3A7XG5cbiAgICBpZiAodGhpcy5tb3ZpbmdXaW5kb3cpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB0aGlzLm1vdmluZ1dpbmRvdy5zdHlsZS50b3AgPSAgdGhpcy5tb3VzZVBvcy55IC0gdGhpcy5kaXN0YW5jZS55ICsgXCJweFwiO1xuICAgICAgICB0aGlzLm1vdmluZ1dpbmRvdy5zdHlsZS5sZWZ0ID0gIHRoaXMubW91c2VQb3MueCAtIHRoaXMuZGlzdGFuY2UueCArIFwicHhcIjtcblxuICAgICAgICAvLyBQcmV2ZW50IHRoZSB3aW5kb3cgZnJvbSBtb3Zpbmcgb2ZmIHRoZSB0b3Agb2YgdGhlIGRlc2t0b3AuIE90aGVyIGRpcmVjdGlvbnMgYXJlIGZpbmUsXG4gICAgICAgIC8vIGp1c3QgbGlrZSBpbiBhIHJlYWwgb3BlcmF0aW5nIHN5c3RlbSFcbiAgICAgICAgaWYgKHRoaXMubW92aW5nV2luZG93Lm9mZnNldFRvcCA8IDApIHtcbiAgICAgICAgICAgIHRoaXMubW92aW5nV2luZG93LnN0eWxlLnRvcCA9IDA7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5EZXNrdG9wLnByb3RvdHlwZS5zdGFydE1vdmUgPSBmdW5jdGlvbihldmVudCkge1xuICAgIC8vIE1ha2Ugc3VyZSB0aGUgdXNlciBpc24ndCBzZWxlY3RpbmcgdGhlIG1lbnUgaWNvbiBvciBcImNsb3NlIHdpbmRvd1wiIGJ1dHRvbi5cbiAgICBpZiAoIWV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJ0b29sYmFyXCIpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLm1vdmluZ1dpbmRvdyA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xuXG4gICAgdGhpcy5kaXN0YW5jZS54ID0gdGhpcy5tb3VzZVBvcy54IC0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUub2Zmc2V0TGVmdDtcbiAgICB0aGlzLmRpc3RhbmNlLnkgPSB0aGlzLm1vdXNlUG9zLnkgLSBldmVudC50YXJnZXQucGFyZW50Tm9kZS5vZmZzZXRUb3A7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlc2t0b3A7XG4iLCJmdW5jdGlvbiBNZW1vcnkoYm9hcmRYLCBib2FyZFkpIHtcbiAgICB0aGlzLmltYWdlU3JjID0gXCJwdXp6bGVcIjtcbiAgICB0aGlzLnRpdGxlID0gXCJNZW1vcnlcIjtcblxuICAgIHRoaXMuYm9hcmRYID0gYm9hcmRYIHx8IDQ7XG4gICAgdGhpcy5ib2FyZFkgPSBib2FyZFkgfHwgNDtcbiAgICB0aGlzLnRvdGFsQnJpY2tzID0gMDtcbiAgICB0aGlzLnJlbW92ZWRCcmlja3MgPSAwO1xuICAgIHRoaXMubW92ZXMgPSAwO1xuICAgIHRoaXMuYm9hcmQgPSBudWxsO1xuICAgIHRoaXMuaW5mbyA9IG51bGw7XG4gICAgdGhpcy5icmlja3MgPSBbXTtcbiAgICB0aGlzLmJvdW5kUmV2ZWFsID0gdGhpcy5yZXZlYWxCcmljay5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJyaWNrID0gbnVsbDtcblxuICAgIHRoaXMuYXBwQ29udGVudCA9IHRoaXMuY3JlYXRlQXBwQ29udGVudCgpO1xufVxuXG5NZW1vcnkucHJvdG90eXBlLmNyZWF0ZUFwcENvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI21lbW9yeS10ZW1wbGF0ZVwiKTtcbiAgICB2YXIgYXBwQ29udGVudCA9IGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5hcHAtY29udGVudFwiKTtcblxuICAgIHRoaXMuYm9hcmQgPSBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIuYm9hcmRcIik7XG4gICAgdGhpcy5pbmZvID0gYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmluZm9cIik7XG4gICAgdGhpcy5pbml0aWFsaXplQm9hcmQoKTtcblxuICAgIHRoaXMuYXR0YWNoRXZlbnRMaXN0ZW5lcnMoYXBwQ29udGVudCk7XG5cbiAgICByZXR1cm4gYXBwQ29udGVudDtcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUuYXR0YWNoRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbihhcHBDb250ZW50KSB7XG4gICAgdmFyIGJvYXJkID0gYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmJvYXJkXCIpO1xuICAgIHZhciBuZXdHYW1lID0gYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLm5ldy1nYW1lXCIpO1xuXG4gICAgYm9hcmQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuYm91bmRSZXZlYWwpO1xuICAgIG5ld0dhbWUuYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCB0aGlzLm5ld0dhbWUuYmluZCh0aGlzKSk7XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLm5ld0dhbWUgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB2YXIgbmV3Qm9hcmRYID0gZXZlbnQudGFyZ2V0LmVsZW1lbnRzWzFdLnZhbHVlO1xuICAgIHZhciBuZXdCb2FyZFkgPSBldmVudC50YXJnZXQuZWxlbWVudHNbMl0udmFsdWU7XG5cbiAgICBpZiAoaXNOYU4obmV3Qm9hcmRYKSB8fCBpc05hTihuZXdCb2FyZFkpKSB7XG4gICAgICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiUGxlYXNlIGVudGVyIG9ubHkgbnVtYmVycy5cIjtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChuZXdCb2FyZFggPCAyIHx8IG5ld0JvYXJkWCA+IDEwIHx8IG5ld0JvYXJkWSA8IDIgfHwgbmV3Qm9hcmRZID4gMTApIHtcbiAgICAgICAgdGhpcy5pbmZvLnRleHRDb250ZW50ID0gXCJQbGVhc2UgZW50ZXIgbnVtYmVycyBiZXR3ZWVuIDIgYW5kIDEwLlwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKChuZXdCb2FyZFggKiBuZXdCb2FyZFkpICUgMiAhPT0gMCkge1xuICAgICAgICB0aGlzLmluZm8udGV4dENvbnRlbnQgPSBcIlRoZSBhbW91bnQgb2YgYnJpY2tzIG11c3QgYmUgZXZlbi5cIjtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYm9hcmRYID0gbmV3Qm9hcmRYO1xuICAgIHRoaXMuYm9hcmRZID0gbmV3Qm9hcmRZO1xuXG4gICAgd2hpbGUgKHRoaXMuYm9hcmQuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIHRoaXMuYm9hcmQucmVtb3ZlQ2hpbGQodGhpcy5ib2FyZC5maXJzdEVsZW1lbnRDaGlsZCk7XG4gICAgfVxuXG4gICAgdGhpcy5pbmZvLnRleHRDb250ZW50ID0gXCJcIjtcblxuICAgIHRoaXMuaW5pdGlhbGl6ZUJvYXJkKCk7XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLmluaXRpYWxpemVCb2FyZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLmJvYXJkLnN0eWxlLndpZHRoID0gKDQ4ICogdGhpcy5ib2FyZFgpICsgXCJweFwiO1xuICAgIHRoaXMuYm9hcmQuc3R5bGUuaGVpZ2h0ID0gKDQ4ICogdGhpcy5ib2FyZFkpICsgXCJweFwiO1xuXG4gICAgdGhpcy50b3RhbEJyaWNrcyA9IHRoaXMuYm9hcmRYICogdGhpcy5ib2FyZFk7XG4gICAgdGhpcy5yZW1vdmVkQnJpY2tzID0gMDtcbiAgICB0aGlzLm1vdmVzID0gMDtcbiAgICB0aGlzLmJyaWNrcyA9IFtdO1xuXG4gICAgdmFyIGk7XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy50b3RhbEJyaWNrczsgaSArPSAyKSB7XG4gICAgICAgIHRoaXMuYnJpY2tzW2ldID0gY291bnQgJSA4O1xuICAgICAgICB0aGlzLmJyaWNrc1tpICsgMV0gPSBjb3VudCAlIDg7XG4gICAgICAgIGNvdW50ID0gY291bnQgPT0gNyA/IGNvdW50ID0gMCA6IGNvdW50ICs9IDE7XG4gICAgfVxuXG4gICAgLy8gRmlzaGVyLVlhdGVzXG4gICAgZm9yIChpID0gdGhpcy50b3RhbEJyaWNrcyAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgdmFyIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoaSArIDEpKTtcbiAgICAgICAgdmFyIGsgPSB0aGlzLmJyaWNrc1tqXTtcbiAgICAgICAgdGhpcy5icmlja3Nbal0gPSB0aGlzLmJyaWNrc1tpXTtcbiAgICAgICAgdGhpcy5icmlja3NbaV0gPSBrO1xuICAgIH1cblxuICAgIHRoaXMuYnJpY2tzLmZvckVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBicmljayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG4gICAgICAgIGJyaWNrLmNsYXNzTGlzdC5hZGQoXCJtZW1vcnktYnJpY2tcIik7XG4gICAgICAgIGJyaWNrLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9oaWRkZW4ucG5nXCIpO1xuXG4gICAgICAgIF90aGlzLmJvYXJkLmFwcGVuZENoaWxkKGJyaWNrKTtcbiAgICB9KTtcbn07XG5cbk1lbW9yeS5wcm90b3R5cGUucmV2ZWFsQnJpY2sgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBicmljayA9IGV2ZW50LnRhcmdldDtcbiAgICB2YXIgcGFyZW50ID0gZXZlbnQuY3VycmVudFRhcmdldDtcblxuICAgIGlmICh0aGlzLnNlbGVjdGVkQnJpY2sgJiYgYnJpY2sgPT09IHRoaXMuc2VsZWN0ZWRCcmljay5icmlja0VsZW0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChicmljayA9PT0gcGFyZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgaW5kZXggPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHBhcmVudC5jaGlsZHJlbiwgYnJpY2spO1xuXG4gICAgYnJpY2suc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiL2ltYWdlL1wiICsgdGhpcy5icmlja3NbaW5kZXhdICsgXCIucG5nXCIpO1xuXG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkQnJpY2spIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZEJyaWNrID0ge2JyaWNrRWxlbTogYnJpY2ssIHZhbHVlOiB0aGlzLmJyaWNrc1tpbmRleF19O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2hlY2tNYXRjaCh7YnJpY2tFbGVtOiBicmljaywgdmFsdWU6IHRoaXMuYnJpY2tzW2luZGV4XX0pXG4gICAgfVxufTtcblxuTWVtb3J5LnByb3RvdHlwZS5jaGVja01hdGNoID0gZnVuY3Rpb24oYnJpY2spIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5ib2FyZC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5ib3VuZFJldmVhbCk7XG5cbiAgICBpZiAoYnJpY2sudmFsdWUgPT09IHRoaXMuc2VsZWN0ZWRCcmljay52YWx1ZSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYnJpY2suYnJpY2tFbGVtLmNsYXNzTGlzdC5hZGQoXCJyZW1vdmVkXCIpO1xuICAgICAgICAgICAgX3RoaXMuc2VsZWN0ZWRCcmljay5icmlja0VsZW0uY2xhc3NMaXN0LmFkZChcInJlbW92ZWRcIik7XG5cbiAgICAgICAgICAgIF90aGlzLnJlbW92ZWRCcmlja3MgKz0gMjtcblxuICAgICAgICAgICAgX3RoaXMuc2VsZWN0ZWRCcmljayA9IG51bGw7XG4gICAgICAgICAgICBfdGhpcy5ib2FyZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgX3RoaXMuYm91bmRSZXZlYWwpO1xuXG4gICAgICAgICAgICBpZiAoX3RoaXMucmVtb3ZlZEJyaWNrcyA9PT0gX3RoaXMudG90YWxCcmlja3MpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5lbmRHYW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBicmljay5icmlja0VsZW0uc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiL2ltYWdlL2hpZGRlbi5wbmdcIik7XG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrLmJyaWNrRWxlbS5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvaGlkZGVuLnBuZ1wiKTtcblxuICAgICAgICAgICAgX3RoaXMuc2VsZWN0ZWRCcmljayA9IG51bGw7XG4gICAgICAgICAgICBfdGhpcy5ib2FyZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgX3RoaXMuYm91bmRSZXZlYWwpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICB9XG5cbiAgICB0aGlzLm1vdmVzICs9IDE7XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLmVuZEdhbWUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmluZm8udGV4dENvbnRlbnQgPSBcIllvdSB3b24hIE1vdmVzIHRha2VuOiBcIiArIHRoaXMubW92ZXM7XG59O1xuXG5NZW1vcnkucHJvdG90eXBlLmdldEFwcENvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5hcHBDb250ZW50O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZW1vcnk7XG4iLCJmdW5jdGlvbiBOb3RlYm9vaygpIHtcbiAgICAvL3RoaXMubm90ZUFycmF5ID0gW3tuYW1lOiBcInRlc3RcIiwgY29udGVudDpcIlRoaXMgaXMgYSB0ZXN0IG5vdGVcIn1dO1xuXG4gICAgdGhpcy5ub3RlQXJyYXkgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibm90ZXNcIikpO1xuXG4gICAgdGhpcy5ldmVudCA9IG5ldyBFdmVudChcInJlZnJlc2hcIik7XG5cbiAgICB0aGlzLm1lbnVJdGVtcyA9IFtcbiAgICAgICAge25hbWU6IFwiTmV3XCIsIGV2ZW50SGFuZGxlcjogdGhpcy5uZXdOb3RlLmJpbmQodGhpcyl9LFxuICAgICAgICB7bmFtZTogXCJTYXZlXCIsIGV2ZW50SGFuZGxlcjogdGhpcy5zYXZlTm90ZS5iaW5kKHRoaXMpfSxcbiAgICAgICAge25hbWU6IFwiTG9hZFwiLCBldmVudEhhbmRsZXI6IHRoaXMubG9hZFNjcmVlbi5iaW5kKHRoaXMpfVxuICAgIF07XG5cbiAgICB0aGlzLmltYWdlU3JjID0gXCJkaWFyeVwiO1xuICAgIHRoaXMudGl0bGUgPSBcIlVudGl0bGVkXCI7XG5cbiAgICB0aGlzLnN0YXRlID0gXCJuZXdcIjtcblxuICAgIHRoaXMuYXBwQ29udGVudCA9IHRoaXMuY3JlYXRlQXBwQ29udGVudE5ldygpO1xufVxuXG5Ob3RlYm9vay5wcm90b3R5cGUuY3JlYXRlQXBwQ29udGVudE5ldyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbm90ZWJvb2stdGVtcGxhdGUtbmV3XCIpO1xuICAgIHJldHVybiBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG59O1xuXG5Ob3RlYm9vay5wcm90b3R5cGUuY3JlYXRlQXBwQ29udGVudFNhdmVkTm90ZSA9IGZ1bmN0aW9uKG5vdGVOYW1lKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNub3RlYm9vay10ZW1wbGF0ZS1uZXdcIik7XG4gICAgdmFyIGFwcENvbnRlbnQgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG5cbiAgICB2YXIgbm90ZSA9IHRoaXMuZ2V0Tm90ZShub3RlTmFtZSk7XG5cbiAgICBpZiAobm90ZSkge1xuICAgICAgICBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIubm90ZVwiKS52YWx1ZSA9IG5vdGUuY29udGVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gYXBwQ29udGVudDtcbn07XG5cbk5vdGVib29rLnByb3RvdHlwZS5uZXdOb3RlID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coXCJuZXdcIik7XG5cbiAgICB0aGlzLnN0YXRlID0gXCJuZXdcIjtcbiAgICB0aGlzLnRpdGxlID0gXCJVbnRpdGxlZFwiO1xuXG4gICAgdGhpcy5hcHBDb250ZW50LnBhcmVudE5vZGUuZGlzcGF0Y2hFdmVudCh0aGlzLmV2ZW50KTtcbn07XG5cbk5vdGVib29rLnByb3RvdHlwZS5zYXZlTm90ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKFwic2F2ZVwiKTtcblxuICAgIGlmICh0aGlzLnN0YXRlID09PSBcImxvYWRcIikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RhdGUgPT09IFwibmV3XCIpIHtcbiAgICAgICAgdmFyIG5hbWUgPSBwcm9tcHQoXCJQbGVhc2UgZW50ZXIgYSBuYW1lOiBcIik7XG5cbiAgICAgICAgaWYgKG5hbWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmdldE5vdGUobmFtZSkpIHtcbiAgICAgICAgICAgIGFsZXJ0KFwiTmFtZSBhbHJlYWR5IHRha2VuLlwiKTtcbiAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcIlVudGl0bGVkXCIgfHwgbmFtZSA9PT0gXCJcIikge1xuICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgZ2l2ZSB5b3VyIG5vdGUgYSBuYW1lLlwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubm90ZUFycmF5LnB1c2goe25hbWU6IG5hbWUsIGNvbnRlbnQ6IHRoaXMuYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLm5vdGVcIikudmFsdWV9KTtcblxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJub3Rlc1wiLCBKU09OLnN0cmluZ2lmeSh0aGlzLm5vdGVBcnJheSkpO1xuXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gbmFtZTtcbiAgICAgICAgICAgIHRoaXMudGl0bGUgPSBuYW1lO1xuXG4gICAgICAgICAgICB0aGlzLmFwcENvbnRlbnQucGFyZW50Tm9kZS5kaXNwYXRjaEV2ZW50KHRoaXMuZXZlbnQpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5nZXROb3RlKHRoaXMuc3RhdGUpLmNvbnRlbnQgPSB0aGlzLmFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5ub3RlXCIpLnZhbHVlO1xuICAgIH1cbn07XG5cbk5vdGVib29rLnByb3RvdHlwZS5sb2FkU2NyZWVuID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coXCJsb2FkXCIpO1xuXG4gICAgdGhpcy5zdGF0ZSA9IFwibG9hZFwiO1xuICAgIHRoaXMudGl0bGUgPSBcIkxvYWRcIjtcblxuICAgIHRoaXMuYXBwQ29udGVudC5wYXJlbnROb2RlLmRpc3BhdGNoRXZlbnQodGhpcy5ldmVudCk7XG59O1xuXG5Ob3RlYm9vay5wcm90b3R5cGUubG9hZE5vdGUgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHRoaXMuc3RhdGUgPSBldmVudC5jdXJyZW50VGFyZ2V0LmRhdGFzZXQubm90ZU5hbWU7XG4gICAgdGhpcy50aXRsZSA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuZGF0YXNldC5ub3RlTmFtZTtcblxuICAgIHRoaXMuYXBwQ29udGVudC5wYXJlbnROb2RlLmRpc3BhdGNoRXZlbnQodGhpcy5ldmVudCk7XG59O1xuXG5Ob3RlYm9vay5wcm90b3R5cGUuZGVsZXRlTm90ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICB2YXIgbmFtZSA9IGV2ZW50LnRhcmdldC5kYXRhc2V0Lm5vdGVOYW1lO1xuICAgIHZhciBub3RlID0gdGhpcy5nZXROb3RlKG5hbWUpO1xuXG4gICAgaWYgKG5vdGUpIHtcbiAgICAgICAgdGhpcy5ub3RlQXJyYXkuc3BsaWNlKHRoaXMubm90ZUFycmF5LmluZGV4T2Yobm90ZSksIDEpO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm5vdGVzXCIsIEpTT04uc3RyaW5naWZ5KHRoaXMubm90ZUFycmF5KSk7XG4gICAgfVxuXG4gICAgdGhpcy5hcHBDb250ZW50LnBhcmVudE5vZGUuZGlzcGF0Y2hFdmVudCh0aGlzLmV2ZW50KTtcbn07XG5cbk5vdGVib29rLnByb3RvdHlwZS5jcmVhdGVBcHBDb250ZW50TG9hZE1lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25vdGVib29rLXRlbXBsYXRlLWxvYWRcIik7XG4gICAgdmFyIGFwcENvbnRlbnQgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5ub3RlQXJyYXkuZm9yRWFjaChmdW5jdGlvbihub3RlKSB7XG4gICAgICAgIHZhciBpdGVtVGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25vdGVib29rLWxpc3RpdGVtLXRlbXBsYXRlXCIpO1xuICAgICAgICB2YXIgaXRlbSA9IGRvY3VtZW50LmltcG9ydE5vZGUoaXRlbVRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIubm90ZWJvb2stbGlzdGl0ZW1cIik7XG5cbiAgICAgICAgaXRlbS5zZXRBdHRyaWJ1dGUoXCJkYXRhLW5vdGUtbmFtZVwiLCBub3RlLm5hbWUpO1xuXG4gICAgICAgIGl0ZW0ucXVlcnlTZWxlY3RvcihcIi5pdGVtLW5hbWVcIikudGV4dENvbnRlbnQgPSBub3RlLm5hbWU7XG5cbiAgICAgICAgaXRlbS5xdWVyeVNlbGVjdG9yKFwiLmRlbGV0ZS1pdGVtXCIpLnNldEF0dHJpYnV0ZShcImRhdGEtbm90ZS1uYW1lXCIsIG5vdGUubmFtZSk7XG5cbiAgICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgX3RoaXMubG9hZE5vdGUuYmluZChfdGhpcykpO1xuXG4gICAgICAgIGl0ZW0ucXVlcnlTZWxlY3RvcihcIi5kZWxldGUtaXRlbVwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgX3RoaXMuZGVsZXRlTm90ZS5iaW5kKF90aGlzKSk7XG5cbiAgICAgICAgYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLm5vdGVsaXN0XCIpLmFwcGVuZENoaWxkKGl0ZW0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGFwcENvbnRlbnQ7XG59O1xuXG5Ob3RlYm9vay5wcm90b3R5cGUuZ2V0Tm90ZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgcmVzdWx0Tm90ZSA9IG51bGw7XG5cbiAgICB0aGlzLm5vdGVBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKG5vdGUpIHtcbiAgICAgICAgaWYgKG5vdGUubmFtZSA9PT0gbmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0Tm90ZSA9IG5vdGU7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHROb3RlO1xufTtcblxuTm90ZWJvb2sucHJvdG90eXBlLmdldEFwcENvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gXCJuZXdcIikge1xuICAgICAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnROZXcoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hcHBDb250ZW50O1xuICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZSA9PT0gXCJsb2FkXCIpIHtcbiAgICAgICAgdGhpcy5hcHBDb250ZW50ID0gdGhpcy5jcmVhdGVBcHBDb250ZW50TG9hZE1lbnUoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hcHBDb250ZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYXBwQ29udGVudCA9IHRoaXMuY3JlYXRlQXBwQ29udGVudFNhdmVkTm90ZSh0aGlzLnN0YXRlKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5hcHBDb250ZW50O1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTm90ZWJvb2s7XG4iLCIvLyBBcHAgY29udHJvbHMgdGhlIFVJIGFuZCBpcyByZXNwb25zaWJsZSBmb3IgY3JlYXRpbmcgbmV3IGFwcCBpbnN0YW5jZXMuIEFkZGluZyBuZXcgYXBwc1xuLy8gdG8gdGhlIFBlcnNvbmFsIFdlYiBEZXNrdG9wIHNob3VsZCBiZSBhcyBlYXN5IGFzIGltcG9ydGluZyBpdCBpbiBhcHAuanMgYW5kIGNyZWF0aW5nIGl0LlxuXG4vLyBUaGUgYXBwcyBmb2xsb3cgdGhlIHNhbWUgc3RydWN0dXJlOlxuLy8gVGhleSBhbGwgY29udGFpbiBhIGZ1bmN0aW9uIGNhbGxlZCBnZXRBcHBDb250ZW50LCB3aGljaCByZXR1cm5zIHRoZSBkaXYgdGhhdCBuZWVkcyB0b1xuLy8gYmUgYXR0YWNoZWQgdG8gdGhlIGFwcCB3aW5kb3cncyBhcHAgY29udGFpbmVyLiBGb3IgYXBwc1xuXG4oZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAvLyBJbml0aWFsaXplIHRoZSBkZXNrdG9wLlxuICAgIHZhciBEZXNrdG9wID0gcmVxdWlyZShcIi4vRGVza3RvcFwiKTtcbiAgICB2YXIgZGVza3RvcCA9IG5ldyBEZXNrdG9wKCk7XG5cbiAgICAvLyBJbXBvcnQgdGhlIG5lY2Vzc2FyeSBhcHBzLlxuICAgIHZhciBOb3RlYm9vayA9IHJlcXVpcmUoXCIuL05vdGVib29rXCIpO1xuICAgIHZhciBNZW1vcnkgPSByZXF1aXJlKFwiLi9NZW1vcnlcIik7XG4gICAgdmFyIENoYXQgPSByZXF1aXJlKFwiLi9DaGF0XCIpO1xuXG4gICAgdmFyIG5ld05vdGVib29rV2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuZXdfbm90ZWJvb2tcIik7XG4gICAgdmFyIG5ld0NoYXRXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19jaGF0XCIpO1xuICAgIHZhciBuZXdNZW1vcnlXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19tZW1vcnlcIik7XG5cbiAgICBuZXdOb3RlYm9va1dpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJub3Rlc1wiKSkge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJub3Rlc1wiLCBKU09OLnN0cmluZ2lmeShbe25hbWU6IFwiV2VsY29tZVwiLCBjb250ZW50OiBcIldlbGNvbWUgdG8gdGhlIE5vdGVib29rIGFwcCFcIn1dKSk7XG4gICAgICAgIH1cblxuICAgICAgICBkZXNrdG9wLmF0dGFjaFdpbmRvdyhuZXcgTm90ZWJvb2soKSk7XG4gICAgfSk7XG5cbiAgICBuZXdDaGF0V2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFkZXNrdG9wLmluc3RhbmNlcy5jaGF0KSB7XG4gICAgICAgICAgICBpZiAoIWRlc2t0b3AudXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXNlciA9IHByb21wdChcIlBsZWFzZSBlbnRlciBhIHVzZXJuYW1lOlwiKTtcblxuICAgICAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidXNlcm5hbWVcIiwgdXNlcik7XG5cbiAgICAgICAgICAgICAgICAgICAgZGVza3RvcC51c2VybmFtZSA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVza3RvcC5pbnN0YW5jZXMuY2hhdCA9IG5ldyBDaGF0KGRlc2t0b3AudXNlcm5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVza3RvcC5hdHRhY2hXaW5kb3coZGVza3RvcC5pbnN0YW5jZXMuY2hhdCk7XG4gICAgfSk7XG5cbiAgICBuZXdNZW1vcnlXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICBkZXNrdG9wLmF0dGFjaFdpbmRvdyhuZXcgTWVtb3J5KDQsIDQpKTtcbiAgICB9KTtcbn0pKCk7XG4iXX0=
