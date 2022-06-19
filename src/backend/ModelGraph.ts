import GedcomX, {setReferenceAge} from "./gedcomx";
import viewGraph, {GraphFamily, GraphPerson, view} from "./ViewGraph";
import {translationToString} from "../main";

class ModelGraph {
  persons: GraphPerson[]
  relationships: GraphFamily[]

  constructor(data) {
    if (data.persons.length < 0 || data.relationships.length < 0) {
      throw new Error("Data is empty!")
    }

    console.log("Found", data.persons.length, "people", data.persons);
    console.log("Found", data.relationships.length, "relationships", data.relationships);
    // add some necessary data
    this.persons = data.persons.map(p => toGraphObject(p, "person"));
    this.relationships = data.relationships.map(r => toGraphObject(r, "family"));
  }

  findById = (id: string | GedcomX.ResourceReference): GraphPerson => {
    if (typeof id === "string") {
      return this.persons.find(p => p.data.id === id)
    }
    if (id instanceof GedcomX.ResourceReference) {
      return this.persons.find(p => id.matches(p.data.id))
    }
  }

  findByName = (name: string): GraphPerson => {
    return this.persons.find(person => person.data.getFullName().toLowerCase().includes(name));
  }

  getPersonPath = (person: GraphPerson): GraphPerson[] => {
    let entries = [];
    let child = this.getChildren(person)[0];
    let parent = this.getParents(person)[0];

    if (parent) entries.push(parent);
    entries.push(person);
    if (child) entries.push(child);

    return entries;
  }

  buildViewGraph = (startId: number, activeView?: string) => {
    let startPerson = this.findById(startId);
    console.info("Starting graph with", startPerson.data.getFullName());
    this.setAgeGen0(startPerson);
    viewGraph.startPerson = startPerson;

    viewGraph.reset();
    if (activeView === null) {
      activeView = view.DEFAULT;
    }
    let peopleToShow;
    switch (activeView) {
      case view.ALL:
        console.groupCollapsed("Showing full graph");
        peopleToShow = this.persons;
        break;
      case view.LIVING: {
        console.groupCollapsed(`Showing all living relatives`);
        peopleToShow = this.getAncestors(startPerson)
          .concat(this.getDescendants(startPerson))
          .filter(p => !p.data.isDead());
        break;
      }
      case view.ANCESTORS:
        console.groupCollapsed(`Showing all ancestors of ${startPerson.data.getFullName()}`);
        peopleToShow = this.getAncestors(startPerson);
        break;
      case view.DESCENDANTS:
        console.groupCollapsed(`Showing all descendants of ${startPerson.data.getFullName()}`);
        peopleToShow = this.getDescendants(startPerson);
        break;
      default: {
        console.groupCollapsed("Showing explorable graph");
        peopleToShow = [startPerson]
          .concat(this.getParents(startPerson))
          .concat(this.getChildren(startPerson))
          .concat(this.getPartners(startPerson));
      }
    }
    peopleToShow.forEach(viewGraph.showNode);
    this.relationships.filter(r => r.data.isCouple()).forEach(viewGraph.showCouple);
    this.relationships.filter(r => r.data.isParentChild()).forEach(viewGraph.showParentChild);
    console.groupEnd();
  }

  getParents = (person: GedcomX.Person) => {
    return this.relationships
      .filter(r => r.data.isParentChild() && r.data.person2.matches(person.data.id))
      .map(r => this.findById(r.data.person1));
  }

  getChildren = (person: GedcomX.Person) => {
    return this.relationships
      .filter(r => r.data.isParentChild() && r.data.person1.matches(person.data.id))
      .map(r => this.findById(r.data.person2));
  }

  private setAgeGen0 = (startPerson) => {
    let personWithKnownAge = this.persons
      .filter(p => p.data.getGeneration() === startPerson.data.getGeneration())
      .find(p => typeof p.data.getAge() === "number");

    if (!personWithKnownAge) {
      console.warn("No age for generation 0 could be found");
      return;
    }
    setReferenceAge(personWithKnownAge.data.getAge(), personWithKnownAge.data.getGeneration());
  }

  private getPartners(person: GedcomX.Person) {
    return this.relationships
      .filter(r => r.data.isCouple() &&
        r.data.involvesPerson(person.data))
      .map(r => this.findById(r.data.getOtherPerson(person.data)));
  }

  private getAncestors(person: GedcomX.Person) {
    // stack to collect ancestors of ancestors
    let ancestors = [person];
    let index = 0;
    while (index < ancestors.length) {
      this.getParents(ancestors[index]).filter(p => !ancestors.includes(p)).forEach(p => ancestors.push(p))
      index++;
    }
    return ancestors;
  }

  private getDescendants(person: GedcomX.Person) {
    // stack to collect descendants of descendants
    let descendants = [person];
    let index = 0;
    while (index < descendants.length) {
      this.getChildren(descendants[index]).filter(p => !descendants.includes(p)).forEach(p => descendants.push(p))
      index++;
    }
    descendants.forEach(d => this.getPartners(d).forEach(p => descendants.push(p)));
    return descendants;
  }
}

export let graphModel: ModelGraph;

export function GraphModel(data) {
  if (graphModel !== undefined) {
    return;
  }
  if (!data) {
    throw new Error(
      translationToString({
        en: "The calculated graph is empty!" +
          "Please check if your files are empty. If not, please contact the administrator!",
        de: "Der berechnete Graph ist leer!" +
          " Prüfe bitte, ob die Dateien leer sind. Sollte dies nicht der Fall sein, kontaktiere bitte den Administrator!"
      }));
  }
  graphModel = new ModelGraph(data);
}

function toGraphObject(object: GedcomX.Person | GedcomX.Relationship, type: "person" | "family") {
  let graphObject;
  switch (type) {
    case "person":
      graphObject = new GraphPerson(object)
      break;
    case "family":
      graphObject = new GraphFamily(object);
      break;
  }

  return graphObject;
}
