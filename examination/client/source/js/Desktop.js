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
