// App controls the UI and is responsible for creating new app instances. Adding new apps
// to the Personal Web Desktop should be as easy as importing it in app.js and creating it.

// The apps follow the same structure:
// They all contain a function called getAppContent, which returns the div that needs to
// be attached to the app window's app container. For apps

(function init() {
    // Initialize the desktop.
    var Desktop = require("./Desktop");
    var desktop = new Desktop();

    // Import the necessary apps.
    var Notebook = require("./Notebook");
    var Memory = require("./Memory");
    var Chat = require("./Chat");

    var newNotebookWindow = document.querySelector("#new_notebook");
    var newChatWindow = document.querySelector("#new_chat");
    var newMemoryWindow = document.querySelector("#new_memory");

    newNotebookWindow.addEventListener("click", function() {
        if (!localStorage.getItem("notes")) {
            localStorage.setItem("notes", JSON.stringify([{name: "Welcome", content: "Welcome to the Notebook app!"}]));
        }

        desktop.attachWindow(new Notebook());
    });

    newChatWindow.addEventListener("click", function() {
        if (!desktop.instances.chat) {
            if (!desktop.username) {
                var user = prompt("Please enter a username:");

                if (user) {
                    localStorage.setItem("username", user);

                    desktop.username = user;
                } else {
                    return;
                }
            }

            desktop.instances.chat = new Chat(desktop.username);
        }

        desktop.attachWindow(desktop.instances.chat);
    });

    newMemoryWindow.addEventListener("click", function() {
        desktop.attachWindow(new Memory(4, 4));
    });
})();
