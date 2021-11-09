// configuration variables
const viewportSize = [1900, 970];
// size of each person node
const personNodeSize = [200, 30];
const partnerNodeRadius = 20;
// FIXME first partner of first family disappears if this is true??
const groupPartners = false;
const showFullGraph = true;

const d3cola = cola.d3adaptor(d3)
  //.flowLayout("y", 30)
  .symmetricDiffLinkLengths(40)
  .size(viewportSize)
  .avoidOverlaps(groupPartners);
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
// definitions for arrows
const defs = svg.append("svg:defs");
defs.append("svg:marker")
  .attr("id", "Arrow2Lstart")
  .attr("orient", "auto")
  .attr("style", "overflow:visible")
  .append("path")
  .attr("d", "M 8.7185878,4.0337352 L -2.2072895,0.016013256 L 8.7185884,-4.0017078 C 6.9730900,-1.6296469 6.9831476,1.6157441 8.7185878,4.0337352 z ")
  .attr("transform", "scale(.75) translate(1,0)");
defs.append("svg:marker")
  .attr("id", "Arrow2Lend")
  .attr("orient", "auto")
  .attr("style", "overflow:visible")
  .append("svg:path")
  .attr("d", "M 8.7185878,4.0337352 L -2.2072895,0.016013256 L 8.7185884,-4.0017078 C 6.9730900,-1.6296469 6.9831476,1.6157441 8.7185878,4.0337352 z ")
  .attr("transform", "rotate(180) scale(.75) translate(1,0)");

let modelGraph, viewGraph = {nodes: [], links: [], groups: []};
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
    modelGraph.nodes.filter(n => !isPerson(n)).forEach(family => {
    let people = family.partners.concat(family.children);
    if (!people.includes(focus.ID))
      return

    let newFamily = !inView(family);
    if (newFamily)
      addViewNode(family);

    // add all people in the family
    people.forEach(person => {
      let personNode = modelGraph.nodes[person];
      if (!inView(personNode))
        addViewNode(personNode);

      if (newFamily)
        viewGraph.links.push({
          source: personNode.viewgraphid,
          target: family.viewgraphid
        });

      if (newFamily)
        viewGraph.groups.push({
          leaves: family.partners
        });
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
}

/**
 * Called if the user clicked on a node.
 * Selects the clicked-on node as focus node
 * @param node the node where the user clicked on
 */
function click(node) {
  if (!inView(node)) return;
  refocus(modelGraph.nodes[node.ID]);
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
  return typeof node.gender !== "undefined";
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
      .data(viewGraph.groups).enter()
      .append("rect")
      .attr("class", "group")
      .call(d3cola.drag);
  }

  // family links
  let link = linkLayer.selectAll(".link")
    .data(viewGraph.links)
    .enter().append("path")
    .attr("class", d => "link " + (d.target.partners.includes(d.source.ID) ? "parent" : "child"));

  // person nodes
  let personNode = nodesLayer.selectAll(".person")
    .data(viewGraph.nodes.filter(node => isPerson(node)), d => d.viewgraphid)
    .enter().append("g")
    .attr("class", d => "person" + (d.ID === 0 ? " hidden" : ""))
    .on("mousedown", click)
    .on("touchend", click)
    .on("mousemove", d3.preventDefault)
    .on("touchmove", d3.preventDefault)
    .call(d3cola.drag);
  // background rect
  personNode.append("rect")
    .attr("class", (d) => d.gender + (d.day_of_death !== "" || d.age > 120 ? " dead" : ""))
    .attr("width", personNodeSize[0])
    .attr("height", personNodeSize[1])
    .attr("rx", personNodeSize[1]/2)
    .attr("x", -personNodeSize[0]/2)
    .attr("y", -personNodeSize[1]/2);
  // name
  personNode.append("title")
    .text(d => d.full_name);
  personNode.append("text")
    .text(d => d.full_name)
    .attr("class", "nameLabel")
    .attr("y", 5);

  // partner node
  let partnerNode = nodesLayer.selectAll(".partnerNode")
    .data(viewGraph.nodes.filter(node => !isPerson(node)), d => d.viewgraphid)
    .enter().append("path")
    .attr("class", "partnerNode")
    .attr("d",
      "m8.5716 0c0 3.0298-2.4561 5.4858-5.4858 5.4858-3.0298 0-5.4858-2.4561-5.4858-5.4858s2.4561-5.4858 5.4858-5.4858c3.0298 0 5.4858 2.4561 5.4858 5.4858zm-6.1716 0c0 3.0298-2.4561 5.4858-5.4858 5.4858-3.0297 0-5.4858-2.4561-5.4858-5.4858s2.4561-5.4858 5.4858-5.4858c3.0298 0 5.4858 2.4561 5.4858 5.4858z")
    .call(d3cola.drag);

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
  });
}
