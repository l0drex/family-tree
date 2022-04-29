export let viewGraph = {
  nodes: [],
  links: []
};
let persons = [];
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

  startPerson = persons.find(p => p.data.id === id);
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

  showFamily(startPerson);

  return id;
}

/**
 * Adds generation numbers to all connected people
 * @param person the person from whom to start the search
 * @param generation generation of the person
 */
function addGenerations(person, generation) {
  if (person.data.generation) {
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
    .map(r => persons.find(person => "#" + person.data.id === r.data.person1.resource));
}

/**
 * Returns the children of a person
 * @param person
 * @return {[*]}
 */
function getChildren(person) {
  return relationships
    .filter(r => r.data.isParentChild && r.data.person1.resource === "#" + person.data.id)
    .map(r => persons.find(person => "#" + person.data.id === r.data.person2.resource));
}

function getPartners(person) {
  return relationships
    .filter(r => r.data.isCouple &&
      r.data.members.includes("#" + person.data.id))
    .map(r => persons.find(p => "#" + p.data.id ===
      r.data.members.find(m => m !== "#" + person.data.id)));
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
  let members = couple.data.members.map(id => persons.find(p => id === "#" + p.data.id));
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
  let families = relationships.filter(r => r.data.isCouple);

  let childId = parentChild.data.person2.resource;
  let child = persons.find(p => "#" + p.data.id === childId);
  let parents = getParents(persons.find(p => "#" + p.data.id === childId)).map(p => "#" + p.data.id)
  let family = families.find(f => (f.data.members.includes(parents[0]) && f.data.members.includes(parents[1])));

  if (!isVisible(child)) {
    return;
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
 * @param asEtc
 */
export function showFamily(person, asEtc = false) {
  console.groupCollapsed(`Adding families of ${person.data.fullName}`);

  showNode(person);
  let parents = getParents(person);
  parents.forEach(showNode);
  let partners = getPartners(person);
  partners.forEach(showNode);
  let children = getChildren(person);
  children.forEach(showNode);

  // TODO outer partners (replace exisiting etc nodes with family nodes!)
  // TODO check if person is unknown

  relationships.filter(r => r.data.isCouple).forEach(showCouple);
  relationships.filter(r => r.data.isParentChild).forEach(addChild);

  console.groupEnd();
}

/**
 * Hides a family from the view
 * @param family
 */
export function hideFamily(family) {
  if (family.members.includes(startPerson.id)) {
    console.warn("Initial families cannot be removed!");
    return new Promise(resolve => resolve(viewGraph, startPerson));
  }

  console.groupCollapsed(`Hiding family ${family.partners}`);

  // find all leaves, e.g. all nodes who are not connected to other families
  let leaves = family.members.filter(p => {
      let person = persons[p];
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
        return leaves.includes(node.id);
      case "etc":
        let visibleMembers = node.members.filter(person =>
          !(leaves.includes(person)) && (typeof persons[person].viewId === "number" && persons[person].type === "person"));
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
  leaves = leaves.map(id => persons[id].viewId);
  viewGraph.links = viewGraph.links.filter(link => {
    return !(leaves.includes(link.source.viewId)) && !(leaves.includes(link.target.viewId));
  });

  console.groupEnd();
  return new Promise(resolve => resolve(viewGraph));
}

/**
 * Searches for a person in the data. The person does not have to be visible.
 * If more than one person matches the name, it returns one of them.
 * @param name {string} the full name of the person, or a part of it
 * @returns person
 */
export function findPerson(name) {
  return persons.find(person => person.fullName.toLowerCase().includes(name));
}

/**
 * Returns true if the node is visible
 * @param node
 * @returns {boolean}
 */
function isVisible(node) {
  return viewGraph.nodes.includes(node) && !(node.type.includes("removed"));
}
