// data structure that stores the graph information
// TODO save graph to localStorage
let modelGraph;

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
    let readerFamily = new FileReader();
    readerFamily.onload = (file) => {
      familiesTable = file.target.result;

      if (peopleTable && familiesTable)
        loadCsv(peopleTable, familiesTable, setup);
    }
    readerFamily.readAsText(familyFile);
    let readerPeople = new FileReader();
    readerPeople.onload = (file) => {
      peopleTable = file.target.result;

      if (peopleTable && familiesTable)
        loadCsv(peopleTable, familiesTable, setup);
    }
    readerPeople.readAsText(peopleFile);

    d3.selectAll("article").classed("hidden", true);
    svg.classed("hidden", false);
    // FIXME this should be doable in css, but I cant find why.
    //  See main.css line 147: main > :not(.hidden):last-child should also apply to the svg
    svg.attr("style", "margin-bottom: 0;")

    const viewportSize = [svg.node().getBBox().width, svg.node().getBBox().height];
    d3cola.size(viewportSize);
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
