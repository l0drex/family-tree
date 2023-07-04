import * as React from "react";
import {createBrowserRouter, Outlet, RouterProvider, useLocation} from "react-router-dom";
import {strings} from "./main";
import {useContext, useEffect, useMemo, useRef, useState} from "react";
import {db} from "./backend/db";
import {SourceDescription, Document, Agent, Person} from "./backend/gedcomx-extensions";
import {Home, Imprint} from "./components/Home";
import Persons from "./components/Persons";
import Statistics from "./components/Statistics";
import {SourceDescriptionOverview, SourceDescriptionView} from "./components/SourceDescriptions";
import {DocumentOverview, DocumentView} from "./components/Documents";
import {AgentOverview, AgentView} from "./components/Agents";
import {PlaceDescription} from "gedcomx-js";
import {PlaceOverview, PlaceView} from "./components/Places";
import ErrorBoundary from "./components/ErrorBoundary";
import {ReactLink, ReactNavLink, VanillaLink} from "./components/GeneralComponents";

const router = createBrowserRouter([
  {
    path: "*", Component: Layout, children: [
      {
        path: "*", errorElement: <ErrorBoundary/>, children: [
          {index: true, Component: Home},
          {
            path: "persons/:id?", Component: Persons, loader: ({params}) => {
              if (!params.id) {
                return db.persons.toCollection().first()
                  .then(p => p ? new Person(p) : Promise.reject(new Error(strings.errors.noData)));
              }
              return db.personWithId(params.id);
            }
          },
          {path: "stats", Component: Statistics},
          {
            path: "sources", children: [
              {
                index: true,
                Component: SourceDescriptionOverview,
                loader: () => db.sourceDescriptions.toArray().then(s => s.length ? s.map(d => new SourceDescription(d)) : Promise.reject(new Error(strings.errors.noData)))
              },
              {
                path: ":id",
                Component: SourceDescriptionView,
                loader: ({params}) => db.sourceDescriptionWithId(params.id)
              }
            ]
          },
          {
            path: "documents", children: [
              {
                index: true,
                Component: DocumentOverview,
                loader: () => db.documents.toArray().then(ds => ds.length ? ds.map(d => new Document(d)) : Promise.reject(new Error(strings.errors.noData)))
              },
              {path: ":id", Component: DocumentView, loader: ({params}) => db.elementWithId(params.id, "document")}
            ]
          },
          {
            path: "agents", children: [
              {
                index: true,
                Component: AgentOverview,
                loader: () => db.agents.toArray().then(a => a.length ? a.map(d => new Agent(d)) : Promise.reject(new Error(strings.errors.noData)))
              },
              {path: ":id", Component: AgentView, loader: ({params}) => db.elementWithId(params.id, "agent")}
            ]
          },
          {path: "imprint", Component: Imprint},
          {
            path: "places",  children: [
              {
                index: true,
                Component: PlaceOverview,
                loader: () => db.places.toArray().then(p => p.length ? p.map(d => new PlaceDescription(d)) : Promise.reject(new Error(strings.errors.noData)))
              },
              {path: ":id", Component: PlaceView, loader: ({params}) => db.elementWithId(params.id, "place")}
            ]
          }
        ]
      }]
  }], {basename: "/family-tree"});

export default function App() {
  return <RouterProvider router={router}/>;
}

interface ILayoutContext {
  setRightTitle: (string) => void,
  setHeaderChildren: (ReactNode) => void,
  sidebarVisible: boolean,
  isDark: boolean
}

export const LayoutContext = React.createContext<ILayoutContext>(undefined);

function Layout() {
  const [titleRight, setTitleRight] = useState<React.ReactNode>(undefined);
  const [headerChildren, setChildren] = useState([]);
  const [navBarExtended, toggleNavBar] = useState(false);
  const [sidebarExtended, toggleSidebar] = useState(matchMedia("(min-width: 768px)").matches);
  const dialog = useRef<HTMLDialogElement>();
  const location = useLocation();
  const darkQuery = matchMedia("(prefers-color-scheme: dark)");
  const [isDark, toggleDark] = useState(darkQuery.matches);
  darkQuery.addEventListener("change", e => toggleDark(e.matches));
  const query = matchMedia("(max-width: 639px)");
  const [isSmallScreen, setSmallScreen] = useState(query.matches);
  query.addEventListener("change", e => setSmallScreen(e.matches));

  const nav = <nav className="row-start-2 row-span-2 dark:text-white">
    <ul className={`flex flex-col gap-2 ${isSmallScreen ? "" : "ml-2"} text-lg`}>
      <li><ReactNavLink to="">{"🏠" + (navBarExtended ? ` ${strings.home.title}` : "")}</ReactNavLink></li>
      <li><ReactNavLink to="persons">{"🌳" + (navBarExtended ? ` ${strings.gedcomX.persons}` : "")}</ReactNavLink></li>
      <li><ReactNavLink to="stats">{"📊" + (navBarExtended ? ` ${strings.statistics.title}` : "")}</ReactNavLink></li>
      <li><ReactNavLink
        to="sources">{"📚" + (navBarExtended ? ` ${strings.gedcomX.sourceDescription.sourceDescriptions}` : "")}</ReactNavLink>
      </li>
      <li><ReactNavLink
        to="documents">{"📄" + (navBarExtended ? ` ${strings.gedcomX.document.documents}` : "")}</ReactNavLink></li>
      <li><ReactNavLink to="agents">{"👤" + (navBarExtended ? ` ${strings.gedcomX.agent.agents}` : "")}</ReactNavLink>
      </li>
      <li><ReactNavLink
        to="places">{"🌎" + (navBarExtended ? ` ${strings.gedcomX.placeDescription.places}` : "")}</ReactNavLink></li>
    </ul>
  </nav>

  const layoutContext = useMemo(() => {
    return {
      setRightTitle: setTitleRight,
        setHeaderChildren: setChildren,
      sidebarVisible: sidebarExtended,
      isDark: isDark
    }
  }, [isDark, sidebarExtended])

  useEffect(() => {
    if (navBarExtended && !dialog.current?.open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [navBarExtended, isSmallScreen]);

  useEffect(() => toggleNavBar(false), [location]);

  return <>
    <div className="row-start-1 ml-4 font-bold text-xl h-full my-1 dark:text-white">
      <button onClick={() => toggleNavBar(!navBarExtended)}>{navBarExtended ? "⬅️" : "➡️"}</button>
    </div>
    <header className="row-start-1 text-xl flex flex-row items-center justify-center gap-4 dark:text-white w-full">
      {headerChildren}
    </header>
    {titleRight && <div className="row-start-1 text-right lg:text-center font-bold text-xl my-1 mr-4 dark:text-white">
      {sidebarExtended && <span className={`mr-4 hidden md:inline`}>{titleRight}</span>}
      <span className={`lg:hidden`}>
        <button onClick={() => toggleSidebar(!sidebarExtended)}>{sidebarExtended ? "➡️" : "⬅️"}</button>
      </span>
    </div>}
    {isSmallScreen ? <dialog ref={dialog} className="rounded-2xl">{nav}</dialog> : nav}
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
  const titleRight = props.titleRight ?? "";

  useEffect(() => {
    if (!props.skipCleanup) {
      layoutContext.setRightTitle(titleRight);
      layoutContext.setHeaderChildren(<></>);
    }
  }, [layoutContext, props.skipCleanup, titleRight]);

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
      className={`row-start-2 md:row-span-2 mx-4 sm:ml-0 col-start-1 sm:col-start-2 md:col-start-3 col-span-3 sm:col-span-2 md:col-span-1 max-h-64 md:max-h-full md:max-w-xs overflow-y-auto overflow-x-scroll flex gap-4 flex-col dark:text-white`}>
      {props.children}
    </aside>
  }
  return <></>;
}
