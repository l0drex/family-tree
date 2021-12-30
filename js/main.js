// configuration variables
const personNodeSize = [277, 30];
// defines a virtual circle around the partner nodes (these rings) inside which links are not drawn
const partnerNodeRadius = 20;

localize(window.navigator.language);

// data structures that stores the graph information
let modelGraph, viewGraph = {nodes: [], links: []};

// setup of cola
const d3cola = cola.d3adaptor(d3)
  .flowLayout("y", (l) => l.target.type === "family" ? 0 : 60)
  .symmetricDiffLinkLengths(40)
  .avoidOverlaps(true);

let nodesLayer, linkLayer, vis;
const svg = d3.select("svg");
// catch the transformation events
svg.select("#background")
  .call(d3.zoom().on("zoom", transform));

// define layers
vis = svg.select("#vis");
linkLayer = vis.select("#links");
nodesLayer = vis.select("#nodes");

let form = d3.select("#upload-form");
form.on("submit", () => {
  d3.event.preventDefault();

  // load data from the files
  // these are blobs
  let peopleFile = d3.select("#people-file").node().files[0];
  let familyFile = d3.select("#family-file").node().files[0];
  // these are raw strings of the csv files
  let peopleTable, familiesTable;
  let readerFamily = new FileReader();
  readerFamily.onload = (file) => {
    familiesTable = file.target.result;

    if (peopleTable && familiesTable)
      loadCsv(peopleTable, familiesTable, setup);
  }
  readerFamily.readAsText(familyFile);
  let readerPeople = new FileReader();
  readerPeople.onload = (file) => {
    peopleTable = file.target.result;

    if (peopleTable && familiesTable)
      loadCsv(peopleTable, familiesTable, setup);
  }
  readerPeople.readAsText(peopleFile);

  d3.selectAll("article").classed("hidden", true);
  svg.classed("hidden", false);
  // FIXME this should be doable in css, but I cant find why.
  //  See main.css line 147: main > :not(.hidden):last-child should also apply to the svg
  svg.attr("style", "margin-bottom: 0;")

  const viewportSize = [svg.node().getBBox().width, svg.node().getBBox().height];
  d3cola.size(viewportSize);
});

/**
 * Called only once. Sets up the graph
 * @param graph
 */
function setup(graph) {
  modelGraph = graph;
  // TODO allow to select this from the user
  let startNode = modelGraph.nodes[158];
  addViewNode(startNode);
  refocus(startNode);
}

/**
 * Only show elements with the correct langauge
 * @param language the language to show, e.g. window.navigator.language
 */
function localize(language) {
  // strip country-specific stuff
  language = language.slice(0, 2);

  if (['de', 'en'].includes(language)) {
    d3.select("html").attr("lang", language);
    let lang = `:lang(${language})`;
    d3.selectAll(`[lang]:not(${lang})`).style('display', 'none');

    d3.selectAll(`[lang]${lang}`).style('display', 'revert');
  } else {
    console.warn(`Language ${language} is not supported. Falling back to english.`);
    localize("en");
  }
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
      console.warn("Person \"Unknown\" is in the family!");

    const newFamily = !inView(family);
    if (newFamily)
      addViewNode(family);

    // add all people in the family
    people.forEach(p => {
      let person = modelGraph.nodes[p];
      if (!inView(person))
        addViewNode(person);
    });

    // array containing the view graph ids of the partners
    if (newFamily) {
      let addNodes = (p, type) => {
        let person = modelGraph.nodes[p];

        let link;
        if (type === "parent") {
          link = {
            source: person.viewId,
            target: family.viewId
          };
        } else {
          link = {
            source: family.viewId,
            target: person.viewId
          };
        }
        viewGraph.links.push(link);

        if (p !== node.id) {
          // add a node that the user can click on to add its family to the graph
          let etcNode = {
            type: "etc",
            viewId: viewGraph.nodes.length,
            target: person.viewId
          }

          if (type === "parent" && person.parentsKnown) {
            viewGraph.nodes.push(etcNode);
            link = {
              source: etcNode.viewId,
              target: person.viewId
            };
          } else if (type === "child" && person.married) {
            viewGraph.nodes.push(etcNode);
            link = {
              source: person.viewId,
              target: etcNode.viewId
            };
          }
          viewGraph.links.push(link);
        }
      }

      family.partners.forEach(p => addNodes(p, "parent"));
      family.children.forEach(p => addNodes(p, "child"));
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
 * Toggle the info node of a person
 * @param node person node
 */
function toggleInfo(node) {
  console.assert(node.type === "person");

  node.infoVisible = !node.infoVisible;
  nodesLayer.select(`#p-${node.id}`)
    // FIXME this new height is hardcoded and needs to be updated with every new displayed value
    .attr("height", (node.infoVisible ? 190 : personNodeSize[1]) + (node.day_of_death !== "" || node.age > 120 ? 8 : 0))
    .select(".addInfo")
    .classed("hidden", !node.infoVisible);
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
    .attr("id", d => `p-${d.id}`)
    .attr("x", d => -d.bounds.width() / 2)
    .attr("y", d => -d.bounds.height() / 2)
    .attr("width", d => d.bounds.width())
    .attr("height", d => d.bounds.height() + (d.dead ? 8 : 0))
    .on("click", toggleInfo)
    .call(d3cola.drag)
    .append(d => insertData(d));

  personNode = nodesLayer.selectAll(".person");
  personNode.select(".addInfo")
    .data(viewGraph.nodes.filter(node => node.type === "person"))
    .attr("class", d => "addInfo" + (d.infoVisible ? "" : " hidden"));

  localize(window.navigator.language);

  d3cola.on("tick", () => {
    personNode
      .attr("x", d => d.x - personNodeSize[0] / 2)
      .attr("y", d => d.y - personNodeSize[1] / 2);
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
  });
}
