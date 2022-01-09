import {translationToString, showWarning, hideWarning, showError} from "./main.js";
import {loadCsv} from "./dataLoader.js";

setupUploadForm();

/**
 * Styles the form and overrides the submit function
 */
function setupUploadForm() {
  let form = document.getElementById("upload-form");

  // make buttons with selected file green
  let inputButtons = form.querySelectorAll("input[type=file]");
  inputButtons.forEach(b => {
    function styleButton(button) {
      if (button.value) {
        button.parentNode.classList.add("file-selected");
        checkFileName(button);
      }
      else
        button.parentNode.classList.remove("file-selected");
    }
    styleButton(b);
    b.onchange = () => styleButton(b);
  });

  form.onsubmit = (event) => {
    event.preventDefault();

    // load data from the files
    // these are blobs
    let peopleFile = document.getElementById("people-file").files[0];
    let familyFile = document.getElementById("family-file").files[0];

    if (!(peopleFile && familyFile)) {
      showError({
        en: "No files selected!",
        de: "Es wurden keine Dateien ausgewählt!"
      }, "file");
      return;
    }

    // these are raw strings of the csv files
    let peopleTable, familiesTable;

    // store the loaded graph data and redirects to the tree-viewer
    function showGraph(graph) {
      localStorage.setItem("graph", JSON.stringify(graph));
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
    readerFamily.readAsText(familyFile);

    let readerPeople = new FileReader();
    readerPeople.onload = (file) => {
      peopleTable = file.target.result;
      loadGraph();
    }
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
        de: "Sieht aus als wäre die falsche Datei im Familien-Knopf gelandet!"},
      button.id);
  else if (id === "people-file" && familySelected)
    showWarning({
        en: "Looks like you selected the wrong file!",
        de: "Sieht aus als wäre die falsche Datei im Personen-Knopf gelandet!"},
      button.id);
  else
    hideWarning(button.id);
}
