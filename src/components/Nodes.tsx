import config from "../config";
import {strings} from "../main";
import {GraphFamily, GraphObject, GraphPerson} from "../backend/graph";
import {Person as PersonClass} from "../backend/gedcomx-extensions";
import {ColorMode} from "../backend/ViewGraph";
import * as d3 from "d3";
import {Confidence} from "../backend/gedcomx-enums";
import {useContext} from "react";
import {GraphContext} from "./TreeView";

interface NodeProps {
  data: GraphObject,
  onPersonClick: (person: PersonClass) => void,
  onEtcClick: (family: GraphFamily) => void,
  onFamilyClick: (family: GraphFamily) => void,
  focusHidden: boolean,
  startPerson: PersonClass,
  colorMode: ColorMode
}

export function Node({data, onPersonClick, onEtcClick, onFamilyClick, focusHidden, startPerson, colorMode}: NodeProps) {
  if (data instanceof GraphPerson)
    return <Person graphPerson={data} onClick={onPersonClick} focused={!focusHidden && data.data.getId() === startPerson.id} colorMode={colorMode}/>

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

export function Person(
  {graphPerson, onClick, focused, colorMode}:
    {graphPerson: GraphPerson, onClick: (person: PersonClass) => void, focused: boolean, colorMode: ColorMode}) {
  const graph = useContext(GraphContext);
  let background: string = "gray-200";
  let foreground: string = "";

  switch (colorMode) {
    case ColorMode.GENDER:
      const genderColor = d => {
        if (d === "unknown") return background;
        return d3.scaleOrdinal(["female", "male", "intersex"], ["red-500", "blue-500", "green-500"])(d)
      };

      background = graphPerson.data.isLiving ? genderColor(graphPerson.getGender()): background;
      break;

    case ColorMode.NAME:
      let last_names = graph.nodes.filter(n => n instanceof GraphPerson)
        .map((p: GraphPerson) => p.data.surname);
      last_names = Array.from(new Set(last_names)).sort();
      const nameColor = n => {
        if (!n) return background;

        return d3.scaleOrdinal(last_names, [
          "red-500",
          "orange-500",
          "amber-500",
          "yellow-500",
          "lime-500",
          "green-500",
          "emerald-500",
          "teal-500",
          "cyan-500",
          "sky-500",
          "blue-500",
          "indigo-500",
          "violet-500",
          "purple-500",
          "fuchsia-500",
          "pink-500",
          "rose-500"
        ])(n)
      }

      background = nameColor(graphPerson.data.surname);
      break;

    case ColorMode.AGE:
      const ageColor = d => {
        if (!d) return background;
        return d3.scaleSequential()
          .domain([0, 120])
          .interpolator(d => {
            if (d < 10) return "green-100";
            if (d < 20) return "green-200";
            if (d < 30) return "green-300";
            if (d < 40) return "green-400";
            if (d < 50) return "green-500";
            if (d < 60) return "green-600";
            if (d < 70) return "green-700";
            if (d < 80) return "green-800";
            if (d < 90) return "green-900";
          })(d)
      }

      const age = graphPerson.data.getAgeAt(new Date());
      background = `${ageColor(age)}`;
      foreground = (graphPerson.data.isLiving && age && age > 70) ? "white" : "black";
      break;

    case ColorMode.CONFIDENCE:
      const confidenceColor = d => {
        if (!d) return background;
        return d3.scaleOrdinal([Confidence.Low, Confidence.Medium, Confidence.High],
          ["red-500", "yellow-500", "green-500"])(d)
      }

      background = confidenceColor(graphPerson.data.getConfidence());
  }
  if (foreground === "") {
    if (background !== "gray-200")
      foreground = "white";
    else
      foreground = "black";
  }

  // todo styling when dead?

  return (
    <foreignObject
      className="person overflow-visible cursor-pointer select-none"
      width={graphPerson.width} height={graphPerson.height}
      onClick={() => onClick(graphPerson.data)}>
      <div className={`rounded-3xl px-4 py-2 ` +
        ` bg-${background} text-${foreground}${focused ? ` shadow-lg shadow-${background}` : ""}`}
           title={strings.tree.clickPersonHint}>
        <p className="fullName text-center">{graphPerson.getName()}</p>
      </div>
    </foreignObject>
  );
}
