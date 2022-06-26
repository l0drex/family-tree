import * as React from "react";
import './App.css';
import {localize} from "./main";
import config from "./config";
import GedcomX, {GraphPerson} from "./backend/gedcomx";
import Header from "./base/Header";
import NavigationTutorial from "./base/NavigationTutorial";
import Notification from "./base/Notification";
import FamilyPath from "./base/FamilyPath";
import Uploader from "./base/Uploader";
import InfoPanel from "./base/InfoPanel";
import View from "./base/View";
import {graphModel, GraphModel} from "./backend/ModelGraph";
import {ReactNode} from "react";

interface State {
  notifications: ReactNode[]
  focusId: string
  focusHidden: boolean
  dataAvailable: boolean
}

class App extends React.Component<any, State> {
  constructor(props) {
    super(props);

    let url = new URL(window.location.href);

    let data = sessionStorage.getItem("familyData");
    if (data) {
      GraphModel(new GedcomX(JSON.parse(data)));
    }

    this.state = {
      notifications: [],
      focusId: url.searchParams.get("id"),
      focusHidden: graphModel === undefined,
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

    let focus;
    if (this.state.focusId) {
      focus = graphModel.findById(this.state.focusId);
    } else {
      focus = graphModel.persons[0];
    }
    if (!focus) {
      throw new Error(`No person with id ${this.state.focusId} could be found`)
    }

    return (
      <>
        <Header/>
        {this.state.notifications}
        {!this.state.focusHidden && <InfoPanel person={focus} onRefocus={this.onRefocus.bind(this)}/>}
        <View focus={focus} onRefocus={this.onRefocus.bind(this)} focusHidden={this.state.focusHidden}/>
        <FamilyPath focus={focus}/>
      </>
    );
  }

  onFileSelected(fileContent) {
    sessionStorage.setItem("familyData", fileContent);
    GraphModel(new GedcomX(JSON.parse(fileContent)));
    this.setState({
      dataAvailable: true,
      focusHidden: false
    });
  }

  onRefocus(newFocus: GraphPerson) {
    if (newFocus.data.id === this.state.focusId) {
      this.setState({
        focusHidden: !this.state.focusHidden
      })
      return;
    }
    this.setState({
      focusHidden: false,
      focusId: newFocus.data.id
    });
  }

  componentDidMount() {
    localize(config.browserLang);
    let root = document.querySelector<HTMLDivElement>("#root");
    if (this.state.focusHidden) {
      root.classList.add("sidebar-hidden");
    } else {
      root.classList.remove("sidebar-hidden");
    }
  }

  componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<State>, snapshot?: any) {
    let root = document.querySelector<HTMLDivElement>("#root");
    if (this.state.focusHidden) {
      root.classList.add("sidebar-hidden");
    } else {
      root.classList.remove("sidebar-hidden");
    }
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
