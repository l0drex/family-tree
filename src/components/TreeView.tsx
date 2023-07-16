import {Node} from "./Nodes";
import {createContext, useEffect, useMemo, useState} from "react";
import config from "../config";
import * as d3 from "d3";
import {Graph} from "@visx/network";
import * as cola from "webcola";
import {EventType} from "webcola";
import * as GedcomX from "gedcomx-js";
import {ColorMode, ViewGraph, ViewMode} from "../backend/ViewGraph";
import {GraphFamily, GraphPerson} from "../backend/graph";
import {Loading} from "./GeneralComponents";
import {strings} from "../main";
import {Person} from "../gedcomx/gedcomx-extensions";

const d3cola = cola.d3adaptor(d3);

enum LoadingState {
  NOT_STARTED,
  LOADING,
  FINISHED
}

interface Props {
  focusHidden: boolean
  onRefocus: (newFocus: GedcomX.Person) => void
  colorMode: ColorMode,
  viewMode: ViewMode,
  startPerson: Person
}

export const GraphContext = createContext<ViewGraph>(undefined);

function TreeView(props: Props) {
  const [viewGraphState, setViewGraphState] = useState(LoadingState.NOT_STARTED);
  const [isLandscape, setIsLandscape] = useState(window.matchMedia("(orientation: landscape)").matches);
  const [viewGraphProgress, setProgress] = useState(0);
  const startPerson = props.startPerson;

  const viewGraph = useMemo(() => {
    if (startPerson === null) return;
    setViewGraphState(LoadingState.LOADING);

    let viewGraph = new ViewGraph();
    viewGraph.addEventListener("progress", (e: CustomEvent) => setProgress(e.detail))
    viewGraph.load(startPerson, props.viewMode).then(() => {
      // set nodes and links here to avoid weird async issues with cola
      d3cola
        .nodes(viewGraph.nodes)
        .links(viewGraph.links)
      setViewGraphState(LoadingState.FINISHED);

      console.assert(viewGraph.nodes.length > 0,
        "View graph has no nodes!");
      console.assert(viewGraph.links.length > 0,
        "View graph has no links!");
    });

    return viewGraph;
  }, [startPerson, props.viewMode]);

  useEffect(() => {
    if (viewGraphState !== LoadingState.FINISHED) {
      return;
    }
    setupCola(viewGraph, isLandscape);
    updatePositions(isLandscape);
    d3cola.on(EventType.tick, () => updatePositions(isLandscape));
  }, [viewGraph, viewGraphState, isLandscape, props.focusHidden]);

  function onEtcClicked(family: GraphFamily) {
    setViewGraphState(LoadingState.LOADING);
    viewGraph.showFamily(family)
      .then(() => setViewGraphState(LoadingState.FINISHED));
  }

  window.matchMedia("(orientation: landscape)")
    .addEventListener("change", (e) => setIsLandscape(e.matches));

  if (viewGraphState !== LoadingState.FINISHED) {
    return <Loading text={strings.tree.loading} value={viewGraphProgress}/>
  }

  return (
    <svg id="family-tree" xmlns="http://www.w3.org/2000/svg" className="flex-grow rounded-b-2xl">
      <rect id='background' width='100%' height='100%' className="fill-white dark:fill-black"/>
      <GraphContext.Provider value={viewGraph}>
        <Graph graph={viewGraph}
               nodeComponent={({node}) =>
                 <Node data={node}
                       onPersonClick={props.onRefocus}
                       onFamilyClick={onEtcClicked}
                       onEtcClick={onEtcClicked}
                       startPerson={startPerson}
                       focusHidden={props.focusHidden}
                       colorMode={props.colorMode}
                 />}
               linkComponent={(props) => (
                 <path className="link stroke-2 stroke-black dark:stroke-white fill-none"
                       d={getLinkPath(props.link, isLandscape)}/>
               )}/>
      </GraphContext.Provider>
    </svg>
  );
}

function setupCola(graph: ViewGraph, isLandscape: boolean) {
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
      svg.select(".visx-group").attr("transform", event.transform.toString());
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

  let iterations = graph.nodes.length < 100 ? 55 : 10;
  d3cola
    .symmetricDiffLinkLengths(config.gridSize);
  if (isLandscape) {
    d3cola.flowLayout("x", d => d.target instanceof GraphPerson ? config.gridSize * 5 : config.gridSize * 3.5)
  } else {
    d3cola.flowLayout("y", config.gridSize * 3)
  }
  d3cola.start(iterations, 0, iterations, 0, graph.nodes.length > 19);
}

function updatePositions(isLandscape: boolean) {
  let nodes = d3.selectAll<SVGGElement, undefined>(".visx-network-node")
    .data(d3cola.nodes());
  let links = d3.selectAll<SVGGElement, undefined>(".visx-network-link path")
    .data(d3cola.links());

  nodes.attr("transform", d => `translate(${d.x},${d.y})`);
  links.attr("d", d => getLinkPath(d, isLandscape));
}

function getLinkPath(d, isLandscape) {
  if (isLandscape) {
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
  }

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
}


export default TreeView;
