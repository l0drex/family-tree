import * as gedcomX from "gedcomx-js";
import {filterLang, strings} from "../main";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../backend/db";
import {
  GDate,
  SourceDescription as SourceDescriptionClass,
  Document as DocumentClass, formatJDate
} from "../backend/gedcomx-extensions";
import {useEffect, useState} from "react";
import {Confidence as ConfidenceEnum} from "../backend/gedcomx-enums";

export function Note(props: { note: gedcomX.Note }) {
  return <article>
    <h1><span className={"emoji"}>📝</span> {props.note.getSubject() || strings.gedcomX.note}</h1>
    <p>{props.note.getText()}</p>
    {props.note.getAttribution() && <p><Attribution attribution={props.note.getAttribution()}/></p>}
  </article>
}

export function Attribution(props: { attribution: gedcomX.Attribution }) {
  let created = props.attribution.getCreated()?.toString();
  let creatorRef = props.attribution.getCreator();
  const creator = useLiveQuery(async () => {
    if (!creatorRef) return undefined;
    return db.agentWithId(creatorRef);
  }, [creatorRef]);
  let creatorName = creator?.names.filter(filterLang)[0].value;

  let createdString = "";
  if (created || creatorName) {
    createdString += strings.gedcomX.attribution.created + " ";
    if (created) createdString += created;
    if (created && creatorName) createdString += " ";
  }

  let modified = props.attribution.getModified();
  let contributorRef = props.attribution.getContributor();
  const contributor = useLiveQuery(async () => {
    if (!contributorRef) return undefined;
    return db.agentWithId(contributorRef);
  }, [contributorRef]);
  let contributorName = contributor?.names.filter(filterLang)[0].value;
  let message = props.attribution.getChangeMessage();

  let modifiedString = "";
  if (modified || contributorName || message) {
    modifiedString += strings.gedcomX.attribution.modified + " ";
    if (modified) modifiedString += formatJDate(modified, 18);
    if (modified && contributorName) modifiedString += " ";
  }


  return <cite>
    {createdString} {creator && strings.formatString(strings.byPerson,
    <a href={"agents" + creatorRef.resource}>
      {creator.names.filter(filterLang)[0].value}
    </a>)}
    <br/>
    {modifiedString} {contributor && strings.formatString(strings.byPerson,
    <a href={"agents" + contributorRef.resource}>
      {contributor.names.filter(filterLang)[0].value}
    </a>)}
    {message && ` ("${message}")`}
  </cite>
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

  const title = props.description.title;
  const componentOf = props.description.getComponentOf();
  let media;
  if (hasMedia) {
    if (props.description.mediaType.startsWith("text"))
      media = <p>{text}</p>
    else
      media = <object type={props.description.mediaType} data={props.description.about} className={"center"}>
        {props.description.getDescriptions().filter(filterLang)[0]?.getValue()}
      </object>;
  }

  const hasMisc = componentOf || props.description.rights || props.description.repository || props.description.analysis;

  return <>
    <article>
      <h1><span className={"emoji"}>{props.description?.emoji}</span> {title}</h1>
      {hasMisc && <section className={"misc"}>
        {componentOf && <div>componentOf: <a
          href={componentOf.getDescription()}>{componentOf.getDescriptionId() ?? componentOf.getDescription()}</a>
        </div>}
        {props.description.rights && <div>©️{props.description.rights}</div>}
        {props.description.repository && <div>repository: {props.description.repository}</div>}
        {props.description.getAnalysis() && <a href={props.description.getAnalysis()}>Analysis</a>}
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
    <h1><span className="emoji">{"📖"}</span> {strings.gedcomX.sourceDescription.sourceDescription}</h1>
    <p>
      <a href={`sources${props.reference.description}`}>{props.reference.description}</a>
      {props.reference.attribution && <p><Attribution attribution={props.reference.attribution}/></p>}
    </p>
  </article>
}

export function Coverage(props: { coverage: gedcomX.Coverage }) {
  let date;
  if (props.coverage.temporal) date = new GDate(props.coverage.temporal.toJSON()).toString();

  return <article>
    <h1><span className={"emoji"}>🗺️</span> {strings.sourceDescriptions.coverage}</h1>
    <p>
      {props.coverage.temporal && <>{`${strings.gedcomX.coverage.temporal}: ${date}`}</>}
      {props.coverage.spatial && <>{strings.gedcomX.coverage.spatial + ": "} <PlaceReference
        reference={props.coverage.spatial}/></>}
    </p>
  </article>
}

export function PlaceReference(props: { reference: gedcomX.PlaceReference }) {
  let original = props.reference.original ?? props.reference.description ?? "?";
  if (props.reference.description) {
    return <a href={"places" + props.reference.description}>{original}</a>
  }
  return <span>{original}</span>
}

export function Document(props: { document: DocumentClass }) {
  // todo sanitize and render xhtml
  return <>
    <article>
      <h1><span className={"emoji"}>📄</span> Document</h1>
      {props.document.isExtracted && <p>{strings.gedcomX.document.extracted}</p>}
      {props.document.getConfidence() && <Confidence confidence={props.document.getConfidence()}/>}
      {props.document.isPlainText && <p>{props.document.getText()}</p>}
      {props.document.getAttribution() && <p><Attribution attribution={props.document.getAttribution()}/></p>}
    </article>
    {props.document.getNotes().filter(filterLang).map((n, i) => <Note note={n} key={i}/>)}
    {props.document.getSources().map((s, i) => <SourceReference reference={s} key={i}/>)}
  </>
}

export function Confidence(props: { confidence: ConfidenceEnum | string }) {
  let confidenceLevel;
  switch (props.confidence) {
    case ConfidenceEnum.Low:
      confidenceLevel = 1;
      break;
    case ConfidenceEnum.Medium:
      confidenceLevel = 2;
      break;
    case ConfidenceEnum.High:
      confidenceLevel = 3;
      break;
    default:
      confidenceLevel = undefined;
      break;
  }

  return <div className={"confidence"}>
    <span title={strings.infoPanel.confidenceExplanation}>{strings.infoPanel.confidenceLabel}</span>
    <meter value={confidenceLevel} max={3} low={2} high={2} optimum={3}>{props.confidence}</meter>
  </div>
}
