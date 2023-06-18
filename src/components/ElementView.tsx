import {useLiveQuery} from "dexie-react-hooks";
import {db, RootType} from "../backend/db";

export function ElementView<T>(props: { type: RootType, ElementOverview, ElementView }) {
  const element = useLiveQuery(() => {
    let url = new URL(window.location.href);
    let id = url.hash.substring(1);
    if (id.length === 0) return null;
    return db.elementWithId(id, props.type);
  });

  return <main>
    {element ? <props.ElementView data={element}/> : <props.ElementOverview/>}
  </main>
}
