import {hideError, hideWarning, showError, showWarning, translationToString} from "./main.js";
import {loadCsv} from "./dataLoader.js";

setupUploadForm();

/**
 * Apply desired style to input container
 * @param button
 */
function styleButton(button) {
  if (button.value) {
    button.parentNode.classList.add("file-selected");
    // check the file names
    checkFileName(button);
    // hide error about empty button value
    if (button.id === "people-file")
      hideError("people-file");
    else
      hideError("family-file");
  } else
    button.parentNode.classList.remove("file-selected");
}

/**
 * Styles the form and overrides the submit function
 */
function setupUploadForm() {
  let form = document.getElementById("upload-form");

  // support drag and drop
  document.querySelectorAll(".file-upload").forEach(container => {
    function allowDrop(e) {
      e.preventDefault();
      if (e.dataTransfer.items[0].type === "text/csv") {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.dropEffect = "copy";
        container.classList.add("file-dropping")
        return false;
      }

      // block any other drop
      e.dataTransfer.effectAllowed = "none";
      e.dataTransfer.dropEffect = "none";
    }

    let input = container.querySelector("input");
    container.ondragenter = allowDrop;
    container.ondragover = allowDrop;
    container.ondrop = e => {
      e.preventDefault();
      input.files = e.dataTransfer.files;
      styleButton(input);
      container.classList.remove("file-dropping");
    }
    container.ondragleave = () => container.classList.remove("file-dropping");
    container.ondragend = () => container.classList.remove("file-dropping");
  });

  // make buttons with selected file green
  let inputButtons = form.querySelectorAll("input[type=file]");
  inputButtons.forEach(b => {
    styleButton(b);
    b.onchange = () => styleButton(b);
  });

  form.onsubmit = (event) => {
    event.preventDefault();

    // load data from the files
    // these are blobs
    let peopleFile = document.getElementById("people-file").files[0];
    let familyFile = document.getElementById("family-file").files[0];

    if (!peopleFile) {
      showError({
        en: "No people-file selected!",
        de: "Es wurde keine Personendatei ausgewählt!"
      }, "people-file");
    }
    if (!familyFile) {
      showError({
        en: "No family-file selected!",
        de: "Es wurde keine Familiendatei ausgewählt!"
      }, "family-file");
    }

    if (!(peopleFile && familyFile))
      return;

    // these are raw strings of the csv files
    let peopleTable, familiesTable;

    // store the loaded graph data and redirects to the tree-viewer
    function showGraph(data) {
      localStorage.setItem("familyData", JSON.stringify(data));
      // redirect to the tree-viewer
      window.location.href = window.location.origin +
        window.location.pathname.replace("index.html", "") + "family-tree.html" +
        window.location.search;
    }

    function loadGraph() {
      if (peopleTable && familiesTable)
        loadCsv(peopleTable, familiesTable)
          .then(showGraph)
          .catch(() =>
            showError({
              en: "The calculated graph is empty!" +
                "Please check if your files are empty. If not, please contact the administrator!",
              de: "Der berechnete Graph ist leer!" +
                " Prüfe bitte, ob die Dateien leer sind. Sollte dies nicht der Fall sein, kontaktiere bitte den Administrator!"
            }, "graph"));
    }

    let readerFamily = new FileReader();
    readerFamily.onload = (file) => {
      familiesTable = file.target.result;
      loadGraph();
    }
    readerFamily.onerror = (event) => {
      showError({
        en: "The family file could not be loaded!",
        de: "Die Familiendatei konnte nicht gelesen werden!"
      }, "family-file")
      console.error(event.target.error);
    };
    readerFamily.readAsText(familyFile);

    let readerPeople = new FileReader();
    readerPeople.onload = (file) => {
      peopleTable = file.target.result;
      loadGraph();
    }
    readerPeople.onerror = (event) => {
      showError({
        en: "The people file could not be read!",
        de: "Die Personendatei konnte nicht gelesen werden!"
      }, "people-file")
      console.error(event.target.error);
    };
    readerPeople.readAsText(peopleFile);
  };
}

/**
 * Shows a warning if the selected file of the input might be wrong.
 * @param button {HTMLInputElement}
 */
function checkFileName(button) {
  let id = button.id;
  let personFile = translationToString({en: "people", de: "person"});
  let personSelected = button.value.toLowerCase().includes(personFile);
  let familyFile = translationToString({en: "family", de: "familie"});
  let familySelected = button.value.toLowerCase().includes(familyFile);

  if (id === "family-file" && personSelected)
    showWarning({
        en: "Looks like you selected the wrong file!",
        de: "Sieht aus als wäre die falsche Datei im Familien-Knopf gelandet!"
      },
      button.id);
  else if (id === "people-file" && familySelected)
    showWarning({
        en: "Looks like you selected the wrong file!",
        de: "Sieht aus als wäre die falsche Datei im Personen-Knopf gelandet!"
      },
      button.id);
  else
    hideWarning(button.id);
}
