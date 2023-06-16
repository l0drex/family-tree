import * as React from "react";
import {createContext, useEffect, useState} from "react";
import {getUrlOption, strings} from "../main";
import "./View.css";
import {ColorMode, ViewMode} from "../backend/ViewGraph";
import TreeView from "./TreeView";
import InfoPanel from "./InfoPanel";
import Header from "./Header";
import SearchField from "./SearchField";
import {Person} from "../backend/gedcomx-extensions";
import {parseFile, saveDataAndRedirect} from "./Form";
import {db} from "../backend/db";

export const FocusPersonContext = createContext<Person>(null);

function ViewOptions(props) {
  let fileInput = React.createRef<HTMLInputElement>();

  return (
    <form id="view-all">
      <div>
        <label htmlFor="view-selector">{strings.viewOptions.filter.label}</label>
        <select id="view-selector" className="button inline all" defaultValue={props.view}
                onChange={props.onViewChanged}>
          <option value={ViewMode.DEFAULT}>{strings.viewOptions.filter.default}</option>
          <option value={ViewMode.DESCENDANTS}>{strings.viewOptions.filter.descendants}</option>
          <option value={ViewMode.ANCESTORS}>{strings.viewOptions.filter.ancestors}</option>
          <option value={ViewMode.LIVING}>{strings.viewOptions.filter.living}</option>
          <option value={ViewMode.ALL}>{strings.viewOptions.filter.all}</option>
        </select>
      </div>

      <div>
        <label htmlFor="color-selector">{strings.viewOptions.color.label}</label>
        <select id="color-selector" className="button inline all" defaultValue={props.colorMode}
                onChange={props.onColorChanged}>
          <option value={ColorMode.GENDER}>{strings.gedcomX.gender}</option>
          <option value={ColorMode.NAME}>{strings.gedcomX.types.namePart.Surname}</option>
          <option value={ColorMode.AGE}>{strings.gedcomX.qualifiers.fact.Age}</option>
          <option value={ColorMode.CONFIDENCE}>{strings.gedcomX.confidence}</option>
        </select>
      </div>

      <div id="file-buttons">
        <input type="file" hidden ref={fileInput} accept="application/json"
               onChange={() => parseFile(fileInput.current.files[0]).then(saveDataAndRedirect)}/>
        <button className="icon-only" onClick={e => {
          e.preventDefault();
          fileInput.current.click();
        }}>📁
        </button>
      </div>
    </form>
  );
}

function Persons() {
  const [viewMode, setViewMode] = useState(getUrlOption("view", ViewMode.DEFAULT));
  const [colorMode, setColorMode] = useState(getUrlOption("colorMode", ColorMode.GENDER));
  const [focusPerson, setFocus] = useState<Person>(null);
  const [focusHidden, hideFocus] = useState(false);

  useEffect(() => {
    let url = new URL(window.location.href);
    let id = url.hash.substring(1);
    db.personWithId(id)
      .catch(() => db.persons.toCollection().first().then(p => new Person(p)))
      .then(p => setFocus(p));
  }, []);

  useEffect(() => {
    let root = document.querySelector<HTMLDivElement>("#root");
    if (focusHidden) {
      root.classList.remove("sidebar-visible");
    } else {
      root.classList.add("sidebar-visible");
    }
  }, [focusHidden])

  function onViewChanged(e) {
    let view = (e.target as HTMLSelectElement).value;

    let url = new URL(window.location.href);
    if (view === ViewMode.DEFAULT) {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", view);
    }
    window.history.pushState({}, "", url.toString());

    setViewMode(view as ViewMode);
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
    if (newFocus.getId() === focusPerson.getId()) {
      hideFocus(!focusHidden)
      return;
    }

    let url = new URL(window.location.href);
    url.hash = newFocus.getId();
    window.history.pushState({}, "", url.toString());

    hideFocus(false);
    setFocus(newFocus);
  }

  return (
    <>
      <Header>
        <SearchField onRefocus={onRefocus}/>
      </Header>
      <FocusPersonContext.Provider value={focusPerson}>
        {!focusHidden && <InfoPanel />}
      </FocusPersonContext.Provider>
      <main>
        <article id="family-tree-container">
          <ViewOptions view={viewMode} colorMode={colorMode} onViewChanged={onViewChanged}
                       onColorChanged={onColorChanged}/>
          <FocusPersonContext.Provider value={focusPerson}>
            <TreeView colorMode={colorMode} focusHidden={focusHidden}
                      onRefocus={onRefocus} viewMode={viewMode}/>
          </FocusPersonContext.Provider>
        </article>
      </main>
    </>
  );
}

export default Persons;
