import "./FamilyPath.css";
import {graphModel} from "../backend/ModelGraph";

function FamilyPath(props) {
    return (
        <footer>
            <ol id="family-path">
                {graphModel.getPersonPath(props.focus).map(p =>
                    <li className={(p.data.id === props.focus.data.id) ? "focusPerson" : ""}
                        key={p.data.id}>
                        {p.data.getFullName()}
                    </li>)}
            </ol>
        </footer>
    );
}

export default FamilyPath;