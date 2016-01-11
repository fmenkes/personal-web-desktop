function Notebook() {
    this.noteArray = [{name: "test", content:"This is a test note"}];

    this.event = new Event("refresh");

    this.menuItems = [
        {name: "New", eventHandler: this.newNote.bind(this)},
        {name: "Save", eventHandler: this.saveNote.bind(this)},
        {name: "Load", eventHandler: this.loadScreen.bind(this)}
    ];

    this.imageSrc = "diary";

    this.state = "new";

    this.appContent = this.createAppContentNew();
}

Notebook.prototype.createAppContentNew = function() {
    var template = document.querySelector("#notebook-template-new");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    return appContent;
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

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.saveNote = function() {
    console.log("save");

    if (this.state === "new") {
        var name = prompt("Please enter a name: ", "Untitled");

        if (!name) {
            return;
        }

        if (this.getNote(name)) {
            alert("Name already taken.");
        } else {
            this.noteArray.push({name: name, content: this.appContent.querySelector(".note").value});

            this.state = name;
        }
    } else {
        this.getNote(this.state).content = this.appContent.querySelector(".note").value;
    }
};

Notebook.prototype.loadScreen = function() {
    console.log("load");

    this.state = "load";

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.loadNote = function(event) {
    this.state = event.target.textContent + "";

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.deleteNote = function(event) {
    var name = event.target.textContent + "";

    this.noteArray = this.noteArray.slice(this.noteArray.indexOf(this.getNote(name)), 1);

    this.appContent.parentNode.dispatchEvent(this.event);
};

Notebook.prototype.createAppContentLoadMenu = function() {
    var template = document.querySelector("#notebook-template-load");
    var appContent = document.importNode(template.content, true).querySelector(".app-content");

    var _this = this;

    this.noteArray.forEach(function(note) {
        var itemTemplate = document.querySelector("#notebook-listitem-template");
        var item = document.importNode(itemTemplate.content, true).querySelector(".notebook-listitem");

        item.querySelector(".item-name").textContent = note.name;

        item.querySelector(".item-name").addEventListener("click", _this.loadNote.bind(_this));

        item.querySelector(".delete-item").addEventListener("click", _this.deleteNote.bind(_this));

        appContent.appendChild(item);
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
