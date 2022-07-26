import "./FamilyPath.css";
import {graphModel} from "../backend/ModelGraph";
import viewGraph from "../backend/ViewGraph";
import {useState} from "react";
import {GraphObject} from "../backend/graph";
import {translationToString} from "../main";

function FamilyPath(props) {
  let [n, setN] = useState(viewGraph.nodes.filter(n => n.type === "person").length)
  viewGraph.addEventListener("add", (e: CustomEvent) => {
    console.log("event received")
    setN(e.detail.nodes.filter((n: GraphObject) => n.type === "person").length)
  })

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
        <meter value={n} max={graphModel.persons.length} low={2} optimum={10} high={100} title={`~${Math.round(n / graphModel.persons.length * 100)}%`}/>
      </div>
    </footer>
  );
}

export default FamilyPath;
