import {GraphFamily, GraphObject, GraphPerson} from "./graph";
import {RelationshipFactTypes} from "../gedcomx/types";
import * as GedcomX from "gedcomx-js";
import config from "../config";
import {db} from "./db";
import {FamilyView, GDate, Person} from "../gedcomx/gedcomx-js-extensions";
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
  NAME = "name",
  CONFIDENCE = "confidence"
}

type eventTypes = "remove" | "add" | "progress";

export class ViewGraph implements EventTarget {
  nodes: GraphObject[] = []
  links: { source: GraphObject, target: GraphObject }[]
  private startPersonValue: GraphPerson
  eventListeners: {
    [key: string]: Set<EventListenerOrEventListenerObject>
  } = {
    "add": new Set(),
    "remove": new Set(),
    "progress": new Set()
  }
  startId: string
  viewMode: ViewMode
  private loading: Promise<void>
  private _progress: number

  get progress() {
    return this._progress
  }

  set progress(value: number) {
    this._progress = value;
    this.dispatchEvent(new CustomEvent("progress", {
      detail: value
    }))
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

  async load(startPerson: Person, viewMode: ViewMode) {
    // make sure we are not loading in parallel
    if (!this.loading) this.loading = this.loadContent(startPerson, viewMode)
      .then(() => {
        this.loading = null;
      });

    return this.loading;
  }

  private async loadContent(startPerson: Person, viewMode: ViewMode) {
    console.group(`Building viewgraph for ${startPerson} in mode ${viewMode}`)
    this.reset();
    this.startId = startPerson.id;
    this.viewMode = viewMode;

    this.startPerson = startPerson;
    this.progress = .1;
    db.setAgeGen0(startPerson);

    let families: FamilyView[] = await this.getFamilyViews(viewMode, startPerson);

    let hideAll = false;
    if (families.length === 0) {
      console.error("No families found!");
      // adding at least the start person with etc-nodes
      families = await this.getFamilyViews(ViewMode.DEFAULT, startPerson);
      hideAll = true;
    }
    this.progress = .5;

    if (this.nodes.filter(n => n instanceof GraphPerson).length > config.maxElements) {
      console.warn("Not all elements are shown. Graph would become too slow.")
      families.splice(config.maxElements - 1, families.length - (config.maxElements - 1));
    }

    for (const f of families) {
      if (f === undefined) throw new Error("family is undefined");
      await this.showFamily(f);
      if (hideAll) await this.hideFamily(f);
      this.progress += .5/families.length;
    }
    if (viewMode === ViewMode.ALL) {
      let visiblePersonIds = this.nodes.filter(n => n instanceof GraphPerson).map((n: GraphPerson) => n.data.id);
      await db.persons.filter(p => !visiblePersonIds.includes(p.id)).toArray()
        .then(ps => ps.map(p => new Person(p)))
        .then(ps => Promise.all(ps.map(p => this.getGraphPerson(p))))
        .then(gps => gps.forEach(gp => this.showNode(gp)));
    }
    if (this.nodes.length === 0) {
      // adding at least the start person
      await this.showNode(await this.getGraphPerson(startPerson));
    }
    this.progress = 1;

    console.groupEnd();
  }

  async getFamilyViews(activeView: ViewMode | string, startPerson: Person): Promise<FamilyView[]> {
    let promises: Promise<GedcomX.FamilyView[]>[] = [];

    switch (activeView) {
      case ViewMode.ALL:
        await db.persons.toArray().then(persons => persons
          .map(p => new Person(p))
          .forEach(p => {
            promises.push(db.getFamiliesAsChild(p));
            promises.push(db.getFamiliesAsParent(p));
          }));
        break;
      case ViewMode.LIVING: {
        await db.persons.toArray().then(persons => persons
          .map(p => new Person(p))
          .filter(p => p.isLiving)
          .forEach(p => {
            promises.push(db.getFamiliesAsChild(p));
            promises.push(db.getFamiliesAsParent(p));
          }));
        break;
      }
      case ViewMode.ANCESTORS:
        promises.push(db.getAncestors(startPerson.id)
          .then(ancestors => Promise.all(
            ancestors
              .filter(p => p.resource.substring(1) !== startPerson.id)
              .map(p => db.personWithId(p)
                .then(p => db.getFamiliesAsParent(p)))
          ).then(newFam => newFam.flat(1))));
        break;
      case ViewMode.DESCENDANTS:
        promises.push(db.getDescendants(startPerson.id)
          .then(descendants => Promise.all(
            descendants
              .filter(p => p.resource.substring(1) !== startPerson.id)
              .map(p => db.personWithId(p)
                .then(p => db.getFamiliesAsChild(p)))
          ).then(newFam => newFam.flat(1))));
        break;
      default: {
        promises.push(db.getFamiliesAsParent(startPerson));
        promises.push(db.getFamiliesAsChild(startPerson));
      }
    }

    this.progress += .1;

    let families = await Promise.all(promises)
      .then(families => families.flat(1)
        .map(f => new FamilyView(f.toJSON())));
    // remove duplicates
    return unique(families);
  }

  reset() {
    this.nodes = [];
    this.links = [];
    delete this.startId;
    delete this.viewMode;
    this.progress = 0;
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
    await Promise.all([family.parent1, family.parent2].map(id => {
      if (id === undefined) return undefined;
      return this.showPerson(id, graphFamily, true)
    }));
    if (graphFamily.children)
      await Promise.all(graphFamily.children.map(id => this.showPerson(id, graphFamily, false)));

    this.dispatchEvent(new CustomEvent("add", {
      detail: {
        nodes: this.nodes,
        links: this.links
      }
    }));
  }

  async hideFamily(family: GraphFamily | GedcomX.FamilyView) {
    // force typescript to recognize the type
    let graphFamily = await this.getGraphFamily(family);
    console.groupCollapsed("Hiding family:", graphFamily);

    // find all leaves, e.g. all nodes who are not connected to other families
    let leaves = graphFamily.members
      .filter(m => m.resource.substring(1) !== this.startPerson.data.id);
    let leavePersons: GraphPerson[] = [];
    for (let p of leaves) {
      let person = await this.getGraphPerson(p);

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
      let isLeave = linksToFamilies.length <= 1;

      if (isLeave) leavePersons.push(person)
    }
    console.debug("Removing the following people:", leavePersons.map(l => l.toString()));

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
          let visibleMembers: GraphPerson[] = [];
          for (let member of members) {
            visibleMembers.push(await this.getGraphPerson(member))
          }
          if (visibleMembers.filter(p => !leavePersons.includes(p) && this.isVisible(p)).length === 0) {
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
        included ||= leavePersons.map(l => l.data.id).includes(link.source.data.id);
      }
      if (link.target instanceof GraphPerson) {
        included ||= leavePersons.map(l => l.data.id).includes(link.target.data.id);
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
      }).catch(() => {});

    return graphFamily as GraphFamily;
  }

  private async getMarriageDate(family: GedcomX.FamilyView): Promise<GDate> {
    // find the correct couple relationship
    let couples1 = await db.getCoupleRelationsOf(family.getParent1());
    let couples2 = await db.getCoupleRelationsOf(family.getParent2());
    let couple = couples1.find(c =>
      couples2.find(c2 =>
        c.person1.resource === c2.person1.resource &&
        c.person2.resource === c2.person2.resource)
    );

    let facts = couple.facts;
    if (facts.length <= 0) {
      return Promise.reject("No facts found.");
    }

    let marriageFact = facts.find(f => f.type === RelationshipFactTypes.Marriage);
    if (marriageFact === undefined) {
      return Promise.reject("No marriage fact found.");
    }

    // somehow constructor skips constructing if directly called with data
    let date = new GDate();
    date.setFormal(marriageFact.date.formal)
      .setOriginal(marriageFact.date.original);
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
