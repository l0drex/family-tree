import {config, localize, showError, translationToString} from "../main.js";
import {searchFamily, showFamily, hideFamily} from "./graphController.js";

let form = d3.select("#name-form");
const svg = d3.select("#family-tree");
const d3cola = cola.d3adaptor(d3);
// define layers
let nodesLayer = svg.select("#nodes");
let linkLayer = svg.select("#links");

(function init() {
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

  // setup of cola
  const viewportSize = [svg.node().getBBox().width, svg.node().getBBox().height];
  d3cola.flowLayout("x", config.gridSize * 1.5 + config.gridSize * 2.5 + config.gridSize * .5)
    .symmetricDiffLinkLengths(config.gridSize)
    .size(viewportSize);

  // catch the transformation events
  /*
  I have changed the default zoom behavior to the following one:
   - Nothing on double click
   - Zoom with Ctrl + wheel
   - Move with wheel (shift changes the axes)
  */
  let svgZoom = d3.zoom()
    .on("zoom", () => {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === "wheel") {
        if (d3.event.sourceEvent.wheelDelta < 0)
          svg.node().style.cursor = "zoom-out";
        else
          svg.node().style.cursor = "zoom-in";
      }
      svg.select("#vis").attr("transform", d3.event.transform.toString());
    })
    .on("end", () => {
      svg.node().style.cursor = "";
    })
    .filter(() => d3.event.type !== "dblclick" && (d3.event.type === "wheel" ? d3.event.ctrlKey : true))
    .touchable(() => ('ontouchstart' in window) || window.TouchEvent || window.DocumentTouch && document instanceof DocumentTouch);
  svg.call(svgZoom);

  // translate form placeholder
  let inputName = form.select("#input-name");
  inputName.attr("placeholder", translationToString({
    "en": "John Doe",
    "de": "Max Mustermann"
  }));

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

    let form = document.getElementById("name-form");
    form.onsubmit = event => {
      event.preventDefault();
      let name = document.getElementById("input-name").value;
      searchFamily(name);
    };
    form.oninput = () => {
      let name = document.getElementById("input-name").value;
      if (!name) {
        setFormError(false);
      }
    };
  });

  // change layout on mobile
  adjustForMobile();
  window.onresize = adjustForMobile;
})();

/**
 *
 * @param error {Boolean} true if the input of the form is invalid
 */
export function setFormError(error) {
  form.select("input[type=search]").classed("error", error);
}

/**
 * Adjusts various elements for mobile devices
 */
function adjustForMobile() {
  // check if header overflows
  let header = document.querySelector("header");
  let form = document.getElementById("name-form");
  const headerOverflown = window.innerWidth <= 577;
  const formInHeader = form.parentElement.tagName === "HEADER";

  if (headerOverflown && formInHeader) {
    // switch to mobile layout
    console.log("Optimizing form for small-width displays");
    form.remove();
    form.querySelectorAll("label[for=input-name]").forEach(label => {
      // there are multiple labels for translations
      label.innerHTML = translationToString({
        en: "Name:",
        de: "Name:"
      });
      label.classList.add("sr-only");
    });
    let formArticle = document.createElement("article");
    formArticle.style.width = "auto";
    formArticle.style.position = "absolute";
    formArticle.style.border = "solid var(--background-higher)";
    formArticle.style.right = "1rem";
    formArticle.append(form);
    document.querySelector("main").prepend(formArticle);

  } else if (!headerOverflown && !formInHeader) {
    // switch to desktop layout
    console.log("Optimizing form for wider-width displays");
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

export function addOptions(people) {
  d3.select("datalist#names").selectAll("option")
    .data(people.filter(p => p.id > 0))
    .enter().append("option")
    .attr("value", d => d.fullName).html(d => d.fullName);
}

/**
 * Toggle the info of a person
 * @param person person node
 */
function toggleInfo(person) {
  console.assert(person.type === "person");

  person.infoVisible = !person.infoVisible;
  let element = nodesLayer.select(`#p-${person.id}`)
    // FIXME this new height is hardcoded and needs to be updated with every new displayed value
    .attr("height", (person.infoVisible ? 190 : config.gridSize) + (person.dead ? 8 : 0));
  element.select(".addInfo")
    .classed("hidden", !person.infoVisible);

  // move element to the top
  element.remove();
  nodesLayer.node().append(element.node());
}

/**
 * Inserts data in a person node html template
 * @param person person node
 * @return {Node | ActiveX.IXMLDOMNode} the html content
 */
function insertData(person) {
  console.assert(person.type === "person", "Incorrect node type!");

  let html = d3.select("#info-template").node().cloneNode(true).content;
  html.querySelector(".fullName").innerHTML =
    person.fullName;
  if (person.additionalNames.born) {
    html.querySelector(".born")
      .classList.remove("hidden");
    html.querySelector(".born")
      .append(person.additionalNames.born);
  }
  if (person.additionalNames.named) {
    html.querySelector(".named")
      .classList.remove("hidden", person.additionalNames.named);
    html.querySelector(".named")
      .append(person.additionalNames.named);
  }
  html.querySelector(".years").innerHTML =
    (person.birthday ? " * " + person.birthday : "") + (person.dayOfDeath ? " † " + person.dayOfDeath : "");
  html.querySelector(".age").innerHTML =
    ((person.age && (person.dayOfDeath || person.age < 120)) ? person.age : "?");
  html.querySelector(".profession").innerHTML =
    (person.profession ? person.profession : "?");
  html.querySelector(".religion").innerHTML =
    (person.religion ? person.religion : "?");
  html.querySelector(".placeOfBirth").innerHTML =
    (person.placeOfBirth ? person.placeOfBirth : "?");
  html.querySelectorAll(".generation").forEach(n => n.innerHTML = n.innerHTML.replace(/%i/, person.generation));

  html.querySelector(".bg").setAttribute(
    "title", translationToString({
      en: "Click to show more information",
      de: "Klicke für weitere Informationen"
    }));

  return html;
}

function setName(name) {
  let inputName = document.getElementById("input-name");
  // place name of focus in header and title
  // NOTE this has to be here since localize() is called in draw
  inputName.value = "";
  inputName.placeholder = name;
  document.title += ` ${translationToString({
    en: "of",
    de: "von"
  })} ${name}`;
}

/**
 * Adds svg elements for each node and link in the view graph.
 * Also defines the cola.on("tick", ...) function to update the position of all nodes and height of the person nodes.
 */
export function draw(viewGraph, startPerson) {
  console.assert(viewGraph.nodes.length > 0,
    "Viewgraph has no nodes!");
  console.assert(viewGraph.links.length > 0,
    "Viewgraph has no links!");

  setName(startPerson.fullName);

  d3cola
    .nodes(viewGraph.nodes)
    .links(viewGraph.links)
    /*
    Adding some documentation since it's kinda hard to find:
    1. Iterations with no constraints
    2. Only structural (user-specified) constraints
    3. Iterations of layout with all constraints including anti-overlap constraints
    4. Not documented, but used in gridified small groups example.
       Seems to be the iterations while visible or something like that

    src: https://marvl.infotech.monash.edu/webcola/, at the bottom of the page
     */
    .start(10, 0, 10);

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
  let newPartners = partnerNode.enter().append("g")
    .attr("class", "partnerNode")
    .classed("locked", f => f.members.includes(startPerson.id));
  newPartners.append("circle")
    .attr("r", config.gridSize / 2);
  newPartners.append("text")
    .text(d => d.begin ? `⚭ ${d.begin}` : "")
    .attr("x", "-24pt")
    .attr("y", "5pt");
  newPartners.filter(f => f.members.includes(startPerson.id))
    .append("title")
    .text(f => {
      if (f.members.includes(startPerson.id)) {
        return translationToString({
          en: "This family cannot be hidden.",
          de: "Diese Familie kann nicht ausgeblendet werden."
        });
      }
    });
  let notLocked = newPartners.filter(f => !(f.members.includes(startPerson.id)))
    .on("click", hideFamily);
  notLocked.append("text")
    .text("-")
    .attr("y", 4);
  notLocked.append("title")
    .text(translationToString({
      en: "Click to hide this family.",
      de: "Klicke, um diese Familie auszublenden."
    }));
  partnerNode.exit().remove();
  partnerNode = nodesLayer.selectAll(".partnerNode");

  // node on which the user can click to show more people
  let etcNode = nodesLayer.selectAll(".etc")
    .data(viewGraph.nodes.filter(node => node.type === "etc"), d => d.viewId);
  let etcGroup = etcNode.enter().append("g")
    .attr("class", "etc");
  etcGroup.append("circle")
    .attr("r", config.gridSize / 2);
  etcGroup.append("text")
    .text("+")
    .attr("y", 5);
  etcGroup.on("click", showFamily)
    .append("title")
    .text(translationToString({
      en: "Click to show this family.",
      de: "Klicke, um diese Familie anzuzeigen."
    }));
  etcNode.exit().remove();
  etcNode = nodesLayer.selectAll(".etc");

  // person nodes
  let personNode = nodesLayer.selectAll(".person")
    .data(viewGraph.nodes.filter(node => node.type === "person" && node.id !== 0), d => d.viewId);
  personNode.enter().append("foreignObject")
    .attr("class", d => "person " + d.gender + (d.dead ? " dead" : ""))
    .attr("id", d => `p-${d.id}`)
    .attr("x", d => -d.bounds.width() / 2)
    .attr("y", d => -d.bounds.height() / 2)
    .attr("width", d => d.bounds.width())
    .attr("height", d => d.bounds.height())
    .classed("focused", d => d.id === startPerson.id)
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
      .attr("x", d => d.x - config.gridSize * 2.5)
      .attr("y", d => d.y - config.gridSize / 2);
    partnerNode
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    etcNode
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    link
      .attr("points", d => {
        if (d.target.type === "family") {
          return `${d.source.x},${d.source.y} ${d.target.x},${d.source.y} ${d.target.x},${d.target.y}`;
        } else if ([d.source.type, d.target.type].includes("etc")) {
          return `${d.source.x},${d.source.y} ${d.target.x},${d.target.y}`;
        } else {
          return `${d.source.x},${d.source.y} ${d.source.x + config.gridSize * 1.5},${d.source.y} ${d.source.x + config.gridSize * 1.5},${d.target.y} ${d.target.x},${d.target.y}`;
        }
      });
  });
}
