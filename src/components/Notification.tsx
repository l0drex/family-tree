import {translationToString} from "../main";
import "./Notification.css";

function Notification(props) {
  if (props.type === "warning") {
    return (
      <div className="notification warning" data-reason={props.reason}>
        <b><span className="emoji">⚠</span>️ {translationToString({
          en: "Warning",
          de: "Achtung"
        })} | </b>
        <span className="description">{props.description}</span>
      </div>
    );
  }
  if (props.type === "error") {
    return (
      <div className="notification error" data-reason={props.reason}>
        <b lang="en"><span className="emoji">💥</span> {translationToString({
          en: "Error",
          de: "Fehler"
        })} | </b>
        <span className="description">{props.description}</span>
      </div>
    );
  }
}

export default Notification;
