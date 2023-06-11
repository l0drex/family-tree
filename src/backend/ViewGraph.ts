import {GraphFamily, GraphObject, GraphPerson} from "./graph";
import {RelationshipFactTypes} from "./gedcomx-enums";
import * as GedcomX from "gedcomx-js";
import config from "../config";
import {db} from "./db";
import {FamilyView, Person} from "./gedcomx-extensions";
import {unique} from "../main";

export enum ViewMode {
  DEFAULT = "default",
  ALL = "all",
  LIVING = "living",
  ANCESTORS = "ancestors",
  DESCENDANTS = "descendants"
}

export enum ColorMode {
  GENDER = "gender",
  AGE = "age",
  NAME = "name"
}

type eventTypes = "remove" | "add";

let lastViewGraphBuildParams: { id: string, view: ViewMode | string }

export class ViewGraph implements EventTarget {
  nodes: GraphObject[] = []
  links: { source: GraphObject, target: GraphObject }[]
  private startPersonValue: GraphPerson
  eventListeners: {
    [key: string]: Set<EventListenerOrEventListenerObject>
  } = {
    "add": new Set(),
    "remove": new Set()
  }

  set startPerson(startPerson: GedcomX.Person | GraphPerson) {
    if (startPerson instanceof GraphPerson) {
      this.startPersonValue = startPerson
    } else {
      this.startPersonValue = new GraphPerson(startPerson);
    }
  }

  get startPerson(): GraphPerson {
    return this.startPersonValue
  }

  async load(startId: string, activeView: ViewMode | string) {
    if (lastViewGraphBuildParams !== undefined) {
      if (lastViewGraphBuildParams.id === startId && lastViewGraphBuildParams.view === activeView) {
        throw Error("Unnecessary viewgraph build!");
      }
    }
    lastViewGraphBuildParams = {
      id: startId,
      view: activeView
    }

    let startPerson = (await db.personWithId(startId));
    startPerson ??= (await db.persons.toCollection().first()) as Person;
    console.info("Starting graph with", startPerson.fullName);

    this.startPerson = startPerson;
    db.setAgeGen0(startPerson);
    this.reset();

    let families: FamilyView[] = await this.getFamilyViews(activeView, startPerson);

    let hideAll = false;
    if (families.length <= 0) {
      console.error("No families found!");
      // adding at least the start person with etc-nodes
      families = await this.getFamilyViews(ViewMode.DEFAULT, startPerson);
      hideAll = true;
    }

    if (this.nodes.filter(n => n.type === "person").length > config.maxElements) {
      console.warn("Not all elements are shown. Graph would become too slow.")
      families.splice(config.maxElements - 1, families.length - (config.maxElements - 1));
    }

    //await Promise.all(families.map(f => this.showFamily(f)));
    for (const f of families) {
      if (f === undefined) throw new Error("family is undefined");
      await this.showFamily(f);
      if (hideAll) await this.hideFamily(f);
    }

    console.groupEnd();
  }

  async getFamilyViews(activeView: ViewMode | string, startPerson: Person): Promise<FamilyView[]> {
    let promises: Promise<GedcomX.FamilyView[]>[] = [];

    switch (activeView) {
      case ViewMode.ALL:
        console.groupCollapsed("Showing full graph");
        await db.persons.toArray().then(persons => persons.forEach(p => {
          promises.push(db.getFamiliesAsChild(p));
          promises.push(db.getFamiliesAsParent(p));
        }));
        break;
      case ViewMode.LIVING: {
        console.groupCollapsed(`Showing all living relatives`);
        await db.persons.toArray().then(persons => persons.filter(p => p.getLiving())
          .forEach(p => {
            promises.push(db.getFamiliesAsChild(p));
            promises.push(db.getFamiliesAsParent(p));
          }));
        break;
      }
      case ViewMode.ANCESTORS:
        console.groupCollapsed(`Showing all ancestors of ${startPerson.fullName}`);
        promises.push(db.getAncestors(startPerson.id)
          .then(ancestors => Promise.all(
            ancestors
              .filter(p => p.resource.substring(1) !== startPerson.id)
              .map(p => db.personWithId(p)
                .then(p => db.getFamiliesAsParent(p)))
          ).then(newFam => newFam.flat(1))));
        break;
      case ViewMode.DESCENDANTS:
        console.groupCollapsed(`Showing all descendants of ${startPerson.fullName}`);
        promises.push(db.getDescendants(startPerson.id)
          .then(descendants => Promise.all(
            descendants
              .filter(p => p.resource.substring(1) !== startPerson.id)
              .map(p => db.personWithId(p)
                .then(p => db.getFamiliesAsChild(p)))
          ).then(newFam => newFam.flat(1))));
        break;
      default: {
        console.group("Showing explorable graph");
        promises.push(db.getFamiliesAsParent(startPerson));
        promises.push(db.getFamiliesAsChild(startPerson));
      }
    }

    let families = await Promise.all(promises)
      .then(families => families.flat(1)
        .map(f => new FamilyView(f.toJSON())));
    // remove duplicates
    return unique(families);
  }

  reset = () => {
    this.nodes = [];
    this.links = [];
  }

  /**
   * Called when user clicked on etc. node.
   * @param family
   */
  async showFamily(family: GedcomX.FamilyView) {
    let graphFamily = await this.getGraphFamily(family);
    console.debug("Showing family:", graphFamily);
    graphFamily.type = "family";

    this.showNode(graphFamily);
    await Promise.all([family.parent1, family.parent2].map(id => this.showPerson(id, graphFamily, true)));
    await Promise.all(graphFamily.children.map(id => this.showPerson(id, graphFamily, false)));

    this.dispatchEvent(new CustomEvent("add", {
      detail: {
        nodes: this.nodes,
        links: this.links
      }
    }));
  }

  async hideFamily(family: GraphFamily | GedcomX.FamilyView) {
    console.log(family)
    // force typescript to recognize the type
    let graphFamily = await this.getGraphFamily(family);

    console.groupCollapsed("Hiding family:", family.toString());

    // find all leaves, e.g. all nodes who are not connected to other families
    let leaves = graphFamily.members
      .filter(m => m.getResource().substring(1) !== this.startPerson.data.getId());
    let leavePersons: GraphPerson[] = [];
    for (let p of leaves) {
      let person = await this.getGraphPerson(p);
      leavePersons.push(person)
    }
    leavePersons.filter(person => {
      // check if the node is connected to two families
      let linksToFamilies = this.links.filter(link => {
        let nodes = [link.source, link.target];
        if (!(nodes.includes(person))) {
          return false;
        }
        // remove etc and person node
        nodes = nodes.filter(n => n.type === "family");
        return nodes.length;
      });
      console.debug("Found", linksToFamilies.length, "connections to other families for", person.data.fullName,
        linksToFamilies);
      return linksToFamilies.length <= 1;
    });
    console.debug("Removing the following people:", leaves.map(l => l.toString()));

    // remove nodes from the graph
    for (const node of this.nodes.filter(n => this.isVisible(n))) {
      switch (node.type) {
        case "person":
          if (leavePersons.find(l => l.data.getId() === (node as GraphPerson).data.getId())) {
            this.hideNode(node);
          }
          break;
        case "etc":
          let members = (node as GraphFamily).members;
          let visibleMembers = [];
          for (let member of members) {
            visibleMembers.push(await this.getGraphPerson(member))
          }
          if (visibleMembers.filter(p => !leaves.includes(p) && this.isVisible(p)).length === 0) {
            this.hideNode(node);
          }
          break;
        case "family":
          // replace family that should be removed with an etc-node
          if (node === family) {
            node.type = "etc";
            console.debug("Replacing family with etc");
          }
          break;
        default:
          console.warn("Possible error, this should never happen!")
          break;
      }
    }

    // remove links from the graph
    this.links = this.links.filter(link => {
      let included = false;
      if (link.source instanceof GraphPerson) {
        included ||= leaves.map(l => l.resource.substring(1)).includes(link.source.data.id);
      }
      if (link.target instanceof GraphPerson) {
        included ||= leaves.map(l => l.resource.substring(1)).includes(link.target.data.id);
      }
      return !included;
    });

    console.groupEnd();
    this.dispatchEvent(new CustomEvent("remove", {
      detail: {
        nodes: this.nodes,
        links: this.links
      }
    }));
  }

  private isVisible = (node) => {
    return this.nodes.includes(node);
  }

  private async showPerson(p: GedcomX.ResourceReference, graphFamily: GraphFamily, isParent: boolean) {
    let person = await db.personWithId(p);
    let graphPerson = await this.getGraphPerson(p);
    this.showNode(graphPerson);
    this.showLink(graphFamily, graphPerson, isParent);

    // add etc
    let families = isParent ? await db.getFamiliesAsChild(person) : await db.getFamiliesAsParent(person);
    for (let f of families) {
      let graphEtc = await this.getGraphFamily(f);
      if (this.isVisible(graphEtc)) continue;

      graphEtc.type = "etc";
      this.showNode(graphEtc);
      this.showLink(graphPerson, graphEtc, isParent);
    }
  }

  private showNode = (node: GraphObject) => {
    if (this.isVisible(node)) {
      return false;
    }
    console.assert(!this.nodes.includes(node))

    this.nodes.push(node);
    return true;
  }

  private hideNode = (node: GraphObject) => {
    if (!this.isVisible(node)) {
      return false;
    }

    let index = this.nodes.indexOf(node);
    this.nodes.splice(index, 1);
    return true;
  }

  private showLink = (source: GraphObject, target: GraphObject, swap = false) => {
    let existingLink = this.links.find(l => new Set([l.source, l.target, source, target]).size === 2);
    if (existingLink !== undefined) {
      return;
    }

    this.links.push({
      source: swap ? target : source,
      target: swap ? source : target
    })
  }

  private async getGraphPerson(person: GedcomX.Person | GedcomX.ResourceReference): Promise<GraphPerson> {
    let personId;
    if (person instanceof GedcomX.Person) personId = person.id;
    else personId = person.resource.substring(1);

    let existing = this.nodes.find(n => n instanceof GraphPerson && n.data.id === personId) as GraphPerson;
    if (existing) return existing;
    if (person instanceof GedcomX.Person) return new GraphPerson(person);
    return db.personWithId(personId).then(p => new GraphPerson(p));
  }

  private async getGraphFamily(family: GedcomX.FamilyView): Promise<GraphFamily> {
    let graphFamily = this.nodes.find(n => n instanceof GraphFamily && n.equals(family)) as GraphFamily;
    if (graphFamily) return graphFamily;

    console.debug("Adding new family to view", family, this.nodes.filter(n => n.type === "family"))
    graphFamily = new GraphFamily(family.toJSON());

    await this.getMarriageDate(family)
      .then(date => {
        (graphFamily as GraphFamily).marriage = date;
      }).catch(() => {
      });

    return graphFamily as GraphFamily;
  }

  private async getMarriageDate(family: GedcomX.FamilyView): Promise<GedcomX.Date> {
    // find the correct couple relationship
    let couples1 = await db.getCoupleRelationsOf(family.getParent1());
    let couples2 = await db.getCoupleRelationsOf(family.getParent2());
    let couple = couples1.find(c =>
      couples2.find(c2 =>
        c.person1.resource === c2.person1.resource &&
        c.person2.resource === c2.person2.resource)
    );

    let facts = couple.getFacts();
    if (facts.length <= 0) {
      return Promise.reject("No facts found.");
    }

    let marriageFact = facts.find(f => f.type === RelationshipFactTypes.Marriage);
    if (marriageFact === undefined) {
      return Promise.reject("No marriage fact found.");
    }

    let date = marriageFact.date;
    if (!date) return Promise.reject("No marriage date defined.")
    return date;
  }

  dispatchEvent(event: Event): boolean {
    let listeners = this.eventListeners[event.type];
    if (listeners === undefined) {
      return;
    }
    listeners.forEach(f => {
      if ("handleEvent" in f) {
        f.handleEvent(event);
        return;
      }
      f(event);
    });
    return false;
  }

  addEventListener(type: eventTypes, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
    this.eventListeners[type].add(callback)
  }

  removeEventListener(type: eventTypes, callback: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
    this.eventListeners[type].delete(callback);
  }
}

let viewGraph = new ViewGraph();

export default viewGraph;
