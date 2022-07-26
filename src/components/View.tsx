import {Component} from "react";
import {translationToString} from "../main";
import "./View.css";
import {graphModel} from "../backend/ModelGraph";
import {ViewMode, ViewGraph} from "../backend/ViewGraph";
import TreeView from "./TreeView";
import {GraphPerson} from "../backend/graph";
import InfoPanel from "./InfoPanel";
import * as React from "react";
import FamilyPath from "./FamilyPath";

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

interface State {
  activeView: string
  viewGraph: ViewGraph
  focusId: string
  focusHidden: boolean
}

class View extends Component<any, State> {
  constructor(props) {
    super(props);

    let url = new URL(window.location.href);
    let view: string = url.searchParams.get("view-all") || ViewMode.DEFAULT;
    console.debug(`View: ${view}`);

    let focusId = url.searchParams.get("id");
    let viewGraph = graphModel.buildViewGraph(focusId, ViewMode[view]);
    console.assert(viewGraph.nodes.length > 0,
      "Viewgraph has no nodes!");
    console.assert(viewGraph.links.length > 0,
      "Viewgraph has no links!");
    this.state = {
      activeView: view,
      viewGraph: viewGraph,
      focusId: focusId,
      focusHidden: false
    }
  }

  componentDidMount() {
    let root = document.querySelector<HTMLDivElement>("#root");
    root.classList.remove("sidebar-hidden");
  }

  componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
    if (prevState.focusId !== this.state.focusId) {
      this.onViewChanged(this.state.activeView);
    }
    let root = document.querySelector<HTMLDivElement>("#root");
    if (this.state.focusHidden) {
      root.classList.add("sidebar-hidden");
    } else {
      root.classList.remove("sidebar-hidden");
    }
  }

  render() {
    let focus;
    if (this.state.focusId) {
      focus = graphModel.getPersonById(this.state.focusId);
    } else {
      focus = graphModel.persons[0];
    }
    if (!focus) {
      throw new Error(`No person with id ${this.state.focusId} could be found`)
    }

    return (
      <>
        {!this.state.focusHidden && <InfoPanel person={focus} onRefocus={this.onRefocus.bind(this)}/>}
        <main>
          <ViewOptions activeView={this.state.activeView} onViewChange={this.onViewChanged.bind(this)}/>
          <TreeView focus={focus} focusHidden={this.state.focusHidden} onRefocus={this.onRefocus.bind(this)}/>
        </main>
        <FamilyPath focus={focus}/>
      </>

    );
  }

  onViewChanged(view) {
    let newView = view === this.state.activeView ? "" : view;
    let viewGraph = graphModel.buildViewGraph(this.state.focusId, newView);
    this.setState({
      activeView: newView,
      viewGraph: viewGraph
    });
  }

  onRefocus(newFocus: GraphPerson) {
    if (newFocus.data.getId() === this.state.focusId) {
      this.setState({
        focusHidden: !this.state.focusHidden
      })
      return;
    }
    this.setState({
      focusHidden: false,
      focusId: newFocus.data.getId()
    });
  }
}

export default View;
