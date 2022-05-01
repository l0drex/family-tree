import {config} from "../main.js";

export let viewGraph = {
  nodes: [],
  links: []
};
let persons = [];
persons.findById = (id) => {
  if (typeof id === "string") {
    return persons.find(p => p.data.id === id)
  }
  // TODO use isInstance()
  if (id._gedxClass === "GedcomX.ResourceReference") {
    return persons.find(p => id.matches(p.data.id))
  }
}
let relationships = [];
export let startPerson;

function toGraphObject(object, type) {
  // TODO initialize graph objects only in viewGraph
  let graphObject;
  switch (type) {
    case "person":
      graphObject = {
        width: config.gridSize * 5,
        height: config.gridSize,
        type: "person",
        data: object
      };
      break;
    case "family":
      graphObject = {
        height: config.margin * 2,
        width: config.margin * 2,
        type: "family",
        data: object
      }
      break
    default:
      console.error("unknown type", type);
      break;
  }

  return graphObject;
}

export function setData(data) {
  // add some necessary data
  data.persons.forEach(p => persons.push(toGraphObject(p, "person")));
  data.relationships.forEach(r => relationships.push(toGraphObject(r, "family")));
}

export function setStartPerson(id) {
  if (!persons.length || !relationships.length) {
    throw "Start person can not be defined before data is loaded!";
  }

  startPerson = persons.findById(id);
  console.info("Starting graph with", startPerson.data.getFullName());

  // find generations
  addGenerations(startPerson, 0);
  let unknownGeneration = persons.filter(p => p.data.getGeneration() === undefined);
  unknownGeneration.forEach(p => {
    let partners = getPartners(p).filter(p => p.data.getGeneration() || p.data.getGeneration() === 0);
    if (partners.length) {
      addGenerations(p, partners[0].data.getGeneration());
    }
  });
  // check that now everyone has a generation
  unknownGeneration = unknownGeneration.filter(p => !p.data.getGeneration() && p.data.getGeneration() !== 0 && p.data.id);
  console.assert(unknownGeneration.length <= 0, "Some people have no generation defined", unknownGeneration);

  if (false) {
    showFullGraph();
    return id;
  }

  let families = relationships.filter(r => r.data.isCouple() && r.data.involvesPerson(id))
  families.forEach(showFamily);

  return id;
}

/**
 * Adds generation numbers to all connected people
 * @param person the person from whom to start the search
 * @param generation generation of the person
 */
function addGenerations(person, generation) {
  if (person.data.getGeneration()) {
    console.assert(person.data.getGeneration() === generation,
      `Generations dont match for ${person.data.getFullName()}: ${person.data.getGeneration()} <- ${generation}`);

    return;
  }

  person.data.setGeneration(generation);
  getParents(person).forEach(p => addGenerations(p, generation + 1));
  getChildren(person).forEach(c => addGenerations(c, generation - 1));
}

/**
 * Returns the parents of a person
 * @param person
 * @return {*[]}
 */
function getParents(person) {
  return relationships
    .filter(r => r.data.isParentChild() && r.data.person2.matches(person.data.id))
    .map(r => persons.findById(r.data.person1))
    .filter(p => p.data.getFullName() !== "unknown");
}

/**
 * Returns the children of a person
 * @param person
 * @return {[*]}
 */
function getChildren(person) {
  return relationships
    .filter(r => r.data.isParentChild() && r.data.person1.matches(person.data.id))
    .map(r => persons.findById(r.data.person2))
    .filter(p => p.data.getFullName() !== "unknown");
}

function getPartners(person) {
  return relationships
    .filter(r => r.data.isCouple() &&
      r.data.involvesPerson(person.data))
    .map(r => persons.findById(r.data.getOtherPerson(person.data)))
    .filter(p => p.data.getFullName() !== "unknown");
}

/**
 * Adds the node to the view
 * @param node
 * @returns {boolean} true if the node is now visible
 */
function showNode(node) {
  if (viewGraph.nodes.includes(node)) {
    if (node.type.includes("removed")) {
      node.type = node.type.replace("-removed", "");
      return true;
    }

    return false;
  }

  node.viewId = viewGraph.nodes.length;
  viewGraph.nodes.push(node);

  return true;
}

/**
 * Hides the node from the view
 * @param node
 * @return {boolean} true if the node is now invisible
 */
function hideNode(node) {
  if (node.type.includes("removed")) {
    return false;
  }

  node.type += "-removed";
  return true;
}


function showCouple(couple) {
  let members = couple.data.getMembers().map(id => persons.findById(id));
  let visibleMembers = members.filter(isVisible);
  if (!visibleMembers.length) {
    return;
  } else if (visibleMembers.length === 1) {
    couple.type = "etc";
  } else {
    couple.type = "family";
  }
  showNode(couple);

  visibleMembers.forEach(p => {
    if (p.data.getFullName() === "unknown") {
      return
    }
    viewGraph.links.push({
      "source": p.viewId,
      "target": couple.viewId
    });
  })
}


function addChild(parentChild) {
  let families = relationships.filter(r => r.data.isCouple());

  let childId = parentChild.data.person2;
  let child = persons.findById(childId);
  let parentIds = getParents(persons.findById(childId)).map(p => p.data);
  let family = families.find(f => (f.data.involvesPerson(parentIds[0]) && f.data.involvesPerson(parentIds[1])));

  if (!isVisible(child)) {
    if (!isVisible(family) || family.type === "etc") {
      return;
    }
    showNode(child);
    let familiesOfChild = families.filter(f => f.data.involvesPerson(child.data));
    if (familiesOfChild.length) {
      familiesOfChild.forEach(showCouple);
    }
  }

  console.assert(family, "no family found for " + childId)
  if (!isVisible(family)) {
    family.type = "etc";
    showNode(family);
  }
  let link = {
    "source": family.viewId,
    "target": child.viewId
  }
  if (!viewGraph.links.find(l => l.source === link.source && l.target === link.target)) {
    viewGraph.links.push(link);
  }
}


function showFullGraph() {
  persons.forEach(showNode);
  relationships.filter(r => r.data.isCouple()).forEach(showCouple);
  relationships.filter(r => r.data.isParentChild()).forEach(addChild);
}

/**
 * Adds a family and its direct members to the view.
 * Adds etc-nodes to members where applicable.
 * @param couple
 */
export function showFamily(couple) {
  console.groupCollapsed(`Adding family ${couple.data}`);

  couple.data.getMembers().map(id => persons.findById(id)).forEach(showNode);

  showCouple(couple);
  relationships.filter(r => r.data.isParentChild()).forEach(addChild);

  console.groupEnd();
  return viewGraph;
}

/**
 * Hides a family from the view
 * @param family
 */
export function hideFamily(family) {
  if (family.data.involvesPerson(startPerson.data)) {
    console.warn("Initial families cannot be removed!");
    return new Promise(resolve => resolve(viewGraph, startPerson));
  }

  console.groupCollapsed(`Hiding family ${family.data}`);

  // find all leaves, e.g. all nodes who are not connected to other families
  let parents = family.data.getMembers().map(persons.findById);
  // TODO potentially unsafe
  let children = getChildren(persons.findById(family.data.person1));

  let leaves = parents.concat(children).filter(person => {
      // check if the node is connected to two families
      let linksToFamilies = viewGraph.links.filter(link => {
        let nodes = [link.source, link.target];
        if (!(nodes.includes(person))) {
          return false;
        }
        // remove family and person node
        nodes = nodes.filter(n => n.type === "family");
        return nodes.length;
      });
      return linksToFamilies.length <= 1;
    }
  );
  console.debug("Removing the following people:", leaves.map(l => l.data.getFullName()));

  // remove nodes from the graph
  viewGraph.nodes.filter(node => {
    if (!(isVisible(node))) {
      return false;
    }

    switch (node.type) {
      case "person":
        return leaves.find(l => l.data.id === node.data.id);
      case "etc":
        // FIXME
        let visibleMembers = node.data.getMembers()
          .map(persons.findById);
        let children = getChildren(persons.findById(node.data.person1));
        visibleMembers = visibleMembers.concat(children);
        return visibleMembers.filter(p => !leaves.includes(p) && isVisible(p)).length === 0;
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
  }).forEach(hideNode);

  // remove links from the graph
  leaves = leaves.map(l => l.viewId);
  viewGraph.links = viewGraph.links.filter(link => {
    return !(leaves.includes(link.source.viewId)) && !(leaves.includes(link.target.viewId));
  });

  console.groupEnd();
  return viewGraph;
}

/**
 * Searches for a person in the data. The person does not have to be visible.
 * If more than one person matches the name, it returns one of them.
 * @param name {string} the full name of the person, or a part of it
 * @returns person
 */
export function findPerson(name) {
  return persons.find(person => person.data.getFullName().toLowerCase().includes(name));
}

/**
 * Returns true if the node is visible
 * @param node
 * @returns {boolean}
 */
function isVisible(node) {
  return viewGraph.nodes.includes(node) && !(node.type.includes("removed"));
}