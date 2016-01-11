/**
 *
 * @constructor
 */

function Chat(username) {
    var _this = this;

    this.lastLines = [];

    this.imageSrc = "chat";
    this.title = "Webchat";

    this.defaultTitle = document.title;
    this.username = username;

    this.appContent = this.createAppContent();
    this.chatLines = this.appContent.querySelector(".chat-lines");
    this.apiKey = "eDBE76deU7L0H9mEBgxUKVR0VCnq0XBd";
    this.socket = new WebSocket("ws://vhost3.lnu.se:20080/socket/");

    document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this));

    // TODO: Make sure the socket opens before the user can send messages

    this.socket.addEventListener("message", function(event) {
        console.log(event.data);

        var message = JSON.parse(event.data);

        if (message.type != "heartbeat") {
            _this.appendLine(message.username, message.data);
        }
    });
}

Chat.prototype.createAppContent = function() {
    // TODO: better way of doing this than templates?
    var template = document.querySelector("#chat-template");

    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    this.attachEventListeners(appContent);

    return appContent;
};

Chat.prototype.attachEventListeners = function(appContent) {
    var chatForm = appContent.querySelector(".chat-form");
    var textArea = chatForm.querySelector("textarea");

    textArea.addEventListener("keydown", this.handleTextInput.bind(this));
    //textArea.addEventListener("focus", this.handleFocus.bind(this));
};

Chat.prototype.handleTextInput = function(event) {
    if (!event.shiftKey && event.keyCode === 13) {
        event.preventDefault();

        if (event.target.value.charAt(0) === "/") {
            this.handleCommand(event.target.value.slice(1));
        } else if (event.target.value !== "") {
            this.sendMessage(event.target.value);
        }

        event.target.value = "";
    }
};

Chat.prototype.handleCommand = function(command) {
    var commandKeyword = command.split(" ")[0];
    var commandParameters = null;

    if (command.split(" ").length > 1) {
        commandParameters = command.substr(command.indexOf(" ") + 1, command.length);
    }

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

Chat.prototype.handleVisibilityChange = function() {
    if (!document.hidden) {
        document.title = this.defaultTitle;
    }
};

Chat.prototype.appendLine = function(username, line) {
    this.lastLines.push({username: username, line: line});

    if (this.lastLines.length > 20) {
        this.lastLines.shift();
    }

    if (document.hidden) {
        var audio = this.appContent.querySelector("audio");

        audio.play();

        document.title = "* " + this.defaultTitle;
    }

    this.convertLinesToHTML();
};

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

    this.publishMessages();
};

Chat.prototype.publishMessages = function() {
    var _this = this;
    var forEach = Array.prototype.forEach;

    forEach.call(document.querySelectorAll(".chat"), function(chatWin) {
        var newChat = _this.chatLines.cloneNode(true);

        chatWin.removeChild(chatWin.querySelector(".chat-lines"));

        chatWin.insertBefore(newChat, chatWin.querySelector(".chat-form"));
    });
};

Chat.prototype.sendMessage = function(message) {
    var data = {};

    data.username = this.username;
    data.data = message;
    data.key = this.apiKey;
    data.type = "message";

    this.socket.send(JSON.stringify(data));

    // offline capabilities TODO: use this as a fallback?
    //this.appendLine(this.username, message);
};

Chat.prototype.getAppContent = function() {
    // Cloning does not attach event listeners, so we have to do it afterwards

    var content = this.appContent.cloneNode(true);

    this.attachEventListeners(content);

    return content;
};

module.exports = Chat;
