import config from "../config";
import {translationToString} from "../main";
import viewGraph from "../backend/ViewGraph";

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
      {/* TODO add marriage date*/}
      {props.data.marriage && props.data.marriage() && props.data.marriage().date && props.data.marriage().date.toString() &&
        <text x={-config.gridSize} y="4pt" className="marriageDate">
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
  let graphPerson = props.data;
  return (
    <foreignObject
      className={
        "person"
        + (" " + graphPerson.gender)
        + (graphPerson.data.isDead() ? " dead" : "")}
      x={-graphPerson.bounds.width() / 2} y={-graphPerson.bounds.height() / 2}
      width={graphPerson.bounds.width()} height={graphPerson.bounds.height()}
      onClick={() => props.onClick(graphPerson)}>
      <div className={"bg" + (props.focused ? " focused" : "")} title={translationToString({
        en: "Click to show more information",
        de: "Klicke für weitere Informationen"
      })}>
        <p className="fullName">{graphPerson.name}</p>
      </div>
    </foreignObject>
  );
}
