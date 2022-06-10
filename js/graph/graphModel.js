import {config, showWarning} from "../main.js";

export const view = {ALL: "all", LIVING: "living", ANCESTORS: "ancestors", DESCENDANTS: "descendants"}

export let viewGraph = {
  nodes: [],
  links: []
};
let persons = [];
persons.findById = (id) => {
  if (typeof id === "string") {
    return persons.find(p => p.data.id === id)
  }
  if (id instanceof GedcomX.ResourceReference) {
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
  console.log("Found", data.persons.length, "people", data.persons);
  console.log("Found", data.relationships.length, "relationships", data.relationships);
  // add some necessary data
  data.persons.forEach(p => persons.push(toGraphObject(p, "person")));
  data.relationships.forEach(r => relationships.push(toGraphObject(r, "family")));
}

export let ageGen0;
export function setStartPerson(id, activeView) {
  if (!persons.length || !relationships.length) {
    throw "Start person can not be defined before data is loaded!";
  }

  startPerson = persons.findById(id);
  console.info("Starting graph with", startPerson.data.getFullName());

  persons.forEach(p => {
    if (p.data.getGeneration() === startPerson.data.getGeneration()) {
      if (!ageGen0 && p.data.getGeneration() === startPerson.data.getGeneration() && p.data.getAge()) {
        ageGen0 = p.data.getAge();
      }
    }
  });

  if (activeView === null) {
    activeView = "";
  }
  switch (activeView) {
    case view.ALL:
      console.groupCollapsed("Showing full graph");
      if (persons.length >= 100) {
        showWarning({
          en: "The graph is very big, the site mite get slow",
          de: "Der Graph ist sehr groß, die Seite wird möglicherweise langsam"
        }, "big graph");
      }
      show(persons);
      console.groupEnd();
      break;
    case view.LIVING: {
      console.groupCollapsed(`Showing all living relatives`);
      let livingRelatives = getAncestors(startPerson)
        .concat(getDescendants(startPerson))
        .filter(p => !p.data.isDead());
      show(livingRelatives);
      console.groupEnd();
      break;
    }
    case view.ANCESTORS:
      console.groupCollapsed(`Showing all ancestors of ${startPerson.data.getFullName()}`);
      show(getAncestors(startPerson));
      console.groupEnd();
      break;
    case view.DESCENDANTS:
      console.groupCollapsed(`Showing all descendants of ${startPerson.data.getFullName()}`);
      show(getDescendants(startPerson));
      console.groupEnd();
      break;
    default: {
      console.log("Showing explorable graph");
      let familyMembers = getParents(startPerson)
        .concat(getChildren(startPerson))
        .concat(getPartners(startPerson));
      show(familyMembers);
    }
  }
}

function show(persons) {
  persons.forEach(showNode);
  relationships.filter(r => r.data.isCouple()).forEach(showCouple);
  relationships.filter(r => r.data.isParentChild()).forEach(addChild);
}

/**
 * Returns the parents of a person
 * @param person
 * @return {*[]}
 */
function getParents(person) {
  return relationships
    .filter(r => r.data.isParentChild() && r.data.person2.matches(person.data.id))
    .map(r => persons.findById(r.data.person1));
}

/**
 * Returns the children of a person
 * @param person
 * @return {[*]}
 */
function getChildren(person) {
  return relationships
    .filter(r => r.data.isParentChild() && r.data.person1.matches(person.data.id))
    .map(r => persons.findById(r.data.person2));
}

/**
 * Returns the partners of a person
 * @param person
 * @returns {*[]}
 */
function getPartners(person) {
  return relationships
    .filter(r => r.data.isCouple() &&
      r.data.involvesPerson(person.data))
    .map(r => persons.findById(r.data.getOtherPerson(person.data)));
}

function getAncestors(person) {
  // stack to collect ancestors of ancestors
  let ancestors = [person];
  let index = 0;
  while (index < ancestors.length) {
    getParents(ancestors[index]).filter(p => !ancestors.includes(p)).forEach(p => ancestors.push(p))
    index++;
  }
  return ancestors;
}

function getDescendants(person) {
  // stack to collect descendants of descendants
  let descendants = [person];
  let index = 0;
  while (index < descendants.length) {
    getChildren(descendants[index]).filter(p => !descendants.includes(p)).forEach(p => descendants.push(p))
    index++;
  }
  descendants.forEach(d => getPartners(d).forEach(p => descendants.push(p)));
  return descendants;
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
  console.debug("Adding couple", couple.data.toString())
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
    console.debug("Adding child", child.data.getFullName());
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
  if (!viewGraph.links.find(
    l => l.source === link.source && l.target === link.target ||
      l.source === family && l.target === child)) {
    viewGraph.links.push(link);
  }
}

/**
 * Adds a family and its direct members to the view.
 * Adds etc-nodes to members where applicable.
 * @param couple
 */
export function showFamily(couple) {
  console.groupCollapsed("Adding family:", couple.data.toString());

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

  console.groupCollapsed("Hiding family:", family.data.toString());

  // find all leaves, e.g. all nodes who are not connected to other families
  let parents = family.data.getMembers().map(persons.findById);
  let children1 = getChildren(persons.findById(family.data.person1));
  let children2 = getChildren(persons.findById(family.data.person2));
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
  viewGraph.nodes.filter(node => {
    if (!(isVisible(node))) {
      return false;
    }

    switch (node.type) {
      case "person":
        return leaves.find(l => l.data.id === node.data.id);
      case "etc":
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

export function getPersonPath(person) {
  let entries = [];
  let child = getChildren(person).sort((a, b) => isVisible(b) - isVisible(a))[0];
  let parent = getParents(person).sort((a, b) => isVisible(b) - isVisible(a))[0];

  if (parent) entries.push(parent);
  entries.push(person);
  if (child) entries.push(child);

  return entries;
}

/**
 * Returns true if the node is visible
 * @param node
 * @returns {boolean}
 */
function isVisible(node) {
  return viewGraph.nodes.includes(node) && !(node.type.includes("removed"));
}
