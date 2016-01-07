/**
 *
 * @constructor
 */

function Chat() {
    var _this = this;

    this.lastLines = [];
    this.appContent = this.createAppContent();
    this.chatLines = this.appContent.querySelector(".chat-lines");
    this.username = "fp";
    this.apiKey = "eDBE76deU7L0H9mEBgxUKVR0VCnq0XBd";
    this.socket = new WebSocket("ws://vhost3.lnu.se:20080/socket/");

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

    chatForm.addEventListener("submit", this.submitChatForm.bind(this));
};

Chat.prototype.submitChatForm = function(event) {
    event.preventDefault();

    this.sendMessage(event.target.elements[0].value);

    event.target.elements[0].value = "";
};

Chat.prototype.appendLine = function(username, line) {
    this.lastLines.push(username + ": " + line);
    if (this.lastLines.length > 20) {
        this.lastLines.shift();
    }

    this.convertLinesToHTML();
};

Chat.prototype.convertLinesToHTML = function() {
    var _this = this;

    while (this.chatLines.hasChildNodes()) {
        this.chatLines.removeChild(this.chatLines.firstElementChild);
    }

    this.lastLines.forEach(function(line) {
        var newLine = document.createElement("span");
        newLine.textContent = line;

        _this.chatLines.appendChild(newLine);
        _this.chatLines.appendChild(document.createElement("br"));
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
    this.appendLine(this.username, message);
};

Chat.prototype.getAppContent = function() {
    // Cloning does not attach event listeners, so we have to do it afterwards

    var content = this.appContent.cloneNode(true);

    this.attachEventListeners(content);

    return content;
};

module.exports = Chat;
