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
        brick.setAttribute("src", "image/hidden.png");

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
    brick.setAttribute("src", "image/" + this.bricks[index] + ".png");

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
            brick.brickElem.setAttribute("src", "image/hidden.png");
            _this.selectedBrick.brickElem.setAttribute("src", "image/hidden.png");

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
