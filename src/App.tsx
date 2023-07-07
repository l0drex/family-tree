import * as React from "react";
import {createBrowserRouter, Outlet, RouterProvider, useLocation} from "react-router-dom";
import {strings} from "./main";
import {useContext, useEffect, useMemo, useRef, useState} from "react";
import {db} from "./backend/db";
import {SourceDescription, Document, Agent, Person, EventExtended} from "./backend/gedcomx-extensions";
import {Home} from "./components/Home";
import Persons from "./components/Persons";
import Statistics from "./components/Statistics";
import {SourceDescriptionOverview, SourceDescriptionView} from "./components/SourceDescriptions";
import {DocumentOverview, DocumentView} from "./components/Documents";
import {AgentOverview, AgentView} from "./components/Agents";
import {PlaceDescription} from "gedcomx-js";
import {PlaceOverview, PlaceView} from "./components/Places";
import ErrorBoundary from "./components/ErrorBoundary";
import {ReactLink, ReactNavLink, VanillaLink} from "./components/GeneralComponents";
import {Imprint} from "./components/Imprint";
import {EventOverview, EventView} from "./components/Events";
import emojis from './backend/emojies.json';

let personCache = {
  id: undefined,
  person: undefined
}

const router = createBrowserRouter([
  {
    path: "*", Component: Layout, children: [
      {
        path: "*", errorElement: <ErrorBoundary/>, children: [
          {index: true, Component: Home},
          {
            path: "persons/:id?", Component: Persons, loader: ({params}) => {
              if (personCache.person !== undefined && personCache.id === params.id) {
                return personCache.person;
              }

              personCache.id = params.id;

              if (!params.id) {
                // find a person whose id does not start with "missing-id-" if possible
                // persons with missing ids are not connected to any other persons, as they cannot be referenced in relationships
                personCache.person = db.persons.toArray().then(ps => ps.sort((a, b) => {
                  // Check if either string starts with "missing-id-"
                  const aStartsWithMissingId = a.id.startsWith("missing-id-");
                  const bStartsWithMissingId = b.id.startsWith("missing-id-");

                  // Sort the strings accordingly
                  if (aStartsWithMissingId && !bStartsWithMissingId) {
                    return 1; // a should come after b
                  } else if (!aStartsWithMissingId && bStartsWithMissingId) {
                    return -1; // a should come before b
                  } else {
                    // If both strings start with "missing-id-" or neither does, perform a regular string comparison
                    return a.id.localeCompare(b.id);
                  }
                })[0]).then(p => p ? new Person(p) : Promise.reject(new Error(strings.errors.noData)));
              } else {
                personCache.person = db.personWithId(params.id);
              }

              return personCache.person;
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
          {
            path: "events", children: [
              {
                index: true,
                Component: EventOverview,
                loader: () => db.events.toArray().then(e => e.length ? e.map(d => new EventExtended(d)) : Promise.reject(new Error(strings.errors.noData)))
              },
              {path: ":id", Component: EventView, loader: ({params}) => db.elementWithId(params.id, "event")}
              ]
          },
          {path: "imprint", Component: Imprint},
          {
            path: "places", children: [
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
  sidebarVisible: boolean
}

export const LayoutContext = React.createContext<ILayoutContext>(undefined);

function Layout() {
  const [titleRight, setTitleRight] = useState<React.ReactNode>(undefined);
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
      <li><ReactNavLink to="persons">
          {emojis.tree + (navBarExtended ? ` ${strings.gedcomX.person.persons}` : "")}
        </ReactNavLink>
      </li>
      <li><ReactNavLink to="stats">
        {emojis.stats + (navBarExtended ? ` ${strings.statistics.title}` : "")}
      </ReactNavLink></li>
      <li><ReactNavLink to="sources">
        {emojis.source.default + (navBarExtended ? ` ${strings.gedcomX.sourceDescription.sourceDescriptions}` : "")}
      </ReactNavLink>
      </li>
      <li><ReactNavLink to="documents">
        {emojis.document.default + (navBarExtended ? ` ${strings.gedcomX.document.documents}` : "")}
      </ReactNavLink></li>
      <li><ReactNavLink to="agents">
        {emojis.agent.agent + (navBarExtended ? ` ${strings.gedcomX.agent.agents}` : "")}
      </ReactNavLink>
      </li>
      <li><ReactNavLink to="places">
        {emojis.place + (navBarExtended ? ` ${strings.gedcomX.placeDescription.places}` : "")}
      </ReactNavLink></li>
      <li><ReactNavLink to="events">
        {emojis.event.default + (navBarExtended ? ` ${strings.gedcomX.event.events}` : "")}
      </ReactNavLink></li>
    </ul>
  </nav>

  const layoutContext = useMemo(() => {
    return {
      setRightTitle: setTitleRight,
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
    <div className="row-start-1 ml-4 font-bold text-xl h-full my-1 dark:text-white">
      <button onClick={() => toggleNavBar(!navBarExtended)}>{navBarExtended ? emojis.left : emojis.right}</button>
    </div>
    {isSmallScreen ? <dialog ref={dialog} className="rounded-2xl">{nav}</dialog> : nav}

    <header className="row-start-1 flex flex-row items-center justify-center gap-4 dark:text-white w-full">
      {headerChildren}
    </header>

    {titleRight && <div className="row-start-1 text-right lg:text-center font-bold text-xl my-1 mr-4 dark:text-white">
      {sidebarExtended && <span className={`mr-4 hidden md:inline`}>{titleRight}</span>}
      <span className={`lg:hidden`}>
        <button onClick={() => toggleSidebar(!sidebarExtended)}>{sidebarExtended ? emojis.right : emojis.left}</button>
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
      className={`row-start-2 md:row-span-2 mx-4 sm:ml-0 col-start-1 sm:col-start-2 md:col-start-3 col-span-3 sm:col-span-2 md:col-span-1 max-h-64 md:max-h-full md:max-w-xs overflow-y-auto overflow-x-scroll flex gap-6 flex-col dark:text-white`}>
      {props.children}
    </aside>
  }
  return <></>;
}
