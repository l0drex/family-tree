import {GraphFamily, GraphObject, GraphPerson} from "./gedcomx-extensions";
import {graphModel} from "./ModelGraph";
import {FamilyView, Person, ResourceReference} from "gedcomx-js";

export enum ViewMode {
  DEFAULT = "",
  ALL = "all",
  LIVING = "living",
  ANCESTORS = "ancestors",
  DESCENDANTS = "descendants"
}

export class ViewGraph {
  nodes: GraphObject[] = []
  links: { source, target }[]
  private startPersonValue: GraphPerson

  set startPerson(startPerson: Person | GraphPerson) {
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

  showNode = (node: GraphObject) => {
    if (this.isVisible(node)) {
      return false;
    }

    if (this.nodes.includes(node)) {
      console.assert(node.type.includes("-removed"));
      // @ts-ignore
      node.type = node.type.replace("-removed", "");
      return true;
    }

    node.viewId = this.nodes.length;
    this.nodes.push(node);
    return true;
  }

  hideNode = (node: GraphObject) => {
    if (!this.isVisible(node)) {
      return false;
    }

    node.type += "-removed";
    return true;
  }

  showLink = (source: GraphObject, target: GraphObject, swap = false) => {
    let existingLink = this.links.find(l => new Set([l.source, l.target, source, target]).size === 2);
    if (existingLink !== undefined) {
      return;
    }

    this.links.push({
      source: swap ? target.viewId : source.viewId,
      target: swap ? source.viewId : target.viewId
    })
  }

  /**
   * Called when user clicked on etc node.
   * @param family
   */
  showFamily = (family: FamilyView) => {
    let graphFamily = this.getGraphFamily(family);
    console.debug("Showing family:", graphFamily);
    graphFamily.type = "family";
    this.showNode(graphFamily);
    [family.getParent1(), family.getParent2()].forEach(id => this.showPerson(id, graphFamily, true));
    graphFamily.getChildren().forEach(id => this.showPerson(id, graphFamily, false));
  }

  hideFamily = (family: GraphFamily) => {
    if (family.involvesPerson(this.startPerson.data.getId())) {
      console.warn("Initial families cannot be removed!");
      return;
    }

    console.groupCollapsed("Hiding family:", family.toString());

    // find all leaves, e.g. all nodes who are not connected to other families
    let leaves = family.getMembers()
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
          // this happens when the node type is not caught, e.g. when the node was previously hidden (type-removed)
          return false;
      }
    }).forEach(this.hideNode);

    // remove links from the graph
    leaves = leaves.map(l => l.viewId);
    this.links = this.links.filter(link => {
      return !(leaves.includes(link.source.viewId)) && !(leaves.includes(link.target.viewId));
    });

    console.groupEnd();
  }

  private isVisible = (node) => {
    return this.nodes.includes(node) && !(node.type.includes("removed"));
  }

  private showPerson = (p: ResourceReference, graphFamily: GraphFamily, isParent: boolean) => {
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

  private getGraphPerson = (person: Person | ResourceReference): GraphPerson => {
    if (person instanceof ResourceReference) {
      person = graphModel.getPersonById(person);
    }

    return this.nodes.find(n => n instanceof GraphPerson && n.equals((person as Person).getDisplay())) as GraphPerson
      || person.getDisplay() as GraphPerson;
  }

  private getGraphFamily = (family: FamilyView): GraphFamily => {
    let graphFamily = this.nodes.find(n => (n.type === "family" || n.type === "etc") && (n as GraphFamily).equals(family));
    if (graphFamily === undefined) {
      console.debug("Adding new family to view", family, this.nodes.filter(n => n.type === "family"))
      graphFamily = new GraphFamily(family)
    }

    return graphFamily as GraphFamily;
  }
}

let viewGraph = new ViewGraph();

export default viewGraph;
