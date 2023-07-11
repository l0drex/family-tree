import {strings} from "../main";
import {Document} from "../backend/gedcomx-extensions";
import {useLoaderData} from "react-router-dom";
import {
  Attribution,
  ConclusionArticles,
  ConclusionMisc
} from "./GedcomXComponents";
import {Article, Hr, P, ReactNavLink, Tag, Tags, Title} from "./GeneralComponents";
import {LayoutContext, Main, Sidebar} from "../App";
import {useContext, useEffect, useState} from "react";
import {db} from "../backend/db";
import * as sanitize from "sanitize-html";
import emojis from '../backend/emojies.json';

export function DocumentOverview() {
  const documents = useLoaderData() as Document[];
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji={emojis.document.default}>{strings.gedcomX.document.documents}</Title>);
  }, [layoutContext])

  return <Main><Article>
    <DocumentList documents={documents}/>
  </Article></Main>
}

function DocumentList({documents}) {
  return <ul>
    {documents?.map(doc =>
      <li key={doc.id}><ReactNavLink to={`/document/${doc.getId()}`}>
        {`${doc.emoji} ${strings.gedcomX.document.document}`}
      </ReactNavLink></li>
    )}
  </ul>
}

export function DocumentView() {
  const document = useLoaderData() as Document;
  const [others, setOthers] = useState([]);
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    db.documents.toArray().then(sds => sds.map(sd => new Document(sd))).then(setOthers);
  }, []);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji={document?.emoji}>{strings.gedcomX.document.document}</Title>)
    layoutContext.setRightTitle(strings.gedcomX.sourceDescription.sourceDescriptions);
  }, [document, layoutContext])

  let html;
  if (document.isXHTML) {
    html = sanitize(document.getText());
  }

  return <>
    <Main>
      <Tags>
        {document.isExtracted && <Tag>{strings.gedcomX.document.extracted}</Tag>}
        <ConclusionMisc conclusion={document}/>
      </Tags>
      <Article>
        {document.isPlainText && <P>{document.getText()}</P>}
        {document.isXHTML && <div dangerouslySetInnerHTML={{__html: html}}/>}
      </Article>
      <ConclusionArticles conclusion={document}/>
    </Main>
    <Sidebar>
      <DocumentList documents={others}/>
      {document.getAttribution() && <>
        <Hr/>
        <Attribution attribution={document.getAttribution()}/>
      </>}
    </Sidebar>
  </>
}
