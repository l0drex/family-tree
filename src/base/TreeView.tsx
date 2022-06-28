import {Etc, Family, Person} from "../nodes/Nodes";
import {Component} from "react";
import config from "../config";
import * as d3 from "d3";
import * as cola from "webcola";
import * as GedcomX from "gedcomx-js";
import viewGraph, {ViewGraph} from "../backend/ViewGraph";
import {GraphFamily, GraphPerson} from "../backend/gedcomx-extensions";

let d3cola = cola.d3adaptor(d3);

interface Props {
  focus: GedcomX.Person
  focusHidden: boolean
  onRefocus: (newFocus: GraphPerson) => void
}

interface State {
  graph: ViewGraph
}

class TreeView extends Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      graph: viewGraph
    }
  }

  render() {
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
            {this.state.graph.nodes.filter(n => n.type === "family").map(r =>
              <Family data={r} key={r.viewId}
                     locked={(r as GraphFamily).involvesPerson(this.state.graph.startPerson.data.getId())}
                     onClick={this.onGraphChanged.bind(this)}/>)}
            {this.state.graph.nodes.filter(n => n.type === "etc").map(r =>
              <Etc key={r.viewId} data={r} onClick={this.onGraphChanged.bind(this)}/>)}
            {this.state.graph.nodes.filter(n => n.type === "person").map(p =>
              <Person data={p} onClick={this.props.onRefocus} key={p.viewId}
                      focused={!this.props.focusHidden && (p as GraphPerson).data.getId() === this.props.focus.getId()}/>)}
          </g>
        </g>
      </svg>
    );
  }

  componentDidMount() {
    let svg = d3.select("#family-tree");

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
      .touchable(() => ('ontouchstart' in window) || window.TouchEvent);
    svg.select("rect").call(svgZoom);


    this.animateTree()
  }

  componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
    this.animateTree()
  }

  animateTree() {
    d3cola
      .flowLayout("x", d => d.target.type==="person" ? config.gridSize * 5 : config.gridSize * 3.5)
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

    personNode
      .transition()
      .duration(300)
      .style("opacity","1")
      //.call(d3cola.drag);
    link
      .transition()
      .duration(600)
      .style("opacity","1")
    etcNode
      .transition()
      .duration(300)
      .style("opacity","1")

    d3cola.on("tick", () => {
      personNode
        .attr("x", d => d.x - d.bounds.width() / 2)
        .attr("y", d => d.y - d.bounds.height() / 2);
      partnerNode
        .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
      etcNode
        .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

      link.attr("d", d => {
        // 1 or -1
        let flip = -(Number((d.source.y - d.target.y)>0)*2-1);
        let radius = Math.min(config.gridSize/2, Math.abs(d.target.x - d.source.x)/2, Math.abs(d.target.y - d.source.y)/2);

        if (d.target.type !== "person") {
          return `M${d.source.x} ${d.source.y} ` +
            `H${d.target.x - radius} ` +
            `a${radius} ${radius} 0 0 ${(flip+1)/2} ${radius} ${flip * radius} ` +
            `V${d.target.y}`;
        } else {
          return `M${d.source.x},${d.source.y} ` +
            `h${config.gridSize} ` +
            `a${radius} ${radius} 0 0 ${(flip+1)/2} ${radius} ${flip * radius} ` +
            `V${d.target.y - (flip)*radius} ` +
            `a${radius} ${radius} 0 0 ${(-flip+1)/2} ${radius} ${flip * radius} ` +
            `H${d.target.x}`;
        }
      });
    });
  }

  onGraphChanged() {
    this.setState({
      graph: viewGraph
    });
  }
}

export default TreeView;
