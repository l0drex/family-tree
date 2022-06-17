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
      <text x="-24pt" y="5pt">
        {props.data.data.marriage() && props.data.data.marriage().date && props.data.data.marriage().date.toString() ? `⚭ ${props.data.data.marriage().date.toString()}` : ""}
      </text>
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
