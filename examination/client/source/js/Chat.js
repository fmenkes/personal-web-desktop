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
