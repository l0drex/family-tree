import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../backend/db";
import {strings} from "../main";
import {Document as DocumentClass} from "../backend/gedcomx-extensions";
import {Document} from "./GedcomXComponents";

export function Documents() {
  const document = useLiveQuery(() => {
    let url = new URL(window.location.href);
    let id = url.hash.substring(1);
    if (id.length === 0) return null;
    return db.documentWithId(id);
  });

  return <main>
    {document ? <Document document={document}/> : <DocumentOverview/>}
  </main>
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
        <li key={doc.id}><a href={`#${doc.getId()}`}>{`${doc.emoji} ${strings.gedcomX.document.documents}`}</a></li>
      )}
    </ul>}
    {!hasDocuments && <p>{strings.gedcomX.document.noDocuments}</p>}
  </article>
}
