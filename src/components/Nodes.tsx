import config from "../config";
import {strings} from "../main";
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
      <text y="4pt">{props.locked ? "🔒" : "➖"}</text>
      <title>{props.locked ? strings.nodes.lockedFamilyHint : strings.nodes.hideFamilyHint}</title>
    </g>
  );
}

export function Etc(props) {
  return (
    <g className="etc" onClick={() => props.graph.showFamily(props.data)}>
      <circle r={config.gridSize / 2}/>
      <text y="4pt">➕</text>
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
      <div className={"bg" + (props.focused ? " focused" : "")} title={strings.nodes.clickPersonHint}>
        <p className="fullName">{graphPerson.getName()}</p>
      </div>
    </foreignObject>
  );
}
