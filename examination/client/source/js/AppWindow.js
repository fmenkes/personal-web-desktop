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
