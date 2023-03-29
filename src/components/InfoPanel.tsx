import './InfoPanel.css';
import {Component} from "react";
import {Person} from "gedcomx-js";
import {PersonFactTypes} from "../backend/gedcomx-enums";

interface Props {
  onRefocus: (newFocus: Person) => void,
  person: Person
}

class InfoPanel extends Component<Props, null> {
  render() {
    let person = this.props.person;
    return (
      <aside id="info-panel">
        <h1 className="name">{person.getFullName()}</h1>
        {person.getMarriedName() && <h2 className="birth-name">{person.getBirthName()}</h2>}
        {person.getAlsoKnownAs() && <h2 className="alsoKnownAs">{person.getAlsoKnownAs()}</h2>}
        {person.getNickname() && <h2 className="nickname">{person.getNickname()}</h2>}

        <ul id="factView">
          {person.getFacts().sort((a, b) => {
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
          }).map(f => <li key={f.toString()} style={{listStyleType: `"${f.getEmoji(person.getGender().getType())} "`}}>{f.toString()}</li>)}
        </ul>
      </aside>
    );
  }
}


export default InfoPanel;
