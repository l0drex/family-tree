import * as React from "react";
import {useEffect, useState} from "react";
import './App.css';
import {localize, strings} from "./main";
import config from "./config";
import Notification from "./components/Notification";
import View from "./components/View";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Home, Imprint} from "./components/Home";

function App() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => localize(config.browserLang), []);

  try {
    return <BrowserRouter basename={"family-tree"}>
      {notifications}
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/view" element={<View/>}/>
        <Route path="/imprint" element={<Imprint/>}/>
      </Routes>
      <footer>
        <span>
          {strings.formatString(strings.footer.sourceCode, <a href={"https://github.com/l0drex/family-tree"}>Github</a>)}
        </span>
        <a href="/family-tree/imprint" className="important">
          {strings.footer.imprint}
        </a>
        <a href="https://github.com/l0drex/family-tree/issues/new">
          {strings.footer.bugReport}
        </a>
      </footer>
    </BrowserRouter>
  } catch (error) {
    if (error.name.startsWith("Warning")) {
      console.warn(error.message);
      notifications.push(
        <Notification type="warning" description={error.message} key={error.message}/>
      );
    } else {
      console.error(error.message);
      notifications.push(
        <Notification type="error" description={error.message} key={error.message}/>
      );
    }

    setNotifications(notifications);
  }
}

export default App;
