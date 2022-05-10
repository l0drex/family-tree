import {config, showError, translationToString} from "../main.js";
import {getPersonPath, hideFamily, searchPerson, showFamily} from "./graphController.js";
import {personFactTypes} from "../gedcomx.js";
import * as graphModel from "./graphModel.js";

let form = d3.select("#name-form");
const svg = d3.select("#family-tree");
const d3cola = cola.d3adaptor(d3);
// define layers
let nodesLayer = svg.select("#nodes");
let linkLayer = svg.select("#links");
let focusPerson, startP;

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
    .touchable(() => ('ontouchstart' in window) || window.TouchEvent ||
      window.DocumentTouch && document instanceof DocumentTouch);
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
      searchPerson(name);
    };
    form.oninput = () => {
      let name = document.getElementById("input-name").value;
      if (!name) {
        setFormError(false);
      }
    };
  });

  // setup filter form
  document.querySelector(".filter-form").addEventListener("submit", event => {
    event.preventDefault();
    if (event.submitter.classList.contains("remove-filter")) {
      // remove filter
      let filter = event.submitter.parentElement.querySelector(".filter-text").dataset.value;
      graphModel.filter.active = graphModel.filter.active.filter(f => f !== filter);
    } else {
      // add filter
      let newFilter = document.querySelector("#add-filter").value;
      graphModel.filter.active.push(newFilter);
    }

    // put active filter in url search params
    let url = new URL(window.location);
    url.searchParams.set("filter", graphModel.filter.active.join());
    window.location = url;

    return false;
  });

  // change layout on mobile
  adjustForMobile();
  window.onresize = adjustForMobile;
})();

export function showFilter() {
  console.debug("Active filter:", graphModel.filter.active);
  document.querySelectorAll("#add-filter option").forEach(option => {
    option.innerText = graphModel.filter.localize(option.value)
  });

  if (graphModel.filter.active.length) {
    graphModel.filter.active.forEach(filter => {
      let filterElement = document.getElementById("filter").cloneNode(true).content;
      filterElement.querySelector(".filter-text").innerText = graphModel.filter.localize(filter);
      filterElement.querySelector(".filter-text").dataset.value = filter;
      document.querySelector(".filter-selected")
        .append(filterElement.cloneNode(true));
    });
  } else {
    document.querySelector(".filter-selected")
      .append(translationToString({
        en: "None",
        de: "Keine"
      }));
  }
}

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
  const isPortrait = window.innerWidth < window.innerHeight;
  let form = document.getElementById("name-form");
  const formInHeader = form.parentElement.tagName === "HEADER";

  if (isPortrait && formInHeader) {
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
    let aside = document.querySelector("#info-panel");
    aside.prepend(form);
    aside.querySelector("h1").classList.add("hidden");
    let id = document.querySelector("#info-panel .id");
    id.remove();
    aside.prepend(id);
  } else if (!isPortrait && !formInHeader) {
    // switch to desktop layout
    console.log("Optimizing form for wider-width displays");
    form.remove();
    form.querySelectorAll("label[for=input-name]").forEach(label => {
      label.innerHTML = translationToString({
        en: "of",
        de: "von"
      });
      label.classList.remove("sr-only");
    });
    document.querySelector("#info-panel h1").classList.remove("hidden")
    document.querySelector("header").append(form);
  }
}

/**
 * Adds search options to the search field
 * @param persons {Array<Person>}
 */
export function addOptions(persons) {
  d3.select("datalist#names").selectAll("option")
    .data(persons.filter(p => p.id !== "0"))
    .enter().append("option")
    .attr("value", person => person.getFullName())
    .html(person => person.getFullName());
}

/**
 * Fills the information panel, adjusts the style and shows relevant people in the tree
 * @param person
 */
async function setFocus(person) {
  if (focusPerson && focusPerson === person) {
    focusPerson = undefined;

    // hide info panel
    d3.select("#info-panel").classed("hidden", true);

    // unset focused style
    nodesLayer.selectAll(".person .focused")
      .classed("focused", false);
    return;
  }
  focusPerson = person;

  d3.select("#info-panel").classed("hidden", false);

  // set name in search field
  let inputName = document.getElementById("input-name");
  inputName.value = "";
  inputName.value = person.data.getFullName();
  document.title = `${translationToString({
    en: "Family tree of",
    de: "Stammbaum von"
  })} ${person.data.getFullName()}`;

  // fill side panel with relevant information
  insertData(person);
  setFamilyPath(person);

  // set focused style
  nodesLayer.selectAll(".person .bg")
    .classed("focused", p => p.data.id === focusPerson.data.id);
}

/**
 * Adds the data to the family path view in the footer
 */
function setFamilyPath(person) {
  let list = document.getElementById("family-path");
  list.innerHTML = "";

  let entries = getPersonPath(person);
  entries.forEach(e => {
    let li = document.createElement("li");
    if (e.data.id === person.data.id) {
      li.classList.add("focusPerson")
    }
    li.innerHTML = e.data.getFullName();
    list.append(li);
  });
}

/**
 * Fills out data in the side panel
 * @param person person node
 * @return {Node | ActiveX.IXMLDOMNode} the html content
 */
function insertData(person) {
  console.assert(person.type === "person", `Incorrect node type: ${person}`);

  let panel = d3.select("#info-panel")

  panel.select(".id").html(person.data.id);
  panel.select(".fullName").html(person.data.getFullName());
  panel.select(".birth-name")
    .classed("hidden", !person.data.getMarriedName())
    .html(translationToString({
      en: `born ${person.data.getBirthName()}`,
      de: `geboren ${person.data.getBirthName()}`
    }));
  panel.select(".alsoKnownAs")
    .classed("hidden", !person.data.getAlsoKnownAs())
    .html(translationToString({
      en: "also known as " + person.data.getAlsoKnownAs(),
      de: "auch bekannt als " + person.data.getAlsoKnownAs()
    }));

  // facts start
  let factView = panel.select("#factView");
  factView.html("");
  person.data.getFacts().sort((a, b) => {
    // place birth at top, generation right below
    if (a.type === personFactTypes.Birth) {
      return -1;
    } else if (b.type === personFactTypes.Birth) {
      return 1;
    } else if (a.type === personFactTypes.Generation) {
      return -1;
    } else if (b.type === personFactTypes.Generation) {
      return 1;
    }

    if (a.date && !b.date) {
      return 1;
    } else if (!a.date && b.date) {
      return -1;
    }
    if (a.date && b.date) {
      let aDate = a.date.toDateObject();
      let bDate = b.date.toDateObject();
      if (aDate && bDate) {
        return aDate - bDate;
      }
    }

    return 0;
  }).forEach(fact => {
    factView.append("li").html(fact.toString());
  });
  return panel;
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
    .classed("locked", f => f.data.involvesPerson(startPerson.data));
  newPartners.append("circle")
    .attr("r", config.gridSize / 2);
  newPartners.append("text")
    .text(r => r.data.marriage() && r.data.marriage().date ? `⚭ ${r.data.marriage().date.toString()}` : "")
    .attr("x", "-24pt")
    .attr("y", "5pt");
  newPartners.filter(r => r.data.involvesPerson(startPerson.data))
    .append("title")
    .text(r => {
      if (r.data.involvesPerson(startPerson.data)) {
        return translationToString({
          en: "This family cannot be hidden.",
          de: "Diese Familie kann nicht ausgeblendet werden."
        });
      }
    });
  let notLocked = newPartners.filter(r => !(r.data.involvesPerson(startPerson.data)))
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
    .data(viewGraph.nodes.filter(n => n.type === "etc"), e => e.viewId);
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
    .data(viewGraph.nodes.filter(p => p.type === "person"), p => p.viewId);
  personNode.enter().append("foreignObject")
    .attr("class", p => `person ${p.data.getGender()}`)
    .classed("dead", p => p.data.getFactsByType(personFactTypes.Death)[0] || p.data.getAge() >= 120)
    .attr("id", d => `p-${d.data.id}`)
    .attr("x", d => -d.bounds.width() / 2)
    .attr("y", d => -d.bounds.height() / 2)
    .attr("width", d => d.bounds.width())
    .attr("height", d => d.bounds.height())
    .on("click", setFocus)
    //.call(d3cola.drag)  // still useful for debugging
    .append("xhtml:div")
    .attr("xmlns", "http://www.w3.org/1999/xhtml")
    .classed("bg", true)
    .attr("title", translationToString({
      en: "Click to show more information",
      de: "Klicke für weitere Informationen"
    })).append("p")
    .html(p => p.data.getFullName())
    .classed("fullName", true)
  personNode.exit().remove();
  personNode = nodesLayer.selectAll(".person");

  if (!startP) {
    startP = startPerson;
    setFocus(startPerson);
  }

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
          return `${d.source.x},${d.source.y}
          ${d.target.x},${d.source.y}
          ${d.target.x},${d.target.y}`;
        } else if ([d.source.type, d.target.type].includes("etc")) {
          return `${d.source.x},${d.source.y}
          ${d.target.x},${d.target.y}`;
        } else {
          return `${d.source.x},${d.source.y}
          ${d.source.x + config.gridSize * 1.5},${d.source.y}
          ${d.source.x + config.gridSize * 1.5},${d.target.y}
          ${d.target.x},${d.target.y}`;
        }
      });
  });
}
