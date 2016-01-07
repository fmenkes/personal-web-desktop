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

    /*appWindow.style.width = width + "px";
    appWindow.style.height = height + "px";*/
};

/*AppWindow.prototype.resize = function(width, height) {
    this.div.style.width = width + "px";
    this.div.style.height = height + "px";
};*/

AppWindow.prototype.attachApp = function(app) {
    this.app = app;

    this.appContainer.appendChild(app.getAppContent());
};

module.exports = AppWindow;
