import {Etc, Family, Person} from "./Nodes";
import {useEffect, useState} from "react";
import config from "../config";
import * as d3 from "d3";
import * as cola from "webcola";
import * as GedcomX from "gedcomx-js";
import {ColorMode, ViewGraph} from "../backend/ViewGraph";
import {GraphFamily, GraphPerson} from "../backend/graph";

let d3cola = cola.d3adaptor(d3);

interface Props {
  focus: GedcomX.Person
  focusHidden: boolean
  onRefocus: (newFocus: GedcomX.Person) => void
  colorMode: ColorMode,
  graph: ViewGraph
}

function TreeView(props: Props) {
  const [, updateGraph] = useState(props.graph.nodes.length);

  function onGraphChanged() {
      updateGraph(props.graph.nodes.length);
  }

  props.graph.addEventListener("add", onGraphChanged);
  props.graph.addEventListener("remove", onGraphChanged);

  const focusId = props.focus.getId();
  const nodeLength = props.graph.nodes.length;

  useEffect(() => {
    setupCola();
    window.matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => animateTree(props.graph, props.colorMode));
  }, [props.graph, props.colorMode])

  window.matchMedia("(orientation: landscape)")
    .addEventListener("change", () => animateTree(props.graph, props.colorMode));

  useEffect(() => {
    animateTree(props.graph, props.colorMode);
  }, [focusId, nodeLength, props.graph, props.colorMode]);

  console.assert(props.graph.nodes.length > 0,
    "View graph has no nodes!");
  console.assert(props.graph.links.length > 0,
    "View graph has no links!");
  d3cola
    .nodes(props.graph.nodes)
    .links(props.graph.links);

  return (
    <svg id="family-tree" xmlns="http://www.w3.org/2000/svg">
      <rect id='background' width='100%' height='100%'/>
      <g id="vis">
        <g id="links">
          {props.graph.links.map((l, i) =>
            <path className="link" key={i}/>)}
        </g>
        <g id="nodes">
          {props.graph.nodes.filter(n => n.type === "family").map((r, i) =>
            <Family data={r} key={i}
                    locked={(r as GraphFamily).involvesPerson(props.graph.startPerson.data.getId())}/>)}
          {props.graph.nodes.filter(n => n.type === "etc").map((r, i) =>
            <Etc key={i} data={r} graph={props.graph}/>)}
          {props.graph.nodes.filter(n => n.type === "person").map((p, i) =>
            <Person data={p} onClick={props.onRefocus} key={i}
                    focused={!props.focusHidden && (p as GraphPerson).data.getId() === props.focus.getId()}/>)}
        </g>
      </g>
    </svg>
  );
}

async function setupCola() {
  let svg = d3.select<SVGSVGElement, undefined>("#family-tree");

  const viewportSize = [svg.node().getBBox().width, svg.node().getBBox().height];
  d3cola.size(viewportSize);

  // catch the transformation events
  /*
  I have changed the default zoom behavior to the following one:
   - Nothing on double click
   - Zoom with Ctrl + wheel
   - Move with wheel (shift changes the axes)
  */
  let svgZoom = d3.zoom()
    .on("zoom", event => {
      if (event.sourceEvent && event.sourceEvent.type === "wheel") {
          svg.node().style.cursor = event.sourceEvent.wheelDelta < 0 ? "zoom-out" : "zoom-in";
      }
      svg.select("#vis").attr("transform", event.transform.toString());
    })
    .on("end", () => {
      svg.node().style.cursor = "";
    })
    .filter(event => event.type !== "dblclick" && (event.type === "wheel" ? event.ctrlKey : true))
    .touchable(() => ('ontouchstart' in window) || Boolean(window.TouchEvent))
    .wheelDelta(event => {
      // modified version of https://github.com/d3/d3-zoom#zoom_wheelDelta
      return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002);
    });
  svg.select<SVGElement>("rect").call(svgZoom);
}

async function animateTree(graph: ViewGraph, colorMode: ColorMode) {
  const isLandscape = window.matchMedia("(orientation: landscape)").matches;
  let iterations = graph.nodes.length < 100 ? 10 : 0;
  d3cola
    .symmetricDiffLinkLengths(config.gridSize);
  if (isLandscape) {
    d3cola.flowLayout("x", d => d.target.type === "person" ? config.gridSize * 5 : config.gridSize * 3.5)
  } else {
    d3cola.flowLayout("y", config.gridSize * 3)
  }
  d3cola.start(iterations, 0, iterations);

  let nodesLayer = d3.select("#nodes");
  let linkLayer = d3.select("#links");

  let personNode = nodesLayer.selectAll(".person")
    .data(graph.nodes.filter(p => p.type === "person") as GraphPerson[])
  let partnerNode = nodesLayer.selectAll(".partnerNode")
    .data(graph.nodes.filter(node => node.type === "family"));
  let etcNode = nodesLayer.selectAll(".etc")
    .data(graph.nodes.filter(n => n.type === "etc"));
  let link = linkLayer.selectAll(".link")
    .data(graph.links);

  // reset style
  personNode.select(".bg").attr("style", null);

  const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  switch (colorMode) {
    case ColorMode.NAME: {
      let last_names = graph.nodes.filter(n => n.type === "person")
        .map((p: GraphPerson) => p.getName().split(" ").reverse()[0]);
      last_names = Array.from(new Set(last_names));
      const nameColor = d3.scaleOrdinal(last_names, d3.schemeSet3)
      personNode
        .select(".bg")
        .style("background-color", d => nameColor(d.getName().split(" ").reverse()[0]))
        .style("color", "black")
      personNode
        .select(".focused")
        .style("box-shadow", d => `0 0 1rem ${nameColor(d.getName().split(" ").reverse()[0])}`);
      break;
    }
    case ColorMode.AGE: {
      const ageColor = d3.scaleSequential()
        .domain([0, 120])
        .interpolator((d) => darkMode ? d3.interpolateYlGn(d) : d3.interpolateYlGn(1 - d))
      personNode
        .select(".bg")
        .style("background-color", (d: GraphPerson) => d.data.getLiving() ? ageColor(d.data.getAgeToday()) : "var(background-higher)")
        .style("color", (d: GraphPerson) =>
          (d.data.getAgeToday() < 70 && d.data.getLiving()) ? "var(--background)" : "var(--foreground)")
        .style("border-color", (d: GraphPerson) => d.data.getLiving() ? "var(--background-higher)" : ageColor(d.data.getAgeToday()))
        .style("border-style", (d: GraphPerson) => d.data.getLiving() ? "" : "solid");
      personNode
        .select(".focused")
        .style("box-shadow", d => `0 0 1rem ${ageColor(d.data.getAgeToday())}`);
      break;
    }
    case ColorMode.GENDER: {
      const genderColor = d3.scaleOrdinal(["female", "male", "intersex", "unknown"], d3.schemeSet1);
      personNode
        .select(".bg")
        .style("background-color", (d: GraphPerson) => d.data.getLiving() ? genderColor(d.getGender()) : "var(--background-higher)")
        .style("border-color", (d: GraphPerson) => d.data.getLiving() ? "var(--background-higher)" : genderColor(d.getGender()))
        .style("border-style", (d: GraphPerson) => d.data.getLiving() ? "" : "solid")
        .style("color", (d: GraphPerson) => d.data.getLiving() && matchMedia("(prefers-color-scheme: light)").matches ? "var(--background)" : "var(--foreground)")
      personNode
        .select(".focused")
        .style("box-shadow", d => `0 0 1rem ${genderColor(d.getGender())}`);
      break;
    }
  }

  personNode
    .transition()
    .duration(300)
    .style("opacity", "1")

  link
    .transition()
    .duration(600)
    .style("opacity", "1")
  etcNode
    .transition()
    .duration(300)
    .style("opacity", "1")

  if (isLandscape) {
    d3cola.on("tick", () => {
      personNode
        .attr("x", d => d.x - d.width / 2)
        .attr("y", d => d.y - d.height / 2);
      partnerNode
        .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
      etcNode
        .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

      link.attr("d", d => {
        // 1 or -1
        let flip = -(Number((d.source.y - d.target.y) > 0) * 2 - 1);
        let radius = Math.min(config.gridSize / 2, Math.abs(d.target.x - d.source.x) / 2, Math.abs(d.target.y - d.source.y) / 2);

        if (d.target.type === "person") {
          return `M${d.source.x},${d.source.y} ` +
            `h${config.gridSize} ` +
            `a${radius} ${radius} 0 0 ${(flip + 1) / 2} ${radius} ${flip * radius} ` +
            `V${d.target.y - (flip) * radius} ` +
            `a${radius} ${radius} 0 0 ${(-flip + 1) / 2} ${radius} ${flip * radius} ` +
            `H${d.target.x}`;
        } else {
          return `M${d.source.x} ${d.source.y} ` +
            `H${d.target.x - radius} ` +
            `a${radius} ${radius} 0 0 ${(flip + 1) / 2} ${radius} ${flip * radius} ` +
            `V${d.target.y}`;
        }
      });
    });
  } else {
    d3cola.on("tick", () => {
      personNode
        .attr("x", d => d.x - d.width / 2)
        .attr("y", d => d.y - d.height / 2);
      partnerNode
        .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
      etcNode
        .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

      link.attr("d", d => {
        // 1 or -1
        let flip = -(Number((d.source.x - d.target.x) > 0) * 2 - 1);

        let radius = Math.min(config.gridSize / 2, Math.abs(d.target.x - d.source.x) / 2, Math.abs(d.target.y - d.source.y) / 2);

        if (d.target.type === "person") {
          return `M${d.source.x},${d.source.y} ` +
            `v${config.gridSize} ` +
            `a${radius} ${radius} 0 0 ${(-flip + 1) / 2} ${flip * radius} ${radius} ` +
            `H${d.target.x - (flip) * radius} ` +
            `a${radius} ${radius} 0 0 ${(flip + 1) / 2} ${flip * radius} ${radius} ` +
            `V${d.target.y}`;
        } else {
          return `M${d.source.x} ${d.source.y} ` +
            `H${d.target.x - flip * radius} ` +
            `a${radius} ${radius} 0 0 ${(flip + 1) / 2} ${flip * radius} ${radius} ` +
            `V${d.target.y}`;
        }
      });
    });
  }
}


export default TreeView;
