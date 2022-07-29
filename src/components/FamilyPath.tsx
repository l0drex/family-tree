import "./FamilyPath.css";
import {graphModel} from "../backend/ModelGraph";
import viewGraph from "../backend/ViewGraph";
import {useState} from "react";
import {GraphObject} from "../backend/graph";
import {translationToString} from "../main";
import config from "../config";

function FamilyPath(props) {
  const updateValue = (e: CustomEvent) => setN(e.detail.nodes.filter((n: GraphObject) => n.type === "person").length)

  let [n, setN] = useState(viewGraph.nodes.filter(n => n.type === "person").length)
  viewGraph.addEventListener("add", updateValue)
  viewGraph.addEventListener("remove", updateValue)

  return (
    <footer>
      <ol id="family-path">
        {graphModel.getPersonPath(props.focus).map(p =>
          <li className={(p.getId() === props.focus.getId()) ? "focusPerson" : ""}
              key={p.getId()}>
            {p.getFullName()}
          </li>)}
      </ol>
      <div>
        {translationToString({
          en: `Percentage of visible nodes:`,
          de: `Sichtbarer Anteil:`
        })}
        <meter value={n} max={graphModel.persons.length} high={config.maxElements}
               title={`${n} P, ~${Math.round(n / graphModel.persons.length * 100)}%`}/>
      </div>
    </footer>
  );
}

export default FamilyPath;
