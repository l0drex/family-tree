import * as gedcomX from "gedcomx-js";
import {filterLang, strings} from "../main";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../backend/db";
import {
  formatJDate,
  GDate
} from "../backend/gedcomx-extensions";
import {Confidence as ConfidenceEnum} from "../backend/gedcomx-enums";
import {Link} from "react-router-dom";

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
    <Link to={`/agents/${creatorRef.resource.substring(1)}`}>
      {creator.names?.filter(filterLang)[0].value}
    </Link>)}
    <br/>
    {modifiedString} {contributor && strings.formatString(strings.byPerson,
    <a href={`agents/${contributorRef.resource.substring(1)}`}>
      {contributor.names?.filter(filterLang)[0].value}
    </a>)}
    {message && ` ("${message}")`}
  </cite>
}

export function SourceReference(props: { reference: gedcomX.SourceReference }) {
  return <article>
    <h1><span className="emoji">{"📖"}</span> {strings.gedcomX.sourceDescription.sourceDescription}</h1>
    <p>
      <Link to={`/sources/${props.reference.description.substring(1)}`}>{props.reference.description}</Link>
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
    return <Link to={"/places/" + props.reference.description.substring(1)}>{original}</Link>
  }
  return <span>{original}</span>
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
