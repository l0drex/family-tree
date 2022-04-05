import {config} from "../main.js";

export let viewGraph = {
  nodes: [],
  links: [],
  constraints: []
};
let people;
let families;
export let startPerson;


export function setData(data) {
  people = data.people;
  families = data.families;

  // add some necessary data
  people.forEach(person => {
    person.width = config.personNodeSize[0];
    person.height = config.personNodeSize[1];
    person.infoVisible = false;
    person.type = "person";
    // translate old-style gender attribute
    if (person.gender === "männlich") {
      person.gender = "male";
    } else if (person.gender === "weiblich") {
      person.gender = "female";
    }
  });

  families.forEach(family => {
    family.height = family.width = config.margin * 2;
    family.type = "family";
    family.members = family.partners.concat(family.children);
  });
}

export function setStartPerson(id) {
  if (!people.length || !families.length) {
    throw "Start person can not be defined before data is loaded!";
  }

  startPerson = people[id];
  console.info("Starting graph with", startPerson.fullName);

  // find generations
  addGenerations(startPerson, 0);
  let unknownGeneration = people.filter(p => !p.generation && p.generation !== 0);
  unknownGeneration.forEach(person => {
    let partners = getPartners(person).filter(p => p.generation || p.generation === 0);
    if (partners.length) {
      addGenerations(person, partners[0].generation);
    }
  });
  // check that now everyone has a generation
  unknownGeneration = unknownGeneration.filter(p => !p.generation && p.generation !== 0 && p.id);
  console.assert(unknownGeneration.length <= 0, "Some people have no generation defined", unknownGeneration);

  estimateAges();
  startPerson.infoVisible = true;

  families.filter(f => f.members.includes(startPerson.id))
    .forEach(p => showFamily(p));

  return id;
}

/**
 * Adds generation numbers to all connected people
 * @param person the person from whom to start the search
 * @param generation generation of the person
 */
function addGenerations(person, generation) {
  if (person.generation) {
    console.assert(person.generation === generation, `Generations dont match for ${person.fullName}: ${person.generation} <- ${generation}`);
    return;
  }

  person.generation = generation;
  getParents(person).forEach(p => addGenerations(p, generation + 1));
  getChildren(person).forEach(c => addGenerations(c, generation - 1));
}

/**
 * Estimate age to mark dead people as dead without knowing birth or death dates,
 * assuming each generation is around 25 years apart.
 */
function estimateAges() {
  // add the age of anyone in gen 0 to the estimated age
  let sameGeneration = people.filter(p => p.generation === 0 && p.birthday);
  if (!sameGeneration.length) {
    console.warn("Age estimation failed because no person with a given age in generation 0 could be found!");
    return;
  }

  let offset = new Date().getFullYear() - sameGeneration[0].birthday.substring(6, 10);

  people.filter(p => !p.age && (p.generation || p.generation === 0)).forEach(p => {
    p.age = offset + p.generation * 25;
    p.dead = p.dead || p.age > 120;
  });
}

/**
 * Returns the parents of a person
 * @param person
 * @return {*[]}
 */
function getParents(person) {
  let family = families.find(f => f.children.includes(person.id));
  if (!family) {
    return [];
  }
  return family.partners.map(id => people[id]);
}

/**
 * Returns the children of a person
 * @param person
 * @return {[*]}
 */
function getChildren(person) {
  let parentFamilies = families.filter(f => f.partners.includes(person.id));
  if (!parentFamilies.length) {
    return [];
  }

  let children = [];
  parentFamilies.forEach(family => {
    children = children.concat(family.children.map(id => people[id]));
  });
  return children;
}

function getPartners(person) {
  let parentFamilies = families.filter(f => f.partners.includes(person.id));
  if (!parentFamilies.length) {
    return [];
  }

  let partners = [];
  parentFamilies.forEach(family => {
    partners = partners.concat(family.partners.filter(p => p !== person.id).map(id => people[id]));
  });
  return partners;
}

function addToConstraints(person) {
  let index = 50 + person.generation;
  let constraint = viewGraph.constraints[index];
  if (!constraint) {
    console.log("Adding new constraint for gen", person.generation);
    constraint = {
      type: "alignment",
      axis: "y",
      generation: person.generation,
      offsets: []
    };
  }

  let offset = {
    node: person.viewId,
    offset: 0
  };

  if (!(constraint.offsets.includes(offset))) {
    constraint.offsets.push(offset);
  }

  viewGraph.constraints[index] = constraint;
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

  if (node.type === "person") {
    addToConstraints(node);
  }



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

/**
 * Adds a family and its direct members to the view.
 * Adds etc-nodes to members where applicable.
 * @param family
 */
export function showFamily(family) {
  console.groupCollapsed(`Adding new family ${family.partners}`);

  // array containing the view graph ids of the partners
  if (family.members.includes(0)) {
    console.warn("Person \"Unknown\" is in the family!");
  }

  // replace existing etc-node with a family node
  family.type = family.type.replace("etc", "family");
  showNode(family);

  family.members.forEach(p => {
    let person = people[p];

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
    let otherFamilies = families.filter(f => f.members.includes(p) && !(isVisible(f)));
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
      let person = people[p];
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
          !(leaves.includes(person)) && (typeof people[person].viewId === "number" && people[person].type === "person"));
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
  leaves = leaves.map(id => people[id].viewId);
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
  return people.find(person => person.fullName.toLowerCase().includes(name));
}

/**
 * Returns true if the node is visible
 * @param node
 * @returns {boolean}
 */
function isVisible(node) {
  return viewGraph.nodes.includes(node) && !(node.type.includes("removed"));
}
