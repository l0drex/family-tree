import * as React from "react";
import {createContext, useContext, useEffect, useMemo, useState} from "react";
import {strings} from "../main";
import {ColorMode, ViewMode} from "../backend/ViewGraph";
import TreeView from "./TreeView";
import InfoPanel from "./InfoPanel";
import SearchField from "./SearchField";
import {Person} from "../backend/gedcomx-extensions";
import {parseFile, saveDataAndRedirect} from "./Home";
import {useLoaderData, useNavigate, useSearchParams} from "react-router-dom";
import {LayoutContext, Main} from "../App";
import {ButtonLike, Title} from "./GeneralComponents";
import emojis from '../backend/emojies.json';

export const FocusPersonContext = createContext<Person>(null);

function ViewOptions(props) {
  const navigate = useNavigate();
  let fileInput = React.createRef<HTMLInputElement>();

  return (
    <form id="view-all" className="flex gap-4 overflow-x-auto whitespace-nowrap p-4">
      <div>
        <label htmlFor="view-selector">{strings.viewOptions.filter.label}</label>
        <ButtonLike primary noHover><select id="view-selector"
                                            className="bg-transparent py-1 pl-4 pr-2 mr-4 cursor-pointer"
                                            defaultValue={props.view}
                                            onChange={props.onViewChanged}>
          <option value={ViewMode.DEFAULT}>{strings.viewOptions.filter.default}</option>
          <option value={ViewMode.DESCENDANTS}>{strings.viewOptions.filter.descendants}</option>
          <option value={ViewMode.ANCESTORS}>{strings.viewOptions.filter.ancestors}</option>
          <option value={ViewMode.LIVING}>{strings.viewOptions.filter.living}</option>
          <option value={ViewMode.ALL}>{strings.viewOptions.filter.all}</option>
        </select></ButtonLike>
      </div>

      <div>
        <label htmlFor="color-selector">{strings.viewOptions.color.label}</label>
        <ButtonLike primary noHover><select id="color-selector"
                                            className="bg-transparent py-1 pl-4 pr-2 mr-4 cursor-pointer"
                                            defaultValue={props.colorMode}
                                            onChange={props.onColorChanged}>
          <option value={ColorMode.GENDER}>{strings.gedcomX.person.gender}</option>
          <option value={ColorMode.NAME}>{strings.gedcomX.person.namePartTypes.Surname}</option>
          <option value={ColorMode.AGE}>{strings.gedcomX.factQualifier.Age}</option>
          <option value={ColorMode.CONFIDENCE}>{strings.gedcomX.conclusion.confidence}</option>
        </select></ButtonLike>
      </div>

      <div id="file-buttons" className="ml-auto">
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

function Persons() {
  const layoutContext = useContext(LayoutContext);
  const [searchParams, setSearchParams] = useSearchParams({viewMode: ViewMode.DEFAULT, colorMode: ColorMode.GENDER});
  const focusPerson = useLoaderData() as Person | null;
  const [focusHidden, hideFocus] = useState(false);
  const navigate = useNavigate();

  function onViewChanged(e: Event) {
    let view = (e.target as HTMLSelectElement).value;

    setSearchParams(searchParams => {
      searchParams.set(ViewModeParam, view);
      return searchParams;
    }, {replace: true});
  }

  function onColorChanged(e: Event) {
    let colorMode = (e.target as HTMLSelectElement).value;

    setSearchParams(searchParams => {
      searchParams.set(ColorModeParam, colorMode);
      return searchParams;
    }, {replace: true});
  }

  const onRefocus = useMemo(() => {
    return function onRefocus(newFocus: Person) {
      if (!focusPerson) return;

      if (newFocus.getId() === focusPerson.id) {
        hideFocus(!focusHidden)
        return;
      }

      navigate(`/persons/${newFocus.getId()}?${searchParams.toString()}`);
    }
  }, [focusPerson, navigate, searchParams, focusHidden]);

  useEffect(() => {
    if (!focusPerson) {
      layoutContext.setHeaderChildren([
        <Title emoji={emojis.tree}>{strings.gedcomX.person.persons}</Title>
      ]);
      return;
    }

    layoutContext.setHeaderChildren([
      <SearchField onRefocus={onRefocus}/>
    ])
    layoutContext.setRightTitle(focusHidden ? "" : focusPerson.fullName)
  }, [onRefocus, focusPerson, focusHidden, layoutContext]);

  return (
    <>
      {!focusHidden && <InfoPanel person={focusPerson}/>}
      <Main titleRight={focusPerson.fullName}>
        <article id="family-tree-container"
                 className="bg-white dark:bg-black rounded-2xl mx-auto mb-0 p-0 h-full box-border flex flex-col">
          <ViewOptions view={searchParams.get(ViewModeParam)} colorMode={searchParams.get(ColorModeParam)}
                       onViewChanged={onViewChanged}
                       onColorChanged={onColorChanged}/>
          <TreeView colorMode={searchParams.get(ColorModeParam) as ColorMode} focusHidden={focusHidden}
                    onRefocus={onRefocus} viewMode={searchParams.get(ViewModeParam) as ViewMode}
                    startPerson={focusPerson}/>
        </article>
      </Main>
    </>
  );
}

export default Persons;
