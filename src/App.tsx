import * as React from "react";
import {useEffect, useState} from "react";
import './App.css';
import {localize, translationToString} from "./main";
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
        {translationToString({
          en: <span>The source code is available on <a href={"https://github.com/l0drex/family-tree"}>Github</a>.</span>,
          de: <span>Der Quellcode ist auf <a href={"https://github.com/l0drex/family-tree"}>Github</a> verfügbar.</span>
        })}
        <a href="/family-tree/imprint">{translationToString({
          en: "Imprint & privacy policy",
          de: "Impressum & Datenschutzerklärung"
        })}</a>
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
