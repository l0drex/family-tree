import * as gedcomX from "gedcomx-js";
import { filterLang, strings } from "../main";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../backend/db";
import { getDateFormatOptions, GDate } from "../gedcomx/gedcomx-js-extensions";
import { baseUri, Confidence as ConfidenceEnum, IdentifierTypes } from "../gedcomx/types";
import { Link, useParams } from "react-router-dom";
import {
  AddDataButton,
  Article,
  ArticleCollection, DeleteDataButton, Details, EditDataButton,
  Gallery,
  Hr, Input,
  Media,
  P,
  ReactLink,
  Tag,
  Title
} from "./GeneralComponents";
import emojis from "../backend/emojies.json";
import { useContext } from "react";
import { LayoutContext } from "../Layout";
import * as React from "react";
import { UpdateAttribution } from "./Agents";

export function Notes({noMargin, notes}: { notes: gedcomX.Note[], noMargin?: boolean }) {
  const editing = useContext(LayoutContext)?.edit;

  if (!notes || notes.length === 0)
    return <></>;

  return <ArticleCollection noMargin={noMargin}>
    <Title emoji={emojis.note}>{strings.gedcomX.conclusion.notes}</Title>
    {notes.map((note, i) => <Article emoji="" title={note.getSubject()} key={i}>
      <P>{note.getText()}</P>

      {editing && <div className="mb-2 last:mb-0">
        <EditDataButton path={`notes/${i}`} label={true}>
          <NoteForm note={note} />
        </EditDataButton>
        <DeleteDataButton path={`notes/${i}`} label={true}/>
      </div>}

      {note.getAttribution() && <Attribution attribution={note.getAttribution()}/>}
    </Article>)}
    <AddDataButton dataType={strings.gedcomX.conclusion.note} path={"notes"}>
      <NoteForm />
    </AddDataButton>
  </ArticleCollection>
}

function NoteForm({note}: {note?: gedcomX.Note}) {
  return <>
    <Input label={strings.gedcomX.conclusion.note} type="text" name="subject" defaultValue={note?.subject}/>
    <textarea name="text" className="rounded-2xl rounded-br-none p-2 col-span-2" rows={3} defaultValue={note?.text}/>
    <UpdateAttribution attribution={note?.attribution} />
  </>;
}

export function Attribution({attribution}: { attribution: gedcomX.Attribution }) {
  const creator = useLiveQuery(async () => {
    if (!attribution?.getCreator()) return undefined;
    return db.agentWithId(attribution.getCreator());
  }, [attribution]);

  const contributor = useLiveQuery(async () => {
    if (!attribution?.getContributor()) return undefined;
    return db.agentWithId(attribution.getContributor());
  }, [attribution]);

  if (!attribution) return <></>

  const hasCreated = attribution.created || attribution.creator;
  const hasModified = attribution.modified || attribution.contributor || attribution.changeMessage;
  const hasData = hasCreated || hasModified;
  if (!hasData) return <></>

  let created = attribution.getCreated();
  let creatorRef = attribution.getCreator();
  let creatorName = creator?.names?.filter(filterLang)[0].value ?? attribution.creator?.resource;

  let createdString = "";
  if (created || creatorName) {
    createdString += strings.gedcomX.conclusion.attribution.created + " ";
    if (created) createdString += new Date(created).toLocaleString(strings.getLanguage(), getDateFormatOptions(created));
    if (created && creatorName) createdString += " ";
  }

  let modified = attribution.getModified();
  let contributorRef = attribution.getContributor();
  let contributorName = contributor?.names?.filter(filterLang)[0].value ?? attribution.contributor?.resource ?? "";
  let message = attribution.getChangeMessage();

  let modifiedString = "";
  if (modified || contributorName || message) {
    modifiedString += strings.gedcomX.conclusion.attribution.modified + " ";
    if (modified) modifiedString += new Date(modified).toLocaleString(strings.getLanguage(), getDateFormatOptions(modified));
    if (modified && contributorName) modifiedString += " ";
  }

  return <div className="text-neutral-700 dark:text-neutral-400">
    <Details title={strings.gedcomX.conclusion.attribution.attribution}>
      {hasCreated && <P>
        {createdString} {creator && strings.formatString(strings.gedcomX.conclusion.attribution.byPerson,
        <ReactLink to={`/agent/${creatorRef.resource.substring(1)}`}>
          {creatorName}
        </ReactLink>)}
      </P>}
      {hasModified && <P>
        {modifiedString} {contributor && strings.formatString(strings.gedcomX.conclusion.attribution.byPerson,
        <ReactLink to={`/agent/${contributorRef.resource.substring(1)}`}>
          {contributorName}
        </ReactLink>)}
        {message && <>: <cite> "{message}"</cite></>}
      </P>}
    </Details>
  </div>
}

export function SourceReference({reference}: { reference: gedcomX.SourceReference }) {
  const sourceTitle = useLiveQuery(() => {
    if (!reference || !reference.description)
      return undefined;

    return db.sourceDescriptionWithId(reference.description.substring(1))
      .then(sd => `${sd.emoji} ${sd.title}`);
  }, [reference]);

  if (!reference) return <></>;

  // todo qualifiers

  return <Article>
    <P><ReactLink to={`/sources/${reference.description.substring(1)}`}>
      {sourceTitle || reference.description}
    </ReactLink></P>
    {reference.attribution && <Attribution attribution={reference.attribution}/>}
  </Article>
}

export function SourceReferences({references, noMargin}: {
  references: gedcomX.SourceReference[],
  noMargin?: boolean
}) {
  if (!references || references.length === 0)
    return <></>;

  return <ArticleCollection noMargin={noMargin}>
    <Title emoji={emojis.source.default}>{strings.gedcomX.sourceDescription.sourceDescriptions}</Title>
    {references.map((reference, i) => <SourceReference reference={reference} key={i}/>)}
  </ArticleCollection>
}

export function Coverage(props: { coverage: gedcomX.Coverage }) {
  let date;
  if (props.coverage.temporal) date = new GDate(props.coverage.temporal.toJSON()).toString();

  return <Article emoji={emojis.coverage} title={strings.gedcomX.sourceDescription.coverageTitle}>
    <p>
      {props.coverage.temporal && <>{`${strings.gedcomX.sourceDescription.coverage.temporal}: ${date}`}</>}
      {props.coverage.spatial && <>{strings.gedcomX.sourceDescription.coverage.spatial + ": "} <PlaceReference
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
    <span title={strings.gedcomX.conclusion.confidenceExplanation}>{strings.gedcomX.conclusion.confidence}: </span>
    <meter value={confidenceLevel} max={3} low={2} high={2} optimum={3}
           className="rounded-full bg-white dark:bg-opacity-30">{props.confidence}</meter>
  </div>
}

export function Alias({aliases}: { aliases: gedcomX.TextValue[] }) {
  if (aliases.length < 2) return <></>;

  return <P>
    {strings.formatString(strings.gedcomX.person.aka,
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

export function SubjectSidebar({subject}: { subject: gedcomX.Subject }) {
  return <>
    {subject.getIdentifiers() && <Hr/>}
    <Identifiers identifiers={subject.getIdentifiers()}/>
    <ConclusionSidebar conclusion={subject}/>
  </>
}

export function Evidence({evidenceReferences}) {
  const params = useParams();

  if (!evidenceReferences || evidenceReferences.length === 0)
    return <></>;

  let linkTarget = params["id"] ? "../" : "./";

  return <ArticleCollection>
    <Title emoji={emojis.evidence}>{strings.gedcomX.subject.evidence}</Title>
    {evidenceReferences.map((evidence, i) =>
      <Article key={i}>
        <P><ReactLink to={linkTarget + evidence.resource.substring(1)}>{evidence.resource}</ReactLink></P>
        <Attribution attribution={evidence.attribution}/>
      </Article>)}
  </ArticleCollection>
}

export function SubjectArticles({subject, noMargin}: { subject: gedcomX.Subject, noMargin?: boolean }) {
  const media = useLiveQuery(async () => {
    let mediaRefs = subject.getMedia().map(media => media.getDescription());
    return await Promise.all(mediaRefs.map(id => db.sourceDescriptionWithId(id)))
  }, [subject])

  return <>
    {media && media.length > 0 && <Gallery noMargin={noMargin}>
      {media.map((m, i) => {
        let credit = m.getCitations()[0].getValue();
        return <div className="relative" key={i}>
          <Media mimeType={m.mediaType} url={m.getAbout()}
                 alt={m.getDescriptions().filter(filterLang)[0]?.getValue()}/>
          <div className={"absolute bottom-0 py-1 px-4 w-full text-center backdrop-blur rounded-b-2xl"
            + " bg-gray-200 bg-opacity-50 dark:bg-neutral-700 dark:bg-opacity-50"}>
            © <a href={m.getAbout()}>{credit}</a>
          </div>
        </div>
      })}
    </Gallery>}
    <Evidence evidenceReferences={subject.getEvidence()}/>
    <ConclusionArticles conclusion={subject} noMargin={noMargin}/>
  </>
}

export function ConclusionMisc({conclusion, bgColor}: { conclusion: gedcomX.Conclusion, bgColor?: string }) {
  return <>
    {conclusion.analysis && <Tag bgColor={bgColor}>{strings.gedcomX.document.types.Analysis}: <ReactLink
      to={`/documents/${conclusion.analysis.resource.substring(1)}`}>{conclusion.analysis.resource}</ReactLink></Tag>}
    {conclusion.confidence && <Tag bgColor={bgColor}><Confidence confidence={conclusion.confidence}/></Tag>}
  </>
}

export function ConclusionArticles({conclusion, noMargin}: { conclusion: gedcomX.Conclusion, noMargin?: boolean }) {
  return <>
    <SourceReferences references={conclusion.getSources()} noMargin={noMargin}/>
    <Notes notes={conclusion.getNotes()} noMargin={noMargin}/>
  </>
}

export function ConclusionSidebar({conclusion}: { conclusion: gedcomX.Conclusion }) {
  return <>
    {conclusion.getAttribution() && <Hr/>}
    <Attribution attribution={conclusion.getAttribution()}/>
  </>
}

export function Identifiers({identifiers}: { identifiers: gedcomX.Identifiers }) {
  const editing = useContext(LayoutContext).edit;

  if (!identifiers && !editing) return <></>

  return <>
    <ul>
      {identifiers?.getValues(IdentifierTypes.Primary)?.map((id, i) => <li key={i}>
        <span className="font-bold">{id}</span>
        <EditDataButton path={`identifiers/Primary/${i}`}>
          <Input label={strings.gedcomX.identifier.identifier} name="value" type="text" defaultValue={id}/>
        </EditDataButton>
        <DeleteDataButton path={`identifiers/Primary/${i}`}/>
      </li>)}

      {identifiers?.getValues(IdentifierTypes.Authority)?.map((id, i) => <li key={i}>
        <span className="italic">{id}</span>
        <EditDataButton path={`identifiers/Authority/${i}`}>
          <Input label={strings.gedcomX.identifier.identifier} name="value" type="text" defaultValue={id}/>
        </EditDataButton>
        <DeleteDataButton path={`identifiers/Authority/${i}`}/>
      </li>)}

      {identifiers?.getValues(IdentifierTypes.Deprecated)?.map((id, i) => <li key={i}>
        <span className="line-through">{id}</span>
        <EditDataButton path={`identifiers/Deprecated/${i}`}>
          <Input label={strings.gedcomX.identifier.identifier} name="value" type="text" defaultValue={id}/>
        </EditDataButton>
        <DeleteDataButton path={`identifiers/Deprecated/${i}`}/>
      </li>)}

      {identifiers?.getValues(undefined)?.map((id, i) => <li key={i}>
        <span>{id}</span>
        <EditDataButton path={`identifiers/${i}`}>
          <Input label={strings.gedcomX.identifier.identifier} name="value" type="text" defaultValue={id}/>
        </EditDataButton>
        <DeleteDataButton path={`identifiers/${i}`}/>
      </li>)}

      <li className="mt-2 first:mt-0">
        <AddDataButton dataType={strings.gedcomX.identifier.identifier} path={"identifiers"}>
          <select name="type" className="bg-white rounded-full px-4 py-1">
            <option>-</option>
            {Object.entries(strings.gedcomX.identifier.types).map(([type, translation], i) =>
              <option key={i} value={baseUri + type}>{translation}</option>)}
          </select>
          <input type={"text"} name="value" className="rounded-full px-4 py-1"/>
        </AddDataButton>
      </li>
    </ul>
  </>
}
