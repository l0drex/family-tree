import {Component} from "react";
import {translationToString} from "../main";
import "./View.css";
import {graphModel} from "../backend/ModelGraph";
import {ViewMode, ViewGraph, ColorMode} from "../backend/ViewGraph";
import TreeView from "./TreeView";
import {GraphPerson} from "../backend/graph";
import InfoPanel from "./InfoPanel";
import * as React from "react";
import FamilyPath from "./FamilyPath";


function ViewOptions(props) {
  return (
    <form id="view-all">
      <label htmlFor="view-selector">{translationToString({
        en: "Show:",
        de: "Zeige:"
      })}</label>

      <select id="view-selector" className="button inline all" onChange={event => props.onViewChange(event.target.value)}>
        <option value={ViewMode.DEFAULT}>{translationToString({
          en: "Default",
          de: "Standard"
        })}</option>
        <option value={ViewMode.ANCESTORS}>{translationToString({
          en: "Ancestors",
          de: "Vorfahren"
        })}</option>
        <option value={ViewMode.LIVING}>{translationToString({
          en: "Living",
          de: "Lebende"
        })}</option>
        <option value={ViewMode.DESCENDANTS}>{translationToString({
          en: "Descendants",
          de: "Nachkommen"
        })}</option>
        <option value={ViewMode.ALL}>{translationToString({
          en: "All",
          de: "Alle"
        })}</option>
      </select>

      <label htmlFor="color-selector">{translationToString({
        en: "Color by:",
        de: "Färbe nach:"
      })
      }</label>
      <select id="color-selector" className="button inline all" onChange={event => props.onViewChange(event.target.value)}>
        <option value={ColorMode.GENDER}>{translationToString({
          en: "Gender",
          de: "Geschlecht"
        })}</option>
        <option value={ColorMode.NAME}>Nachname</option>
        <option value={ColorMode.AGE}>Alter</option>
      </select>
    </form>
  );
}

interface State {
  activeView: ViewMode | string
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
    root.classList.add("sidebar-visible");

    let colorSelector = document.querySelector<HTMLSelectElement>("#color-selector");
    colorSelector.addEventListener("change", this.render.bind(this))
  }

  componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
    if (prevState.focusId !== this.state.focusId) {
      //this.onViewChanged(this.state.activeView);
    }
    let root = document.querySelector<HTMLDivElement>("#root");
    if (this.state.focusHidden) {
      root.classList.remove("sidebar-visible");
    } else {
      root.classList.add("sidebar-visible");
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

    let colorSelector = document.querySelector<HTMLSelectElement>("#color-selector");
    const colorMode = colorSelector ? colorSelector.value : ColorMode.GENDER;
    return (
      <>
        {!this.state.focusHidden && <InfoPanel person={focus} onRefocus={this.onRefocus.bind(this)}/>}
        <main>
          <ViewOptions activeView={this.state.activeView} onViewChange={this.onViewChanged.bind(this)}/>
          <TreeView colorMode={colorMode} focus={focus} focusHidden={this.state.focusHidden} onRefocus={this.onRefocus.bind(this)}/>
        </main>
        <FamilyPath focus={focus}/>
      </>
    );
  }

  onViewChanged(view) {
    let viewGraph = graphModel.buildViewGraph(this.state.focusId, view);
    this.setState({
      activeView: view,
      viewGraph: viewGraph
    });
  }

  onRefocus(newFocus: GraphPerson) {
    // FIXME change focused attribute
    if (newFocus.data.getId() === this.state.focusId) {
      this.setState({
        focusHidden: !this.state.focusHidden
      })
      return;
    }
    this.setState({
      focusHidden: false,
      focusId: newFocus.data.getId(),
      viewGraph: graphModel.buildViewGraph(newFocus.data.getId(), this.state.activeView)
    });
  }
}

export default View;
