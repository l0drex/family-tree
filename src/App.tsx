import * as React from "react";
import {ReactNode} from "react";
import './App.css';
import {localize} from "./main";
import config from "./config";
import Header from "./components/Header";
import NavigationTutorial from "./components/NavigationTutorial";
import Notification from "./components/Notification";
import Uploader from "./components/Uploader";
import View from "./components/View";
import {graphModel, loadData} from "./backend/ModelGraph";
import {BrowserRouter, Route, Routes} from "react-router-dom";

interface State {
  notifications: ReactNode[]
  dataAvailable: boolean
}

class App extends React.Component<any, State> {
  constructor(props) {
    super(props);
    new URL(window.location.href);
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
      <Header/>
        {this.state.notifications}
        <Routes>
          <Route path="/" element={
            <main>
              <Uploader onFileSelected={this.onFileSelected.bind(this)}/>
              <NavigationTutorial/>
            </main>
          }/>
          <Route path="/view" element={<View/>}/>
        </Routes>
    </BrowserRouter>
  }

  onFileSelected(fileContent) {
    sessionStorage.setItem("familyData", fileContent);
    loadData(JSON.parse(fileContent));
    if (window.location.href.endsWith("/")) {
      window.location.href += "view";
    } else {
      window.location.href += "/view";
    }
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
