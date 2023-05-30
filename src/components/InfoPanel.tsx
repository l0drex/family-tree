import './InfoPanel.css';
import {Person} from "gedcomx-js";
import {baseUri, PersonFactTypes, RelationshipTypes} from "../backend/gedcomx-enums";
import {filterLang, strings} from "../main";
import {graphModel} from "../backend/ModelGraph";
import {Gallery} from "./Gallery";
import Sidebar from "./Sidebar";
import * as gedcomX from "gedcomx-js";

interface Props {
  onRefocus: (newFocus: Person) => void,
  person: Person
}

function InfoPanel(props: Props) {
  let person = props.person;
  let images = getImages(person);

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

  let parentChild = graphModel.relationships.filter(r => r.getType() === RelationshipTypes.ParentChild);
  let parents = parentChild.filter(r => r.getPerson2().getResource().substring(1) === person.getId())
    .map(r => graphModel.getPersonById(r.getOtherPerson(person)));
  let children = parentChild.filter(r => r.getPerson1().getResource().substring(1) === person.getId())
    .map(r => graphModel.getPersonById(r.getOtherPerson(person)));

  let partner = graphModel.relationships
    .filter(r => r.getType() === RelationshipTypes.Couple && r.involvesPerson(person))
    .map(r => graphModel.getPersonById(r.getOtherPerson(person)));

  let godparentRelations = graphModel.relationships.filter(r => r.getType() === RelationshipTypes.Godparent);
  let godparents = godparentRelations.filter(r => r.getPerson2().getResource().substring(1) === person.getId())
    .map(r => graphModel.getPersonById(r.getOtherPerson(person)));
  let godchildren = godparentRelations.filter(r => r.getPerson1().getResource().substring(1) === person.getId())
    .map(r => graphModel.getPersonById(r.getOtherPerson(person)));

  let slaveRelations = graphModel.relationships.filter(r => r.getType() === RelationshipTypes.EnslavedBy);
  let enslavedBy = slaveRelations.filter(r => r.getPerson2().getResource().substring(1) === person.getId())
    .map(r => graphModel.getPersonById(r.getOtherPerson(person)));
  let slaves = slaveRelations.filter(r => r.getPerson1().getResource().substring(1) === person.getId())
    .map(r => graphModel.getPersonById(r.getOtherPerson(person)));

  // todo:
  // person.getEvidence()
  // person.getIdentifiers()
  // person.getAnalysis()
  // person.getAttribution()

  return (
    <Sidebar id="info-panel">
      <section className="title">
        <h1 className="name">{person.getFullName()}</h1>
        {person.getMarriedName() && <h2 className="birth-name">
          {strings.formatString(strings.infoPanel.born, person.getBirthName())}
        </h2>}
        {person.getAlsoKnownAs() && <h2 className="alsoKnownAs">
          {strings.formatString(strings.infoPanel.aka, person.getAlsoKnownAs())}
        </h2>}
        {person.getNickname() && <h2 className="nickname">
          {strings.formatString(strings.infoPanel.nickname, person.getNickname())}
        </h2>}
      </section>

      {images.length > 0 && <Gallery>
        {images.map(image => {
          let credit = image.getCitations()[0].getValue();
          return <div key={image.id}>
            <img src={image.getAbout()}
                 alt={strings.formatString(strings.infoPanel.personImageAlt, person.getFullName()) as string
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
              let aDate = a.getDate().toDateObject();
              let bDate = b.getDate().toDateObject();
              if (aDate && bDate) {
                return aDate.getMilliseconds() - bDate.getMilliseconds();
              }
            }

            return 0;
          }).map(f => <li key={f.toString()}
                          style={{listStyleType: `"${f.getEmoji()} "`}}>{f.toString()}</li>)}
        </ul>
      </article>

      {parents.length > 0 && <article>
        <h1>👪 {strings.infoPanel.parents}</h1>
        <ul>
          {parents.map(p => <li>{p.getFullName()}</li>)}
        </ul>
      </article>}

      {children.length > 0 && <article>
        <h1>🍼 {strings.infoPanel.children}</h1>
        <ul>
          {children.map(p => <li>{p.getFullName()}</li>)}
        </ul>
      </article>}

      {partner.length > 0 && <article>
        <h1>❤️ {strings.infoPanel.partner}</h1>
        <ul>
          {partner.map(p => <li>{p.getFullName()}</li>)}
        </ul>
      </article>}

      {godparents.length > 0 && <article>
        <h1>⛅ {strings.infoPanel.godparents}</h1>
        <ul>
          {godparents.map(p => <li>{p.getFullName()}</li>)}
        </ul>
      </article>}

      {godchildren.length > 0 && <article>
        <h1>⛅ {strings.infoPanel.godchildren}</h1>
        <ul>
          {godchildren.map(p => <li>{p.getFullName()}</li>)}
        </ul>
      </article>}

      {enslavedBy.length > 0 && <article>
        <h1>⛓️ {strings.infoPanel.enslavedBy}</h1>
        <ul>
          {enslavedBy.map(p => <li>{p.getFullName()}</li>)}
        </ul>
      </article>}

      {slaves.length > 0 && <article>
        <h1>⛓️ {strings.infoPanel.slaves}</h1>
        <ul>
          {slaves.map(p => <li>{p.getFullName()}</li>)}
        </ul>
      </article>}

      {person.getNotes().filter(filterLang).map((note, i) => {
        return <Note note={note} key={i}/>
      })}

      {person.getSources().map(source => source.getDescription()).map(ref => {
        return <article key={ref}>
          <h1><span className="emoji">📚</span> {strings.infoPanel.source}</h1>
          <p>{graphModel.getSourceDescriptionById(ref.replace('#', '')) ?
            graphModel.getSourceDescriptionById(ref.replace('#', '')).getCitations()[0].getValue()
            : strings.formatString(strings.infoPanel.noSourceDescriptionError, <code>{ref}</code>)}</p>
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
  let creator = graphModel.getAgentById(creatorRef).getNames().filter(filterLang)[0].getValue();
  let modified = props.attribution.getModified().toString();
  let contributorRef = props.attribution.getContributor();
  let contributor = graphModel.getAgentById(contributorRef).getNames().filter(filterLang)[0].getValue();
  let message = props.attribution.getChangeMessage();

  return <cite>{strings.formatString(strings.infoPanel.attribution, created, creator, modified, contributor)} {message}</cite>
}

function getImages(person: Person) {
  let mediaRefs = person.getMedia().map(media => media.getDescription());
  return mediaRefs.map(ref => {
    let sourceDescription = graphModel.getSourceDescriptionById(ref.replace('#', ''));
    if (!sourceDescription) throw Error(`Could not find a source description with id ${ref}`);
    return sourceDescription;
  }).filter(sourceDescription => {
    let mediaType = sourceDescription.getMediaType();
    if (!mediaType) return false;
    return mediaType.split('/')[0] === 'image'
  });
}


export default InfoPanel;
