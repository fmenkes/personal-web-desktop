(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Constructor for AppWindows. AppWindow creates a window and attaches event listeners that allow
 * the user to move the window and gives it focus when clicked.
 * @constructor
 */
function AppWindow() {
    this.app = null;

    this.div = this.createWindow();

    // Store the components of the window for ease of retrieval.
    this.toolbar = this.div.querySelector(".toolbar");
    this.menuIcon = this.div.querySelector(".toolbar-icon");
    this.menuTitle = this.div.querySelector(".toolbar-title");
    this.dropdown = this.div.querySelector(".toolbar-dropdown");
    this.closeWindow = this.div.querySelector(".close-window");
    this.appContainer = this.div.querySelector(".app-container");
}

/**
 * Creates and returns the main AppWindow div.
 * @returns {Element}
 */
AppWindow.prototype.createWindow = function() {
    var template = document.querySelector("#window-template");
    return document.importNode(template.content, true).querySelector(".app-window");
};

/**
 * Attaches an app to the window and stores it in this.app.
 * @param app
 */
AppWindow.prototype.attachApp = function(app) {
    this.app = app;

    // Clear the app container, in case there is already content inside.
    while (this.appContainer.hasChildNodes()) {
        this.appContainer.removeChild(this.appContainer.firstElementChild);
    }

    // Set the menu icon in the top left of the toolbar.
    if (app.imageSrc !== "") {
        this.menuIcon.setAttribute("src", "image/" + app.imageSrc + ".png");
    }

    // Set the title of the app.
    if (app.title !== "") {
        this.menuTitle.textContent = app.title;
    }

    // Attach the menu if there is one.
    if (app.menuItems) {
        this.attachMenu();
    }

    // Append the app content of the app to the main app container of the AppWindow.
    this.appContainer.appendChild(app.getAppContent());
};

/**
 * Attach the menu, if any, to the AppWindow toolbar.
 */
AppWindow.prototype.attachMenu = function() {
    var _this = this;

    var template = document.querySelector("#dropdown-template");

    // Give each dropdown menu item a name and attach the necessary event handler.
    this.app.menuItems.forEach(function(item) {
        var menuItem = document.importNode(template.content, true).querySelector(".dropdown-item");

        menuItem.querySelector(".dropdown-name").textContent = item.name;

        menuItem.addEventListener("click", item.eventHandler, true);

        _this.dropdown.appendChild(menuItem);
    });
};

/**
 * Refreshes the app container.
 */
AppWindow.prototype.refreshApp = function() {
    while (this.appContainer.hasChildNodes()) {
        this.appContainer.removeChild(this.appContainer.firstElementChild);
    }

    this.menuTitle.textContent = this.app.title;

    this.appContainer.appendChild(this.app.getAppContent());
};

/**
 * Refreshes only the title.
 */
AppWindow.prototype.refreshTitle = function() {
    this.menuTitle.textContent = this.app.title;
};

module.exports = AppWindow;

},{}],2:[function(require,module,exports){
/**
 * The chat application constructor. One object will be instantiated per desktop.
 * @param {String} username
 * @constructor
 */
function Chat(username) {
    var _this = this;

    this.lastLines = [];

    // The image and title of the app.
    this.imageSrc = "chat";
    this.title = "Webchat";

    // Stores the document title so that the app can change it back after the user has been notified.
    this.defaultTitle = document.title;

    this.username = username;

    this.appContent = this.createAppContent();
    this.chatLines = this.appContent.querySelector(".chat-lines");
    this.apiKey = "eDBE76deU7L0H9mEBgxUKVR0VCnq0XBd";
    this.socket = new WebSocket("ws://vhost3.lnu.se:20080/socket/");

    // Attach an event listener to know when the user focuses on the PWD tab.
    document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this));

    // TODO: Make sure the socket opens before the user can send messages

    // Event handler for messages received through the chat application.
    this.socket.addEventListener("message", function(event) {
        var message = JSON.parse(event.data);

        // Append the line to the Chat lines, unless it is a server heartbeat.
        if (message.type != "heartbeat") {
            _this.appendLine(message.username, message.data);
        }
    });
}

/**
 * Create the app content.
 * @returns {Element}
 */
Chat.prototype.createAppContent = function() {
    var template = document.querySelector("#chat-template");

    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    this.attachEventListeners(appContent);

    return appContent;
};

/**
 * Attach event listeners to the app content.
 * @param {Node} appContent
 */
Chat.prototype.attachEventListeners = function(appContent) {
    var chatForm = appContent.querySelector(".chat-form");
    var textArea = chatForm.querySelector("textarea");

    textArea.addEventListener("keydown", this.handleTextInput.bind(this));
};

/**
 * Event handler for text input.
 * @param event
 */
Chat.prototype.handleTextInput = function(event) {
    // Shift + Enter creates a new line, Enter sends a message.
    if (!event.shiftKey && event.keyCode === 13) {
        event.preventDefault();

        // Handle chat commands, if any, otherwise send the message.
        if (event.target.value.charAt(0) === "/") {
            this.handleCommand(event.target.value.slice(1));
        } else if (event.target.value !== "") {
            this.sendMessage(event.target.value);
        }

        event.target.value = "";
    }
};

/**
 * Handles user commands.
 * @param {String} command
 */
Chat.prototype.handleCommand = function(command) {
    // Divide command into keyword and parameters.
    var commandKeyword = command.split(" ")[0];
    var commandParameters = null;

    if (command.split(" ").length > 1) {
        commandParameters = command.substr(command.indexOf(" ") + 1, command.length);
    }

    // Handle the different keywords. (Only one for now).
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

/**
 * Fires when the user can/cannot see the PWD tab.
 */
Chat.prototype.handleVisibilityChange = function() {
    // Change the document title to the default title if the user can see the tab.
    if (!document.hidden) {
        document.title = this.defaultTitle;
    }
};

/**
 * Adds the message to the lastLines array.
 * @param {String} username
 * @param {String} line
 */
Chat.prototype.appendLine = function(username, line) {
    this.lastLines.push({username: username, line: line});

    // Last lines only stores the last 20 messages.
    if (this.lastLines.length > 20) {
        this.lastLines.shift();
    }

    // Play notification sound and change the document title if the document is not visible.
    if (document.hidden) {
        var audio = this.appContent.querySelector("audio");

        audio.play();

        document.title = "* " + this.defaultTitle;
    }

    this.convertLinesToHTML();
};

/**
 * Converts lines in lastLines array to HTML and attaches them to the app content.
 */
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

    var forEach = Array.prototype.forEach;

    forEach.call(document.querySelectorAll(".chat"), function(chatWin) {
        var newChat = _this.chatLines.cloneNode(true);

        chatWin.removeChild(chatWin.querySelector(".chat-lines"));

        chatWin.insertBefore(newChat, chatWin.querySelector(".chat-form"));
    });
};

/**
 * Sends a message to the server.
 * @param {String} message
 */
Chat.prototype.sendMessage = function(message) {
    var data = {};

    data.username = this.username;
    data.data = message;
    data.key = this.apiKey;
    data.type = "message";

    this.socket.send(JSON.stringify(data));

    // Offline capabilities for testing purposes.
    //this.appendLine(this.username, message);
};

/**
 * Returns a clone of the appContent.
 * @returns {Node}
 */
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
 * Desktop object which contains all the AppWindow objects.
 */
function Desktop() {
    // List of app windows.
    this.windows = [];

    // Retrieve the user's username.
    this.username = localStorage.getItem("username");

    this.container = document.querySelector("#window_container");

    // The object that contains apps that should only have one instance across the desktop (e.g. chat).
    this.instances = {

    };

    // Variables that store the window that is moving and the zIndex of the window on top.
    this.movingWindow = null;
    this.topZIndex = 1;

    // Distance from the cursor to the edge of the element.
    this.distance = {
        x: 0,
        y: 0
    };

    // Position of the mouse.
    this.mousePos = {
        x: 0,
        y: 0
    };

    // Document event listeners.
    document.addEventListener("mousemove", this.moveWindow.bind(this));
    document.addEventListener("mouseup", function() {
        this.movingWindow = null;
    }.bind(this));
}

/**
 * Attaches an app to a window and that window to the desktop.
 * @param app
 */
Desktop.prototype.attachWindow = function(app) {
    var appWindow = new AppWindow();

    // Check if there are any windows in the desktop. If so, change its position.
    if (this.windows.length >= 1) {
        appWindow.div.style.left = (this.windows[this.windows.length - 1].div.offsetLeft + 15) + "px";
        appWindow.div.style.top = (this.windows[this.windows.length - 1].div.offsetTop + 30) + "px";
    }

    // Make sure the new window is on top.
    appWindow.div.style.zIndex = this.topZIndex;
    this.topZIndex += 1;

    // We push it to the list of windows first, so that we know the app window's index in the array
    this.windows.push(appWindow);

    this.attachEventListeners(appWindow);

    // Attach the app to the window.
    if (app) {
        appWindow.attachApp(app);
    }

    // Attach the window to the desktop.
    this.container.appendChild(appWindow.div);
};

/**
 * Attach event listeners to the app window.
 * @param appWindow
 */
Desktop.prototype.attachEventListeners = function(appWindow) {
    // Attaches the event listener that gives the app window focus.
    appWindow.div.addEventListener("mousedown", this.giveFocus.bind(this));

    // Attaches the event listener that hides the menu.
    appWindow.div.addEventListener("click", function(event) {
        if (!appWindow.dropdown.classList.contains("removed") && !event.target.classList.contains("toolbar-icon")) {
            appWindow.dropdown.classList.add("removed");
        }
    });

    // Refreshes the app when the custom event "refresh" fires from the appContainer. Apps are responsible for firing
    // this event.
    appWindow.appContainer.addEventListener("refresh", function() {
        appWindow.refreshApp();
    });

    // Same, but for only the title.
    appWindow.appContainer.addEventListener("refreshtitle", function() {
        appWindow.refreshTitle();
    });

    // Attaches the event listener that starts moving the window
    appWindow.toolbar.addEventListener("mousedown", this.startMove.bind(this));

    // Attaches the event listener that shows the dropdown menu.
    appWindow.menuIcon.addEventListener("click", this.showMenu.bind(appWindow));

    // Attaches the event listener that closes the window and removes it from the list of windows.
    appWindow.closeWindow.addEventListener("click", function() {
        //TODO: make sure this deletes the chat instance too!
        this.container.removeChild(appWindow.div);
        this.windows.splice(this.windows.indexOf(appWindow), 1);
    }.bind(this));
};

/**
 * Gives focus to the current window.
 * @param event
 */
Desktop.prototype.giveFocus = function(event) {
    // Check if the window is on top. If not, push it to the top.
    if (parseInt(event.currentTarget.style.zIndex, 10) !== this.topZIndex - 1) {
        event.currentTarget.style.zIndex = this.topZIndex;
        this.topZIndex += 1;
    }
};

/**
 * Shows the dropdown menu.
 * @param event
 */
Desktop.prototype.showMenu = function(event) {
    event.preventDefault();

    this.dropdown.classList.toggle("removed");
};

/**
 * Moves the selected window.
 * @param event
 */
Desktop.prototype.moveWindow = function(event) {
    // Finds the mouse position in the window container.
    this.mousePos.x = event.clientX - this.container.offsetLeft;
    this.mousePos.y = event.clientY - this.container.offsetTop;

    if (this.movingWindow) {
        event.preventDefault();

        // Change the top and left of the selected window to the position of the mouse minus the distance to
        // the window's top left edge.
        this.movingWindow.style.top =  this.mousePos.y - this.distance.y + "px";
        this.movingWindow.style.left =  this.mousePos.x - this.distance.x + "px";

        // Prevent the window from moving off the top of the desktop. Other directions are fine,
        // just like in a real operating system!
        if (this.movingWindow.offsetTop < 0) {
            this.movingWindow.style.top = 0;
        }
    }
};

/**
 * Starts the move.
 * @param event
 */
Desktop.prototype.startMove = function(event) {
    var movingToolbar = event.currentTarget;

    // Make sure the user isn't selecting the menu icon or "close window" button.
    if (!event.target.classList.contains("toolbar-title") && event.target !== movingToolbar) {
        return;
    }

    // Set the moving window and the distance to the element's edges.
    this.movingWindow = movingToolbar.parentNode;

    this.distance.x = this.mousePos.x - movingToolbar.parentNode.offsetLeft;
    this.distance.y = this.mousePos.y - movingToolbar.parentNode.offsetTop;
};

module.exports = Desktop;

},{"./AppWindow":1}],4:[function(require,module,exports){
/**
 * Constructor for the memory app.
 * @param {Number} boardX The width of the board in bricks.
 * @param {Number} boardY The height of the board in bricks.
 * @constructor
 */
function Memory(boardX, boardY) {
    // Set the image and title.
    this.imageSrc = "puzzle";
    this.title = "Memory";

    // Default size is 4 by 4.
    this.boardX = boardX || 4;
    this.boardY = boardY || 4;

    // Brick handling.
    this.bricks = [];
    this.totalBricks = 0;
    this.removedBricks = 0;

    // The number of moves and time taken.
    this.moves = 0;
    this.timeTaken = 0;

    this.timer = 0;

    // Store elements for ease of access.
    this.board = null;
    this.info = null;
    this.newGameForm = null;

    // Custom event listener for refreshing the title.
    this.refreshTitle = new Event("refreshtitle");

    // Store events so that we can remove them later.
    this.boundReveal = function(event) {
        this.revealBrick(event.target);
    }.bind(this);

    this.boundKeyboardHandler = this.keyboardHandler.bind(this);

    this.boundNewGame = this.newGame.bind(this);

    this.selectedBrick = null;

    this.brickElements = null;

    this.highlightedBrick = null;

    this.appContent = this.createAppContent();

    this.appContent.addEventListener("click", this.setActiveGame.bind(this));

    document.addEventListener("keydown", this.boundKeyboardHandler);
}

/**
 * Creates the appContent for the memory application.
 * @returns {Node}
 */
Memory.prototype.createAppContent = function() {
    var template = document.querySelector("#memory-template");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    this.board = appContent.querySelector(".board");
    this.info = appContent.querySelector(".info");
    this.newGameForm = appContent.querySelector(".new-game");
    this.initializeBoard();
    this.setActiveGame();

    this.attachEventListeners(appContent);

    return appContent;
};

/**
 * Attaches event listeners.
 * @param {Node} appContent
 */
Memory.prototype.attachEventListeners = function(appContent) {
    this.board.addEventListener("click", this.boundReveal);
    this.newGameForm.addEventListener("submit", this.boundNewGame);

    // Make sure the form does not submit while the above event listener is removed.
    this.newGameForm.addEventListener("submit", function(event) {
        event.preventDefault();
    });
};

/**
 * Sets the current game to active, so that the player can play the game with the keyboard.
 */
Memory.prototype.setActiveGame = function() {
    var forEach = Array.prototype.forEach;

    forEach.call(document.querySelectorAll(".board"), function(board) {
        board.classList.remove("active");
    });

    this.board.classList.add("active");
};

/**
 * Keyboard handler for the Memory game. Controls are left, up, right, down, and enter.
 */
Memory.prototype.keyboardHandler = function(event) {
    var indexOf = Array.prototype.indexOf;

    if (!this.board.classList.contains("active")) {
        return;
    }

    // Un-highlight a brick if it is highlighted
    this.highlightedBrick.classList.remove("highlighted");

    var oldBrick = this.highlightedBrick;

    var index = indexOf.call(this.brickElements, this.highlightedBrick);

    // This switch checks the keycode of the event and then iterates through the corresponding
    // direction until it finds a brick that has not been removed, then it highlights it.
    switch (event.keyCode) {
        case 37:

            // left
            do {
                if (index !== 0) {
                    this.highlightedBrick = this.brickElements[index - 1];
                    index -= 1;
                } else {
                    this.highlightedBrick = oldBrick;
                    break;
                }
            } while (this.highlightedBrick.classList.contains("removed"));
            break;
        case 38:

            // up
            do {
                if (index - this.boardX >= 0) {
                    this.highlightedBrick = this.brickElements[index - this.boardX];
                    index -= this.boardX;
                } else {
                    this.highlightedBrick = oldBrick;
                    break;
                }
            } while (this.highlightedBrick.classList.contains("removed"));
            break;
        case 39:

            // right
            do {
                if (index !== this.brickElements.length - 1) {
                    this.highlightedBrick = this.brickElements[index + 1];
                    index += 1;
                } else {
                    this.highlightedBrick = oldBrick;
                    break;
                }
            } while (this.highlightedBrick.classList.contains("removed"));
            break;
        case 40:

            // down
            do {
                if (index + this.boardX < this.brickElements.length) {
                    this.highlightedBrick = this.brickElements[index + this.boardX];
                    index += this.boardX;
                } else {
                    this.highlightedBrick = oldBrick;
                    break;
                }
            } while (this.highlightedBrick.classList.contains("removed"));
            break;
        case 13:

            // enter
            this.revealBrick(this.highlightedBrick);
            break;
    }

    // Re-highlight the brick
    this.highlightedBrick.classList.add("highlighted");
};

/**
 * Starts a new game.
 * @param event
 */
Memory.prototype.newGame = function(event) {
    event.preventDefault();

    // Gets the boardX and boardY from the form.
    var newBoardX = event.target.elements[1].value;
    var newBoardY = event.target.elements[2].value;

    // Make sure the user has entered numbers.
    if (isNaN(newBoardX) || isNaN(newBoardY)) {
        this.info.textContent = "Please enter only numbers.";
        return;
    }

    // If they have, convert them from strings to numbers.
    newBoardX = parseInt(newBoardX, 10);
    newBoardY = parseInt(newBoardY, 10);

    // Make sure that the board is not too big or too small.
    if (newBoardX < 2 || newBoardX > 10 || newBoardY < 2 || newBoardY > 10) {
        this.info.textContent = "Please enter numbers between 2 and 10.";
        return;
    }

    // Make sure that the pieces will fit in a grid.
    if ((newBoardX * newBoardY) % 2 !== 0) {
        this.info.textContent = "The amount of bricks must be even.";
        return;
    }

    // Reset the timer and change the title.
    clearInterval(this.timer);
    this.title = "Memory";

    this.appContent.parentNode.dispatchEvent(this.refreshTitle);

    // Blur the elements so that they don't get in the way of keyboard controls
    event.target.elements[0].blur();
    event.target.elements[1].blur();
    event.target.elements[2].blur();

    this.boardX = newBoardX;
    this.boardY = newBoardY;

    while (this.board.hasChildNodes()) {
        this.board.removeChild(this.board.firstElementChild);
    }

    this.info.textContent = "";

    this.initializeBoard();
};

/**
 * Creates and randomizes the bricks needed for the game.
 */
Memory.prototype.initializeBoard = function() {
    var _this = this;

    // Set the size of the board.
    this.board.style.width = (48 * this.boardX) + "px";
    this.board.style.height = (48 * this.boardY) + "px";

    this.timer = 0;
    this.timeTaken = 0;
    this.totalBricks = this.boardX * this.boardY;
    this.removedBricks = 0;
    this.moves = 0;
    this.bricks = [];
    this.selectedBrick = null;

    // Populate the brick array.
    var i;
    var count = 0;
    for (i = 0; i < this.totalBricks; i += 2) {
        this.bricks[i] = count % 8;
        this.bricks[i + 1] = count % 8;
        count = count == 7 ? count = 0 : count += 1;
    }

    // Fisher-Yates shuffle.
    for (i = this.totalBricks - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var k = this.bricks[j];
        this.bricks[j] = this.bricks[i];
        this.bricks[i] = k;
    }

    // Create the brick elements and set the initial hidden image.
    this.bricks.forEach(function() {
        var brick = document.createElement("img");
        brick.classList.add("memory-brick");
        brick.setAttribute("src", "/image/hidden.png");

        _this.board.appendChild(brick);
    });

    this.brickElements = this.board.querySelectorAll(".memory-brick");
    this.highlightedBrick = this.brickElements[0];
    this.highlightedBrick.classList.add("highlighted");
};

/**
 * Handles revealing the selected brick.
 * @param brick The selected brick.
 */
Memory.prototype.revealBrick = function(brick) {
    var _this = this;

    // Do nothing if the brick pressed is the brick selected
    if (this.selectedBrick && brick === this.selectedBrick.brickElem) {
        return;
    }

    // Do nothing if the user has clicked on the board
    if (brick === this.board) {
        return;
    }

    // Finally, do nothing if the brick is removed!
    if (brick.classList.contains("removed")) {
        return;
    }

    // Start the timer if it hasn't already started.
    if (!this.timer) {
        this.timer = setInterval(function() {
            _this.tick();
        }, 100);
    }

    // Find the index of the brick in the board
    var index = Array.prototype.indexOf.call(this.board.children, brick);

    // Flip the brick
    brick.setAttribute("src", "/image/" + this.bricks[index] + ".png");

    // If there is no selected brick, this is the selected brick
    if (!this.selectedBrick) {
        this.selectedBrick = {brickElem: brick, value: this.bricks[index]};
    } else {
        // If there is, check if they match
        this.checkMatch({brickElem: brick, value: this.bricks[index]})
    }
};

/**
 * Ticks up the clock every 100 milliseconds.
 */
Memory.prototype.tick = function() {
    this.timeTaken += 100;

    this.title = "Memory - " + (this.timeTaken / 1000).toFixed(1);

    this.appContent.parentNode.dispatchEvent(this.refreshTitle);
};

/**
 * Checks if the brick revealed matches the selected brick
 * @param brick
 */
Memory.prototype.checkMatch = function(brick) {
    var _this = this;

    // Remove the event listeners while the bricks are being checked
    this.board.removeEventListener("click", this.boundReveal);
    this.newGameForm.removeEventListener("submit", this.boundNewGame);
    document.removeEventListener("keydown", this.boundKeyboardHandler);

    // If they match, remove both and add 2 to removed bricks count.
    if (brick.value === this.selectedBrick.value) {
        setTimeout(function() {
            brick.brickElem.classList.add("removed");
            _this.selectedBrick.brickElem.classList.add("removed");

            _this.removedBricks += 2;

            _this.selectedBrick = null;
            _this.board.addEventListener("click", _this.boundReveal);
            _this.newGameForm.addEventListener("submit", _this.boundNewGame);
            document.addEventListener("keydown", _this.boundKeyboardHandler);


            // If there are no more bricks, the game is over.
            if (_this.removedBricks === _this.totalBricks) {
                _this.endGame();
            }
        }, 1000);
    } else {
        // If they don't match, flip them back over.
        setTimeout(function() {
            brick.brickElem.setAttribute("src", "/image/hidden.png");
            _this.selectedBrick.brickElem.setAttribute("src", "/image/hidden.png");

            _this.selectedBrick = null;
            _this.board.addEventListener("click", _this.boundReveal);
            _this.newGameForm.addEventListener("submit", _this.boundNewGame);
            document.addEventListener("keydown", _this.boundKeyboardHandler);
        }, 1000);
    }

    // Either way, the user has used one move.
    this.moves += 1;
};

/**
 * Simple function that displays the amount of moves and time taken.
 */
Memory.prototype.endGame = function() {
    clearInterval(this.timer);
    this.title = "Memory";

    this.appContent.parentNode.dispatchEvent(this.refreshTitle);

    this.info.textContent = "Nice! Moves: " + this.moves + ", Time: " + (this.timeTaken / 1000).toFixed(1) + "s";
};

/**
 * Returns the AppContent.
 * @returns {Node}
 */
Memory.prototype.getAppContent = function() {
    return this.appContent;
};

module.exports = Memory;

},{}],5:[function(require,module,exports){
/**
 * Constructor for the Notebook app.
 * @param {Boolean} welcome If true, it is the first time the user opens the app, so display a welcome message.
 * @constructor
 */
function Notebook(welcome) {
    // Get the array of notes from local storage.
    this.noteArray = JSON.parse(localStorage.getItem("notes"));

    // Create a custom event that lets the app window know it should refresh itself.
    this.refresh = new Event("refresh");

    // Array of menu objects, with name and event handler.
    this.menuItems = [
        {name: "New", eventHandler: this.newNote.bind(this)},
        {name: "Save", eventHandler: this.saveNote.bind(this)},
        {name: "Load", eventHandler: this.loadScreen.bind(this)}
    ];

    // Set the image.
    this.imageSrc = "diary";

    // If it is the first time the user opens the app, display a welcome message.
    // Otherwise, display a new note.
    // this.state has three settings: new, load, or the name of the note to display.
    if (welcome) {
        this.state = "Welcome";
        this.title = "Welcome";
        this.appContent = this.createAppContentSavedNote(this.state);
    } else {
        this.state = "new";
        this.title = "Untitled";
        this.appContent = this.createAppContentNew();
    }
}

/**
 * Creates the app content for a new note.
 * @returns {Node}
 */
Notebook.prototype.createAppContentNew = function() {
    var template = document.querySelector("#notebook-template-new");
    return document.importNode(template.content, true).querySelector(".app-content");
};

/**
 * Creates the app content for a saved note
 * @param {String} noteName The name of the note to load from local storage.
 * @returns {Node}
 */
Notebook.prototype.createAppContentSavedNote = function(noteName) {
    var template = document.querySelector("#notebook-template-new");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    // Get the note from noteArray.
    var note = this.getNote(noteName);

    // If there is a note, display its content.
    if (note) {
        appContent.querySelector(".note").value = note.content;
    }

    return appContent;
};

/**
 * Creates a blank note.
 */
Notebook.prototype.newNote = function() {
    this.state = "new";
    this.title = "Untitled";

    // Let the app container know it should refresh itself.
    this.appContent.parentNode.dispatchEvent(this.refresh);
};

/**
 * Saves a note.
 */
Notebook.prototype.saveNote = function() {
    // Do nothing if we are on the load screen.
    if (this.state === "load") {
        return;
    }

    // If the note is new, ask what we should call the note.
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
            // Push the note to the note array and to local storage.
            this.noteArray.push({name: name, content: this.appContent.querySelector(".note").value});
            localStorage.setItem("notes", JSON.stringify(this.noteArray));

            // Set the app state and title to display in the toolbar.
            this.state = name;
            this.title = name;

            // Let the app container know it should refresh itself.
            this.appContent.parentNode.dispatchEvent(this.refresh);
        }
    } else {
        // If the note is not new, save its new content.
        this.getNote(this.state).content = this.appContent.querySelector(".note").value;
        localStorage.setItem("notes", JSON.stringify(this.noteArray));
    }
};

/**
 * Display the load note screen.
 */
Notebook.prototype.loadScreen = function() {
    this.state = "load";
    this.title = "Load";

    // Let the app container know it should refresh itself.
    this.appContent.parentNode.dispatchEvent(this.refresh);
};

/**
 * Loads a note from the note array.
 * @param event
 */
Notebook.prototype.loadNote = function(event) {
    this.state = event.currentTarget.dataset.noteName;
    this.title = event.currentTarget.dataset.noteName;

    // Let the app container know it should refresh itself.
    this.appContent.parentNode.dispatchEvent(this.refresh);
};

/**
 * Deletes a note.
 * @param event
 */
Notebook.prototype.deleteNote = function(event) {
    event.stopPropagation();

    var name = event.target.dataset.noteName;
    var note = this.getNote(name);

    if (note) {
        this.noteArray.splice(this.noteArray.indexOf(note), 1);
        localStorage.setItem("notes", JSON.stringify(this.noteArray));
    }

    // Let the app container know it should refresh itself.
    this.appContent.parentNode.dispatchEvent(this.refresh);
};

/**
 * Create the app content of the load note menu.
 * @returns {Node}
 */
Notebook.prototype.createAppContentLoadMenu = function() {
    var template = document.querySelector("#notebook-template-load");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    var _this = this;

    // Create a list item for each note in the array and attach event listeners.
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

/**
 * Gets a note by its name.
 * @param {String} name The name of the note.
 * @returns {*}
 */
Notebook.prototype.getNote = function(name) {
    var resultNote = null;

    this.noteArray.forEach(function(note) {
        if (note.name === name) {
            resultNote = note;
        }
    });

    return resultNote;
};

/**
 * Create the app content depending on the state of the app.
 * @returns {Node}
 */
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
// App.js controls the UI and is responsible for creating new app instances. Adding new apps
// to the Personal Web Desktop should be as easy as importing it in app.js and creating it.

// The apps follow the same structure:
// They all contain a function called getAppContent, which returns the div that needs to
// be attached to the app window's app container. For apps that should only have one
// instance running (i.e. the Chat app) this appContent will be the same for all open windows.

(function init() {
    // Initialize the desktop.
    var Desktop = require("./Desktop");
    var desktop = new Desktop();

    // Import the necessary apps.
    var Notebook = require("./Notebook");
    var Memory = require("./Memory");
    var Chat = require("./Chat");

    // Attach event listeners to the menu icons.
    var newNotebookWindow = document.querySelector("#new_notebook");
    var newChatWindow = document.querySelector("#new_chat");
    var newMemoryWindow = document.querySelector("#new_memory");

    newNotebookWindow.addEventListener("click", function() {
        // Check if notes are available in localStorage. If not, create a welcome note and display it.
        if (!localStorage.getItem("notes")) {
            localStorage.setItem("notes", JSON.stringify([
                {name: "Welcome", content: "Welcome to the Notebook app!\n" +
                                           "Click on the icon to open the menu."}]));

            desktop.attachWindow(new Notebook(true));
        } else {
            desktop.attachWindow(new Notebook());
        }
    });

    newChatWindow.addEventListener("click", function() {
        // Check if the Chat is running. If not, instantiate it.
        if (!desktop.instances.chat) {
            // Check if the user has entered a username. If not, prompt them for one.
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
        // By default, all new Memory games are 4x4. This can later be changed.
        desktop.attachWindow(new Memory(4, 4));
    });
})();

},{"./Chat":2,"./Desktop":3,"./Memory":4,"./Notebook":5}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQXBwV2luZG93LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9DaGF0LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9EZXNrdG9wLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9NZW1vcnkuanMiLCJjbGllbnQvc291cmNlL2pzL05vdGVib29rLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9hcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDb25zdHJ1Y3RvciBmb3IgQXBwV2luZG93cy4gQXBwV2luZG93IGNyZWF0ZXMgYSB3aW5kb3cgYW5kIGF0dGFjaGVzIGV2ZW50IGxpc3RlbmVycyB0aGF0IGFsbG93XG4gKiB0aGUgdXNlciB0byBtb3ZlIHRoZSB3aW5kb3cgYW5kIGdpdmVzIGl0IGZvY3VzIHdoZW4gY2xpY2tlZC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBBcHBXaW5kb3coKSB7XG4gICAgdGhpcy5hcHAgPSBudWxsO1xuXG4gICAgdGhpcy5kaXYgPSB0aGlzLmNyZWF0ZVdpbmRvdygpO1xuXG4gICAgLy8gU3RvcmUgdGhlIGNvbXBvbmVudHMgb2YgdGhlIHdpbmRvdyBmb3IgZWFzZSBvZiByZXRyaWV2YWwuXG4gICAgdGhpcy50b29sYmFyID0gdGhpcy5kaXYucXVlcnlTZWxlY3RvcihcIi50b29sYmFyXCIpO1xuICAgIHRoaXMubWVudUljb24gPSB0aGlzLmRpdi5xdWVyeVNlbGVjdG9yKFwiLnRvb2xiYXItaWNvblwiKTtcbiAgICB0aGlzLm1lbnVUaXRsZSA9IHRoaXMuZGl2LnF1ZXJ5U2VsZWN0b3IoXCIudG9vbGJhci10aXRsZVwiKTtcbiAgICB0aGlzLmRyb3Bkb3duID0gdGhpcy5kaXYucXVlcnlTZWxlY3RvcihcIi50b29sYmFyLWRyb3Bkb3duXCIpO1xuICAgIHRoaXMuY2xvc2VXaW5kb3cgPSB0aGlzLmRpdi5xdWVyeVNlbGVjdG9yKFwiLmNsb3NlLXdpbmRvd1wiKTtcbiAgICB0aGlzLmFwcENvbnRhaW5lciA9IHRoaXMuZGl2LnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRhaW5lclwiKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCByZXR1cm5zIHRoZSBtYWluIEFwcFdpbmRvdyBkaXYuXG4gKiBAcmV0dXJucyB7RWxlbWVudH1cbiAqL1xuQXBwV2luZG93LnByb3RvdHlwZS5jcmVhdGVXaW5kb3cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3dpbmRvdy10ZW1wbGF0ZVwiKTtcbiAgICByZXR1cm4gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC13aW5kb3dcIik7XG59O1xuXG4vKipcbiAqIEF0dGFjaGVzIGFuIGFwcCB0byB0aGUgd2luZG93IGFuZCBzdG9yZXMgaXQgaW4gdGhpcy5hcHAuXG4gKiBAcGFyYW0gYXBwXG4gKi9cbkFwcFdpbmRvdy5wcm90b3R5cGUuYXR0YWNoQXBwID0gZnVuY3Rpb24oYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG5cbiAgICAvLyBDbGVhciB0aGUgYXBwIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVyZSBpcyBhbHJlYWR5IGNvbnRlbnQgaW5zaWRlLlxuICAgIHdoaWxlICh0aGlzLmFwcENvbnRhaW5lci5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5hcHBDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5hcHBDb250YWluZXIuZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgbWVudSBpY29uIGluIHRoZSB0b3AgbGVmdCBvZiB0aGUgdG9vbGJhci5cbiAgICBpZiAoYXBwLmltYWdlU3JjICE9PSBcIlwiKSB7XG4gICAgICAgIHRoaXMubWVudUljb24uc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiaW1hZ2UvXCIgKyBhcHAuaW1hZ2VTcmMgKyBcIi5wbmdcIik7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSB0aXRsZSBvZiB0aGUgYXBwLlxuICAgIGlmIChhcHAudGl0bGUgIT09IFwiXCIpIHtcbiAgICAgICAgdGhpcy5tZW51VGl0bGUudGV4dENvbnRlbnQgPSBhcHAudGl0bGU7XG4gICAgfVxuXG4gICAgLy8gQXR0YWNoIHRoZSBtZW51IGlmIHRoZXJlIGlzIG9uZS5cbiAgICBpZiAoYXBwLm1lbnVJdGVtcykge1xuICAgICAgICB0aGlzLmF0dGFjaE1lbnUoKTtcbiAgICB9XG5cbiAgICAvLyBBcHBlbmQgdGhlIGFwcCBjb250ZW50IG9mIHRoZSBhcHAgdG8gdGhlIG1haW4gYXBwIGNvbnRhaW5lciBvZiB0aGUgQXBwV2luZG93LlxuICAgIHRoaXMuYXBwQ29udGFpbmVyLmFwcGVuZENoaWxkKGFwcC5nZXRBcHBDb250ZW50KCkpO1xufTtcblxuLyoqXG4gKiBBdHRhY2ggdGhlIG1lbnUsIGlmIGFueSwgdG8gdGhlIEFwcFdpbmRvdyB0b29sYmFyLlxuICovXG5BcHBXaW5kb3cucHJvdG90eXBlLmF0dGFjaE1lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNkcm9wZG93bi10ZW1wbGF0ZVwiKTtcblxuICAgIC8vIEdpdmUgZWFjaCBkcm9wZG93biBtZW51IGl0ZW0gYSBuYW1lIGFuZCBhdHRhY2ggdGhlIG5lY2Vzc2FyeSBldmVudCBoYW5kbGVyLlxuICAgIHRoaXMuYXBwLm1lbnVJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdmFyIG1lbnVJdGVtID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmRyb3Bkb3duLWl0ZW1cIik7XG5cbiAgICAgICAgbWVudUl0ZW0ucXVlcnlTZWxlY3RvcihcIi5kcm9wZG93bi1uYW1lXCIpLnRleHRDb250ZW50ID0gaXRlbS5uYW1lO1xuXG4gICAgICAgIG1lbnVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBpdGVtLmV2ZW50SGFuZGxlciwgdHJ1ZSk7XG5cbiAgICAgICAgX3RoaXMuZHJvcGRvd24uYXBwZW5kQ2hpbGQobWVudUl0ZW0pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZWZyZXNoZXMgdGhlIGFwcCBjb250YWluZXIuXG4gKi9cbkFwcFdpbmRvdy5wcm90b3R5cGUucmVmcmVzaEFwcCA9IGZ1bmN0aW9uKCkge1xuICAgIHdoaWxlICh0aGlzLmFwcENvbnRhaW5lci5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5hcHBDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5hcHBDb250YWluZXIuZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIHRoaXMubWVudVRpdGxlLnRleHRDb250ZW50ID0gdGhpcy5hcHAudGl0bGU7XG5cbiAgICB0aGlzLmFwcENvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmFwcC5nZXRBcHBDb250ZW50KCkpO1xufTtcblxuLyoqXG4gKiBSZWZyZXNoZXMgb25seSB0aGUgdGl0bGUuXG4gKi9cbkFwcFdpbmRvdy5wcm90b3R5cGUucmVmcmVzaFRpdGxlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5tZW51VGl0bGUudGV4dENvbnRlbnQgPSB0aGlzLmFwcC50aXRsZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwV2luZG93O1xuIiwiLyoqXG4gKiBUaGUgY2hhdCBhcHBsaWNhdGlvbiBjb25zdHJ1Y3Rvci4gT25lIG9iamVjdCB3aWxsIGJlIGluc3RhbnRpYXRlZCBwZXIgZGVza3RvcC5cbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VybmFtZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENoYXQodXNlcm5hbWUpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5sYXN0TGluZXMgPSBbXTtcblxuICAgIC8vIFRoZSBpbWFnZSBhbmQgdGl0bGUgb2YgdGhlIGFwcC5cbiAgICB0aGlzLmltYWdlU3JjID0gXCJjaGF0XCI7XG4gICAgdGhpcy50aXRsZSA9IFwiV2ViY2hhdFwiO1xuXG4gICAgLy8gU3RvcmVzIHRoZSBkb2N1bWVudCB0aXRsZSBzbyB0aGF0IHRoZSBhcHAgY2FuIGNoYW5nZSBpdCBiYWNrIGFmdGVyIHRoZSB1c2VyIGhhcyBiZWVuIG5vdGlmaWVkLlxuICAgIHRoaXMuZGVmYXVsdFRpdGxlID0gZG9jdW1lbnQudGl0bGU7XG5cbiAgICB0aGlzLnVzZXJuYW1lID0gdXNlcm5hbWU7XG5cbiAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnQoKTtcbiAgICB0aGlzLmNoYXRMaW5lcyA9IHRoaXMuYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtbGluZXNcIik7XG4gICAgdGhpcy5hcGlLZXkgPSBcImVEQkU3NmRlVTdMMEg5bUVCZ3hVS1ZSMFZDbnEwWEJkXCI7XG4gICAgdGhpcy5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KFwid3M6Ly92aG9zdDMubG51LnNlOjIwMDgwL3NvY2tldC9cIik7XG5cbiAgICAvLyBBdHRhY2ggYW4gZXZlbnQgbGlzdGVuZXIgdG8ga25vdyB3aGVuIHRoZSB1c2VyIGZvY3VzZXMgb24gdGhlIFBXRCB0YWIuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgdGhpcy5oYW5kbGVWaXNpYmlsaXR5Q2hhbmdlLmJpbmQodGhpcykpO1xuXG4gICAgLy8gVE9ETzogTWFrZSBzdXJlIHRoZSBzb2NrZXQgb3BlbnMgYmVmb3JlIHRoZSB1c2VyIGNhbiBzZW5kIG1lc3NhZ2VzXG5cbiAgICAvLyBFdmVudCBoYW5kbGVyIGZvciBtZXNzYWdlcyByZWNlaXZlZCB0aHJvdWdoIHRoZSBjaGF0IGFwcGxpY2F0aW9uLlxuICAgIHRoaXMuc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcblxuICAgICAgICAvLyBBcHBlbmQgdGhlIGxpbmUgdG8gdGhlIENoYXQgbGluZXMsIHVubGVzcyBpdCBpcyBhIHNlcnZlciBoZWFydGJlYXQuXG4gICAgICAgIGlmIChtZXNzYWdlLnR5cGUgIT0gXCJoZWFydGJlYXRcIikge1xuICAgICAgICAgICAgX3RoaXMuYXBwZW5kTGluZShtZXNzYWdlLnVzZXJuYW1lLCBtZXNzYWdlLmRhdGEpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBhcHAgY29udGVudC5cbiAqIEByZXR1cm5zIHtFbGVtZW50fVxuICovXG5DaGF0LnByb3RvdHlwZS5jcmVhdGVBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjaGF0LXRlbXBsYXRlXCIpO1xuXG4gICAgdmFyIGFwcENvbnRlbnQgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG5cbiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKGFwcENvbnRlbnQpO1xuXG4gICAgcmV0dXJuIGFwcENvbnRlbnQ7XG59O1xuXG4vKipcbiAqIEF0dGFjaCBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIGFwcCBjb250ZW50LlxuICogQHBhcmFtIHtOb2RlfSBhcHBDb250ZW50XG4gKi9cbkNoYXQucHJvdG90eXBlLmF0dGFjaEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24oYXBwQ29udGVudCkge1xuICAgIHZhciBjaGF0Rm9ybSA9IGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5jaGF0LWZvcm1cIik7XG4gICAgdmFyIHRleHRBcmVhID0gY2hhdEZvcm0ucXVlcnlTZWxlY3RvcihcInRleHRhcmVhXCIpO1xuXG4gICAgdGV4dEFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVUZXh0SW5wdXQuYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIEV2ZW50IGhhbmRsZXIgZm9yIHRleHQgaW5wdXQuXG4gKiBAcGFyYW0gZXZlbnRcbiAqL1xuQ2hhdC5wcm90b3R5cGUuaGFuZGxlVGV4dElucHV0ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyBTaGlmdCArIEVudGVyIGNyZWF0ZXMgYSBuZXcgbGluZSwgRW50ZXIgc2VuZHMgYSBtZXNzYWdlLlxuICAgIGlmICghZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAvLyBIYW5kbGUgY2hhdCBjb21tYW5kcywgaWYgYW55LCBvdGhlcndpc2Ugc2VuZCB0aGUgbWVzc2FnZS5cbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC52YWx1ZS5jaGFyQXQoMCkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUNvbW1hbmQoZXZlbnQudGFyZ2V0LnZhbHVlLnNsaWNlKDEpKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC50YXJnZXQudmFsdWUgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZE1lc3NhZ2UoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV2ZW50LnRhcmdldC52YWx1ZSA9IFwiXCI7XG4gICAgfVxufTtcblxuLyoqXG4gKiBIYW5kbGVzIHVzZXIgY29tbWFuZHMuXG4gKiBAcGFyYW0ge1N0cmluZ30gY29tbWFuZFxuICovXG5DaGF0LnByb3RvdHlwZS5oYW5kbGVDb21tYW5kID0gZnVuY3Rpb24oY29tbWFuZCkge1xuICAgIC8vIERpdmlkZSBjb21tYW5kIGludG8ga2V5d29yZCBhbmQgcGFyYW1ldGVycy5cbiAgICB2YXIgY29tbWFuZEtleXdvcmQgPSBjb21tYW5kLnNwbGl0KFwiIFwiKVswXTtcbiAgICB2YXIgY29tbWFuZFBhcmFtZXRlcnMgPSBudWxsO1xuXG4gICAgaWYgKGNvbW1hbmQuc3BsaXQoXCIgXCIpLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY29tbWFuZFBhcmFtZXRlcnMgPSBjb21tYW5kLnN1YnN0cihjb21tYW5kLmluZGV4T2YoXCIgXCIpICsgMSwgY29tbWFuZC5sZW5ndGgpO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSB0aGUgZGlmZmVyZW50IGtleXdvcmRzLiAoT25seSBvbmUgZm9yIG5vdykuXG4gICAgc3dpdGNoIChjb21tYW5kS2V5d29yZCkge1xuICAgICAgICBjYXNlIFwibmFtZVwiOlxuICAgICAgICAgICAgaWYgKGNvbW1hbmRQYXJhbWV0ZXJzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZSA9IGNvbW1hbmRQYXJhbWV0ZXJzO1xuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidXNlcm5hbWVcIiwgY29tbWFuZFBhcmFtZXRlcnMpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRMaW5lKFwiUFdEXCIsIFwiWW91ciB1c2VybmFtZSBpcyBub3cgXCIgKyBjb21tYW5kUGFyYW1ldGVycyArIFwiLlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRMaW5lKFwiUFdEXCIsIFwiUGxlYXNlIGVudGVyIGEgdXNlcm5hbWUuXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kTGluZShcIlBXRFwiLCBjb21tYW5kS2V5d29yZCArIFwiIGNvbW1hbmQgbm90IHlldCBpbXBsZW1lbnRlZC5cIik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGaXJlcyB3aGVuIHRoZSB1c2VyIGNhbi9jYW5ub3Qgc2VlIHRoZSBQV0QgdGFiLlxuICovXG5DaGF0LnByb3RvdHlwZS5oYW5kbGVWaXNpYmlsaXR5Q2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gQ2hhbmdlIHRoZSBkb2N1bWVudCB0aXRsZSB0byB0aGUgZGVmYXVsdCB0aXRsZSBpZiB0aGUgdXNlciBjYW4gc2VlIHRoZSB0YWIuXG4gICAgaWYgKCFkb2N1bWVudC5oaWRkZW4pIHtcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aGlzLmRlZmF1bHRUaXRsZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEFkZHMgdGhlIG1lc3NhZ2UgdG8gdGhlIGxhc3RMaW5lcyBhcnJheS5cbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VybmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IGxpbmVcbiAqL1xuQ2hhdC5wcm90b3R5cGUuYXBwZW5kTGluZSA9IGZ1bmN0aW9uKHVzZXJuYW1lLCBsaW5lKSB7XG4gICAgdGhpcy5sYXN0TGluZXMucHVzaCh7dXNlcm5hbWU6IHVzZXJuYW1lLCBsaW5lOiBsaW5lfSk7XG5cbiAgICAvLyBMYXN0IGxpbmVzIG9ubHkgc3RvcmVzIHRoZSBsYXN0IDIwIG1lc3NhZ2VzLlxuICAgIGlmICh0aGlzLmxhc3RMaW5lcy5sZW5ndGggPiAyMCkge1xuICAgICAgICB0aGlzLmxhc3RMaW5lcy5zaGlmdCgpO1xuICAgIH1cblxuICAgIC8vIFBsYXkgbm90aWZpY2F0aW9uIHNvdW5kIGFuZCBjaGFuZ2UgdGhlIGRvY3VtZW50IHRpdGxlIGlmIHRoZSBkb2N1bWVudCBpcyBub3QgdmlzaWJsZS5cbiAgICBpZiAoZG9jdW1lbnQuaGlkZGVuKSB7XG4gICAgICAgIHZhciBhdWRpbyA9IHRoaXMuYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiYXVkaW9cIik7XG5cbiAgICAgICAgYXVkaW8ucGxheSgpO1xuXG4gICAgICAgIGRvY3VtZW50LnRpdGxlID0gXCIqIFwiICsgdGhpcy5kZWZhdWx0VGl0bGU7XG4gICAgfVxuXG4gICAgdGhpcy5jb252ZXJ0TGluZXNUb0hUTUwoKTtcbn07XG5cbi8qKlxuICogQ29udmVydHMgbGluZXMgaW4gbGFzdExpbmVzIGFycmF5IHRvIEhUTUwgYW5kIGF0dGFjaGVzIHRoZW0gdG8gdGhlIGFwcCBjb250ZW50LlxuICovXG5DaGF0LnByb3RvdHlwZS5jb252ZXJ0TGluZXNUb0hUTUwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY2hhdC1saW5lLXRlbXBsYXRlXCIpO1xuICAgIHZhciBjaGF0TGluZSA9IGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5jaGF0LW1lc3NhZ2VcIik7XG5cbiAgICB3aGlsZSAodGhpcy5jaGF0TGluZXMuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIHRoaXMuY2hhdExpbmVzLnJlbW92ZUNoaWxkKHRoaXMuY2hhdExpbmVzLmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmxhc3RMaW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUsIGluZGV4KSB7XG4gICAgICAgIHZhciBvcmRlciA9IF90aGlzLmxhc3RMaW5lcy5sZW5ndGggLSBpbmRleDtcbiAgICAgICAgdmFyIG5ld0xpbmUgPSBjaGF0TGluZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIG5ld0xpbmUucXVlcnlTZWxlY3RvcihcIi51c2VybmFtZVwiKS50ZXh0Q29udGVudCA9IGxpbmUudXNlcm5hbWU7XG4gICAgICAgIG5ld0xpbmUucXVlcnlTZWxlY3RvcihcIi5jaGF0LWxpbmVcIikudGV4dENvbnRlbnQgPSBsaW5lLmxpbmU7XG5cbiAgICAgICAgbmV3TGluZS5zdHlsZS5vcmRlciA9IG9yZGVyO1xuXG4gICAgICAgIF90aGlzLmNoYXRMaW5lcy5hcHBlbmRDaGlsZChuZXdMaW5lKTtcbiAgICB9KTtcblxuICAgIHZhciBmb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG5cbiAgICBmb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jaGF0XCIpLCBmdW5jdGlvbihjaGF0V2luKSB7XG4gICAgICAgIHZhciBuZXdDaGF0ID0gX3RoaXMuY2hhdExpbmVzLmNsb25lTm9kZSh0cnVlKTtcblxuICAgICAgICBjaGF0V2luLnJlbW92ZUNoaWxkKGNoYXRXaW4ucXVlcnlTZWxlY3RvcihcIi5jaGF0LWxpbmVzXCIpKTtcblxuICAgICAgICBjaGF0V2luLmluc2VydEJlZm9yZShuZXdDaGF0LCBjaGF0V2luLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1mb3JtXCIpKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogU2VuZHMgYSBtZXNzYWdlIHRvIHRoZSBzZXJ2ZXIuXG4gKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICovXG5DaGF0LnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICB2YXIgZGF0YSA9IHt9O1xuXG4gICAgZGF0YS51c2VybmFtZSA9IHRoaXMudXNlcm5hbWU7XG4gICAgZGF0YS5kYXRhID0gbWVzc2FnZTtcbiAgICBkYXRhLmtleSA9IHRoaXMuYXBpS2V5O1xuICAgIGRhdGEudHlwZSA9IFwibWVzc2FnZVwiO1xuXG4gICAgdGhpcy5zb2NrZXQuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG5cbiAgICAvLyBPZmZsaW5lIGNhcGFiaWxpdGllcyBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAgICAvL3RoaXMuYXBwZW5kTGluZSh0aGlzLnVzZXJuYW1lLCBtZXNzYWdlKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIGNsb25lIG9mIHRoZSBhcHBDb250ZW50LlxuICogQHJldHVybnMge05vZGV9XG4gKi9cbkNoYXQucHJvdG90eXBlLmdldEFwcENvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBDbG9uaW5nIGRvZXMgbm90IGF0dGFjaCBldmVudCBsaXN0ZW5lcnMsIHNvIHdlIGhhdmUgdG8gZG8gaXQgYWZ0ZXJ3YXJkc1xuICAgIHZhciBjb250ZW50ID0gdGhpcy5hcHBDb250ZW50LmNsb25lTm9kZSh0cnVlKTtcblxuICAgIHRoaXMuYXR0YWNoRXZlbnRMaXN0ZW5lcnMoY29udGVudCk7XG5cbiAgICByZXR1cm4gY29udGVudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhdDtcbiIsInZhciBBcHBXaW5kb3cgPSByZXF1aXJlKFwiLi9BcHBXaW5kb3dcIik7XG5cbi8qKlxuICogRGVza3RvcCBvYmplY3Qgd2hpY2ggY29udGFpbnMgYWxsIHRoZSBBcHBXaW5kb3cgb2JqZWN0cy5cbiAqL1xuZnVuY3Rpb24gRGVza3RvcCgpIHtcbiAgICAvLyBMaXN0IG9mIGFwcCB3aW5kb3dzLlxuICAgIHRoaXMud2luZG93cyA9IFtdO1xuXG4gICAgLy8gUmV0cmlldmUgdGhlIHVzZXIncyB1c2VybmFtZS5cbiAgICB0aGlzLnVzZXJuYW1lID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ1c2VybmFtZVwiKTtcblxuICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN3aW5kb3dfY29udGFpbmVyXCIpO1xuXG4gICAgLy8gVGhlIG9iamVjdCB0aGF0IGNvbnRhaW5zIGFwcHMgdGhhdCBzaG91bGQgb25seSBoYXZlIG9uZSBpbnN0YW5jZSBhY3Jvc3MgdGhlIGRlc2t0b3AgKGUuZy4gY2hhdCkuXG4gICAgdGhpcy5pbnN0YW5jZXMgPSB7XG5cbiAgICB9O1xuXG4gICAgLy8gVmFyaWFibGVzIHRoYXQgc3RvcmUgdGhlIHdpbmRvdyB0aGF0IGlzIG1vdmluZyBhbmQgdGhlIHpJbmRleCBvZiB0aGUgd2luZG93IG9uIHRvcC5cbiAgICB0aGlzLm1vdmluZ1dpbmRvdyA9IG51bGw7XG4gICAgdGhpcy50b3BaSW5kZXggPSAxO1xuXG4gICAgLy8gRGlzdGFuY2UgZnJvbSB0aGUgY3Vyc29yIHRvIHRoZSBlZGdlIG9mIHRoZSBlbGVtZW50LlxuICAgIHRoaXMuZGlzdGFuY2UgPSB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDBcbiAgICB9O1xuXG4gICAgLy8gUG9zaXRpb24gb2YgdGhlIG1vdXNlLlxuICAgIHRoaXMubW91c2VQb3MgPSB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDBcbiAgICB9O1xuXG4gICAgLy8gRG9jdW1lbnQgZXZlbnQgbGlzdGVuZXJzLlxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5tb3ZlV2luZG93LmJpbmQodGhpcykpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vdmluZ1dpbmRvdyA9IG51bGw7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn1cblxuLyoqXG4gKiBBdHRhY2hlcyBhbiBhcHAgdG8gYSB3aW5kb3cgYW5kIHRoYXQgd2luZG93IHRvIHRoZSBkZXNrdG9wLlxuICogQHBhcmFtIGFwcFxuICovXG5EZXNrdG9wLnByb3RvdHlwZS5hdHRhY2hXaW5kb3cgPSBmdW5jdGlvbihhcHApIHtcbiAgICB2YXIgYXBwV2luZG93ID0gbmV3IEFwcFdpbmRvdygpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlcmUgYXJlIGFueSB3aW5kb3dzIGluIHRoZSBkZXNrdG9wLiBJZiBzbywgY2hhbmdlIGl0cyBwb3NpdGlvbi5cbiAgICBpZiAodGhpcy53aW5kb3dzLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgIGFwcFdpbmRvdy5kaXYuc3R5bGUubGVmdCA9ICh0aGlzLndpbmRvd3NbdGhpcy53aW5kb3dzLmxlbmd0aCAtIDFdLmRpdi5vZmZzZXRMZWZ0ICsgMTUpICsgXCJweFwiO1xuICAgICAgICBhcHBXaW5kb3cuZGl2LnN0eWxlLnRvcCA9ICh0aGlzLndpbmRvd3NbdGhpcy53aW5kb3dzLmxlbmd0aCAtIDFdLmRpdi5vZmZzZXRUb3AgKyAzMCkgKyBcInB4XCI7XG4gICAgfVxuXG4gICAgLy8gTWFrZSBzdXJlIHRoZSBuZXcgd2luZG93IGlzIG9uIHRvcC5cbiAgICBhcHBXaW5kb3cuZGl2LnN0eWxlLnpJbmRleCA9IHRoaXMudG9wWkluZGV4O1xuICAgIHRoaXMudG9wWkluZGV4ICs9IDE7XG5cbiAgICAvLyBXZSBwdXNoIGl0IHRvIHRoZSBsaXN0IG9mIHdpbmRvd3MgZmlyc3QsIHNvIHRoYXQgd2Uga25vdyB0aGUgYXBwIHdpbmRvdydzIGluZGV4IGluIHRoZSBhcnJheVxuICAgIHRoaXMud2luZG93cy5wdXNoKGFwcFdpbmRvdyk7XG5cbiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKGFwcFdpbmRvdyk7XG5cbiAgICAvLyBBdHRhY2ggdGhlIGFwcCB0byB0aGUgd2luZG93LlxuICAgIGlmIChhcHApIHtcbiAgICAgICAgYXBwV2luZG93LmF0dGFjaEFwcChhcHApO1xuICAgIH1cblxuICAgIC8vIEF0dGFjaCB0aGUgd2luZG93IHRvIHRoZSBkZXNrdG9wLlxuICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKGFwcFdpbmRvdy5kaXYpO1xufTtcblxuLyoqXG4gKiBBdHRhY2ggZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBhcHAgd2luZG93LlxuICogQHBhcmFtIGFwcFdpbmRvd1xuICovXG5EZXNrdG9wLnByb3RvdHlwZS5hdHRhY2hFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uKGFwcFdpbmRvdykge1xuICAgIC8vIEF0dGFjaGVzIHRoZSBldmVudCBsaXN0ZW5lciB0aGF0IGdpdmVzIHRoZSBhcHAgd2luZG93IGZvY3VzLlxuICAgIGFwcFdpbmRvdy5kaXYuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB0aGlzLmdpdmVGb2N1cy5iaW5kKHRoaXMpKTtcblxuICAgIC8vIEF0dGFjaGVzIHRoZSBldmVudCBsaXN0ZW5lciB0aGF0IGhpZGVzIHRoZSBtZW51LlxuICAgIGFwcFdpbmRvdy5kaXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICghYXBwV2luZG93LmRyb3Bkb3duLmNsYXNzTGlzdC5jb250YWlucyhcInJlbW92ZWRcIikgJiYgIWV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJ0b29sYmFyLWljb25cIikpIHtcbiAgICAgICAgICAgIGFwcFdpbmRvdy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwicmVtb3ZlZFwiKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gUmVmcmVzaGVzIHRoZSBhcHAgd2hlbiB0aGUgY3VzdG9tIGV2ZW50IFwicmVmcmVzaFwiIGZpcmVzIGZyb20gdGhlIGFwcENvbnRhaW5lci4gQXBwcyBhcmUgcmVzcG9uc2libGUgZm9yIGZpcmluZ1xuICAgIC8vIHRoaXMgZXZlbnQuXG4gICAgYXBwV2luZG93LmFwcENvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwicmVmcmVzaFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYXBwV2luZG93LnJlZnJlc2hBcHAoKTtcbiAgICB9KTtcblxuICAgIC8vIFNhbWUsIGJ1dCBmb3Igb25seSB0aGUgdGl0bGUuXG4gICAgYXBwV2luZG93LmFwcENvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwicmVmcmVzaHRpdGxlXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICBhcHBXaW5kb3cucmVmcmVzaFRpdGxlKCk7XG4gICAgfSk7XG5cbiAgICAvLyBBdHRhY2hlcyB0aGUgZXZlbnQgbGlzdGVuZXIgdGhhdCBzdGFydHMgbW92aW5nIHRoZSB3aW5kb3dcbiAgICBhcHBXaW5kb3cudG9vbGJhci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMuc3RhcnRNb3ZlLmJpbmQodGhpcykpO1xuXG4gICAgLy8gQXR0YWNoZXMgdGhlIGV2ZW50IGxpc3RlbmVyIHRoYXQgc2hvd3MgdGhlIGRyb3Bkb3duIG1lbnUuXG4gICAgYXBwV2luZG93Lm1lbnVJY29uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNob3dNZW51LmJpbmQoYXBwV2luZG93KSk7XG5cbiAgICAvLyBBdHRhY2hlcyB0aGUgZXZlbnQgbGlzdGVuZXIgdGhhdCBjbG9zZXMgdGhlIHdpbmRvdyBhbmQgcmVtb3ZlcyBpdCBmcm9tIHRoZSBsaXN0IG9mIHdpbmRvd3MuXG4gICAgYXBwV2luZG93LmNsb3NlV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy9UT0RPOiBtYWtlIHN1cmUgdGhpcyBkZWxldGVzIHRoZSBjaGF0IGluc3RhbmNlIHRvbyFcbiAgICAgICAgdGhpcy5jb250YWluZXIucmVtb3ZlQ2hpbGQoYXBwV2luZG93LmRpdik7XG4gICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UodGhpcy53aW5kb3dzLmluZGV4T2YoYXBwV2luZG93KSwgMSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbi8qKlxuICogR2l2ZXMgZm9jdXMgdG8gdGhlIGN1cnJlbnQgd2luZG93LlxuICogQHBhcmFtIGV2ZW50XG4gKi9cbkRlc2t0b3AucHJvdG90eXBlLmdpdmVGb2N1cyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIHdpbmRvdyBpcyBvbiB0b3AuIElmIG5vdCwgcHVzaCBpdCB0byB0aGUgdG9wLlxuICAgIGlmIChwYXJzZUludChldmVudC5jdXJyZW50VGFyZ2V0LnN0eWxlLnpJbmRleCwgMTApICE9PSB0aGlzLnRvcFpJbmRleCAtIDEpIHtcbiAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldC5zdHlsZS56SW5kZXggPSB0aGlzLnRvcFpJbmRleDtcbiAgICAgICAgdGhpcy50b3BaSW5kZXggKz0gMTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFNob3dzIHRoZSBkcm9wZG93biBtZW51LlxuICogQHBhcmFtIGV2ZW50XG4gKi9cbkRlc2t0b3AucHJvdG90eXBlLnNob3dNZW51ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QudG9nZ2xlKFwicmVtb3ZlZFwiKTtcbn07XG5cbi8qKlxuICogTW92ZXMgdGhlIHNlbGVjdGVkIHdpbmRvdy5cbiAqIEBwYXJhbSBldmVudFxuICovXG5EZXNrdG9wLnByb3RvdHlwZS5tb3ZlV2luZG93ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyBGaW5kcyB0aGUgbW91c2UgcG9zaXRpb24gaW4gdGhlIHdpbmRvdyBjb250YWluZXIuXG4gICAgdGhpcy5tb3VzZVBvcy54ID0gZXZlbnQuY2xpZW50WCAtIHRoaXMuY29udGFpbmVyLm9mZnNldExlZnQ7XG4gICAgdGhpcy5tb3VzZVBvcy55ID0gZXZlbnQuY2xpZW50WSAtIHRoaXMuY29udGFpbmVyLm9mZnNldFRvcDtcblxuICAgIGlmICh0aGlzLm1vdmluZ1dpbmRvdykge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIC8vIENoYW5nZSB0aGUgdG9wIGFuZCBsZWZ0IG9mIHRoZSBzZWxlY3RlZCB3aW5kb3cgdG8gdGhlIHBvc2l0aW9uIG9mIHRoZSBtb3VzZSBtaW51cyB0aGUgZGlzdGFuY2UgdG9cbiAgICAgICAgLy8gdGhlIHdpbmRvdydzIHRvcCBsZWZ0IGVkZ2UuXG4gICAgICAgIHRoaXMubW92aW5nV2luZG93LnN0eWxlLnRvcCA9ICB0aGlzLm1vdXNlUG9zLnkgLSB0aGlzLmRpc3RhbmNlLnkgKyBcInB4XCI7XG4gICAgICAgIHRoaXMubW92aW5nV2luZG93LnN0eWxlLmxlZnQgPSAgdGhpcy5tb3VzZVBvcy54IC0gdGhpcy5kaXN0YW5jZS54ICsgXCJweFwiO1xuXG4gICAgICAgIC8vIFByZXZlbnQgdGhlIHdpbmRvdyBmcm9tIG1vdmluZyBvZmYgdGhlIHRvcCBvZiB0aGUgZGVza3RvcC4gT3RoZXIgZGlyZWN0aW9ucyBhcmUgZmluZSxcbiAgICAgICAgLy8ganVzdCBsaWtlIGluIGEgcmVhbCBvcGVyYXRpbmcgc3lzdGVtIVxuICAgICAgICBpZiAodGhpcy5tb3ZpbmdXaW5kb3cub2Zmc2V0VG9wIDwgMCkge1xuICAgICAgICAgICAgdGhpcy5tb3ZpbmdXaW5kb3cuc3R5bGUudG9wID0gMDtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogU3RhcnRzIHRoZSBtb3ZlLlxuICogQHBhcmFtIGV2ZW50XG4gKi9cbkRlc2t0b3AucHJvdG90eXBlLnN0YXJ0TW92ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdmFyIG1vdmluZ1Rvb2xiYXIgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuXG4gICAgLy8gTWFrZSBzdXJlIHRoZSB1c2VyIGlzbid0IHNlbGVjdGluZyB0aGUgbWVudSBpY29uIG9yIFwiY2xvc2Ugd2luZG93XCIgYnV0dG9uLlxuICAgIGlmICghZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcInRvb2xiYXItdGl0bGVcIikgJiYgZXZlbnQudGFyZ2V0ICE9PSBtb3ZpbmdUb29sYmFyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIG1vdmluZyB3aW5kb3cgYW5kIHRoZSBkaXN0YW5jZSB0byB0aGUgZWxlbWVudCdzIGVkZ2VzLlxuICAgIHRoaXMubW92aW5nV2luZG93ID0gbW92aW5nVG9vbGJhci5wYXJlbnROb2RlO1xuXG4gICAgdGhpcy5kaXN0YW5jZS54ID0gdGhpcy5tb3VzZVBvcy54IC0gbW92aW5nVG9vbGJhci5wYXJlbnROb2RlLm9mZnNldExlZnQ7XG4gICAgdGhpcy5kaXN0YW5jZS55ID0gdGhpcy5tb3VzZVBvcy55IC0gbW92aW5nVG9vbGJhci5wYXJlbnROb2RlLm9mZnNldFRvcDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRGVza3RvcDtcbiIsIi8qKlxuICogQ29uc3RydWN0b3IgZm9yIHRoZSBtZW1vcnkgYXBwLlxuICogQHBhcmFtIHtOdW1iZXJ9IGJvYXJkWCBUaGUgd2lkdGggb2YgdGhlIGJvYXJkIGluIGJyaWNrcy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBib2FyZFkgVGhlIGhlaWdodCBvZiB0aGUgYm9hcmQgaW4gYnJpY2tzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE1lbW9yeShib2FyZFgsIGJvYXJkWSkge1xuICAgIC8vIFNldCB0aGUgaW1hZ2UgYW5kIHRpdGxlLlxuICAgIHRoaXMuaW1hZ2VTcmMgPSBcInB1enpsZVwiO1xuICAgIHRoaXMudGl0bGUgPSBcIk1lbW9yeVwiO1xuXG4gICAgLy8gRGVmYXVsdCBzaXplIGlzIDQgYnkgNC5cbiAgICB0aGlzLmJvYXJkWCA9IGJvYXJkWCB8fCA0O1xuICAgIHRoaXMuYm9hcmRZID0gYm9hcmRZIHx8IDQ7XG5cbiAgICAvLyBCcmljayBoYW5kbGluZy5cbiAgICB0aGlzLmJyaWNrcyA9IFtdO1xuICAgIHRoaXMudG90YWxCcmlja3MgPSAwO1xuICAgIHRoaXMucmVtb3ZlZEJyaWNrcyA9IDA7XG5cbiAgICAvLyBUaGUgbnVtYmVyIG9mIG1vdmVzIGFuZCB0aW1lIHRha2VuLlxuICAgIHRoaXMubW92ZXMgPSAwO1xuICAgIHRoaXMudGltZVRha2VuID0gMDtcblxuICAgIHRoaXMudGltZXIgPSAwO1xuXG4gICAgLy8gU3RvcmUgZWxlbWVudHMgZm9yIGVhc2Ugb2YgYWNjZXNzLlxuICAgIHRoaXMuYm9hcmQgPSBudWxsO1xuICAgIHRoaXMuaW5mbyA9IG51bGw7XG4gICAgdGhpcy5uZXdHYW1lRm9ybSA9IG51bGw7XG5cbiAgICAvLyBDdXN0b20gZXZlbnQgbGlzdGVuZXIgZm9yIHJlZnJlc2hpbmcgdGhlIHRpdGxlLlxuICAgIHRoaXMucmVmcmVzaFRpdGxlID0gbmV3IEV2ZW50KFwicmVmcmVzaHRpdGxlXCIpO1xuXG4gICAgLy8gU3RvcmUgZXZlbnRzIHNvIHRoYXQgd2UgY2FuIHJlbW92ZSB0aGVtIGxhdGVyLlxuICAgIHRoaXMuYm91bmRSZXZlYWwgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB0aGlzLnJldmVhbEJyaWNrKGV2ZW50LnRhcmdldCk7XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5ib3VuZEtleWJvYXJkSGFuZGxlciA9IHRoaXMua2V5Ym9hcmRIYW5kbGVyLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmJvdW5kTmV3R2FtZSA9IHRoaXMubmV3R2FtZS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5zZWxlY3RlZEJyaWNrID0gbnVsbDtcblxuICAgIHRoaXMuYnJpY2tFbGVtZW50cyA9IG51bGw7XG5cbiAgICB0aGlzLmhpZ2hsaWdodGVkQnJpY2sgPSBudWxsO1xuXG4gICAgdGhpcy5hcHBDb250ZW50ID0gdGhpcy5jcmVhdGVBcHBDb250ZW50KCk7XG5cbiAgICB0aGlzLmFwcENvbnRlbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuc2V0QWN0aXZlR2FtZS5iaW5kKHRoaXMpKTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHRoaXMuYm91bmRLZXlib2FyZEhhbmRsZXIpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGFwcENvbnRlbnQgZm9yIHRoZSBtZW1vcnkgYXBwbGljYXRpb24uXG4gKiBAcmV0dXJucyB7Tm9kZX1cbiAqL1xuTWVtb3J5LnByb3RvdHlwZS5jcmVhdGVBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNtZW1vcnktdGVtcGxhdGVcIik7XG4gICAgdmFyIGFwcENvbnRlbnQgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG5cbiAgICB0aGlzLmJvYXJkID0gYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmJvYXJkXCIpO1xuICAgIHRoaXMuaW5mbyA9IGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5pbmZvXCIpO1xuICAgIHRoaXMubmV3R2FtZUZvcm0gPSBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIubmV3LWdhbWVcIik7XG4gICAgdGhpcy5pbml0aWFsaXplQm9hcmQoKTtcbiAgICB0aGlzLnNldEFjdGl2ZUdhbWUoKTtcblxuICAgIHRoaXMuYXR0YWNoRXZlbnRMaXN0ZW5lcnMoYXBwQ29udGVudCk7XG5cbiAgICByZXR1cm4gYXBwQ29udGVudDtcbn07XG5cbi8qKlxuICogQXR0YWNoZXMgZXZlbnQgbGlzdGVuZXJzLlxuICogQHBhcmFtIHtOb2RlfSBhcHBDb250ZW50XG4gKi9cbk1lbW9yeS5wcm90b3R5cGUuYXR0YWNoRXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbihhcHBDb250ZW50KSB7XG4gICAgdGhpcy5ib2FyZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5ib3VuZFJldmVhbCk7XG4gICAgdGhpcy5uZXdHYW1lRm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIHRoaXMuYm91bmROZXdHYW1lKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgZm9ybSBkb2VzIG5vdCBzdWJtaXQgd2hpbGUgdGhlIGFib3ZlIGV2ZW50IGxpc3RlbmVyIGlzIHJlbW92ZWQuXG4gICAgdGhpcy5uZXdHYW1lRm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIGN1cnJlbnQgZ2FtZSB0byBhY3RpdmUsIHNvIHRoYXQgdGhlIHBsYXllciBjYW4gcGxheSB0aGUgZ2FtZSB3aXRoIHRoZSBrZXlib2FyZC5cbiAqL1xuTWVtb3J5LnByb3RvdHlwZS5zZXRBY3RpdmVHYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDtcblxuICAgIGZvckVhY2guY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmJvYXJkXCIpLCBmdW5jdGlvbihib2FyZCkge1xuICAgICAgICBib2FyZC5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5ib2FyZC5jbGFzc0xpc3QuYWRkKFwiYWN0aXZlXCIpO1xufTtcblxuLyoqXG4gKiBLZXlib2FyZCBoYW5kbGVyIGZvciB0aGUgTWVtb3J5IGdhbWUuIENvbnRyb2xzIGFyZSBsZWZ0LCB1cCwgcmlnaHQsIGRvd24sIGFuZCBlbnRlci5cbiAqL1xuTWVtb3J5LnByb3RvdHlwZS5rZXlib2FyZEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBpbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2Y7XG5cbiAgICBpZiAoIXRoaXMuYm9hcmQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYWN0aXZlXCIpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBVbi1oaWdobGlnaHQgYSBicmljayBpZiBpdCBpcyBoaWdobGlnaHRlZFxuICAgIHRoaXMuaGlnaGxpZ2h0ZWRCcmljay5jbGFzc0xpc3QucmVtb3ZlKFwiaGlnaGxpZ2h0ZWRcIik7XG5cbiAgICB2YXIgb2xkQnJpY2sgPSB0aGlzLmhpZ2hsaWdodGVkQnJpY2s7XG5cbiAgICB2YXIgaW5kZXggPSBpbmRleE9mLmNhbGwodGhpcy5icmlja0VsZW1lbnRzLCB0aGlzLmhpZ2hsaWdodGVkQnJpY2spO1xuXG4gICAgLy8gVGhpcyBzd2l0Y2ggY2hlY2tzIHRoZSBrZXljb2RlIG9mIHRoZSBldmVudCBhbmQgdGhlbiBpdGVyYXRlcyB0aHJvdWdoIHRoZSBjb3JyZXNwb25kaW5nXG4gICAgLy8gZGlyZWN0aW9uIHVudGlsIGl0IGZpbmRzIGEgYnJpY2sgdGhhdCBoYXMgbm90IGJlZW4gcmVtb3ZlZCwgdGhlbiBpdCBoaWdobGlnaHRzIGl0LlxuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgICBjYXNlIDM3OlxuXG4gICAgICAgICAgICAvLyBsZWZ0XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRCcmljayA9IHRoaXMuYnJpY2tFbGVtZW50c1tpbmRleCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBpbmRleCAtPSAxO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRCcmljayA9IG9sZEJyaWNrO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IHdoaWxlICh0aGlzLmhpZ2hsaWdodGVkQnJpY2suY2xhc3NMaXN0LmNvbnRhaW5zKFwicmVtb3ZlZFwiKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzODpcblxuICAgICAgICAgICAgLy8gdXBcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggLSB0aGlzLmJvYXJkWCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRCcmljayA9IHRoaXMuYnJpY2tFbGVtZW50c1tpbmRleCAtIHRoaXMuYm9hcmRYXTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggLT0gdGhpcy5ib2FyZFg7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRlZEJyaWNrID0gb2xkQnJpY2s7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKHRoaXMuaGlnaGxpZ2h0ZWRCcmljay5jbGFzc0xpc3QuY29udGFpbnMoXCJyZW1vdmVkXCIpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM5OlxuXG4gICAgICAgICAgICAvLyByaWdodFxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gdGhpcy5icmlja0VsZW1lbnRzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRlZEJyaWNrID0gdGhpcy5icmlja0VsZW1lbnRzW2luZGV4ICsgMV07XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ICs9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRlZEJyaWNrID0gb2xkQnJpY2s7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKHRoaXMuaGlnaGxpZ2h0ZWRCcmljay5jbGFzc0xpc3QuY29udGFpbnMoXCJyZW1vdmVkXCIpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDQwOlxuXG4gICAgICAgICAgICAvLyBkb3duXG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICsgdGhpcy5ib2FyZFggPCB0aGlzLmJyaWNrRWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ZWRCcmljayA9IHRoaXMuYnJpY2tFbGVtZW50c1tpbmRleCArIHRoaXMuYm9hcmRYXTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gdGhpcy5ib2FyZFg7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRlZEJyaWNrID0gb2xkQnJpY2s7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKHRoaXMuaGlnaGxpZ2h0ZWRCcmljay5jbGFzc0xpc3QuY29udGFpbnMoXCJyZW1vdmVkXCIpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDEzOlxuXG4gICAgICAgICAgICAvLyBlbnRlclxuICAgICAgICAgICAgdGhpcy5yZXZlYWxCcmljayh0aGlzLmhpZ2hsaWdodGVkQnJpY2spO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gUmUtaGlnaGxpZ2h0IHRoZSBicmlja1xuICAgIHRoaXMuaGlnaGxpZ2h0ZWRCcmljay5jbGFzc0xpc3QuYWRkKFwiaGlnaGxpZ2h0ZWRcIik7XG59O1xuXG4vKipcbiAqIFN0YXJ0cyBhIG5ldyBnYW1lLlxuICogQHBhcmFtIGV2ZW50XG4gKi9cbk1lbW9yeS5wcm90b3R5cGUubmV3R2FtZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIC8vIEdldHMgdGhlIGJvYXJkWCBhbmQgYm9hcmRZIGZyb20gdGhlIGZvcm0uXG4gICAgdmFyIG5ld0JvYXJkWCA9IGV2ZW50LnRhcmdldC5lbGVtZW50c1sxXS52YWx1ZTtcbiAgICB2YXIgbmV3Qm9hcmRZID0gZXZlbnQudGFyZ2V0LmVsZW1lbnRzWzJdLnZhbHVlO1xuXG4gICAgLy8gTWFrZSBzdXJlIHRoZSB1c2VyIGhhcyBlbnRlcmVkIG51bWJlcnMuXG4gICAgaWYgKGlzTmFOKG5ld0JvYXJkWCkgfHwgaXNOYU4obmV3Qm9hcmRZKSkge1xuICAgICAgICB0aGlzLmluZm8udGV4dENvbnRlbnQgPSBcIlBsZWFzZSBlbnRlciBvbmx5IG51bWJlcnMuXCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGV5IGhhdmUsIGNvbnZlcnQgdGhlbSBmcm9tIHN0cmluZ3MgdG8gbnVtYmVycy5cbiAgICBuZXdCb2FyZFggPSBwYXJzZUludChuZXdCb2FyZFgsIDEwKTtcbiAgICBuZXdCb2FyZFkgPSBwYXJzZUludChuZXdCb2FyZFksIDEwKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSBib2FyZCBpcyBub3QgdG9vIGJpZyBvciB0b28gc21hbGwuXG4gICAgaWYgKG5ld0JvYXJkWCA8IDIgfHwgbmV3Qm9hcmRYID4gMTAgfHwgbmV3Qm9hcmRZIDwgMiB8fCBuZXdCb2FyZFkgPiAxMCkge1xuICAgICAgICB0aGlzLmluZm8udGV4dENvbnRlbnQgPSBcIlBsZWFzZSBlbnRlciBudW1iZXJzIGJldHdlZW4gMiBhbmQgMTAuXCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgcGllY2VzIHdpbGwgZml0IGluIGEgZ3JpZC5cbiAgICBpZiAoKG5ld0JvYXJkWCAqIG5ld0JvYXJkWSkgJSAyICE9PSAwKSB7XG4gICAgICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiVGhlIGFtb3VudCBvZiBicmlja3MgbXVzdCBiZSBldmVuLlwiO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVzZXQgdGhlIHRpbWVyIGFuZCBjaGFuZ2UgdGhlIHRpdGxlLlxuICAgIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcik7XG4gICAgdGhpcy50aXRsZSA9IFwiTWVtb3J5XCI7XG5cbiAgICB0aGlzLmFwcENvbnRlbnQucGFyZW50Tm9kZS5kaXNwYXRjaEV2ZW50KHRoaXMucmVmcmVzaFRpdGxlKTtcblxuICAgIC8vIEJsdXIgdGhlIGVsZW1lbnRzIHNvIHRoYXQgdGhleSBkb24ndCBnZXQgaW4gdGhlIHdheSBvZiBrZXlib2FyZCBjb250cm9sc1xuICAgIGV2ZW50LnRhcmdldC5lbGVtZW50c1swXS5ibHVyKCk7XG4gICAgZXZlbnQudGFyZ2V0LmVsZW1lbnRzWzFdLmJsdXIoKTtcbiAgICBldmVudC50YXJnZXQuZWxlbWVudHNbMl0uYmx1cigpO1xuXG4gICAgdGhpcy5ib2FyZFggPSBuZXdCb2FyZFg7XG4gICAgdGhpcy5ib2FyZFkgPSBuZXdCb2FyZFk7XG5cbiAgICB3aGlsZSAodGhpcy5ib2FyZC5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5ib2FyZC5yZW1vdmVDaGlsZCh0aGlzLmJvYXJkLmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmluZm8udGV4dENvbnRlbnQgPSBcIlwiO1xuXG4gICAgdGhpcy5pbml0aWFsaXplQm9hcmQoKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgcmFuZG9taXplcyB0aGUgYnJpY2tzIG5lZWRlZCBmb3IgdGhlIGdhbWUuXG4gKi9cbk1lbW9yeS5wcm90b3R5cGUuaW5pdGlhbGl6ZUJvYXJkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIFNldCB0aGUgc2l6ZSBvZiB0aGUgYm9hcmQuXG4gICAgdGhpcy5ib2FyZC5zdHlsZS53aWR0aCA9ICg0OCAqIHRoaXMuYm9hcmRYKSArIFwicHhcIjtcbiAgICB0aGlzLmJvYXJkLnN0eWxlLmhlaWdodCA9ICg0OCAqIHRoaXMuYm9hcmRZKSArIFwicHhcIjtcblxuICAgIHRoaXMudGltZXIgPSAwO1xuICAgIHRoaXMudGltZVRha2VuID0gMDtcbiAgICB0aGlzLnRvdGFsQnJpY2tzID0gdGhpcy5ib2FyZFggKiB0aGlzLmJvYXJkWTtcbiAgICB0aGlzLnJlbW92ZWRCcmlja3MgPSAwO1xuICAgIHRoaXMubW92ZXMgPSAwO1xuICAgIHRoaXMuYnJpY2tzID0gW107XG4gICAgdGhpcy5zZWxlY3RlZEJyaWNrID0gbnVsbDtcblxuICAgIC8vIFBvcHVsYXRlIHRoZSBicmljayBhcnJheS5cbiAgICB2YXIgaTtcbiAgICB2YXIgY291bnQgPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnRvdGFsQnJpY2tzOyBpICs9IDIpIHtcbiAgICAgICAgdGhpcy5icmlja3NbaV0gPSBjb3VudCAlIDg7XG4gICAgICAgIHRoaXMuYnJpY2tzW2kgKyAxXSA9IGNvdW50ICUgODtcbiAgICAgICAgY291bnQgPSBjb3VudCA9PSA3ID8gY291bnQgPSAwIDogY291bnQgKz0gMTtcbiAgICB9XG5cbiAgICAvLyBGaXNoZXItWWF0ZXMgc2h1ZmZsZS5cbiAgICBmb3IgKGkgPSB0aGlzLnRvdGFsQnJpY2tzIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICB2YXIgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgICB2YXIgayA9IHRoaXMuYnJpY2tzW2pdO1xuICAgICAgICB0aGlzLmJyaWNrc1tqXSA9IHRoaXMuYnJpY2tzW2ldO1xuICAgICAgICB0aGlzLmJyaWNrc1tpXSA9IGs7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHRoZSBicmljayBlbGVtZW50cyBhbmQgc2V0IHRoZSBpbml0aWFsIGhpZGRlbiBpbWFnZS5cbiAgICB0aGlzLmJyaWNrcy5mb3JFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYnJpY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgICAgICBicmljay5jbGFzc0xpc3QuYWRkKFwibWVtb3J5LWJyaWNrXCIpO1xuICAgICAgICBicmljay5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvaGlkZGVuLnBuZ1wiKTtcblxuICAgICAgICBfdGhpcy5ib2FyZC5hcHBlbmRDaGlsZChicmljayk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmJyaWNrRWxlbWVudHMgPSB0aGlzLmJvYXJkLnF1ZXJ5U2VsZWN0b3JBbGwoXCIubWVtb3J5LWJyaWNrXCIpO1xuICAgIHRoaXMuaGlnaGxpZ2h0ZWRCcmljayA9IHRoaXMuYnJpY2tFbGVtZW50c1swXTtcbiAgICB0aGlzLmhpZ2hsaWdodGVkQnJpY2suY2xhc3NMaXN0LmFkZChcImhpZ2hsaWdodGVkXCIpO1xufTtcblxuLyoqXG4gKiBIYW5kbGVzIHJldmVhbGluZyB0aGUgc2VsZWN0ZWQgYnJpY2suXG4gKiBAcGFyYW0gYnJpY2sgVGhlIHNlbGVjdGVkIGJyaWNrLlxuICovXG5NZW1vcnkucHJvdG90eXBlLnJldmVhbEJyaWNrID0gZnVuY3Rpb24oYnJpY2spIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gRG8gbm90aGluZyBpZiB0aGUgYnJpY2sgcHJlc3NlZCBpcyB0aGUgYnJpY2sgc2VsZWN0ZWRcbiAgICBpZiAodGhpcy5zZWxlY3RlZEJyaWNrICYmIGJyaWNrID09PSB0aGlzLnNlbGVjdGVkQnJpY2suYnJpY2tFbGVtKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIHRoZSB1c2VyIGhhcyBjbGlja2VkIG9uIHRoZSBib2FyZFxuICAgIGlmIChicmljayA9PT0gdGhpcy5ib2FyZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRmluYWxseSwgZG8gbm90aGluZyBpZiB0aGUgYnJpY2sgaXMgcmVtb3ZlZCFcbiAgICBpZiAoYnJpY2suY2xhc3NMaXN0LmNvbnRhaW5zKFwicmVtb3ZlZFwiKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU3RhcnQgdGhlIHRpbWVyIGlmIGl0IGhhc24ndCBhbHJlYWR5IHN0YXJ0ZWQuXG4gICAgaWYgKCF0aGlzLnRpbWVyKSB7XG4gICAgICAgIHRoaXMudGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF90aGlzLnRpY2soKTtcbiAgICAgICAgfSwgMTAwKTtcbiAgICB9XG5cbiAgICAvLyBGaW5kIHRoZSBpbmRleCBvZiB0aGUgYnJpY2sgaW4gdGhlIGJvYXJkXG4gICAgdmFyIGluZGV4ID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLmJvYXJkLmNoaWxkcmVuLCBicmljayk7XG5cbiAgICAvLyBGbGlwIHRoZSBicmlja1xuICAgIGJyaWNrLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9cIiArIHRoaXMuYnJpY2tzW2luZGV4XSArIFwiLnBuZ1wiKTtcblxuICAgIC8vIElmIHRoZXJlIGlzIG5vIHNlbGVjdGVkIGJyaWNrLCB0aGlzIGlzIHRoZSBzZWxlY3RlZCBicmlja1xuICAgIGlmICghdGhpcy5zZWxlY3RlZEJyaWNrKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRCcmljayA9IHticmlja0VsZW06IGJyaWNrLCB2YWx1ZTogdGhpcy5icmlja3NbaW5kZXhdfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJZiB0aGVyZSBpcywgY2hlY2sgaWYgdGhleSBtYXRjaFxuICAgICAgICB0aGlzLmNoZWNrTWF0Y2goe2JyaWNrRWxlbTogYnJpY2ssIHZhbHVlOiB0aGlzLmJyaWNrc1tpbmRleF19KVxuICAgIH1cbn07XG5cbi8qKlxuICogVGlja3MgdXAgdGhlIGNsb2NrIGV2ZXJ5IDEwMCBtaWxsaXNlY29uZHMuXG4gKi9cbk1lbW9yeS5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudGltZVRha2VuICs9IDEwMDtcblxuICAgIHRoaXMudGl0bGUgPSBcIk1lbW9yeSAtIFwiICsgKHRoaXMudGltZVRha2VuIC8gMTAwMCkudG9GaXhlZCgxKTtcblxuICAgIHRoaXMuYXBwQ29udGVudC5wYXJlbnROb2RlLmRpc3BhdGNoRXZlbnQodGhpcy5yZWZyZXNoVGl0bGUpO1xufTtcblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIGJyaWNrIHJldmVhbGVkIG1hdGNoZXMgdGhlIHNlbGVjdGVkIGJyaWNrXG4gKiBAcGFyYW0gYnJpY2tcbiAqL1xuTWVtb3J5LnByb3RvdHlwZS5jaGVja01hdGNoID0gZnVuY3Rpb24oYnJpY2spIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gUmVtb3ZlIHRoZSBldmVudCBsaXN0ZW5lcnMgd2hpbGUgdGhlIGJyaWNrcyBhcmUgYmVpbmcgY2hlY2tlZFxuICAgIHRoaXMuYm9hcmQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuYm91bmRSZXZlYWwpO1xuICAgIHRoaXMubmV3R2FtZUZvcm0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCB0aGlzLmJvdW5kTmV3R2FtZSk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5ib3VuZEtleWJvYXJkSGFuZGxlcik7XG5cbiAgICAvLyBJZiB0aGV5IG1hdGNoLCByZW1vdmUgYm90aCBhbmQgYWRkIDIgdG8gcmVtb3ZlZCBicmlja3MgY291bnQuXG4gICAgaWYgKGJyaWNrLnZhbHVlID09PSB0aGlzLnNlbGVjdGVkQnJpY2sudmFsdWUpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJyaWNrLmJyaWNrRWxlbS5jbGFzc0xpc3QuYWRkKFwicmVtb3ZlZFwiKTtcbiAgICAgICAgICAgIF90aGlzLnNlbGVjdGVkQnJpY2suYnJpY2tFbGVtLmNsYXNzTGlzdC5hZGQoXCJyZW1vdmVkXCIpO1xuXG4gICAgICAgICAgICBfdGhpcy5yZW1vdmVkQnJpY2tzICs9IDI7XG5cbiAgICAgICAgICAgIF90aGlzLnNlbGVjdGVkQnJpY2sgPSBudWxsO1xuICAgICAgICAgICAgX3RoaXMuYm9hcmQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIF90aGlzLmJvdW5kUmV2ZWFsKTtcbiAgICAgICAgICAgIF90aGlzLm5ld0dhbWVGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgX3RoaXMuYm91bmROZXdHYW1lKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIF90aGlzLmJvdW5kS2V5Ym9hcmRIYW5kbGVyKTtcblxuXG4gICAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gbW9yZSBicmlja3MsIHRoZSBnYW1lIGlzIG92ZXIuXG4gICAgICAgICAgICBpZiAoX3RoaXMucmVtb3ZlZEJyaWNrcyA9PT0gX3RoaXMudG90YWxCcmlja3MpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5lbmRHYW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElmIHRoZXkgZG9uJ3QgbWF0Y2gsIGZsaXAgdGhlbSBiYWNrIG92ZXIuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBicmljay5icmlja0VsZW0uc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiL2ltYWdlL2hpZGRlbi5wbmdcIik7XG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrLmJyaWNrRWxlbS5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvaGlkZGVuLnBuZ1wiKTtcblxuICAgICAgICAgICAgX3RoaXMuc2VsZWN0ZWRCcmljayA9IG51bGw7XG4gICAgICAgICAgICBfdGhpcy5ib2FyZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgX3RoaXMuYm91bmRSZXZlYWwpO1xuICAgICAgICAgICAgX3RoaXMubmV3R2FtZUZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBfdGhpcy5ib3VuZE5ld0dhbWUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgX3RoaXMuYm91bmRLZXlib2FyZEhhbmRsZXIpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICB9XG5cbiAgICAvLyBFaXRoZXIgd2F5LCB0aGUgdXNlciBoYXMgdXNlZCBvbmUgbW92ZS5cbiAgICB0aGlzLm1vdmVzICs9IDE7XG59O1xuXG4vKipcbiAqIFNpbXBsZSBmdW5jdGlvbiB0aGF0IGRpc3BsYXlzIHRoZSBhbW91bnQgb2YgbW92ZXMgYW5kIHRpbWUgdGFrZW4uXG4gKi9cbk1lbW9yeS5wcm90b3R5cGUuZW5kR2FtZSA9IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcik7XG4gICAgdGhpcy50aXRsZSA9IFwiTWVtb3J5XCI7XG5cbiAgICB0aGlzLmFwcENvbnRlbnQucGFyZW50Tm9kZS5kaXNwYXRjaEV2ZW50KHRoaXMucmVmcmVzaFRpdGxlKTtcblxuICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiTmljZSEgTW92ZXM6IFwiICsgdGhpcy5tb3ZlcyArIFwiLCBUaW1lOiBcIiArICh0aGlzLnRpbWVUYWtlbiAvIDEwMDApLnRvRml4ZWQoMSkgKyBcInNcIjtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgQXBwQ29udGVudC5cbiAqIEByZXR1cm5zIHtOb2RlfVxuICovXG5NZW1vcnkucHJvdG90eXBlLmdldEFwcENvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5hcHBDb250ZW50O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZW1vcnk7XG4iLCIvKipcbiAqIENvbnN0cnVjdG9yIGZvciB0aGUgTm90ZWJvb2sgYXBwLlxuICogQHBhcmFtIHtCb29sZWFufSB3ZWxjb21lIElmIHRydWUsIGl0IGlzIHRoZSBmaXJzdCB0aW1lIHRoZSB1c2VyIG9wZW5zIHRoZSBhcHAsIHNvIGRpc3BsYXkgYSB3ZWxjb21lIG1lc3NhZ2UuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTm90ZWJvb2sod2VsY29tZSkge1xuICAgIC8vIEdldCB0aGUgYXJyYXkgb2Ygbm90ZXMgZnJvbSBsb2NhbCBzdG9yYWdlLlxuICAgIHRoaXMubm90ZUFycmF5ID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm5vdGVzXCIpKTtcblxuICAgIC8vIENyZWF0ZSBhIGN1c3RvbSBldmVudCB0aGF0IGxldHMgdGhlIGFwcCB3aW5kb3cga25vdyBpdCBzaG91bGQgcmVmcmVzaCBpdHNlbGYuXG4gICAgdGhpcy5yZWZyZXNoID0gbmV3IEV2ZW50KFwicmVmcmVzaFwiKTtcblxuICAgIC8vIEFycmF5IG9mIG1lbnUgb2JqZWN0cywgd2l0aCBuYW1lIGFuZCBldmVudCBoYW5kbGVyLlxuICAgIHRoaXMubWVudUl0ZW1zID0gW1xuICAgICAgICB7bmFtZTogXCJOZXdcIiwgZXZlbnRIYW5kbGVyOiB0aGlzLm5ld05vdGUuYmluZCh0aGlzKX0sXG4gICAgICAgIHtuYW1lOiBcIlNhdmVcIiwgZXZlbnRIYW5kbGVyOiB0aGlzLnNhdmVOb3RlLmJpbmQodGhpcyl9LFxuICAgICAgICB7bmFtZTogXCJMb2FkXCIsIGV2ZW50SGFuZGxlcjogdGhpcy5sb2FkU2NyZWVuLmJpbmQodGhpcyl9XG4gICAgXTtcblxuICAgIC8vIFNldCB0aGUgaW1hZ2UuXG4gICAgdGhpcy5pbWFnZVNyYyA9IFwiZGlhcnlcIjtcblxuICAgIC8vIElmIGl0IGlzIHRoZSBmaXJzdCB0aW1lIHRoZSB1c2VyIG9wZW5zIHRoZSBhcHAsIGRpc3BsYXkgYSB3ZWxjb21lIG1lc3NhZ2UuXG4gICAgLy8gT3RoZXJ3aXNlLCBkaXNwbGF5IGEgbmV3IG5vdGUuXG4gICAgLy8gdGhpcy5zdGF0ZSBoYXMgdGhyZWUgc2V0dGluZ3M6IG5ldywgbG9hZCwgb3IgdGhlIG5hbWUgb2YgdGhlIG5vdGUgdG8gZGlzcGxheS5cbiAgICBpZiAod2VsY29tZSkge1xuICAgICAgICB0aGlzLnN0YXRlID0gXCJXZWxjb21lXCI7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIldlbGNvbWVcIjtcbiAgICAgICAgdGhpcy5hcHBDb250ZW50ID0gdGhpcy5jcmVhdGVBcHBDb250ZW50U2F2ZWROb3RlKHRoaXMuc3RhdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBcIm5ld1wiO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJVbnRpdGxlZFwiO1xuICAgICAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnROZXcoKTtcbiAgICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgYXBwIGNvbnRlbnQgZm9yIGEgbmV3IG5vdGUuXG4gKiBAcmV0dXJucyB7Tm9kZX1cbiAqL1xuTm90ZWJvb2sucHJvdG90eXBlLmNyZWF0ZUFwcENvbnRlbnROZXcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25vdGVib29rLXRlbXBsYXRlLW5ld1wiKTtcbiAgICByZXR1cm4gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250ZW50XCIpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBhcHAgY29udGVudCBmb3IgYSBzYXZlZCBub3RlXG4gKiBAcGFyYW0ge1N0cmluZ30gbm90ZU5hbWUgVGhlIG5hbWUgb2YgdGhlIG5vdGUgdG8gbG9hZCBmcm9tIGxvY2FsIHN0b3JhZ2UuXG4gKiBAcmV0dXJucyB7Tm9kZX1cbiAqL1xuTm90ZWJvb2sucHJvdG90eXBlLmNyZWF0ZUFwcENvbnRlbnRTYXZlZE5vdGUgPSBmdW5jdGlvbihub3RlTmFtZSkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbm90ZWJvb2stdGVtcGxhdGUtbmV3XCIpO1xuICAgIHZhciBhcHBDb250ZW50ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250ZW50XCIpO1xuXG4gICAgLy8gR2V0IHRoZSBub3RlIGZyb20gbm90ZUFycmF5LlxuICAgIHZhciBub3RlID0gdGhpcy5nZXROb3RlKG5vdGVOYW1lKTtcblxuICAgIC8vIElmIHRoZXJlIGlzIGEgbm90ZSwgZGlzcGxheSBpdHMgY29udGVudC5cbiAgICBpZiAobm90ZSkge1xuICAgICAgICBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIubm90ZVwiKS52YWx1ZSA9IG5vdGUuY29udGVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gYXBwQ29udGVudDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIGJsYW5rIG5vdGUuXG4gKi9cbk5vdGVib29rLnByb3RvdHlwZS5uZXdOb3RlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdGF0ZSA9IFwibmV3XCI7XG4gICAgdGhpcy50aXRsZSA9IFwiVW50aXRsZWRcIjtcblxuICAgIC8vIExldCB0aGUgYXBwIGNvbnRhaW5lciBrbm93IGl0IHNob3VsZCByZWZyZXNoIGl0c2VsZi5cbiAgICB0aGlzLmFwcENvbnRlbnQucGFyZW50Tm9kZS5kaXNwYXRjaEV2ZW50KHRoaXMucmVmcmVzaCk7XG59O1xuXG4vKipcbiAqIFNhdmVzIGEgbm90ZS5cbiAqL1xuTm90ZWJvb2sucHJvdG90eXBlLnNhdmVOb3RlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gRG8gbm90aGluZyBpZiB3ZSBhcmUgb24gdGhlIGxvYWQgc2NyZWVuLlxuICAgIGlmICh0aGlzLnN0YXRlID09PSBcImxvYWRcIikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIG5vdGUgaXMgbmV3LCBhc2sgd2hhdCB3ZSBzaG91bGQgY2FsbCB0aGUgbm90ZS5cbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gXCJuZXdcIikge1xuICAgICAgICB2YXIgbmFtZSA9IHByb21wdChcIlBsZWFzZSBlbnRlciBhIG5hbWU6IFwiKTtcblxuICAgICAgICBpZiAobmFtZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZ2V0Tm90ZShuYW1lKSkge1xuICAgICAgICAgICAgYWxlcnQoXCJOYW1lIGFscmVhZHkgdGFrZW4uXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwiVW50aXRsZWRcIiB8fCBuYW1lID09PSBcIlwiKSB7XG4gICAgICAgICAgICBhbGVydChcIlBsZWFzZSBnaXZlIHlvdXIgbm90ZSBhIG5hbWUuXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gUHVzaCB0aGUgbm90ZSB0byB0aGUgbm90ZSBhcnJheSBhbmQgdG8gbG9jYWwgc3RvcmFnZS5cbiAgICAgICAgICAgIHRoaXMubm90ZUFycmF5LnB1c2goe25hbWU6IG5hbWUsIGNvbnRlbnQ6IHRoaXMuYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLm5vdGVcIikudmFsdWV9KTtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibm90ZXNcIiwgSlNPTi5zdHJpbmdpZnkodGhpcy5ub3RlQXJyYXkpKTtcblxuICAgICAgICAgICAgLy8gU2V0IHRoZSBhcHAgc3RhdGUgYW5kIHRpdGxlIHRvIGRpc3BsYXkgaW4gdGhlIHRvb2xiYXIuXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gbmFtZTtcbiAgICAgICAgICAgIHRoaXMudGl0bGUgPSBuYW1lO1xuXG4gICAgICAgICAgICAvLyBMZXQgdGhlIGFwcCBjb250YWluZXIga25vdyBpdCBzaG91bGQgcmVmcmVzaCBpdHNlbGYuXG4gICAgICAgICAgICB0aGlzLmFwcENvbnRlbnQucGFyZW50Tm9kZS5kaXNwYXRjaEV2ZW50KHRoaXMucmVmcmVzaCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJZiB0aGUgbm90ZSBpcyBub3QgbmV3LCBzYXZlIGl0cyBuZXcgY29udGVudC5cbiAgICAgICAgdGhpcy5nZXROb3RlKHRoaXMuc3RhdGUpLmNvbnRlbnQgPSB0aGlzLmFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5ub3RlXCIpLnZhbHVlO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm5vdGVzXCIsIEpTT04uc3RyaW5naWZ5KHRoaXMubm90ZUFycmF5KSk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBEaXNwbGF5IHRoZSBsb2FkIG5vdGUgc2NyZWVuLlxuICovXG5Ob3RlYm9vay5wcm90b3R5cGUubG9hZFNjcmVlbiA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3RhdGUgPSBcImxvYWRcIjtcbiAgICB0aGlzLnRpdGxlID0gXCJMb2FkXCI7XG5cbiAgICAvLyBMZXQgdGhlIGFwcCBjb250YWluZXIga25vdyBpdCBzaG91bGQgcmVmcmVzaCBpdHNlbGYuXG4gICAgdGhpcy5hcHBDb250ZW50LnBhcmVudE5vZGUuZGlzcGF0Y2hFdmVudCh0aGlzLnJlZnJlc2gpO1xufTtcblxuLyoqXG4gKiBMb2FkcyBhIG5vdGUgZnJvbSB0aGUgbm90ZSBhcnJheS5cbiAqIEBwYXJhbSBldmVudFxuICovXG5Ob3RlYm9vay5wcm90b3R5cGUubG9hZE5vdGUgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHRoaXMuc3RhdGUgPSBldmVudC5jdXJyZW50VGFyZ2V0LmRhdGFzZXQubm90ZU5hbWU7XG4gICAgdGhpcy50aXRsZSA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuZGF0YXNldC5ub3RlTmFtZTtcblxuICAgIC8vIExldCB0aGUgYXBwIGNvbnRhaW5lciBrbm93IGl0IHNob3VsZCByZWZyZXNoIGl0c2VsZi5cbiAgICB0aGlzLmFwcENvbnRlbnQucGFyZW50Tm9kZS5kaXNwYXRjaEV2ZW50KHRoaXMucmVmcmVzaCk7XG59O1xuXG4vKipcbiAqIERlbGV0ZXMgYSBub3RlLlxuICogQHBhcmFtIGV2ZW50XG4gKi9cbk5vdGVib29rLnByb3RvdHlwZS5kZWxldGVOb3RlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgIHZhciBuYW1lID0gZXZlbnQudGFyZ2V0LmRhdGFzZXQubm90ZU5hbWU7XG4gICAgdmFyIG5vdGUgPSB0aGlzLmdldE5vdGUobmFtZSk7XG5cbiAgICBpZiAobm90ZSkge1xuICAgICAgICB0aGlzLm5vdGVBcnJheS5zcGxpY2UodGhpcy5ub3RlQXJyYXkuaW5kZXhPZihub3RlKSwgMSk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibm90ZXNcIiwgSlNPTi5zdHJpbmdpZnkodGhpcy5ub3RlQXJyYXkpKTtcbiAgICB9XG5cbiAgICAvLyBMZXQgdGhlIGFwcCBjb250YWluZXIga25vdyBpdCBzaG91bGQgcmVmcmVzaCBpdHNlbGYuXG4gICAgdGhpcy5hcHBDb250ZW50LnBhcmVudE5vZGUuZGlzcGF0Y2hFdmVudCh0aGlzLnJlZnJlc2gpO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIGFwcCBjb250ZW50IG9mIHRoZSBsb2FkIG5vdGUgbWVudS5cbiAqIEByZXR1cm5zIHtOb2RlfVxuICovXG5Ob3RlYm9vay5wcm90b3R5cGUuY3JlYXRlQXBwQ29udGVudExvYWRNZW51ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNub3RlYm9vay10ZW1wbGF0ZS1sb2FkXCIpO1xuICAgIHZhciBhcHBDb250ZW50ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250ZW50XCIpO1xuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIENyZWF0ZSBhIGxpc3QgaXRlbSBmb3IgZWFjaCBub3RlIGluIHRoZSBhcnJheSBhbmQgYXR0YWNoIGV2ZW50IGxpc3RlbmVycy5cbiAgICB0aGlzLm5vdGVBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKG5vdGUpIHtcbiAgICAgICAgdmFyIGl0ZW1UZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbm90ZWJvb2stbGlzdGl0ZW0tdGVtcGxhdGVcIik7XG4gICAgICAgIHZhciBpdGVtID0gZG9jdW1lbnQuaW1wb3J0Tm9kZShpdGVtVGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5ub3RlYm9vay1saXN0aXRlbVwiKTtcblxuICAgICAgICBpdGVtLnNldEF0dHJpYnV0ZShcImRhdGEtbm90ZS1uYW1lXCIsIG5vdGUubmFtZSk7XG5cbiAgICAgICAgaXRlbS5xdWVyeVNlbGVjdG9yKFwiLml0ZW0tbmFtZVwiKS50ZXh0Q29udGVudCA9IG5vdGUubmFtZTtcblxuICAgICAgICBpdGVtLnF1ZXJ5U2VsZWN0b3IoXCIuZGVsZXRlLWl0ZW1cIikuc2V0QXR0cmlidXRlKFwiZGF0YS1ub3RlLW5hbWVcIiwgbm90ZS5uYW1lKTtcblxuICAgICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfdGhpcy5sb2FkTm90ZS5iaW5kKF90aGlzKSk7XG5cbiAgICAgICAgaXRlbS5xdWVyeVNlbGVjdG9yKFwiLmRlbGV0ZS1pdGVtXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfdGhpcy5kZWxldGVOb3RlLmJpbmQoX3RoaXMpKTtcblxuICAgICAgICBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIubm90ZWxpc3RcIikuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gYXBwQ29udGVudDtcbn07XG5cbi8qKlxuICogR2V0cyBhIG5vdGUgYnkgaXRzIG5hbWUuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgbm90ZS5cbiAqIEByZXR1cm5zIHsqfVxuICovXG5Ob3RlYm9vay5wcm90b3R5cGUuZ2V0Tm90ZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgcmVzdWx0Tm90ZSA9IG51bGw7XG5cbiAgICB0aGlzLm5vdGVBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKG5vdGUpIHtcbiAgICAgICAgaWYgKG5vdGUubmFtZSA9PT0gbmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0Tm90ZSA9IG5vdGU7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHROb3RlO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgdGhlIGFwcCBjb250ZW50IGRlcGVuZGluZyBvbiB0aGUgc3RhdGUgb2YgdGhlIGFwcC5cbiAqIEByZXR1cm5zIHtOb2RlfVxuICovXG5Ob3RlYm9vay5wcm90b3R5cGUuZ2V0QXBwQ29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnN0YXRlID09PSBcIm5ld1wiKSB7XG4gICAgICAgIHRoaXMuYXBwQ29udGVudCA9IHRoaXMuY3JlYXRlQXBwQ29udGVudE5ldygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmFwcENvbnRlbnQ7XG4gICAgfSBlbHNlIGlmICh0aGlzLnN0YXRlID09PSBcImxvYWRcIikge1xuICAgICAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnRMb2FkTWVudSgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmFwcENvbnRlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hcHBDb250ZW50ID0gdGhpcy5jcmVhdGVBcHBDb250ZW50U2F2ZWROb3RlKHRoaXMuc3RhdGUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmFwcENvbnRlbnQ7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBOb3RlYm9vaztcbiIsIi8vIEFwcC5qcyBjb250cm9scyB0aGUgVUkgYW5kIGlzIHJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyBuZXcgYXBwIGluc3RhbmNlcy4gQWRkaW5nIG5ldyBhcHBzXG4vLyB0byB0aGUgUGVyc29uYWwgV2ViIERlc2t0b3Agc2hvdWxkIGJlIGFzIGVhc3kgYXMgaW1wb3J0aW5nIGl0IGluIGFwcC5qcyBhbmQgY3JlYXRpbmcgaXQuXG5cbi8vIFRoZSBhcHBzIGZvbGxvdyB0aGUgc2FtZSBzdHJ1Y3R1cmU6XG4vLyBUaGV5IGFsbCBjb250YWluIGEgZnVuY3Rpb24gY2FsbGVkIGdldEFwcENvbnRlbnQsIHdoaWNoIHJldHVybnMgdGhlIGRpdiB0aGF0IG5lZWRzIHRvXG4vLyBiZSBhdHRhY2hlZCB0byB0aGUgYXBwIHdpbmRvdydzIGFwcCBjb250YWluZXIuIEZvciBhcHBzIHRoYXQgc2hvdWxkIG9ubHkgaGF2ZSBvbmVcbi8vIGluc3RhbmNlIHJ1bm5pbmcgKGkuZS4gdGhlIENoYXQgYXBwKSB0aGlzIGFwcENvbnRlbnQgd2lsbCBiZSB0aGUgc2FtZSBmb3IgYWxsIG9wZW4gd2luZG93cy5cblxuKGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgZGVza3RvcC5cbiAgICB2YXIgRGVza3RvcCA9IHJlcXVpcmUoXCIuL0Rlc2t0b3BcIik7XG4gICAgdmFyIGRlc2t0b3AgPSBuZXcgRGVza3RvcCgpO1xuXG4gICAgLy8gSW1wb3J0IHRoZSBuZWNlc3NhcnkgYXBwcy5cbiAgICB2YXIgTm90ZWJvb2sgPSByZXF1aXJlKFwiLi9Ob3RlYm9va1wiKTtcbiAgICB2YXIgTWVtb3J5ID0gcmVxdWlyZShcIi4vTWVtb3J5XCIpO1xuICAgIHZhciBDaGF0ID0gcmVxdWlyZShcIi4vQ2hhdFwiKTtcblxuICAgIC8vIEF0dGFjaCBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIG1lbnUgaWNvbnMuXG4gICAgdmFyIG5ld05vdGVib29rV2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuZXdfbm90ZWJvb2tcIik7XG4gICAgdmFyIG5ld0NoYXRXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19jaGF0XCIpO1xuICAgIHZhciBuZXdNZW1vcnlXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19tZW1vcnlcIik7XG5cbiAgICBuZXdOb3RlYm9va1dpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIG5vdGVzIGFyZSBhdmFpbGFibGUgaW4gbG9jYWxTdG9yYWdlLiBJZiBub3QsIGNyZWF0ZSBhIHdlbGNvbWUgbm90ZSBhbmQgZGlzcGxheSBpdC5cbiAgICAgICAgaWYgKCFsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcIm5vdGVzXCIpKSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcIm5vdGVzXCIsIEpTT04uc3RyaW5naWZ5KFtcbiAgICAgICAgICAgICAgICB7bmFtZTogXCJXZWxjb21lXCIsIGNvbnRlbnQ6IFwiV2VsY29tZSB0byB0aGUgTm90ZWJvb2sgYXBwIVxcblwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkNsaWNrIG9uIHRoZSBpY29uIHRvIG9wZW4gdGhlIG1lbnUuXCJ9XSkpO1xuXG4gICAgICAgICAgICBkZXNrdG9wLmF0dGFjaFdpbmRvdyhuZXcgTm90ZWJvb2sodHJ1ZSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVza3RvcC5hdHRhY2hXaW5kb3cobmV3IE5vdGVib29rKCkpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBuZXdDaGF0V2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIENoYXQgaXMgcnVubmluZy4gSWYgbm90LCBpbnN0YW50aWF0ZSBpdC5cbiAgICAgICAgaWYgKCFkZXNrdG9wLmluc3RhbmNlcy5jaGF0KSB7XG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgdXNlciBoYXMgZW50ZXJlZCBhIHVzZXJuYW1lLiBJZiBub3QsIHByb21wdCB0aGVtIGZvciBvbmUuXG4gICAgICAgICAgICBpZiAoIWRlc2t0b3AudXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXNlciA9IHByb21wdChcIlBsZWFzZSBlbnRlciBhIHVzZXJuYW1lOlwiKTtcblxuICAgICAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidXNlcm5hbWVcIiwgdXNlcik7XG5cbiAgICAgICAgICAgICAgICAgICAgZGVza3RvcC51c2VybmFtZSA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVza3RvcC5pbnN0YW5jZXMuY2hhdCA9IG5ldyBDaGF0KGRlc2t0b3AudXNlcm5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVza3RvcC5hdHRhY2hXaW5kb3coZGVza3RvcC5pbnN0YW5jZXMuY2hhdCk7XG4gICAgfSk7XG5cbiAgICBuZXdNZW1vcnlXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBCeSBkZWZhdWx0LCBhbGwgbmV3IE1lbW9yeSBnYW1lcyBhcmUgNHg0LiBUaGlzIGNhbiBsYXRlciBiZSBjaGFuZ2VkLlxuICAgICAgICBkZXNrdG9wLmF0dGFjaFdpbmRvdyhuZXcgTWVtb3J5KDQsIDQpKTtcbiAgICB9KTtcbn0pKCk7XG4iXX0=