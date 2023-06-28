import {strings} from "../main";

export default function NoData() {
  return <main>
    <article>
      <h1><span className="emoji">⚠️</span> {strings.errors.title}</h1>
      <p>{strings.errors.noData}</p>
    </article>
  </main>
}
