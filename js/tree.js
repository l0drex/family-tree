import {config, localize, showError, translationToString} from "./main.js";


class GraphManager {
  viewGraph = {
    nodes: [],
    links: []
  };
  #people;
  #families;

  /**
   * The graph manager manages graph data.
   * It adds or removes people, families and the links between them to / from the view.
   * It is not responsible for displaying the data to the user.
   * @param people {array} list of people objects
   * @param families {array} list of family objects
   * @param startPersonId {number} id of the person with which the initial view should start
   */
  constructor(people, families, startPersonId=1) {
    this.#people = people;
    this.#families = families;

    this.#startViewgraph(this.#people[startPersonId]);
  }

  /**
   * Adds the startPerson and her / his  families to the initial view
   * @param startPerson person with who to start
   */
  #startViewgraph(startPerson) {
    this.startNode = startPerson;
    this.startNode.infoVisible = true;

    console.info("Starting graph with", startPerson.fullName);
    this.#families.filter(f => f.members.includes(startPerson.id))
      .forEach(p => this.showFamily(p));
  }

  /**
   * Adds the node to the view
   * @param node
   * @returns {boolean} true if the node is now visible
   */
  showNode(node) {
    if (this.viewGraph.nodes.includes(node)) {
      if (node.type.includes("removed")) {
        node.type = node.type.replace("-removed", "");
        return true;
      }

      return false;
    }

    node.viewId = this.viewGraph.nodes.length;
    this.viewGraph.nodes.push(node);
    return true;
  }

  /**
   * Hides the node from the view
   * @param node
   * @return {boolean} true if the node is now invisible
   */
  hideNode(node) {
    if (node.includes("removed"))
      return false;

    node.type += "-removed";
    return true;
  }

  /**
   * Adds a family and its direct members to the view.
   * Adds etc-nodes to members where applicable.
   * @param family
   */
  showFamily(family) {
    console.groupCollapsed(`Adding new family ${family.partners}`);

    // array containing the view graph ids of the partners
    if (family.members.includes(0))
      console.warn("Person \"Unknown\" is in the family!");

    // replace existing etc nodes with a family node
    family.type = "family";
    this.showNode(family);

    family.members.forEach(p => {
      let person = this.#people[p];

      // add all people in the family
      if (!this.showNode(person))
        return;

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
      this.viewGraph.links.push(familyLink);

      // add etc-node
      let otherFamilies = this.#families.filter(f => !(this.viewGraph.nodes.includes(f)) && f.members.includes(p));
      console.assert(otherFamilies.length <= 1, "There seems to be more than one etc-node!", otherFamilies)
      // FIXME removed check for p!=focusNode
      if (otherFamilies.length) {
        console.debug("Adding etc for", person.fullName)
        otherFamilies.forEach(family => {
          family.type = "etc";
          family.target = p;

          if (family.children.includes(p) && person.married) {
            this.showNode(family);
            this.viewGraph.links.push({
              source: family.viewId,
              target: person.viewId
            });
          } else if (family.partners.includes(p) && person.parentsKnown) {
            this.showNode(family);
            this.viewGraph.links.push({
              source: person.viewId,
              target: family.viewId
            });
          }
        });
      }
    });
    console.groupEnd();
  }

  /**
   * Hides a family from the view
   * @param family
   */
  hideFamily(family) {
    if (family.members.includes(this.startNode.id)) {
      console.warn("Initial families cannot be removed!")
      return;
    }

    console.groupCollapsed(`Hiding family ${family.partners}`);

    // find all leaves, e.g. all nodes who are not connected to other families
    let leaves = family.members.filter(p => {
        let person = this.#people[p];
        // check if the node is connected to two families
        let linksToFamilies = this.viewGraph.links.filter(link => {
          let nodes = [link.source, link.target];
          if (!(nodes.includes(person)))
            return false;
          // remove family and person node
          nodes = nodes.filter(n => n.type === "family")
          return nodes.length;
        });
        return linksToFamilies.length <= 1;
      }
    );
    console.debug("Removing the following people:", leaves);

    // remove them from the graph
    this.viewGraph.nodes.filter(node => {
      if (node.type.includes("removed"))
        return false;

      switch (node.type) {
        case "person":
          return leaves.includes(node.id);
        case "etc":
          return leaves.includes(node.target);
        case "family":
          // replace family that should be removed with an etc-node
          let visibleMembers = node.members.filter(person => !(leaves.includes(person)));
          if (visibleMembers.length === 1) {
            node.type = "etc";
            node.target = this.#people[visibleMembers[0]].viewId;
            console.debug("Replacing family with etc for target", this.#people[visibleMembers[0]].fullName);
          }
          return false;
        default:
          // this happens when the node type is not caught, e.g. when the node was previously removed
          console.warn("Unknown node type", node);
          return false;
      }
    }).forEach(p => this.hideNode(p));

    // FIXME to much links being deleted (probably a data error)
    this.viewGraph.links = this.viewGraph.links.filter(link => {
      return !(leaves.includes(link.source.id)) && !(leaves.includes(link.target.id));
    });

    console.groupEnd();
  }

  /**
   * Searches for a person in the data. The person does not have to be visible.
   * If more than one person matches the name, it returns one of them.
   * @param name {string} the full name of the person, or a part of it
   * @returns person
   */
  findPerson(name) {
    return this.#people.find(person => person.fullName.toLowerCase().includes(name))
  }
}


// check if libraries loaded
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
  .flowLayout("y", 60)
  .symmetricDiffLinkLengths(40)
  .avoidOverlaps(true)
  .size(viewportSize);

// catch the transformation events
svg.select("#background")
  .call(d3.zoom().on("zoom", () =>
    svg.select("#vis").attr("transform", d3.event.transform.toString())));

// define layers
let nodesLayer = svg.select("#nodes");
let linkLayer = svg.select("#links");

let graphManager;

// form functionality
let form = d3.select("#name-form");

let inputName = form.select("#input-name");
inputName.attr("placeholder", translationToString({
  "en": "John Doe",
  "de": "Max Mustermann"
}));

// remove error style when input is empty
form.on("input", () => {
  if (!inputName.node().value)
    form.select("input[type=search]").classed("error", false);
});
// search for the person and reload the page with the persons' id as search-param
form.on("submit", () => {
  d3.event.preventDefault();

  if (!graphManager) {
    console.error("Graph has not been loaded yet!");
    return;
  }

  let name = inputName.node().value;
  // if no name was given, reload the page with no param -> uses the default: id=1
  let id = "";
  if (name) {
    // find a person that matches the given name
    let person = graphManager.findPerson(inputName.node().value.toLowerCase());

    // if no person was found, throw error
    form.select("input[type=search]").classed("error", !person);
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

// change layout on mobile
adjustForMobile();
window.onresize = adjustForMobile;

let data = JSON.parse(localStorage.getItem("familyData"));
if (!data) {
  showError({
    en: "The calculated graph is empty!" +
      "Please check if your files are empty. If not, please contact the administrator!",
    de: "Der berechnete Graph ist leer!" +
      " Prüfe bitte, ob die Dateien leer sind. Sollte dies nicht der Fall sein, kontaktiere bitte den Administrator!"
  }, "graph")
}
setup(data.people, data.families);

/**
 * Adjusts varius elements for mobile devices
 */
function adjustForMobile() {
  // check if header overflows
  let header = document.querySelector("header");
  let form = document.getElementById("name-form");
  const headerOverflown = window.innerWidth <= 577;
  const formInHeader = form.parentElement.tagName === "HEADER";
  if (headerOverflown && formInHeader) {
    console.log("Optimizing form for small-width displays")
    form.remove();
    form.querySelectorAll("label[for=input-name]").forEach(label => {
      label.innerHTML = translationToString({
        en: "Name:",
        de: "Name:"
      });
      label.classList.add("sr-only");
    });
    let formArticle = document.createElement("article");
    formArticle.append(form);
    document.querySelector("main").prepend(formArticle);
  } else if (!headerOverflown && !formInHeader) {
    console.log("Optimizing form for wider-width displays")
    form.remove();
    form.querySelectorAll("label[for=input-name]").forEach(label => {
      label.innerHTML = translationToString({
        en: "by",
        de: "von"
      });
      label.classList.remove("sr-only");
    });
    header.append(form);
    document.querySelector("main").querySelector("article").remove();
  }
}

/**
 * Called only once. Sets up the graph
 * @param people {array} list of people objects
 * @param families {array} list of family objects
 */
function setup(people, families) {
  // add options to search field
  d3.select("datalist#names").selectAll("option")
    .data(people.filter(p => p.id > 0))
    .enter().append("option")
    .attr("value", d => d.fullName).html(d => d.fullName);

  // get id from url
  let url = new URL(window.location);
  let id = Number(url.searchParams.get("id"));

  if (id)
    graphManager = new GraphManager(people, families, id);
  else {
    graphManager = new GraphManager(people, families);
    id = 1;
  }
  update();

  // move startNode in front of all nodes
  let startNodeElement = document.getElementById(`p-${id}`);
  startNodeElement.remove();
  nodesLayer.node().append(startNodeElement);

  // place name of focus in header and title
  // NOTE this has to be here since localize() is called in update
  inputName.node().value = "";
  inputName.attr("placeholder", graphManager.startNode.fullName);
  document.title += ` ${translationToString({
    en: "of",
    de: "von"
  })} ${graphManager.startNode.fullName}`;
}

/**
 * Toggle the info node of a person
 * @param node person node
 */
function toggleInfo(node) {
  console.assert(node.type === "person");

  node.infoVisible = !node.infoVisible;
  let element = nodesLayer.select(`#p-${node.id}`)
    // FIXME this new height is hardcoded and needs to be updated with every new displayed value
    .attr("height", (node.infoVisible ? 190 : config.personNodeSize[1]) + (node.dead ? 8 : 0));
  element.select(".addInfo")
    .classed("hidden", !node.infoVisible);

  // move element to the top
  element.remove();
  nodesLayer.node().append(element.node());
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
 * Adds svg elements for each node, link and optionally group in the view graph.
 * Also defines the cola.on("tick", ...) function to update the position of all nodes and height of the person nodes.
 */
async function update() {
  console.assert(graphManager.viewGraph.nodes.length > 0,
    "Viewgraph has no nodes!");
  console.assert(graphManager.viewGraph.links.length > 0,
    "Viewgraph has no links!");

  d3cola
    .nodes(graphManager.viewGraph.nodes)
    .links(graphManager.viewGraph.links)
    .start(0, 50);

  // the following lines define content and style of all the svg elements in the graph

  // family links
  let link = linkLayer.selectAll(".link")
    .data(graphManager.viewGraph.links);
  link.enter().append("polyline")
    .attr("class", "link");
  link.exit().remove();
  link = linkLayer.selectAll(".link");

  // partner node
  let partnerNode = nodesLayer.selectAll(".partnerNode")
    .data(graphManager.viewGraph.nodes.filter(node => node.type === "family"), d => d.viewId);
  let newPartners = partnerNode.enter().append("g")
    .attr("class", "partnerNode");
  newPartners.append("polyline")
    .attr("points",
      `0,0 0,${config.personDiff}`);
  newPartners.append("circle")
    .attr("r", config.personDiff * .66)
    .on("click", f => {
      graphManager.hideFamily(f);
      update();
    });
  newPartners.append("text")
    .text("-")
    .attr("y", 4);
  newPartners.append("text")
    .text(d => d.begin ? `⚭ ${d.begin}` : "")
    .attr("y", -20)
  partnerNode.exit().remove();
  partnerNode = nodesLayer.selectAll(".partnerNode");

  // node on which the user can click to show more people
  let etcNode = nodesLayer.selectAll(".etc")
    .data(graphManager.viewGraph.nodes.filter(node => node.type === "etc"), d => d.viewId);
  let etcGroup = etcNode.enter().append("g")
    .attr("class", "etc")
    .on("mousedown", f => {
      graphManager.showFamily(f);
      update();
    })
    .on("touchend", f => {
      graphManager.showFamily(f);
      update();
    });
  etcGroup.append("circle")
    .attr("r", config.personDiff * .75);
  etcGroup.append("text")
    .text("+")
    .attr("y", 5);
  etcNode.exit().remove();
  etcNode = nodesLayer.selectAll(".etc");

  // person nodes
  let personNode = nodesLayer.selectAll(".person")
    .data(graphManager.viewGraph.nodes.filter(node => node.type === "person" && node.id !== 0), d => d.viewId)
  personNode.enter().append("foreignObject")
    .attr("class", d => "person " + d.gender + (d.dead ? " dead" : ""))
    .attr("id", d => `p-${d.id}`)
    .attr("x", d => -d.bounds.width() / 2)
    .attr("y", d => -d.bounds.height() / 2)
    .attr("width", d => d.bounds.width())
    .attr("height", d => d.bounds.height() + (d.dead ? 8 : 0))
    .classed("focused", d => d.id === graphManager.startNode.id)
    .on("click", toggleInfo)
    .call(d3cola.drag)
    .append(d => insertData(d));
  personNode.exit().remove();

  personNode = nodesLayer.selectAll(".person");
  personNode.select(".addInfo")
    .data(graphManager.viewGraph.nodes.filter(node => node.type === "person"))
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
        if (d.target.type === "family")
          return `${d.source.x},${d.source.y} ${d.source.x},${d.target.y} ${d.target.x},${d.target.y}`;
        else if ([d.source.type, d.target.type].includes("etc"))
          return `${d.source.x},${d.source.y} ${d.target.x},${d.target.y}`
        else
          return `${d.source.x},${d.source.y + config.personDiff} ${d.target.x},${d.source.y + config.personDiff} ${d.target.x},${d.target.y}`;
      });
  });
}
