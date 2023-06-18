import * as gedcomX from "gedcomx-js";
import {filterLang, strings} from "../main";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../backend/db";
import {
  GDate,
  SourceDescription as SourceDescriptionClass,
  Document as DocumentClass, formatJDate,
  Agent as AgentClass
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
  let contributorName = contributor?.names?.filter(filterLang)[0].value;
  let message = props.attribution.getChangeMessage();

  let modifiedString = "";
  if (modified || contributorName || message) {
    modifiedString += strings.gedcomX.attribution.modified + " ";
    if (modified) modifiedString += formatJDate(modified, 18);
    if (modified && contributorName) modifiedString += " ";
  }

  return <cite>
    {createdString} {creator && strings.formatString(strings.byPerson,
    <a href={`agents/${creatorRef.resource.substring(1)}`}>
      {creator.names?.filter(filterLang)[0].value}
    </a>)}
    <br/>
    {modifiedString} {contributor && strings.formatString(strings.byPerson,
    <a href={`agents/${contributorRef.resource.substring(1)}`}>
      {contributor.names?.filter(filterLang)[0].value}
    </a>)}
    {message && ` ("${message}")`}
  </cite>
}

export function SourceDescription(props: { data: SourceDescriptionClass }) {
  const [text, setText] = useState("");
  const hasMedia = props.data.mediaType && props.data.about;
  useEffect(() => {
    if (!hasMedia) return;
    let mediaType = props.data.mediaType.split('/');
    if (mediaType[0] !== "text") return;

    fetch(props.data.getAbout())
      .then(r => r.text())
      .then(t => setText(t));
  }, [hasMedia, props.data])

  const title = props.data.title;
  const componentOf = props.data.getComponentOf();
  let media;
  if (hasMedia) {
    if (props.data.mediaType.startsWith("text"))
      media = <p>{text}</p>
    else
      media = <object type={props.data.mediaType} data={props.data.about} className={"center"}>
        {props.data.getDescriptions().filter(filterLang)[0]?.getValue()}
      </object>;
  }

  const hasMisc = componentOf || props.data.rights || props.data.repository || props.data.analysis;

  return <>
    <article>
      <h1><span className={"emoji"}>{props.data?.emoji}</span> {title}</h1>
      {hasMisc && <section className={"misc"}>
        {componentOf && <div>componentOf: <a
          href={"sources/" + componentOf.getDescription().substring(1)}>{componentOf.getDescriptionId() ?? componentOf.getDescription()}</a>
        </div>}
        {props.data.rights && <div>©️{props.data.rights}</div>}
        {props.data.repository && <div>repository: {props.data.repository}</div>}
        {props.data.getAnalysis() && <a href={"documents/" + props.data.getAnalysis().substring(1)}>Analysis</a>}
      </section>}
      {hasMedia && <figure>{media}</figure>}
      {props.data.getDescriptions().filter(filterLang).map((d, i) =>
        <p key={i}>{d.getValue()}</p>
      )}
      {props.data.getMediator() && <p>{`Mediator: ${props.data.getMediator()}`}</p>}
      {props.data.citations && <section>
        Citations:
        <ul>
          {props.data.getCitations()
            .filter(filterLang)
            .map((c, i) => <li key={i}>{c.getValue()}</li>)}
        </ul>
      </section>}
    </article>
    {props.data.getCoverage().map((c, i) => <Coverage coverage={c} key={i}/>)}
    {props.data.getNotes().filter(filterLang).map((n, i) => <Note note={n} key={i}/>)}
    {props.data.getSources().map((s, i) => <SourceReference reference={s} key={i}/>)}
  </>
}

export function SourceReference(props: { reference: gedcomX.SourceReference }) {
  return <article>
    <h1><span className="emoji">{"📖"}</span> {strings.gedcomX.sourceDescription.sourceDescription}</h1>
    <p>
      <a href={`sources/${props.reference.description.substring(1)}`}>{props.reference.description}</a>
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
    return <a href={"places/" + props.reference.description.substring(1)}>{original}</a>
  }
  return <span>{original}</span>
}

export function Document(props: { data: DocumentClass }) {
  // todo sanitize and render xhtml
  return <>
    <article>
      <h1><span className={"emoji"}>📄</span> {strings.gedcomX.document.document}</h1>
      <section className={"misc"}>
        {props.data.isExtracted && <p>{strings.gedcomX.document.extracted}</p>}
        {props.data.getConfidence() && <Confidence confidence={props.data.getConfidence()}/>}
      </section>
      {props.data.isPlainText && <p>{props.data.getText()}</p>}
      {props.data.getAttribution() && <p><Attribution attribution={props.data.getAttribution()}/></p>}
    </article>
    {props.data.getNotes().filter(filterLang).map((n, i) => <Note note={n} key={i}/>)}
    {props.data.getSources().map((s, i) => <SourceReference reference={s} key={i}/>)}
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

export function Agent(props: {data: AgentClass}) {
  return <>
    <article>
      <h1><span className={"emoji"}>👤</span> {`${strings.gedcomX.agent.agent} ${props.data.name ?? ""}`}</h1>
      {props.data.names?.length > 1 && <p>{strings.infoPanel.aka + props.data.names.map(n => n.value).join(', ')}</p>}
      {props.data.homepage && <p>{strings.gedcomX.agent.homepage}: <a href={props.data.homepage.resource}>{props.data.homepage.resource}</a></p>}
      {props.data.openid && <p>OpenID: <a href={props.data.openid.resource}>{props.data.openid.resource}</a></p>}
      {props.data.accounts && <>{strings.gedcomX.agent.accounts}: <ul>
        {props.data.accounts.map((a, i) => <li key={i}>
          {strings.formatString(strings.gedcomX.agent.onlineAccount, <>{a.accountName}</>, <a href={a.serviceHomepage.resource}>{a.serviceHomepage.resource}</a>)}
        </li>)}
      </ul></>}
      {props.data.emails && <>{strings.gedcomX.agent.emails}: <ul>
        {props.data.emails.map(e => <li key={e.resource}><a href={`mailto:${e.resource}`}>{e.resource}</a></li>)}
      </ul></>}
      {props.data.phones && <>{strings.gedcomX.agent.phones}:
        <ul>{props.data.phones.map(p => <li key={p.resource}><a href={`tel:${p.resource}`}>{p.resource}</a></li>)}
      </ul></>}
      {props.data.addresses && <>{strings.gedcomX.agent.addresses}: <ul>
        {props.data.addresses.map(a => <li key={a.value}>{a.value}</li>)}
      </ul></>}
      {props.data.person && <p>{strings.gedcomX.agent.person}: <a href={`persons/${props.data.person.resource.substring(1)}`}>{props.data.person.resource}</a></p>}
    </article>
  </>
}
