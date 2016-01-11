function Notebook() {
    //this.noteArray = [{name: "test", content:"This is a test note"}];

    this.noteArray = JSON.parse(localStorage.getItem("notes"));

    this.event = new Event("refresh");

    this.menuItems = [
        {name: "New", eventHandler: this.newNote.bind(this)},
        {name: "Save", eventHandler: this.saveNote.bind(this)},
        {name: "Load", eventHandler: this.loadScreen.bind(this)}
    ];

    this.imageSrc = "diary";
    this.title = "Untitled";

    this.state = "new";

    this.appContent = this.createAppContentNew();
}

Notebook.prototype.createAppContentNew = function() {
    var template = document.querySelector("#notebook-template-new");
    return document.importNode(template.content, true).querySelector(".app-content");
};

Notebook.prototype.createAppContentSavedNote = function(noteName) {
    var template = document.querySelector("#notebook-template-new");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    var note = this.getNote(noteName);

    if (note) {
        appContent.querySelector(".note").value = note.content;
    }

    return appContent;
};

Notebook.prototype.newNote = function() {
    console.log("new");

    this.state = "new";
    this.title = "Untitled";

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.saveNote = function() {
    console.log("save");

    if (this.state === "load") {
        return;
    }

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
            this.noteArray.push({name: name, content: this.appContent.querySelector(".note").value});

            localStorage.setItem("notes", JSON.stringify(this.noteArray));

            this.state = name;
            this.title = name;

            this.appContent.parentNode.dispatchEvent(this.event);
        }
    } else {
        this.getNote(this.state).content = this.appContent.querySelector(".note").value;
    }
};

Notebook.prototype.loadScreen = function() {
    console.log("load");

    this.state = "load";
    this.title = "Load";

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.loadNote = function(event) {
    this.state = event.currentTarget.dataset.noteName;
    this.title = event.currentTarget.dataset.noteName;

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.deleteNote = function(event) {
    event.stopPropagation();

    var name = event.target.dataset.noteName;
    var note = this.getNote(name);

    if (note) {
        this.noteArray.splice(this.noteArray.indexOf(note), 1);
        localStorage.setItem("notes", JSON.stringify(this.noteArray));
    }

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.createAppContentLoadMenu = function() {
    var template = document.querySelector("#notebook-template-load");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    var _this = this;

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

Notebook.prototype.getNote = function(name) {
    var resultNote = null;

    this.noteArray.forEach(function(note) {
        if (note.name === name) {
            resultNote = note;
        }
    });

    return resultNote;
};

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
