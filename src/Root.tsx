import * as React from "react";
import {createBrowserRouter, Link, Outlet, RouterProvider} from "react-router-dom";
import './App.css';
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
      <div className={"main-container"}>
        <Outlet/>
      </div>
    </HeaderContext.Provider>
    <footer>
        <span>
          {strings.formatString(strings.footer.sourceCode, <a
            href="https://github.com/l0drex/family-tree">Github</a>)}
        </span>
      <Link to="imprint" className="important">
        {strings.footer.imprint}
      </Link>
      <a href="https://github.com/l0drex/family-tree/issues/new">
        {strings.footer.bugReport}
      </a>
    </footer>
  </>
}
