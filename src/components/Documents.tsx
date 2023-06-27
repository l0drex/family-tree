import {filterLang, strings} from "../main";
import {Document} from "../backend/gedcomx-extensions";
import {useLoaderData} from "react-router-dom";
import {Attribution, Confidence, Note, SourceReference} from "./GedcomXComponents";
import {Article, LayoutContext, Main, ReactNavLink, Sidebar, Title} from "../App";
import {useContext, useEffect, useState} from "react";
import {db} from "../backend/db";

export function DocumentOverview() {
  const documents = useLoaderData() as Document[];
  const hasDocuments = documents && documents.length > 0;
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji="📄">{strings.gedcomX.document.documents}</Title>);
  }, [])

  return <Main><Article>
    {hasDocuments && <DocumentList documents={documents}/>}
    {!hasDocuments && <p>{strings.gedcomX.document.noDocuments}</p>}
  </Article></Main>
}

function DocumentList(props) {
  return <ul>
    {props.documents?.map(doc =>
      <li key={doc.id}><ReactNavLink
        to={`${doc.getId()}`}>{`${doc.emoji} ${strings.gedcomX.document.document}`}</ReactNavLink></li>
    )}
  </ul>
}

export function DocumentView() {
  const document = useLoaderData() as Document;
  const [others, setOthers] = useState([]);
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    db.documents.toArray().then(sds => sds.map(sd => new Document(sd))).then(setOthers);
    layoutContext.setHeaderChildren(<Title emoji={document?.emoji}>{strings.gedcomX.document.document}</Title>)
    layoutContext.setRightTitle(strings.gedcomX.sourceDescription.sourceDescriptions);
  }, [])

  // todo sanitize and render xhtml
  return <>
    <Main>
      <Article>
        <section className={"misc"}>
          {document.isExtracted && <p>{strings.gedcomX.document.extracted}</p>}
          {document.getConfidence() && <Confidence confidence={document.getConfidence()}/>}
        </section>
        {document.isPlainText && <p>{document.getText()}</p>}
        {document.getAttribution() && <p><Attribution attribution={document.getAttribution()}/></p>}
      </Article>
      {document.getNotes().filter(filterLang).map((n, i) => <Note note={n} key={i}/>)}
      {document.getSources().map((s, i) => <SourceReference reference={s} key={i}/>)}
    </Main>
    <Sidebar>
      <DocumentList documents={others}/>
    </Sidebar>
  </>
}
