(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function Chat() {
    var _this = this;

    this.lastLines = [];
    this.chatContent = document.createElement("div");
    this.chatContent.classList.add("chat-content");
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

Chat.prototype.appendLine = function(username, line) {
    this.lastLines.push(username + ": " + line);
    if (this.lastLines.length > 20) {
        this.lastLines.shift();
    }

    this.convertLinesToHTML();
};

Chat.prototype.convertLinesToHTML = function() {
    var _this = this;

    while (this.chatContent.hasChildNodes()) {
        this.chatContent.removeChild(this.chatContent.firstElementChild);
    }

    this.lastLines.forEach(function(line) {
        var newLine = document.createElement("span");
        newLine.textContent = line;

        _this.chatContent.appendChild(newLine);
        _this.chatContent.appendChild(document.createElement("br"));
    });

    this.publishMessages();
};

Chat.prototype.publishMessages = function() {
    var _this = this;
    var forEach = Array.prototype.forEach;

    forEach.call(document.querySelectorAll(".chat-window"), function(chatWin) {
        var newChat = _this.chatContent.cloneNode(true);

        chatWin.removeChild(chatWin.querySelector(".chat-content"));

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
};

module.exports = Chat;

},{}],2:[function(require,module,exports){
var newWindow = document.querySelector("#new_window");
var newChatWindow = document.querySelector("#new_chat");
var container = document.querySelector("#window_container");

var Chat = require("./Chat");

var moving = null;

var chat = null;

// The distance of the cursor to the edge of the element
var distance = {
    x: 0,
    y: 0
};

var mousePos = {
    x: 0,
    y: 0
};

newWindow.addEventListener("click", function() {
    var appWindow = createAppWindow();

    document.querySelector("#window_container").appendChild(appWindow);
});

newChatWindow.addEventListener("click", function() {
    if (!chat) {
        chat = new Chat();
    }

    var chatContent = chat.chatContent.cloneNode(true);
    var appWindow = createAppWindow("Webchat");
    var template = document.querySelector("#web-chat");
    var chatWindow = document.importNode(template.content, true).querySelector(".chat-window");
    var chatForm = chatWindow.querySelector(".chat-form");
    chatWindow.insertBefore(chatContent, chatForm);

    chatForm.addEventListener("submit", function(event) {
        event.preventDefault();

        chat.sendMessage(event.target.elements[0].value);

        event.target.elements[0].value = "";
    });

    appWindow.querySelector(".app-container").appendChild(chatWindow);

    container.appendChild(appWindow);
});

var createAppWindow = function(name) {
    name = name || "Blank window";
    var template = document.querySelector("#window-template");
    var appWindow = document.importNode(template.content, true).querySelector(".appWindow");
    var toolbar = appWindow.querySelector(".toolbar");
    var appName = document.createTextNode(name);

    var closeWindow = appWindow.querySelector(".closeWindow");

    toolbar.insertBefore(appName, closeWindow);

    toolbar.addEventListener("mousedown", function(event) {
        var forEach = Array.prototype.forEach;
        var windows = document.querySelectorAll(".appWindow");

        forEach.call(windows, function(item) {
            item.style.zIndex = "-1";
        });

        event.target.parentNode.style.zIndex = "1";

        moving = event.target.parentNode;

        distance.x = mousePos.x - event.target.parentNode.offsetLeft;
        distance.y = mousePos.y - event.target.parentNode.offsetTop;
    });

    closeWindow.addEventListener("click", function(event) {
        container.removeChild(event.target.parentNode.parentNode);
    });

    if (container.lastElementChild) {
        appWindow.style.top = (container.lastElementChild.offsetTop + 10) + "px";
        appWindow.style.left = (container.lastElementChild.offsetLeft + 10) + "px";
    }

    return appWindow;
};

var moveWindow = function(event) {
    mousePos.x = event.clientX - container.offsetLeft;
    mousePos.y = event.clientY - container.offsetTop;

    if (moving) {
        event.preventDefault();

        moving.style.top =  mousePos.y - distance.y + "px";
        moving.style.left =  mousePos.x - distance.x + "px";

        if (moving.offsetTop < 0) {
            moving.style.top = 0;
        }
    }
};

document.addEventListener("mousemove", moveWindow);
document.addEventListener("mouseup", function() {
    moving = null;
});

},{"./Chat":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvQ2hhdC5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImZ1bmN0aW9uIENoYXQoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMubGFzdExpbmVzID0gW107XG4gICAgdGhpcy5jaGF0Q29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5jaGF0Q29udGVudC5jbGFzc0xpc3QuYWRkKFwiY2hhdC1jb250ZW50XCIpO1xuICAgIHRoaXMudXNlcm5hbWUgPSBcImZwXCI7XG4gICAgdGhpcy5hcGlLZXkgPSBcImVEQkU3NmRlVTdMMEg5bUVCZ3hVS1ZSMFZDbnEwWEJkXCI7XG4gICAgdGhpcy5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KFwid3M6Ly92aG9zdDMubG51LnNlOjIwMDgwL3NvY2tldC9cIik7XG5cbiAgICAvLyBUT0RPOiBNYWtlIHN1cmUgdGhlIHNvY2tldCBvcGVucyBiZWZvcmUgdGhlIHVzZXIgY2FuIHNlbmQgbWVzc2FnZXNcblxuICAgIHRoaXMuc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGV2ZW50LmRhdGEpO1xuXG4gICAgICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcblxuICAgICAgICBpZiAobWVzc2FnZS50eXBlICE9IFwiaGVhcnRiZWF0XCIpIHtcbiAgICAgICAgICAgIF90aGlzLmFwcGVuZExpbmUobWVzc2FnZS51c2VybmFtZSwgbWVzc2FnZS5kYXRhKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5DaGF0LnByb3RvdHlwZS5hcHBlbmRMaW5lID0gZnVuY3Rpb24odXNlcm5hbWUsIGxpbmUpIHtcbiAgICB0aGlzLmxhc3RMaW5lcy5wdXNoKHVzZXJuYW1lICsgXCI6IFwiICsgbGluZSk7XG4gICAgaWYgKHRoaXMubGFzdExpbmVzLmxlbmd0aCA+IDIwKSB7XG4gICAgICAgIHRoaXMubGFzdExpbmVzLnNoaWZ0KCk7XG4gICAgfVxuXG4gICAgdGhpcy5jb252ZXJ0TGluZXNUb0hUTUwoKTtcbn07XG5cbkNoYXQucHJvdG90eXBlLmNvbnZlcnRMaW5lc1RvSFRNTCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB3aGlsZSAodGhpcy5jaGF0Q29udGVudC5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgdGhpcy5jaGF0Q29udGVudC5yZW1vdmVDaGlsZCh0aGlzLmNoYXRDb250ZW50LmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLmxhc3RMaW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgdmFyIG5ld0xpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgbmV3TGluZS50ZXh0Q29udGVudCA9IGxpbmU7XG5cbiAgICAgICAgX3RoaXMuY2hhdENvbnRlbnQuYXBwZW5kQ2hpbGQobmV3TGluZSk7XG4gICAgICAgIF90aGlzLmNoYXRDb250ZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJiclwiKSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnB1Ymxpc2hNZXNzYWdlcygpO1xufTtcblxuQ2hhdC5wcm90b3R5cGUucHVibGlzaE1lc3NhZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoO1xuXG4gICAgZm9yRWFjaC5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuY2hhdC13aW5kb3dcIiksIGZ1bmN0aW9uKGNoYXRXaW4pIHtcbiAgICAgICAgdmFyIG5ld0NoYXQgPSBfdGhpcy5jaGF0Q29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG5cbiAgICAgICAgY2hhdFdpbi5yZW1vdmVDaGlsZChjaGF0V2luLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1jb250ZW50XCIpKTtcblxuICAgICAgICBjaGF0V2luLmluc2VydEJlZm9yZShuZXdDaGF0LCBjaGF0V2luLnF1ZXJ5U2VsZWN0b3IoXCIuY2hhdC1mb3JtXCIpKTtcbiAgICB9KTtcbn07XG5cbkNoYXQucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIHZhciBkYXRhID0ge307XG5cbiAgICBkYXRhLnVzZXJuYW1lID0gdGhpcy51c2VybmFtZTtcbiAgICBkYXRhLmRhdGEgPSBtZXNzYWdlO1xuICAgIGRhdGEua2V5ID0gdGhpcy5hcGlLZXk7XG4gICAgZGF0YS50eXBlID0gXCJtZXNzYWdlXCI7XG5cbiAgICB0aGlzLnNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhdDtcbiIsInZhciBuZXdXaW5kb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25ld193aW5kb3dcIik7XG52YXIgbmV3Q2hhdFdpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmV3X2NoYXRcIik7XG52YXIgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN3aW5kb3dfY29udGFpbmVyXCIpO1xuXG52YXIgQ2hhdCA9IHJlcXVpcmUoXCIuL0NoYXRcIik7XG5cbnZhciBtb3ZpbmcgPSBudWxsO1xuXG52YXIgY2hhdCA9IG51bGw7XG5cbi8vIFRoZSBkaXN0YW5jZSBvZiB0aGUgY3Vyc29yIHRvIHRoZSBlZGdlIG9mIHRoZSBlbGVtZW50XG52YXIgZGlzdGFuY2UgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG59O1xuXG52YXIgbW91c2VQb3MgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG59O1xuXG5uZXdXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcHBXaW5kb3cgPSBjcmVhdGVBcHBXaW5kb3coKTtcblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjd2luZG93X2NvbnRhaW5lclwiKS5hcHBlbmRDaGlsZChhcHBXaW5kb3cpO1xufSk7XG5cbm5ld0NoYXRXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmICghY2hhdCkge1xuICAgICAgICBjaGF0ID0gbmV3IENoYXQoKTtcbiAgICB9XG5cbiAgICB2YXIgY2hhdENvbnRlbnQgPSBjaGF0LmNoYXRDb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICB2YXIgYXBwV2luZG93ID0gY3JlYXRlQXBwV2luZG93KFwiV2ViY2hhdFwiKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3dlYi1jaGF0XCIpO1xuICAgIHZhciBjaGF0V2luZG93ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKS5xdWVyeVNlbGVjdG9yKFwiLmNoYXQtd2luZG93XCIpO1xuICAgIHZhciBjaGF0Rm9ybSA9IGNoYXRXaW5kb3cucXVlcnlTZWxlY3RvcihcIi5jaGF0LWZvcm1cIik7XG4gICAgY2hhdFdpbmRvdy5pbnNlcnRCZWZvcmUoY2hhdENvbnRlbnQsIGNoYXRGb3JtKTtcblxuICAgIGNoYXRGb3JtLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBjaGF0LnNlbmRNZXNzYWdlKGV2ZW50LnRhcmdldC5lbGVtZW50c1swXS52YWx1ZSk7XG5cbiAgICAgICAgZXZlbnQudGFyZ2V0LmVsZW1lbnRzWzBdLnZhbHVlID0gXCJcIjtcbiAgICB9KTtcblxuICAgIGFwcFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLmFwcC1jb250YWluZXJcIikuYXBwZW5kQ2hpbGQoY2hhdFdpbmRvdyk7XG5cbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYXBwV2luZG93KTtcbn0pO1xuXG52YXIgY3JlYXRlQXBwV2luZG93ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIG5hbWUgPSBuYW1lIHx8IFwiQmxhbmsgd2luZG93XCI7XG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN3aW5kb3ctdGVtcGxhdGVcIik7XG4gICAgdmFyIGFwcFdpbmRvdyA9IGRvY3VtZW50LmltcG9ydE5vZGUodGVtcGxhdGUuY29udGVudCwgdHJ1ZSkucXVlcnlTZWxlY3RvcihcIi5hcHBXaW5kb3dcIik7XG4gICAgdmFyIHRvb2xiYXIgPSBhcHBXaW5kb3cucXVlcnlTZWxlY3RvcihcIi50b29sYmFyXCIpO1xuICAgIHZhciBhcHBOYW1lID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobmFtZSk7XG5cbiAgICB2YXIgY2xvc2VXaW5kb3cgPSBhcHBXaW5kb3cucXVlcnlTZWxlY3RvcihcIi5jbG9zZVdpbmRvd1wiKTtcblxuICAgIHRvb2xiYXIuaW5zZXJ0QmVmb3JlKGFwcE5hbWUsIGNsb3NlV2luZG93KTtcblxuICAgIHRvb2xiYXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoO1xuICAgICAgICB2YXIgd2luZG93cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuYXBwV2luZG93XCIpO1xuXG4gICAgICAgIGZvckVhY2guY2FsbCh3aW5kb3dzLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBpdGVtLnN0eWxlLnpJbmRleCA9IFwiLTFcIjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUuc3R5bGUuekluZGV4ID0gXCIxXCI7XG5cbiAgICAgICAgbW92aW5nID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGU7XG5cbiAgICAgICAgZGlzdGFuY2UueCA9IG1vdXNlUG9zLnggLSBldmVudC50YXJnZXQucGFyZW50Tm9kZS5vZmZzZXRMZWZ0O1xuICAgICAgICBkaXN0YW5jZS55ID0gbW91c2VQb3MueSAtIGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLm9mZnNldFRvcDtcbiAgICB9KTtcblxuICAgIGNsb3NlV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBjb250YWluZXIucmVtb3ZlQ2hpbGQoZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUucGFyZW50Tm9kZSk7XG4gICAgfSk7XG5cbiAgICBpZiAoY29udGFpbmVyLmxhc3RFbGVtZW50Q2hpbGQpIHtcbiAgICAgICAgYXBwV2luZG93LnN0eWxlLnRvcCA9IChjb250YWluZXIubGFzdEVsZW1lbnRDaGlsZC5vZmZzZXRUb3AgKyAxMCkgKyBcInB4XCI7XG4gICAgICAgIGFwcFdpbmRvdy5zdHlsZS5sZWZ0ID0gKGNvbnRhaW5lci5sYXN0RWxlbWVudENoaWxkLm9mZnNldExlZnQgKyAxMCkgKyBcInB4XCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFwcFdpbmRvdztcbn07XG5cbnZhciBtb3ZlV2luZG93ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBtb3VzZVBvcy54ID0gZXZlbnQuY2xpZW50WCAtIGNvbnRhaW5lci5vZmZzZXRMZWZ0O1xuICAgIG1vdXNlUG9zLnkgPSBldmVudC5jbGllbnRZIC0gY29udGFpbmVyLm9mZnNldFRvcDtcblxuICAgIGlmIChtb3ZpbmcpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBtb3Zpbmcuc3R5bGUudG9wID0gIG1vdXNlUG9zLnkgLSBkaXN0YW5jZS55ICsgXCJweFwiO1xuICAgICAgICBtb3Zpbmcuc3R5bGUubGVmdCA9ICBtb3VzZVBvcy54IC0gZGlzdGFuY2UueCArIFwicHhcIjtcblxuICAgICAgICBpZiAobW92aW5nLm9mZnNldFRvcCA8IDApIHtcbiAgICAgICAgICAgIG1vdmluZy5zdHlsZS50b3AgPSAwO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBtb3ZlV2luZG93KTtcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIGZ1bmN0aW9uKCkge1xuICAgIG1vdmluZyA9IG51bGw7XG59KTtcbiJdfQ==
