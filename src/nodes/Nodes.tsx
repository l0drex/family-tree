import config from "../config";
import {translationToString} from "../main";
import viewGraph from "../backend/ViewGraph";
import Gedcomx from "../backend/gedcomx";

export function Family(props) {
  return (
    <g className={"partnerNode" + (props.locked ? " locked" : "")} onClick={() => {
      if (props.locked) {
        return;
      }
      viewGraph.hideFamily(props.data);
      props.onClick();
    }}>
      <circle r={config.gridSize / 2}/>
      {props.data.data.marriage() && props.data.data.marriage().date && props.data.data.marriage().date.toString() &&
        <text x="-24pt" y="5pt" className="marriageDate">
          {`💍 ${props.data.data.marriage().date.toString()}`}
        </text>}
      {!props.locked && <text y="4">-</text>}
      <title>{props.locked ? translationToString({
        en: "This family cannot be hidden.",
        de: "Diese Familie kann nicht ausgeblendet werden."
      }) : translationToString({
        en: "Click to hide this family.",
        de: "Klicke, um diese Familie auszublenden."
      })}</title>
    </g>
  );
}

export function Etc(props) {
  return (
    <g className="etc" onClick={(e) => {
      viewGraph.showFamily(props.data);
      props.onClick(e);
    }}>
      <circle r={config.gridSize / 2}/>
      <text y="5">+</text>
    </g>
  );
}

export function Person(props) {
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
