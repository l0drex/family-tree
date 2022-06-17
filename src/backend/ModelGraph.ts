import GedcomX from "./gedcomx";
import viewGraph, {GraphFamily, GraphPerson, view} from "./ViewGraph";

class ModelGraph {
  persons: GraphPerson[]
  relationships: GraphFamily[]
  startPerson: GraphPerson
  private ageGen0Value: number;

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

  get ageGen0() {
    return this.ageGen0Value;
  }

  findById = (id: string | GedcomX.ResourceReference) => {
    if (typeof id === "string") {
      return this.persons.find(p => p.data.id === id)
    }
    if (id instanceof GedcomX.ResourceReference) {
      return this.persons.find(p => id.matches(p.data.id))
    }
  }

  findByName = (name: string) => {
    return this.persons.find(person => person.data.getFullName().toLowerCase().includes(name));
  }

  getPersonPath = (person: GraphPerson) => {
    let entries = [];
    let child = this.getChildren(person)[0];
    let parent = this.getParents(person)[0];

    if (parent) entries.push(parent);
    entries.push(person);
    if (child) entries.push(child);

    return entries;
  }

  buildViewGraph = (startId: number, activeView?: string) => {
    this.startPerson = this.findById(startId);
    console.info("Starting graph with", this.startPerson.data.getFullName());
    this.setAgeGen0();

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
        peopleToShow = this.getAncestors(this.startPerson)
          .concat(this.getDescendants(this.startPerson))
          .filter(p => !p.data.isDead());
        break;
      }
      case view.ANCESTORS:
        console.groupCollapsed(`Showing all ancestors of ${this.startPerson.data.getFullName()}`);
        peopleToShow = this.getAncestors(this.startPerson);
        break;
      case view.DESCENDANTS:
        console.groupCollapsed(`Showing all descendants of ${this.startPerson.data.getFullName()}`);
        peopleToShow = this.getDescendants(this.startPerson);
        break;
      default: {
        console.groupCollapsed("Showing explorable graph");
        peopleToShow = this.getParents(this.startPerson)
          .concat(this.getChildren(this.startPerson))
          .concat(this.getPartners(this.startPerson));
      }
    }
    peopleToShow.forEach(viewGraph.showNode);
    this.relationships.filter(r => r.data.isCouple()).forEach(viewGraph.showCouple);
    this.relationships.filter(r => r.data.isParentChild()).forEach(viewGraph.addChild);
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

  private setAgeGen0 = () => {
    this.persons.every(p => {
      if (p.data.getGeneration() === this.startPerson.data.getGeneration()) {
        if (!this.ageGen0Value && p.data.getGeneration() === this.startPerson.data.getGeneration() && p.data.getAge()) {
          this.ageGen0Value = p.data.getAge();
          return false;
        }
      }
      return true;
    });
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
