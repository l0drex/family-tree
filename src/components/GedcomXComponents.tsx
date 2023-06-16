import * as gedcomX from "gedcomx-js";
import {filterLang, strings} from "../main";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../backend/db";
import {GDate, SourceDescription as SourceDescriptionClass} from "../backend/gedcomx-extensions";
import {useEffect, useState} from "react";

export function Note(props: { note: gedcomX.Note }) {
  return <article>
    <h1><span className={"emoji"}>📝</span> {props.note.getSubject() || strings.infoPanel.note}</h1>
    <p>{props.note.getText()}</p>
    {props.note.getAttribution() && <Attribution attribution={props.note.getAttribution()}/>}
  </article>
}

/**
 * @todo this is untested as I don't have data to do so. Please file a bug if you find something weird.
 */
export function Attribution(props: { attribution: gedcomX.Attribution }) {
  let created = props.attribution.getCreated().toString();
  let creatorRef = props.attribution.getCreator();
  const creator = useLiveQuery(async () => db.agentWithId(creatorRef), [creatorRef]);
  let creatorName = creator.getNames().filter(filterLang)[0].getValue();
  let modified = props.attribution.getModified().toString();
  let contributorRef = props.attribution.getContributor();
  const contributor = useLiveQuery(async () => db.agentWithId(contributorRef), [contributorRef]);
  let contributorName = contributor.getNames().filter(filterLang)[0].getValue();
  let message = props.attribution.getChangeMessage();

  return <cite>{strings.formatString(strings.infoPanel.attribution, created, creatorName, modified, contributorName)} {message}</cite>
}

export function SourceDescription(props: { description: SourceDescriptionClass }) {
  const [text, setText] = useState("");
  const hasMedia = props.description.mediaType && props.description.about;
  useEffect(() => {
    if (!hasMedia) return;
    let mediaType = props.description.mediaType.split('/');
    if (mediaType[0] !== "text") return;

    fetch(props.description.getAbout())
      .then(r => r.text())
      .then(t => setText(t));
  }, [hasMedia, props.description])

  const title = (props.description.getTitles().length > 0) ? props.description.getTitles()[0].value : strings.infoPanel.source;
  const componentOf = props.description.getComponentOf();
  const analysis = useLiveQuery(() => {
    let id = props.description.getAnalysis()?.substring(1);
    //return db.documentWithId(id);
    return id;
  }, [props.description])
  let media;
  if (hasMedia) {
    if (props.description.mediaType.startsWith("text"))
      media = <p>{text}</p>
    else
      media = <object type={props.description.mediaType} data={props.description.about} className={"center"}>
        {props.description.getDescriptions().filter(filterLang)[0]?.getValue()}
      </object>;
  }

  const hasMisc = componentOf || props.description.rights || props.description.repository || analysis;

  return <>
    <article>
      <h1><span className={"emoji"}>{props.description?.emoji}</span> {title}</h1>
      {hasMisc && <section className={"misc"}>
        {componentOf && <div>componentOf: <a
          href={componentOf.getDescription()}>{componentOf.getDescriptionId() ?? componentOf.getDescription()}</a>
        </div>}
        {props.description.rights && <div>©️{props.description.rights}</div>}
        {props.description.repository && <div>repository: {props.description.repository}</div>}
        {analysis && <a href={analysis}>Analysis</a>}
      </section>}
      {hasMedia && <figure>{media}</figure>}
      {props.description.getDescriptions().filter(filterLang).map((d, i) =>
        <p key={i}>{d.getValue()}</p>
      )}
      {props.description.getMediator() && <p>{`Mediator: ${props.description.getMediator()}`}</p>}
      {props.description.citations && <section>
        Citations:
        <ul>
          {props.description.getCitations()
            .filter(filterLang)
            .map((c, i) => <li key={i}>{c.getValue()}</li>)}
        </ul>
      </section>}
    </article>
    {props.description.getCoverage().map((c, i) => <Coverage coverage={c} key={i}/>)}
    {props.description.getNotes().filter(filterLang).map((n, i) => <Note note={n} key={i}/>)}
    {props.description.getSources().map((s, i) => <SourceReference reference={s} key={i}/>)}
  </>
}

export function SourceReference(props: { reference: gedcomX.SourceReference }) {
  return <article>
    <h1><span className="emoji">{"📖"}</span> {strings.infoPanel.source}</h1>
    <p>
      <a href={`sources#${props.reference.description}`}>{props.reference.description}</a>
      {props.reference.attribution && <Attribution attribution={props.reference.attribution}/>}
    </p>
  </article>
}

export function Coverage(props: { coverage: gedcomX.Coverage }) {
  let date = new GDate(props.coverage.temporal.toJSON()).toString();
  return <article>
    <h1><span className={"emoji"}>🗺️</span> {strings.sourceDescriptions.coverage}</h1>
    <p>
      {props.coverage.temporal && <>{date}</>}
      {props.coverage.spatial && <PlaceReference reference={props.coverage.spatial}/>}
    </p>
  </article>
}

export function PlaceReference(props: { reference: gedcomX.PlaceReference }) {
  let original = props.reference.original ?? props.reference.description ?? "?";
  if (props.reference.description) {
    return <a href={props.reference.description}>{original}</a>
  }
  return <span>{original}</span>
}
