import {useEffect, useState} from "react";
import {strings} from "../main";
import "./View.css";
import {graphModel, loadData} from "../backend/ModelGraph";
import {ViewMode, ColorMode} from "../backend/ViewGraph";
import TreeView from "./TreeView";
import InfoPanel from "./InfoPanel";
import Header from "./Header";
import SearchField from "./SearchField";
import * as React from "react";
import {Person} from "gedcomx-js";


function ViewOptions(props) {
  return (
    <form id="view-all">
      <div>
        <label htmlFor="view-selector">{strings.viewOptions.filter.label}</label>
        <select id="view-selector" className="button inline all" defaultValue={props.view} onChange={props.onViewChanged}>
          <option value={ViewMode.DEFAULT}>{strings.viewOptions.filter.default}</option>
          <option value={ViewMode.DESCENDANTS}>{strings.viewOptions.filter.descendants}</option>
          <option value={ViewMode.ANCESTORS}>{strings.viewOptions.filter.ancestors}</option>
          <option value={ViewMode.LIVING}>{strings.viewOptions.filter.living}</option>
          <option value={ViewMode.ALL}>{strings.viewOptions.filter.all}</option>
        </select>
      </div>

      <div>
        <label htmlFor="color-selector">{strings.viewOptions.color.label}</label>
        <select id="color-selector" className="button inline all" defaultValue={props.colorMode} onChange={props.onColorChanged}>
          <option value={ColorMode.GENDER}>{strings.gedcomX.gender}</option>
          <option value={ColorMode.NAME}>{strings.gedcomX.types.namePart.Surname}</option>
          <option value={ColorMode.AGE}>{strings.gedcomX.qualifiers.fact.Age}</option>
        </select>
      </div>
    </form>
  );
}

function View() {
  loadData(JSON.parse(localStorage.getItem("familyData")));
  let url = new URL(window.location.href);

  const [view, setView] = useState<ViewMode>((url.searchParams.get("view") as ViewMode) || ViewMode.DEFAULT);
  const [colorMode, setColorMode] = useState<ColorMode>((url.searchParams.get("colorMode") as ColorMode) || ColorMode.GENDER);
  const [focusId, setFocus] = useState(url.hash.substring(1));
  const [focusHidden, hideFocus] = useState(false);

  console.debug(`View: ${view}`);
  console.debug(`ColorMode: ${colorMode}`)

  useEffect(() => {
    let root = document.querySelector<HTMLDivElement>("#root");
    root.classList.add("sidebar-visible");
  });

  useEffect(() => {
    let root = document.querySelector<HTMLDivElement>("#root");
    if (focusHidden) {
      root.classList.remove("sidebar-visible");
    }
  }, [focusHidden])

  let viewGraph = graphModel.buildViewGraph(focusId, view);
  useEffect(() => {
    graphModel.buildViewGraph(focusId, view);
  }, [focusId, view])

  let focus = graphModel.getPersonById(focusId) || graphModel.persons[0];

  function onViewChanged(e) {
    let view = (e.target as HTMLSelectElement).value;

    let url = new URL(window.location.href);
    if (view === ViewMode.DEFAULT) {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", view);
    }
    window.history.pushState({}, "", url.toString());

    setView(view as ViewMode);
  }

  function onColorChanged(e) {
    let colorMode = (e.target as HTMLSelectElement).value;

    let url = new URL(window.location.href);
    if (colorMode === ColorMode.GENDER) {
      url.searchParams.delete("colorMode");
    } else {
      url.searchParams.set("colorMode", colorMode);
    }
    window.history.pushState({}, "", url.toString());

    setColorMode(colorMode as ColorMode);
  }

  function onRefocus(newFocus: Person) {
    let url = new URL(window.location.href);
    url.hash = newFocus.getId();
    window.history.pushState({}, "", url.toString());

    if (newFocus.getId() === focusId) {
      hideFocus(!focusHidden)
      return;
    }
    hideFocus(false);
    setFocus(newFocus.getId());
  }

  return (
    <>
      <Header>
        <SearchField onRefocus={onRefocus}/>
      </Header>
      {!focusHidden && <InfoPanel person={focus} onRefocus={onRefocus}/>}
      <main>
        <div id="family-tree-container">
          <ViewOptions view={view} colorMode={colorMode} onViewChanged={onViewChanged} onColorChanged={onColorChanged}/>
          <TreeView colorMode={colorMode} focus={focus} focusHidden={focusHidden}
                    onRefocus={onRefocus} graph={viewGraph}/>
        </div>
      </main>
    </>
  );
}

export default View;
