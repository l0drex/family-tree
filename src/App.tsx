import * as React from "react";
import {ReactNode} from "react";
import './App.css';
import {localize} from "./main";
import config from "./config";
import Notification from "./components/Notification";
import View from "./components/View";
import {graphModel, loadData} from "./backend/ModelGraph";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Home} from "./components/Home";

interface State {
  notifications: ReactNode[]
  dataAvailable: boolean
}

class App extends React.Component<any, State> {
  constructor(props) {
    super(props);
    let data = sessionStorage.getItem("familyData");
    if (data) {
      loadData(JSON.parse(data));
    }

    this.state = {
      notifications: [],
      dataAvailable: graphModel !== undefined
    };
  }

  render() {
    return <BrowserRouter basename={"family-tree"}>
        {this.state.notifications}
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/view" element={<View/>}/>
        </Routes>
    </BrowserRouter>
  }

  componentDidMount() {
    localize(config.browserLang);
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    let notifications = this.state.notifications;

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

    this.setState({
      notifications: notifications
    })
  }
}

export default App;
