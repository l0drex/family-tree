import {Etc, Family} from "../nodes/Family";
import {graphModel} from "../backend/ModelGraph";
import Person from "../nodes/Person";
import {Component} from "react";
import config from "../config";
import * as d3 from "d3";
import * as cola from "webcola";
import viewGraph from "../backend/ViewGraph";

let d3cola = cola.d3adaptor(d3);

class TreeView extends Component<any, any>{
    constructor(props) {
        super(props);
        this.state = {
            viewGraph: viewGraph
        }
    }

    render() {
        d3cola
            .flowLayout("x", config.gridSize * 1.5 + config.gridSize * 2.5 + config.gridSize * .5)
            .nodes(this.state.viewGraph.nodes)
            .links(this.state.viewGraph.links)
            .start(10, 0, 10);

        return (
            <svg id="family-tree" xmlns="http://www.w3.org/2000/svg">
                <rect id='background' width='100%' height='100%'/>
                <g id="vis">
                    <g id="links">
                        {this.props.graph.links.map((l, i) =>
                            <polyline className="link" key={i}/>)}
                    </g>
                    <g id="nodes">
                        {this.props.graph.nodes.filter(n => n.type === "family").map(r =>
                            <Family data={r} key={r.viewId}
                                    locked={r.data.involvesPerson(graphModel.startPerson.data)}
                                    onClick={this.onGraphChanged.bind(this)}/>)}
                        {this.props.graph.nodes.filter(n => n.type === "etc").map(r =>
                            <Etc key={r.viewId} data={r} onClick={this.onGraphChanged.bind(this)}/>)}
                        {this.props.graph.nodes.filter(n => n.type === "person").map(p =>
                            <Person data={p} onClick={this.props.onRefocus} key={p.viewId}
                                    focused={!this.props.focusHidden && p.data.id === this.props.focus.data.id}/>)}
                    </g>
                </g>
            </svg>
        );
    }

    componentDidMount() {
        this.animateTree()
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        this.animateTree()
    }

    animateTree() {
        let svg = d3.select("#family-tree");
        let nodesLayer = svg.select("#nodes");
        let linkLayer = svg.select("#links");

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

        let personNode = nodesLayer.selectAll(".person")
            .data(this.state.viewGraph.nodes.filter(p => p.type === "person"));
        let partnerNode = nodesLayer.selectAll(".partnerNode")
            .data(this.state.viewGraph.nodes.filter(node => node.type === "family"));
        let etcNode = nodesLayer.selectAll(".etc")
            .data(this.state.viewGraph.nodes.filter(n => n.type === "etc"));
        let link = linkLayer.selectAll(".link")
            .data(this.state.viewGraph.links);

        d3cola
            /*
            Adding some documentation since it's kinda hard to find:
            1. Iterations with no constraints
            2. Only structural (user-specified) constraints
            3. Iterations of layout with all constraints including anti-overlap constraints
            4. Not documented, but used in gridded small groups example.
               Seems to be the iterations while visible or something like that

            src: https://marvl.infotech.monash.edu/webcola/, at the bottom of the page
             */
            .flowLayout("x", config.gridSize * 5)
            .symmetricDiffLinkLengths(config.gridSize)
            .start(10, 0, 10);

        d3cola.on("tick", () => {
            personNode
                .attr("x", d => d.x - config.gridSize * 2.5)
                .attr("y", d => d.y - config.gridSize / 2);
            partnerNode
                .attr("transform", d => "translate(" + d.x + "," + d.y + ")");
            etcNode
                .attr("transform", d => "translate(" + d.x + "," + d.y + ")");

            link.attr("points", d => {
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

    onGraphChanged() {
        this.setState({
            viewGraph: viewGraph
        });
    }
}

export default TreeView;