import * as d3 from "https://cdn.skypack.dev/d3@4";
import {translationToString, showWarning, hideWarning, showError} from "./main.js";
import {loadCsv} from "./dataLoader.js";


setupUploadForm();

/**
 * Styles the form and overrides the submit function
 */
function setupUploadForm() {
  let form = d3.select("#upload-form");

  // make buttons with selected file green
  let inputBtns = form.selectAll("input[type=file]");
  inputBtns.data(inputBtns.nodes());
  inputBtns.each(d => {
    if (d.value) {
      d.parentNode.classList.add("file-selected");
      checkFileName(d);
    }
    else
      d.parentNode.classList.remove("file-selected");
  });
  inputBtns.on("change", d => {
    if (d.value) {
      d.parentNode.classList.add("file-selected");
      checkFileName(d);
    }
    else
      d.parentNode.classList.remove("file-selected");
  });

  form.on("submit", () => {
    d3.event.preventDefault();

    // load data from the files
    // these are blobs
    let peopleFile = d3.select("#people-file").node().files[0];
    let familyFile = d3.select("#family-file").node().files[0];
    // these are raw strings of the csv files
    let peopleTable, familiesTable;

    // store the loaded graph data and redirects to the tree-viewer
    function showGraph(graph) {
      if (!graph) {
        showError({
          en: "The calculated graph is empty!" +
            "Please check if your files are empty. If not, please contact the administrator!",
          de: "Der berechnete Graph ist leer!" +
            " Prüfe bitte, ob die Dateien leer sind. Sollte dies nicht der Fall sein, kontaktiere bitte den Administrator!"
        }, "graph")
        return;
      }

      localStorage.setItem("graph", JSON.stringify(graph));
      // redirect to the tree-viewer
      window.location.href = window.location.origin +
        window.location.pathname.replace("index.html", "") + "family-tree.html" +
        window.location.search;
    }

    let readerFamily = new FileReader();
    readerFamily.onload = (file) => {
      familiesTable = file.target.result;

      if (peopleTable && familiesTable)
        loadCsv(peopleTable, familiesTable, showGraph);
    }
    readerFamily.readAsText(familyFile);
    let readerPeople = new FileReader();
    readerPeople.onload = (file) => {
      peopleTable = file.target.result;

      if (peopleTable && familiesTable)
        loadCsv(peopleTable, familiesTable, showGraph);
    }
    readerPeople.readAsText(peopleFile);
  });
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
