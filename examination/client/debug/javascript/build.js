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
    appWindow.div.addEventListener("click", function() {
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
Memory.prototype.keyboardHandler = function() {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQXBwV2luZG93LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9DaGF0LmpzIiwiY2xpZW50L3NvdXJjZS9qcy9EZXNrdG9wLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9NZW1vcnkuanMiLCJjbGllbnQvc291cmNlL2pzL05vdGVib29rLmpzIiwiY2xpZW50L3NvdXJjZS9qcy9hcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDb25zdHJ1Y3RvciBmb3IgQXBwV2luZG93cy4gQXBwV2luZG93IGNyZWF0ZXMgYSB3aW5kb3cgYW5kIGF0dGFjaGVzIGV2ZW50IGxpc3RlbmVycyB0aGF0IGFsbG93XG4gKiB0aGUgdXNlciB0byBtb3ZlIHRoZSB3aW5kb3cgYW5kIGdpdmVzIGl0IGZvY3VzIHdoZW4gY2xpY2tlZC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBBcHBXaW5kb3coKSB7XG4gICAgdGhpcy5hcHAgPSBudWxsO1xuXG4gICAgdGhpcy5kaXYgPSB0aGlzLmNyZWF0ZVdpbmRvdygpO1xuXG4gICAgLy8gU3RvcmUgdGhlIGNvbXBvbmVudHMgb2YgdGhlIHdpbmRvdyBmb3IgZWFzZSBvZiByZXRyaWV2YWwuXG4gICAgdGhpcy50b29sYmFyID0gdGhpcy5kaXYucXVlcnlTZWxlY3RvcihcIi50b29sYmFyXCIpO1xuICAgIHRoaXMubWVudUljb24gPSB0aGlzLmRpdi5xdWVyeVNlbGVjdG9yKFwiLnRvb2xiYXItaWNvblwiKTtcbiAgICB0aGlzLm1lbnVUaXRsZSA9IHRoaXMuZGl2LnF1ZXJ5U2VsZWN0b3IoXCIudG9vbGJhci10aXRsZVwiKTtcbiAgICB0aGlzLmRyb3Bkb3duID0gdGhpcy5kaXYucXVlcnlTZWxlY3RvcihcIi50b29sYmFyLWRyb3Bkb3duXCIpO1xuICAgIHRoaXMuY2xvc2VXaW5kb3cgPSB0aGlzLmRpdi5xdWVyeVNlbGVjdG9yKFwiLmNsb3NlLXdpbmRvd1wiKTtcbiAgICB0aGlzLmFwcENvbnRhaW5lciA9IHRoaXMuZGl2LnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRhaW5lclwiKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuZCByZXR1cm5zIHRoZSBtYWluIEFwcFdpbmRvdyBkaXYuXG4gKiBAcmV0dXJucyB7RWxlbWVudH1cbiAqL1xuQXBwV2luZG93LnByb3RvdHlwZS5jcmVhdGVXaW5kb3cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3dpbmRvdy10ZW1wbGF0ZVwiKTtcbiAgICByZXR1cm4gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC13aW5kb3dcIik7XG59O1xuXG4vKipcbiAqIEF0dGFjaGVzIGFuIGFwcCB0byB0aGUgd2luZG93IGFuZCBzdG9yZXMgaXQgaW4gdGhpcy5hcHAuXG4gKiBAcGFyYW0gYXBwXG4gKi9cbkFwcFdpbmRvdy5wcm90b3R5cGUuYXR0YWNoQXBwID0gZnVuY3Rpb24oYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG5cbiAgICAvLyBDbGVhciB0aGUgYXBwIGNvbnRhaW5lciwgaW4gY2FzZSB0aGVyZSBpcyBhbHJlYWR5IGNvbnRlbnQgaW5zaWRlLlxuICAgIHdoaWxlICh0aGlzLmFwcENvbnRhaW5lci5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5hcHBDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5hcHBDb250YWluZXIuZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgbWVudSBpY29uIGluIHRoZSB0b3AgbGVmdCBvZiB0aGUgdG9vbGJhci5cbiAgICBpZiAoYXBwLmltYWdlU3JjICE9PSBcIlwiKSB7XG4gICAgICAgIHRoaXMubWVudUljb24uc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiaW1hZ2UvXCIgKyBhcHAuaW1hZ2VTcmMgKyBcIi5wbmdcIik7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSB0aXRsZSBvZiB0aGUgYXBwLlxuICAgIGlmIChhcHAudGl0bGUgIT09IFwiXCIpIHtcbiAgICAgICAgdGhpcy5tZW51VGl0bGUudGV4dENvbnRlbnQgPSBhcHAudGl0bGU7XG4gICAgfVxuXG4gICAgLy8gQXR0YWNoIHRoZSBtZW51IGlmIHRoZXJlIGlzIG9uZS5cbiAgICBpZiAoYXBwLm1lbnVJdGVtcykge1xuICAgICAgICB0aGlzLmF0dGFjaE1lbnUoKTtcbiAgICB9XG5cbiAgICAvLyBBcHBlbmQgdGhlIGFwcCBjb250ZW50IG9mIHRoZSBhcHAgdG8gdGhlIG1haW4gYXBwIGNvbnRhaW5lciBvZiB0aGUgQXBwV2luZG93LlxuICAgIHRoaXMuYXBwQ29udGFpbmVyLmFwcGVuZENoaWxkKGFwcC5nZXRBcHBDb250ZW50KCkpO1xufTtcblxuLyoqXG4gKiBBdHRhY2ggdGhlIG1lbnUsIGlmIGFueSwgdG8gdGhlIEFwcFdpbmRvdyB0b29sYmFyLlxuICovXG5BcHBXaW5kb3cucHJvdG90eXBlLmF0dGFjaE1lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNkcm9wZG93bi10ZW1wbGF0ZVwiKTtcblxuICAgIC8vIEdpdmUgZWFjaCBkcm9wZG93biBtZW51IGl0ZW0gYSBuYW1lIGFuZCBhdHRhY2ggdGhlIG5lY2Vzc2FyeSBldmVudCBoYW5kbGVyLlxuICAgIHRoaXMuYXBwLm1lbnVJdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdmFyIG1lbnVJdGVtID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmRyb3Bkb3duLWl0ZW1cIik7XG5cbiAgICAgICAgbWVudUl0ZW0ucXVlcnlTZWxlY3RvcihcIi5kcm9wZG93bi1uYW1lXCIpLnRleHRDb250ZW50ID0gaXRlbS5uYW1lO1xuXG4gICAgICAgIG1lbnVJdGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBpdGVtLmV2ZW50SGFuZGxlciwgdHJ1ZSk7XG5cbiAgICAgICAgX3RoaXMuZHJvcGRvd24uYXBwZW5kQ2hpbGQobWVudUl0ZW0pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZWZyZXNoZXMgdGhlIGFwcCBjb250YWluZXIuXG4gKi9cbkFwcFdpbmRvdy5wcm90b3R5cGUucmVmcmVzaEFwcCA9IGZ1bmN0aW9uKCkge1xuICAgIHdoaWxlICh0aGlzLmFwcENvbnRhaW5lci5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5hcHBDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5hcHBDb250YWluZXIuZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIHRoaXMubWVudVRpdGxlLnRleHRDb250ZW50ID0gdGhpcy5hcHAudGl0bGU7XG5cbiAgICB0aGlzLmFwcENvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmFwcC5nZXRBcHBDb250ZW50KCkpO1xufTtcblxuLyoqXG4gKiBSZWZyZXNoZXMgb25seSB0aGUgdGl0bGUuXG4gKi9cbkFwcFdpbmRvdy5wcm90b3R5cGUucmVmcmVzaFRpdGxlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5tZW51VGl0bGUudGV4dENvbnRlbnQgPSB0aGlzLmFwcC50aXRsZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwV2luZG93O1xuIiwiLyoqXG4gKiBUaGUgY2hhdCBhcHBsaWNhdGlvbiBjb25zdHJ1Y3Rvci4gT25lIG9iamVjdCB3aWxsIGJlIGluc3RhbnRpYXRlZCBwZXIgZGVza3RvcC5cbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VybmFtZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENoYXQodXNlcm5hbWUpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5sYXN0TGluZXMgPSBbXTtcblxuICAgIC8vIFRoZSBpbWFnZSBhbmQgdGl0bGUgb2YgdGhlIGFwcC5cbiAgICB0aGlzLmltYWdlU3JjID0gXCJjaGF0XCI7XG4gICAgdGhpcy50aXRsZSA9IFwiV2ViY2hhdFwiO1xuXG4gICAgLy8gU3RvcmVzIHRoZSBkb2N1bWVudCB0aXRsZSBzbyB0aGF0IHRoZSBhcHAgY2FuIGNoYW5nZSBpdCBiYWNrIGFmdGVyIHRoZSB1c2VyIGhhcyBiZWVuIG5vdGlmaWVkLlxuICAgIHRoaXMuZGVmYXVsdFRpdGxlID0gZG9jdW1lbnQudGl0bGU7XG5cbiAgICB0aGlzLnVzZXJuYW1lID0gdXNlcm5hbWU7XG5cbiAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnQoKTtcbiAgICB0aGlzLmNoYXRMaW5lcyA9IHRoaXMuYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtbGluZXNcIik7XG4gICAgdGhpcy5hcGlLZXkgPSBcImVEQkU3NmRlVTdMMEg5bUVCZ3hVS1ZSMFZDbnEwWEJkXCI7XG4gICAgdGhpcy5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KFwid3M6Ly92aG9zdDMubG51LnNlOjIwMDgwL3NvY2tldC9cIik7XG5cbiAgICAvLyBBdHRhY2ggYW4gZXZlbnQgbGlzdGVuZXIgdG8ga25vdyB3aGVuIHRoZSB1c2VyIGZvY3VzZXMgb24gdGhlIFBXRCB0YWIuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgdGhpcy5oYW5kbGVWaXNpYmlsaXR5Q2hhbmdlLmJpbmQodGhpcykpO1xuXG4gICAgLy8gVE9ETzogTWFrZSBzdXJlIHRoZSBzb2NrZXQgb3BlbnMgYmVmb3JlIHRoZSB1c2VyIGNhbiBzZW5kIG1lc3NhZ2VzXG5cbiAgICAvLyBFdmVudCBoYW5kbGVyIGZvciBtZXNzYWdlcyByZWNlaXZlZCB0aHJvdWdoIHRoZSBjaGF0IGFwcGxpY2F0aW9uLlxuICAgIHRoaXMuc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcblxuICAgICAgICAvLyBBcHBlbmQgdGhlIGxpbmUgdG8gdGhlIENoYXQgbGluZXMsIHVubGVzcyBpdCBpcyBhIHNlcnZlciBoZWFydGJlYXQuXG4gICAgICAgIGlmIChtZXNzYWdlLnR5cGUgIT0gXCJoZWFydGJlYXRcIikge1xuICAgICAgICAgICAgX3RoaXMuYXBwZW5kTGluZShtZXNzYWdlLnVzZXJuYW1lLCBtZXNzYWdlLmRhdGEpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBhcHAgY29udGVudC5cbiAqIEByZXR1cm5zIHtFbGVtZW50fVxuICovXG5DaGF0LnByb3RvdHlwZS5jcmVhdGVBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNjaGF0LXRlbXBsYXRlXCIpO1xuXG4gICAgdmFyIGFwcENvbnRlbnQgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG5cbiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKGFwcENvbnRlbnQpO1xuXG4gICAgcmV0dXJuIGFwcENvbnRlbnQ7XG59O1xuXG4vKipcbiAqIEF0dGFjaCBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIGFwcCBjb250ZW50LlxuICogQHBhcmFtIHtOb2RlfSBhcHBDb250ZW50XG4gKi9cbkNoYXQucHJvdG90eXBlLmF0dGFjaEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24oYXBwQ29udGVudCkge1xuICAgIHZhciBjaGF0Rm9ybSA9IGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5jaGF0LWZvcm1cIik7XG4gICAgdmFyIHRleHRBcmVhID0gY2hhdEZvcm0ucXVlcnlTZWxlY3RvcihcInRleHRhcmVhXCIpO1xuXG4gICAgdGV4dEFyZWEuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVUZXh0SW5wdXQuYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIEV2ZW50IGhhbmRsZXIgZm9yIHRleHQgaW5wdXQuXG4gKiBAcGFyYW0gZXZlbnRcbiAqL1xuQ2hhdC5wcm90b3R5cGUuaGFuZGxlVGV4dElucHV0ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyBTaGlmdCArIEVudGVyIGNyZWF0ZXMgYSBuZXcgbGluZSwgRW50ZXIgc2VuZHMgYSBtZXNzYWdlLlxuICAgIGlmICghZXZlbnQuc2hpZnRLZXkgJiYgZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAvLyBIYW5kbGUgY2hhdCBjb21tYW5kcywgaWYgYW55LCBvdGhlcndpc2Ugc2VuZCB0aGUgbWVzc2FnZS5cbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC52YWx1ZS5jaGFyQXQoMCkgPT09IFwiL1wiKSB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUNvbW1hbmQoZXZlbnQudGFyZ2V0LnZhbHVlLnNsaWNlKDEpKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudC50YXJnZXQudmFsdWUgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZE1lc3NhZ2UoZXZlbnQudGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV2ZW50LnRhcmdldC52YWx1ZSA9IFwiXCI7XG4gICAgfVxufTtcblxuLyoqXG4gKiBIYW5kbGVzIHVzZXIgY29tbWFuZHMuXG4gKiBAcGFyYW0ge1N0cmluZ30gY29tbWFuZFxuICovXG5DaGF0LnByb3RvdHlwZS5oYW5kbGVDb21tYW5kID0gZnVuY3Rpb24oY29tbWFuZCkge1xuICAgIC8vIERpdmlkZSBjb21tYW5kIGludG8ga2V5d29yZCBhbmQgcGFyYW1ldGVycy5cbiAgICB2YXIgY29tbWFuZEtleXdvcmQgPSBjb21tYW5kLnNwbGl0KFwiIFwiKVswXTtcbiAgICB2YXIgY29tbWFuZFBhcmFtZXRlcnMgPSBudWxsO1xuXG4gICAgaWYgKGNvbW1hbmQuc3BsaXQoXCIgXCIpLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY29tbWFuZFBhcmFtZXRlcnMgPSBjb21tYW5kLnN1YnN0cihjb21tYW5kLmluZGV4T2YoXCIgXCIpICsgMSwgY29tbWFuZC5sZW5ndGgpO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSB0aGUgZGlmZmVyZW50IGtleXdvcmRzLiAoT25seSBvbmUgZm9yIG5vdykuXG4gICAgc3dpdGNoIChjb21tYW5kS2V5d29yZCkge1xuICAgICAgICBjYXNlIFwibmFtZVwiOlxuICAgICAgICAgICAgaWYgKGNvbW1hbmRQYXJhbWV0ZXJzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZSA9IGNvbW1hbmRQYXJhbWV0ZXJzO1xuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidXNlcm5hbWVcIiwgY29tbWFuZFBhcmFtZXRlcnMpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRMaW5lKFwiUFdEXCIsIFwiWW91ciB1c2VybmFtZSBpcyBub3cgXCIgKyBjb21tYW5kUGFyYW1ldGVycyArIFwiLlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hcHBlbmRMaW5lKFwiUFdEXCIsIFwiUGxlYXNlIGVudGVyIGEgdXNlcm5hbWUuXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kTGluZShcIlBXRFwiLCBjb21tYW5kS2V5d29yZCArIFwiIGNvbW1hbmQgbm90IHlldCBpbXBsZW1lbnRlZC5cIik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGaXJlcyB3aGVuIHRoZSB1c2VyIGNhbi9jYW5ub3Qgc2VlIHRoZSBQV0QgdGFiLlxuICovXG5DaGF0LnByb3RvdHlwZS5oYW5kbGVWaXNpYmlsaXR5Q2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gQ2hhbmdlIHRoZSBkb2N1bWVudCB0aXRsZSB0byB0aGUgZGVmYXVsdCB0aXRsZSBpZiB0aGUgdXNlciBjYW4gc2VlIHRoZSB0YWIuXG4gICAgaWYgKCFkb2N1bWVudC5oaWRkZW4pIHtcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aGlzLmRlZmF1bHRUaXRsZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEFkZHMgdGhlIG1lc3NhZ2UgdG8gdGhlIGxhc3RMaW5lcyBhcnJheS5cbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VybmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IGxpbmVcbiAqL1xuQ2hhdC5wcm90b3R5cGUuYXBwZW5kTGluZSA9IGZ1bmN0aW9uKHVzZXJuYW1lLCBsaW5lKSB7XG4gICAgdGhpcy5sYXN0TGluZXMucHVzaCh7dXNlcm5hbWU6IHVzZXJuYW1lLCBsaW5lOiBsaW5lfSk7XG5cbiAgICAvLyBMYXN0IGxpbmVzIG9ubHkgc3RvcmVzIHRoZSBsYXN0IDIwIG1lc3NhZ2VzLlxuICAgIGlmICh0aGlzLmxhc3RMaW5lcy5sZW5ndGggPiAyMCkge1xuICAgICAgICB0aGlzLmxhc3RMaW5lcy5zaGlmdCgpO1xuICAgIH1cblxuICAgIC8vIFBsYXkgbm90aWZpY2F0aW9uIHNvdW5kIGFuZCBjaGFuZ2UgdGhlIGRvY3VtZW50IHRpdGxlIGlmIHRoZSBkb2N1bWVudCBpcyBub3QgdmlzaWJsZS5cbiAgICBpZiAoZG9jdW1lbnQuaGlkZGVuKSB7XG4gICAgICAgIHZhciBhdWRpbyA9IHRoaXMuYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiYXVkaW9cIik7XG5cbiAgICAgICAgYXVkaW8ucGxheSgpO1xuXG4gICAgICAgIGRvY3VtZW50LnRpdGxlID0gXCIqIFwiICsgdGhpcy5kZWZhdWx0VGl0bGU7XG4gICAgfVxuXG4gICAgdGhpcy5jb252ZXJ0TGluZXNUb0hUTUwoKTtcbn07XG5cbi8qKlxuICogQ29udmVydHMgbGluZXMgaW4gbGFzdExpbmVzIGFycmF5IHRvIEhUTUwgYW5kIGF0dGFjaGVzIHRoZW0gdG8gdGhlIGFwcCBjb250ZW50LlxuICovXG5DaGF0LnByb3RvdHlwZS5jb252ZXJ0TGluZXNUb0hUTUwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY2hhdC1saW5lLXRlbXBsYXRlXCIpO1xuICAgIHZhciBjaGF0TGluZSA9IGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5jaGF0LW1lc3NhZ2VcIik7XG5cbiAgICB3aGlsZSAodGhpcy5jaGF0TGluZXMuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgIHRoaXMuY2hhdExpbmVzLnJlbW92ZUNoaWxkKHRoaXMuY2hhdExpbmVzLmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmxhc3RMaW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUsIGluZGV4KSB7XG4gICAgICAgIHZhciBvcmRlciA9IF90aGlzLmxhc3RMaW5lcy5sZW5ndGggLSBpbmRleDtcbiAgICAgICAgdmFyIG5ld0xpbmUgPSBjaGF0TGluZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIG5ld0xpbmUucXVlcnlTZWxlY3RvcihcIi51c2VybmFtZVwiKS50ZXh0Q29udGVudCA9IGxpbmUudXNlcm5hbWU7XG4gICAgICAgIG5ld0xpbmUucXVlcnlTZWxlY3RvcihcIi5jaGF0LWxpbmVcIikudGV4dENvbnRlbnQgPSBsaW5lLmxpbmU7XG5cbiAgICAgICAgbmV3TGluZS5zdHlsZS5vcmRlciA9IG9yZGVyO1xuXG4gICAgICAgIF90aGlzLmNoYXRMaW5lcy5hcHBlbmRDaGlsZChuZXdMaW5lKTtcbiAgICB9KTtcblxuICAgIHZhciBmb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG5cbiAgICBmb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5jaGF0XCIpLCBmdW5jdGlvbihjaGF0V2luKSB7XG4gICAgICAgIHZhciBuZXdDaGF0ID0gX3RoaXMuY2hhdExpbmVzLmNsb25lTm9kZSh0cnVlKTtcblxuICAgICAgICBjaGF0V2luLnJlbW92ZUNoaWxkKGNoYXRXaW4ucXVlcnlTZWxlY3RvcihcIi5jaGF0LWxpbmVzXCIpKTtcblxuICAgICAgICBjaGF0V2luLmluc2VydEJlZm9yZShuZXdDaGF0LCBjaGF0V2luLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1mb3JtXCIpKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogU2VuZHMgYSBtZXNzYWdlIHRvIHRoZSBzZXJ2ZXIuXG4gKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICovXG5DaGF0LnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICB2YXIgZGF0YSA9IHt9O1xuXG4gICAgZGF0YS51c2VybmFtZSA9IHRoaXMudXNlcm5hbWU7XG4gICAgZGF0YS5kYXRhID0gbWVzc2FnZTtcbiAgICBkYXRhLmtleSA9IHRoaXMuYXBpS2V5O1xuICAgIGRhdGEudHlwZSA9IFwibWVzc2FnZVwiO1xuXG4gICAgdGhpcy5zb2NrZXQuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG5cbiAgICAvLyBPZmZsaW5lIGNhcGFiaWxpdGllcyBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAgICAvL3RoaXMuYXBwZW5kTGluZSh0aGlzLnVzZXJuYW1lLCBtZXNzYWdlKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIGNsb25lIG9mIHRoZSBhcHBDb250ZW50LlxuICogQHJldHVybnMge05vZGV9XG4gKi9cbkNoYXQucHJvdG90eXBlLmdldEFwcENvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBDbG9uaW5nIGRvZXMgbm90IGF0dGFjaCBldmVudCBsaXN0ZW5lcnMsIHNvIHdlIGhhdmUgdG8gZG8gaXQgYWZ0ZXJ3YXJkc1xuICAgIHZhciBjb250ZW50ID0gdGhpcy5hcHBDb250ZW50LmNsb25lTm9kZSh0cnVlKTtcblxuICAgIHRoaXMuYXR0YWNoRXZlbnRMaXN0ZW5lcnMoY29udGVudCk7XG5cbiAgICByZXR1cm4gY29udGVudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhdDtcbiIsInZhciBBcHBXaW5kb3cgPSByZXF1aXJlKFwiLi9BcHBXaW5kb3dcIik7XG5cbi8qKlxuICogRGVza3RvcCBvYmplY3Qgd2hpY2ggY29udGFpbnMgYWxsIHRoZSBBcHBXaW5kb3cgb2JqZWN0cy5cbiAqL1xuZnVuY3Rpb24gRGVza3RvcCgpIHtcbiAgICAvLyBMaXN0IG9mIGFwcCB3aW5kb3dzLlxuICAgIHRoaXMud2luZG93cyA9IFtdO1xuXG4gICAgLy8gUmV0cmlldmUgdGhlIHVzZXIncyB1c2VybmFtZS5cbiAgICB0aGlzLnVzZXJuYW1lID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJ1c2VybmFtZVwiKTtcblxuICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN3aW5kb3dfY29udGFpbmVyXCIpO1xuXG4gICAgLy8gVGhlIG9iamVjdCB0aGF0IGNvbnRhaW5zIGFwcHMgdGhhdCBzaG91bGQgb25seSBoYXZlIG9uZSBpbnN0YW5jZSBhY3Jvc3MgdGhlIGRlc2t0b3AgKGUuZy4gY2hhdCkuXG4gICAgdGhpcy5pbnN0YW5jZXMgPSB7XG5cbiAgICB9O1xuXG4gICAgLy8gVmFyaWFibGVzIHRoYXQgc3RvcmUgdGhlIHdpbmRvdyB0aGF0IGlzIG1vdmluZyBhbmQgdGhlIHpJbmRleCBvZiB0aGUgd2luZG93IG9uIHRvcC5cbiAgICB0aGlzLm1vdmluZ1dpbmRvdyA9IG51bGw7XG4gICAgdGhpcy50b3BaSW5kZXggPSAxO1xuXG4gICAgLy8gRGlzdGFuY2UgZnJvbSB0aGUgY3Vyc29yIHRvIHRoZSBlZGdlIG9mIHRoZSBlbGVtZW50LlxuICAgIHRoaXMuZGlzdGFuY2UgPSB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDBcbiAgICB9O1xuXG4gICAgLy8gUG9zaXRpb24gb2YgdGhlIG1vdXNlLlxuICAgIHRoaXMubW91c2VQb3MgPSB7XG4gICAgICAgIHg6IDAsXG4gICAgICAgIHk6IDBcbiAgICB9O1xuXG4gICAgLy8gRG9jdW1lbnQgZXZlbnQgbGlzdGVuZXJzLlxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5tb3ZlV2luZG93LmJpbmQodGhpcykpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLm1vdmluZ1dpbmRvdyA9IG51bGw7XG4gICAgfS5iaW5kKHRoaXMpKTtcbn1cblxuLyoqXG4gKiBBdHRhY2hlcyBhbiBhcHAgdG8gYSB3aW5kb3cgYW5kIHRoYXQgd2luZG93IHRvIHRoZSBkZXNrdG9wLlxuICogQHBhcmFtIGFwcFxuICovXG5EZXNrdG9wLnByb3RvdHlwZS5hdHRhY2hXaW5kb3cgPSBmdW5jdGlvbihhcHApIHtcbiAgICB2YXIgYXBwV2luZG93ID0gbmV3IEFwcFdpbmRvdygpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlcmUgYXJlIGFueSB3aW5kb3dzIGluIHRoZSBkZXNrdG9wLiBJZiBzbywgY2hhbmdlIGl0cyBwb3NpdGlvbi5cbiAgICBpZiAodGhpcy53aW5kb3dzLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgIGFwcFdpbmRvdy5kaXYuc3R5bGUubGVmdCA9ICh0aGlzLndpbmRvd3NbdGhpcy53aW5kb3dzLmxlbmd0aCAtIDFdLmRpdi5vZmZzZXRMZWZ0ICsgMTUpICsgXCJweFwiO1xuICAgICAgICBhcHBXaW5kb3cuZGl2LnN0eWxlLnRvcCA9ICh0aGlzLndpbmRvd3NbdGhpcy53aW5kb3dzLmxlbmd0aCAtIDFdLmRpdi5vZmZzZXRUb3AgKyAzMCkgKyBcInB4XCI7XG4gICAgfVxuXG4gICAgLy8gTWFrZSBzdXJlIHRoZSBuZXcgd2luZG93IGlzIG9uIHRvcC5cbiAgICBhcHBXaW5kb3cuZGl2LnN0eWxlLnpJbmRleCA9IHRoaXMudG9wWkluZGV4O1xuICAgIHRoaXMudG9wWkluZGV4ICs9IDE7XG5cbiAgICAvLyBXZSBwdXNoIGl0IHRvIHRoZSBsaXN0IG9mIHdpbmRvd3MgZmlyc3QsIHNvIHRoYXQgd2Uga25vdyB0aGUgYXBwIHdpbmRvdydzIGluZGV4IGluIHRoZSBhcnJheVxuICAgIHRoaXMud2luZG93cy5wdXNoKGFwcFdpbmRvdyk7XG5cbiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKGFwcFdpbmRvdyk7XG5cbiAgICAvLyBBdHRhY2ggdGhlIGFwcCB0byB0aGUgd2luZG93LlxuICAgIGlmIChhcHApIHtcbiAgICAgICAgYXBwV2luZG93LmF0dGFjaEFwcChhcHApO1xuICAgIH1cblxuICAgIC8vIEF0dGFjaCB0aGUgd2luZG93IHRvIHRoZSBkZXNrdG9wLlxuICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKGFwcFdpbmRvdy5kaXYpO1xufTtcblxuLyoqXG4gKiBBdHRhY2ggZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBhcHAgd2luZG93LlxuICogQHBhcmFtIGFwcFdpbmRvd1xuICovXG5EZXNrdG9wLnByb3RvdHlwZS5hdHRhY2hFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uKGFwcFdpbmRvdykge1xuICAgIC8vIEF0dGFjaGVzIHRoZSBldmVudCBsaXN0ZW5lciB0aGF0IGdpdmVzIHRoZSBhcHAgd2luZG93IGZvY3VzLlxuICAgIGFwcFdpbmRvdy5kaXYuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB0aGlzLmdpdmVGb2N1cy5iaW5kKHRoaXMpKTtcblxuICAgIC8vIEF0dGFjaGVzIHRoZSBldmVudCBsaXN0ZW5lciB0aGF0IGhpZGVzIHRoZSBtZW51LlxuICAgIGFwcFdpbmRvdy5kaXYuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIWFwcFdpbmRvdy5kcm9wZG93bi5jbGFzc0xpc3QuY29udGFpbnMoXCJyZW1vdmVkXCIpICYmICFldmVudC50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKFwidG9vbGJhci1pY29uXCIpKSB7XG4gICAgICAgICAgICBhcHBXaW5kb3cuZHJvcGRvd24uY2xhc3NMaXN0LmFkZChcInJlbW92ZWRcIik7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFJlZnJlc2hlcyB0aGUgYXBwIHdoZW4gdGhlIGN1c3RvbSBldmVudCBcInJlZnJlc2hcIiBmaXJlcyBmcm9tIHRoZSBhcHBDb250YWluZXIuIEFwcHMgYXJlIHJlc3BvbnNpYmxlIGZvciBmaXJpbmdcbiAgICAvLyB0aGlzIGV2ZW50LlxuICAgIGFwcFdpbmRvdy5hcHBDb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInJlZnJlc2hcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGFwcFdpbmRvdy5yZWZyZXNoQXBwKCk7XG4gICAgfSk7XG5cbiAgICAvLyBTYW1lLCBidXQgZm9yIG9ubHkgdGhlIHRpdGxlLlxuICAgIGFwcFdpbmRvdy5hcHBDb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInJlZnJlc2h0aXRsZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYXBwV2luZG93LnJlZnJlc2hUaXRsZSgpO1xuICAgIH0pO1xuXG4gICAgLy8gQXR0YWNoZXMgdGhlIGV2ZW50IGxpc3RlbmVyIHRoYXQgc3RhcnRzIG1vdmluZyB0aGUgd2luZG93XG4gICAgYXBwV2luZG93LnRvb2xiYXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB0aGlzLnN0YXJ0TW92ZS5iaW5kKHRoaXMpKTtcblxuICAgIC8vIEF0dGFjaGVzIHRoZSBldmVudCBsaXN0ZW5lciB0aGF0IHNob3dzIHRoZSBkcm9wZG93biBtZW51LlxuICAgIGFwcFdpbmRvdy5tZW51SWNvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5zaG93TWVudS5iaW5kKGFwcFdpbmRvdykpO1xuXG4gICAgLy8gQXR0YWNoZXMgdGhlIGV2ZW50IGxpc3RlbmVyIHRoYXQgY2xvc2VzIHRoZSB3aW5kb3cgYW5kIHJlbW92ZXMgaXQgZnJvbSB0aGUgbGlzdCBvZiB3aW5kb3dzLlxuICAgIGFwcFdpbmRvdy5jbG9zZVdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vVE9ETzogbWFrZSBzdXJlIHRoaXMgZGVsZXRlcyB0aGUgY2hhdCBpbnN0YW5jZSB0b28hXG4gICAgICAgIHRoaXMuY29udGFpbmVyLnJlbW92ZUNoaWxkKGFwcFdpbmRvdy5kaXYpO1xuICAgICAgICB0aGlzLndpbmRvd3Muc3BsaWNlKHRoaXMud2luZG93cy5pbmRleE9mKGFwcFdpbmRvdyksIDEpO1xuICAgIH0uYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIEdpdmVzIGZvY3VzIHRvIHRoZSBjdXJyZW50IHdpbmRvdy5cbiAqIEBwYXJhbSBldmVudFxuICovXG5EZXNrdG9wLnByb3RvdHlwZS5naXZlRm9jdXMgPSBmdW5jdGlvbihldmVudCkge1xuICAgIC8vIENoZWNrIGlmIHRoZSB3aW5kb3cgaXMgb24gdG9wLiBJZiBub3QsIHB1c2ggaXQgdG8gdGhlIHRvcC5cbiAgICBpZiAocGFyc2VJbnQoZXZlbnQuY3VycmVudFRhcmdldC5zdHlsZS56SW5kZXgsIDEwKSAhPT0gdGhpcy50b3BaSW5kZXggLSAxKSB7XG4gICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQuc3R5bGUuekluZGV4ID0gdGhpcy50b3BaSW5kZXg7XG4gICAgICAgIHRoaXMudG9wWkluZGV4ICs9IDE7XG4gICAgfVxufTtcblxuLyoqXG4gKiBTaG93cyB0aGUgZHJvcGRvd24gbWVudS5cbiAqIEBwYXJhbSBldmVudFxuICovXG5EZXNrdG9wLnByb3RvdHlwZS5zaG93TWVudSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIHRoaXMuZHJvcGRvd24uY2xhc3NMaXN0LnRvZ2dsZShcInJlbW92ZWRcIik7XG59O1xuXG4vKipcbiAqIE1vdmVzIHRoZSBzZWxlY3RlZCB3aW5kb3cuXG4gKiBAcGFyYW0gZXZlbnRcbiAqL1xuRGVza3RvcC5wcm90b3R5cGUubW92ZVdpbmRvdyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy8gRmluZHMgdGhlIG1vdXNlIHBvc2l0aW9uIGluIHRoZSB3aW5kb3cgY29udGFpbmVyLlxuICAgIHRoaXMubW91c2VQb3MueCA9IGV2ZW50LmNsaWVudFggLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRMZWZ0O1xuICAgIHRoaXMubW91c2VQb3MueSA9IGV2ZW50LmNsaWVudFkgLSB0aGlzLmNvbnRhaW5lci5vZmZzZXRUb3A7XG5cbiAgICBpZiAodGhpcy5tb3ZpbmdXaW5kb3cpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAvLyBDaGFuZ2UgdGhlIHRvcCBhbmQgbGVmdCBvZiB0aGUgc2VsZWN0ZWQgd2luZG93IHRvIHRoZSBwb3NpdGlvbiBvZiB0aGUgbW91c2UgbWludXMgdGhlIGRpc3RhbmNlIHRvXG4gICAgICAgIC8vIHRoZSB3aW5kb3cncyB0b3AgbGVmdCBlZGdlLlxuICAgICAgICB0aGlzLm1vdmluZ1dpbmRvdy5zdHlsZS50b3AgPSAgdGhpcy5tb3VzZVBvcy55IC0gdGhpcy5kaXN0YW5jZS55ICsgXCJweFwiO1xuICAgICAgICB0aGlzLm1vdmluZ1dpbmRvdy5zdHlsZS5sZWZ0ID0gIHRoaXMubW91c2VQb3MueCAtIHRoaXMuZGlzdGFuY2UueCArIFwicHhcIjtcblxuICAgICAgICAvLyBQcmV2ZW50IHRoZSB3aW5kb3cgZnJvbSBtb3Zpbmcgb2ZmIHRoZSB0b3Agb2YgdGhlIGRlc2t0b3AuIE90aGVyIGRpcmVjdGlvbnMgYXJlIGZpbmUsXG4gICAgICAgIC8vIGp1c3QgbGlrZSBpbiBhIHJlYWwgb3BlcmF0aW5nIHN5c3RlbSFcbiAgICAgICAgaWYgKHRoaXMubW92aW5nV2luZG93Lm9mZnNldFRvcCA8IDApIHtcbiAgICAgICAgICAgIHRoaXMubW92aW5nV2luZG93LnN0eWxlLnRvcCA9IDA7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIFN0YXJ0cyB0aGUgbW92ZS5cbiAqIEBwYXJhbSBldmVudFxuICovXG5EZXNrdG9wLnByb3RvdHlwZS5zdGFydE1vdmUgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBtb3ZpbmdUb29sYmFyID0gZXZlbnQuY3VycmVudFRhcmdldDtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgdXNlciBpc24ndCBzZWxlY3RpbmcgdGhlIG1lbnUgaWNvbiBvciBcImNsb3NlIHdpbmRvd1wiIGJ1dHRvbi5cbiAgICBpZiAoIWV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoXCJ0b29sYmFyLXRpdGxlXCIpICYmIGV2ZW50LnRhcmdldCAhPT0gbW92aW5nVG9vbGJhcikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBtb3Zpbmcgd2luZG93IGFuZCB0aGUgZGlzdGFuY2UgdG8gdGhlIGVsZW1lbnQncyBlZGdlcy5cbiAgICB0aGlzLm1vdmluZ1dpbmRvdyA9IG1vdmluZ1Rvb2xiYXIucGFyZW50Tm9kZTtcblxuICAgIHRoaXMuZGlzdGFuY2UueCA9IHRoaXMubW91c2VQb3MueCAtIG1vdmluZ1Rvb2xiYXIucGFyZW50Tm9kZS5vZmZzZXRMZWZ0O1xuICAgIHRoaXMuZGlzdGFuY2UueSA9IHRoaXMubW91c2VQb3MueSAtIG1vdmluZ1Rvb2xiYXIucGFyZW50Tm9kZS5vZmZzZXRUb3A7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlc2t0b3A7XG4iLCIvKipcbiAqIENvbnN0cnVjdG9yIGZvciB0aGUgbWVtb3J5IGFwcC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBib2FyZFggVGhlIHdpZHRoIG9mIHRoZSBib2FyZCBpbiBicmlja3MuXG4gKiBAcGFyYW0ge051bWJlcn0gYm9hcmRZIFRoZSBoZWlnaHQgb2YgdGhlIGJvYXJkIGluIGJyaWNrcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNZW1vcnkoYm9hcmRYLCBib2FyZFkpIHtcbiAgICAvLyBTZXQgdGhlIGltYWdlIGFuZCB0aXRsZS5cbiAgICB0aGlzLmltYWdlU3JjID0gXCJwdXp6bGVcIjtcbiAgICB0aGlzLnRpdGxlID0gXCJNZW1vcnlcIjtcblxuICAgIC8vIERlZmF1bHQgc2l6ZSBpcyA0IGJ5IDQuXG4gICAgdGhpcy5ib2FyZFggPSBib2FyZFggfHwgNDtcbiAgICB0aGlzLmJvYXJkWSA9IGJvYXJkWSB8fCA0O1xuXG4gICAgLy8gQnJpY2sgaGFuZGxpbmcuXG4gICAgdGhpcy5icmlja3MgPSBbXTtcbiAgICB0aGlzLnRvdGFsQnJpY2tzID0gMDtcbiAgICB0aGlzLnJlbW92ZWRCcmlja3MgPSAwO1xuXG4gICAgLy8gVGhlIG51bWJlciBvZiBtb3ZlcyBhbmQgdGltZSB0YWtlbi5cbiAgICB0aGlzLm1vdmVzID0gMDtcbiAgICB0aGlzLnRpbWVUYWtlbiA9IDA7XG5cbiAgICB0aGlzLnRpbWVyID0gMDtcblxuICAgIC8vIFN0b3JlIGVsZW1lbnRzIGZvciBlYXNlIG9mIGFjY2Vzcy5cbiAgICB0aGlzLmJvYXJkID0gbnVsbDtcbiAgICB0aGlzLmluZm8gPSBudWxsO1xuICAgIHRoaXMubmV3R2FtZUZvcm0gPSBudWxsO1xuXG4gICAgLy8gQ3VzdG9tIGV2ZW50IGxpc3RlbmVyIGZvciByZWZyZXNoaW5nIHRoZSB0aXRsZS5cbiAgICB0aGlzLnJlZnJlc2hUaXRsZSA9IG5ldyBFdmVudChcInJlZnJlc2h0aXRsZVwiKTtcblxuICAgIC8vIFN0b3JlIGV2ZW50cyBzbyB0aGF0IHdlIGNhbiByZW1vdmUgdGhlbSBsYXRlci5cbiAgICB0aGlzLmJvdW5kUmV2ZWFsID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdGhpcy5yZXZlYWxCcmljayhldmVudC50YXJnZXQpO1xuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMuYm91bmRLZXlib2FyZEhhbmRsZXIgPSB0aGlzLmtleWJvYXJkSGFuZGxlci5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5ib3VuZE5ld0dhbWUgPSB0aGlzLm5ld0dhbWUuYmluZCh0aGlzKTtcblxuICAgIHRoaXMuc2VsZWN0ZWRCcmljayA9IG51bGw7XG5cbiAgICB0aGlzLmJyaWNrRWxlbWVudHMgPSBudWxsO1xuXG4gICAgdGhpcy5oaWdobGlnaHRlZEJyaWNrID0gbnVsbDtcblxuICAgIHRoaXMuYXBwQ29udGVudCA9IHRoaXMuY3JlYXRlQXBwQ29udGVudCgpO1xuXG4gICAgdGhpcy5hcHBDb250ZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLnNldEFjdGl2ZUdhbWUuYmluZCh0aGlzKSk7XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmJvdW5kS2V5Ym9hcmRIYW5kbGVyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBhcHBDb250ZW50IGZvciB0aGUgbWVtb3J5IGFwcGxpY2F0aW9uLlxuICogQHJldHVybnMge05vZGV9XG4gKi9cbk1lbW9yeS5wcm90b3R5cGUuY3JlYXRlQXBwQ29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbWVtb3J5LXRlbXBsYXRlXCIpO1xuICAgIHZhciBhcHBDb250ZW50ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250ZW50XCIpO1xuXG4gICAgdGhpcy5ib2FyZCA9IGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5ib2FyZFwiKTtcbiAgICB0aGlzLmluZm8gPSBhcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIuaW5mb1wiKTtcbiAgICB0aGlzLm5ld0dhbWVGb3JtID0gYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLm5ldy1nYW1lXCIpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZUJvYXJkKCk7XG4gICAgdGhpcy5zZXRBY3RpdmVHYW1lKCk7XG5cbiAgICB0aGlzLmF0dGFjaEV2ZW50TGlzdGVuZXJzKGFwcENvbnRlbnQpO1xuXG4gICAgcmV0dXJuIGFwcENvbnRlbnQ7XG59O1xuXG4vKipcbiAqIEF0dGFjaGVzIGV2ZW50IGxpc3RlbmVycy5cbiAqIEBwYXJhbSB7Tm9kZX0gYXBwQ29udGVudFxuICovXG5NZW1vcnkucHJvdG90eXBlLmF0dGFjaEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24oYXBwQ29udGVudCkge1xuICAgIHRoaXMuYm9hcmQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuYm91bmRSZXZlYWwpO1xuICAgIHRoaXMubmV3R2FtZUZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCB0aGlzLmJvdW5kTmV3R2FtZSk7XG5cbiAgICAvLyBNYWtlIHN1cmUgdGhlIGZvcm0gZG9lcyBub3Qgc3VibWl0IHdoaWxlIHRoZSBhYm92ZSBldmVudCBsaXN0ZW5lciBpcyByZW1vdmVkLlxuICAgIHRoaXMubmV3R2FtZUZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBjdXJyZW50IGdhbWUgdG8gYWN0aXZlLCBzbyB0aGF0IHRoZSBwbGF5ZXIgY2FuIHBsYXkgdGhlIGdhbWUgd2l0aCB0aGUga2V5Ym9hcmQuXG4gKi9cbk1lbW9yeS5wcm90b3R5cGUuc2V0QWN0aXZlR2FtZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmb3JFYWNoID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG5cbiAgICBmb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5ib2FyZFwiKSwgZnVuY3Rpb24oYm9hcmQpIHtcbiAgICAgICAgYm9hcmQuY2xhc3NMaXN0LnJlbW92ZShcImFjdGl2ZVwiKTtcbiAgICB9KTtcblxuICAgIHRoaXMuYm9hcmQuY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcbn07XG5cbi8qKlxuICogS2V5Ym9hcmQgaGFuZGxlciBmb3IgdGhlIE1lbW9yeSBnYW1lLiBDb250cm9scyBhcmUgbGVmdCwgdXAsIHJpZ2h0LCBkb3duLCBhbmQgZW50ZXIuXG4gKi9cbk1lbW9yeS5wcm90b3R5cGUua2V5Ym9hcmRIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZjtcblxuICAgIGlmICghdGhpcy5ib2FyZC5jbGFzc0xpc3QuY29udGFpbnMoXCJhY3RpdmVcIikpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFVuLWhpZ2hsaWdodCBhIGJyaWNrIGlmIGl0IGlzIGhpZ2hsaWdodGVkXG4gICAgdGhpcy5oaWdobGlnaHRlZEJyaWNrLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWdobGlnaHRlZFwiKTtcblxuICAgIHZhciBvbGRCcmljayA9IHRoaXMuaGlnaGxpZ2h0ZWRCcmljaztcblxuICAgIHZhciBpbmRleCA9IGluZGV4T2YuY2FsbCh0aGlzLmJyaWNrRWxlbWVudHMsIHRoaXMuaGlnaGxpZ2h0ZWRCcmljayk7XG5cbiAgICAvLyBUaGlzIHN3aXRjaCBjaGVja3MgdGhlIGtleWNvZGUgb2YgdGhlIGV2ZW50IGFuZCB0aGVuIGl0ZXJhdGVzIHRocm91Z2ggdGhlIGNvcnJlc3BvbmRpbmdcbiAgICAvLyBkaXJlY3Rpb24gdW50aWwgaXQgZmluZHMgYSBicmljayB0aGF0IGhhcyBub3QgYmVlbiByZW1vdmVkLCB0aGVuIGl0IGhpZ2hsaWdodHMgaXQuXG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICAgIGNhc2UgMzc6XG5cbiAgICAgICAgICAgIC8vIGxlZnRcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRlZEJyaWNrID0gdGhpcy5icmlja0VsZW1lbnRzW2luZGV4IC0gMV07XG4gICAgICAgICAgICAgICAgICAgIGluZGV4IC09IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRlZEJyaWNrID0gb2xkQnJpY2s7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKHRoaXMuaGlnaGxpZ2h0ZWRCcmljay5jbGFzc0xpc3QuY29udGFpbnMoXCJyZW1vdmVkXCIpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM4OlxuXG4gICAgICAgICAgICAvLyB1cFxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAtIHRoaXMuYm9hcmRYID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRlZEJyaWNrID0gdGhpcy5icmlja0VsZW1lbnRzW2luZGV4IC0gdGhpcy5ib2FyZFhdO1xuICAgICAgICAgICAgICAgICAgICBpbmRleCAtPSB0aGlzLmJvYXJkWDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodGVkQnJpY2sgPSBvbGRCcmljaztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAodGhpcy5oaWdobGlnaHRlZEJyaWNrLmNsYXNzTGlzdC5jb250YWlucyhcInJlbW92ZWRcIikpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzk6XG5cbiAgICAgICAgICAgIC8vIHJpZ2h0XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSB0aGlzLmJyaWNrRWxlbWVudHMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodGVkQnJpY2sgPSB0aGlzLmJyaWNrRWxlbWVudHNbaW5kZXggKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggKz0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodGVkQnJpY2sgPSBvbGRCcmljaztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAodGhpcy5oaWdobGlnaHRlZEJyaWNrLmNsYXNzTGlzdC5jb250YWlucyhcInJlbW92ZWRcIikpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNDA6XG5cbiAgICAgICAgICAgIC8vIGRvd25cbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggKyB0aGlzLmJvYXJkWCA8IHRoaXMuYnJpY2tFbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRlZEJyaWNrID0gdGhpcy5icmlja0VsZW1lbnRzW2luZGV4ICsgdGhpcy5ib2FyZFhdO1xuICAgICAgICAgICAgICAgICAgICBpbmRleCArPSB0aGlzLmJvYXJkWDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodGVkQnJpY2sgPSBvbGRCcmljaztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAodGhpcy5oaWdobGlnaHRlZEJyaWNrLmNsYXNzTGlzdC5jb250YWlucyhcInJlbW92ZWRcIikpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTM6XG5cbiAgICAgICAgICAgIC8vIGVudGVyXG4gICAgICAgICAgICB0aGlzLnJldmVhbEJyaWNrKHRoaXMuaGlnaGxpZ2h0ZWRCcmljayk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBSZS1oaWdobGlnaHQgdGhlIGJyaWNrXG4gICAgdGhpcy5oaWdobGlnaHRlZEJyaWNrLmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHRlZFwiKTtcbn07XG5cbi8qKlxuICogU3RhcnRzIGEgbmV3IGdhbWUuXG4gKiBAcGFyYW0gZXZlbnRcbiAqL1xuTWVtb3J5LnByb3RvdHlwZS5uZXdHYW1lID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgLy8gR2V0cyB0aGUgYm9hcmRYIGFuZCBib2FyZFkgZnJvbSB0aGUgZm9ybS5cbiAgICB2YXIgbmV3Qm9hcmRYID0gZXZlbnQudGFyZ2V0LmVsZW1lbnRzWzFdLnZhbHVlO1xuICAgIHZhciBuZXdCb2FyZFkgPSBldmVudC50YXJnZXQuZWxlbWVudHNbMl0udmFsdWU7XG5cbiAgICAvLyBNYWtlIHN1cmUgdGhlIHVzZXIgaGFzIGVudGVyZWQgbnVtYmVycy5cbiAgICBpZiAoaXNOYU4obmV3Qm9hcmRYKSB8fCBpc05hTihuZXdCb2FyZFkpKSB7XG4gICAgICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiUGxlYXNlIGVudGVyIG9ubHkgbnVtYmVycy5cIjtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIHRoZXkgaGF2ZSwgY29udmVydCB0aGVtIGZyb20gc3RyaW5ncyB0byBudW1iZXJzLlxuICAgIG5ld0JvYXJkWCA9IHBhcnNlSW50KG5ld0JvYXJkWCwgMTApO1xuICAgIG5ld0JvYXJkWSA9IHBhcnNlSW50KG5ld0JvYXJkWSwgMTApO1xuXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIGJvYXJkIGlzIG5vdCB0b28gYmlnIG9yIHRvbyBzbWFsbC5cbiAgICBpZiAobmV3Qm9hcmRYIDwgMiB8fCBuZXdCb2FyZFggPiAxMCB8fCBuZXdCb2FyZFkgPCAyIHx8IG5ld0JvYXJkWSA+IDEwKSB7XG4gICAgICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiUGxlYXNlIGVudGVyIG51bWJlcnMgYmV0d2VlbiAyIGFuZCAxMC5cIjtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSBwaWVjZXMgd2lsbCBmaXQgaW4gYSBncmlkLlxuICAgIGlmICgobmV3Qm9hcmRYICogbmV3Qm9hcmRZKSAlIDIgIT09IDApIHtcbiAgICAgICAgdGhpcy5pbmZvLnRleHRDb250ZW50ID0gXCJUaGUgYW1vdW50IG9mIGJyaWNrcyBtdXN0IGJlIGV2ZW4uXCI7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXNldCB0aGUgdGltZXIgYW5kIGNoYW5nZSB0aGUgdGl0bGUuXG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVyKTtcbiAgICB0aGlzLnRpdGxlID0gXCJNZW1vcnlcIjtcblxuICAgIHRoaXMuYXBwQ29udGVudC5wYXJlbnROb2RlLmRpc3BhdGNoRXZlbnQodGhpcy5yZWZyZXNoVGl0bGUpO1xuXG4gICAgLy8gQmx1ciB0aGUgZWxlbWVudHMgc28gdGhhdCB0aGV5IGRvbid0IGdldCBpbiB0aGUgd2F5IG9mIGtleWJvYXJkIGNvbnRyb2xzXG4gICAgZXZlbnQudGFyZ2V0LmVsZW1lbnRzWzBdLmJsdXIoKTtcbiAgICBldmVudC50YXJnZXQuZWxlbWVudHNbMV0uYmx1cigpO1xuICAgIGV2ZW50LnRhcmdldC5lbGVtZW50c1syXS5ibHVyKCk7XG5cbiAgICB0aGlzLmJvYXJkWCA9IG5ld0JvYXJkWDtcbiAgICB0aGlzLmJvYXJkWSA9IG5ld0JvYXJkWTtcblxuICAgIHdoaWxlICh0aGlzLmJvYXJkLmhhc0NoaWxkTm9kZXMoKSkge1xuICAgICAgICB0aGlzLmJvYXJkLnJlbW92ZUNoaWxkKHRoaXMuYm9hcmQuZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIHRoaXMuaW5mby50ZXh0Q29udGVudCA9IFwiXCI7XG5cbiAgICB0aGlzLmluaXRpYWxpemVCb2FyZCgpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuZCByYW5kb21pemVzIHRoZSBicmlja3MgbmVlZGVkIGZvciB0aGUgZ2FtZS5cbiAqL1xuTWVtb3J5LnByb3RvdHlwZS5pbml0aWFsaXplQm9hcmQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gU2V0IHRoZSBzaXplIG9mIHRoZSBib2FyZC5cbiAgICB0aGlzLmJvYXJkLnN0eWxlLndpZHRoID0gKDQ4ICogdGhpcy5ib2FyZFgpICsgXCJweFwiO1xuICAgIHRoaXMuYm9hcmQuc3R5bGUuaGVpZ2h0ID0gKDQ4ICogdGhpcy5ib2FyZFkpICsgXCJweFwiO1xuXG4gICAgdGhpcy50aW1lciA9IDA7XG4gICAgdGhpcy50aW1lVGFrZW4gPSAwO1xuICAgIHRoaXMudG90YWxCcmlja3MgPSB0aGlzLmJvYXJkWCAqIHRoaXMuYm9hcmRZO1xuICAgIHRoaXMucmVtb3ZlZEJyaWNrcyA9IDA7XG4gICAgdGhpcy5tb3ZlcyA9IDA7XG4gICAgdGhpcy5icmlja3MgPSBbXTtcbiAgICB0aGlzLnNlbGVjdGVkQnJpY2sgPSBudWxsO1xuXG4gICAgLy8gUG9wdWxhdGUgdGhlIGJyaWNrIGFycmF5LlxuICAgIHZhciBpO1xuICAgIHZhciBjb3VudCA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMudG90YWxCcmlja3M7IGkgKz0gMikge1xuICAgICAgICB0aGlzLmJyaWNrc1tpXSA9IGNvdW50ICUgODtcbiAgICAgICAgdGhpcy5icmlja3NbaSArIDFdID0gY291bnQgJSA4O1xuICAgICAgICBjb3VudCA9IGNvdW50ID09IDcgPyBjb3VudCA9IDAgOiBjb3VudCArPSAxO1xuICAgIH1cblxuICAgIC8vIEZpc2hlci1ZYXRlcyBzaHVmZmxlLlxuICAgIGZvciAoaSA9IHRoaXMudG90YWxCcmlja3MgLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIHZhciBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkgKyAxKSk7XG4gICAgICAgIHZhciBrID0gdGhpcy5icmlja3Nbal07XG4gICAgICAgIHRoaXMuYnJpY2tzW2pdID0gdGhpcy5icmlja3NbaV07XG4gICAgICAgIHRoaXMuYnJpY2tzW2ldID0gaztcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgdGhlIGJyaWNrIGVsZW1lbnRzIGFuZCBzZXQgdGhlIGluaXRpYWwgaGlkZGVuIGltYWdlLlxuICAgIHRoaXMuYnJpY2tzLmZvckVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBicmljayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG4gICAgICAgIGJyaWNrLmNsYXNzTGlzdC5hZGQoXCJtZW1vcnktYnJpY2tcIik7XG4gICAgICAgIGJyaWNrLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9oaWRkZW4ucG5nXCIpO1xuXG4gICAgICAgIF90aGlzLmJvYXJkLmFwcGVuZENoaWxkKGJyaWNrKTtcbiAgICB9KTtcblxuICAgIHRoaXMuYnJpY2tFbGVtZW50cyA9IHRoaXMuYm9hcmQucXVlcnlTZWxlY3RvckFsbChcIi5tZW1vcnktYnJpY2tcIik7XG4gICAgdGhpcy5oaWdobGlnaHRlZEJyaWNrID0gdGhpcy5icmlja0VsZW1lbnRzWzBdO1xuICAgIHRoaXMuaGlnaGxpZ2h0ZWRCcmljay5jbGFzc0xpc3QuYWRkKFwiaGlnaGxpZ2h0ZWRcIik7XG59O1xuXG4vKipcbiAqIEhhbmRsZXMgcmV2ZWFsaW5nIHRoZSBzZWxlY3RlZCBicmljay5cbiAqIEBwYXJhbSBicmljayBUaGUgc2VsZWN0ZWQgYnJpY2suXG4gKi9cbk1lbW9yeS5wcm90b3R5cGUucmV2ZWFsQnJpY2sgPSBmdW5jdGlvbihicmljaykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAvLyBEbyBub3RoaW5nIGlmIHRoZSBicmljayBwcmVzc2VkIGlzIHRoZSBicmljayBzZWxlY3RlZFxuICAgIGlmICh0aGlzLnNlbGVjdGVkQnJpY2sgJiYgYnJpY2sgPT09IHRoaXMuc2VsZWN0ZWRCcmljay5icmlja0VsZW0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIERvIG5vdGhpbmcgaWYgdGhlIHVzZXIgaGFzIGNsaWNrZWQgb24gdGhlIGJvYXJkXG4gICAgaWYgKGJyaWNrID09PSB0aGlzLmJvYXJkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGaW5hbGx5LCBkbyBub3RoaW5nIGlmIHRoZSBicmljayBpcyByZW1vdmVkIVxuICAgIGlmIChicmljay5jbGFzc0xpc3QuY29udGFpbnMoXCJyZW1vdmVkXCIpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTdGFydCB0aGUgdGltZXIgaWYgaXQgaGFzbid0IGFscmVhZHkgc3RhcnRlZC5cbiAgICBpZiAoIXRoaXMudGltZXIpIHtcbiAgICAgICAgdGhpcy50aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMudGljaygpO1xuICAgICAgICB9LCAxMDApO1xuICAgIH1cblxuICAgIC8vIEZpbmQgdGhlIGluZGV4IG9mIHRoZSBicmljayBpbiB0aGUgYm9hcmRcbiAgICB2YXIgaW5kZXggPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHRoaXMuYm9hcmQuY2hpbGRyZW4sIGJyaWNrKTtcblxuICAgIC8vIEZsaXAgdGhlIGJyaWNrXG4gICAgYnJpY2suc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiL2ltYWdlL1wiICsgdGhpcy5icmlja3NbaW5kZXhdICsgXCIucG5nXCIpO1xuXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gc2VsZWN0ZWQgYnJpY2ssIHRoaXMgaXMgdGhlIHNlbGVjdGVkIGJyaWNrXG4gICAgaWYgKCF0aGlzLnNlbGVjdGVkQnJpY2spIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZEJyaWNrID0ge2JyaWNrRWxlbTogYnJpY2ssIHZhbHVlOiB0aGlzLmJyaWNrc1tpbmRleF19O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElmIHRoZXJlIGlzLCBjaGVjayBpZiB0aGV5IG1hdGNoXG4gICAgICAgIHRoaXMuY2hlY2tNYXRjaCh7YnJpY2tFbGVtOiBicmljaywgdmFsdWU6IHRoaXMuYnJpY2tzW2luZGV4XX0pXG4gICAgfVxufTtcblxuLyoqXG4gKiBUaWNrcyB1cCB0aGUgY2xvY2sgZXZlcnkgMTAwIG1pbGxpc2Vjb25kcy5cbiAqL1xuTWVtb3J5LnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy50aW1lVGFrZW4gKz0gMTAwO1xuXG4gICAgdGhpcy50aXRsZSA9IFwiTWVtb3J5IC0gXCIgKyAodGhpcy50aW1lVGFrZW4gLyAxMDAwKS50b0ZpeGVkKDEpO1xuXG4gICAgdGhpcy5hcHBDb250ZW50LnBhcmVudE5vZGUuZGlzcGF0Y2hFdmVudCh0aGlzLnJlZnJlc2hUaXRsZSk7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgYnJpY2sgcmV2ZWFsZWQgbWF0Y2hlcyB0aGUgc2VsZWN0ZWQgYnJpY2tcbiAqIEBwYXJhbSBicmlja1xuICovXG5NZW1vcnkucHJvdG90eXBlLmNoZWNrTWF0Y2ggPSBmdW5jdGlvbihicmljaykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAvLyBSZW1vdmUgdGhlIGV2ZW50IGxpc3RlbmVycyB3aGlsZSB0aGUgYnJpY2tzIGFyZSBiZWluZyBjaGVja2VkXG4gICAgdGhpcy5ib2FyZC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5ib3VuZFJldmVhbCk7XG4gICAgdGhpcy5uZXdHYW1lRm9ybS5yZW1vdmVFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIHRoaXMuYm91bmROZXdHYW1lKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmJvdW5kS2V5Ym9hcmRIYW5kbGVyKTtcblxuICAgIC8vIElmIHRoZXkgbWF0Y2gsIHJlbW92ZSBib3RoIGFuZCBhZGQgMiB0byByZW1vdmVkIGJyaWNrcyBjb3VudC5cbiAgICBpZiAoYnJpY2sudmFsdWUgPT09IHRoaXMuc2VsZWN0ZWRCcmljay52YWx1ZSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYnJpY2suYnJpY2tFbGVtLmNsYXNzTGlzdC5hZGQoXCJyZW1vdmVkXCIpO1xuICAgICAgICAgICAgX3RoaXMuc2VsZWN0ZWRCcmljay5icmlja0VsZW0uY2xhc3NMaXN0LmFkZChcInJlbW92ZWRcIik7XG5cbiAgICAgICAgICAgIF90aGlzLnJlbW92ZWRCcmlja3MgKz0gMjtcblxuICAgICAgICAgICAgX3RoaXMuc2VsZWN0ZWRCcmljayA9IG51bGw7XG4gICAgICAgICAgICBfdGhpcy5ib2FyZC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgX3RoaXMuYm91bmRSZXZlYWwpO1xuICAgICAgICAgICAgX3RoaXMubmV3R2FtZUZvcm0uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBfdGhpcy5ib3VuZE5ld0dhbWUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgX3RoaXMuYm91bmRLZXlib2FyZEhhbmRsZXIpO1xuXG5cbiAgICAgICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBtb3JlIGJyaWNrcywgdGhlIGdhbWUgaXMgb3Zlci5cbiAgICAgICAgICAgIGlmIChfdGhpcy5yZW1vdmVkQnJpY2tzID09PSBfdGhpcy50b3RhbEJyaWNrcykge1xuICAgICAgICAgICAgICAgIF90aGlzLmVuZEdhbWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgdGhleSBkb24ndCBtYXRjaCwgZmxpcCB0aGVtIGJhY2sgb3Zlci5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJyaWNrLmJyaWNrRWxlbS5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgXCIvaW1hZ2UvaGlkZGVuLnBuZ1wiKTtcbiAgICAgICAgICAgIF90aGlzLnNlbGVjdGVkQnJpY2suYnJpY2tFbGVtLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi9pbWFnZS9oaWRkZW4ucG5nXCIpO1xuXG4gICAgICAgICAgICBfdGhpcy5zZWxlY3RlZEJyaWNrID0gbnVsbDtcbiAgICAgICAgICAgIF90aGlzLmJvYXJkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBfdGhpcy5ib3VuZFJldmVhbCk7XG4gICAgICAgICAgICBfdGhpcy5uZXdHYW1lRm9ybS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIF90aGlzLmJvdW5kTmV3R2FtZSk7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBfdGhpcy5ib3VuZEtleWJvYXJkSGFuZGxlcik7XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH1cblxuICAgIC8vIEVpdGhlciB3YXksIHRoZSB1c2VyIGhhcyB1c2VkIG9uZSBtb3ZlLlxuICAgIHRoaXMubW92ZXMgKz0gMTtcbn07XG5cbi8qKlxuICogU2ltcGxlIGZ1bmN0aW9uIHRoYXQgZGlzcGxheXMgdGhlIGFtb3VudCBvZiBtb3ZlcyBhbmQgdGltZSB0YWtlbi5cbiAqL1xuTWVtb3J5LnByb3RvdHlwZS5lbmRHYW1lID0gZnVuY3Rpb24oKSB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVyKTtcbiAgICB0aGlzLnRpdGxlID0gXCJNZW1vcnlcIjtcblxuICAgIHRoaXMuYXBwQ29udGVudC5wYXJlbnROb2RlLmRpc3BhdGNoRXZlbnQodGhpcy5yZWZyZXNoVGl0bGUpO1xuXG4gICAgdGhpcy5pbmZvLnRleHRDb250ZW50ID0gXCJOaWNlISBNb3ZlczogXCIgKyB0aGlzLm1vdmVzICsgXCIsIFRpbWU6IFwiICsgKHRoaXMudGltZVRha2VuIC8gMTAwMCkudG9GaXhlZCgxKSArIFwic1wiO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBBcHBDb250ZW50LlxuICogQHJldHVybnMge05vZGV9XG4gKi9cbk1lbW9yeS5wcm90b3R5cGUuZ2V0QXBwQ29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmFwcENvbnRlbnQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbW9yeTtcbiIsIi8qKlxuICogQ29uc3RydWN0b3IgZm9yIHRoZSBOb3RlYm9vayBhcHAuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHdlbGNvbWUgSWYgdHJ1ZSwgaXQgaXMgdGhlIGZpcnN0IHRpbWUgdGhlIHVzZXIgb3BlbnMgdGhlIGFwcCwgc28gZGlzcGxheSBhIHdlbGNvbWUgbWVzc2FnZS5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBOb3RlYm9vayh3ZWxjb21lKSB7XG4gICAgLy8gR2V0IHRoZSBhcnJheSBvZiBub3RlcyBmcm9tIGxvY2FsIHN0b3JhZ2UuXG4gICAgdGhpcy5ub3RlQXJyYXkgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibm90ZXNcIikpO1xuXG4gICAgLy8gQ3JlYXRlIGEgY3VzdG9tIGV2ZW50IHRoYXQgbGV0cyB0aGUgYXBwIHdpbmRvdyBrbm93IGl0IHNob3VsZCByZWZyZXNoIGl0c2VsZi5cbiAgICB0aGlzLnJlZnJlc2ggPSBuZXcgRXZlbnQoXCJyZWZyZXNoXCIpO1xuXG4gICAgLy8gQXJyYXkgb2YgbWVudSBvYmplY3RzLCB3aXRoIG5hbWUgYW5kIGV2ZW50IGhhbmRsZXIuXG4gICAgdGhpcy5tZW51SXRlbXMgPSBbXG4gICAgICAgIHtuYW1lOiBcIk5ld1wiLCBldmVudEhhbmRsZXI6IHRoaXMubmV3Tm90ZS5iaW5kKHRoaXMpfSxcbiAgICAgICAge25hbWU6IFwiU2F2ZVwiLCBldmVudEhhbmRsZXI6IHRoaXMuc2F2ZU5vdGUuYmluZCh0aGlzKX0sXG4gICAgICAgIHtuYW1lOiBcIkxvYWRcIiwgZXZlbnRIYW5kbGVyOiB0aGlzLmxvYWRTY3JlZW4uYmluZCh0aGlzKX1cbiAgICBdO1xuXG4gICAgLy8gU2V0IHRoZSBpbWFnZS5cbiAgICB0aGlzLmltYWdlU3JjID0gXCJkaWFyeVwiO1xuXG4gICAgLy8gSWYgaXQgaXMgdGhlIGZpcnN0IHRpbWUgdGhlIHVzZXIgb3BlbnMgdGhlIGFwcCwgZGlzcGxheSBhIHdlbGNvbWUgbWVzc2FnZS5cbiAgICAvLyBPdGhlcndpc2UsIGRpc3BsYXkgYSBuZXcgbm90ZS5cbiAgICAvLyB0aGlzLnN0YXRlIGhhcyB0aHJlZSBzZXR0aW5nczogbmV3LCBsb2FkLCBvciB0aGUgbmFtZSBvZiB0aGUgbm90ZSB0byBkaXNwbGF5LlxuICAgIGlmICh3ZWxjb21lKSB7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBcIldlbGNvbWVcIjtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiV2VsY29tZVwiO1xuICAgICAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnRTYXZlZE5vdGUodGhpcy5zdGF0ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IFwibmV3XCI7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlVudGl0bGVkXCI7XG4gICAgICAgIHRoaXMuYXBwQ29udGVudCA9IHRoaXMuY3JlYXRlQXBwQ29udGVudE5ldygpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBhcHAgY29udGVudCBmb3IgYSBuZXcgbm90ZS5cbiAqIEByZXR1cm5zIHtOb2RlfVxuICovXG5Ob3RlYm9vay5wcm90b3R5cGUuY3JlYXRlQXBwQ29udGVudE5ldyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbm90ZWJvb2stdGVtcGxhdGUtbmV3XCIpO1xuICAgIHJldHVybiBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGFwcCBjb250ZW50IGZvciBhIHNhdmVkIG5vdGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBub3RlTmFtZSBUaGUgbmFtZSBvZiB0aGUgbm90ZSB0byBsb2FkIGZyb20gbG9jYWwgc3RvcmFnZS5cbiAqIEByZXR1cm5zIHtOb2RlfVxuICovXG5Ob3RlYm9vay5wcm90b3R5cGUuY3JlYXRlQXBwQ29udGVudFNhdmVkTm90ZSA9IGZ1bmN0aW9uKG5vdGVOYW1lKSB7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNub3RlYm9vay10ZW1wbGF0ZS1uZXdcIik7XG4gICAgdmFyIGFwcENvbnRlbnQgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG5cbiAgICAvLyBHZXQgdGhlIG5vdGUgZnJvbSBub3RlQXJyYXkuXG4gICAgdmFyIG5vdGUgPSB0aGlzLmdldE5vdGUobm90ZU5hbWUpO1xuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSBub3RlLCBkaXNwbGF5IGl0cyBjb250ZW50LlxuICAgIGlmIChub3RlKSB7XG4gICAgICAgIGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5ub3RlXCIpLnZhbHVlID0gbm90ZS5jb250ZW50O1xuICAgIH1cblxuICAgIHJldHVybiBhcHBDb250ZW50O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgYmxhbmsgbm90ZS5cbiAqL1xuTm90ZWJvb2sucHJvdG90eXBlLm5ld05vdGUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN0YXRlID0gXCJuZXdcIjtcbiAgICB0aGlzLnRpdGxlID0gXCJVbnRpdGxlZFwiO1xuXG4gICAgLy8gTGV0IHRoZSBhcHAgY29udGFpbmVyIGtub3cgaXQgc2hvdWxkIHJlZnJlc2ggaXRzZWxmLlxuICAgIHRoaXMuYXBwQ29udGVudC5wYXJlbnROb2RlLmRpc3BhdGNoRXZlbnQodGhpcy5yZWZyZXNoKTtcbn07XG5cbi8qKlxuICogU2F2ZXMgYSBub3RlLlxuICovXG5Ob3RlYm9vay5wcm90b3R5cGUuc2F2ZU5vdGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBEbyBub3RoaW5nIGlmIHdlIGFyZSBvbiB0aGUgbG9hZCBzY3JlZW4uXG4gICAgaWYgKHRoaXMuc3RhdGUgPT09IFwibG9hZFwiKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgbm90ZSBpcyBuZXcsIGFzayB3aGF0IHdlIHNob3VsZCBjYWxsIHRoZSBub3RlLlxuICAgIGlmICh0aGlzLnN0YXRlID09PSBcIm5ld1wiKSB7XG4gICAgICAgIHZhciBuYW1lID0gcHJvbXB0KFwiUGxlYXNlIGVudGVyIGEgbmFtZTogXCIpO1xuXG4gICAgICAgIGlmIChuYW1lID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5nZXROb3RlKG5hbWUpKSB7XG4gICAgICAgICAgICBhbGVydChcIk5hbWUgYWxyZWFkeSB0YWtlbi5cIik7XG4gICAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCJVbnRpdGxlZFwiIHx8IG5hbWUgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGdpdmUgeW91ciBub3RlIGEgbmFtZS5cIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBQdXNoIHRoZSBub3RlIHRvIHRoZSBub3RlIGFycmF5IGFuZCB0byBsb2NhbCBzdG9yYWdlLlxuICAgICAgICAgICAgdGhpcy5ub3RlQXJyYXkucHVzaCh7bmFtZTogbmFtZSwgY29udGVudDogdGhpcy5hcHBDb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCIubm90ZVwiKS52YWx1ZX0pO1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJub3Rlc1wiLCBKU09OLnN0cmluZ2lmeSh0aGlzLm5vdGVBcnJheSkpO1xuXG4gICAgICAgICAgICAvLyBTZXQgdGhlIGFwcCBzdGF0ZSBhbmQgdGl0bGUgdG8gZGlzcGxheSBpbiB0aGUgdG9vbGJhci5cbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBuYW1lO1xuICAgICAgICAgICAgdGhpcy50aXRsZSA9IG5hbWU7XG5cbiAgICAgICAgICAgIC8vIExldCB0aGUgYXBwIGNvbnRhaW5lciBrbm93IGl0IHNob3VsZCByZWZyZXNoIGl0c2VsZi5cbiAgICAgICAgICAgIHRoaXMuYXBwQ29udGVudC5wYXJlbnROb2RlLmRpc3BhdGNoRXZlbnQodGhpcy5yZWZyZXNoKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElmIHRoZSBub3RlIGlzIG5vdCBuZXcsIHNhdmUgaXRzIG5ldyBjb250ZW50LlxuICAgICAgICB0aGlzLmdldE5vdGUodGhpcy5zdGF0ZSkuY29udGVudCA9IHRoaXMuYXBwQ29udGVudC5xdWVyeVNlbGVjdG9yKFwiLm5vdGVcIikudmFsdWU7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibm90ZXNcIiwgSlNPTi5zdHJpbmdpZnkodGhpcy5ub3RlQXJyYXkpKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIERpc3BsYXkgdGhlIGxvYWQgbm90ZSBzY3JlZW4uXG4gKi9cbk5vdGVib29rLnByb3RvdHlwZS5sb2FkU2NyZWVuID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdGF0ZSA9IFwibG9hZFwiO1xuICAgIHRoaXMudGl0bGUgPSBcIkxvYWRcIjtcblxuICAgIC8vIExldCB0aGUgYXBwIGNvbnRhaW5lciBrbm93IGl0IHNob3VsZCByZWZyZXNoIGl0c2VsZi5cbiAgICB0aGlzLmFwcENvbnRlbnQucGFyZW50Tm9kZS5kaXNwYXRjaEV2ZW50KHRoaXMucmVmcmVzaCk7XG59O1xuXG4vKipcbiAqIExvYWRzIGEgbm90ZSBmcm9tIHRoZSBub3RlIGFycmF5LlxuICogQHBhcmFtIGV2ZW50XG4gKi9cbk5vdGVib29rLnByb3RvdHlwZS5sb2FkTm90ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdGhpcy5zdGF0ZSA9IGV2ZW50LmN1cnJlbnRUYXJnZXQuZGF0YXNldC5ub3RlTmFtZTtcbiAgICB0aGlzLnRpdGxlID0gZXZlbnQuY3VycmVudFRhcmdldC5kYXRhc2V0Lm5vdGVOYW1lO1xuXG4gICAgLy8gTGV0IHRoZSBhcHAgY29udGFpbmVyIGtub3cgaXQgc2hvdWxkIHJlZnJlc2ggaXRzZWxmLlxuICAgIHRoaXMuYXBwQ29udGVudC5wYXJlbnROb2RlLmRpc3BhdGNoRXZlbnQodGhpcy5yZWZyZXNoKTtcbn07XG5cbi8qKlxuICogRGVsZXRlcyBhIG5vdGUuXG4gKiBAcGFyYW0gZXZlbnRcbiAqL1xuTm90ZWJvb2sucHJvdG90eXBlLmRlbGV0ZU5vdGUgPSBmdW5jdGlvbihldmVudCkge1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgdmFyIG5hbWUgPSBldmVudC50YXJnZXQuZGF0YXNldC5ub3RlTmFtZTtcbiAgICB2YXIgbm90ZSA9IHRoaXMuZ2V0Tm90ZShuYW1lKTtcblxuICAgIGlmIChub3RlKSB7XG4gICAgICAgIHRoaXMubm90ZUFycmF5LnNwbGljZSh0aGlzLm5vdGVBcnJheS5pbmRleE9mKG5vdGUpLCAxKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJub3Rlc1wiLCBKU09OLnN0cmluZ2lmeSh0aGlzLm5vdGVBcnJheSkpO1xuICAgIH1cblxuICAgIC8vIExldCB0aGUgYXBwIGNvbnRhaW5lciBrbm93IGl0IHNob3VsZCByZWZyZXNoIGl0c2VsZi5cbiAgICB0aGlzLmFwcENvbnRlbnQucGFyZW50Tm9kZS5kaXNwYXRjaEV2ZW50KHRoaXMucmVmcmVzaCk7XG59O1xuXG4vKipcbiAqIENyZWF0ZSB0aGUgYXBwIGNvbnRlbnQgb2YgdGhlIGxvYWQgbm90ZSBtZW51LlxuICogQHJldHVybnMge05vZGV9XG4gKi9cbk5vdGVib29rLnByb3RvdHlwZS5jcmVhdGVBcHBDb250ZW50TG9hZE1lbnUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25vdGVib29rLXRlbXBsYXRlLWxvYWRcIik7XG4gICAgdmFyIGFwcENvbnRlbnQgPSBkb2N1bWVudC5pbXBvcnROb2RlKHRlbXBsYXRlLmNvbnRlbnQsIHRydWUpLnF1ZXJ5U2VsZWN0b3IoXCIuYXBwLWNvbnRlbnRcIik7XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gQ3JlYXRlIGEgbGlzdCBpdGVtIGZvciBlYWNoIG5vdGUgaW4gdGhlIGFycmF5IGFuZCBhdHRhY2ggZXZlbnQgbGlzdGVuZXJzLlxuICAgIHRoaXMubm90ZUFycmF5LmZvckVhY2goZnVuY3Rpb24obm90ZSkge1xuICAgICAgICB2YXIgaXRlbVRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNub3RlYm9vay1saXN0aXRlbS10ZW1wbGF0ZVwiKTtcbiAgICAgICAgdmFyIGl0ZW0gPSBkb2N1bWVudC5pbXBvcnROb2RlKGl0ZW1UZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLm5vdGVib29rLWxpc3RpdGVtXCIpO1xuXG4gICAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKFwiZGF0YS1ub3RlLW5hbWVcIiwgbm90ZS5uYW1lKTtcblxuICAgICAgICBpdGVtLnF1ZXJ5U2VsZWN0b3IoXCIuaXRlbS1uYW1lXCIpLnRleHRDb250ZW50ID0gbm90ZS5uYW1lO1xuXG4gICAgICAgIGl0ZW0ucXVlcnlTZWxlY3RvcihcIi5kZWxldGUtaXRlbVwiKS5zZXRBdHRyaWJ1dGUoXCJkYXRhLW5vdGUtbmFtZVwiLCBub3RlLm5hbWUpO1xuXG4gICAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIF90aGlzLmxvYWROb3RlLmJpbmQoX3RoaXMpKTtcblxuICAgICAgICBpdGVtLnF1ZXJ5U2VsZWN0b3IoXCIuZGVsZXRlLWl0ZW1cIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIF90aGlzLmRlbGV0ZU5vdGUuYmluZChfdGhpcykpO1xuXG4gICAgICAgIGFwcENvbnRlbnQucXVlcnlTZWxlY3RvcihcIi5ub3RlbGlzdFwiKS5hcHBlbmRDaGlsZChpdGVtKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBhcHBDb250ZW50O1xufTtcblxuLyoqXG4gKiBHZXRzIGEgbm90ZSBieSBpdHMgbmFtZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBub3RlLlxuICogQHJldHVybnMgeyp9XG4gKi9cbk5vdGVib29rLnByb3RvdHlwZS5nZXROb3RlID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciByZXN1bHROb3RlID0gbnVsbDtcblxuICAgIHRoaXMubm90ZUFycmF5LmZvckVhY2goZnVuY3Rpb24obm90ZSkge1xuICAgICAgICBpZiAobm90ZS5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICByZXN1bHROb3RlID0gbm90ZTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdE5vdGU7XG59O1xuXG4vKipcbiAqIENyZWF0ZSB0aGUgYXBwIGNvbnRlbnQgZGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiB0aGUgYXBwLlxuICogQHJldHVybnMge05vZGV9XG4gKi9cbk5vdGVib29rLnByb3RvdHlwZS5nZXRBcHBDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUgPT09IFwibmV3XCIpIHtcbiAgICAgICAgdGhpcy5hcHBDb250ZW50ID0gdGhpcy5jcmVhdGVBcHBDb250ZW50TmV3KCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwQ29udGVudDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT09IFwibG9hZFwiKSB7XG4gICAgICAgIHRoaXMuYXBwQ29udGVudCA9IHRoaXMuY3JlYXRlQXBwQ29udGVudExvYWRNZW51KCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwQ29udGVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFwcENvbnRlbnQgPSB0aGlzLmNyZWF0ZUFwcENvbnRlbnRTYXZlZE5vdGUodGhpcy5zdGF0ZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYXBwQ29udGVudDtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5vdGVib29rO1xuIiwiLy8gQXBwLmpzIGNvbnRyb2xzIHRoZSBVSSBhbmQgaXMgcmVzcG9uc2libGUgZm9yIGNyZWF0aW5nIG5ldyBhcHAgaW5zdGFuY2VzLiBBZGRpbmcgbmV3IGFwcHNcbi8vIHRvIHRoZSBQZXJzb25hbCBXZWIgRGVza3RvcCBzaG91bGQgYmUgYXMgZWFzeSBhcyBpbXBvcnRpbmcgaXQgaW4gYXBwLmpzIGFuZCBjcmVhdGluZyBpdC5cblxuLy8gVGhlIGFwcHMgZm9sbG93IHRoZSBzYW1lIHN0cnVjdHVyZTpcbi8vIFRoZXkgYWxsIGNvbnRhaW4gYSBmdW5jdGlvbiBjYWxsZWQgZ2V0QXBwQ29udGVudCwgd2hpY2ggcmV0dXJucyB0aGUgZGl2IHRoYXQgbmVlZHMgdG9cbi8vIGJlIGF0dGFjaGVkIHRvIHRoZSBhcHAgd2luZG93J3MgYXBwIGNvbnRhaW5lci4gRm9yIGFwcHMgdGhhdCBzaG91bGQgb25seSBoYXZlIG9uZVxuLy8gaW5zdGFuY2UgcnVubmluZyAoaS5lLiB0aGUgQ2hhdCBhcHApIHRoaXMgYXBwQ29udGVudCB3aWxsIGJlIHRoZSBzYW1lIGZvciBhbGwgb3BlbiB3aW5kb3dzLlxuXG4oZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAvLyBJbml0aWFsaXplIHRoZSBkZXNrdG9wLlxuICAgIHZhciBEZXNrdG9wID0gcmVxdWlyZShcIi4vRGVza3RvcFwiKTtcbiAgICB2YXIgZGVza3RvcCA9IG5ldyBEZXNrdG9wKCk7XG5cbiAgICAvLyBJbXBvcnQgdGhlIG5lY2Vzc2FyeSBhcHBzLlxuICAgIHZhciBOb3RlYm9vayA9IHJlcXVpcmUoXCIuL05vdGVib29rXCIpO1xuICAgIHZhciBNZW1vcnkgPSByZXF1aXJlKFwiLi9NZW1vcnlcIik7XG4gICAgdmFyIENoYXQgPSByZXF1aXJlKFwiLi9DaGF0XCIpO1xuXG4gICAgLy8gQXR0YWNoIGV2ZW50IGxpc3RlbmVycyB0byB0aGUgbWVudSBpY29ucy5cbiAgICB2YXIgbmV3Tm90ZWJvb2tXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld19ub3RlYm9va1wiKTtcbiAgICB2YXIgbmV3Q2hhdFdpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmV3X2NoYXRcIik7XG4gICAgdmFyIG5ld01lbW9yeVdpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmV3X21lbW9yeVwiKTtcblxuICAgIG5ld05vdGVib29rV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgbm90ZXMgYXJlIGF2YWlsYWJsZSBpbiBsb2NhbFN0b3JhZ2UuIElmIG5vdCwgY3JlYXRlIGEgd2VsY29tZSBub3RlIGFuZCBkaXNwbGF5IGl0LlxuICAgICAgICBpZiAoIWxvY2FsU3RvcmFnZS5nZXRJdGVtKFwibm90ZXNcIikpIHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwibm90ZXNcIiwgSlNPTi5zdHJpbmdpZnkoW1xuICAgICAgICAgICAgICAgIHtuYW1lOiBcIldlbGNvbWVcIiwgY29udGVudDogXCJXZWxjb21lIHRvIHRoZSBOb3RlYm9vayBhcHAhXFxuXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiQ2xpY2sgb24gdGhlIGljb24gdG8gb3BlbiB0aGUgbWVudS5cIn1dKSk7XG5cbiAgICAgICAgICAgIGRlc2t0b3AuYXR0YWNoV2luZG93KG5ldyBOb3RlYm9vayh0cnVlKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXNrdG9wLmF0dGFjaFdpbmRvdyhuZXcgTm90ZWJvb2soKSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIG5ld0NoYXRXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBDaGVjayBpZiB0aGUgQ2hhdCBpcyBydW5uaW5nLiBJZiBub3QsIGluc3RhbnRpYXRlIGl0LlxuICAgICAgICBpZiAoIWRlc2t0b3AuaW5zdGFuY2VzLmNoYXQpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSB1c2VyIGhhcyBlbnRlcmVkIGEgdXNlcm5hbWUuIElmIG5vdCwgcHJvbXB0IHRoZW0gZm9yIG9uZS5cbiAgICAgICAgICAgIGlmICghZGVza3RvcC51c2VybmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciB1c2VyID0gcHJvbXB0KFwiUGxlYXNlIGVudGVyIGEgdXNlcm5hbWU6XCIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJ1c2VybmFtZVwiLCB1c2VyKTtcblxuICAgICAgICAgICAgICAgICAgICBkZXNrdG9wLnVzZXJuYW1lID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZXNrdG9wLmluc3RhbmNlcy5jaGF0ID0gbmV3IENoYXQoZGVza3RvcC51c2VybmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBkZXNrdG9wLmF0dGFjaFdpbmRvdyhkZXNrdG9wLmluc3RhbmNlcy5jaGF0KTtcbiAgICB9KTtcblxuICAgIG5ld01lbW9yeVdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEJ5IGRlZmF1bHQsIGFsbCBuZXcgTWVtb3J5IGdhbWVzIGFyZSA0eDQuIFRoaXMgY2FuIGxhdGVyIGJlIGNoYW5nZWQuXG4gICAgICAgIGRlc2t0b3AuYXR0YWNoV2luZG93KG5ldyBNZW1vcnkoNCwgNCkpO1xuICAgIH0pO1xufSkoKTtcbiJdfQ==
