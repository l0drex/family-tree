import {useLiveQuery} from "dexie-react-hooks";
import {db, RootType} from "../backend/db";
import {useParams} from "react-router-dom";

export function ElementView<T>(props: { type: RootType, ElementOverview, ElementView }) {
  const {id} = useParams();
  const element = useLiveQuery(() => {
    if (!id) return undefined;
    return db.elementWithId(id, props.type);
  });

  return <main>
    {element ? <props.ElementView data={element}/> : <props.ElementOverview/>}
  </main>
}
