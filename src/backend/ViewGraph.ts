import {GraphFamily, GraphObject, GraphPerson} from "./gedcomx-extensions";
import {graphModel} from "./ModelGraph";
import {FamilyView, Person} from "gedcomx-js";

export enum view {
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

  set startPerson(startPerson: Person|GraphPerson) {
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
      console.assert(node.type.includes("removed"));
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

  showLink = (source: number, target: number) => {
    this.links.push({
      source: source,
      target: target
    })
  }

  /**
   * Called when user clicked on etc node.
   * @param family
   */
  showFamily = (family: FamilyView) => {
    let graphFamily = this.getGraphFamily(family);
    console.debug("Showing family:", graphFamily);

    this.showNode(graphFamily);
    let parent1 = this.getGraphPerson(
      graphModel.getPersonById(
        graphFamily.getParent1()));
    this.showNode(parent1);
    this.showLink(parent1.viewId, graphFamily.viewId);

    let parent2 = this.getGraphPerson(
      graphModel.getPersonById(
        graphFamily.getParent2()));
    this.showNode(parent2);
    this.showLink(parent2.viewId, graphFamily.viewId)

    graphFamily.getChildren().forEach(c => {
      let child = this.getGraphPerson(graphModel.getPersonById(c));
      this.showNode(child);
      this.showLink(graphFamily.viewId,child.viewId)
    });

    console.groupEnd();
  }

  hideFamily = (family: GraphFamily) => {
    if (family.involvesPerson(this.startPerson.data.getId())) {
      console.warn("Initial families cannot be removed!");
      return;
    }

    console.groupCollapsed("Hiding family:", family.toString());

    // find all leaves, e.g. all nodes who are not connected to other families
    let parents: GraphPerson[] = family.getMembers().map(graphModel.getPersonById).map(this.getGraphPerson);
    let children1 = graphModel.getPersonsChildren(family.getParent1()).map(this.getGraphPerson);
    let children2 = graphModel.getPersonsChildren(family.getParent2()).map(this.getGraphPerson);
    let children: GraphPerson[] = children1.concat(children2).filter(c => children1.includes(c) && children2.includes(c));

    let leaves = parents.concat(children).filter(person => {
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
    console.debug("Removing the following people:", leaves.map(l => l.data.getFullName()));

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
            .map(graphModel.getPersonById);
          let children = graphModel.getPersonsChildren(graphModel.getPersonById((node as GraphFamily).getParent1()));
          visibleMembers = visibleMembers.concat(children);
          return visibleMembers.filter(p => !leaves.map(gp => gp.data).includes(p) && this.isVisible(p)).length === 0;
        case "family":
          // replace family that should be removed with an etc-node
          if (node === family) {
            node.type = "etc";
            console.debug("Replacing family with etc");
          }
          return false;
        default:
          // this happens when the node type is not caught, e.g. when the node was previously hidden (type-removed)
          console.warn("Unknown node type", node);
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

  isVisible = (node) => {
    return this.nodes.includes(node) && !(node.type.includes("removed"));
  }

  private getGraphPerson(person: Person): GraphPerson {
    let graphPerson = this.nodes.find(n => n.type === "person" && (n as GraphPerson).equals(person));
    if (graphPerson === undefined) {
      graphPerson = new GraphPerson(person);
    }

    return graphPerson as GraphPerson;
  }

  private getGraphFamily(family: FamilyView): GraphFamily {
    let graphFamily = this.nodes.find(n => n.type==="family" && (n as GraphFamily).equals(family));
    if (graphFamily === undefined) {
      console.debug("Adding new family to view", family, this.nodes.filter(n => n.type === "family"))
      graphFamily = new GraphFamily(family)
    }

    return graphFamily as GraphFamily;
  }
}

let viewGraph = new ViewGraph();

export default viewGraph;
