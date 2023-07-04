import * as gedcomX from "gedcomx-js";
import {filterLang, strings} from "../main";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../backend/db";
import {
  formatJDate,
  GDate
} from "../backend/gedcomx-extensions";
import {Confidence as ConfidenceEnum, IdentifierTypes} from "../backend/gedcomx-enums";
import {Link} from "react-router-dom";
import {Article, P, ReactLink, Tag} from "../App";

export function Note(props: { note: gedcomX.Note, noMargin?: boolean }) {
  return <Article emoji={"📝"} title={props.note.getSubject() || strings.gedcomX.note} noMargin={props.noMargin}>
    <p>{props.note.getText()}</p>
    {props.note.getAttribution() && <p><Attribution attribution={props.note.getAttribution()}/></p>}
  </Article>
}

export function Attribution({ attribution}: {attribution: gedcomX.Attribution }) {
  const creator = useLiveQuery(async () => {
    if (!attribution?.getCreator()) return undefined;
    return db.agentWithId(attribution.getCreator());
  }, [attribution]);

  const contributor = useLiveQuery(async () => {
    if (!attribution?.getContributor()) return undefined;
    return db.agentWithId(attribution.getContributor());
  }, [attribution]);

  if (!attribution) return <></>

  let created = attribution.getCreated();
  let creatorRef = attribution.getCreator();
  let creatorName = creator?.names?.filter(filterLang)[0].value ?? attribution.creator.resource;

  let createdString = "";
  if (created || creatorName) {
    createdString += strings.gedcomX.attribution.created + " ";
    if (created) createdString += formatJDate(created, 18);
    if (created && creatorName) createdString += " ";
  }

  let modified = attribution.getModified();
  let contributorRef = attribution.getContributor();
  let contributorName = contributor?.names?.filter(filterLang)[0].value ?? attribution.contributor.resource;
  let message = attribution.getChangeMessage();

  let modifiedString = "";
  if (modified || contributorName || message) {
    modifiedString += strings.gedcomX.attribution.modified + " ";
    if (modified) modifiedString += formatJDate(modified, 18);
    if (modified && contributorName) modifiedString += " ";
  }

  return <>
    <P noMargin>
      {createdString} {creator && strings.formatString(strings.byPerson,
      <ReactLink to={`/agents/${creatorRef.resource.substring(1)}`}>
        {creatorName}
      </ReactLink>)}
    </P>
    <P noMargin>
      {modifiedString} {contributor && strings.formatString(strings.byPerson,
      <ReactLink to={`/agents/${contributorRef.resource.substring(1)}`}>
        {contributorName}
      </ReactLink>)}
      {message && <>: <cite> "{message}"</cite></>}
    </P></>
}

export function SourceReference(props: { reference: gedcomX.SourceReference, noMargin?: boolean }) {
  return <Article emoji="📖" title={strings.gedcomX.sourceDescription.sourceDescription} noMargin={props.noMargin}>
    <p><ReactLink to={`/sources/${props.reference.description.substring(1)}`}>{props.reference.description}</ReactLink>
    </p>
    {props.reference.attribution && <p><Attribution attribution={props.reference.attribution}/></p>}
  </Article>
}

export function Coverage(props: { coverage: gedcomX.Coverage }) {
  let date;
  if (props.coverage.temporal) date = new GDate(props.coverage.temporal.toJSON()).toString();

  return <Article emoji="🗺️" title={strings.sourceDescriptions.coverage}>
    <p>
      {props.coverage.temporal && <>{`${strings.gedcomX.coverage.temporal}: ${date}`}</>}
      {props.coverage.spatial && <>{strings.gedcomX.coverage.spatial + ": "} <PlaceReference
        reference={props.coverage.spatial}/></>}
    </p>
  </Article>
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

  return <div className={"text-center"}>
    <span title={strings.infoPanel.confidenceExplanation}>{strings.infoPanel.confidenceLabel}</span>
    <meter value={confidenceLevel} max={3} low={2} high={2} optimum={3}
           className="rounded-full">{props.confidence}</meter>
  </div>
}

export function Alias({aliases}: { aliases: gedcomX.TextValue[] }) {
  if (aliases.length < 2) return <></>;

  return <P>
    {strings.formatString(strings.infoPanel.aka,
      aliases.filter((_, i) => i > 0)
        .map(n => n.getValue())
        .join(', '))}
  </P>
}

export function SubjectMisc({subject}: { subject: gedcomX.Subject }) {
  return <>
    {subject.isExtracted() && <Tag>{strings.gedcomX.document.extracted}</Tag>}
    <ConclusionMisc conclusion={subject}/>
  </>
}

export function ConclusionMisc({conclusion}: { conclusion: gedcomX.Conclusion }) {
  return <>
    {conclusion.confidence && <Tag><Confidence confidence={conclusion.confidence}/></Tag>}
    {conclusion.analysis && <Tag>{strings.gedcomX.types.document.Analysis}: <ReactLink to={`/documents/${conclusion.analysis.resource.substring(1)}`}>{conclusion.analysis.resource}</ReactLink></Tag>}
  </>
}

export function ConclusionArticles({conclusion, noMargin}: { conclusion: gedcomX.Conclusion, noMargin?: boolean }) {
  return <>
    {conclusion.getNotes().map((note, i) => <Note key={i} note={note} noMargin={noMargin}/>)}
    {conclusion.getSources().map((source, i) => <SourceReference key={i} reference={source} noMargin={noMargin}/>)}
  </>
}

export function Identifiers({identifiers}: { identifiers: gedcomX.Identifiers }) {
  if (!identifiers) return <></>

  // this is broken, lets fix it
  let identifierMap = identifiers.identifiers["identifiers"][0];

  return <>
    <ul>
      {identifierMap[IdentifierTypes.Primary]?.map((id, i) => <li key={i}>{id}</li>)}
      {identifierMap[IdentifierTypes.Authority]?.map((id, i) => <li key={i} className="italic"><ReactLink to={id}>{id}</ReactLink></li>)}
      {identifierMap[IdentifierTypes.Deprecated]?.map((id, i) => <li key={i} className="line-through">{id}</li>)}
    </ul>
  </>
}
