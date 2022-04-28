export let viewGraph = {
  nodes: [],
  links: []
};
let persons = [];
let relationships = [];
// list of couples
let families = []
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

  showFullGraph(startPerson);
  return id;

  let relatedPeople = relationships.filter(r => r.data.members.includes("#" + startPerson.data.id));
  relatedPeople.forEach(showFamily);

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
  let leftPartners = relationships
    .filter(r =>
      r.data.isCouple && r.data.person2.resource === "#" + person.data.id)
    .map(r => persons.find(p => "#" + p.data.id === r.data.person1.resource));
  let rightPartners = relationships
    .filter(r =>
      r.data.isCouple && r.data.person1.resource === "#" + person.data.id)
    .map(r => persons.find(p => "#" + p.data.id === r.data.person2.resource));

  return leftPartners.concat(rightPartners)
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

function showFullGraph() {
  persons.forEach(showNode);

  let couples = relationships.filter(r => r.data.isCouple)
  couples.forEach(r => {
    showNode(r);
    families.push(r);
    viewGraph.links.push({
      "source": persons.find(p => "#" + p.data.id === r.data.person1.resource).viewId,
      "target": r.viewId
    });
    viewGraph.links.push({
      "source": persons.find(p => "#" + p.data.id === r.data.person2.resource).viewId,
      "target": r.viewId
    });
  });

  let parentChildren = relationships.filter(r => r.data.isParentChild)
  parentChildren.forEach(r => {
    let parentId = r.data.person1.resource, childId = r.data.person2.resource;
    let family = couples.find(c => c.data.members.includes(parentId));
    console.assert(family, parentId, childId)
    let link = {
      "source": family,
      "target": persons.find(p => p.data.id === childId.substring(1))
    }
    if (!viewGraph.links.includes(link)) {
      viewGraph.links.push(link);
    }
  });
}

/**
 * Adds a family and its direct members to the view.
 * Adds etc-nodes to members where applicable.
 * @param family
 */
export function showFamily(family) {
  console.groupCollapsed(`Adding new family ${family}`);

  // array containing the view graph ids of the partners
  if (family.data.members.includes("#0")) {
    console.warn("Person \"Unknown\" is in the family!");
  }

  // replace existing etc-node with a family node
  family.type = family.type.replace("etc", "family");
  showNode(family);

  family.members.forEach(p => {
    let person = persons[p];

    // add all people in the family
    if (!showNode(person)) {
      return;
    }

    let familyLink;
    if (family.partners.includes(p)) {
      familyLink = {
        source: person.viewId,
        target: family.viewId
      };
    } else {
      familyLink = {
        source: family.viewId,
        target: person.viewId
      };
    }
    viewGraph.links.push(familyLink);

    // add etc-node
    let otherFamilies = relationships.filter(f => f.members.includes(p) && !(isVisible(f)));
    console.assert(otherFamilies.length <= 1, "There seems to be more than one etc-node!", otherFamilies);
    if (otherFamilies.length) {
      console.debug("Adding etc for", person.fullName);
      otherFamilies.forEach(family => {
        family.type = "etc";

        if (family.children.includes(p) && person.married) {
          showNode(family);
          viewGraph.links.push({
            source: family.viewId,
            target: person.viewId
          });
        } else if (family.partners.includes(p) && person.parentsKnown) {
          showNode(family);
          viewGraph.links.push({
            source: person.viewId,
            target: family.viewId
          });
        }
      });
    }
  });
  console.groupEnd();

  return new Promise(resolve => resolve(viewGraph));
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
