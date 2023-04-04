import './InfoPanel.css';
import {Person} from "gedcomx-js";
import {baseUri, PersonFactTypes} from "../backend/gedcomx-enums";
import {translationToString} from "../main";
import {graphModel} from "../backend/ModelGraph";
import {useState} from "react";

interface Props {
  onRefocus: (newFocus: Person) => void,
  person: Person
}

function InfoPanel(props: Props) {
  const [imageIndex, scroll] = useState(0);

  let person = props.person;
  let images = getImages(person);

  let src = images[imageIndex];
  let credit = src ? src.getCitations()[0].getValue() : "";

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

  person.getEvidence()
  person.getIdentifiers()
  person.getAnalysis()
  person.getAttribution()

  return (
    <aside id="info-panel">
      <section id="names">
        <h1 className="name">{person.getFullName()}</h1>
        {person.getMarriedName() && <h2 className="birth-name">{translationToString({
          en: "born: ",
          de: "geb.: "
        }) + person.getBirthName()}</h2>}
        {person.getAlsoKnownAs() && <h2 className="alsoKnownAs">{translationToString({
          en: "aka ",
          de: "alias "
        }) + person.getAlsoKnownAs()}</h2>}
        {person.getNickname() && <h2 className="nickname">{translationToString({
          en: "Nickname: ",
          de: "Spitzname: "
        }) + person.getNickname()}</h2>}
      </section>

      {src && <article className="gallery">
        <div>
          <img src={src.getAbout()} alt={translationToString({
            en: `Image of ${person.getFullName()}`,
            de: `Bild von ${person.getFullName()}`
          })}/>
          <span id="credits">
              {images.length > 1 && <button className="inline" onClick={() =>
                scroll(i => Math.max(0, i - 2 /* why 2?? */))}>⬅</button>}
            © <a href={src.getAbout()}>{credit}</a>
            {images.length > 1 && <button className="inline" onClick={() =>
              scroll(i => Math.min(images.length - 1, i + 2))}>➡</button>}
            </span>
        </div>
      </article>}

      <article>
        <ul id="factView">
          {person.getFacts().sort((a, b) => {
            // place birth at top, generation right below
            if (a.getType() === PersonFactTypes.Birth) {
              return -1;
            } else if (b.getType() === PersonFactTypes.Birth) {
              return 1;
            } else if (a.getType() === PersonFactTypes.Generation) {
              return -1;
            } else if (b.getType() === PersonFactTypes.Generation) {
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
                          style={{listStyleType: `"${f.getEmoji(person.getGender().getType())} "`}}>{f.toString()}</li>)}
        </ul>
      </article>

      {person.getNotes().map((note, i) => {
        return <article key={i}>
          <h1><span className={"emoji"}>📝</span> {note.getSubject() || translationToString({
            en: 'Note',
            de: 'Anmerkung'
          })}</h1>
          <p>{note.getText()}</p>
        </article>
      })}

      {person.getSources().map(source => source.getDescription()).map(ref => {
        return <article key={ref}>
          <h1><span className="emoji">📚</span> {translationToString({
            en: "Source",
            de: "Quelle"
          })}</h1>
          <p>{graphModel.getSourceDescriptionById(ref.replace('#', '')) ?
            graphModel.getSourceDescriptionById(ref.replace('#', '')).getCitations()[0].getValue()
          : translationToString({
              en: <>Source description <code>{ref}</code> could not be found</>,
              de: <>Source description <code>{ref}</code> konnte nicht gefunden werden</>
            })}</p>
        </article>
      })}

      {person.getConfidence() && <div id="confidence">
        <span title={translationToString({
          en: "How much can the data be trusted",
          de: "Wie sehr kann den Daten vertraut werden"
        })}>{translationToString({
          en: "Confidence: ",
          de: "Zuversicht: "
        })}</span>
        <meter value={confidence} max={3} low={2} high={2} optimum={3}>{person.getConfidence()}</meter>
      </div>}
    </aside>
  );
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
