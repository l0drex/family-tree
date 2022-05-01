export let viewGraph = {
  nodes: [],
  links: []
};
let persons = [];
persons.findById = (id) => persons.find(p => p.data.id === id)
let relationships = [];
export let startPerson;


export function setData(data) {
  // add some necessary data
  data.persons.forEach(p => persons.push(p.toGraphObject()));
  data.relationships.forEach(r => relationships.push(r.toGraphObject()));
}

export function setStartPerson(id) {
  if (!persons.length || !relationships.length) {
    throw "Start person can not be defined before data is loaded!";
  }

  startPerson = persons.findById(id);
  console.info("Starting graph with", startPerson.data.fullName);

  // find generations
  addGenerations(startPerson, 0);
  let unknownGeneration = persons.filter(p => p.data.generation === undefined);
  unknownGeneration.forEach(p => {
    let partners = getPartners(p).filter(p => p.data.generation || p.data.generation === 0);
    if (partners.length) {
      addGenerations(p, partners[0].data.generation);
    }
  });
  // check that now everyone has a generation
  unknownGeneration = unknownGeneration.filter(p => !p.data.generation && p.data.generation !== 0 && p.data.id);
  console.assert(unknownGeneration.length <= 0, "Some people have no generation defined", unknownGeneration);

  if (false) {
    showFullGraph();
    return id;
  }

  let families = relationships.filter(r => r.data.isCouple && r.data.members.includes("#" + id))
  families.forEach(showFamily);

  return id;
}

/**
 * Adds generation numbers to all connected people
 * @param person the person from whom to start the search
 * @param generation generation of the person
 */
function addGenerations(person, generation) {
  if (person.data.generation) {
    console.assert(person.data.generation === generation,
      `Generations dont match for ${person.data.fullName}: ${person.data.generation} <- ${generation}`);

    return;
  }

  person.data.generation = generation;
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
    .filter(r => r.data.isParentChild && r.data.person2.resource === "#" + person.data.id)
    .map(r => persons.findById(r.data.person1.resource.substring(1)))
    .filter(p => p.data.fullName !== "unknown");
}

/**
 * Returns the children of a person
 * @param person
 * @return {[*]}
 */
function getChildren(person) {
  return relationships
    .filter(r => r.data.isParentChild && r.data.person1.resource === "#" + person.data.id)
    .map(r => persons.findById(r.data.person2.resource.substring(1)))
    .filter(p => p.data.fullName !== "unknown");
}

function getPartners(person) {
  return relationships
    .filter(r => r.data.isCouple &&
      r.data.members.includes("#" + person.data.id))
    .map(r => persons.findById(r.data.members.find(m => m !== "#" + person.data.id).substring(1)))
    .filter(p => p.data.fullName !== "unknown");
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
  let members = couple.data.members.map(id => persons.findById(id.substring(1)));
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
    if (p.data.fullName === "unknown") {
      return
    }
    viewGraph.links.push({
      "source": p.viewId,
      "target": couple.viewId
    });
  })
}


function addChild(parentChild) {
  let families = relationships.filter(r => r.data.isCouple);

  let childId = parentChild.data.person2.resource.substring(1);
  let child = persons.findById(childId);
  let parentIds = getParents(persons.findById(childId)).map(p => "#" + p.data.id)
  let family = families.find(f => (f.data.members.includes(parentIds[0]) && f.data.members.includes(parentIds[1])));

  if (!isVisible(child)) {
    if (!isVisible(family) || family.type === "etc") {
      return;
    }
    showNode(child);
    let familiesOfChild = families.filter(f => f.data.members.includes("#" + childId));
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
  relationships.filter(r => r.data.isCouple).forEach(showCouple);
  relationships.filter(r => r.data.isParentChild).forEach(addChild);
}

/**
 * Adds a family and its direct members to the view.
 * Adds etc-nodes to members where applicable.
 * @param person
 */
export function showFamily(couple) {
  console.groupCollapsed(`Adding family ${couple.data}`);

  couple.data.members.map(id => persons.findById(id.substring(1)))
    .forEach(showNode);

  showCouple(couple);
  relationships.filter(r => r.data.isParentChild).forEach(addChild);

  console.groupEnd();
  return viewGraph;
}

/**
 * Hides a family from the view
 * @param family
 */
export function hideFamily(family) {
  if (family.data.members.includes("#" + startPerson.data.id)) {
    console.warn("Initial families cannot be removed!");
    return new Promise(resolve => resolve(viewGraph, startPerson));
  }

  console.groupCollapsed(`Hiding family ${family.data}`);

  // find all leaves, e.g. all nodes who are not connected to other families
  let parents = family.data.members;
  let children = persons.filter(child => {
    return relationships.find(r => r.data.person2.resource === "#" + child.data.id && parents.includes(r.data.person1.resource))
  }).map(p => "#" + p.data.id);

  let leaves = parents.concat(children).filter(id => {
      let person = persons.findById(id.substring(1));
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
  console.debug("Removing the following people:", leaves);

  // remove nodes from the graph
  viewGraph.nodes.filter(node => {
    if (!(isVisible(node))) {
      return false;
    }

    switch (node.type) {
      case "person":
        return leaves.includes("#" + node.data.id);
      case "etc":
        let visibleMembers = node.data.members.filter(personId => {
          let person = persons.findById(personId.substring(1))
          return !(leaves.includes("#" + personId)) && (typeof person.viewId === "number" && person.type === "person");
        });
        return visibleMembers.length === 0;
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
  }).forEach(p => hideNode(p));

  // remove links from the graph
  leaves = leaves.map(id => persons.findById(id.substring(1)).viewId);
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
  return persons.find(person => person.data.fullName.toLowerCase().includes(name));
}

/**
 * Returns true if the node is visible
 * @param node
 * @returns {boolean}
 */
function isVisible(node) {
  return viewGraph.nodes.includes(node) && !(node.type.includes("removed"));
}
