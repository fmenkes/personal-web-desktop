// App.js controls the UI and is responsible for creating new app instances. Adding new apps
// to the Personal Web Desktop should be as easy as importing it in app.js and creating it.

// The apps follow the same structure:
// They all contain a function called getAppContent, which returns the div that needs to
// be attached to the app window's app container. For apps that should only have one
// instance running (i.e. the Chat app) this appContent will be the same for all open windows.

(function init() {
    // Initialize the desktop.
    var Desktop = require("./Desktop");
    var desktop = new Desktop();

    // Import the necessary apps.
    var Notebook = require("./Notebook");
    var Memory = require("./Memory");
    var Chat = require("./Chat");

    // Attach event listeners to the menu icons.
    var newNotebookWindow = document.querySelector("#new_notebook");
    var newChatWindow = document.querySelector("#new_chat");
    var newMemoryWindow = document.querySelector("#new_memory");

    newNotebookWindow.addEventListener("click", function() {
        // Check if notes are available in localStorage. If not, create a welcome note and display it.
        if (!localStorage.getItem("notes")) {
            localStorage.setItem("notes", JSON.stringify([
                {name: "Welcome", content: "Welcome to the Notebook app!\n" +
                                           "Click on the icon to open the menu."}]));

            desktop.attachWindow(new Notebook(true));
        } else {
            desktop.attachWindow(new Notebook());
        }
    });

    newChatWindow.addEventListener("click", function() {
        // Check if the Chat is running. If not, instantiate it.
        if (!desktop.instances.chat) {
            // Check if the user has entered a username. If not, prompt them for one.
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
        // By default, all new Memory games are 4x4. This can later be changed.
        desktop.attachWindow(new Memory(4, 4));
    });
})();
