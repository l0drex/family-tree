import * as React from "react";
import {createBrowserRouter, Link, Outlet, RouterProvider} from "react-router-dom";
import {strings} from "./main";
import {useState} from "react";
import {db} from "./backend/db";
import {SourceDescription, Document, Agent, Person} from "./backend/gedcomx-extensions";
import Header from "./components/Header";
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

export const HeaderContext = React.createContext<Function>(undefined);

function Layout() {
  const [headerChildren, setChildren] = useState([]);

  return <>
    <Header>
      {headerChildren}
    </Header>
    <HeaderContext.Provider value={setChildren}>
      <div className="flex flex-grow gap-4 dark:text-white">
        <Outlet/>
      </div>
    </HeaderContext.Provider>
    <footer className="px-4 pb-1 flex justify-around dark:text-neutral-400">
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
  return <main className="basis-3/4 flex-grow">
    {props.children}
  </main>
}

export function Article(props) {
  return (
    <article className="bg-white dark:bg-neutral-800 dark:text-white rounded-2xl mt-4 first:mt-0 mx-auto mb-0 p-4 pt-2 w-full max-w-3xl" {...props}>
      {props.title && <h1 className="font-bold text-xl border-b dark:border-gray-400 pb-2 mb-2"><span
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
  return <details className="rounded-2xl bg-green-100 dark:bg-neutral-900 px-4 py-1 my-2 last:mb-0">
    <summary className="font-bold">{props.title}</summary>
    {props.children}
  </details>
}

export function ButtonLike(props) {
  return <div className="rounded-full bg-green-400 dark:bg-green-800 px-4 py-2 mx-2 max-w-fit max-h-fit inline">
    {props.children}
  </div>
}

export function ClickableLi(props) {
  return <li className="hover:bg-gray-100 px-4 py-1 rounded-2xl">{props.children}</li>
}
