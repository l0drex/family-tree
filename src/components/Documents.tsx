import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../backend/db";
import {strings} from "../main";
import {Document as DocumentClass} from "../backend/gedcomx-extensions";
import {Document} from "./GedcomXComponents";
import {ElementView} from "./ElementView";
import {Link} from "react-router-dom";

export function Documents() {
  return <ElementView type={"document"} ElementOverview={DocumentOverview} ElementView={Document}/>
}

function DocumentOverview() {
  const documents = useLiveQuery(() => {
    return db.documents.toArray().then(docs => docs.map(d => new DocumentClass(d)));
  }, []);

  const hasDocuments = documents && documents.length > 0;

  return <article>
    <h1><span className={"emoji"}>📄</span> {strings.gedcomX.document.documents}</h1>
    {hasDocuments && <ul className={"clickable"}>
      {documents?.map(doc =>
        <li key={doc.id}><Link to={`${doc.getId()}`}>{`${doc.emoji} ${strings.gedcomX.document.document}`}</Link></li>
      )}
    </ul>}
    {!hasDocuments && <p>{strings.gedcomX.document.noDocuments}</p>}
  </article>
}
