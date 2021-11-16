// configuration variables
const groupPartners = false;
const showFullGraph = false;
const personNodeSize = [277, 30];
// defines a virtual circle around the partner nodes (these rings) inside which links are not drawn
const partnerNodeRadius = 20;

const svg = d3.select("svg")
const viewportSize = [svg.node().getBBox().width, svg.node().getBBox().height];
// setup of cola
const d3cola = cola.d3adaptor(d3)
  .flowLayout("y", (l) => l.target.type === "family" ? 0 : 60)
  .symmetricDiffLinkLengths(40)
  .size(viewportSize)
  .avoidOverlaps(groupPartners || !showFullGraph);

// background, needed to catch the transformation events
svg.select("rect")
  .attr("id", "background")
  .call(d3.zoom().on("zoom", transform));

// define layers
const vis = svg.append("g")
  .attr("id", "vis");
const groupLayer = vis.append("g")
  .attr("id", "groups");
const linkLayer = vis.append("g")
  .attr("id", "links");
const nodesLayer = vis.append("g")
  .attr("id", "nodes");

// svg definitions for arrows
const defs = svg.append("svg:defs");
defs.append("svg:marker")
  .attr("id", "Arrow2Lend")
  .attr("orient", "auto")
  .attr("style", "overflow:visible")
  .append("svg:path")
  .attr("d", "M 8.7185878,4.0337352 L -2.2072895,0.016013256 L 8.7185884,-4.0017078 C 6.9730900,-1.6296469 6.9831476,1.6157441 8.7185878,4.0337352 z ")
  .attr("transform", "rotate(180) scale(.75) translate(1,0)");

// data structures that store the graph information
let modelGraph, viewGraph = {nodes: [], links: [], groups: []};
// this is the content of each person node
let infoHtml;
loadInfoHtml("../html/infos.html");
// load family tree data
// as this runs asynchronously,
loadCsv("../resources/Stammbaum - Personen.csv", "../resources/Stammbaum - Familien.csv", setup);

/**
 * Called only once. Sets up the graph
 * @param graph
 */
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

/**
 * Adds every node and link that are directly connected with the families of the node
 * @param node focused person node
 */
function refocus(node) {
  console.assert(node.type === "person", "Incorrect node type!")

  modelGraph.nodes.filter(n => n.type === "family").forEach(family => {
    let people = family.partners.concat(family.children);
    if (!people.includes(node.id))
      return
    if (people.includes(0))
      console.warn("Person unbekannt is in the family!");

    const newFamily = !inView(family);
    if (newFamily)
      addViewNode(family);

    // add all people in the family
    people.forEach(p => {
      let person = modelGraph.nodes[p];
      if (!inView(person))
        addViewNode(person);
    });

    // TODO don't push etc nodes if there is nothing (optional, but appreciated)

    // array containing the view graph ids of the partners
    let partnerIds = []
    if (newFamily) {
      family.partners.forEach(p => {
        let person = modelGraph.nodes[p];

        partnerIds.push(person.viewId);
        viewGraph.links.push({
          source: person.viewId,
          target: family.viewId
        });

        if (p !== node.id) {
          // add a node that the user can click on to add its family to the graph
          let etcNode = {
            type: "etc",
            viewId: viewGraph.nodes.length,
            target: person.viewId
          }
          viewGraph.nodes.push(etcNode);
          viewGraph.links.push({
            source: etcNode.viewId,
            target: person.viewId
          });
        }
      });

      family.children.forEach(p => {
        let person = modelGraph.nodes[p];

        // NOTE these are swapped compared to the partners, hence we dont iterate above people
        viewGraph.links.push({
          source: family.viewId,
          target: person.viewId
        })

        if (p !== node.id) {
          // add a node that the user can click on to add its family to the graph
          let etcNode = {
            type: "etc",
            viewId: viewGraph.nodes.length,
            target: person.viewId
          }
          viewGraph.nodes.push(etcNode);
          viewGraph.links.push({
            source: person.viewId,
            target: etcNode.viewId
          });
        }
      });
    }

    if (newFamily) {
      viewGraph.groups.push({
        leaves: partnerIds.concat(family.viewId)
      });
    }
  });

  update();
}

/**
 * Adds the node to the view. Also appends an etc node if the node refers to a person.
 * @param node
 */
function addViewNode(node) {
  if (inView(node)) {
    console.error("Node " + node.fullName + " has already been added!");
    return;
  }

  node.viewId = viewGraph.nodes.length;
  viewGraph.nodes.push(node);
}

/**
 * Called if the user clicked on an etc node.
 * Adds missing families of the target and removes the etc node
 * @param node etc node on which the user clicked
 */
function addMissingNodes(node) {
  console.assert(node.type === "etc", "Incorrect node type!");

  // make sure the node won't be added in next update call
  node.type = "";
  viewGraph.links = viewGraph.links.filter(l => l.source.type !== "" && l.target.type !== "");

  // refocus on the node this was appended to
  node = viewGraph.nodes[node.target];
  if (!inView(node)) return;
  refocus(node);
}

/**
 * Toggle the info node of a person
 * @param node person node
 */
function toggleInfo(node) {
  console.assert(node.type === "person");

  node.infoVisible = !node.infoVisible;
  update();
}

/**
 * Inserts data in a person node html template
 * @param node person node
 * @return {Node | ActiveX.IXMLDOMNode} the html content
 */
function insertData(node) {
  console.assert(node.type === "person", "Incorrect node type!");

  let html = infoHtml.cloneNode(true);
  html.querySelector(".fullName").innerHTML =
    node.fullName;
  html.querySelector(".addNames").innerHTML = node.additionalNames;
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
  return typeof node.viewId !== "undefined";
}

/**
 * Changes the transformation to allow moving and zooming the svg
 */
function transform() {
  vis.attr("transform", d3.event.transform.toString());
}

/**
 * Adds svg elements for each node, link and optionally group in the view graph.
 * Also defines the cola.on("tick", ...) function to update the position of all nodes and height of the person nodes.
 */
function update() {
  console.assert(viewGraph !== undefined,
    "Graph is empty!");
  console.assert(viewGraph.nodes.length > 0,
    "Graph has no nodes!");
  console.assert(viewGraph.links.length > 0,
    "Graph has no links!");

  if (groupPartners)
    console.assert(viewGraph.groups.length > 0);
  d3cola
    .nodes(viewGraph.nodes)
    .links(viewGraph.links)
    .groups(viewGraph.groups)
    .start(0, 50);

  // the following lines define content and style of all the svg elements in the graph

  // partner groups
  let group;
  if (groupPartners) {
    group = groupLayer.selectAll(".group")
      .data(viewGraph.groups).enter();
    group.append("rect")
      .attr("class", "group")
      .attr("rx", 15)
      .call(d3cola.drag);
    group = groupLayer.selectAll(".group");
  }

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
    .call(d3cola.drag);
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
    .data(viewGraph.nodes.filter(node => node.type === "person" && node.ID !== 0), d => d.viewId)
  personNode.enter().append("foreignObject")
    .attr("class", d => "person " + d.gender + (d.dead ? " dead" : ""))
    .attr("id", d => d.id)
    .attr("x", d => - d.bounds.width() / 2)
    .attr("y", d => - d.bounds.height() / 2)
    .attr("width", d => d.bounds.width())
    .attr("height", d => d.bounds.height() + (d.dead ? 8 : 0))
    .on("mousedown", toggleInfo)
    //.on("touchstart", toggleInfo)
    .call(d3cola.drag)
    .append(d => insertData(d));
  personNode = nodesLayer.selectAll(".person");
  personNode.select(".addInfo")
    .data(viewGraph.nodes.filter(node => node.type === "person"))
    .attr("class", d => "addInfo" + (d.infoVisible ? "" : " hidden"));

  d3cola.on("tick", () => {
    personNode
      .attr("x", d => d.x - personNodeSize[0] / 2)
      .attr("y", d => d.y - personNodeSize[1] / 2)
      // FIXME this new height is hardcoded and needs to be updated with every new displayed value
      .attr("height", d => (d.infoVisible ? 190 : personNodeSize[1]) + (d.day_of_death !== "" || d.age > 120 ? 8 : 0));

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
          targetX = d.target.x - (partnerNodeRadius * normX),
          targetY = d.target.y - ((partnerNodeRadius * .75) * normY);
        return sourceX + ',' + sourceY + ' ' + targetX + ',' + targetY;
      });

    if (groupPartners) {
      group
        .attr("x", d => d.bounds.x)
        .attr("y", d => d.bounds.y)
        .attr("width", d => d.bounds.width())
        .attr("height", d => d.bounds.height());
    }
  });
}
