import {filterLang, strings} from "../main";
import {Document} from "../backend/gedcomx-extensions";
import {Link, useLoaderData} from "react-router-dom";
import {Attribution, Confidence, Note, SourceReference} from "./GedcomXComponents";

export function DocumentOverview() {
  const documents = useLoaderData() as Document[];
  const hasDocuments = documents && documents.length > 0;

  return <main><article>
    <h1><span className={"emoji"}>📄</span> {strings.gedcomX.document.documents}</h1>
    {hasDocuments && <ul className={"clickable"}>
      {documents?.map(doc =>
        <li key={doc.id}><Link to={`${doc.getId()}`}>{`${doc.emoji} ${strings.gedcomX.document.document}`}</Link></li>
      )}
    </ul>}
    {!hasDocuments && <p>{strings.gedcomX.document.noDocuments}</p>}
  </article></main>
}


export function DocumentView() {
  const document = useLoaderData() as Document;

  // todo sanitize and render xhtml
  return <main>
    <article>
      <h1><span className={"emoji"}>📄</span> {strings.gedcomX.document.document}</h1>
      <section className={"misc"}>
        {document.isExtracted && <p>{strings.gedcomX.document.extracted}</p>}
        {document.getConfidence() && <Confidence confidence={document.getConfidence()}/>}
      </section>
      {document.isPlainText && <p>{document.getText()}</p>}
      {document.getAttribution() && <p><Attribution attribution={document.getAttribution()}/></p>}
    </article>
    {document.getNotes().filter(filterLang).map((n, i) => <Note note={n} key={i}/>)}
    {document.getSources().map((s, i) => <SourceReference reference={s} key={i}/>)}
  </main>
}
