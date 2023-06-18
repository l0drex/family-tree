import {SourceDescription as SourceDescriptionClass} from "../backend/gedcomx-extensions";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../backend/db";
import {strings} from "../main";
import {SourceDescription} from "./GedcomXComponents";
import {ElementView} from "./ElementView";

export function SourceDescriptions() {
  return <ElementView
    type="sourceDescription"
    ElementOverview={DescriptionOverview}
    ElementView={SourceDescription}/>
}

function DescriptionOverview() {
  const descriptions = useLiveQuery(() => {
    return db.sourceDescriptions.toArray().then(sds => sds.map(s => new SourceDescriptionClass(s)));
  }, []);

  const hasSources = descriptions && descriptions.length > 0;

  return <article>
    <h1><span className={"emoji"}>📚</span> {strings.gedcomX.sourceDescription.sourceDescriptions}</h1>
    {hasSources && <ul className={"clickable"}>
      {descriptions?.map(sd =>
        <li key={sd.id}><a href={`#${sd.getId()}`}>{`${sd.emoji} ${sd.title}`}</a></li>
      )}
    </ul>}
    {!hasSources && <p>{strings.gedcomX.sourceDescription.noSourceDescriptions}</p>}
  </article>
}
