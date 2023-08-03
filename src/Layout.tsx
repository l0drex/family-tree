import * as React from "react";
import { createRef, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ReactLink, ReactNavLink, VanillaLink } from "./components/GeneralComponents";
import emojis from "./backend/emojies.json";
import { strings } from "./main";
import { AgentSelector } from "./components/Agents";
import { db } from "./backend/db";
import { parseFile, saveDataAndRedirect } from "./components/Home";

function FileButtons() {
  const navigate = useNavigate();
  let fileInput = React.createRef<HTMLInputElement>();
  const downloadLink = createRef<HTMLAnchorElement>();

  const exportDocument = useMemo(() => async function () {
    let promises: Promise<any>[] = [];
    const root = await db.root;
    promises.push(db.persons.toArray().then(persons => root.setPersons(persons)));
    promises.push(db.relationships.toArray().then(relationships => root.setRelationships(relationships)));
    promises.push(db.sourceDescriptions.toArray().then(sources => root.setSourceDescriptions(sources)));
    promises.push(db.documents.toArray().then(documents => root.setDocuments(documents)));
    promises.push(db.agents.toArray().then(agents => root.setAgents(agents)));
    promises.push(db.places.toArray().then(places => root.setPlaces(places)));
    promises.push(db.events.toArray().then(events => root.setEvents(events)));

    let fileName = prompt(strings.enterFileName, "GedcomX.json");
    if (!fileName)
      return;
    if (!fileName.endsWith(".json")) {
      fileName += ".json";
    }

    await Promise.all(promises);

    const blob = new Blob([JSON.stringify(root.toJSON())], {type: "application/json"});
    const dataStr = URL.createObjectURL(blob);
    downloadLink.current?.setAttribute("href", dataStr);
    downloadLink.current?.setAttribute("download", fileName);
    downloadLink.current?.click();
  }, [downloadLink]);

  return <>
    <input type="file" hidden ref={fileInput} accept="application/json"
           onChange={() => parseFile(fileInput.current.files[0]).then(t => JSON.parse(t)).then(d => saveDataAndRedirect(d, navigate))}/>
    <button title={strings.importFile} onClick={e => {
      e.preventDefault();
      fileInput.current.click();
    }}>{emojis.open}
    </button>
    <a hidden ref={downloadLink}>test</a>
    <button title={strings.exportFile} className="mx-4" onClick={e => {
      e.preventDefault();
      exportDocument();
    }}>
      {emojis.save}
    </button>
  </>;
}

interface ILayoutContext {
  setHeaderChildren: (children) => void,
  sidebarVisible: boolean
}

export const LayoutContext = React.createContext<ILayoutContext>(undefined);

export function Layout() {
  const [headerChildren, setChildren] = useState([]);
  const [navBarExtended, toggleNavBar] = useState(false);
  const [sidebarExtended, toggleSidebar] = useState(matchMedia("(min-width: 768px)").matches);
  const dialog = useRef<HTMLDialogElement>();
  const location = useLocation();
  const query = matchMedia("(max-width: 639px)");
  const [isSmallScreen, setSmallScreen] = useState(query.matches);
  query.addEventListener("change", e => setSmallScreen(e.matches));

  const nav = <nav className="row-start-2 row-span-2 dark:text-white">
    <ul className={`flex flex-col gap-2 ${isSmallScreen ? "" : "ml-2"} text-lg`}>
      <li><ReactNavLink to="">
        {emojis.home + (navBarExtended ? ` ${strings.home.title}` : "")}
      </ReactNavLink></li>
      <li><ReactNavLink to="person">
        {emojis.tree + (navBarExtended ? ` ${strings.gedcomX.person.persons}` : "")}
      </ReactNavLink>
      </li>
      <li><ReactNavLink to="stats">
        {emojis.stats + (navBarExtended ? ` ${strings.statistics.title}` : "")}
      </ReactNavLink></li>
      <li><ReactNavLink to="sourceDescription">
        {emojis.source.default + (navBarExtended ? ` ${strings.gedcomX.sourceDescription.sourceDescriptions}` : "")}
      </ReactNavLink>
      </li>
      <li><ReactNavLink to="document">
        {emojis.document.default + (navBarExtended ? ` ${strings.gedcomX.document.documents}` : "")}
      </ReactNavLink></li>
      <li><ReactNavLink to="place">
        {emojis.place + (navBarExtended ? ` ${strings.gedcomX.placeDescription.places}` : "")}
      </ReactNavLink></li>
      <li><ReactNavLink to="event">
        {emojis.event.default + (navBarExtended ? ` ${strings.gedcomX.event.events}` : "")}
      </ReactNavLink></li>
    </ul>
  </nav>

  const layoutContext = useMemo(() => {
    return {
      setHeaderChildren: setChildren,
      sidebarVisible: sidebarExtended
    }
  }, [sidebarExtended])

  useEffect(() => {
    if (navBarExtended && !dialog.current?.open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [navBarExtended, isSmallScreen]);

  useEffect(() => toggleNavBar(false), [location]);

  return <>
    <div className="row-start-1 ml-4 font-bold text-xl h-full dark:text-white">
      <button onClick={() => toggleNavBar(!navBarExtended)}>{navBarExtended ? emojis.left : emojis.right}</button>
    </div>
    {isSmallScreen ? <dialog ref={dialog} className="rounded-2xl">{nav}</dialog> : nav}

    <header className="row-start-1 flex flex-row items-center justify-center gap-4 dark:text-white w-full">
      {headerChildren}
    </header>

    {<div className="row-start-1 text-right mr-4 dark:text-white">
      <FileButtons/>
      <AgentSelector/>
      <span className={`lg:hidden`}>
        <button onClick={() => toggleSidebar(!sidebarExtended)} className="px-4 py-2 bg-white rounded-full ml-4">
          {sidebarExtended ? emojis.right : emojis.left}
        </button>
      </span>
    </div>}

    <LayoutContext.Provider value={layoutContext}>
      <Outlet/>
    </LayoutContext.Provider>

    <footer className="row-start-4 col-span-3 flex justify-around text-neutral-700 dark:text-neutral-400">
        <span className="hidden md:inline">
          {strings.formatString(strings.footer.sourceCode, <VanillaLink
            href="https://github.com/l0drex/family-tree">Github</VanillaLink>)}
        </span>
      <ReactLink to="imprint">
        {strings.footer.imprint}
      </ReactLink>
      <span className="hidden md:inline">
        <VanillaLink href="https://github.com/l0drex/family-tree/issues/new">
          {strings.footer.bugReport}
        </VanillaLink>
      </span>
    </footer>
  </>
}

export function Main(props) {
  const layoutContext = React.useContext(LayoutContext);

  useEffect(() => {
    if (!props.skipCleanup) {
      layoutContext.setHeaderChildren(<></>);
    }
  }, [layoutContext, props.skipCleanup]);

  let className = `row-start-2 mx-4 ${layoutContext.sidebarVisible ? "sm:ml-0 md:mr-0" : "sm:ml-0 lg:mr-0"} dark:text-white overflow-y-auto`;
  if (layoutContext.sidebarVisible)
    className += " row-start-3 md:row-start-2 row-span-1 md:row-span-2 sm:col-start-2 col-span-3 sm:col-span-2 md:col-span-1";
  else
    className += " row-span-2 col-span-3 md:col-span-2 lg:col-span-1";

  return <main
    className={className}>
    {props.children}
  </main>
}

export function Sidebar(props) {
  const layoutContext = useContext(LayoutContext);

  if (layoutContext.sidebarVisible) {
    return <aside
      className={`row-start-2 md:row-span-2 mx-4 sm:ml-0 col-start-1 sm:col-start-2 md:col-start-3 col-span-3 sm:col-span-2 md:col-span-1 max-h-64 md:max-h-full md:max-w-xs overflow-y-auto overflow-x-scroll flex gap-6 flex-col dark:text-white`}>
      {props.children}
    </aside>
  }
  return <></>;
}
