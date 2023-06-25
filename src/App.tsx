import * as React from "react";
import {createBrowserRouter, Link, Outlet, RouterProvider} from "react-router-dom";
import {strings} from "./main";
import {useEffect, useState} from "react";
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

export const LayoutContext = React.createContext(undefined);

function Layout() {
  const [titleRight, setTitleRight] = useState<React.ReactNode>(undefined);
  const [headerChildren, setChildren] = useState([]);

  return <>
    <div className="row-start-1 ml-4 font-bold text-xl h-full my-1 dark:text-white">{strings.header.navigationMenu}</div>
    <header className="row-start-1 text-xl flex flex-row items-center gap-4">
      {headerChildren}
    </header>
    <div className={`row-start-1 text-center ${titleRight ? "mr-4" : ""} font-bold text-xl my-1 dark:text-white`}>{titleRight}</div>
    <nav className="row-start-2 ml-4">
      <ul className="flex flex-col gap-4 text-center text-xl">
        <li><Link to="">🏠</Link></li>
        <li><Link to="persons">🌳</Link></li>
        <li><Link to="stats">📊</Link></li>
        <li><Link to="sources">📚</Link></li>
        <li><Link to="documents">📄</Link></li>
        <li><Link to="agents">👤</Link></li>
      </ul>
    </nav>
    <LayoutContext.Provider value={{
      setRightTitle: setTitleRight,
      setHeaderChildren: setChildren
    }}>
        <Outlet/>
    </LayoutContext.Provider>
    <footer className="row-start-3 col-span-3 flex justify-around text-neutral-700 dark:text-neutral-400">
        <span>
          {strings.formatString(strings.footer.sourceCode, <VanillaLink
            href="https://github.com/l0drex/family-tree">Github</VanillaLink>)}
        </span>
      <ReactLink to="imprint">
        {strings.footer.imprint}
      </ReactLink>
      <VanillaLink href="https://github.com/l0drex/family-tree/issues/new">
        {strings.footer.bugReport}
      </VanillaLink>
    </footer>
  </>
}

export function Main(props) {
  const layoutContext = React.useContext(LayoutContext);
  const titleRight = props.titleRight ?? "";

  useEffect(() => {
    layoutContext.setRightTitle(titleRight);
  }, [titleRight]);

  return <main className="row-start-2 dark:text-white">
    {props.children}
  </main>
}

export function Sidebar(props) {
  useEffect(() => {
    let root = document.querySelector<HTMLDivElement>("#root");
    root.classList.add("sidebar-visible");
  }, [])

  return <aside className={`row-start-2 col-start-3 max-w-xs overflow-y-auto overflow-x-scroll flex gap-4 portrait:flex-row landscape:flex-col flex-wrap mr-4 dark:text-white`}>
    {props.children}
  </aside>
}

export function Article(props) {
  return (
    <article className="bg-white bg-opacity-50 dark:bg-opacity-10 rounded-2xl mt-4 first:mt-0 mx-auto p-4 pt-2 w-full max-w-3xl" {...props}>
      {props.title && <h1 className="font-bold text-xl dark:border-gray-400 mb-2"><span
        className="font-normal">{props.emoji}</span> {props.title}</h1>}
      {props.children}
    </article>
  );
}

export function Kbd(props) {
  return <kbd className="bg-gray-200 dark:bg-neutral-600 rounded-lg p-1 border-b-2 border-b-gray-400">{props.children}</kbd>
}

export function VanillaLink(props) {
  return <a className="underline" {...props}>{props.children}</a>
}

export function ReactLink(props) {
  return <Link className="underline" {...props}>{props.children}</Link>
}

export function Details(props) {
  return <details className="rounded-2xl last:mb-0">
    <summary className="font-bold">{props.title}</summary>
    {props.children}
  </details>
}

export function ButtonLike(props: {enabled?: boolean, children?}) {
  const enabled = props.enabled ?? true;
  return <div className={`inline-block rounded-full max-w-fit max-h-fit px-4 py-1 mx-2 ${enabled ? "bg-green-700 text-white cursor-pointer hover:shadow-md hover:scale-105" : "border-green-700 border-2 cursor-not-allowed"}`}>
    {props.children}
  </div>
}

export function ClickableLi(props) {
  return <li className="hover:bg-gray-100 px-4 py-1 rounded-2xl">{props.children}</li>
}
