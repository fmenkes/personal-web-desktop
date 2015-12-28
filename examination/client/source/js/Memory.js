function Memory(size) {
    // TODO: where should I handle legal/illegal board sizes?

    this.size = size || [4, 4];
    this.bricks = [];
    this.boundReveal = this.revealBrick.bind(this);

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
};

Memory.prototype.attachBoard = function(container) {
    var _this = this;

    this.bricks.forEach(function() {
        var brickIMG = document.createElement("img");
        brickIMG.classList.add("memory-brick");
        brickIMG.setAttribute("src", "/image/hidden.png");
        brickIMG.addEventListener("click", _this.boundReveal);

        container.appendChild(brickIMG);
    });
};

Memory.prototype.revealBrick = function(event) {
    var _this = this;

    var brick = event.target;
    var parent = brick.parentNode;

    var indexOf = Array.prototype.indexOf;

    var index = indexOf.call(parent.children, brick);

    brick.setAttribute("src", "/image/" + this.bricks[index] + ".png");

    brick.removeEventListener("click", this.boundReveal);

    setTimeout(function() {
        _this.hideBrick(brick);
    }, 1000);
};

Memory.prototype.hideBrick = function(brick) {
    brick.setAttribute("src", "/image/hidden.png");

    brick.addEventListener("click", this.boundReveal);
};

module.exports = Memory;
