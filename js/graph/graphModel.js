import {config, translationToString} from "../main.js";
import {personFactTypes} from "../gedcomx.js";

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

export const filter = {
  NO_DEAD: "no dead people",
  NO_ANCESTORS: "no ancestors",
  ONLY_DIRECT: "only direct relatives",
  NO_SIBLINGS: "no siblings",
  active: [],
  // use this function to translate the values above
  localize: function (value) {
    switch (value) {
      case filter.NO_DEAD:
        return translationToString({
          en: "no dead people",
          de: "keine Verstorbenen"
        });
      case filter.NO_ANCESTORS:
        return translationToString({
          en: "no ancestors",
          de: "keine Vorfahren"
        });
      case filter.ONLY_DIRECT:
        return translationToString({
          en: "only direct relatives",
          de: "nur direkte Verwandte"
        });
      case filter.NO_SIBLINGS:
        return translationToString({
          en: "no siblings",
          de: "keine Geschwister"
        });
    }
  },
  apply: function (person) {
    let filtered = false;
    if (filter.active.includes(filter.NO_DEAD)) {
      filtered = filtered || person.data.getFactsByType(personFactTypes.Death)[0];
      filtered = filtered || person.data.getAge() >= 120;
    }

    return !filtered;
  }
}

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

export function setStartPerson(id) {
  if (!persons.length || !relationships.length) {
    throw "Start person can not be defined before data is loaded!";
  }

  startPerson = persons.findById(id);
  console.info("Starting graph with", startPerson.data.getFullName());

  // find generations
  addGenerations(startPerson, 0);
  let unknownGeneration = persons.filter(p => p.data.getGeneration() === undefined);
  console.debug("Following people were not reached in first iteration", unknownGeneration.map(p => p.data.getFullName()))
  unknownGeneration.forEach(p => {
    let partners = getPartners(p).filter(p => p.data.getGeneration() || p.data.getGeneration() === 0);
    if (partners.length) {
      addGenerations(p, partners[0].data.getGeneration());
    }
  });
  persons.forEach(p => p.data.addGenerationFact());

  // check that now everyone has a generation
  unknownGeneration = unknownGeneration.filter(p => !p.data.getGeneration() && p.data.getGeneration() !== 0);
  console.assert(unknownGeneration.length <= 0,
    `${unknownGeneration.length} people have no generation defined!`,
    unknownGeneration.map(p => p.data.getFullName()));

  if (false) {
    showFullGraph();
    return;
  }

  let families = relationships.filter(r => r.data.isCouple() && r.data.involvesPerson(id));
  if (!families.length) {
    console.debug(`${startPerson.data.getFullName()} has no partner, Searching for parents`);
    let parents = relationships.filter(r => r.data.isParentChild() && r.data.person2.matches(id))
      .map(r => r.data.person1.resource);
    console.debug("Following parents were found:", parents);
    families = [relationships.find(r =>
      r.data.isCouple() && parents.includes(r.data.person1.resource) && parents.includes(r.data.person2.resource))];
  }
  console.assert(families.length > 0, "No families to show, graph will be empty!", families)
  families.forEach(showFamily);
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
  getParents(person).forEach(p => addGenerations(p, generation - 1));
  getChildren(person).forEach(c => addGenerations(c, generation + 1));
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

function getPartners(person) {
  return relationships
    .filter(r => r.data.isCouple() &&
      r.data.involvesPerson(person.data))
    .map(r => persons.findById(r.data.getOtherPerson(person.data)));
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

  if (node.type === "person" && !filter.apply(node)) {
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
  let visibleMembers = members.filter(isVisible).filter(filter.apply);
  console.debug(visibleMembers)
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
  // couple of parents
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
      family = true;
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


function showFullGraph() {
  console.groupCollapsed("Showing full graph");
  persons.forEach(showNode);
  relationships.filter(r => r.data.isCouple()).forEach(showCouple);
  relationships.filter(r => r.data.isParentChild()).forEach(addChild);
  console.groupEnd();
}

/**
 * Adds a family and its direct members to the view.
 * Adds etc-nodes to members where applicable.
 * @param couple
 */
export function showFamily(couple) {
  console.groupCollapsed("Adding family:", couple.data.toString());

  couple.data.getMembers().map(id => persons.findById(id))
    .forEach(showNode);

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
