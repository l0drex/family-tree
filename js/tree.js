import {config, localize, showError, translationToString} from "./main.js";


let modelGraph, viewGraph = {nodes: [], links: []};

if (typeof cola === "undefined") {
  showError({
    en: "WebCola could not be loaded. The family tree will not work!",
    de: "WebCola konnten nicht geladen werden. Der Stammbaum wird nicht funktionieren!"
  }, "cola");
}

if (typeof d3 === "undefined") {
  showError({
    en: "d3 could not be loaded. The family tree will not work.",
    de: "d3 konnte nicht geladen werden. Der Stammbaum wird nicht funktionieren!"
  }, "d3");
}

const svg = d3.select("#family-tree");
// setup of cola
const viewportSize = [svg.node().getBBox().width, svg.node().getBBox().height];
const d3cola = cola.d3adaptor(d3)
  .flowLayout("y", (l) => l.target.type === "family" ? 0 : 60)
  .symmetricDiffLinkLengths(40)
  .avoidOverlaps(true)
  .size(viewportSize);

let nodesLayer, linkLayer, vis, focusNode, startNode;
// catch the transformation events
svg.select("#background")
  .call(d3.zoom().on("zoom", transform));

// define layers
vis = svg.select("#vis");
linkLayer = vis.select("#links");
nodesLayer = vis.select("#nodes");

// form functionality

let inputName = d3.select("#input-name");
inputName.attr("placeholder", translationToString({
  "en": "John Doe",
  "de": "Max Mustermann"
}));

let form = d3.select("#name-form");
form.on("input", () => {
  // remove error style when input is empty
  if (!inputName.node().value)
    d3.select(".search").classed("error", false);
});

// search for the person and reload the page with the persons' id as search-param
form.on("submit", () => {
  d3.event.preventDefault();

  if (!modelGraph) {
    console.error("Graph has not been loaded yet!");
    return;
  }

  let name = inputName.node().value;
  // if no name was given, reload the page with no param -> uses the default: id=1
  let id = "";
  if (name) {
    // find a person that matches the given name
    let person = modelGraph.nodes.filter(n => n.type === "person")
      .find(person => person.fullName.toLowerCase().includes(inputName.node().value.toLowerCase()));

    // if no person was found, throw error
    d3.select(".search").classed("error", !person);
    if (!person) {
      console.error("No person with that name found!");
      return;
    }

    id = person.id;
    console.log("Assuming the person is", person.fullName);
  }

  let url = new URL(window.location);
  url.searchParams.set("id", id);
  window.location.replace(url);
});

// add keyboard shortcuts
document.addEventListener("keydown", event => {
  switch (event.key) {
    case "f":
      if (event.ctrlKey) {
        event.preventDefault();
        document.getElementById("input-name").focus()
      }
      break;
    case "Escape":
      document.querySelector(":focus").blur();
  }
});

setup(JSON.parse(localStorage.getItem("graph")));

/**
 * Called only once. Sets up the graph
 * @param graph
 */
function setup(graph) {
  if (!graph) {
    showError({
      en: "The calculated graph is empty!" +
        "Please check if your files are empty. If not, please contact the administrator!",
      de: "Der berechnete Graph ist leer!" +
        " Prüfe bitte, ob die Dateien leer sind. Sollte dies nicht der Fall sein, kontaktiere bitte den Administrator!"
    }, "graph")
    return;
  }
  modelGraph = graph;

  // add options to search field
  d3.select("datalist#names").selectAll("option")
    .data(modelGraph.nodes.filter(n => n.type === "person" && n.id > 0))
    .enter().append("option")
    .attr("value", d => d.fullName).html(d => d.fullName);

  // get id from url
  let url = new URL(window.location);
  let id = url.searchParams.get("id");
  if (!id)
    id = 1;

  startNode = modelGraph.nodes[id];
  startNode.infoVisible = true;
  console.info("Starting graph with", startNode.fullName);
  addViewNode(startNode);
  refocus(startNode);

  // place name of focus in header and title
  // NOTE this has to be here since localize() is called in update
  inputName.node().value = "";
  inputName.attr("placeholder", focusNode.fullName);
  document.title += ` ${translationToString({
    en: "of",
    de: "von"
  })} ${focusNode.fullName}`;
}

/**
 * Adds every node and link that are directly connected with the families of the node
 * @param node focused person node
 */
function refocus(node) {
  console.groupCollapsed("Refocus on", node.fullName, `(${node.id} | ${node.viewId})`);
  console.assert(node.type === "person", "Incorrect node type!");
  console.assert(modelGraph.nodes, "Model graph has no nodes!");
  console.assert(modelGraph.links, "Model graph has no links!");

  focusNode = node;

  modelGraph.nodes.filter(n => n.type === "family").forEach(family => {
    // array containing the view graph ids of the partners
    let people = family.partners.concat(family.children);
    if (!people.includes(node.id))
      return
    if (people.includes(0))
      console.warn("Person \"Unknown\" is in the family!");

    let newFamily = !inView(family);
    if (newFamily)
      addViewNode(family);

    function addNodes(p) {
      let person = modelGraph.nodes[p];

      // add all people in the family
      if (!inView(person))
        newFamily |= addViewNode(person);

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

      if (!newFamily)
        return;

      // add etc-node

      let otherFamilies = modelGraph.nodes.filter(n => n.type === "family" && n !== family && n.children.concat(n.partners).includes(person.id));
      console.assert(otherFamilies.length <= 1, "There seems to be more than one etc-node!", otherFamilies)
      if (p !== focusNode.id && otherFamilies.length)
        addEtcNode(person, otherFamilies[0]);
    }

    family.partners.forEach(addNodes);
    family.children.forEach(addNodes);
  });
  console.groupEnd();

  update();
}

function addEtcNode(person, family) {
  let type = "parent";
  if (family.partners.includes(person.id))
    type = "child";

  console.debug("Adding etc for", person.fullName)
  let etcNode = family;
  family.target = person.viewId;
  family.type = "etc";

  let etcLink;
  if (type === "parent" && person.parentsKnown) {
    addViewNode(etcNode);
    etcLink = {
      source: etcNode.viewId,
      target: person.viewId
    };
  } else if (type === "child" && person.married) {
    addViewNode(etcNode);
    etcLink = {
      source: person.viewId,
      target: etcNode.viewId
    };
  }
  if (etcLink)
    viewGraph.links.push(etcLink);
}

/**
 * Adds the node to the view. Also appends an etc-node if the node refers to a person.
 * @param node
 */
function addViewNode(node) {
  if (inView(node)) {
    if (node.type.includes("removed")) {
      console.log("Re-adding node", node.fullName);
      node.type = node.type.replace("-removed", "");
      console.debug(node.type);
      return;
    }
    console.warn("Node has already been added!", node);
    return false;
  }

  node.viewId = viewGraph.nodes.length;
  viewGraph.nodes.push(node);
  return true;
}

/**
 * Toggle the info node of a person
 * @param node person node
 */
function toggleInfo(node) {
  console.assert(node.type === "person");

  node.infoVisible = !node.infoVisible;
  nodesLayer.select(`#p-${node.id}`)
    // FIXME this new height is hardcoded and needs to be updated with every new displayed value
    .attr("height", (node.infoVisible ? 190 : config.personNodeSize[1]) + (node.dead ? 8 : 0))
    .select(".addInfo")
    .classed("hidden", !node.infoVisible);
}

/**
 * Called if the user clicked on an etc-node.
 * Adds missing families of the target and removes the etc node
 * @param family etc node on which the user clicked
 */
function addMissingNodes(family) {
  console.assert(family.type === "etc", "Incorrect node type!");

  // refocus on the node this was appended to
  let person = viewGraph.nodes[family.target];
  delete family.target;
  family.type = "family";
  console.info("Adding missing nodes for", person.fullName);
  if (!inView(person)) return;
  refocus(person);
}

/**
 * Inserts data in a person node html template
 * @param node person node
 * @return {Node | ActiveX.IXMLDOMNode} the html content
 */
function insertData(node) {
  console.assert(node.type === "person", "Incorrect node type!")

  let html = d3.select("#info-template").node().cloneNode(true).content;
  html.querySelector(".fullName").innerHTML =
    node.fullName;
  if (node.additionalNames.born) {
    html.querySelector(".born")
      .classList.remove("hidden");
    html.querySelector(".born")
      .append(node.additionalNames.born);
  }
  if (node.additionalNames.named) {
    html.querySelector(".named")
      .classList.remove("hidden", node.additionalNames.named);
    html.querySelector(".named")
      .append(node.additionalNames.named);
  }
  html.querySelector(".years").innerHTML =
    (node.birthday ? " * " + node.birthday : "") + (node.dayOfDeath ? " † " + node.dayOfDeath : "");
  html.querySelector(".age").innerHTML =
    (node.age ? node.age : "?");
  html.querySelector(".profession").innerHTML =
    (node.profession ? node.profession : "?");
  html.querySelector(".religion").innerHTML =
    (node.religion ? node.religion : "?");
  html.querySelector(".placeOfBirth").innerHTML =
    (node.placeOfBirth ? node.placeOfBirth : "?");

  return html;
}

/**
 * Checks if a node is visible
 * @param node
 * @returns {boolean} true if node is visible
 */
function inView(node) {
  // every visible node has a viewId, at least if it was added with addViewNode()
  return viewGraph.nodes.includes(node);
}

/**
 * Changes the transformation to allow moving and zooming the svg
 */
function transform() {
  vis.attr("transform", d3.event.transform.toString());
}

function hideLeaves(family) {
  console.info("Hiding leaves of family with partners", family.partners)
  if (family.children.concat(family.partners).includes(startNode.id)) {
    console.warn("This family cannot be removed!")
    return;
  }

  // find all leaves, e.g. all nodes who are connected with etc-nodes
  let leaves = family.children.concat(family.partners).filter(personId => {
      let familyMember = modelGraph.nodes[personId];
      // check if the node is connected to two families
      let linksToFamilies = viewGraph.links.filter(link => {
        let nodes = [link.source, link.target];
        if (!(nodes.includes(familyMember)))
          return false;
        // remove family and person node
        nodes = nodes.filter(n => n.type === "family" && !(n.target))
        return nodes.length;
      });
      return linksToFamilies.length <= 1;
    }
  );
  console.debug("Removing the following people:", leaves);

  // remove them from the graph
  viewGraph.nodes.filter(node => {
    if (node.type === "person")
      return leaves.includes(node.id);

    if (node.type === "etc") {
      let targetId = viewGraph.nodes[node.target].id;
      return leaves.includes(targetId);
    }

    // replace family that should be removed with an etc-node
    if (node.type === "family") {
      let visibleMembers = node.children.concat(node.partners).filter(person => !(leaves.includes(person)));
      if (visibleMembers.length <= 1) {
        node.type = "etc";
        node.target = modelGraph.nodes[visibleMembers[0]].viewId;
        console.debug("Replacing family with etc for target", node.target);
      }
      return false;
    }

    if (node.type.includes("removed"))
      return false;

    // this happens when the node type is not caught, e.g. when the node was previously removed
    console.warn("Unknown node type", node);
    return false;
  }).forEach(n => n.type += "-removed");

  // FIXME to much links being deleted
  viewGraph.links = viewGraph.links.filter(link => {
    return !(leaves.includes(link.source.id)) && !(leaves.includes(link.target.id));
  });

  update();
}

/**
 * Adds svg elements for each node, link and optionally group in the view graph.
 * Also defines the cola.on("tick", ...) function to update the position of all nodes and height of the person nodes.
 */
function update() {
  console.assert(viewGraph.nodes.length > 0,
    "Viewgraph has no nodes!");
  console.assert(viewGraph.links.length > 0,
    "Viewgraph has no links!");

  d3cola
    .nodes(viewGraph.nodes)
    .links(viewGraph.links)
    .start(0, 50);

  // the following lines define content and style of all the svg elements in the graph

  // family links
  let link = linkLayer.selectAll(".link")
    .data(viewGraph.links);
  link.enter().append("polyline")
    .attr("class", "link");
  link.exit().remove();
  link = linkLayer.selectAll(".link");

  // partner node
  let partnerNode = nodesLayer.selectAll(".partnerNode")
    .data(viewGraph.nodes.filter(node => node.type === "family"), d => d.viewId);
  partnerNode.enter().append("path")
    .attr("class", "partnerNode")
    .attr("d",
      "m8.5716 0c0 3.0298-2.4561 5.4858-5.4858 5.4858-3.0298 0-5.4858-2.4561-5.4858-5.4858s2.4561-5.4858 5.4858-5.4858c3.0298 0 5.4858 2.4561 5.4858 5.4858zm-6.1716 0c0 3.0298-2.4561 5.4858-5.4858 5.4858-3.0297 0-5.4858-2.4561-5.4858-5.4858s2.4561-5.4858 5.4858-5.4858c3.0298 0 5.4858 2.4561 5.4858 5.4858z")
    .on("click", hideLeaves)
    .call(d3cola.drag);
  partnerNode.exit().remove();
  partnerNode = nodesLayer.selectAll(".partnerNode");

  // node on which the user can click to show more people
  let etcNode = nodesLayer.selectAll(".etc")
    .data(viewGraph.nodes.filter(node => node.type === "etc"), d => d.viewId);
  let etcGroup = etcNode.enter().append("g")
    .attr("class", "etc")
    .on("mousedown", addMissingNodes)
    .on("touchend", addMissingNodes);
  etcGroup.append("circle")
    .attr("r", 10);
  etcGroup.append("text")
    .text("…")
    .attr("y", 1);
  etcNode.exit().remove();
  etcNode = nodesLayer.selectAll(".etc");

  // person nodes
  let personNode = nodesLayer.selectAll(".person")
    .data(viewGraph.nodes.filter(node => node.type === "person" && node.id !== 0), d => d.viewId)
  personNode.enter().append("foreignObject")
    .attr("class", d => "person " + d.gender + (d.dead ? " dead" : ""))
    .attr("id", d => `p-${d.id}`)
    .attr("x", d => -d.bounds.width() / 2)
    .attr("y", d => -d.bounds.height() / 2)
    .attr("width", d => d.bounds.width())
    .attr("height", d => d.bounds.height() + (d.dead ? 8 : 0))
    .classed("focused", d => d.id === focusNode.id)
    .on("click", toggleInfo)
    .call(d3cola.drag)
    .append(d => insertData(d));
  personNode.exit().remove();

  personNode = nodesLayer.selectAll(".person");
  personNode.select(".addInfo")
    .data(viewGraph.nodes.filter(node => node.type === "person"))
    .attr("class", d => "addInfo" + (d.infoVisible ? "" : " hidden"));

  // needed since the elements were newly added
  localize(window.navigator.language);

  d3cola.on("tick", () => {
    personNode
      .attr("x", d => d.x - config.personNodeSize[0] / 2)
      .attr("y", d => d.y - config.personNodeSize[1] / 2);
    partnerNode
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    etcNode
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    link
      .attr("points", d => {
        let deltaX = d.target.x - d.source.x,
          deltaY = d.target.y - d.source.y,
          dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
          normX = deltaX / dist,
          normY = deltaY / dist,
          sourceX = d.source.x + (30 * normX),
          sourceY = d.source.y + (25 * normY),
          targetX = d.target.x - (config.partnerNodeRadius * normX),
          targetY = d.target.y - ((config.partnerNodeRadius * .75) * normY);
        return sourceX + ',' + sourceY + ' ' + targetX + ',' + targetY;
      });
  });
}
