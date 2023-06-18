import {useLiveQuery} from "dexie-react-hooks";
import {db} from "../backend/db";
import {Agent} from "./GedcomXComponents";
import {Agent as AgentClass} from "../backend/gedcomx-extensions";
import {strings} from "../main";
import {ElementView} from "./ElementView";

export function Agents() {
  return <ElementView type={"agent"} ElementOverview={AgentOverview} ElementView={Agent}/>
}

function AgentOverview() {
  const agents = useLiveQuery(() => {
    return db.agents.toArray().then(agents => agents.map(a => new AgentClass(a)));
  });

  const hasAgents = agents && agents.length > 0;

  return <article>
    <h1><span className={"emoji"}>👤</span> {strings.gedcomX.agent.agents}</h1>
    {hasAgents && <ul className={"clickable"}>
      {agents?.map(agent =>
        <li key={agent.id}><a href={`#${agent.id}`}>{`👤 ${agent.name ?? strings.gedcomX.agent.agent}`}</a></li>)}
    </ul>}
  </article>
}
