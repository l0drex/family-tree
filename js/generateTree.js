const viewportSize = [window.innerWidth, window.innerHeight];
// set the size for each node
const personNodeSize = [200, 30];
const partnerNodeRadius = 10;
let firstFamily;
let d3cola = cola.d3adaptor(d3);
// do some magic to allow zooming and moving
// see https://github.com/tgdwyer/WebCola/blob/master/website/examples/onlinebrowse.html
const outer = d3.select("body").append("svg")
  .attr("width", viewportSize[0])
  .attr("height", viewportSize[1]);
outer.append("rect")
  .attr("id", "background")
  .attr("width", "100%").attr("height", "100%")
  .call(d3.zoom().on("zoom", redraw));
const vis = outer.append("g")
  .attr("id", "vis");
let linkLayer = vis.append("g")
  .attr("id", "links");
let nodesLayer = vis.append("g")
  .attr("id", "nodes");

let viewGraph, modelGraph = {nodes: [], links: []};
loadCsv("../resources/Stammbaum - Personen.csv", "../resources/Stammbaum - Familien.csv");

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
    // array of indices in modelgraph.nodes
    let people = family.partners.concat(family.children);
    if (!people.includes(modelGraph.nodes.indexOf(focus)))
      return
    if (!inView(family))
      addViewNode(family);
    // add all people in the family
    people.forEach(person => {
      let personNode = modelGraph.nodes[person];
      if (!inView(personNode))
        addViewNode(personNode);
        viewGraph.links.push({
          source: personNode,
          target: family.viewgraphid
        });
      modelGraph.nodes[person] = personNode;
    });
  });
  // TODO show visible links and draw stroke around clickable nodes
  // TODO check groups
  update();
}

/**
 * Adds the node v to the view
 * @param v the node to add
 * @return index of v in the viewgraph
 */
function addViewNode(v) {
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
  refocus(node);
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
  return modelGraph.nodes.indexOf(node) < firstFamily;
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
  console.assert(viewGraph.groups.length > 0);
  // graph setup:
  d3cola
    .nodes(viewGraph.nodes)
    .links(viewGraph.links)
    //.groups(viewgraph.groups)
    //.flowLayout("y", 30)
    .symmetricDiffLinkLengths(30)
    .size(viewportSize)
    .start();

  // draw instructions:

  // partner groups
/*  let group = linkLayer.selectAll(".group")
    .data(viewgraph.groups).enter()
    .append("rect")
    .attr("class", "group")
    .call(d3cola.drag);*/

  // arrow for ancestor lines
  let defs = outer.append("svg:defs")
  defs.append("svg:marker")
    .attr("id", "Arrow2Lstart")
    .attr("orient", "auto")
    .attr("style", "overflow:visible")
    .append("path")
    .attr("d", "M 8.7185878,4.0337352 L -2.2072895,0.016013256 L 8.7185884,-4.0017078 C 6.9730900,-1.6296469 6.9831476,1.6157441 8.7185878,4.0337352 z ")
    .attr("transform", "scale(.75)");
  defs.append("svg:marker")
    .attr("id", "Arrow2Lend")
    .attr("orient", "auto")
    .attr("style", "overflow:visible")
    .append("svg:path")
    .attr("d", "M 8.7185878,4.0337352 L -2.2072895,0.016013256 L 8.7185884,-4.0017078 C 6.9730900,-1.6296469 6.9831476,1.6157441 8.7185878,4.0337352 z ")
    .attr("transform", "rotate(180) scale(.75)");

  // family links
  let link = linkLayer.selectAll(".link")
    .data(viewGraph.links).enter()
    .append("path")
    .attr("class", d => "link " + (d.target.partners.includes(d.source.ID) ? "parent" : "child"));

  // person nodes
  let personNode = nodesLayer.selectAll(".person")
    .data(viewGraph.nodes.filter(node => isPerson(node)), d => d.viewgraphid)
    .enter()
    .append("g")
    .attr("class", "person")
    .on("mousedown", click)
    .on("touchend", click)
    .call(d3cola.drag);
  let rect = personNode.append("rect")
    .attr("class", (d) => d.gender)
    .attr("width", personNodeSize[0]).attr("height", personNodeSize[1])
    .attr("rx", personNodeSize[1]/2);
  personNode.append("title")
    .text(d => d.full_name);
  let text = personNode.append("text")
    .text(d => d.full_name)
    .attr("class", "nameLabel");

  // partner node
  let partnerNode = nodesLayer.selectAll(".partnerNode")
    .data(viewGraph.nodes.filter(node => !isPerson(node)), d => d.viewgraphid)
    .enter().append("g")
    .call(d3cola.drag);

  partnerNode
    .append("path")
    .attr("class", "partnerNode")
    .attr("d",
      "m8.5716 0c0 3.0298-2.4561 5.4858-5.4858 5.4858-3.0298 0-5.4858-2.4561-5.4858-5.4858s2.4561-5.4858 5.4858-5.4858c3.0298 0 5.4858 2.4561 5.4858 5.4858zm-6.1716 0c0 3.0298-2.4561 5.4858-5.4858 5.4858-3.0297 0-5.4858-2.4561-5.4858-5.4858s2.4561-5.4858 5.4858-5.4858c3.0298 0 5.4858 2.4561 5.4858 5.4858z")

  d3cola.on("tick", () => {
/*    group
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("width", d => d.width)
      .attr("height", d => d.height);*/

    link
      .attr("d", d => {
        let deltaX = d.target.x - d.source.x,
          deltaY = d.target.y - d.source.y,
          dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
          normX = deltaX / dist,
          normY = deltaY / dist,
          sourceX = d.source.x + (17 * normX),
          sourceY = d.source.y + (13 * normY),
          targetX = d.target.x - (17 * normX),
          targetY = d.target.y - (13 * normY);
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
      });

    personNode
      .attr("class", d => d.ID === 0 ? "hidden" : "");

    partnerNode
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")")

    text
      .attr("x", d => d.x)
      .attr("y", d => d.y);

    rect
      .attr("x", d => d.x - d.width / 2)
      .attr("y", d => d.y - d.height / 2);
  });
}
