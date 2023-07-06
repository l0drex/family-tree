import config from "../config";
import {strings} from "../main";
import {GraphFamily, GraphObject, GraphPerson} from "../backend/graph";
import {Person as PersonClass} from "../backend/gedcomx-extensions";

interface NodeProps {
  data: GraphObject,
  onPersonClick: (person: PersonClass) => void,
  onEtcClick: (family: GraphFamily) => void,
  onFamilyClick: (family: GraphFamily) => void,
  focusHidden: boolean,
  startPerson: PersonClass
}

export function Node({data, onPersonClick, onEtcClick, onFamilyClick, focusHidden, startPerson}: NodeProps) {
  if (data instanceof GraphPerson)
    return <Person data={data} onClick={onPersonClick} focused={!focusHidden && data.data.getId() === startPerson.id}/>

  if (data instanceof GraphFamily) {
    if (data.type === "etc")
      return <Etc onClick={onEtcClick} family={data}/>

    return <Family data={data} locked={data.involvesPerson(startPerson)} onClicked={onFamilyClick}/>
  }
}

export function Family(props: {locked: boolean, data: GraphFamily, onClicked: (a: GraphFamily) => void}) {
  return (
    <g className={"partnerNode fill-gray-200 dark:fill-neutral-800" + (props.locked ? " locked" : "")} onClick={() => {
      if (props.locked) {
        return;
      }
      props.onClicked(props.data);
    }}>
      <circle r={config.gridSize / 2}/>
      {props.data.marriage &&
        <text x={-config.gridSize} y="4pt" className="marriageDate fill-black dark:fill-white">
          {`💍 ${props.data.marriage}`}
        </text>}
      <text y="4pt">{props.locked ? "🔒" : "➖"}</text>
      <title>{props.locked ? strings.tree.lockedFamilyHint : strings.tree.hideFamilyHint}</title>
    </g>
  );
}

export function Etc(props: {onClick: Function, family: GraphFamily}) {
  return (
    <g className="etc" onClick={() => props.onClick(props.family)}>
      <circle r={config.gridSize / 2} className="fill-gray-200 dark:fill-neutral-800"/>
      <text y="4pt">➕</text>
    </g>
  );
}

export function Person(props: {data: GraphPerson, onClick: (person: PersonClass) => void, focused: boolean}) {
  let graphPerson: GraphPerson = props.data;
  return (
    <foreignObject
      className="person overflow-visible cursor-pointer select-none"
      width={graphPerson.width} height={graphPerson.height}
      onClick={() => props.onClick(graphPerson.data)}>
      <div className={"bg rounded-3xl px-4 py-2 bg-gray-200 dark:bg-neutral-800 border-4 dark:font-white" + (props.focused ? " focused" : "")} title={strings.tree.clickPersonHint}>
        <p className="fullName text-center">{graphPerson.getName()}</p>
      </div>
    </foreignObject>
  );
}
