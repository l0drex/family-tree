function Notification(props) {
    if (props.type === "warning") {
        return (
            <div className="notification warning" data-reason={props.reason}>
                <b lang="en"><span className="emoji">⚠</span>️ Warning</b>
                <b lang="de"><span className="emoji">⚠</span>️ Achtung</b>
                <span className="description">{props.description}</span>
            </div>
        );
    }
    if (props.type === "error") {
        return (
            <div className="notification error" data-reason={props.reason}>
                <b lang="en"><span className="emoji">💥</span> Error</b>
                <b lang="de"><span className="emoji">💥</span> Fehler</b>
                <span className="description">{props.description}</span>
            </div>
        );
    }
}

export default Notification;
