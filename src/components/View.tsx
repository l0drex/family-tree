import {Component} from "react";
import {translationToString} from "../main";
import "./View.css";
import {graphModel, loadData} from "../backend/ModelGraph";
import {ViewMode, ViewGraph, ColorMode} from "../backend/ViewGraph";
import TreeView from "./TreeView";
import InfoPanel from "./InfoPanel";
import Header from "./Header";
import SearchField from "./SearchField";
import * as React from "react";
import FamilyPath from "./FamilyPath";
import {Person} from "gedcomx-js";


function ViewOptions() {
  return (
    <form id="view-all">
      <div>
        <label htmlFor="view-selector">{translationToString({
          en: "Show:",
          de: "Zeige:"
        })}</label>
        <select id="view-selector" className="button inline all" defaultValue={ViewMode.DEFAULT}>
          <option value={ViewMode.DEFAULT}>{translationToString({
            en: "Default",
            de: "Standard"
          })}</option>
          <option value={ViewMode.DESCENDANTS}>{translationToString({
            en: "Descendants",
            de: "Nachkommen"
          })}</option>
          <option value={ViewMode.ANCESTORS}>{translationToString({
            en: "Ancestors",
            de: "Vorfahren"
          })}</option>
          <option value={ViewMode.LIVING}>{translationToString({
            en: "Living",
            de: "Lebende"
          })}</option>
          <option value={ViewMode.ALL}>{translationToString({
            en: "All",
            de: "Alle"
          })}</option>
        </select>
      </div>

      <div>
        <label htmlFor="color-selector">{translationToString({
          en: "Color by:",
          de: "Färbe nach:"
        })
        }</label>
        <select id="color-selector" className="button inline all" defaultValue={ColorMode.GENDER}>
          <option value={ColorMode.GENDER}>{translationToString({
            en: "Gender",
            de: "Geschlecht"
          })}</option>
          <option value={ColorMode.NAME}>Nachname</option>
          <option value={ColorMode.AGE}>Alter</option>
        </select>
      </div>
    </form>
  );
}

interface State {
  activeView: ViewMode | string,
  colorMode: ColorMode | string,
  viewGraph: ViewGraph
  focusId: string
  focusHidden: boolean
}

class View extends Component<any, State> {
  constructor(props) {
    super(props);

    loadData(JSON.parse(localStorage.getItem("familyData")));

    let url = new URL(window.location.href);
    let view: string = url.searchParams.get("view-all") || ViewMode.DEFAULT;
    console.debug(`View: ${view}`);

    let focusId = url.hash.substring(1);
    let viewGraph = graphModel.buildViewGraph(focusId, ViewMode[view]);
    console.assert(viewGraph.nodes.length > 0,
      "View graph has no nodes!");
    console.assert(viewGraph.links.length > 0,
      "View graph has no links!");
    this.state = {
      activeView: view,
      colorMode: ColorMode.GENDER,
      viewGraph: viewGraph,
      focusId: focusId,
      focusHidden: false
    }
  }

  componentDidMount() {
    let root = document.querySelector<HTMLDivElement>("#root");
    root.classList.add("sidebar-visible");

    let colorSelector = document.querySelector<HTMLSelectElement>("#color-selector");
    colorSelector.addEventListener("change", e => this.onColorChanged.bind(this)((e.target as HTMLSelectElement).value));

    let viewSelector = document.querySelector<HTMLSelectElement>("#view-selector");
    viewSelector.addEventListener("change", e => this.onViewChanged.bind(this)((e.target as HTMLSelectElement).value));
  }

  componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
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

    return (
      <>
        <Header>
          <SearchField person={focus} onRefocus={this.onRefocus.bind(this)}/>
        </Header>
        {!this.state.focusHidden && <InfoPanel person={focus} onRefocus={this.onRefocus.bind(this)}/>}
        <main>
          <ViewOptions/>
          <TreeView colorMode={this.state.colorMode} focus={focus} focusHidden={this.state.focusHidden}
                    onRefocus={this.onRefocus.bind(this)}/>
        </main>
        <FamilyPath focus={focus}/>
      </>
    );
  }

  onViewChanged(view: string | ViewMode) {
    let url = new URL(window.location.href);
    if (view === ViewMode.DEFAULT) {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", view);
    }
    window.history.pushState({}, "", url.toString());

    this.setState({
      activeView: view,
      viewGraph: graphModel.buildViewGraph(this.state.focusId, view)
    });
  }

  onColorChanged(colorMode: string | ColorMode) {
    let url = new URL(window.location.href);
    if (colorMode === ColorMode.GENDER) {
      url.searchParams.delete("colorMode");
    } else {
      url.searchParams.set("colorMode", colorMode);
    }
    window.history.pushState({}, "", url.toString());

    this.setState({
      colorMode: colorMode
    })
  }

  onRefocus(newFocus: Person) {
    let url = new URL(window.location.href);
    url.hash = newFocus.getId();
    window.history.pushState({}, "", url.toString())

    window.history.pushState({}, "", url.toString());

    if (newFocus.getId() === this.state.focusId) {
      this.setState({
        focusHidden: !this.state.focusHidden
      })
      return;
    }
    this.setState({
      focusHidden: false,
      focusId: newFocus.getId(),
      viewGraph: graphModel.buildViewGraph(newFocus.getId(), this.state.activeView)
    });
  }
}

export default View;
