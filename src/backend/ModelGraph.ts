import {setReferenceAge, GraphPerson, RelationshipTypes} from "./gedcomx-extensions";
import {translationToString} from "../main";
import viewGraph, {view} from "./ViewGraph";
import {FamilyView, Relationship, ResourceReference} from "gedcomx-js";

class ModelGraph {
  persons: GraphPerson[]
  relationships: Relationship[]

  constructor(data) {
    if (data.persons.length < 0 || data.relationships.length < 0) {
      throw new Error("Data is empty!")
    }

    console.log("Found", data.persons.length, "people", data.persons);
    console.log("Found", data.relationships.length, "relationships", data.relationships);
    // add some necessary data
    this.persons = data.persons.map(p => p.toGraphObject());
    this.relationships = data.relationships;
  }

  get parentChilds() {
    return this.relationships.filter(r => r.getType() === RelationshipTypes.ParentChild);
  }

  get couples() {
    return this.relationships.filter(r => r.getType() === RelationshipTypes.Couple);
  }

  findById = (id: string | ResourceReference): GraphPerson => {
    if (typeof id === "string") {
      return this.persons.find(p => p.data.getId() === id)
    }
    if (id instanceof ResourceReference) {
      return this.persons.find(p => id.matches(p.data.getId()))
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

  buildViewGraph = (startId: string, activeView?: string) => {
    let startPerson = this.findById(startId);
    console.info("Starting graph with", startPerson.data.getFullName());
    this.setAgeGen0(startPerson);
    viewGraph.startPerson = startPerson;

    viewGraph.reset();
    if (activeView === null) {
      activeView = view.DEFAULT;
    }
    switch (activeView) {
      case view.ALL:
        console.groupCollapsed("Showing full graph");
        this.persons.map(p => this.getFamiliesAsChild(p).concat(this.getFamiliesAsParent(p))
          .forEach(v => viewGraph.showFamily(v)));
        break;
      case view.LIVING: {
        console.groupCollapsed(`Showing all living relatives`);
        this.getAncestors(startPerson)
          .filter(p => !p.data.isDead())
          .forEach(p => this.getFamiliesAsParent(p).forEach(f => viewGraph.showFamily(f)));
        this.getDescendants(startPerson)
          .filter(p => !p.data.isDead())
          .forEach(p => this.getFamiliesAsChild(p).forEach(f => viewGraph.showFamily(f)));
        break;
      }
      case view.ANCESTORS:
        console.groupCollapsed(`Showing all ancestors of ${startPerson.data.getFullName()}`);
        this.getAncestors(startPerson)
          .forEach(p => this.getFamiliesAsParent(p).forEach(f => viewGraph.showFamily(f)));
        break;
      case view.DESCENDANTS:
        console.groupCollapsed(`Showing all descendants of ${startPerson.data.getFullName()}`);
        this.getDescendants(startPerson)
          .filter(p => p !== startPerson)
          .forEach(p => this.getFamiliesAsChild(p).forEach(f => viewGraph.showFamily(f)));
        break;
      default: {
        console.group("Showing explorable graph");
        this.getFamiliesAsParent(startPerson).forEach(viewGraph.showFamily);
        this.getFamiliesAsChild(startPerson).forEach(viewGraph.showFamily);
        console.groupEnd();
        return;
      }
    }
    console.groupEnd();
  }

  getFamiliesAsParent(person: GraphPerson): FamilyView[] {
    let families = this.couples
      // get all partners of the person
      .filter(r => r.involvesPerson(person.data))
      .map(c => {
        let partner = c.getOtherPerson(person.data);
        let children = this.getChildrenOfBoth(person, partner)
          .map(person => {
            return {
              resource: "#" + person.data.getId()
            }
          });
        return new FamilyView({
          parent1: c.getPerson1(),
          parent2: c.getPerson2(),
          children: children
        });
      });
    console.debug(`Families where ${person} is parent:`, families);
    return families;
  }

  getFamiliesAsChild(person: GraphPerson): FamilyView[] {
    let parents = this.getParents(person).map(p => "#" + p.data.getId());
    let families = this.couples
      // find couples where both are parents
      .filter(r => parents.includes(r.getPerson1().getResource()) && parents.includes(r.getPerson2().getResource()))
      .map(c => {
        let children = this.getChildrenOfBoth(c.getPerson1(), c.getPerson2()).map(person => {
          return {
            resource: "#" + person.data.getId()
          }
        });
        console.assert(children.map(r => r.resource).includes("#" + person.data.getId()), `${person} is not a child`)

        return new FamilyView({
          parent1: c.getPerson1(),
          parent2: c.getPerson2(),
          children: children
        });
      });

    console.debug(`Families where ${person} is a child:`, families);

    return families;
  }

  private getChildrenOfBoth(parent1: GraphPerson | ResourceReference, parent2: GraphPerson | ResourceReference) {
    if (parent1 instanceof ResourceReference) {
      parent1 = this.findById(parent1);
    }
    if (parent2 instanceof ResourceReference) {
      parent2 = this.findById(parent2);
    }
    let childrenOfParent1 = this.getChildren(parent1);
    let childrenOfParent2 = this.getChildren(parent2);
    return childrenOfParent1.filter(c => childrenOfParent2.includes(c));
  }

  private setAgeGen0 = (startPerson) => {
    let personWithKnownAge = this.persons
      .filter(p => p.getAscendancyNumber() === startPerson.getAscendancyNumber())
      .find(p => typeof p.data.getAge() === "number");

    if (!personWithKnownAge) {
      console.warn("No age for generation 0 could be found");
      return;
    }
    setReferenceAge(personWithKnownAge.data.getAge(),
      // get generation from generation fact
      Number(personWithKnownAge.getAscendancyNumber()));
  }

  private getParents = (person: GraphPerson) => {
    return this.parentChilds.filter(r => r.getPerson2().matches(person.data.getId()))
      .map(r => this.findById(r.getPerson1()));
  }

  getChildren = (person: GraphPerson) => {
    return this.parentChilds.filter(r => r.getPerson1().matches(person.data.getId()))
      .map(r => this.findById(r.getPerson2()));
  }

  private getPartners(person: GraphPerson) {
    return this.couples
      .filter(r => r.involvesPerson(person.data))
      .map(r => this.findById(r.getOtherPerson(person.data)));
  }

  private getAncestors(person: GraphPerson) {
    // stack to collect ancestors of ancestors
    let ancestors = [person];
    let index = 0;
    while (index < ancestors.length) {
      this.getParents(ancestors[index]).filter(p => !ancestors.includes(p)).forEach(p => ancestors.push(p))
      index++;
    }
    return ancestors;
  }

  private getDescendants(person: GraphPerson) {
    // stack to collect descendants of descendants
    let descendants = [person];
    let index = 0;
    while (index < descendants.length) {
      this.getChildren(descendants[index]).filter(p => !descendants.includes(p)).forEach(p => descendants.push(p))
      index++;
    }
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
