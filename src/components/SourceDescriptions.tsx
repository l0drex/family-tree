import Header from "./Header";
import {SourceDescription as SourceDescriptionClass} from "../backend/gedcomx-extensions";
import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../backend/db";
import {strings} from "../main";
import {SourceDescription} from "./GedcomXComponents";

export function SourceDescriptions() {
  const description = useLiveQuery(() => {
    let url = new URL(window.location.href);
    let id = url.hash.substring(1);
    if (id.length === 0) return null;
    return db.sourceDescriptionWithId(id);
  }, [window.location.href]);

  return <>
    <Header/>
    <main>
      {description ? <SourceDescription description={description}/> : <DescriptionOverview/>}
    </main>
  </>
}

function DescriptionOverview() {
  const descriptions = useLiveQuery(() => {
    return db.sourceDescriptions.toArray().then(sds => sds.map(s => new SourceDescriptionClass(s)));
  }, [])

  return <article>
    <h1><span className={"emoji"}>📚</span> {strings.infoPanel.source}</h1>
    <ul className={"clickable"}>
      {descriptions?.map(sd =>
        <li key={sd.id}><a href={`#${sd.getId()}`}>{`${sd.emoji} ${sd.title}`}</a></li>
      )}
    </ul>
  </article>
}
