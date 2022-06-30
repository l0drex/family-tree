import "./FamilyPath.css";
import {graphModel} from "../backend/ModelGraph";

function FamilyPath(props) {
  return (
    <footer>
      <ol id="family-path">
        {graphModel.getPersonPath(props.focus).map(p =>
          <li className={(p.getId() === props.focus.getId()) ? "focusPerson" : ""}
              key={p.getId()}>
            {p.getFullName()}
          </li>)}
      </ol>
    </footer>
  );
}

export default FamilyPath;
