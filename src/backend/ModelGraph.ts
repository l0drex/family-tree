import {setReferenceAge, PersonFactTypes} from "./gedcomx-extensions";
import {translationToString} from "../main";
import viewGraph, {view} from "./ViewGraph";
import {FamilyView, Person, ResourceReference, Root} from "gedcomx-js";

class ModelGraph extends Root {
  constructor(data) {
    super(data)
    if (!data || data.persons.length < 0 || data.relationships.length < 0) {
      throw new Error(
        translationToString({
          en: "The calculated graph is empty!" +
            "Please check if your files are empty. If not, please contact the administrator!",
          de: "Der berechnete Graph ist leer!" +
            " Prüfe bitte, ob die Dateien leer sind. Sollte dies nicht der Fall sein, kontaktiere bitte den Administrator!"
        }));
    }

    console.log("Found", data.persons.length, "people");
    console.log("Found", data.relationships.length, "relationships");
  }

  getPersonById(id: string | number | ResourceReference): Person {
    if (id instanceof ResourceReference) {
      id = id.getResource().substring(1);
    }
    return super.getPersonById(id);
  }

  getPersonByName = (name: string): Person => {
    return this.persons.find(person => person.getFullName().toLowerCase().includes(name));
  }

  getPersonsChildren(person: Person | string | ResourceReference): Person[] {
    if (person instanceof ResourceReference) {
      person = person.getResource().substring(1);
    }
    return super.getPersonsChildren(person);
  }

  getPersonPath = (person: Person): Person[] => {
    let entries = [];
    let child = this.getPersonsChildren(person)[0];
    let parent = this.getPersonsParents(person)[0];

    if (parent) entries.push(parent);
    entries.push(person);
    if (child) entries.push(child);

    return entries;
  }

  buildViewGraph = (startId: string, activeView?: string) => {
    let startPerson = this.getPersonById(startId);
    console.info("Starting graph with", startPerson.getFullName());
    this.setAgeGen0(startPerson);
    viewGraph.startPerson = startPerson;

    viewGraph.reset();
    if (activeView === null) {
      activeView = view.DEFAULT;
    }
    switch (activeView) {
      case view.ALL:
        console.groupCollapsed("Showing full graph");
        this.persons.forEach(p => this.getFamiliesAsChild(p).concat(this.getFamiliesAsParent(p))
          .forEach(viewGraph.showFamily));
        break;
      case view.LIVING: {
        console.groupCollapsed(`Showing all living relatives`);
        this.getAncestors(startPerson)
          .filter(p => !p.getLiving())
          .forEach(p => this.getFamiliesAsParent(p).forEach(viewGraph.showFamily));
        this.getDescendants(startPerson)
          .filter(p => !p.getLiving())
          .forEach(p => this.getFamiliesAsChild(p).forEach(viewGraph.showFamily));
        break;
      }
      case view.ANCESTORS:
        console.groupCollapsed(`Showing all ancestors of ${startPerson.getFullName()}`);
        this.getAncestors(startPerson)
          .forEach(p => this.getFamiliesAsParent(p).forEach(viewGraph.showFamily));
        break;
      case view.DESCENDANTS:
        console.groupCollapsed(`Showing all descendants of ${startPerson.getFullName()}`);
        this.getDescendants(startPerson)
          .filter(p => p !== startPerson)
          .forEach(p => this.getFamiliesAsChild(p).forEach(viewGraph.showFamily));
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

  getFamiliesAsParent(person: Person): FamilyView[] {
    if (person.getDisplay().getFamiliesAsParent().length > 0) {
      return person.getDisplay().getFamiliesAsParent();
    }

    let families = this.getPersonsCoupleRelationships(person)
      .map(c => {
        let partner = c.getOtherPerson(person);
        let children = this.getChildrenOfBoth(person, partner)
          .map(person => {
            return {
              resource: "#" + person.getId()
            }
          });
        return new FamilyView({
          parent1: c.getPerson1(),
          parent2: c.getPerson2(),
          children: children
        });
      });
    console.debug(`Families where ${person} is a parent:`, families);
    person.getDisplay().setFamiliesAsParent(families);

    return families;
  }

  getFamiliesAsChild(person: Person): FamilyView[] {
    if (person.getDisplay().getFamiliesAsChild().length > 0) {
      return person.getDisplay().getFamiliesAsChild();
    }

    let parents = this.getPersonsParents(person).map(p => p.getId());
    // find couples where both are parents
    let families = this.getPersonsCoupleRelationships(parents[0])
      .filter(r => parents[1] === r.getPerson2().getResource().substring(1))
      .map(c => {
        let children = this.getChildrenOfBoth(c.getPerson1(), c.getPerson2()).map(person => {
          return {
            resource: "#" + person.getId()
          }
        });
        console.assert(children.map(r => r.resource).includes("#" + person.getId()), `${person} is not a child`)

        return new FamilyView({
          parent1: c.getPerson1(),
          parent2: c.getPerson2(),
          children: children
        });
      });

    console.debug(`Families where ${person} is a child:`, families);
    person.getDisplay().setFamiliesAsChild(families);

    return families;
  }

  private getChildrenOfBoth(parent1: Person | ResourceReference, parent2: Person | ResourceReference) {
    if (parent1 instanceof ResourceReference) {
      parent1 = this.getPersonById(parent1.getResource().substring(1));
    }
    if (parent2 instanceof ResourceReference) {
      parent2 = this.getPersonById(parent2.getResource().substring(1));
    }
    let childrenOfParent1 = this.getPersonsChildren(parent1);
    let childrenOfParent2 = this.getPersonsChildren(parent2);
    return childrenOfParent1.filter(c => childrenOfParent2.includes(c));
  }

  private setAgeGen0 = (startPerson: Person) => {
    let personWithKnownAge = this.persons
      .filter(p => {
        let generationStartFacts = startPerson.getFactsByType(PersonFactTypes.Generation);
        if (generationStartFacts.length < 1) {
          return false;
        }
        let generationStart = generationStartFacts[0].getValue();
        let generationPFacts = p.getFactsByType(PersonFactTypes.Generation)
        if (generationPFacts.length < 1) {
          return false;
        }
        let generationP = generationPFacts[0].getValue()
        return generationP === generationStart;
      })
      .find(p => typeof p.getAgeToday() === "number");

    if (!personWithKnownAge) {
      console.warn("No age for generation 0 could be found");
      return;
    }
    setReferenceAge(personWithKnownAge.getAgeToday(),
      // get generation from generation fact
      Number(personWithKnownAge.getFactsByType(PersonFactTypes.Generation)[0].getValue()));
  }

  private getAncestors(person: Person): Person[] {
    // stack to collect ancestors of ancestors
    let ancestors = [person];
    let index = 0;
    while (index < ancestors.length) {
      this.getPersonsParents(ancestors[index]).filter(p => !ancestors.includes(p)).forEach(p => ancestors.push(p))
      index++;
    }
    return ancestors;
  }

  private getDescendants(person: Person): Person[] {
    // stack to collect descendants of descendants
    let descendants = [person];
    let index = 0;
    while (index < descendants.length) {
      this.getPersonsChildren(descendants[index]).filter(p => !descendants.includes(p)).forEach(p => descendants.push(p))
      index++;
    }
    return descendants;
  }
}

export let graphModel: ModelGraph;

export function loadData(data: object) {
  if (graphModel !== undefined) {
    return;
  }
  graphModel = new ModelGraph(data);
}
