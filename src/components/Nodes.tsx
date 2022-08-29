import config from "../config";
import {translationToString} from "../main";
import viewGraph from "../backend/ViewGraph";
import {GraphPerson} from "../backend/graph";

export function Family(props) {
  return (
    <g className={"partnerNode" + (props.locked ? " locked" : "")} onClick={() => {
      if (props.locked) {
        return;
      }
      viewGraph.hideFamily(props.data);
    }}>
      <circle r={config.gridSize / 2}/>
      {props.data.marriage &&
        <text x={-config.gridSize} y="4pt" className="marriageDate">
          {`💍 ${props.data.marriage}`}
        </text>}
      <text y="4">{props.locked ? "🔒" : "➖"}</text>
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
    <g className="etc" onClick={() => viewGraph.showFamily(props.data)}>
      <circle r={config.gridSize / 2}/>
      <text y="5">➕</text>
    </g>
  );
}

export function Person(props) {
  let graphPerson: GraphPerson = props.data;
  return (
    <foreignObject
      className="person"
      x={graphPerson.x - graphPerson.width / 2} y={graphPerson.y - graphPerson.height / 2}
      width={graphPerson.width} height={graphPerson.height}
      onClick={() => props.onClick(graphPerson.data)}>
      <div className={"bg" + (props.focused ? " focused" : "")} title={translationToString({
        en: "Click to show more information",
        de: "Klicke für weitere Informationen"
      })}>
        <p className="fullName">{graphPerson.getName()}</p>
      </div>
    </foreignObject>
  );
}
