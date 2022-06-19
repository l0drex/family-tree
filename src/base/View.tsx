import {Component} from "react";
import {translationToString} from "../main";
import "./View.css";
import {graphModel} from "../backend/ModelGraph";
import viewGraph, {GraphPerson, view, ViewGraph} from "../backend/ViewGraph";
import TreeView from "./TreeView";

function ViewOption(props) {
  let className = "button inline";
  return (
    <button className={className + " all" + (props.active ? "" : " inactive")}
            onClick={() => props.onClick(props.name)}>{props.localName}</button>
  );
}

function ViewOptions(props) {
  return (
    <div id="view-all">
            <span lang="en">{translationToString({
              en: "Show:",
              de: "Zeige:"
            })}</span>

      <ViewOption name={view.ALL} localName={translationToString({
        en: "All",
        de: "Alle"
      })} active={props.activeView === view.ALL} onClick={props.onViewChange}/>
      <ViewOption name={view.LIVING} localName={translationToString({
        en: "Living",
        de: "Lebende"
      })} active={props.activeView === view.LIVING} onClick={props.onViewChange}/>
      <ViewOption name={view.DESCENDANTS} localName={translationToString({
        en: "Descendants",
        de: "Nachkommen"
      })} active={props.activeView === view.DESCENDANTS} onClick={props.onViewChange}/>
      <ViewOption name={view.ANCESTORS} localName={translationToString({
        en: "Ancestors",
        de: "Vorfahren"
      })} active={props.activeView === view.ANCESTORS} onClick={props.onViewChange}/>
    </div>
  );
}

interface Props {
  focus: GraphPerson
  focusHidden: boolean
  onRefocus: (newFocus: GraphPerson) => void
}

interface State {
  activeView: string
  viewGraph: ViewGraph
}

class View extends Component<Props, State> {
  constructor(props) {
    super(props);

    let url = new URL(window.location.href);
    let view: string = url.searchParams.get("view-all") || "";
    console.debug(`View: ${view.length > 0 ? view : "default"}`);

    graphModel.buildViewGraph(this.props.focus.data.id, view);
    console.assert(viewGraph.nodes.length > 0,
      "Viewgraph has no nodes!");
    console.assert(viewGraph.links.length > 0,
      "Viewgraph has no links!");
    this.state = {
      activeView: view,
      viewGraph: viewGraph
    }
  }

  componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
    if (prevProps.focus !== this.props.focus) {
      this.onViewChanged(this.state.activeView);
    }
  }

  render() {
    return (
      <main>
        <ViewOptions activeView={this.state.activeView} onViewChange={this.onViewChanged.bind(this)}/>
        <TreeView focus={this.props.focus} focusHidden={this.props.focusHidden} onRefocus={this.props.onRefocus}/>
      </main>
    );
  }

  onViewChanged(view) {
    let newView = view === this.state.activeView ? "" : view;
    graphModel.buildViewGraph(this.props.focus.data.id, newView);
    this.setState({
      activeView: newView,
      viewGraph: viewGraph
    });
  }
}

export default View;
