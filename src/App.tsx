import * as React from "react";
import {createBrowserRouter, Link, NavLink, Outlet, RouterProvider, useLocation} from "react-router-dom";
import {strings} from "./main";
import {useContext, useEffect, useRef, useState} from "react";
import {db} from "./backend/db";
import {SourceDescription, Document, Agent, Person} from "./backend/gedcomx-extensions";
import {Home, Imprint} from "./components/Home";
import Persons from "./components/Persons";
import Statistics from "./components/Statistics";
import {SourceDescriptionOverview, SourceDescriptionView} from "./components/SourceDescriptions";
import {DocumentOverview, DocumentView} from "./components/Documents";
import {AgentOverview, AgentView} from "./components/Agents";

// todo: places
const router = createBrowserRouter([
  {
    path: "*", Component: Layout, children: [
      {index: true, Component: Home},
      {
        path: "persons/:id?", Component: Persons, loader: ({params}) => {
          if (!params.id) return db.persons.toCollection().first().then(p => new Person(p))
          return db.personWithId(params.id);
        }
      },
      {path: "stats", Component: Statistics},
      {
        path: "sources", children: [
          {
            index: true,
            Component: SourceDescriptionOverview,
            loader: () => db.sourceDescriptions.toArray().then(s => s.map(d => new SourceDescription(d)))
          },
          {path: ":id", Component: SourceDescriptionView, loader: ({params}) => db.sourceDescriptionWithId(params.id)}
        ]
      },
      {
        path: "documents", children: [
          {index: true, Component: DocumentOverview, loader: () => db.documents.toArray().then(d => new Document(d))},
          {path: ":id", Component: DocumentView, loader: ({params}) => db.elementWithId(params.id, "document")}
        ]
      },
      {
        path: "agents", children: [
          {
            index: true,
            Component: AgentOverview,
            loader: () => db.agents.toArray().then(a => a.map(d => new Agent(d)))
          },
          {path: ":id", Component: AgentView, loader: ({params}) => db.agentWithId(params.id)}
        ]
      },
      {path: "imprint", Component: Imprint}
    ]
  }
], {basename: "/family-tree"});

export default function App() {
  return <RouterProvider router={router}/>;
}

interface ILayoutContext {
  setRightTitle: (string) => void,
  setHeaderChildren: (ReactNode) => void,
  sidebarVisible: boolean
}

export const LayoutContext = React.createContext<ILayoutContext>(undefined);

function ShowHiddenButton(props) {
  const dialog = React.useRef<HTMLDialogElement>(null);

  return <button onClick={props.action}>
      {props.title}
    </button>
}

function Layout() {
  const [titleRight, setTitleRight] = useState<React.ReactNode>(undefined);
  const [headerChildren, setChildren] = useState([]);
  const [navBarExtended, toggleNavBar] = useState(false);
  const [sidebarExtended, toggleSidebar] = useState(matchMedia("(min-width: 768px)").matches);
  const dialog = useRef<HTMLDialogElement>();
  const query = matchMedia("(max-width: 768px)");
  const location = useLocation();
  const [isSmallScreen, setSmallScreen] = useState(query.matches);
  query.addEventListener("change", e => setSmallScreen(e.matches));

  const nav = <nav className="row-start-2 dark:text-white">
    <ul className={`flex flex-col gap-2 ${isSmallScreen ? "" : "ml-2"} text-lg`}>
      <li><ReactNavLink to="">{"🏠" + (navBarExtended ? " Home" : "")}</ReactNavLink></li>
      <li><ReactNavLink to="persons">{"🌳" + (navBarExtended ? " Persons" : "")}</ReactNavLink></li>
      <li><ReactNavLink to="stats">{"📊" + (navBarExtended ? " Stats" : "")}</ReactNavLink></li>
      <li><ReactNavLink to="sources">{"📚" + (navBarExtended ? " Sources" : "")}</ReactNavLink></li>
      <li><ReactNavLink to="documents">{"📄" + (navBarExtended ? " Documents" : "")}</ReactNavLink></li>
      <li><ReactNavLink to="agents">{"👤" + (navBarExtended ? " Agents" : "")}</ReactNavLink></li>
    </ul>
  </nav>

  useEffect(() => {
    if (navBarExtended && !dialog.current?.open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [navBarExtended, isSmallScreen]);

  useEffect(() => toggleNavBar(false), [location]);

  return <>
    <div className="row-start-1 ml-4 font-bold text-xl h-full my-1 dark:text-white">
      <ShowHiddenButton title={navBarExtended ? "⬅️" : "➡️"} action={() => toggleNavBar(!navBarExtended)}/>
    </div>
    <header className="row-start-1 text-xl flex flex-row items-center gap-4 dark:text-white">
      {headerChildren}
    </header>
    {titleRight && <div
      className={`row-start-1 text-center mr-4 font-bold text-xl my-1 dark:text-white hidden lg:block`}>{titleRight}</div>}
    {titleRight && <div
      className={`row-start-1 text-right ${titleRight ? "mr-4" : ""} font-bold text-xl my-1 dark:text-white block lg:hidden`}>
      <ShowHiddenButton title={sidebarExtended ? "➡️" : "⬅️"} action={() => toggleSidebar(!sidebarExtended)}/>
    </div>}
    {isSmallScreen ? <dialog ref={dialog} className="rounded-2xl">{nav}</dialog> : nav}
    <LayoutContext.Provider value={{
      setRightTitle: setTitleRight,
      setHeaderChildren: setChildren,
      sidebarVisible: sidebarExtended
    }}>
      <Outlet/>
    </LayoutContext.Provider>
    <footer className="row-start-3 col-span-3 flex justify-around text-neutral-700 dark:text-neutral-400">
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
  }, [titleRight]);

  return <main className={`row-start-2 ${layoutContext.sidebarVisible ? "col-span-2 md:col-span-1" : "col-span-3 md:col-span-2 lg:col-span-1"} mx-4 md:ml-0 lg:mr-0 dark:text-white`}>
    {props.children}
  </main>
}

export function Sidebar(props) {
  const visible = useContext(LayoutContext).sidebarVisible;

  useEffect(() => {
    let root = document.querySelector<HTMLDivElement>("#root");
    root.classList.add("sidebar-visible");
  }, [])

  if (visible) {
    return <aside
      className={`row-start-2 col-start-3 max-w-xs overflow-y-auto overflow-x-scroll flex gap-4 flex-col mr-4 dark:text-white`}>
      {props.children}
    </aside>
  }
  return <></>;
}

export function Article(props) {
  return (
    <article
      className="bg-white bg-opacity-50 dark:bg-opacity-10 rounded-2xl mt-4 first:mt-0 mx-auto p-4 w-full max-w-3xl" {...props}>
      {props.title && <h1 className="font-bold text-xl dark:border-gray-400 mb-4"><span
        className="font-normal">{props.emoji}</span> {props.title}</h1>}
      {props.children}
    </article>
  );
}

export function Kbd(props) {
  return <kbd
    className="bg-gray-200 dark:bg-neutral-600 rounded-lg p-1 border-b-2 border-b-gray-400">{props.children}</kbd>
}

export function VanillaLink(props) {
  return <a className="underline" {...props}>{props.children}</a>
}

export function ReactLink(props) {
  return <Link className="underline" {...props}>{props.children}</Link>
}

export function ReactNavLink(props) {
  return <NavLink to={props.to} className="block transition-colors hover:bg-white bg-opacity-100 dark:hover:bg-opacity-10 p-2 rounded-lg">{props.children}</NavLink>
}

export function Details(props) {
  return <details className="rounded-2xl last:mb-0">
    <summary className="font-bold">{props.title}</summary>
    {props.children}
  </details>
}

export function ButtonLike(props: { enabled?: boolean, primary?: boolean, noHover?: boolean, children? }) {
  const enabled = props.enabled ?? true;
  const primary = props.primary ?? false;
  const noHover = props.noHover ?? false;

  let style: string;
  if (enabled) {
    style = "cursor-pointer";
    if (!noHover) style += "hover:shadow-md hover:scale-110 active:scale-105 active:shadow-sm transition-all";
    if (primary) style += " bg-green-700 text-white";
    else style += " bg-white dark:bg-neutral-500";
  } else {
    style = "border-green-700 border-2 cursor-not-allowed";
  }

  return <div
    className={`inline-block rounded-full max-w-fit max-h-fit mx-2 ${style}`}>
    {props.children}
  </div>
}
