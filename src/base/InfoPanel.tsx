import './InfoPanel.css';
import {Component} from "react";
import SearchField from "./SearchField";
import Gedcomx, {personFactTypes} from "../backend/gedcomx";

class InfoPanel extends Component<any, any> {
  constructor(props) {
    super(props);

    this.state = {
      orientation: window.screen.orientation
    }

    window.onresize = () => {
      this.setState({
        orientation: window.screen.orientation
      });
    }
  }

  render() {
    let person: Gedcomx.Person = this.props.person.data;
    // TODO fix form
    return (
      <aside id="info-panel">
        <a href={"?id=" + person.id}>
          <pre className="id">{person.id}</pre>
        </a>
        {(this.state.orientation.type === "portrait" || true) &&
          <SearchField onRefocus={this.props.onRefocus} person={person}/>}
        {(this.state.orientation.type === "landscape") && <h1 className="fullName">{person.getFullName()}</h1>}
        {person.getMarriedName() && <h2 className="birth-name">{person.getBirthName()}</h2>}
        {person.getAlsoKnownAs() && <h2 className="alsoKnownAs">{person.getAlsoKnownAs()}</h2>}

        <ul id="factView">
          {person.getFacts().sort((a, b) => {
            // place birth at top, generation right below
            if (a.type === personFactTypes.Birth) {
              return -1;
            } else if (b.type === personFactTypes.Birth) {
              return 1;
            } else if (a.type === personFactTypes.Generation) {
              return -1;
            } else if (b.type === personFactTypes.Generation) {
              return 1;
            }

            if (a.date && !b.date) {
              return 1;
            } else if (!a.date && b.date) {
              return -1;
            }
            if (a.date && b.date) {
              let aDate = a.date.toDateObject();
              let bDate = b.date.toDateObject();
              if (aDate && bDate) {
                return aDate - bDate;
              }
            }

            return 0;
          }).map(f => <li key={f.toString()}>{f.toString()}</li>)}
        </ul>
      </aside>
    );
  }
}


export default InfoPanel;
