import './InfoPanel.css';
import {baseUri, PersonFactTypes} from "../backend/gedcomx-enums";
import {filterLang, strings} from "../main";
import {Gallery} from "./Gallery";
import Sidebar from "./Sidebar";
import * as gedcomX from "gedcomx-js";
import {db} from "../backend/db";
import {useLiveQuery} from "dexie-react-hooks";
import {GDate, Person} from "../backend/gedcomx-extensions";

interface Props {
  onRefocus: (newFocus: Person) => void,
  person: Person
}

function InfoPanel(props: Props) {
  let person = props.person;

  const images = useLiveQuery(async () => {
    return getImages(person);
  }, [person.id])

  let confidence;
  if (person.getConfidence()) {
    switch (person.getConfidence().substring(baseUri.length)) {
      case "Low":
        confidence = 1;
        break;
      case "Medium":
        confidence = 2;
        break;
      case "High":
        confidence = 3;
        break;
    }
  }

  const parents = useLiveQuery(async () => {
    return db.getParentsOf(person.id).then(parents =>
      Promise.all(parents.map(r => db.personWithId(r))));
  }, [person.id])

  const children = useLiveQuery(async () => {
    return db.getChildrenOf(person.id).then(children =>
      Promise.all(children.map(r => db.personWithId(r))));
  }, [person.id])

  const partner = useLiveQuery(async () => {
    return db.getPartnerOf(person.id).then(partner =>
      Promise.all(partner.map(r => db.personWithId(r))));
  }, [person.id])

  const godparents = useLiveQuery(async () => {
    return db.getGodparentsOf(person.id).then(parents =>
      Promise.all(parents.map(r => db.personWithId(r))));
  }, [person.id])

  const godchildren = useLiveQuery(async () => {
    return db.getGodchildrenOf(person.id).then(children =>
      Promise.all(children.map(r => db.personWithId(r))));
  }, [person.id])

  const enslavedBy = useLiveQuery(async () => {
    return db.getEnslavers(person.id).then(children =>
      Promise.all(children.map(r => db.personWithId(r))));
  }, [person.id])

  const slaves = useLiveQuery(async () => {
    return db.getSlaves(person.id).then(children =>
      Promise.all(children.map(r => db.personWithId(r))));
  }, [person.id])

  const sourceDescriptions = useLiveQuery(async () => {
    return Promise.all(person.getSources()
      .map(s => db.sourceDescriptionWithId(s.getDescription())))
  })

  // todo:
  // person.getEvidence()
  // person.getIdentifiers()
  // person.getAnalysis()
  // person.getAttribution()

  return (
    <Sidebar id="info-panel">
      <section className="title">
        <h1 className="name">{person.fullName}</h1>
        {person.marriedName && <h2 className="birth-name">
          {strings.formatString(strings.infoPanel.born, person.birthName)}
        </h2>}
        {person.alsoKnownAs && <h2 className="alsoKnownAs">
          {strings.formatString(strings.infoPanel.aka, person.alsoKnownAs)}
        </h2>}
        {person.nickname && <h2 className="nickname">
          {strings.formatString(strings.infoPanel.nickname, person.nickname)}
        </h2>}
      </section>

      {images && images.length > 0 && <Gallery>
        {images.map(image => {
          let credit = image.getCitations()[0].getValue();
          return <div key={image.id}>
            <img src={image.getAbout()}
                 alt={strings.formatString(strings.infoPanel.personImageAlt, person.fullName) as string
                   /* quick hack, dont know why this does not just return string */}/>
            <span className="credits">
              © <a href={image.getAbout()}>{credit}</a>
            </span>
          </div>
        })}
      </Gallery>}

      <article>
        <ul id="factView">
          {person.getFacts().filter(filterLang).sort((a, b) => {
            // place birth at top, generation right below
            if (a.getType() === PersonFactTypes.Birth) {
              return -1;
            } else if (b.getType() === PersonFactTypes.Birth) {
              return 1;
            } else if (a.getType() === PersonFactTypes.GenerationNumber) {
              return -1;
            } else if (b.getType() === PersonFactTypes.GenerationNumber) {
              return 1;
            }

            if (a.getDate() && !b.getDate()) {
              return 1;
            } else if (!a.getDate() && b.getDate()) {
              return -1;
            }
            if (a.getDate() && b.getDate()) {
              let aDate = new GDate(a.date).toDateObject();
              let bDate = new GDate(b.date).toDateObject();
              if (aDate && bDate) {
                return aDate.getMilliseconds() - bDate.getMilliseconds();
              }
            }

            return 0;
          }).map(f => <li key={f.toString()}
                          style={{listStyleType: `"${f.emoji} "`}}>{f.toString()}</li>)}
        </ul>
      </article>

      {parents && parents.length > 0 && <article>
        <h1>👪 {strings.infoPanel.parents}</h1>
        <ul>
          {parents?.map(p => <li key={p.id}>{p.fullName}</li>)}
        </ul>
      </article>}

      {children && children.length > 0 && <article>
        <h1>🍼 {strings.infoPanel.children}</h1>
        <ul>
          {children.map(p => <li key={p.id}>{p.fullName}</li>)}
        </ul>
      </article>}

      {partner && partner.length > 0 && <article>
        <h1>❤️ {strings.infoPanel.partner}</h1>
        <ul>
          {partner.map(p => <li key={p.id}>{p.fullName}</li>)}
        </ul>
      </article>}

      {godparents && godparents.length > 0 && <article>
        <h1>⛅ {strings.infoPanel.godparents}</h1>
        <ul>
          {godparents.map(p => <li key={p.id}>{p.fullName}</li>)}
        </ul>
      </article>}

      {godchildren && godchildren.length > 0 && <article>
        <h1>⛅ {strings.infoPanel.godchildren}</h1>
        <ul>
          {godchildren.map(p => <li key={p.id}>{p.fullName}</li>)}
        </ul>
      </article>}

      {enslavedBy && enslavedBy.length > 0 && <article>
        <h1>⛓️ {strings.infoPanel.enslavedBy}</h1>
        <ul>
          {enslavedBy.map(p => <li key={p.id}>{p.fullName}</li>)}
        </ul>
      </article>}

      {slaves && slaves.length > 0 && <article>
        <h1>⛓️ {strings.infoPanel.slaves}</h1>
        <ul>
          {slaves.map(p => <li key={p.id}>{p.fullName}</li>)}
        </ul>
      </article>}

      {person.getNotes().filter(filterLang).map((note, i) => {
        return <Note note={note} key={i}/>
      })}

      {sourceDescriptions && sourceDescriptions.map(description => {
        return <article key={description.id}>
          <h1><span className="emoji">📚</span> {strings.infoPanel.source}</h1>
          <p>{description.getCitations()[0].getValue()}</p>
        </article>
      })}

      {person.getConfidence() && <div id="confidence">
        <span title={strings.infoPanel.confidenceExplanation}>{strings.infoPanel.confidenceLabel}</span>
        <meter value={confidence} max={3} low={2} high={2} optimum={3}>{person.getConfidence()}</meter>
      </div>}
    </Sidebar>
  );
}

function Note(props: { note: gedcomX.Note }) {
  return <article>
    <h1><span className={"emoji"}>📝</span> {props.note.getSubject() || strings.infoPanel.note}</h1>
    <p>{props.note.getText()}</p>
    {props.note.getAttribution() && <Attribution attribution={props.note.getAttribution()}/>}
  </article>
}

/**
 * @todo this is untested as I don't have data to do so. Please file a bug if you find something weird.
 */
function Attribution(props: { attribution: gedcomX.Attribution }) {
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

async function getImages(person: Person) {
  let mediaRefs = person.getMedia().map(media => media.getDescription());
  const sourceDescriptions = await Promise.all(mediaRefs.map(r => db.sourceDescriptionWithId(r)));

  return sourceDescriptions.filter(sourceDescription => {
    let mediaType = sourceDescription.getMediaType();
    if (!mediaType) return false;
    return mediaType.split('/')[0] === 'image'
  });
}


export default InfoPanel;
