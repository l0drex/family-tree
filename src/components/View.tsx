import {Component} from "react";
import {translationToString} from "../main";
import "./View.css";
import {graphModel} from "../backend/ModelGraph";
import {ViewMode, ViewGraph} from "../backend/ViewGraph";
import TreeView from "./TreeView";
import {GraphPerson} from "../backend/graph";
import {Person} from "gedcomx-js";

function ViewOption(props) {
  return (
    <option value={props.name}>{props.localName}</option>
  );
}

function ViewOptions(props) {
  return (
    <form id="view-all">
      <label lang="en">{translationToString({
        en: "Show:",
        de: "Zeige:"
      })}</label>

      <select className="button inline all" onChange={event => props.onViewChange(event.target.value)}>
        <ViewOption name={ViewMode.DEFAULT} localName={translationToString({
          en: "Default",
          de: "Standard"
        })} active={props.activeView === ViewMode.DEFAULT}/>
        <ViewOption name={ViewMode.ANCESTORS} localName={translationToString({
          en: "Ancestors",
          de: "Vorfahren"
        })} active={props.activeView === ViewMode.ANCESTORS}/>
        <ViewOption name={ViewMode.LIVING} localName={translationToString({
          en: "Living",
          de: "Lebende"
        })} active={props.activeView === ViewMode.LIVING}/>
        <ViewOption name={ViewMode.DESCENDANTS} localName={translationToString({
          en: "Descendants",
          de: "Nachkommen"
        })} active={props.activeView === ViewMode.DESCENDANTS}/>
        <ViewOption name={ViewMode.ALL} localName={translationToString({
          en: "All",
          de: "Alle"
        })} active={props.activeView === ViewMode.ALL}/>
      </select>
    </form>
  );
}

interface Props {
  focus: Person
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
    let view: string = url.searchParams.get("view-all") || ViewMode.DEFAULT;
    console.debug(`View: ${view}`);

    let viewGraph = graphModel.buildViewGraph(this.props.focus.getId(), ViewMode[view]);
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
    let viewGraph = graphModel.buildViewGraph(this.props.focus.getId(), newView);
    this.setState({
      activeView: newView,
      viewGraph: viewGraph
    });
  }
}

export default View;
