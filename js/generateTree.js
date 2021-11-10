// configuration variables
const viewportSize = [1900, 970];
// size of each person node
const personNodeSize = [200, 30];
const partnerNodeRadius = 20;
// FIXME first partner of first family disappears if this is true??
const groupPartners = false;
const showFullGraph = false;
const startNode = 3;

const d3cola = cola.d3adaptor(d3)
  .flowLayout("y", 60)
  .symmetricDiffLinkLengths(40)
  .size(viewportSize)
  .avoidOverlaps(groupPartners || !showFullGraph);
let firstFamily;

const svg = d3.select("svg")
  .attr("width", viewportSize[0])
  .attr("height", viewportSize[1]);
svg.select("rect")
  .attr("id", "background")
  .attr("style", "fill: transparent; stroke: none;")
  .call(d3.zoom().on("zoom", redraw));

const vis = svg.append("g")
  .attr("id", "vis");
const groupLayer = vis.append("g")
  .attr("id", "groups");
const linkLayer = vis.append("g")
  .attr("id", "links");
const nodesLayer = vis.append("g")
  .attr("id", "nodes");
const infoLayer = vis.append("g")
  .attr("id", "infos")

// definitions for arrows
const defs = svg.append("svg:defs");
defs.append("svg:marker")
  .attr("id", "Arrow2Lend")
  .attr("orient", "auto")
  .attr("style", "overflow:visible")
  .append("svg:path")
  .attr("d", "M 8.7185878,4.0337352 L -2.2072895,0.016013256 L 8.7185884,-4.0017078 C 6.9730900,-1.6296469 6.9831476,1.6157441 8.7185878,4.0337352 z ")
  .attr("transform", "rotate(180) scale(.75) translate(1,0)");

let modelGraph, viewGraph = {nodes: [], links: [], groups: []};
let infoHtml;
loadInfoHtml("../html/infos.html");
loadCsv("../resources/Stammbaum - Personen.csv", "../resources/Stammbaum - Familien.csv");

function setup(graph) {
  if (showFullGraph) {
    modelGraph = viewGraph = graph;
    update();
    return;
  }

  modelGraph = graph;
  // TODO allow to select this from the user
  let startNode = modelGraph.nodes[3];
  addViewNode(startNode);
  refocus(startNode);
}

// TODO move some of this to a new file
// --- original from https://github.com/tgdwyer/WebCola/blob/master/website/examples/onlinebrowse.html
// modified for use case
/**
 * Adds every node and link that should be drawn
 * @param focus the currently focused node
 */
function refocus(focus) {
  // add family nodes and nodes that link to them
  modelGraph.nodes.filter(n => n.type === "family").forEach(family => {
    let people = family.partners.concat(family.children);
    if (!people.includes(focus.ID))
      return

    let newFamily = !inView(family);
    if (newFamily)
      addViewNode(family);

    // add all people in the family
    people.filter(p => p !== 0).forEach(p => {
      let person = modelGraph.nodes[p];
      if (!inView(person))
        addViewNode(person);
    });

    if (newFamily) {
      family.partners.filter(p => p !== 0).forEach(p => {
        let person = modelGraph.nodes[p];
        if (!inView(person))
          addViewNode(person);

        viewGraph.links.push({
          source: person.viewgraphid,
          target: family.viewgraphid
        })
      });

      family.children.filter(p => p !== 0).forEach(p => {
        let person = modelGraph.nodes[p];
        if (!inView(person))
          addViewNode(person);

        viewGraph.links.push({
          source: family.viewgraphid,
          target: person.viewgraphid
        })
      });
    }

    if (newFamily)
      viewGraph.groups.push({
        leaves: family.partners
      });
  });
  // TODO show visible links and draw stroke around clickable nodes
  update();
}

/**
 * Adds the node v to the view
 * @param v the node to add
 * @return index of v in the viewgraph
 */
function addViewNode(v) {
  if (inView(v)) {
    console.error("Node " + v.full_name + " has already been added!");
    return;
  }
  v.viewgraphid = viewGraph.nodes.length;
  viewGraph.nodes.push(v);

  if (v.type === "person") {
    let etcNode = {
      type: "etc",
      viewgraphid: viewGraph.nodes.length,
      target: v.viewgraphid
    }
    viewGraph.nodes.push(etcNode);
    viewGraph.links.push({
      target: etcNode.viewgraphid,
      source: v.viewgraphid
    })
  }
}

/**
 * Called if the user clicked on a etc node.
 * Adds missing families of the target and removes the etc
 * @param etcNode the node where the user clicked on
 */
function addMissingNodes(etcNode) {
  etcNode.type = "";
  viewGraph.links = viewGraph.links.filter(l => !(l.source.type === "" || l.target.type === ""))
  etcNode = viewGraph.nodes[etcNode.target];
  if (!inView(etcNode)) return;
  refocus(etcNode);
}

/**
 * Show the info node of a person
 * @param personNode
 */
function showInfo(personNode) {
  personNode.infoVisible = true;
  update();
}

function hideInfo(personNode) {
  personNode.infoVisible = false;
  update();
}

function insertData(data) {
  let html = infoHtml.cloneNode(true);
  html.querySelector(".fullName").innerHTML =
    data.full_name;
  html.querySelector(".addNames").innerHTML =
    (data.born ? "geb. " + data.born : "") + (data.named ? " genannt " + data.named : "");
  html.querySelector(".years").innerHTML =
    (data.birthday ? " * " + data.birthday : "") + (data.day_of_death ? " † " + data.day_of_death : "");
  html.querySelector(".age").innerHTML =
    (data.age ? data.age : "?");
  html.querySelector(".profession").innerHTML =
    (data.profession ? data.profession : "?");
  html.querySelector(".religion").innerHTML =
    (data.religion ? data.religion : "?");
  html.querySelector(".placeOfBirth").innerHTML =
    (data.place_of_birth ? data.place_of_birth : "?");
  return html;
}

/**
 * Checks if a node is visible
 * @param v the node to check
 * @returns {boolean} true if v is visible
 */
function inView(v) {
  return typeof v.viewgraphid !== "undefined";
}

/**
 * Checks if the node is a person
 * @param node node to check
 * @returns {boolean} true if it's a person, false if it's a family
 */
function isPerson(node) {
  //return modelGraph.nodes.indexOf(node) < firstFamily;
  return node.type === "person";
}

/**
 * Changes the transformation to allow moving and zooming the svg
 */
function redraw() {
  vis.attr("transform", d3.event.transform.toString());
}

/**
 * Shows the nodes in the viewgraph
 */
function update() {
  console.assert(viewGraph.nodes.length > 0);
  console.assert(viewGraph.links.length > 0);
  if (groupPartners) {
    console.assert(viewGraph.groups.length > 0);
    d3cola.groups(viewGraph.groups);
  }

  d3cola
    .nodes(viewGraph.nodes)
    .links(viewGraph.links)
    .start();

  // draw instructions:

  // partner groups
  let group;
  if (groupPartners) {
    group = groupLayer.selectAll(".group")
      .data(viewGraph.groups).enter();
    group.append("rect")
      .attr("class", "group")
      .call(d3cola.drag);
    group = groupLayer.selectAll(".group");
  }

  // family links
  let link = linkLayer.selectAll(".link")
    .data(viewGraph.links);
  link.enter().append("path")
    .attr("class", "link");
  link = linkLayer.selectAll(".link");

  // person nodes
  let personNode = nodesLayer.selectAll(".person")
    .data(viewGraph.nodes.filter(node => node.type === "person"), d => d.viewgraphid);
  let personGroup = personNode.enter().append("g")
    .attr("class", d => "person" + (d.ID === 0 ? " hidden" : ""))
    .attr("id", d => d.ID)
    .on("mousedown", showInfo)
    .on("touchend", showInfo)
    .call(d3cola.drag);
  // background rect
  personGroup.append("rect")
    .attr("class", (d) => d.gender + (d.day_of_death !== "" || d.age > 120 ? " dead" : ""))
    .attr("width", personNodeSize[0])
    .attr("height", personNodeSize[1])
    .attr("rx", personNodeSize[1] / 2)
    .attr("x", -personNodeSize[0] / 2)
    .attr("y", -personNodeSize[1] / 2);
  // name
  personGroup.append("title")
    .text(d => d.full_name);
  personGroup.append("text")
    .text(d => d.full_name)
    .attr("class", "nameLabel")
    .attr("y", ".3em");
  personNode = nodesLayer.selectAll(".person");

  // info nodes
  let infoNode = infoLayer.selectAll(".info")
    .data(viewGraph.nodes.filter(node => node.type === "person" && node.ID !== 0), d => d.viewgraphid)
    .attr("class", d => "info" + (d.infoVisible ? "" : " hidden") + " " + d.gender);
  infoNode.enter().append("foreignObject")
    .attr("class", d => "info" + (d.infoVisible ? "" : " hidden"))
    .attr("x", -personNodeSize[0] / 2)
    .attr("y", -personNodeSize[1] / 2)
    .attr("width", d => d.width)
    .attr("height", 210)
    .on("mousedown", hideInfo)
    .on("touchend", hideInfo)
    .append(d => insertData(d));
  infoNode = infoLayer.selectAll(".info");

  // node on which the user can click to show more people
  let etcNode = nodesLayer.selectAll(".etc")
    .data(viewGraph.nodes.filter(node => node.type === "etc"), d => d.viewgraphid);
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

  // partner node
  let partnerNode = nodesLayer.selectAll(".partnerNode")
    .data(viewGraph.nodes.filter(node => node.type === "family"), d => d.viewgraphid);
  partnerNode.enter().append("path")
    .attr("class", "partnerNode")
    .attr("id", d => d.ID + firstFamily)
    .attr("d",
      "m8.5716 0c0 3.0298-2.4561 5.4858-5.4858 5.4858-3.0298 0-5.4858-2.4561-5.4858-5.4858s2.4561-5.4858 5.4858-5.4858c3.0298 0 5.4858 2.4561 5.4858 5.4858zm-6.1716 0c0 3.0298-2.4561 5.4858-5.4858 5.4858-3.0297 0-5.4858-2.4561-5.4858-5.4858s2.4561-5.4858 5.4858-5.4858c3.0298 0 5.4858 2.4561 5.4858 5.4858z")
    .call(d3cola.drag);
  partnerNode = nodesLayer.selectAll(".partnerNode");

  d3cola.on("tick", () => {
    if (groupPartners) {
      group
        .attr("x", d => d.bounds.x)
        .attr("y", d => d.bounds.y)
        .attr("width", d => d.bounds.width())
        .attr("height", d => d.bounds.height());
    }

    link
      .attr("d", d => {
        let deltaX = d.target.x - d.source.x,
          deltaY = d.target.y - d.source.y,
          dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
          normX = deltaX / dist,
          normY = deltaY / dist,
          sourceX = d.source.x + (30 * normX),
          sourceY = d.source.y + (25 * normY),
          targetX = d.target.x - (partnerNodeRadius * normX),
          targetY = d.target.y - ((partnerNodeRadius * .75) * normY);
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
      });

    partnerNode
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    personNode
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    etcNode
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    infoNode
      .attr("x", d => d.x - personNodeSize[0] / 2)
      .attr("y", d => d.y - personNodeSize[1] / 2);
  });
}
