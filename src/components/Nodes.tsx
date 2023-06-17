import config from "../config";
import {strings} from "../main";
import {GraphFamily, GraphPerson} from "../backend/graph";
import {Person as PersonClass} from "../backend/gedcomx-extensions";

export function Family(props: {locked: boolean, data: GraphFamily, onClicked: (a: GraphFamily) => void}) {
  return (
    <g className={"partnerNode" + (props.locked ? " locked" : "")} onClick={() => {
      if (props.locked) {
        return;
      }
      props.onClicked(props.data);
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

export function Etc(props: {onClick: Function, family: GraphFamily}) {
  return (
    <g className="etc" onClick={() => props.onClick(props.family)}>
      <circle r={config.gridSize / 2}/>
      <text y="4pt">➕</text>
    </g>
  );
}

export function Person(props: {data: GraphPerson, onClick: (person: PersonClass) => void, focused: boolean}) {
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
