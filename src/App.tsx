import * as React from "react";
import {useEffect, useState} from "react";
import './App.css';
import {localize} from "./main";
import config from "./config";
import Notification from "./components/Notification";
import View from "./components/View";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Home} from "./components/Home";

function App() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => localize(config.browserLang), []);

  try {
    return <BrowserRouter basename={"family-tree"}>
      {notifications}
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/view" element={<View/>}/>
      </Routes>
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
