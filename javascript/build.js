(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var newWindow = document.querySelector("#new_window");
var container = document.querySelector("#window_container");

var moving = null;

// The distance of the cursor to the edge of the element
var distance = {
    x: 0,
    y: 0
};

var mousePos = {
    x: 0,
    y: 0
};

newWindow.addEventListener("click", function () {
    var template = document.querySelector("#window-template");
    var appWindow = document.importNode(template.content, true);
    var toolbar = appWindow.querySelector(".toolbar");
    var closeWindow = appWindow.querySelector(".closeWindow");

    toolbar.addEventListener("mousedown", function(event) {
        var _ = Array.prototype.forEach;
        var windows = document.querySelectorAll(".appWindow");

        _.call(windows, function(window) {
            window.style.zIndex = "-1";
        });

        event.target.parentNode.style.zIndex = "1";

        moving = event.target.parentNode;

        distance.x = mousePos.x - event.target.parentNode.offsetLeft;
        distance.y = mousePos.y - event.target.parentNode.offsetTop;
    });

    closeWindow.addEventListener("click", function(event) {
        container.removeChild(event.target.parentNode.parentNode);
    });

    if(container.lastElementChild) {
        appWindow.querySelector(".appWindow").style.top = (container.lastElementChild.offsetTop + 10) + "px";
        appWindow.querySelector(".appWindow").style.left = (container.lastElementChild.offsetLeft + 10) + "px";
    }

    document.querySelector("#window_container").appendChild(appWindow);
});

var moveWindow = function (event) {
    mousePos.x = event.clientX - container.offsetLeft;
    mousePos.y = event.clientY - container.offsetTop;

    document.querySelector("#mousepos").textContent = "X: " + mousePos.x + ", Y: " + mousePos.y;

    if(moving) {
        event.preventDefault();
        moving.style.top =  mousePos.y - distance.y + "px";
        moving.style.left =  mousePos.x - distance.x + "px";
    }
};

document.addEventListener("mousemove", moveWindow);
document.addEventListener("mouseup", function() {
    moving = null;
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWUvdmFncmFudC8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMy4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImNsaWVudC9zb3VyY2UvanMvYXBwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgbmV3V2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuZXdfd2luZG93XCIpO1xudmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjd2luZG93X2NvbnRhaW5lclwiKTtcblxudmFyIG1vdmluZyA9IG51bGw7XG5cbi8vIFRoZSBkaXN0YW5jZSBvZiB0aGUgY3Vyc29yIHRvIHRoZSBlZGdlIG9mIHRoZSBlbGVtZW50XG52YXIgZGlzdGFuY2UgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG59O1xuXG52YXIgbW91c2VQb3MgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG59O1xuXG5uZXdXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3dpbmRvdy10ZW1wbGF0ZVwiKTtcbiAgICB2YXIgYXBwV2luZG93ID0gZG9jdW1lbnQuaW1wb3J0Tm9kZSh0ZW1wbGF0ZS5jb250ZW50LCB0cnVlKTtcbiAgICB2YXIgdG9vbGJhciA9IGFwcFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLnRvb2xiYXJcIik7XG4gICAgdmFyIGNsb3NlV2luZG93ID0gYXBwV2luZG93LnF1ZXJ5U2VsZWN0b3IoXCIuY2xvc2VXaW5kb3dcIik7XG5cbiAgICB0b29sYmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIF8gPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDtcbiAgICAgICAgdmFyIHdpbmRvd3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmFwcFdpbmRvd1wiKTtcblxuICAgICAgICBfLmNhbGwod2luZG93cywgZnVuY3Rpb24od2luZG93KSB7XG4gICAgICAgICAgICB3aW5kb3cuc3R5bGUuekluZGV4ID0gXCItMVwiO1xuICAgICAgICB9KTtcblxuICAgICAgICBldmVudC50YXJnZXQucGFyZW50Tm9kZS5zdHlsZS56SW5kZXggPSBcIjFcIjtcblxuICAgICAgICBtb3ZpbmcgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcblxuICAgICAgICBkaXN0YW5jZS54ID0gbW91c2VQb3MueCAtIGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLm9mZnNldExlZnQ7XG4gICAgICAgIGRpc3RhbmNlLnkgPSBtb3VzZVBvcy55IC0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUub2Zmc2V0VG9wO1xuICAgIH0pO1xuXG4gICAgY2xvc2VXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnRhaW5lci5yZW1vdmVDaGlsZChldmVudC50YXJnZXQucGFyZW50Tm9kZS5wYXJlbnROb2RlKTtcbiAgICB9KTtcblxuICAgIGlmKGNvbnRhaW5lci5sYXN0RWxlbWVudENoaWxkKSB7XG4gICAgICAgIGFwcFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLmFwcFdpbmRvd1wiKS5zdHlsZS50b3AgPSAoY29udGFpbmVyLmxhc3RFbGVtZW50Q2hpbGQub2Zmc2V0VG9wICsgMTApICsgXCJweFwiO1xuICAgICAgICBhcHBXaW5kb3cucXVlcnlTZWxlY3RvcihcIi5hcHBXaW5kb3dcIikuc3R5bGUubGVmdCA9IChjb250YWluZXIubGFzdEVsZW1lbnRDaGlsZC5vZmZzZXRMZWZ0ICsgMTApICsgXCJweFwiO1xuICAgIH1cblxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjd2luZG93X2NvbnRhaW5lclwiKS5hcHBlbmRDaGlsZChhcHBXaW5kb3cpO1xufSk7XG5cbnZhciBtb3ZlV2luZG93ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgbW91c2VQb3MueCA9IGV2ZW50LmNsaWVudFggLSBjb250YWluZXIub2Zmc2V0TGVmdDtcbiAgICBtb3VzZVBvcy55ID0gZXZlbnQuY2xpZW50WSAtIGNvbnRhaW5lci5vZmZzZXRUb3A7XG5cbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI21vdXNlcG9zXCIpLnRleHRDb250ZW50ID0gXCJYOiBcIiArIG1vdXNlUG9zLnggKyBcIiwgWTogXCIgKyBtb3VzZVBvcy55O1xuXG4gICAgaWYobW92aW5nKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIG1vdmluZy5zdHlsZS50b3AgPSAgbW91c2VQb3MueSAtIGRpc3RhbmNlLnkgKyBcInB4XCI7XG4gICAgICAgIG1vdmluZy5zdHlsZS5sZWZ0ID0gIG1vdXNlUG9zLnggLSBkaXN0YW5jZS54ICsgXCJweFwiO1xuICAgIH1cbn07XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgbW92ZVdpbmRvdyk7XG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBmdW5jdGlvbigpIHtcbiAgICBtb3ZpbmcgPSBudWxsO1xufSk7XG4iXX0=
