import GedcomX from "./gedcomx";
import config from "../config";
import {graphModel} from "./ModelGraph";

export enum view {
    DEFAULT = "",
    ALL = "all",
    LIVING = "living",
    ANCESTORS = "ancestors",
    DESCENDANTS = "descendants"
}
export interface GraphObject {
    type
    width
    height
    viewId
    data
}
export class GraphPerson implements GraphObject {
    type = "person"
    data: GedcomX.Person
    width = config.gridSize * 5
    height = config.gridSize
    viewId

    constructor(data) {
        this.data = data;
    }
}
export class GraphFamily implements GraphObject {
    type = "family"
    data: GedcomX.Relationship
    width = config.margin * 2
    height = config.margin * 2
    viewId

    constructor(data: GedcomX.Relationship) {
        this.data = data
    }
}

export class ViewGraph {
    nodes: (GraphPerson | GraphFamily)[] = []
    links: {source, target}[]

    reset = () => {
        this.nodes = [];
        this.links = [];
    }

    showNode = (node: GraphObject) => {
        if (this.nodes.includes(node)) {
            if (node.type.includes("removed")) {
                node.type = node.type.replace("-removed", "");
                return true;
            }

            return false;
        }

        node.viewId = this.nodes.length;
        this.nodes.push(node);

        return true;
    }

    hideNode = (node: GraphObject) => {
        if (node.type.includes("removed")) {
            return false;
        }

        node.type += "-removed";
        return true;
    }

    showCouple = (couple: GraphFamily) => {
        console.debug("Adding couple", couple.data.toString())
        let members = couple.data.getMembers().map(id => graphModel.findById(id));
        let visibleMembers = members.filter(this.isVisible);
        if (!visibleMembers.length) {
            return;
        } else if (visibleMembers.length === 1) {
            couple.type = "etc";
        } else {
            couple.type = "family";
        }
        this.showNode(couple);

        visibleMembers.forEach(p => {
            this.links.push({
                "source": p.viewId,
                "target": couple.viewId
            });
        })
    }

    addChild = (parentChild) => {
        let families = graphModel.relationships.filter(r => r.data.isCouple());

        let childId = parentChild.data.person2;
        let child = graphModel.findById(childId);
        let parentIds = graphModel.getParents(graphModel.findById(childId)).map(p => p.data);
        let family = families.find(f => (f.data.involvesPerson(parentIds[0]) && f.data.involvesPerson(parentIds[1])));

        if (!this.isVisible(child)) {
            if (!this.isVisible(family) || family.type === "etc") {
                return;
            }
            console.debug("Adding child", child.data.getFullName());
            this.showNode(child);
            let familiesOfChild = families.filter(f => f.data.involvesPerson(child.data));
            if (familiesOfChild.length) {
                familiesOfChild.forEach(this.showCouple);
            }
        }

        console.assert(family, "no family found for " + childId)
        if (!this.isVisible(family)) {
            family.type = "etc";
            this.showNode(family);
        }
        let link = {
            "source": family.viewId,
            "target": child.viewId
        }
        if (!this.links.find(
            l => (l.source === link.source && l.target === link.target) ||
                (l.source === family && l.target === child))) {
            this.links.push(link);
        }
    }

    showFamily = (couple) => {
        console.debug(couple)
        console.groupCollapsed("Adding family:", couple.data.toString());

        couple.data.getMembers().map(graphModel.findById).forEach(this.showNode);

        this.showCouple(couple);
        graphModel.relationships.filter(r => r.data.isParentChild()).forEach(this.addChild);

        console.groupEnd();
    }

    hideFamily = (family) => {
        if (family.data.involvesPerson(graphModel.startPerson.data)) {
            console.warn("Initial families cannot be removed!");
            return;
        }

        console.groupCollapsed("Hiding family:", family.data.toString());

        // find all leaves, e.g. all nodes who are not connected to other families
        let parents = family.data.getMembers().map(graphModel.findById);
        let children1 = graphModel.getChildren(graphModel.findById(family.data.person1));
        let children2 = graphModel.getChildren(graphModel.findById(family.data.person2));
        let children = children1.concat(children2).filter(c => children1.includes(c) && children2.includes(c));

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
                    return leaves.find(l => l.data.id === node.data.id);
                case "etc":
                    let visibleMembers = node.data.getMembers()
                        .map(graphModel.findById);
                    let children = graphModel.getChildren(graphModel.findById(node.data.person1));
                    visibleMembers = visibleMembers.concat(children);
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
}

let viewGraph = new ViewGraph();

export default viewGraph;