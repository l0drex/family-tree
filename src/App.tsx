import * as React from "react";
import './App.css';
import {strings} from "./main";
import View from "./components/View";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Home, Imprint} from "./components/Home";

function App() {
  return <BrowserRouter basename={"family-tree"}>
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/view" element={<View/>}/>
      <Route path="/imprint" element={<Imprint/>}/>
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
