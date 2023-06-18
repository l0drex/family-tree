import {SourceDescription} from "../backend/gedcomx-extensions";
import {filterLang, strings} from "../main";
import {Link, useLoaderData} from "react-router-dom";
import {useEffect, useState} from "react";
import {Coverage, Note, SourceReference} from "./GedcomXComponents";

export function SourceDescriptionOverview() {
  const descriptions = useLoaderData() as SourceDescription[];
  const hasSources = descriptions && descriptions.length > 0;

  return <main><article>
    <h1><span className={"emoji"}>📚</span> {strings.gedcomX.sourceDescription.sourceDescriptions}</h1>
    {hasSources && <ul className={"clickable"}>
      {descriptions?.map(sd =>
        <li key={sd.id}><Link to={`${sd.getId()}`}>{`${sd.emoji} ${sd.title}`}</Link></li>
      )}
    </ul>}
    {!hasSources && <p>{strings.gedcomX.sourceDescription.noSourceDescriptions}</p>}
  </article></main>;
}

export function SourceDescriptionView() {
  const sourceDescription = useLoaderData() as SourceDescription;
  const [text, setText] = useState("");
  const hasMedia = sourceDescription.mediaType && sourceDescription.about;

  useEffect(() => {
    if (!hasMedia) return;
    let mediaType = sourceDescription.mediaType.split('/');
    if (mediaType[0] !== "text") return;

    fetch(sourceDescription.getAbout())
      .then(r => r.text())
      .then(t => setText(t));
  }, [hasMedia, sourceDescription])

  const title = sourceDescription.title;
  const componentOf = sourceDescription.getComponentOf();
  let media;
  if (hasMedia) {
    if (sourceDescription.mediaType.startsWith("text"))
      media = <p>{text}</p>
    else
      media = <object type={sourceDescription.mediaType} data={sourceDescription.about} className={"center"}>
        {sourceDescription.getDescriptions().filter(filterLang)[0]?.getValue()}
      </object>;
  }

  const hasMisc = componentOf || sourceDescription.rights || sourceDescription.repository || sourceDescription.analysis;

  return <main>
    <article>
      <h1><span className={"emoji"}>{sourceDescription?.emoji}</span> {title}</h1>
      {hasMisc && <section className={"misc"}>
        {componentOf && <div>componentOf: <Link
          to={`/sources/${componentOf.getDescription().substring(1)}`}>{componentOf.getDescriptionId() ?? componentOf.getDescription()}</Link>
        </div>}
        {sourceDescription.rights && <div>©️{sourceDescription.rights}</div>}
        {sourceDescription.repository && <div>repository: {sourceDescription.repository}</div>}
        {sourceDescription.getAnalysis() && <Link to={`/documents/${sourceDescription.getAnalysis().substring(1)}`}>Analysis</Link>}
      </section>}
      {hasMedia && <figure>{media}</figure>}
      {sourceDescription.getDescriptions().filter(filterLang).map((d, i) =>
        <p key={i}>{d.getValue()}</p>
      )}
      {sourceDescription.getMediator() && <p>{`Mediator: ${sourceDescription.getMediator()}`}</p>}
      {sourceDescription.citations && <section>
        Citations:
        <ul>
          {sourceDescription.getCitations()
            .filter(filterLang)
            .map((c, i) => <li key={i}>{c.getValue()}</li>)}
        </ul>
      </section>}
    </article>
    {sourceDescription.getCoverage().map((c, i) => <Coverage coverage={c} key={i}/>)}
    {sourceDescription.getNotes().filter(filterLang).map((n, i) => <Note note={n} key={i}/>)}
    {sourceDescription.getSources().map((s, i) => <SourceReference reference={s} key={i}/>)}
  </main>
}
