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
