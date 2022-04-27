import * as graphModel from "./graphModel.js";
import * as graphView from "./graphView.js";
import {showError, hideError} from "../main.js";
import {Person, Relationship} from "../vendor/gedcomx.js";


(function init() {
  let data = JSON.parse(localStorage.getItem("familyData"));
  if (!data) {
    showError({
      en: "The calculated graph is empty!" +
        "Please check if your files are empty. If not, please contact the administrator!",
      de: "Der berechnete Graph ist leer!" +
        " Prüfe bitte, ob die Dateien leer sind. Sollte dies nicht der Fall sein, kontaktiere bitte den Administrator!"
    }, "graph");
  }

  let persons = [], relationships = [];
  data.persons.forEach(person => persons.push(new Person(person)));
  data.relationships.forEach(relationship => relationships.push(new Relationship(relationship)));

  // add options to search field
  graphView.addOptions(persons);

  // get id from url
  let url = new URL(window.location);
  let id = url.searchParams.get("id") || persons[0].id;

  graphModel.setData({persons, relationships});
  graphModel.setStartPerson(id);
  graphView.draw(graphModel.viewGraph, graphModel.startPerson);
})();

/**
 * Searches for a person with given name and shows its family tree
 * @param name {String} name of the person to search for
 */
export function searchFamily(name) {
  // if no name was given, reload the page with no param -> uses the default: id=1
  let id = "";
  if (name) {
    // find a person that matches the given name
    let person = graphModel.findPerson(name.toLowerCase());

    // if no person was found, throw error
    graphView.setFormError(!person);
    if (!person) {
      showError({
        en: "No person with that name found!",
        de: "Es konnte keine Person mit diesem Namen gefunden werden!"
      }, "search");
      return;
    }

    id = person.id;
    console.log("Assuming the person is", person.fullName);
    hideError("search");
  }

  let url = new URL(window.location);
  url.searchParams.set("id", id);
  window.location.replace(url);
}

export function showFamily(family) {
  graphModel.showFamily(family).then(graph => graphView.draw(graph, graphModel.startPerson));
}

export function hideFamily(family) {
  graphModel.hideFamily(family).then(graph => graphView.draw(graph, graphModel.startPerson));
}
