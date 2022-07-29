import GedcomX, {setReferenceAge} from "./gedcomx-extensions";
import {translationToString} from "../main";
import viewGraph, {ViewMode} from "./ViewGraph";
import config from "../config";
import {PersonFactTypes} from "./gedcomx-enums";

let lastViewGraphBuildParams: {id: string, view: ViewMode | string}

class ModelGraph extends GedcomX.Root {
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

  getPersonById(id: string | number | GedcomX.ResourceReference): GedcomX.Person {
    if (id instanceof GedcomX.ResourceReference) {
      id = id.getResource().substring(1);
    }
    return super.getPersonById(id);
  }

  getPersonByName = (name: string): GedcomX.Person => {
    return this.persons.find(person => person.getFullName().toLowerCase().includes(name));
  }

  getPersonPath = (person: GedcomX.Person): GedcomX.Person[] => {
    let entries = [];
    let child = this.getPersonsChildren(person)[0];
    let parent = this.getPersonsParents(person)[0];

    if (parent) entries.push(parent);
    entries.push(person);
    if (child) entries.push(child);

    return entries;
  }

  buildViewGraph = (startId: string, activeView: ViewMode | string) => {
    if (lastViewGraphBuildParams !== undefined) {
      if (lastViewGraphBuildParams.id === startId && lastViewGraphBuildParams.view === activeView) {
        return viewGraph;
      }
    }
    lastViewGraphBuildParams = {
      id: startId,
      view: activeView
    }

    let startPerson: GedcomX.Person;
    if (startId !== null) {
      startPerson = this.getPersonById(startId);
    } else {
      startPerson = this.persons[0];
    }
    console.info("Starting graph with", startPerson.getFullName());
    this.setAgeGen0(startPerson);
    viewGraph.startPerson = startPerson;

    viewGraph.reset();
    let families: GedcomX.FamilyView[] = [];
    switch (activeView) {
      case ViewMode.ALL:
        console.groupCollapsed("Showing full graph");
        this.persons.forEach(p => {
          families = families.concat(this.getFamiliesAsChild(p));
          families = families.concat(this.getFamiliesAsParent(p));
        });
        break;
      case ViewMode.LIVING: {
        console.groupCollapsed(`Showing all living relatives`);
        this.persons.filter(p => p.getLiving())
          .forEach(p => {
          families = families.concat(this.getFamiliesAsChild(p));
          families = families.concat(this.getFamiliesAsParent(p));
        });
        break;
      }
      case ViewMode.ANCESTORS:
        console.groupCollapsed(`Showing all ancestors of ${startPerson.getFullName()}`);
        this.getAncestors(startPerson)
          .filter(p => p !== startPerson)
          .forEach(p => families = families.concat(this.getFamiliesAsParent(p)));
        break;
      case ViewMode.DESCENDANTS:
        console.groupCollapsed(`Showing all descendants of ${startPerson.getFullName()}`);
        this.getDescendants(startPerson)
          .filter(p => p !== startPerson)
          .forEach(p => families = families.concat(this.getFamiliesAsChild(p)));
        break;
      default: {
        console.group("Showing explorable graph");
        families = this.getFamiliesAsParent(startPerson)
          .concat(this.getFamiliesAsChild(startPerson));
      }
    }

    if (families.length > 0) {
      families.forEach(viewGraph.showFamily);
      if (viewGraph.nodes.filter(n => n.type === "person").length > config.maxElements) {
        console.warn("Not all elements are shown. Graph would become too slow.")
        families.splice(config.maxElements - 1, families.length - (config.maxElements - 1));
      }
    } else {
      // adding at least the start person with etc-nodes
      this.getFamiliesAsChild(startPerson).forEach(f => {
        viewGraph.showFamily(f);
        viewGraph.hideFamily(f);
      })
      this.getFamiliesAsParent(startPerson).forEach(f => {
        viewGraph.showFamily(f);
        viewGraph.hideFamily(f);
      })
    }

    console.groupEnd();
    return viewGraph
  }

  getFamiliesAsParent(person: GedcomX.Person): GedcomX.FamilyView[] {
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
        return new GedcomX.FamilyView({
          parent1: c.getPerson1(),
          parent2: c.getPerson2(),
          children: children
        });
      });
    console.debug(`Families where ${person} is a parent:`, families);
    person.getDisplay().setFamiliesAsParent(families);

    return families;
  }

  getFamiliesAsChild(person: GedcomX.Person): GedcomX.FamilyView[] {
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

        return new GedcomX.FamilyView({
          parent1: c.getPerson1(),
          parent2: c.getPerson2(),
          children: children
        });
      });

    console.debug(`Families where ${person} is a child:`, families);
    person.getDisplay().setFamiliesAsChild(families);

    return families;
  }

  private getChildrenOfBoth(parent1: GedcomX.Person | GedcomX.ResourceReference, parent2: GedcomX.Person | GedcomX.ResourceReference) {
    if (parent1 instanceof GedcomX.ResourceReference) {
      parent1 = this.getPersonById(parent1.getResource().substring(1));
    }
    if (parent2 instanceof GedcomX.ResourceReference) {
      parent2 = this.getPersonById(parent2.getResource().substring(1));
    }
    let childrenOfParent1 = this.getPersonsChildren(parent1);
    let childrenOfParent2 = this.getPersonsChildren(parent2);
    return childrenOfParent1.filter(c => childrenOfParent2.includes(c));
  }

  private setAgeGen0 = (startPerson: GedcomX.Person) => {
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

  private getAncestors(person: GedcomX.Person): GedcomX.Person[] {
    // stack to collect ancestors of ancestors
    let ancestors = new Set<GedcomX.Person>([person]);
    let iterator = ancestors.values();
    let nextPerson = iterator.next()
    while (!nextPerson.done) {
      this.getPersonsParents(nextPerson.value).forEach(p => ancestors.add(p))
      nextPerson = iterator.next();
    }
    return Array.from(ancestors);
  }

  private getDescendants(person: GedcomX.Person): GedcomX.Person[] {
    // stack to collect descendants of descendants
    let descendants = new Set<GedcomX.Person>([person]);
    let iterator = descendants.values();
    let nextPerson = iterator.next()
    while (!nextPerson.done) {
      this.getPersonsChildren(nextPerson.value).forEach(p => descendants.add(p))
      nextPerson = iterator.next();
    }
    return Array.from(descendants);
  }
}

export let graphModel: ModelGraph;

export function loadData(data: object) {
  if (graphModel !== undefined) {
    return;
  }
  graphModel = new ModelGraph(data);
}
