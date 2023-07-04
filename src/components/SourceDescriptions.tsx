import {SourceDescription} from "../backend/gedcomx-extensions";
import {filterLang, strings} from "../main";
import {useLoaderData} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import {Alias, Attribution, Coverage, Identifiers, Note, SourceReference} from "./GedcomXComponents";
import {Article, Hr, LayoutContext, Main, ReactLink, ReactNavLink, Sidebar, Tag, Title, VanillaLink} from "../App";
import {db} from "../backend/db";

export function SourceDescriptionOverview() {
  const descriptions = useLoaderData() as SourceDescription[];
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    layoutContext.setHeaderChildren(<Title emoji="📚">{strings.gedcomX.sourceDescription.sourceDescriptions}</Title>);
  }, [])

  return <Main><Article>
    <SourcesList descriptions={descriptions}/>
  </Article></Main>;
}

function SourcesList(props) {
  return <ul>
    {props.descriptions?.map(sd =>
      <li key={sd.id}>
        <ReactNavLink to={`/sources/${sd.getId()}`}>{`${sd.emoji} ${sd.title}`}</ReactNavLink>
      </li>
    )}
  </ul>
}

export function SourceDescriptionView() {
  const sourceDescription = useLoaderData() as SourceDescription;
  const [text, setText] = useState("");
  const hasMedia = sourceDescription.mediaType && sourceDescription.about;
  const [others, setOthers] = useState([]);
  const layoutContext = useContext(LayoutContext);

  useEffect(() => {
    db.sourceDescriptions.toArray().then(sds => sds.map(sd => new SourceDescription(sd))).then(setOthers);
    layoutContext.setHeaderChildren(<Title
      emoji={sourceDescription?.emoji}>{sourceDescription.title ?? strings.gedcomX.sourceDescription.sourceDescription}</Title>)
    layoutContext.setRightTitle(strings.gedcomX.sourceDescription.sourceDescriptions);
  }, [sourceDescription])

  useEffect(() => {
    if (!hasMedia) return;
    let mediaType = sourceDescription.mediaType.split('/');
    if (mediaType[0] !== "text") return;

    fetch(sourceDescription.getAbout())
      .then(r => r.text())
      .then(t => setText(t));
  }, [hasMedia, sourceDescription])

  const componentOf = sourceDescription.getComponentOf();
  let media;
  if (hasMedia) {
    if (sourceDescription.mediaType.startsWith("text"))
      media = <p>{text}</p>
    else
      media = <object type={sourceDescription.mediaType} data={sourceDescription.about}
                      className={"m-auto rounded-2xl my-2 max-w-full"}>
        {sourceDescription.getDescriptions().filter(filterLang)[0]?.getValue()}
      </object>;
  }

  const hasMisc = componentOf || sourceDescription.rights || sourceDescription.repository || sourceDescription.analysis;

  return <>
    <Main>
      {hasMisc && <section className="mx-auto w-fit flex flex-wrap flex-row gap-4">
        {componentOf && <Tag>
          component of: <ReactLink to={`/sources/${componentOf.getDescription().substring(1)}`}>
          {componentOf.getDescriptionId() ?? componentOf.getDescription()}</ReactLink>
        </Tag>}
        {sourceDescription.rights && sourceDescription.getRights().map(r => <Tag key={r.getResource()}>
          rights: <VanillaLink to={r.getResource()}>{r.getResource()}</VanillaLink>
        </Tag>)}
        {sourceDescription.repository && <Tag>
          repository: <VanillaLink to={sourceDescription.getRepository().getResource()}>
          {sourceDescription.getRepository().getResource()}</VanillaLink>
        </Tag>}
        {sourceDescription.getMediator() && <Tag>
          mediator: <ReactLink to={`/${sourceDescription.getMediator().getResource()}`}>
          {sourceDescription.getMediator().getResource()}</ReactLink>
        </Tag>}
        {sourceDescription.getAnalysis() && <Tag>
          <ReactLink to={`/documents/${sourceDescription.getAnalysis().resource.substring(1)}`}>Analysis</ReactLink>
        </Tag>}
      </section>}
      <Article>
        <Alias aliases={sourceDescription.getTitles()}/>
        {hasMedia && <figure className="mb-4 last:mb-0">{media}</figure>}
        {sourceDescription.getDescriptions().filter(filterLang).map((d, i) =>
          <p key={i} className="mb-4 last:mb-0">{d.getValue()}</p>
        )}
        {sourceDescription.citations && <section>
          <h2 className="font-bold">Citations</h2>
          <ul className="list-disc pl-4">
            {sourceDescription.getCitations()
              .filter(filterLang)
              .map((c, i) => <li key={i}>{c.getValue()}</li>)}
          </ul>
        </section>}
      </Article>
      {sourceDescription.getCoverage().map((c, i) => <Coverage coverage={c} key={i}/>)}
      {sourceDescription.getNotes().filter(filterLang).map((n, i) => <Note note={n} key={i}/>)}
      {sourceDescription.getSources().map((s, i) => <SourceReference reference={s} key={i}/>)}
    </Main>
    <Sidebar>
      <SourcesList descriptions={others}/>
      {sourceDescription.getAttribution() && <Hr/>}
      <Attribution attribution={sourceDescription.getAttribution()}/>
      {sourceDescription.getIdentifiers() && <Hr/>}
      <Identifiers identifiers={sourceDescription.getIdentifiers()}/>

    </Sidebar>
  </>
}
