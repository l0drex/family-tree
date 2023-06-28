import {strings} from "../main";
import {Title} from "../App";

export default function NoData() {
  return <main>
    <>
      <Title emoji="⚠️">{strings.errors.title}</Title>
      <p>{strings.errors.noData}</p>
    </>
  </main>
}
