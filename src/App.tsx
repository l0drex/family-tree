import * as React from "react";
import './App.css';
import {localize} from "./main";
import config from "./config";
import {GraphPerson} from "./backend/graph";
import Header from "./components/Header";
import NavigationTutorial from "./components/NavigationTutorial";
import Notification from "./components/Notification";
import Uploader from "./components/Uploader";
import View from "./components/View";
import {graphModel, loadData} from "./backend/ModelGraph";
import {ReactNode} from "react";

interface State {
  notifications: ReactNode[]
  dataAvailable: boolean
}

class App extends React.Component<any, State> {
  constructor(props) {
    super(props);

    let url = new URL(window.location.href);

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
    if (!this.state.dataAvailable) {
      // show upload form
      return (
        <>
          <Header/>
          <main>
            {this.state.notifications}
            <Uploader onFileSelected={this.onFileSelected.bind(this)}/>
            <NavigationTutorial/>
          </main>
        </>
      );
    }

    return (
      <>
        <Header/>
        {this.state.notifications}
        <View/>
      </>
    );
  }

  onFileSelected(fileContent) {
    sessionStorage.setItem("familyData", fileContent);
    loadData(JSON.parse(fileContent));
    this.setState({
      dataAvailable: true
    });
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
