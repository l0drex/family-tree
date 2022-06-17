import * as React from "react";
import './App.css';
import {localize, translationToString} from "./main";
import config from "./config";
import GedcomX from "./backend/gedcomx";
import Header from "./base/Header";
import NavigationTutorial from "./base/NavigationTutorial";
import Notification from "./base/Notification";
import FamilyPath from "./base/FamilyPath";
import Uploader from "./base/Uploader";
import InfoPanel from "./base/InfoPanel";
import View from "./base/View";
import {graphModel, GraphModel} from "./backend/ModelGraph";
import {GraphPerson} from "./backend/ViewGraph";

class App extends React.Component<any, any> {
    constructor(props) {
        super(props);

        let url = new URL(window.location.href);
        this.state = {
            notifications: [],
            focus: url.searchParams.get("id"),
            focusHidden: false,
            data: sessionStorage.getItem("familyData")
        };
    }

    render() {
        if (this.state.data === null) {
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

        let data = new GedcomX(JSON.parse(this.state.data));
        if (!data) {
            throw new Error(
                translationToString({
                    en: "The calculated graph is empty!" +
                        "Please check if your files are empty. If not, please contact the administrator!",
                    de: "Der berechnete Graph ist leer!" +
                        " Prüfe bitte, ob die Dateien leer sind. Sollte dies nicht der Fall sein, kontaktiere bitte den Administrator!"
                }));
        }

        GraphModel(data);
        let focus;
        if (this.state.focus) {
            focus = graphModel.findById(this.state.focus);
        } else {
            focus = graphModel.persons[0];
        }
        if (!focus) {
            throw new Error(`No person with id ${this.state.focus} could be found`)
        }

        return (
            <>
                <Header/>
                {this.state.notifications}
                {!this.state.focusHidden && <InfoPanel person={focus} onRefocus={this.onRefocus.bind(this)}/>}
                <View data={data} focus={focus} onRefocus={this.onRefocus.bind(this)} focusHidden={this.state.focusHidden}/>
                <FamilyPath focus={focus}/>
            </>
        );
    }

    onFileSelected(fileContent) {
        this.setState({
            data: fileContent
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
            focus: newFocus.data.id
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
                <Notification type="warning" description={error.message}/>
            );
        } else {
            console.error(error.message);
            notifications.push(
                <Notification type="error" description={error.message}/>
            );
        }

        this.setState({
            notifications: notifications
        })
    }
}

export default App;
