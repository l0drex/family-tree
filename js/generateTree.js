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

let viewgraph, modelgraph = {nodes: [], links: []};
loadCsv("../resources/Stammbaum - Personen.csv", "../resources/Stammbaum - Familien.csv");
//loadJson("../resources/graphData.json");

// TODO move some of this to a new file
// --- original from https://github.com/tgdwyer/WebCola/blob/master/website/examples/onlinebrowse.html
// modified for use case
/**
 * Adds every node and link that should be drawn
 * @param focus the currently focused node
 */
function refocus(focus) {
  // add family nodes and nodes that link to them
  modelgraph.nodes.filter(n => !isPerson(n)).forEach(family => {
    // array of indices in modelgraph.nodes
    let people = family.partners.concat(family.children);
    if (!people.includes(modelgraph.nodes.indexOf(focus)))
      return
    if (!inView(family))
      addViewNode(family);
    // add all people in the family
    people.forEach(person => {
      let personNode = modelgraph.nodes[person];
      if (!inView(personNode))
        addViewNode(personNode);
        viewgraph.links.push({
          source: personNode,
          target: family.viewgraphid
        });
      modelgraph.nodes[person] = personNode;
    });
  });
  // TODO show visible links and draw stroke around clickable nodes
  // TODO check groups
  update();
}

/**
 * Adds the node v to the view
 * @param v the node to add
 * @param [startpos] the start node
 * @return index of v in the viewgraph
 */
function addViewNode(v) {
  v.viewgraphid = viewgraph.nodes.length;
  viewgraph.nodes.push(v);
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

// ---

// For the future: these can be moved in a node class
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
  return modelgraph.nodes.indexOf(node) < firstFamily;
}

/**
 * Returns the full name of a person
 * @param personNode
 * @returns {string} the full name
 */
function getFullName(d, show_born=false) {
  let secondName = " ";
  if (d.second_name)
    secondName = secondName.concat(d.second_name, " ");
  let born = "";
  if (d.born && show_born)
    born = " born " + d.born;
  return d.surname.concat(secondName, d.name, born);
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
  console.assert(viewgraph.nodes.length > 0);
  console.assert(viewgraph.links.length > 0);
  //console.assert(viewgraph.groups.length > 0);
  // graph setup:
  d3cola
    .nodes(viewgraph.nodes)
    .links(viewgraph.links)
    //.groups(viewgraph.groups)
    //.flowLayout("y", 30)
    .symmetricDiffLinkLengths(30)
    //.avoidOverlaps(true)
    .size(viewportSize)
    .start();

  // draw instructions:

  // TODO arrow for ancestor lines

  // family links
  let link = linkLayer.selectAll(".link")
    .data(viewgraph.links).enter()
    .append("line")
    .attr("class", "link");

  // person nodes
  let personNode = nodesLayer.selectAll(".person")
    .data(viewgraph.nodes.filter(node => isPerson(node)), d => d.viewgraphid)
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
    .text((d) => getFullName(d));
  let text = personNode.append("text")
    .text((d) => getFullName(d))
    .attr("class", "nameLabel");

  // partner node
  let partnerNode = nodesLayer.selectAll(".partnerNode")
    .data(viewgraph.nodes.filter(node => !isPerson(node)), d => d.viewgraphid)
    .enter().append("g")
    .call(d3cola.drag);

  partnerNode
    .append("path")
    .attr("class", "partnerNode")
    .attr("d",
      "m8.5716 0c0 3.0298-2.4561 5.4858-5.4858 5.4858-3.0298 0-5.4858-2.4561-5.4858-5.4858s2.4561-5.4858 5.4858-5.4858c3.0298 0 5.4858 2.4561 5.4858 5.4858zm-6.1716 0c0 3.0298-2.4561 5.4858-5.4858 5.4858-3.0297 0-5.4858-2.4561-5.4858-5.4858s2.4561-5.4858 5.4858-5.4858c3.0298 0 5.4858 2.4561 5.4858 5.4858z")
  d3cola.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    personNode
      .attr("class", d => d.ID === "0" ? "invisible" : "");

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
