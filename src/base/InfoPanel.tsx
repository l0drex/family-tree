import './InfoPanel.css';
import {Component} from "react";
import SearchField from "./SearchField";
import {GraphPerson, PersonFactTypes} from "../backend/gedcomx-extensions";

interface Props {
  onRefocus,
  person: GraphPerson
}

interface State {
  isPortrait: boolean
}

class InfoPanel extends Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      isPortrait: window.matchMedia("orientation: portrait").matches
    }
  }

  render() {
    let person = this.props.person;
    return (
      <aside id="info-panel">
        <a href={"?id=" + person.data.getId()}>
          <pre className="id">{person.data.getId()}</pre>
        </a>
        {this.state.isPortrait ?
          <SearchField onRefocus={this.props.onRefocus} person={person}/> :
          <h1 className="fullName">{person.getName()}</h1>}
        {person.data.getMarriedName() && <h2 className="birth-name">{person.data.getBirthName()}</h2>}
        {person.data.getAlsoKnownAs() && <h2 className="alsoKnownAs">{person.data.getAlsoKnownAs()}</h2>}

        <ul id="factView">
          {person.data.getFacts().sort((a, b) => {
            // place birth at top, generation right below
            if (a.getType() === PersonFactTypes.Birth) {
              return -1;
            } else if (b.getType() === PersonFactTypes.Birth) {
              return 1;
            } else if (a.getType() === PersonFactTypes.Generation) {
              return -1;
            } else if (b.getType() === PersonFactTypes.Generation) {
              return 1;
            }

            if (a.getDate() && !b.getDate()) {
              return 1;
            } else if (!a.getDate() && b.getDate()) {
              return -1;
            }
            if (a.getDate() && b.getDate()) {
              let aDate = a.getDate().toDateObject();
              let bDate = b.getDate().toDateObject();
              if (aDate && bDate) {
                return aDate.getMilliseconds() - bDate.getMilliseconds();
              }
            }

            return 0;
          }).map(f => <li key={f.toString()}>{f.toString()}</li>)}
        </ul>
      </aside>
    );
  }

  componentDidMount() {
    window.addEventListener("resize", () => {
      this.setState({
        isPortrait: window.matchMedia("orientation: portrait").matches
      })
    })
  }
}


export default InfoPanel;
