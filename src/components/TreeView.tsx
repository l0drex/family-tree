import {Etc, Family, Person} from "./Nodes";
import {Component} from "react";
import config from "../config";
import * as d3 from "d3";
import * as cola from "webcola";
import * as GedcomX from "gedcomx-js";
import viewGraph, {ColorMode, ViewGraph} from "../backend/ViewGraph";
import {GraphFamily, GraphPerson} from "../backend/graph";

let d3cola = cola.d3adaptor(d3);

interface Props {
  focus: GedcomX.Person
  focusHidden: boolean
  onRefocus: (newFocus: GraphPerson) => void
  colorMode: ColorMode | string
}

interface State {
  graph: ViewGraph
}

class TreeView extends Component<Props, State> {
  mounted = false

  constructor(props) {
    super(props);

    viewGraph.addEventListener("add", this.onGraphChanged.bind(this));
    viewGraph.addEventListener("remove", this.onGraphChanged.bind(this));

    this.state = {
      graph: viewGraph
    }
  }

  render() {
    console.assert(viewGraph.nodes.length > 0,
      "View graph has no nodes!");
    console.assert(viewGraph.links.length > 0,
      "View graph has no links!");
    d3cola
      .flowLayout("x", config.gridSize * 5)
      .nodes(this.state.graph.nodes)
      .links(this.state.graph.links)
      .start(10, 0, 10);

    return (
      <svg id="family-tree" xmlns="http://www.w3.org/2000/svg">
        <rect id='background' width='100%' height='100%'/>
        <g id="vis">
          <g id="links">
            {this.state.graph.links.map((l, i) =>
              <path className="link" key={i}/>)}
          </g>
          <g id="nodes">
            {this.state.graph.nodes.filter(n => n.type === "family").map((r, i) =>
              <Family data={r} key={i}
                      locked={(r as GraphFamily).involvesPerson(this.state.graph.startPerson.data.getId())}/>)}
            {this.state.graph.nodes.filter(n => n.type === "etc").map((r, i) =>
              <Etc key={i} data={r}/>)}
            {this.state.graph.nodes.filter(n => n.type === "person").map((p, i) =>
              <Person data={p} onClick={this.props.onRefocus} key={i}
                      focused={!this.props.focusHidden && (p as GraphPerson).data.getId() === this.props.focus.getId()}/>)}
          </g>
        </g>
      </svg>
    );
  }

  componentDidMount() {
    let svg = d3.select("#family-tree");
    this.mounted = true;

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
          if (event.sourceEvent.wheelDelta < 0)
            svg.node().style.cursor = "zoom-out";
          else
            svg.node().style.cursor = "zoom-in";
        }
        svg.select("#vis").attr("transform", event.transform.toString());
      })
      .on("end", () => {
        svg.node().style.cursor = "";
      })
      .filter(event => event.type !== "dblclick" && (event.type === "wheel" ? event.ctrlKey : true))
      .touchable(() => ('ontouchstart' in window) || window.TouchEvent);
    svg.select("rect").call(svgZoom);


    this.animateTree()
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", this.animateTree.bind(this))
  }

  componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
    this.animateTree()
  }

  animateTree() {
    d3cola
      .flowLayout("x", d => d.target.type === "person" ? config.gridSize * 5 : config.gridSize * 3.5)
      .symmetricDiffLinkLengths(config.gridSize)
      .start(15, 0, 10);

    let nodesLayer = d3.select("#nodes");
    let linkLayer = d3.select("#links");

    let personNode = nodesLayer.selectAll(".person")
      .data(this.state.graph.nodes.filter(p => p.type === "person"))
    let partnerNode = nodesLayer.selectAll(".partnerNode")
      .data(this.state.graph.nodes.filter(node => node.type === "family"));
    let etcNode = nodesLayer.selectAll(".etc")
      .data(this.state.graph.nodes.filter(n => n.type === "etc"));
    let link = linkLayer.selectAll(".link")
      .data(this.state.graph.links);

    // reset style
    personNode.select(".bg").attr("style", null);

    const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    switch (this.props.colorMode) {
      case ColorMode.NAME: {
        let last_names = viewGraph.nodes.filter(n => n.type === "person")
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
  }

  onGraphChanged() {
    if (this.mounted) {
      this.setState({
        graph: viewGraph
      });
    }
  }
}

export default TreeView;
