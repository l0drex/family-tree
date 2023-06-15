import {Etc, Family, Person} from "./Nodes";
import {useEffect, useMemo, useState} from "react";
import config from "../config";
import * as d3 from "d3";
import * as cola from "webcola";
import * as GedcomX from "gedcomx-js";
import {ColorMode, ViewGraph, ViewMode} from "../backend/ViewGraph";
import {GraphFamily, GraphPerson} from "../backend/graph";
import {Loading} from "./Loading";
import {strings} from "../main";

let d3cola = cola.d3adaptor(d3);

enum LoadingState {
  NOT_STARTED,
  LOADING,
  FINISHED
}

interface Props {
  focusId: string
  focusHidden: boolean
  onRefocus: (newFocus: GedcomX.Person) => void
  colorMode: ColorMode,
  viewMode: ViewMode
}

function TreeView(props: Props) {
  const [viewGraphState, setViewGraphState] = useState(LoadingState.NOT_STARTED);
  const [isDarkColorscheme, setIsDarkColorscheme] = useState(window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [isLandscape, setIsLandscape] = useState(window.matchMedia("(orientation: landscape)").matches);
  const [viewGraphProgress, setProgress] = useState(0);

  // todo fixme: changing view mode causes errors
  const viewGraph = useMemo(() => {
    setViewGraphState(LoadingState.LOADING);

    let viewGraph = new ViewGraph();
    viewGraph.addEventListener("progress", (e: CustomEvent) => setProgress(e.detail))
    viewGraph.load(props.focusId, props.viewMode).then(() => {
      setViewGraphState(LoadingState.FINISHED);

      console.assert(viewGraph.nodes.length > 0,
        "View graph has no nodes!");
      console.assert(viewGraph.links.length > 0,
        "View graph has no links!");
    });

    return viewGraph;
  }, [props.focusId, props.viewMode]);

  function onEtcClicked(family: GraphFamily) {
    setViewGraphState(LoadingState.LOADING);
    viewGraph.showFamily(family)
      .then(() => setViewGraphState(LoadingState.FINISHED));
  }

  function onFamilyClicked(family: GraphFamily) {
    setViewGraphState(LoadingState.LOADING);
    viewGraph.hideFamily(family)
      .then(() => setViewGraphState(LoadingState.FINISHED));
  }

  window.matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", e => setIsDarkColorscheme(e.matches));

  window.matchMedia("(orientation: landscape)")
    .addEventListener("change", (e) => setIsLandscape(e.matches));

  useEffect(() => {
    if (viewGraphState !== LoadingState.FINISHED) {
      d3cola.on("tick", () => {});
      return;
    }
    setupCola().then(() => {
      d3cola
        .nodes(viewGraph.nodes)
        .links(viewGraph.links);
      animateTree(viewGraph, props.colorMode, isLandscape, isDarkColorscheme);
    });
  }, [viewGraph, viewGraphState, props.colorMode, isDarkColorscheme, isLandscape]);

  let currentTransform = "";
  if (svgZoom) {
    let svg = d3.select<SVGElement, undefined>("#family-tree");
    let rect = svg.select<SVGRectElement>("rect").node();
    if (rect) {
      currentTransform = d3.zoomTransform(rect).toString();
    }
  }

  if (viewGraphState !== LoadingState.FINISHED) {
    return <Loading text={strings.loading.familyTree} value={viewGraphProgress}/>
  }

  return (
    <svg id="family-tree" xmlns="http://www.w3.org/2000/svg">
      <rect id='background' width='100%' height='100%'/>
      <g id="vis" transform={currentTransform}>
        <g id="links">
          {viewGraph.links.map((l, i) =>
            <path className="link" key={i}/>)}
        </g>
        <g id="nodes">
          {viewGraph.nodes.filter(n => n.type === "family").map((r: GraphFamily, i) =>
            <Family data={r} key={i} locked={r.involvesPerson(viewGraph.startPerson.data)}
                    onClicked={onFamilyClicked}/>)}
          {viewGraph.nodes.filter(n => n.type === "etc").map((r, i) =>
            <Etc key={i} onClick={onEtcClicked} family={r as GraphFamily}/>)}
          {viewGraph.nodes.filter(n => n instanceof GraphPerson).map((p, i) =>
            <Person data={p as GraphPerson} onClick={props.onRefocus} key={i}
                    focused={!props.focusHidden && (p as GraphPerson).data.getId() === props.focusId}/>)}
        </g>
      </g>
    </svg>
  );
}

let svgZoom;

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
  svgZoom = d3.zoom()
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

async function animateTree(graph: ViewGraph, colorMode: ColorMode, isLandscape: boolean, darkMode: boolean) {
  let iterations = graph.nodes.length < 100 ? 10 : 0;
  d3cola
    .symmetricDiffLinkLengths(config.gridSize);
  if (isLandscape) {
    d3cola.flowLayout("x", d => d.target instanceof GraphPerson ? config.gridSize * 5 : config.gridSize * 3.5)
  } else {
    d3cola.flowLayout("y", config.gridSize * 3)
  }
  d3cola.start(iterations, 0, iterations);

  let nodesLayer = d3.select("#nodes");
  let linkLayer = d3.select("#links");

  let personNode = nodesLayer.selectAll(".person")
    .data(graph.nodes.filter(p => p instanceof GraphPerson) as GraphPerson[])
  let partnerNode = nodesLayer.selectAll(".partnerNode")
    .data(graph.nodes.filter(node => node.type === "family"));
  let etcNode = nodesLayer.selectAll(".etc")
    .data(graph.nodes.filter(n => n.type === "etc"));
  let link = linkLayer.selectAll(".link")
    .data(graph.links);

  // reset style
  personNode.select(".bg").attr("style", null);

  switch (colorMode) {
    case ColorMode.NAME: {
      let last_names = graph.nodes.filter(n => n instanceof GraphPerson)
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
        .style("background-color", (d: GraphPerson) => d.data.isLiving ? ageColor(d.data.getAgeAt(new Date())) : "var(background-higher)")
        .style("color", (d: GraphPerson) =>
          (d.data.getAgeAt(new Date()) < 70 && d.data.isLiving) ? "var(--background)" : "var(--foreground)")
        .style("border-color", (d: GraphPerson) => d.data.isLiving ? "var(--background-higher)" : ageColor(d.data.getAgeAt(new Date())))
        .style("border-style", (d: GraphPerson) => d.data.isLiving ? "" : "solid");
      personNode
        .select(".focused")
        .style("box-shadow", d => `0 0 1rem ${ageColor(d.data.getAgeAt(new Date()))}`);
      break;
    }
    case ColorMode.GENDER: {
      const genderColor = d3.scaleOrdinal(["female", "male", "intersex", "unknown"], d3.schemeSet1);
      personNode
        .select(".bg")
        .style("background-color", (d: GraphPerson) => d.data.isLiving ? genderColor(d.getGender()) : "var(--background-higher)")
        .style("border-color", (d: GraphPerson) => d.data.isLiving ? "var(--background-higher)" : genderColor(d.getGender()))
        .style("border-style", (d: GraphPerson) => d.data.isLiving ? "" : "solid")
        .style("color", (d: GraphPerson) => d.data.isLiving && matchMedia("(prefers-color-scheme: light)").matches ? "var(--background)" : "var(--foreground)")
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

  function updateNodes() {
    personNode
      .attr("x", d => d.x - d.width / 2)
      .attr("y", d => d.y - d.height / 2);
    partnerNode
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    etcNode
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
  }

  if (isLandscape) {
    d3cola.on("tick", () => {
      updateNodes();

      link.attr("d", d => {
        // 1 or -1
        let flip = -(Number((d.source.y - d.target.y) > 0) * 2 - 1);
        let radius = Math.min(config.gridSize / 2, Math.abs(d.target.x - d.source.x) / 2, Math.abs(d.target.y - d.source.y) / 2);

        if (d.target instanceof GraphPerson) {
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
      updateNodes();

      link.attr("d", d => {
        // 1 or -1
        let flip = -(Number((d.source.x - d.target.x) > 0) * 2 - 1);

        let radius = Math.min(config.gridSize / 2, Math.abs(d.target.x - d.source.x) / 2, Math.abs(d.target.y - d.source.y) / 2);

        if (d.target instanceof GraphPerson) {
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
