import "./Person.css";
import {translationToString} from "../main";
import Gedcomx from "../backend/gedcomx";

function Person(props) {
  let viewOptions = props.data;
  let person: Gedcomx.Person = props.data.data;
  return (
    <foreignObject
      className={
        "person"
        + (" " + person.getGender())
        + (person.isDead() ? " dead" : "")}
      id={person.id}
      x={-viewOptions.bounds.width() / 2} y={-viewOptions.bounds.height() / 2}
      width={viewOptions.bounds.width()} height={viewOptions.bounds.height()}
      onClick={() => props.onClick(viewOptions)}>
      <div className={"bg" + (props.focused ? " focused" : "")} title={translationToString({
        en: "Click to show more information",
        de: "Klicke für weitere Informationen"
      })}>
        <p className="fullName">{person.getFullName()}</p>
      </div>
    </foreignObject>
  );
}

export default Person;
