import {strings} from "../main";

export default function NoData() {
  return <main>
    <article>
      <h1><span className="emoji">⚠️</span> {strings.errors.title}</h1>
      <p>{strings.formatString(strings.errors.no_data, <a href="/family-tree">{strings.linkContent}</a>)}</p>
    </article>
  </main>
}
