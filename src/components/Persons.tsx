import * as React from "react";
import {createContext, useEffect, useMemo, useState} from "react";
import {strings} from "../main";
import "./View.css";
import {ColorMode, ViewMode} from "../backend/ViewGraph";
import TreeView from "./TreeView";
import InfoPanel from "./InfoPanel";
import SearchField from "./SearchField";
import {Person} from "../backend/gedcomx-extensions";
import {parseFile, saveDataAndRedirect} from "./Form";
import {db} from "../backend/db";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";

export const FocusPersonContext = createContext<Person>(null);

function ViewOptions(props) {
  const navigate = useNavigate();
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
               onChange={() => parseFile(fileInput.current.files[0]).then(t => JSON.parse(t)).then(d => saveDataAndRedirect(d, navigate))}/>
        <button className="icon-only" onClick={e => {
          e.preventDefault();
          fileInput.current.click();
        }}>📁
        </button>
      </div>
    </form>
  );
}

const ViewModeParam = "viewMode";
const ColorModeParam = "colorMode";

function Persons(props: { setHeaderChildren: (children) => void }) {
  const [searchParams, setSearchParams] = useSearchParams({viewMode: ViewMode.DEFAULT, colorMode: ColorMode.GENDER});
  const {id} = useParams();
  const [focusPerson, setFocus] = useState<Person>(null);
  const [focusHidden, hideFocus] = useState(false);

  useEffect(() => {
    db.personWithId(id)
      .catch(() => db.persons.toCollection().first().then(p => new Person(p)))
      .then(p => setFocus(p));
  }, [id]);

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

    searchParams.set(ViewModeParam, view);
    setSearchParams(searchParams);
  }

  function onColorChanged(e) {
    let colorMode = (e.target as HTMLSelectElement).value;

    searchParams.set(ColorModeParam, colorMode);
    setSearchParams(searchParams);
  }

  const onRefocus = useMemo(() => {
    function onRefocus(newFocus: Person) {
      if (newFocus.getId() === id) {
        hideFocus(!focusHidden)
        return;
      }

      let url = new URL(window.location.href);
      url.pathname = `family-tree/persons/${newFocus.getId()}`;
      window.history.pushState({}, "", url.toString());

      hideFocus(false);
      setFocus(newFocus);
    }

    return onRefocus;
  }, [focusHidden, id]);

  const setHeaderChildren = props.setHeaderChildren;

  useEffect(() => {
    setHeaderChildren([
      <SearchField onRefocus={onRefocus}/>
    ])
  }, [setHeaderChildren, onRefocus]);

  return (
    <>
      <FocusPersonContext.Provider value={focusPerson}>
        {!focusHidden && <InfoPanel/>}
      </FocusPersonContext.Provider>
      <main>
        <article id="family-tree-container">
          <ViewOptions view={searchParams.get(ViewModeParam)} colorMode={searchParams.get(ColorModeParam)} onViewChanged={onViewChanged}
                       onColorChanged={onColorChanged}/>
          <FocusPersonContext.Provider value={focusPerson}>
            <TreeView colorMode={searchParams.get(ColorModeParam) as ColorMode} focusHidden={focusHidden}
                      onRefocus={onRefocus} viewMode={searchParams.get(ViewModeParam) as ViewMode}/>
          </FocusPersonContext.Provider>
        </article>
      </main>
    </>
  );
}

export default Persons;
