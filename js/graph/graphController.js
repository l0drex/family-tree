import * as graphModel from "./graphModel.js";
import * as graphView from "./graphView.js";
import {showError, hideError, translationToString} from "../main.js";


(function init() {
  let data = new GedcomX(JSON.parse(localStorage.getItem("familyData")));
  if (!data) {
    showError({
      en: "The calculated graph is empty!" +
        "Please check if your files are empty. If not, please contact the administrator!",
      de: "Der berechnete Graph ist leer!" +
        " Prüfe bitte, ob die Dateien leer sind. Sollte dies nicht der Fall sein, kontaktiere bitte den Administrator!"
    }, "graph");
  }

  // add options to search field
  graphView.addOptions(data.persons);

  // get id from url
  let url = new URL(window.location);
  let id = url.searchParams.get("id");
  if (!id) {
    id = data.persons[0].id;
  }

  let filter = [...new Set(url.searchParams.getAll("filter"))];
  //filter = filter ? filter.split(",") : [];
  graphModel.filter.active = filter;
  graphView.showFilter();

  graphModel.setData(data);
  graphModel.setStartPerson(id);
  graphView.draw(graphModel.viewGraph, graphModel.startPerson);
})();

/**
 * Searches for a person with given name and shows its family tree
 * @param name {String} name of the person to search for
 */
export function searchPerson(name) {
  // if no name was given, reload the page with no param -> uses the default: id=1
  let id = "";
  if (name) {
    // find a person that matches the given name
    let person = graphModel.findPerson(name.toLowerCase());

    // if no person was found, throw error
    graphView.setFormError(!person);
    if (!person) {
      window.alert(translationToString({
        en: "No person with that name found!",
        de: "Es konnte keine Person mit diesem Namen gefunden werden!"
      }));
      return;
    }

    id = person.data.id;
    console.log(`Assuming the person is ${person.data.fullName} with id ${person.data.id}`);
    hideError("search");
  }

  let url = new URL(window.location);
  url.searchParams.set("id", id);
  window.location.replace(url);
}

export function getPersonPath(person) {
  return graphModel.getPersonPath(person);
}

export function showFamily(family) {
  let graph = graphModel.showFamily(family);
  graphView.draw(graph, graphModel.startPerson);
}

export function hideFamily(family) {
  let graph = graphModel.hideFamily(family);
  graphView.draw(graph, graphModel.startPerson);
}
