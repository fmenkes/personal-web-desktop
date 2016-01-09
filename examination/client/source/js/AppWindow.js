function AppWindow(width, height) {
    this.app = null;

    this.div = this.createWindow(width, height);

    this.toolbar = this.div.querySelector(".toolbar");
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

    this.appContainer.appendChild(app.getAppContent());
};

module.exports = AppWindow;
