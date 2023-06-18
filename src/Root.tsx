import * as React from "react";
import './App.css';
import {strings} from "./main";
import Persons from "./components/Persons";
import {createBrowserRouter, Link, Outlet, Route, RouterProvider, Routes} from "react-router-dom";
import {Home, Imprint} from "./components/Home";
import Statistics from "./components/Statistics";
import {SourceDescriptions} from "./components/SourceDescriptions";
import {Documents} from "./components/Documents";
import {Agents} from "./components/Agents";
import Header from "./components/Header";
import {useState} from "react";

// todo: places
const router = createBrowserRouter([
  {
    path: "*", Component: Layout, children: [
      {index: true, Component: Home},
      {path: "persons/:id?", Component: Persons},
      {path: "stats", Component: Statistics},
      {path: "sources/:id?", Component: SourceDescriptions},
      {path: "documents/:id?", Component: Documents},
      {path: "agents/:id?", Component: Agents},
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
      <Outlet/>
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
