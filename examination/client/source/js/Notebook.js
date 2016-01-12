/**
 * Constructor for the Notebook app.
 * @param {Boolean} welcome If true, it is the first time the user opens the app, so display a welcome message.
 * @constructor
 */
function Notebook(welcome) {
    // Get the array of notes from local storage.
    this.noteArray = JSON.parse(localStorage.getItem("notes"));

    // Create a custom event that lets the app window know it should refresh itself.
    this.refresh = new Event("refresh");

    // Array of menu objects, with name and event handler.
    this.menuItems = [
        {name: "New", eventHandler: this.newNote.bind(this)},
        {name: "Save", eventHandler: this.saveNote.bind(this)},
        {name: "Load", eventHandler: this.loadScreen.bind(this)}
    ];

    // Set the image.
    this.imageSrc = "diary";

    // If it is the first time the user opens the app, display a welcome message.
    // Otherwise, display a new note.
    // this.state has three settings: new, load, or the name of the note to display.
    if (welcome) {
        this.state = "Welcome";
        this.title = "Welcome";
        this.appContent = this.createAppContentSavedNote(this.state);
    } else {
        this.state = "new";
        this.title = "Untitled";
        this.appContent = this.createAppContentNew();
    }
}

/**
 * Creates the app content for a new note.
 * @returns {Node}
 */
Notebook.prototype.createAppContentNew = function() {
    var template = document.querySelector("#notebook-template-new");
    return document.importNode(template.content, true).querySelector(".app-content");
};

/**
 * Creates the app content for a saved note
 * @param {String} noteName The name of the note to load from local storage.
 * @returns {Node}
 */
Notebook.prototype.createAppContentSavedNote = function(noteName) {
    var template = document.querySelector("#notebook-template-new");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    // Get the note from noteArray.
    var note = this.getNote(noteName);

    // If there is a note, display its content.
    if (note) {
        appContent.querySelector(".note").value = note.content;
    }

    return appContent;
};

/**
 * Creates a blank note.
 */
Notebook.prototype.newNote = function() {
    this.state = "new";
    this.title = "Untitled";

    // Let the app container know it should refresh itself.
    this.appContent.parentNode.dispatchEvent(this.refresh);
};

/**
 * Saves a note.
 */
Notebook.prototype.saveNote = function() {
    // Do nothing if we are on the load screen.
    if (this.state === "load") {
        return;
    }

    // If the note is new, ask what we should call the note.
    if (this.state === "new") {
        var name = prompt("Please enter a name: ");

        if (name === null) {
            return;
        }

        if (this.getNote(name)) {
            alert("Name already taken.");
        } else if (name === "Untitled" || name === "") {
            alert("Please give your note a name.");
        } else {
            // Push the note to the note array and to local storage.
            this.noteArray.push({name: name, content: this.appContent.querySelector(".note").value});
            localStorage.setItem("notes", JSON.stringify(this.noteArray));

            // Set the app state and title to display in the toolbar.
            this.state = name;
            this.title = name;

            // Let the app container know it should refresh itself.
            this.appContent.parentNode.dispatchEvent(this.refresh);
        }
    } else {
        // If the note is not new, save its new content.
        this.getNote(this.state).content = this.appContent.querySelector(".note").value;
        localStorage.setItem("notes", JSON.stringify(this.noteArray));
    }
};

/**
 * Display the load note screen.
 */
Notebook.prototype.loadScreen = function() {
    this.state = "load";
    this.title = "Load";

    // Let the app container know it should refresh itself.
    this.appContent.parentNode.dispatchEvent(this.refresh);
};

/**
 * Loads a note from the note array.
 * @param event
 */
Notebook.prototype.loadNote = function(event) {
    this.state = event.currentTarget.dataset.noteName;
    this.title = event.currentTarget.dataset.noteName;

    // Let the app container know it should refresh itself.
    this.appContent.parentNode.dispatchEvent(this.refresh);
};

/**
 * Deletes a note.
 * @param event
 */
Notebook.prototype.deleteNote = function(event) {
    event.stopPropagation();

    var name = event.target.dataset.noteName;
    var note = this.getNote(name);

    if (note) {
        this.noteArray.splice(this.noteArray.indexOf(note), 1);
        localStorage.setItem("notes", JSON.stringify(this.noteArray));
    }

    // Let the app container know it should refresh itself.
    this.appContent.parentNode.dispatchEvent(this.refresh);
};

/**
 * Create the app content of the load note menu.
 * @returns {Node}
 */
Notebook.prototype.createAppContentLoadMenu = function() {
    var template = document.querySelector("#notebook-template-load");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    var _this = this;

    // Create a list item for each note in the array and attach event listeners.
    this.noteArray.forEach(function(note) {
        var itemTemplate = document.querySelector("#notebook-listitem-template");
        var item = document.importNode(itemTemplate.content, true).querySelector(".notebook-listitem");

        item.setAttribute("data-note-name", note.name);

        item.querySelector(".item-name").textContent = note.name;

        item.querySelector(".delete-item").setAttribute("data-note-name", note.name);

        item.addEventListener("click", _this.loadNote.bind(_this));

        item.querySelector(".delete-item").addEventListener("click", _this.deleteNote.bind(_this));

        appContent.querySelector(".notelist").appendChild(item);
    });

    return appContent;
};

/**
 * Gets a note by its name.
 * @param {String} name The name of the note.
 * @returns {*}
 */
Notebook.prototype.getNote = function(name) {
    var resultNote = null;

    this.noteArray.forEach(function(note) {
        if (note.name === name) {
            resultNote = note;
        }
    });

    return resultNote;
};

/**
 * Create the app content depending on the state of the app.
 * @returns {Node}
 */
Notebook.prototype.getAppContent = function() {
    if (this.state === "new") {
        this.appContent = this.createAppContentNew();

        return this.appContent;
    } else if (this.state === "load") {
        this.appContent = this.createAppContentLoadMenu();

        return this.appContent;
    } else {
        this.appContent = this.createAppContentSavedNote(this.state);

        return this.appContent;
    }
};

module.exports = Notebook;
