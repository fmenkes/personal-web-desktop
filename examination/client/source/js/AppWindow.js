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
