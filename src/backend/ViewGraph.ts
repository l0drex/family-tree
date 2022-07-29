import {GraphFamily, GraphObject, GraphPerson} from "./graph";
import {PersonFactTypes} from "./gedcomx-enums";
import {graphModel} from "./ModelGraph";
import GedcomX from "./gedcomx-extensions";

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

  reset = () => {
    this.nodes = [];
    this.links = [];
  }

  /**
   * Called when user clicked on etc. node.
   * @param family
   */
  showFamily = (family: GedcomX.FamilyView) => {
    let graphFamily = this.getGraphFamily(family);
    console.debug("Showing family:", graphFamily);
    graphFamily.type = "family";
    this.showNode(graphFamily);
    [family.getParent1(), family.getParent2()].forEach(id => this.showPerson(id, graphFamily, true));
    graphFamily.getChildren().forEach(id => this.showPerson(id, graphFamily, false));
    this.dispatchEvent(new CustomEvent("add", {
      detail: {
        nodes: this.nodes,
        links: this.links
      }
    }));
  }

  hideFamily = (family: GraphFamily | GedcomX.FamilyView) => {
    console.log(family)
    if (family instanceof GedcomX.FamilyView) {
      family = this.getGraphFamily(family);
    }

    console.groupCollapsed("Hiding family:", family.toString());

    // find all leaves, e.g. all nodes who are not connected to other families
    let leaves = family.getMembers()
      .filter(m => m.getResource().substring(1) !== this.startPerson.data.getId())
      .map(p => graphModel.getPersonById(p)).map(p => this.getGraphPerson(p))
      .filter(person => {
          // check if the node is connected to two families
          let linksToFamilies = viewGraph.links.filter(link => {
            let nodes = [link.source, link.target];
            if (!(nodes.includes(person))) {
              return false;
            }
            // remove etc and person node
            nodes = nodes.filter(n => n.type === "family");
            return nodes.length;
          });
          console.debug("Found", linksToFamilies.length, "connections to other families for", person.data.getFullName(),
            linksToFamilies);
          return linksToFamilies.length <= 1;
        }
      );
    console.debug("Removing the following people:", leaves.map(l => l.toString()));

    // remove nodes from the graph
    this.nodes.filter(node => {
      if (!(this.isVisible(node))) {
        return false;
      }

      switch (node.type) {
        case "person":
          return leaves.find(l => l.data.getId() === (node as GraphPerson).data.getId());
        case "etc":
          let visibleMembers = (node as GraphFamily).getMembers()
            .map(p => this.getGraphPerson(graphModel.getPersonById(p)));
          return visibleMembers.filter(p => !leaves.includes(p) && this.isVisible(p)).length === 0;
        case "family":
          // replace family that should be removed with an etc-node
          if (node === family) {
            node.type = "etc";
            console.debug("Replacing family with etc");
          }
          return false;
        default:
          console.warn("Possible error, this should never happen!")
          return false;
      }
    }).forEach(this.hideNode);

    // remove links from the graph
    this.links = this.links.filter(link => {
      let included = false;
      if (link.source instanceof GraphPerson) {
        included ||= leaves.includes(link.source);
      }
      if (link.target instanceof GraphPerson) {
        included ||= leaves.includes(link.target);
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

  private showPerson = (p: GedcomX.ResourceReference, graphFamily: GraphFamily, isParent: boolean) => {
    let person = graphModel.getPersonById(p);
    let graphPerson = this.getGraphPerson(person);
    this.showNode(graphPerson);
    this.showLink(graphFamily, graphPerson, isParent);

    // add etc
    let families = isParent ? graphModel.getFamiliesAsChild(person) : graphModel.getFamiliesAsParent(person);
    families.map(this.getGraphFamily).filter(f => !this.isVisible(f)).forEach(graphEtc => {
      graphEtc.type = "etc";
      this.showNode(graphEtc);
      this.showLink(graphPerson, graphEtc, isParent);
    });
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

  private getGraphPerson = (person: GedcomX.Person | GedcomX.ResourceReference): GraphPerson => {
    if (person instanceof GedcomX.ResourceReference) {
      person = graphModel.getPersonById(person);
    }

    return this.nodes.find(n => n instanceof GraphPerson && n.equals((person as GedcomX.Person).getDisplay())) as GraphPerson
      || person.getDisplay() as GraphPerson;
  }

  private getGraphFamily = (family: GedcomX.FamilyView): GraphFamily => {
    let graphFamily = this.nodes.find(n => (n.type === "family" || n.type === "etc") && (n as GraphFamily).equals(family));
    if (graphFamily === undefined) {
      console.debug("Adding new family to view", family, this.nodes.filter(n => n.type === "family"))
      graphFamily = new GraphFamily(family);

      // try to add a marriage date
      let marriageFacts = graphModel.getPersonById(family.getParent1()).getFactsByType(PersonFactTypes.MaritalStatus);
      if (marriageFacts.length > 0) {
        (graphFamily as GraphFamily).marriage = marriageFacts[0].getDate();
      }
    }

    return graphFamily as GraphFamily;
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
