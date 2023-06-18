import * as React from "react";
import './App.css';
import {strings} from "./main";
import Persons from "./components/Persons";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Home, Imprint} from "./components/Home";
import Statistics from "./components/Statistics";
import {SourceDescriptions} from "./components/SourceDescriptions";
import {Documents} from "./components/Documents";
import {Agents} from "./components/Agents";
import Header from "./components/Header";
import {useState} from "react";

function App() {
  const [headerChildren, setChildren] = useState([]);

  // todo: places
  return <BrowserRouter basename={"family-tree"}>
    <Header>
      {headerChildren}
    </Header>
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/persons" element={<Persons setHeaderChildren={setChildren}/>}/>
      <Route path="/sources" element={<SourceDescriptions/>}/>
      <Route path="/documents" element={<Documents/>}/>
      <Route path="/agents" element={<Agents/>}/>
      <Route path="/imprint" element={<Imprint/>}/>
      <Route path="/stats" element={<Statistics/>}/>
    </Routes>
    <footer>
        <span>
          {strings.formatString(strings.footer.sourceCode, <a
            href={"https://github.com/l0drex/family-tree"}>Github</a>)}
        </span>
      <a href="/family-tree/imprint" className="important">
        {strings.footer.imprint}
      </a>
      <a href="https://github.com/l0drex/family-tree/issues/new">
        {strings.footer.bugReport}
      </a>
    </footer>
  </BrowserRouter>
}

export default App;
